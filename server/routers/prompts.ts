import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { AREAS_JURIDICAS, REFERENCIAS_LEGAIS } from "@shared/juridico";
import { gerarAvisosFontes } from "@shared/verificacao-fontes";
import { validarLegislacao } from "../_core/validacaoLegislacao";
import { notifyPromptGenerated, notifyPromptOptimized } from "../notification-triggers";
import { extractCitacoesLegais, contarCitacoesPorTipo, formatarCitacoes, extractLegalSources, getSourcesStatistics } from "../extractCitacoesLegais";
import { logger } from "../_core/logger";
import { getCachedData } from "../admin";
import { canAccessModel, getAccessDeniedMessage } from "../plan-access";
import { TRPCError } from "@trpc/server";

/** Helper: verifica acesso ao modelo antes de chamar a IA */
function checkModelAccess(userPlan: string, model?: string) {
  if (!model) return; // modelo padrão (manus) é sempre acessível
  const plan = (userPlan || "free") as "free" | "pro" | "enterprise";
  if (!canAccessModel(plan, model)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: getAccessDeniedMessage(model, plan),
    });
  }
}

export const promptsRouter = router({
  search: protectedProcedure
    .input(z.object({
      texto: z.string().optional(),
      areasJuridicas: z.array(z.string()).optional(),
      dataInicio: z.date().optional(),
      dataFim: z.date().optional(),
      tagIds: z.array(z.number()).optional(),
      qualidade: z.array(z.enum(["excelente", "bom", "ruim"])).optional(),
      ordenacao: z.enum(["data_desc", "data_asc", "qualidade", "relevancia"]).optional(),
      limite: z.number().min(1).max(100).optional(),
      offset: z.number().min(0).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const { searchPrompts, countSearchResults } = await import("../db-search");
      const results = await searchPrompts({ userId: ctx.user.id, ...input });
      const total = await countSearchResults({
        userId: ctx.user.id, texto: input.texto, areasJuridicas: input.areasJuridicas,
        dataInicio: input.dataInicio, dataFim: input.dataFim, tagIds: input.tagIds, qualidade: input.qualidade,
      });
      return { results, total, limite: input.limite || 20, offset: input.offset || 0 };
    }),

  analisar: protectedProcedure
    .input(z.object({
      prompt: z.string().min(10, "Prompt muito curto"),
      provider: z.enum(["manus", "openai", "anthropic", "google", "perplexity"] as const).optional(),
      model: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkModelAccess(ctx.user.subscriptionPlan, input.model);
      const startTime = Date.now();
      try {
        const citacoesExtraidas = extractCitacoesLegais(input.prompt);
        const contagemCitacoes = contarCitacoesPorTipo(citacoesExtraidas);
        const citacoesFormatadas = formatarCitacoes(citacoesExtraidas);
        const fontesLegais = extractLegalSources(input.prompt);
        const estatisticasFontes = getSourcesStatistics(input.prompt);
        
        const { invokeUnifiedLLM } = await import("../unified-llm");
        const llmResponse = await invokeUnifiedLLM({
          provider: input.provider, model: input.model,
          messages: [
            { role: "system", content: `Você é um especialista em direito brasileiro. Analise o prompt jurídico fornecido e identifique:\n1. A área jurídica principal (Civil, Penal, Trabalhista, Tributário, Administrativo, Constitucional, Empresarial, Consumidor, Família, Previdenciário, Ambiental, Internacional)\n2. Palavras-chave relevantes (máximo 10)\n3. Entidades jurídicas mencionadas (leis, artigos, tribunais, etc.)\n4. Qualidade do prompt (0-100)\n5. Sugestões de melhoria (máximo 5)\n\nResponda APENAS em formato JSON válido, sem texto adicional.` },
            { role: "user", content: `Analise este prompt jurídico:\n\n${input.prompt}` }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "analise_prompt", strict: true,
              schema: {
                type: "object",
                properties: {
                  area: { type: "string" }, confianca: { type: "integer" },
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

        const content = llmResponse.content;
        const analise = JSON.parse(typeof content === 'string' ? content : "{}");
        
        let qualidadeTexto: "excelente" | "bom" | "ruim" = "ruim";
        if (analise.qualidade >= 80) qualidadeTexto = "excelente";
        else if (analise.qualidade >= 50) qualidadeTexto = "bom";

        const promptId = await db.createPrompt({
          userId: ctx.user.id, tipo: "analise", areaJuridica: analise.area?.substring(0, 100) || null,
          promptOriginal: input.prompt, qualidade: qualidadeTexto,
          metadata: { palavrasChave: analise.palavrasChave, entidades: analise.entidades }
        });

        await db.createAnalise({
          promptId, userId: ctx.user.id, areaIdentificada: analise.area,
          confiancaArea: analise.confianca, palavrasChave: analise.palavrasChave,
          entidades: analise.entidades, pontuacaoQualidade: analise.qualidade, sugestoes: analise.sugestoes
        });

        await db.createHistorico({ userId: ctx.user.id, acao: "analise", promptId, duracaoMs: Date.now() - startTime, sucesso: true });
        await db.incrementUserUsage(ctx.user.id);
        const avisosFontes = gerarAvisosFontes(input.prompt);

        return {
          promptId, area: analise.area, confianca: analise.confianca,
          palavrasChave: analise.palavrasChave, entidades: analise.entidades,
          qualidade: qualidadeTexto, pontuacaoQualidade: analise.qualidade,
          sugestoes: analise.sugestoes, avisosFontes,
          citacoesLegais: { total: citacoesExtraidas.length, porTipo: contagemCitacoes, lista: citacoesFormatadas },
          fontesLegais: { total: estatisticasFontes.total, porTipo: estatisticasFontes.byType, fontes: fontesLegais }
        };
      } catch (error) {
        await db.createHistorico({ userId: ctx.user.id, acao: "analise", duracaoMs: Date.now() - startTime, sucesso: false, mensagemErro: error instanceof Error ? error.message : "Erro desconhecido" });
        throw error;
      }
    }),

  gerar: protectedProcedure
    .input(z.object({
      tipoDocumento: z.enum(["peticao", "parecer", "contrato", "recurso", "defesa", "memorando", "outro"] as const),
      contextoJuridico: z.string().min(20, "Contexto muito curto"),
      objetivoEspecifico: z.string().min(10, "Objetivo muito curto"),
      area: z.enum(["Civil", "Penal", "Trabalhista", "Tributário", "Administrativo", "Constitucional", "Empresarial", "Consumidor", "Família", "Previdenciário", "Ambiental", "Internacional", "Processo Civil", "Direito Médico", "Direito Digital", "Direito Internacional"] as const),
      partesEnvolvidas: z.string().optional(),
      legislacaoRelevante: z.string().optional(),
      detalhesAdicionais: z.string().optional(),
      provider: z.enum(["manus", "openai", "anthropic", "google", "perplexity"] as const).optional(),
      model: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkModelAccess(ctx.user.subscriptionPlan, input.model);
      const startTime = Date.now();
      try {
        let areaDetectada = input.area;
        const { invokeUnifiedLLM } = await import("../unified-llm");
        
        if (!areaDetectada) {
          const llmDeteccao = await invokeUnifiedLLM({
            provider: input.provider, model: input.model,
            messages: [
              { role: "system", content: `Você é um especialista em direito brasileiro. Analise o contexto e identifique APENAS a área jurídica principal. Responda com UMA das opções: ${AREAS_JURIDICAS.join(", ")}` },
              { role: "user", content: `Tipo: ${input.tipoDocumento}\nContexto: ${input.contextoJuridico}\nObjetivo: ${input.objetivoEspecifico}` }
            ]
          });
          const areaResposta = llmDeteccao.content.trim() || "Civil";
          areaDetectada = (AREAS_JURIDICAS.find(a => areaResposta.includes(a)) || "Civil") as typeof input.area;
        }
        
        const referencias = REFERENCIAS_LEGAIS[areaDetectada] || [];
        
        const systemPrompt = `Você é um MESTRE em Engenharia de Prompts Jurídicos, com doutorado em Direito ${areaDetectada} e especialização em IA aplicada ao Direito.\n\nSua tarefa É CRIAR UM PROMPT PROFISSIONAL PRONTO PARA USO que, quando usado em ferramentas de IA (ChatGPT, Claude, Gemini), gerará um ${input.tipoDocumento} jurídico de excelência.\n\nTÉCNICAS DE ENGENHARIA DE PROMPT A USAR:\n1. **Persona Especializada**: Definir claramente o papel da IA\n2. **Contexto Rico**: Fornecer todos os detalhes relevantes\n3. **Instruções Estruturadas**: Dividir em seções claras\n4. **Exemplos e Formato**: Especificar estrutura esperada\n5. **Restrições e Requisitos**: Legislação obrigatória, tom formal\n6. **Chain-of-Thought**: Pedir raciocínio jurídico passo a passo\n7. **Verificação de Qualidade**: Incluir critérios de revisão\n\nREFERÊNCIAS LEGAIS: ${referencias.join(", ")}\n\nO PROMPT FINAL deve ser autocontido, profissional, acionável, preciso e formatado.\n\nIMPORTANTE: Retorne APENAS o prompt final, sem explicações ou comentários adicionais.`;

        const userPrompt = `TIPO DE DOCUMENTO: ${input.tipoDocumento.toUpperCase()}\nÁREA JURÍDICA: ${areaDetectada}\n\nCONTEXTO JURÍDICO:\n${input.contextoJuridico}\n\nOBJETIVO ESPECÍFICO:\n${input.objetivoEspecifico}\n\n${input.partesEnvolvidas ? `PARTES ENVOLVIDAS:\n${input.partesEnvolvidas}\n\n` : ""}${input.legislacaoRelevante ? `LEGISLAÇÃO RELEVANTE:\n${input.legislacaoRelevante}\n\n` : ""}${input.detalhesAdicionais ? `DETALHES ADICIONAIS:\n${input.detalhesAdicionais}\n\n` : ""}Gere o prompt profissional PRONTO PARA USO:`;

        const llmGeracao = await invokeUnifiedLLM({
          provider: input.provider, model: input.model,
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }]
        });

        let promptProfissional = llmGeracao.content;
        promptProfissional = promptProfissional.replace(/\n{3,}/g, '\n\n');

        const validacaoRaw = await validarLegislacao(promptProfissional);
        const validacao = {
          citacoes: validacaoRaw.citacoes.map(c => ({
            texto: String(c.texto), tipo: c.tipo, numero: c.numero ? String(c.numero) : undefined,
            codigo: c.codigo ? String(c.codigo) : undefined, confiabilidade: c.confiabilidade,
            motivo: String(c.motivo), mensagem: String(c.mensagem),
            linkOficial: c.linkOficial ? String(c.linkOficial) : undefined,
            link: c.link ? String(c.link) : undefined
          })),
          confiabilidadeGeral: validacaoRaw.confiabilidadeGeral,
          totalCitacoes: Number(validacaoRaw.totalCitacoes),
          citacoesValidadas: Number(validacaoRaw.citacoesValidadas)
        };

        const promptId = await db.createPrompt({
          userId: ctx.user.id, tipo: "geracao", areaJuridica: areaDetectada?.substring(0, 100) || null,
          promptOriginal: input.contextoJuridico, promptOtimizado: promptProfissional, qualidade: "excelente",
          metadata: { tipoDocumento: input.tipoDocumento, objetivoEspecifico: input.objetivoEspecifico, areaDetectadaAutomaticamente: !input.area }
        });

        await db.createHistorico({ userId: ctx.user.id, acao: "geracao", promptId, duracaoMs: Date.now() - startTime, sucesso: true });
        await db.incrementUserUsage(ctx.user.id);
        await notifyPromptGenerated(ctx.user.id, input.tipoDocumento).catch(err => { logger.error('Erro notificação', { error: err }); });
        const avisosFontes = gerarAvisosFontes(promptProfissional);

        return {
          promptId: Number(promptId), promptProfissional, area: areaDetectada,
          areaDetectadaAutomaticamente: !input.area, tipoDocumento: input.tipoDocumento,
          referencias, avisosFontes, validacaoLegislacao: validacao
        };
      } catch (error) {
        await db.createHistorico({ userId: ctx.user.id, acao: "geracao", duracaoMs: Date.now() - startTime, sucesso: false, mensagemErro: error instanceof Error ? error.message : "Erro desconhecido" });
        throw error;
      }
    }),

  otimizar: protectedProcedure
    .input(z.object({
      prompt: z.string().min(10, "Prompt muito curto"),
      provider: z.enum(["manus", "openai", "anthropic", "google", "perplexity"] as const).optional(),
      model: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkModelAccess(ctx.user.subscriptionPlan, input.model);
      const startTime = Date.now();
      try {
        const { invokeUnifiedLLM } = await import("../unified-llm");
        const llmOtimizacao = await invokeUnifiedLLM({
          provider: input.provider, model: input.model,
          messages: [
            { role: "system", content: `Você é um especialista em engenharia de prompts jurídicos.\nAnalise o prompt e crie uma versão otimizada que seja mais clara, precisa, bem estruturada e adequada para IA jurídica.\n\nResponda em formato JSON com:\n{\n  "promptOtimizado": "versão melhorada",\n  "melhorias": ["lista de melhorias"],\n  "areaIdentificada": "área jurídica"\n}` },
            { role: "user", content: `Otimize este prompt jurídico:\n\n${input.prompt}` }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "otimizacao_prompt", strict: true,
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

        const content = llmOtimizacao.content;
        const resultado = JSON.parse(typeof content === 'string' ? content : "{}");

        const promptId = await db.createPrompt({
          userId: ctx.user.id, tipo: "otimizacao", areaJuridica: resultado.areaIdentificada?.substring(0, 100) || null,
          promptOriginal: input.prompt, promptOtimizado: resultado.promptOtimizado, qualidade: "excelente",
          metadata: { melhorias: resultado.melhorias }
        });

        await db.salvarVersaoPrompt({ promptId, tipo: "original", versao: 1, conteudo: input.prompt });
        await db.createHistorico({ userId: ctx.user.id, acao: "otimizacao", promptId, duracaoMs: Date.now() - startTime, sucesso: true });
        await db.incrementUserUsage(ctx.user.id);
        await notifyPromptOptimized(ctx.user.id).catch(err => { logger.error('Erro notificação', { error: err }); });

        const avisosFontes = gerarAvisosFontes(resultado.promptOtimizado);
        const validacaoRaw = await validarLegislacao(resultado.promptOtimizado);
        const validacao = {
          citacoes: validacaoRaw.citacoes.map(c => ({
            texto: String(c.texto), tipo: c.tipo, numero: c.numero ? String(c.numero) : undefined,
            codigo: c.codigo ? String(c.codigo) : undefined, confiabilidade: c.confiabilidade,
            motivo: String(c.motivo), mensagem: String(c.mensagem),
            linkOficial: c.linkOficial ? String(c.linkOficial) : undefined,
            link: c.link ? String(c.link) : undefined
          })),
          confiabilidadeGeral: validacaoRaw.confiabilidadeGeral,
          totalCitacoes: Number(validacaoRaw.totalCitacoes),
          citacoesValidadas: Number(validacaoRaw.citacoesValidadas)
        };

        return {
          promptId, promptOriginal: input.prompt, promptOtimizado: resultado.promptOtimizado,
          melhorias: resultado.melhorias, area: resultado.areaIdentificada,
          avisosFontes, validacaoLegislacao: validacao
        };
      } catch (error) {
        await db.createHistorico({ userId: ctx.user.id, acao: "otimizacao", duracaoMs: Date.now() - startTime, sucesso: false, mensagemErro: error instanceof Error ? error.message : "Erro desconhecido" });
        throw error;
      }
    }),

  listar: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(50) }))
    .query(async ({ input, ctx }) => db.getUserPrompts(ctx.user.id, input.limit)),

  loadPrompt: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const prompt = await db.getPromptById(input.id, ctx.user.id);
      if (!prompt) throw new Error("Prompt não encontrado ou sem permissão");
      return prompt;
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    return getCachedData(`stats:${ctx.user.id}`, () => db.getUserStats(ctx.user.id));
  }),

  toggleFavorito: protectedProcedure
    .input(z.object({ promptId: z.number(), isFavorito: z.boolean() }))
    .mutation(async ({ input }) => { await db.toggleFavorito(input.promptId, input.isFavorito); return { success: true }; }),

  favoritar: protectedProcedure
    .input(z.object({ id: z.number(), favorito: z.boolean() }))
    .mutation(async ({ input }) => { await db.toggleFavorito(input.id, input.favorito); return { success: true }; }),

  excluir: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { excluirPrompt } = await import("../db");
      await excluirPrompt(input.id, ctx.user.id);
      return { success: true };
    }),

  listarFavoritos: protectedProcedure.query(async ({ ctx }) => {
    const prompts = await db.getUserPrompts(ctx.user.id, 100);
    return prompts.filter(p => p.isFavorito);
  }),

  exportarDocx: protectedProcedure
    .input(z.object({
      promptId: z.number().optional(), titulo: z.string().min(1), conteudo: z.string().min(1),
      incluirCabecalho: z.boolean().optional().default(true), incluirDataHora: z.boolean().optional().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const { generateDocxABNT, gerarNomeArquivo } = await import("../docx-generator");
      let cabecalho = undefined;
      if (input.incluirCabecalho) {
        const cabecalhoDb = await db.getCabecalhoTemplate(ctx.user.id);
        if (cabecalhoDb) {
          cabecalho = { nomeEscritorio: cabecalhoDb.nomeEscritorio || undefined, numeroOAB: cabecalhoDb.oab || undefined, endereco: cabecalhoDb.endereco || undefined, telefone: cabecalhoDb.telefone || undefined, email: cabecalhoDb.email || undefined };
        }
      }
      const buffer = await generateDocxABNT({ titulo: input.titulo, conteudo: input.conteudo, cabecalho, incluirDataHora: input.incluirDataHora, removerPersonaContexto: true });
      if (input.promptId) { await db.createHistorico({ userId: ctx.user.id, acao: "exportacao_docx", promptId: input.promptId, duracaoMs: 0, sucesso: true }); }
      return { buffer: buffer.toString('base64'), filename: gerarNomeArquivo(input.titulo) };
    }),

  exportarPdf: protectedProcedure
    .input(z.object({
      promptId: z.number().optional(), titulo: z.string().min(1), conteudo: z.string().min(1),
      incluirCabecalho: z.boolean().optional().default(true), incluirDataHora: z.boolean().optional().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const { generatePdfABNT, gerarNomeArquivoPdf } = await import("../pdf-generator");
      let cabecalho = undefined;
      if (input.incluirCabecalho) {
        const cabecalhoDb = await db.getCabecalhoTemplate(ctx.user.id);
        if (cabecalhoDb) {
          cabecalho = { nomeEscritorio: cabecalhoDb.nomeEscritorio || undefined, numeroOAB: cabecalhoDb.oab || undefined, endereco: cabecalhoDb.endereco || undefined, telefone: cabecalhoDb.telefone || undefined, email: cabecalhoDb.email || undefined };
        }
      }
      const buffer = await generatePdfABNT({ titulo: input.titulo, conteudo: input.conteudo, cabecalho, incluirDataHora: input.incluirDataHora, removerPersonaContexto: true });
      if (input.promptId) { await db.createHistorico({ userId: ctx.user.id, acao: "exportacao_pdf", promptId: input.promptId, duracaoMs: 0, sucesso: true }); }
      return { buffer: buffer.toString('base64'), filename: gerarNomeArquivoPdf(input.titulo) };
    })
});
