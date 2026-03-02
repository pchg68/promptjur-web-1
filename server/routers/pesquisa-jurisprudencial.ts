import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import {
  pesquisarJurisprudencia,
  formatarParaIncorporacao,
  gerarBlocoCitacao,
  type ResultadoPesquisaCompleta,
} from "../pesquisa-jurisprudencial";
import { TRIBUNAIS, type TribunalCode } from "../knowledge-retrieval-datajud";

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
    }))
    .mutation(async ({ input, ctx }) => {
      const startTime = Date.now();
      logger.info("[PesquisaJurisprudencial] Requisição recebida", {
        userId: ctx.user.id,
        area: input.areaJuridica,
        tipo: input.tipoDocumento,
        tribunais: input.tribunais,
      });

      try {
        const resultado = await pesquisarJurisprudencia({
          promptTexto: input.promptTexto,
          areaJuridica: input.areaJuridica,
          tipoDocumento: input.tipoDocumento,
          tribunais: (input.tribunais || ["STJ", "TJSP", "TJPR", "TJRJ", "TJRS"]) as TribunalCode[],
          limitePorTese: input.limitePorTese || 5,
          filtroTemporal: {
            inicio: input.periodoInicio || "2022-01-01",
            fim: input.periodoFim || new Date().toISOString().split("T")[0],
          },
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
   * Listar tribunais disponíveis para pesquisa
   */
  listarTribunais: protectedProcedure.query(() => {
    return Object.entries(TRIBUNAIS).map(([codigo, alias]) => ({
      codigo,
      alias,
      nome: getNomeTribunal(codigo),
      categoria: getCategoriaTribunal(codigo),
    }));
  }),
});

function getNomeTribunal(codigo: string): string {
  const nomes: Record<string, string> = {
    STJ: "Superior Tribunal de Justiça",
    TST: "Tribunal Superior do Trabalho",
    TSE: "Tribunal Superior Eleitoral",
    STM: "Superior Tribunal Militar",
    TRF1: "TRF 1ª Região",
    TRF2: "TRF 2ª Região",
    TRF3: "TRF 3ª Região",
    TRF4: "TRF 4ª Região",
    TRF5: "TRF 5ª Região",
    TRF6: "TRF 6ª Região",
    TJSP: "Tribunal de Justiça de São Paulo",
    TJRJ: "Tribunal de Justiça do Rio de Janeiro",
    TJMG: "Tribunal de Justiça de Minas Gerais",
    TJRS: "Tribunal de Justiça do Rio Grande do Sul",
    TJPR: "Tribunal de Justiça do Paraná",
    TJSC: "Tribunal de Justiça de Santa Catarina",
    TJBA: "Tribunal de Justiça da Bahia",
    TJPE: "Tribunal de Justiça de Pernambuco",
    TJCE: "Tribunal de Justiça do Ceará",
    TJGO: "Tribunal de Justiça de Goiás",
  };
  return nomes[codigo] || codigo;
}

function getCategoriaTribunal(codigo: string): string {
  if (["STJ", "TST", "TSE", "STM"].includes(codigo)) return "Tribunais Superiores";
  if (codigo.startsWith("TRF")) return "Justiça Federal";
  return "Justiça Estadual";
}
