import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { validarLegislacao } from "../_core/validacaoLegislacao";
import { getCacheStatistics } from "../db-legislacao-cache";
import { logger } from "../_core/logger";

export const documentosRouter = router({
  gerar: protectedProcedure
    .input(z.object({
      tipoDocumento: z.string().min(1), areaJuridica: z.string().min(1),
      contexto: z.string().min(20), objetivo: z.string().optional(),
      partesEnvolvidas: z.string().optional(), legislacao: z.string().optional(),
      detalhes: z.string().optional(),
      estrategia: z.enum(["direct", "chain_of_thought", "knowledge_retrieval"]).default("direct"),
      provider: z.enum(["manus", "openai"] as const).optional(), model: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const startTime = Date.now();
      try {
        const { gerarDocumentoComEstrategia } = await import("../estrategias-ia");
        const resultado = await gerarDocumentoComEstrategia({
          tipoDocumento: input.tipoDocumento, areaJuridica: input.areaJuridica,
          contexto: input.contexto, objetivo: input.objetivo,
          partesEnvolvidas: input.partesEnvolvidas, legislacao: input.legislacao,
          detalhes: input.detalhes, estrategia: input.estrategia
        });
        const validacaoLegislacao = await validarLegislacao(resultado.documento);
        return {
          documento: resultado.documento, estrategiaUsada: resultado.estrategiaUsada,
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
        logger.error('[Documentos] Erro ao gerar documento', { userId: ctx.user.id, error });
        throw new Error(`Erro ao gerar documento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    })
});

export const legislacaoRouter = router({
  getCacheStats: protectedProcedure.query(async () => {
    const stats = await getCacheStatistics();
    return {
      total: stats.total, porTipo: stats.porTipo, porConfiabilidade: stats.porConfiabilidade,
      topCitacoes: [] as Array<{ citacao: string; count: number }>
    };
  })
});

export const knowledgeRetrievalRouter = router({
  buscarPrecedentes: protectedProcedure
    .input(z.object({
      contexto: z.string(), areaJuridica: z.string(), tipoDocumento: z.string(),
      tribunais: z.array(z.enum(["STJ", "STF", "TST", "TSE", "STM", "TRF1", "TRF2", "TRF3", "TRF4", "TRF5", "TRF6", "TJSP", "TJRJ", "TJMG", "TJRS", "TJPR", "TJSC", "TJBA", "TJPE", "TJCE", "TJGO"])).optional(),
      limite: z.number().min(1).max(20).optional()
    }))
    .query(async ({ input }) => {
      try {
        const { buscarPrecedentesSimilares, formatarProcessoParaTexto } = await import("../knowledge-retrieval-datajud");
        const tribunais = input.tribunais || ["STJ", "TRF1", "TJSP"];
        const precedentes = await buscarPrecedentesSimilares(input.contexto, input.areaJuridica, input.tipoDocumento, tribunais as any, input.limite || 5);
        return {
          total: precedentes.length,
          precedentes: precedentes.map(p => ({
            numeroProcesso: p.numeroProcesso, tribunal: p.tribunal, tribunalBusca: p.tribunal_busca,
            classe: p.classe.nome, assuntos: p.assuntos.map(a => a.nome),
            dataAjuizamento: p.dataAjuizamento, orgaoJulgador: p.orgaoJulgador.nome,
            grau: p.grau, scoreRelevancia: p.score_relevancia,
            textoFormatado: formatarProcessoParaTexto(p)
          }))
        };
      } catch (error) {
        logger.error('[Knowledge Retrieval] Erro ao buscar precedentes', { error });
        throw new Error(`Erro ao buscar precedentes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }),

  calcularPrazo: protectedProcedure
    .input(z.object({
      dataIntimacao: z.string(), chavePrazo: z.string(),
      estado: z.enum(["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"]).optional()
    }))
    .query(async ({ input }) => {
      try {
        const { calcularPrazoProcessual, formatarResultadoPrazo } = await import("../knowledge-retrieval-prazos");
        const resultado = await calcularPrazoProcessual(new Date(input.dataIntimacao), input.chavePrazo, input.estado as any);
        return {
          dataInicial: resultado.dataInicial.toISOString(), dataFinal: resultado.dataFinal.toISOString(),
          diasCorridos: resultado.diasCorridos, diasUteis: resultado.diasUteis,
          prazo: resultado.prazo, feriados: resultado.feriadosNoIntervalo,
          alertas: resultado.alertas, textoFormatado: formatarResultadoPrazo(resultado)
        };
      } catch (error) {
        logger.error('[Knowledge Retrieval] Erro ao calcular prazo', { error });
        throw new Error(`Erro ao calcular prazo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }),

  listarPrazos: protectedProcedure.query(async () => {
    try {
      const { listarPrazosDisponiveis } = await import("../knowledge-retrieval-prazos");
      return listarPrazosDisponiveis();
    } catch (error) {
      logger.error('[Knowledge Retrieval] Erro ao listar prazos', { error });
      throw new Error(`Erro ao listar prazos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }),

  buscarFeriados: protectedProcedure
    .input(z.object({
      ano: z.number().min(2020).max(2030),
      estado: z.enum(["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"]).optional()
    }))
    .query(async ({ input }) => {
      try {
        const { buscarFeriadosAno } = await import("../knowledge-retrieval-feriados");
        return buscarFeriadosAno(input.ano, input.estado as any);
      } catch (error) {
        logger.error('[Knowledge Retrieval] Erro ao buscar feriados', { error });
        throw new Error(`Erro ao buscar feriados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    })
});
