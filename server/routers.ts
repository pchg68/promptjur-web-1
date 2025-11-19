import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import { AREAS_JURIDICAS, PALAVRAS_CHAVE_AREAS, TEMPLATES_BASE, REFERENCIAS_LEGAIS } from "@shared/juridico";

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

          return {
            promptId,
            area: analise.area,
            confianca: analise.confianca,
            palavrasChave: analise.palavrasChave,
            entidades: analise.entidades,
            qualidade: qualidadeTexto,
            pontuacaoQualidade: analise.qualidade,
            sugestoes: analise.sugestoes
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

    // Gerar prompt jurídico otimizado
    gerar: protectedProcedure
      .input(z.object({
        area: z.enum(AREAS_JURIDICAS as any),
        objetivo: z.string().min(10, "Objetivo muito curto"),
        nivelDetalhe: z.number().min(1).max(10).default(5),
        persona: z.string().optional(),
        incluirReferencias: z.boolean().default(true)
      }))
      .mutation(async ({ input, ctx }) => {
        const startTime = Date.now();
        
        try {
          const templateBase = TEMPLATES_BASE[input.area] || TEMPLATES_BASE["Civil"];
          const referencias = input.incluirReferencias ? REFERENCIAS_LEGAIS[input.area] || [] : [];
          
          const systemPrompt = `Você é um especialista em direito brasileiro, especializado em ${input.area}.
Sua tarefa é gerar um prompt jurídico otimizado e detalhado para ${input.objetivo}.

Nível de detalhe solicitado: ${input.nivelDetalhe}/10
${input.persona ? `Persona: ${input.persona}` : ""}
${referencias.length > 0 ? `Referências legais relevantes: ${referencias.join(", ")}` : ""}

O prompt deve ser:
- Claro e específico
- Tecnicamente preciso
- Estruturado e organizado
- Adequado para uso com IA jurídica
- Incluir contexto relevante
${input.incluirReferencias ? "- Citar legislação aplicável" : ""}`;

          const geracaoResponse = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Gere um prompt jurídico otimizado para: ${input.objetivo}` }
            ]
          });

          const content2 = geracaoResponse.choices[0].message.content;
          const promptGerado = typeof content2 === 'string' ? content2 : "";

          // Salvar no banco
          const promptId = await db.createPrompt({
            userId: ctx.user.id,
            tipo: "geracao",
            areaJuridica: input.area,
            promptOriginal: input.objetivo,
            promptOtimizado: promptGerado,
            qualidade: "excelente",
            metadata: {
              nivelDetalhe: input.nivelDetalhe,
              persona: input.persona,
              incluirReferencias: input.incluirReferencias
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

          return {
            promptId,
            promptGerado,
            area: input.area,
            referencias: referencias
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

          // Registrar no histórico
          await db.createHistorico({
            userId: ctx.user.id,
            acao: "otimizacao",
            promptId,
            duracaoMs: Date.now() - startTime,
            sucesso: true
          });

          return {
            promptId,
            promptOriginal: input.prompt,
            promptOtimizado: resultado.promptOtimizado,
            melhorias: resultado.melhorias,
            area: resultado.areaIdentificada
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
      })
  }),

  analytics: router({
    // Obter estatísticas de uso
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getAnalytics(ctx.user.id);
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
  })
});

export type AppRouter = typeof appRouter;
