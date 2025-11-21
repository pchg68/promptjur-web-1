import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import { AREAS_JURIDICAS, PALAVRAS_CHAVE_AREAS, TEMPLATES_BASE, REFERENCIAS_LEGAIS } from "@shared/juridico";
import { gerarAvisosFontes } from "@shared/verificacao-fontes";
import { checkUsageLimit, getUpgradeMessage } from "@shared/usage-limits";
import { gerarDocumentoWord } from "./_core/docxGenerator";
import { validarLegislacao } from "./_core/validacaoLegislacao";

export const appRouter = router({
  system: systemRouter,
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
    // Analisar prompt jurídico
    analisar: protectedProcedure
      .input(z.object({
        prompt: z.string().min(10, "Prompt muito curto"),
      }))
      .mutation(async ({ input, ctx }) => {
        const startTime = Date.now();
        
        // Verificar limite de uso
        const usageCheck = checkUsageLimit(ctx.user.subscriptionPlan, ctx.user.usageCount);
        if (usageCheck.exceeded) {
          throw new Error(getUpgradeMessage(ctx.user.subscriptionPlan));
        }
        
        try {
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
            areaJuridica: analise.area,
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
            avisosFontes
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
        area: z.enum(AREAS_JURIDICAS as any).optional(), // Detectado automaticamente se não fornecido
        partesEnvolvidas: z.string().optional(),
        legislacaoRelevante: z.string().optional(),
        detalhesAdicionais: z.string().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const startTime = Date.now();
        
        // Verificar limite de uso
        const usageCheck = checkUsageLimit(ctx.user.subscriptionPlan, ctx.user.usageCount);
        if (usageCheck.exceeded) {
          throw new Error(getUpgradeMessage(ctx.user.subscriptionPlan));
        }
        
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
          const validacao = validarLegislacao(promptProfissional);

          // Salvar no banco
          const promptId = await db.createPrompt({
            userId: ctx.user.id,
            tipo: "geracao",
            areaJuridica: areaDetectada,
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

          // Verificar fontes jurídicas no prompt gerado
          const avisosFontes = gerarAvisosFontes(promptProfissional);

          return {
            promptId,
            promptProfissional,
            area: areaDetectada,
            areaDetectadaAutomaticamente: !input.area,
            tipoDocumento: input.tipoDocumento,
            referencias: referencias,
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
        
        // Verificar limite de uso
        const usageCheck = checkUsageLimit(ctx.user.subscriptionPlan, ctx.user.usageCount);
        if (usageCheck.exceeded) {
          throw new Error(getUpgradeMessage(ctx.user.subscriptionPlan));
        }
        
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
            areaJuridica: resultado.areaIdentificada,
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

          // Verificar fontes jurídicas no prompt otimizado
          const avisosFontes = gerarAvisosFontes(resultado.promptOtimizado);

          // Validar legislação citada
          const validacao = validarLegislacao(resultado.promptOtimizado);

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
      }),

    // Atribuir tag a prompt
    atribuirPrompt: protectedProcedure
      .input(z.object({
        promptId: z.number(),
        tagId: z.number()
      }))
      .mutation(async ({ input }) => {
        await db.atribuirTagPrompt(input.promptId, input.tagId);
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
      .input(z.object({
        promptId: z.number()
      }))
      .query(async ({ input }) => {
        return db.getTagsPrompt(input.promptId);
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
  })
});

export type AppRouter = typeof appRouter;
