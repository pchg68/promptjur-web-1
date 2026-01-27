import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import { atualizarTag, atribuirTagPrompt as atribuirTagPromptComValidacao } from "./db-tags-update";
import { AREAS_JURIDICAS, PALAVRAS_CHAVE_AREAS, TEMPLATES_BASE, REFERENCIAS_LEGAIS } from "@shared/juridico";
import { gerarAvisosFontes } from "@shared/verificacao-fontes";
import { checkUsageLimit, getUpgradeMessage } from "@shared/usage-limits";
import { gerarDocumentoWord } from "./_core/docxGenerator";
import { validarLegislacao } from "./_core/validacaoLegislacao";
import { searchPrompts, countSearchResults } from "./db-search";
import { notificationsRouter, notificationPreferencesRouter } from "./routers-notifications";
import { notifyPromptGenerated, notifyPromptOptimized, notifyAnalysisComplete } from "./notification-triggers";
import { extractCitacoesLegais, contarCitacoesPorTipo, formatarCitacoes, extractLegalSources, getSourcesStatistics } from "./extractCitacoesLegais";
import { getCacheStatistics } from "./db-legislacao-cache";
import { criarPerfil, listarPerfis, deletarPerfil, buscarPerfilPorId } from "./db-perfis";
import { sugerirArea } from "./sugestao-area";
import { modelosPersonalizadosRouter } from "./routers-modelos-personalizados";

