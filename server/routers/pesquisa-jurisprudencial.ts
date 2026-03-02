import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import {
  pesquisarJurisprudencia,
  formatarParaIncorporacao,
  gerarBlocoCitacao,
  gerarResumoJurisprudencia,
  type ResultadoPesquisaCompleta,
  type TomResumo,
} from "../pesquisa-jurisprudencial";
import {
  TRIBUNAIS,
  TRIBUNAIS_METADATA,
  type TribunalCode,
  type GrauJurisdicao,
} from "../knowledge-retrieval-datajud";

const tribunaisValidos = Object.keys(TRIBUNAIS) as [string, ...string[]];

export const pesquisaJurisprudencialRouter = router({
  /**
   * Pesquisar jurisprudência baseada no prompt/documento do usuário
   * Extrai teses automaticamente e busca em múltiplos tribunais
   */
  pesquisar: protectedProcedure
    .input(z.object({
      promptTexto: z.string().min(20, "O texto deve ter pelo menos 20 caracteres"),
      areaJuridica: z.string().min(1),
      tipoDocumento: z.string().min(1),
      tribunais: z.array(z.enum(tribunaisValidos as [string, ...string[]])).optional(),
      limitePorTese: z.number().min(1).max(10).optional(),
      periodoInicio: z.string().optional(),
      periodoFim: z.string().optional(),
      grau: z.enum(["G1", "G2", "JE", "TR", "todos"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const startTime = Date.now();
      logger.info("[PesquisaJurisprudencial] Requisição recebida", {
        userId: ctx.user.id,
        area: input.areaJuridica,
        tipo: input.tipoDocumento,
        tribunais: input.tribunais,
        grau: input.grau,
      });

      try {
        const resultado = await pesquisarJurisprudencia({
          promptTexto: input.promptTexto,
          areaJuridica: input.areaJuridica,
          tipoDocumento: input.tipoDocumento,
          tribunais: (input.tribunais || ["STF", "STJ", "TJSP", "TJPR", "TJRJ", "TJRS"]) as TribunalCode[],
          limitePorTese: input.limitePorTese || 5,
          filtroTemporal: {
            inicio: input.periodoInicio || "2022-01-01",
            fim: input.periodoFim || new Date().toISOString().split("T")[0],
          },
          grau: (input.grau || "todos") as GrauJurisdicao,
        });

        return {
          ...resultado,
          // Serializar datas para tRPC
          metadados: {
            ...resultado.metadados,
            tempoTotal: Date.now() - startTime,
          },
        };
      } catch (error) {
        logger.error("[PesquisaJurisprudencial] Erro na pesquisa", { error, userId: ctx.user.id });
        throw new Error(`Erro ao pesquisar jurisprudência: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
      }
    }),

  /**
   * Formatar um processo para incorporação no documento
   */
  formatarCitacao: protectedProcedure
    .input(z.object({
      processo: z.object({
        numeroProcesso: z.string(),
        tribunal: z.string(),
        tribunalBusca: z.string(),
        classe: z.string(),
        assuntos: z.array(z.string()),
        orgaoJulgador: z.string(),
        grau: z.string(),
        dataAjuizamento: z.string(),
        dataUltimaAtualizacao: z.string(),
        movimentoRecente: z.string().optional(),
        dataMovimentoRecente: z.string().optional(),
        scoreRelevancia: z.number(),
        linkOficial: z.string(),
        validacao: z.object({
          temFonteOficial: z.boolean(),
          temIdentificacaoCompleta: z.boolean(),
          temDataRecente: z.boolean(),
          temAderenciaFatica: z.boolean(),
          scoreValidacao: z.number(),
          alertas: z.array(z.string()),
        }),
      }),
      tese: z.object({
        id: z.string(),
        titulo: z.string(),
        descricao: z.string(),
        termosChave: z.array(z.string()),
        artigosRelacionados: z.array(z.string()),
        queryElasticsearch: z.string(),
      }),
      formato: z.enum(["inline", "bloco"]).default("bloco"),
    }))
    .mutation(({ input }) => {
      if (input.formato === "inline") {
        return { citacao: formatarParaIncorporacao(input.processo) };
      }
      return { citacao: gerarBlocoCitacao(input.processo, input.tese) };
    }),

  /**
   * Gerar resumo automático de fundamentação jurisprudencial via IA
   * Recebe os resultados da pesquisa e gera parágrafos prontos para inserção
   */
  gerarResumo: protectedProcedure
    .input(z.object({
      resultados: z.array(z.object({
        tese: z.object({
          id: z.string(),
          titulo: z.string(),
          descricao: z.string(),
          termosChave: z.array(z.string()),
          artigosRelacionados: z.array(z.string()),
          queryElasticsearch: z.string(),
        }),
        processos: z.array(z.object({
          numeroProcesso: z.string(),
          tribunal: z.string(),
          tribunalBusca: z.string(),
          classe: z.string(),
          assuntos: z.array(z.string()),
          orgaoJulgador: z.string(),
          grau: z.string(),
          dataAjuizamento: z.string(),
          dataUltimaAtualizacao: z.string(),
          movimentoRecente: z.string().optional(),
          dataMovimentoRecente: z.string().optional(),
          scoreRelevancia: z.number(),
          linkOficial: z.string(),
          validacao: z.object({
            temFonteOficial: z.boolean(),
            temIdentificacaoCompleta: z.boolean(),
            temDataRecente: z.boolean(),
            temAderenciaFatica: z.boolean(),
            scoreValidacao: z.number(),
            alertas: z.array(z.string()),
          }),
        })),
        totalEncontrado: z.number(),
      })),
      contextoDocumento: z.string().min(10),
      areaJuridica: z.string().min(1),
      tipoDocumento: z.string().min(1),
      tom: z.enum(["formal", "tecnico", "persuasivo"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      logger.info("[ResumoJurisprudencia] Requisição recebida", {
        userId: ctx.user.id,
        totalResultados: input.resultados.length,
        tom: input.tom || "formal",
      });

      try {
        const resultado = await gerarResumoJurisprudencia({
          resultados: input.resultados,
          contextoDocumento: input.contextoDocumento,
          areaJuridica: input.areaJuridica,
          tipoDocumento: input.tipoDocumento,
          tom: (input.tom || "formal") as TomResumo,
        });

        return resultado;
      } catch (error) {
        logger.error("[ResumoJurisprudencia] Erro ao gerar resumo", { error, userId: ctx.user.id });
        throw new Error(`Erro ao gerar resumo: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
      }
    }),

  /**
   * Listar tribunais disponíveis para pesquisa, organizados por categoria
   */
  listarTribunais: protectedProcedure.query(() => {
    return Object.entries(TRIBUNAIS_METADATA).map(([codigo, meta]) => ({
      codigo,
      alias: TRIBUNAIS[codigo as TribunalCode],
      nome: meta.nome,
      sigla: meta.sigla,
      uf: meta.uf || null,
      categoria: meta.categoria,
      regiao: meta.regiao || null,
    }));
  }),
});