export const appRouter = router({
  system: systemRouter,
  notifications: notificationsRouter,
  notificationPreferences: notificationPreferencesRouter,
  modelosPersonalizados: modelosPersonalizadosRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  prompts: router({
    // Busca avançada de prompts
    search: protectedProcedure
      .input(
        z.object({
          texto: z.string().optional(),
          areasJuridicas: z.array(z.string()).optional(),
          dataInicio: z.date().optional(),
          dataFim: z.date().optional(),
          tagIds: z.array(z.number()).optional(),
          qualidade: z.array(z.enum(["excelente", "bom", "ruim"])).optional(),
          ordenacao: z.enum(["data_desc", "data_asc", "qualidade", "relevancia"]).optional(),
          limite: z.number().min(1).max(100).optional(),
          offset: z.number().min(0).optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        const results = await searchPrompts({
          userId: ctx.user.id,
          ...input,
        });

        const total = await countSearchResults({
          userId: ctx.user.id,
          texto: input.texto,
          areasJuridicas: input.areasJuridicas,
          dataInicio: input.dataInicio,
          dataFim: input.dataFim,
          tagIds: input.tagIds,
          qualidade: input.qualidade,
        });

        return {
          results,
          total,
          limite: input.limite || 20,
          offset: input.offset || 0,
        };
      }),

    // Analisar prompt jurídico
    analisar: protectedProcedure
      .input(z.object({
        prompt: z.string().min(10, "Prompt muito curto"),
      }))
      .mutation(async ({ input, ctx }) => {
        const startTime = Date.now();
        
        // TEMPORARIAMENTE DESATIVADO: Verificar limite de uso (para fase de testes)
        // const usageCheck = checkUsageLimit(ctx.user.subscriptionPlan, ctx.user.usageCount);
        // if (usageCheck.exceeded) {
        //   throw new Error(getUpgradeMessage(ctx.user.subscriptionPlan));
        // }
        
        try {
          // OTIMIZAÇÃO GEMINI: Extrair citações legais com regex (rápido e barato)
          const citacoesExtraidas = extractCitacoesLegais(input.prompt);
          const contagemCitacoes = contarCitacoesPorTipo(citacoesExtraidas);
          const citacoesFormatadas = formatarCitacoes(citacoesExtraidas);
          
          // EXTRAÇÃO UNIFICADA: Fontes legais (súmulas, jurisprudência, datas, valores)
          const fontesLegais = extractLegalSources(input.prompt);
          const estatisticasFontes = getSourcesStatistics(input.prompt);
          
          // Identificar área jurídica usando LLM
          const analiseResponse = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `Você é um especialista em direito brasileiro. Analise o prompt jurídico fornecido e identifique:
1. A área jurídica principal (Civil, Penal, Trabalhista, Tributário, Administrativo, Constitucional, Empresarial, Consumidor, Família, Previdenciário, Ambiental, Internacional)
2. Palavras-chave relevantes (máximo 10)
3. Entidades jurídicas mencionadas (leis, artigos, tribunais, etc.)
4. Qualidade do prompt (0-100)
5. Sugestões de melhoria (máximo 5)

Responda APENAS em formato JSON válido, sem texto adicional.`
              },
              {
                role: "user",
                content: `Analise este prompt jurídico:\n\n${input.prompt}`
              }
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "analise_prompt",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    area: { type: "string" },
                    confianca: { type: "integer" },
                    palavrasChave: { type: "array", items: { type: "string" } },
                    entidades: { type: "array", items: { type: "object", properties: { tipo: { type: "string" }, valor: { type: "string" } }, required: ["tipo", "valor"], additionalProperties: false } },
                    qualidade: { type: "integer" },
                    sugestoes: { type: "array", items: { type: "string" } }
                  },
                  required: ["area", "confianca", "palavrasChave", "entidades", "qualidade", "sugestoes"],
                  additionalProperties: false
                }
              }
            }
          });

          const content = analiseResponse.choices[0].message.content;
          const analise = JSON.parse(typeof content === 'string' ? content : "{}");
          
          // Determinar qualidade textual
          let qualidadeTexto: "excelente" | "bom" | "ruim" = "ruim";
          if (analise.qualidade >= 80) qualidadeTexto = "excelente";
          else if (analise.qualidade >= 50) qualidadeTexto = "bom";

          // Salvar prompt no banco
          const promptId = await db.createPrompt({
            userId: ctx.user.id,
            tipo: "analise",
            areaJuridica: analise.area?.substring(0, 100) || null,
            promptOriginal: input.prompt,
            qualidade: qualidadeTexto,
            metadata: {
              palavrasChave: analise.palavrasChave,
              entidades: analise.entidades
            }
          });

          // Salvar análise detalhada
          await db.createAnalise({
            promptId,
            userId: ctx.user.id,
            areaIdentificada: analise.area,
            confiancaArea: analise.confianca,
            palavrasChave: analise.palavrasChave,
            entidades: analise.entidades,
            pontuacaoQualidade: analise.qualidade,
            sugestoes: analise.sugestoes
          });

          // Registrar no histórico
          await db.createHistorico({
            userId: ctx.user.id,
            acao: "analise",
            promptId,
            duracaoMs: Date.now() - startTime,
            sucesso: true
          });
          
          // Incrementar contador de uso
          await db.incrementUserUsage(ctx.user.id);

          // Verificar fontes jurídicas no prompt
          const avisosFontes = gerarAvisosFontes(input.prompt);

          return {
            promptId,
            area: analise.area,
            confianca: analise.confianca,
            palavrasChave: analise.palavrasChave,
            entidades: analise.entidades,
            qualidade: qualidadeTexto,
            pontuacaoQualidade: analise.qualidade,
            sugestoes: analise.sugestoes,
            avisosFontes,
            // OTIMIZAÇÃO GEMINI: Citações extraídas com regex
            citacoesLegais: {
              total: citacoesExtraidas.length,
              porTipo: contagemCitacoes,
              lista: citacoesFormatadas
            },
            // EXTRAÇÃO UNIFICADA: Fontes legais (súmulas, jurisprudência, datas, valores)
            fontesLegais: {
              total: estatisticasFontes.total,
              porTipo: estatisticasFontes.byType,
              fontes: fontesLegais
            }
          };
        } catch (error) {
          await db.createHistorico({
            userId: ctx.user.id,
            acao: "analise",
            duracaoMs: Date.now() - startTime,
            sucesso: false,
            mensagemErro: error instanceof Error ? error.message : "Erro desconhecido"
          });
          throw error;
        }
      }),

    // Gerar prompt jurídico profissional PRONTO PARA USO
    gerar: protectedProcedure
      .input(z.object({
        tipoDocumento: z.enum(["peticao", "parecer", "contrato", "recurso", "defesa", "memorando", "outro"] as const),
        contextoJuridico: z.string().min(20, "Contexto muito curto - descreva a situação jurídica"),
        objetivoEspecifico: z.string().min(10, "Objetivo muito curto"),
        area: z.enum(["Civil", "Penal", "Trabalhista", "Tributário", "Administrativo", "Constitucional", "Empresarial", "Consumidor", "Família", "Previdenciário", "Ambiental", "Internacional", "Processo Civil", "Direito Médico", "Direito Digital", "Direito Internacional"] as const), // Campo obrigatório
        partesEnvolvidas: z.string().optional(),
        legislacaoRelevante: z.string().optional(),
        detalhesAdicionais: z.string().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const startTime = Date.now();
        
        // TEMPORARIAMENTE DESATIVADO: Verificar limite de uso (para fase de testes)
        // const usageCheck = checkUsageLimit(ctx.user.subscriptionPlan, ctx.user.usageCount);
        // if (usageCheck.exceeded) {
        //   throw new Error(getUpgradeMessage(ctx.user.subscriptionPlan));
        // }
        
        try {
          // ETAPA 1: Detectar área jurídica automaticamente se não fornecida
          let areaDetectada = input.area;
          
          if (!areaDetectada) {
            const deteccaoResponse = await invokeLLM({
              messages: [
                {
                  role: "system",
                  content: `Você é um especialista em direito brasileiro. Analise o contexto fornecido e identifique APENAS a área jurídica principal. Responda com UMA das seguintes opções: ${AREAS_JURIDICAS.join(", ")}`
                },
                {
                  role: "user",
                  content: `Tipo de documento: ${input.tipoDocumento}\nContexto: ${input.contextoJuridico}\nObjetivo: ${input.objetivoEspecifico}`
                }
              ]
            });
            
            const areaResposta = deteccaoResponse.choices[0].message.content?.toString().trim() || "Civil";
            areaDetectada = AREAS_JURIDICAS.find(a => areaResposta.includes(a)) || "Civil";
          }
          
          // ETAPA 2: Gerar prompt profissional usando engenharia de prompt avançada
          const referencias = REFERENCIAS_LEGAIS[areaDetectada] || [];
          
          const systemPrompt = `Você é um MESTRE em Engenharia de Prompts Jurídicos, com doutorado em Direito ${areaDetectada} e especialização em IA aplicada ao Direito.

Sua tarefa É CRIAR UM PROMPT PROFISSIONAL PRONTO PARA USO que, quando usado em ferramentas de IA (ChatGPT, Claude, Gemini), gerará um ${input.tipoDocumento} jurídico de excelência.

TÉCNICAS DE ENGENHARIA DE PROMPT A USAR:
1. **Persona Especializada**: Definir claramente o papel da IA (advogado especialista, juiz, etc.)
2. **Contexto Rico**: Fornecer todos os detalhes relevantes do caso
3. **Instruções Estruturadas**: Dividir em seções claras (fatos, direito, pedidos)
4. **Exemplos e Formato**: Especificar estrutura esperada do documento
5. **Restrições e Requisitos**: Legislação obrigatória, tom formal, etc.
6. **Chain-of-Thought**: Pedir raciocínio jurídico passo a passo
7. **Verificação de Qualidade**: Incluir critérios de revisão

REFERÊNCIAS LEGAIS DISPONÍVEIS: ${referencias.join(", ")}

O PROMPT FINAL deve ser:
- **Autocontido**: Não requer explicações adicionais
- **Profissional**: Linguagem técnica apropriada
- **Acionável**: Gera resultado imediato quando usado
- **Preciso**: Cita legislação e jurisprudência quando aplicável
- **Formatado**: Pronto para copiar e colar

IMPORTANTE: Retorne APENAS o prompt final, sem explicações ou comentários adicionais.`;

          const userPrompt = `TIPO DE DOCUMENTO: ${input.tipoDocumento.toUpperCase()}
ÁREA JURÍDICA: ${areaDetectada}

CONTEXTO JURÍDICO:
${input.contextoJuridico}

OBJETIVO ESPECÍFICO:
${input.objetivoEspecifico}

${input.partesEnvolvidas ? `PARTES ENVOLVIDAS:\n${input.partesEnvolvidas}\n\n` : ""}${input.legislacaoRelevante ? `LEGISLAÇÃO RELEVANTE:\n${input.legislacaoRelevante}\n\n` : ""}${input.detalhesAdicionais ? `DETALHES ADICIONAIS:\n${input.detalhesAdicionais}\n\n` : ""}Gere o prompt profissional PRONTO PARA USO:`;

          const geracaoResponse = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ]
          });

          const content = geracaoResponse.choices[0].message.content;
          const promptProfissional = typeof content === 'string' ? content : "";

          // Validar legislação citada
          const validacaoRaw = await validarLegislacao(promptProfissional);
          // Converter para objeto simples serializável
          const validacao = {
            citacoes: validacaoRaw.citacoes.map(c => ({
              texto: String(c.texto),
              tipo: c.tipo,
              numero: c.numero ? String(c.numero) : undefined,
              codigo: c.codigo ? String(c.codigo) : undefined,
              confiabilidade: c.confiabilidade,
              motivo: String(c.motivo),
              mensagem: String(c.mensagem),
              linkOficial: c.linkOficial ? String(c.linkOficial) : undefined,
              link: c.link ? String(c.link) : undefined
            })),
            confiabilidadeGeral: validacaoRaw.confiabilidadeGeral,
            totalCitacoes: Number(validacaoRaw.totalCitacoes),
            citacoesValidadas: Number(validacaoRaw.citacoesValidadas)
          };

          // Salvar no banco
          const promptId = await db.createPrompt({
            userId: ctx.user.id,
            tipo: "geracao",
            areaJuridica: areaDetectada?.substring(0, 100) || null,
            promptOriginal: input.contextoJuridico,
            promptOtimizado: promptProfissional,
            qualidade: "excelente",
            metadata: {
              tipoDocumento: input.tipoDocumento,
              objetivoEspecifico: input.objetivoEspecifico,
              areaDetectadaAutomaticamente: !input.area
            }
          });

          // Registrar no histórico
          await db.createHistorico({
            userId: ctx.user.id,
            acao: "geracao",
            promptId,
            duracaoMs: Date.now() - startTime,
            sucesso: true
          });
          
          // Incrementar contador de uso
          await db.incrementUserUsage(ctx.user.id);

          // Enviar notificação de sucesso
          await notifyPromptGenerated(ctx.user.id, input.tipoDocumento).catch(err => {
            console.error('Erro ao enviar notificação:', err);
          });

          // Verificar fontes jurídicas no prompt gerado
          const avisosFontes = gerarAvisosFontes(promptProfissional);

          return {
            promptId: Number(promptId),
            promptProfissional,
            area: areaDetectada,
            areaDetectadaAutomaticamente: !input.area,
            tipoDocumento: input.tipoDocumento,
            referencias,
            avisosFontes,
            validacaoLegislacao: validacao
          };
        } catch (error) {
          await db.createHistorico({
            userId: ctx.user.id,
            acao: "geracao",
            duracaoMs: Date.now() - startTime,
            sucesso: false,
            mensagemErro: error instanceof Error ? error.message : "Erro desconhecido"
          });
          throw error;
        }
      }),

    // Otimizar prompt existente
    otimizar: protectedProcedure
      .input(z.object({
        prompt: z.string().min(10, "Prompt muito curto")
      }))
      .mutation(async ({ input, ctx }) => {
        const startTime = Date.now();
        
        // TEMPORARIAMENTE DESATIVADO: Verificar limite de uso (para fase de testes)
        // const usageCheck = checkUsageLimit(ctx.user.subscriptionPlan, ctx.user.usageCount);
        // if (usageCheck.exceeded) {
        //   throw new Error(getUpgradeMessage(ctx.user.subscriptionPlan));
        // }
        
        try {
          const otimizacaoResponse = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `Você é um especialista em engenharia de prompts jurídicos.
Analise o prompt fornecido e crie uma versão otimizada que seja:
- Mais clara e específica
- Tecnicamente precisa
- Bem estruturada
- Adequada para uso com IA jurídica
- Inclua contexto relevante e referências legais quando apropriado

Responda em formato JSON com:
{
  "promptOtimizado": "versão melhorada do prompt",
  "melhorias": ["lista de melhorias aplicadas"],
  "areaIdentificada": "área jurídica identificada"
}`
              },
              {
                role: "user",
                content: `Otimize este prompt jurídico:\n\n${input.prompt}`
              }
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "otimizacao_prompt",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    promptOtimizado: { type: "string" },
                    melhorias: { type: "array", items: { type: "string" } },
                    areaIdentificada: { type: "string" }
                  },
                  required: ["promptOtimizado", "melhorias", "areaIdentificada"],
                  additionalProperties: false
                }
              }
            }
          });

          const content3 = otimizacaoResponse.choices[0].message.content;
          const resultado = JSON.parse(typeof content3 === 'string' ? content3 : "{}");

          // Salvar no banco
          const promptId = await db.createPrompt({
            userId: ctx.user.id,
            tipo: "otimizacao",
            areaJuridica: resultado.areaIdentificada?.substring(0, 100) || null,
            promptOriginal: input.prompt,
            promptOtimizado: resultado.promptOtimizado,
            qualidade: "excelente",
            metadata: {
              melhorias: resultado.melhorias
            }
          });

          // Salvar versão automaticamente (prompt original)
          await db.salvarVersaoPrompt({
            promptId,
            tipo: "original",
            versao: 1,
            conteudo: input.prompt
          });

          // Registrar no histórico
          await db.createHistorico({
            userId: ctx.user.id,
            acao: "otimizacao",
            promptId,
            duracaoMs: Date.now() - startTime,
            sucesso: true
          });
          
          // Incrementar contador de uso
          await db.incrementUserUsage(ctx.user.id);

          // Enviar notificação de sucesso
          await notifyPromptOptimized(ctx.user.id).catch(err => {
            console.error('Erro ao enviar notificação:', err);
          });

          // Verificar fontes jurídicas no prompt otimizado
          const avisosFontes = gerarAvisosFontes(resultado.promptOtimizado);

          // Validar legislação citada
          const validacaoRaw = await validarLegislacao(resultado.promptOtimizado);
          // Converter para objeto simples serializável
          const validacao = {
            citacoes: validacaoRaw.citacoes.map(c => ({
              texto: String(c.texto),
              tipo: c.tipo,
              numero: c.numero ? String(c.numero) : undefined,
              codigo: c.codigo ? String(c.codigo) : undefined,
              confiabilidade: c.confiabilidade,
              motivo: String(c.motivo),
              mensagem: String(c.mensagem),
              linkOficial: c.linkOficial ? String(c.linkOficial) : undefined,
              link: c.link ? String(c.link) : undefined
            })),
            confiabilidadeGeral: validacaoRaw.confiabilidadeGeral,
            totalCitacoes: Number(validacaoRaw.totalCitacoes),
            citacoesValidadas: Number(validacaoRaw.citacoesValidadas)
          };

          return {
            promptId,
            promptOriginal: input.prompt,
            promptOtimizado: resultado.promptOtimizado,
            melhorias: resultado.melhorias,
            area: resultado.areaIdentificada,
            avisosFontes,
            validacaoLegislacao: validacao
          };
        } catch (error) {
          await db.createHistorico({
            userId: ctx.user.id,
            acao: "otimizacao",
            duracaoMs: Date.now() - startTime,
            sucesso: false,
            mensagemErro: error instanceof Error ? error.message : "Erro desconhecido"
          });
          throw error;
        }
      }),

    // Listar prompts do usuário
    listar: protectedProcedure
      .input(z.object({
        limit: z.number().optional().default(50)
      }))
      .query(async ({ input, ctx }) => {
        return db.getUserPrompts(ctx.user.id, input.limit);
      }),

    // Carregar um prompt específico para reutilização
    loadPrompt: protectedProcedure
      .input(z.object({
        id: z.number()
      }))
      .query(async ({ input, ctx }) => {
        const prompt = await db.getPromptById(input.id, ctx.user.id);
        if (!prompt) {
          throw new Error("Prompt não encontrado ou sem permissão");
        }
        return prompt;
      }),

    // Obter estatísticas do usuário
    stats: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserStats(ctx.user.id);
    }),

    // Toggle favorito
    toggleFavorito: protectedProcedure
      .input(z.object({
        promptId: z.number(),
        isFavorito: z.boolean()
      }))
      .mutation(async ({ input, ctx }) => {
        await db.toggleFavorito(input.promptId, input.isFavorito);
        return { success: true };
      }),

    // Favoritar/Desfavoritar (novo endpoint simplificado)
    favoritar: protectedProcedure
      .input(z.object({
        id: z.number(),
        favorito: z.boolean()
      }))
      .mutation(async ({ input, ctx }) => {
        await db.toggleFavorito(input.id, input.favorito);
        return { success: true };
      }),

    // Excluir prompt
    excluir: protectedProcedure
      .input(z.object({
        id: z.number()
      }))
      .mutation(async ({ input, ctx }) => {
        const { excluirPrompt } = await import("./db");
        await excluirPrompt(input.id, ctx.user.id);
        return { success: true };
      }),
    
    // Listar apenas favoritos
    listarFavoritos: protectedProcedure.query(async ({ ctx }) => {
      const prompts = await db.getUserPrompts(ctx.user.id, 100);
      return prompts.filter(p => p.isFavorito);
    }),

    // Exportar prompt como DOCX
    exportarDocx: protectedProcedure
      .input(z.object({
        titulo: z.string(),
        conteudo: z.string(),
        area: z.string().optional(),
        tipo: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        const buffer = await gerarDocumentoWord({
          titulo: input.titulo,
          conteudo: input.conteudo,
          area: input.area,
          tipo: input.tipo,
          data: new Date()
        });
        
        // Converter buffer para base64 para enviar ao cliente
        return {
          buffer: buffer.toString('base64'),
          filename: `${input.titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`
        };
      })
  }),

  historico: router({
    // Listar histórico do usuário
    listar: protectedProcedure
      .input(z.object({
        limit: z.number().optional().default(50)
      }))
      .query(async ({ input, ctx }) => {
        return db.getUserHistorico(ctx.user.id, input.limit);
      }),

    // Listar prompts com filtros
    prompts: protectedProcedure
      .input(z.object({
        tipo: z.enum(["analise", "geracao", "otimizacao"]).optional(),
        area: z.string().optional(),
        favoritos: z.boolean().optional(),
        limit: z.number().optional().default(50)
      }))
      .query(async ({ input, ctx }) => {
        const { limit, ...filtros } = input;
        return db.getUserPrompts(ctx.user.id, limit);
      }),
  }),

  templates: router({
    // Listar templates do usuário
    meus: protectedProcedure.query(async ({ ctx }) => {
      return db.getTemplatesUsuario(ctx.user.id);
    }),

    // Listar templates do sistema
    sistema: publicProcedure.query(async () => {
      return db.getTemplatesSistema();
    }),

    // Salvar template
    salvar: protectedProcedure
      .input(z.object({
        areaJuridica: z.string(),
        nome: z.string().min(3),
        descricao: z.string().optional(),
        template: z.string().min(10),
        isPublico: z.boolean().optional().default(false)
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.salvarTemplate({
          userId: ctx.user.id,
          ...input,
          isAtivo: true
        });
        return { success: true, templateId: result };
      }),

    // Atualizar template
    atualizar: protectedProcedure
      .input(z.object({
        id: z.number(),
        areaJuridica: z.string().optional(),
        nome: z.string().min(3).optional(),
        descricao: z.string().optional(),
        template: z.string().min(10).optional(),
        isPublico: z.boolean().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const success = await db.atualizarTemplate(id, ctx.user.id, data);
        if (!success) {
          throw new Error("Template não encontrado ou sem permissão");
        }
        return { success: true };
      }),

    // Alternar visibilidade pública
    togglePublico: protectedProcedure
      .input(z.object({ templateId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.toggleTemplatePublico(input.templateId, ctx.user.id);
        return { success: true };
      }),

    // Deletar template
    deletar: protectedProcedure
      .input(z.object({
        templateId: z.number()
      }))
      .mutation(async ({ input, ctx }) => {
        const success = await db.deletarTemplate(input.templateId, ctx.user.id);
        if (!success) {
          throw new Error("Template não encontrado ou sem permissão");
        }
        return { success: true };
      })
  }),

  tags: router({
    // Listar tags do usuário
    minhas: protectedProcedure.query(async ({ ctx }) => {
      return db.getTagsUsuario(ctx.user.id);
    }),

    // Criar tag
    criar: protectedProcedure
      .input(z.object({
        nome: z.string().min(1).max(50),
        cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default("#3b82f6")
      }))
      .mutation(async ({ input, ctx }) => {
        const tagId = await db.criarTag({
          userId: ctx.user.id,
          ...input
        });
        return { success: true, tagId };
      }),

    // Deletar tag
    deletar: protectedProcedure
      .input(z.object({
        tagId: z.number()
      }))
      .mutation(async ({ input, ctx }) => {
        const success = await db.deletarTag(input.tagId, ctx.user.id);
        if (!success) {
          throw new Error("Tag não encontrada ou sem permissão");
        }
        return { success: true };
      }),

    // Atualizar tag (nome e/ou cor)
    atualizar: protectedProcedure
      .input(z.object({
        tagId: z.number(),
        nome: z.string().min(1).max(50).optional(),
        cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const success = await atualizarTag(input.tagId, ctx.user.id, {
          nome: input.nome,
          cor: input.cor,
        });
        if (!success) {
          throw new Error("Tag não encontrada ou sem permissão");
        }
        return { success: true };
      }),

    // Adicionar tag a prompt
    atribuirPrompt: protectedProcedure
      .input(z.object({
        promptId: z.number(),
        tagId: z.number()
      }))
      .mutation(async ({ input, ctx }) => {
        await atribuirTagPromptComValidacao(input.promptId, input.tagId, ctx.user.id);
        return { success: true };
      }),

    // Remover tag de prompt
    removerPrompt: protectedProcedure
      .input(z.object({
        promptId: z.number(),
        tagId: z.number()
      }))
      .mutation(async ({ input }) => {
        await db.removerTagPrompt(input.promptId, input.tagId);
        return { success: true };
      }),

    // Obter tags de um prompt
    getPrompt: protectedProcedure
      .input(z.object({ promptId: z.number() }))
      .query(async ({ input }) => {
        return db.getTagsPrompt(input.promptId);
      }),

    // Atribuir tag a template
    atribuirTemplate: protectedProcedure
      .input(z.object({
        templateId: z.number(),
        tagId: z.number()
      }))
      .mutation(async ({ input }) => {
        await db.atribuirTagTemplate(input.templateId, input.tagId);
        return { success: true };
      }),

    // Remover tag de template
    removerTemplate: protectedProcedure
      .input(z.object({
        templateId: z.number(),
        tagId: z.number()
      }))
      .mutation(async ({ input }) => {
        await db.removerTagTemplate(input.templateId, input.tagId);
        return { success: true };
      }),

    // Obter tags de um template
    getTemplate: protectedProcedure
      .input(z.object({
        templateId: z.number()
      }))
      .query(async ({ input }) => {
        return db.getTagsTemplate(input.templateId);
      })
  }),

  analytics: router({
    // Obter estatísticas de uso
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getAnalytics(ctx.user.id);
    }),
    
    // Obter dados para gráfico de uso por data
    usageByDate: protectedProcedure
      .input(z.object({
        days: z.number().min(1).max(30).default(7)
      }).optional())
      .query(async ({ input, ctx }) => {
        return db.getUsageByDate(ctx.user.id, input?.days || 7);
      })
  }),

  versoes: router({
    // Salvar versão de prompt
    salvar: protectedProcedure
      .input(z.object({
        promptId: z.number(),
        versao: z.number(),
        conteudo: z.string(),
        tipo: z.enum(["original", "otimizado", "manual"]),
        observacoes: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        const versaoId = await db.salvarVersaoPrompt(input);
        return { success: true, versaoId };
      }),

    // Listar versões de um prompt
    listar: protectedProcedure
      .input(z.object({
        promptId: z.number()
      }))
      .query(async ({ input }) => {
        return db.getVersoesPrompt(input.promptId);
      })
  }),

  configuracoes: router({
    // Obter configurações do usuário
    get: protectedProcedure.query(async ({ ctx }) => {
      let config = await db.getUserConfiguracao(ctx.user.id);
      if (!config) {
        // Criar configuração padrão
        await db.upsertConfiguracao({
          userId: ctx.user.id,
          nivelDetalhePreferido: 5,
          incluirReferenciasDefault: true
        });
        config = await db.getUserConfiguracao(ctx.user.id);
      }
      return config;
    }),

    // Atualizar configurações
    update: protectedProcedure
      .input(z.object({
        areaPreferida: z.string().optional(),
        nivelDetalhePreferido: z.number().min(1).max(10).optional(),
        incluirReferenciasDefault: z.boolean().optional(),
        personaDefault: z.string().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        await db.upsertConfiguracao({
          userId: ctx.user.id,
          ...input
        });
        return { success: true };
      })
  }),

  // Router de Modelos Profissionais
  modelos: router({
    // Listar todos os modelos
    listar: publicProcedure
      .input(z.object({
        tipo: z.enum(["peticao", "parecer", "contrato", "recurso", "defesa", "memorando", "outro"]).optional(),
        area: z.string().optional(),
        busca: z.string().optional(),
        apenasGratuitos: z.boolean().optional()
      }).optional())
      .query(async ({ input, ctx }) => {
        const { MODELOS_PROFISSIONAIS, filtrarModelos } = await import("./modelos-profissionais");
        
        if (!input) {
          return MODELOS_PROFISSIONAIS;
        }
        
        return filtrarModelos(
          input.tipo,
          input.area,
          input.busca,
          input.apenasGratuitos
        );
      }),

    // Obter modelo por ID
    obterPorId: publicProcedure
      .input(z.object({
        id: z.string()
      }))
      .query(async ({ input }) => {
        const { MODELOS_PROFISSIONAIS } = await import("./modelos-profissionais");
        const modelo = MODELOS_PROFISSIONAIS.find(m => m.id === input.id);
        
        if (!modelo) {
          throw new Error("Modelo não encontrado");
        }
        
        return modelo;
      }),

    // Verificar acesso a modelo premium
    verificarAcesso: protectedProcedure
      .input(z.object({
        modeloId: z.string()
      }))
      .query(async ({ input, ctx }) => {
        const { MODELOS_PROFISSIONAIS } = await import("./modelos-profissionais");
        const modelo = MODELOS_PROFISSIONAIS.find(m => m.id === input.modeloId);
        
        if (!modelo) {
          return { temAcesso: false, motivo: "Modelo não encontrado" };
        }
        
        // Se não é premium, todos têm acesso
        if (!modelo.isPremium) {
          return { temAcesso: true };
        }
        
        // Verificar plano do usuário (preparação para monetização)
        const plano = ctx.user.subscriptionPlan || "free";
        const temAcesso = plano === "pro" || plano === "enterprise";
        
        return {
          temAcesso,
          motivo: temAcesso ? undefined : "Este modelo é exclusivo para assinantes Premium. Faça upgrade para acessar!"
        };
      }),

    // Registrar uso de modelo
    registrarUso: protectedProcedure
      .input(z.object({
        modeloId: z.string()
      }))
      .mutation(async ({ input, ctx }) => {
        await db.registrarUsoModelo(ctx.user.id, input.modeloId);
        return { sucesso: true };
      }),

    // Listar modelos mais usados pelo usuário
    maisUsados: protectedProcedure
      .input(z.object({
        limit: z.number().default(5)
      }).optional())
      .query(async ({ input, ctx }) => {
        const { MODELOS_PROFISSIONAIS } = await import("./modelos-profissionais");
        const limit = input?.limit || 5;
        
        const usados = await db.getModelosMaisUsados(ctx.user.id, limit);
        
        // Retornar modelos completos com contagem de uso
        const modelosComUso = usados
          .map(u => {
            const modelo = MODELOS_PROFISSIONAIS.find(m => m.id === u.modeloId);
            if (!modelo) return null;
            return {
              ...modelo,
              vezesUsado: Number(u.count)
            };
          })
          .filter(m => m !== null);
        
        return modelosComUso;
      })
  }),

  // Router de legislação (cache e estatísticas)
  legislacao: router({
    // Obter estatísticas do cache
    getCacheStats: protectedProcedure
      .query(async () => {
        const stats = await getCacheStatistics();
        return {
          total: stats.total,
          porTipo: stats.porTipo,
          porConfiabilidade: stats.porConfiabilidade,
          // Placeholder para top citações (futura implementação)
          topCitacoes: [] as Array<{ citacao: string; count: number }>
        };
      })
  }),

  // Router de perfis de uso
  perfis: router({
    // Criar novo perfil
    criar: protectedProcedure
      .input(z.object({
        nome: z.string().min(3, "Nome muito curto"),
        tipoDocumento: z.enum(["peticao", "parecer", "contrato", "recurso", "defesa", "memorando", "outro"]),
        areaJuridica: z.string(),
        modeloId: z.string().optional(),
        descricao: z.string().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const perfil = await criarPerfil({
          userId: ctx.user.id,
          ...input
        });
        return perfil;
      }),

    // Listar perfis do usuário
    listar: protectedProcedure
      .query(async ({ ctx }) => {
        return await listarPerfis(ctx.user.id);
      }),

    // Deletar perfil
    deletar: protectedProcedure
      .input(z.object({
        id: z.number()
      }))
      .mutation(async ({ input, ctx }) => {
        return await deletarPerfil(input.id, ctx.user.id);
      }),

    // Buscar perfil por ID
    buscar: protectedProcedure
      .input(z.object({
        id: z.number()
      }))
      .query(async ({ input, ctx }) => {
        return await buscarPerfilPorId(input.id, ctx.user.id);
      })
  }),

  // Router de sugestão inteligente
  sugestao: router({
    // Sugerir área jurídica baseada no contexto
    area: protectedProcedure
      .input(z.object({
        contexto: z.string().min(10, "Contexto muito curto"),
        objetivo: z.string().optional()
      }))
      .query(async ({ input }) => {
        return sugerirArea(input.contexto, input.objetivo);
      })
  }),

  // Router de documentos com estratégias avançadas de IA
  documentos: router({
    // Gerar documento jurídico completo usando estratégias de IA
    gerar: protectedProcedure
      .input(z.object({
        tipoDocumento: z.string().min(1, "Tipo de documento é obrigatório"),
        areaJuridica: z.string().min(1, "Área jurídica é obrigatória"),
        contexto: z.string().min(20, "Contexto muito curto (mínimo 20 caracteres)"),
        objetivo: z.string().optional(),
        partesEnvolvidas: z.string().optional(),
        legislacao: z.string().optional(),
        detalhes: z.string().optional(),
        estrategia: z.enum(["direct", "chain_of_thought", "knowledge_retrieval"]).default("direct")
      }))
      .mutation(async ({ input, ctx }) => {
        const startTime = Date.now();
        
        try {
          // Importar função de geração
          const { gerarDocumentoComEstrategia } = await import("./estrategias-ia");
          
          // Gerar documento usando estratégia selecionada
          const resultado = await gerarDocumentoComEstrategia({
            tipoDocumento: input.tipoDocumento,
            areaJuridica: input.areaJuridica,
            contexto: input.contexto,
            objetivo: input.objetivo,
            partesEnvolvidas: input.partesEnvolvidas,
            legislacao: input.legislacao,
            detalhes: input.detalhes,
            estrategia: input.estrategia
          });
          
          // Validar legislação citada no documento
          const validacaoLegislacao = await validarLegislacao(resultado.documento);
          
          // TODO: Salvar no histórico quando implementarmos tabela de documentos
          
          return {
            documento: resultado.documento,
            estrategiaUsada: resultado.estrategiaUsada,
            metadados: resultado.metadados,
            validacaoLegislacao: {
              confiabilidadeGeral: validacaoLegislacao.confiabilidadeGeral,
              totalCitacoes: validacaoLegislacao.totalCitacoes,
              citacoesValidadas: validacaoLegislacao.citacoesValidadas,
              citacoes: validacaoLegislacao.citacoes
            },
            tempoGeracao: Date.now() - startTime
          };
        } catch (error) {
          console.error("[Documentos] Erro ao gerar documento:", error);
          throw new Error(`Erro ao gerar documento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      })
  }),

  // Router de Knowledge Retrieval - APIs de precedentes, prazos e feriados
  knowledgeRetrieval: router({
    // Buscar precedentes processuais similares
    buscarPrecedentes: protectedProcedure
      .input(z.object({
        contexto: z.string(),
        areaJuridica: z.string(),
        tipoDocumento: z.string(),
        tribunais: z.array(z.enum(["STJ", "STF", "TST", "TSE", "STM", "TRF1", "TRF2", "TRF3", "TRF4", "TRF5", "TRF6", "TJSP", "TJRJ", "TJMG", "TJRS", "TJPR", "TJSC", "TJBA", "TJPE", "TJCE", "TJGO"])).optional(),
        limite: z.number().min(1).max(20).optional()
      }))
      .query(async ({ input }) => {
        try {
          const { buscarPrecedentesSimilares, formatarProcessoParaTexto } = await import("./knowledge-retrieval-datajud");
          
          const tribunais = input.tribunais || ["STJ", "TRF1", "TJSP"];
          const limite = input.limite || 5;
          
          const precedentes = await buscarPrecedentesSimilares(
            input.contexto,
            input.areaJuridica,
            input.tipoDocumento,
            tribunais as any,
            limite
          );
          
          return {
            total: precedentes.length,
            precedentes: precedentes.map(p => ({
              numeroProcesso: p.numeroProcesso,
              tribunal: p.tribunal,
              tribunalBusca: p.tribunal_busca,
              classe: p.classe.nome,
              assuntos: p.assuntos.map(a => a.nome),
              dataAjuizamento: p.dataAjuizamento,
              orgaoJulgador: p.orgaoJulgador.nome,
              grau: p.grau,
              scoreRelevancia: p.score_relevancia,
              textoFormatado: formatarProcessoParaTexto(p)
            }))
          };
        } catch (error) {
          console.error("[Knowledge Retrieval] Erro ao buscar precedentes:", error);
          throw new Error(`Erro ao buscar precedentes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }),

    // Calcular prazo processual
    calcularPrazo: protectedProcedure
      .input(z.object({
        dataIntimacao: z.string(), // ISO date
        chavePrazo: z.string(),
        estado: z.enum(["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"]).optional()
      }))
      .query(async ({ input }) => {
        try {
          const { calcularPrazoProcessual, formatarResultadoPrazo } = await import("./knowledge-retrieval-prazos");
          
          const dataIntimacao = new Date(input.dataIntimacao);
          const resultado = await calcularPrazoProcessual(
            dataIntimacao,
            input.chavePrazo,
            input.estado as any
          );
          
          return {
            dataInicial: resultado.dataInicial.toISOString(),
            dataFinal: resultado.dataFinal.toISOString(),
            diasCorridos: resultado.diasCorridos,
            diasUteis: resultado.diasUteis,
            prazo: resultado.prazo,
            feriados: resultado.feriadosNoIntervalo,
            alertas: resultado.alertas,
            textoFormatado: formatarResultadoPrazo(resultado)
          };
        } catch (error) {
          console.error("[Knowledge Retrieval] Erro ao calcular prazo:", error);
          throw new Error(`Erro ao calcular prazo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }),

    // Listar prazos disponíveis
    listarPrazos: protectedProcedure
      .query(async () => {
        try {
          const { listarPrazosDisponiveis } = await import("./knowledge-retrieval-prazos");
          return listarPrazosDisponiveis();
        } catch (error) {
          console.error("[Knowledge Retrieval] Erro ao listar prazos:", error);
          throw new Error(`Erro ao listar prazos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }),

    // Buscar feriados de um ano
    buscarFeriados: protectedProcedure
      .input(z.object({
        ano: z.number().min(2020).max(2030),
        estado: z.enum(["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"]).optional()
      }))
      .query(async ({ input }) => {
        try {
          const { buscarFeriadosAno } = await import("./knowledge-retrieval-feriados");
          const feriados = await buscarFeriadosAno(input.ano, input.estado as any);
          return feriados;
        } catch (error) {
          console.error("[Knowledge Retrieval] Erro ao buscar feriados:", error);
          throw new Error(`Erro ao buscar feriados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      })
  })
});

export type AppRouter = typeof appRouter;
