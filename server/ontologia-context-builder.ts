/**
 * ontologia-context-builder.ts
 * Helper de enriquecimento de contexto para o gerador de prompts.
 *
 * Consulta a ontologia jurídica (JurisOS) para recuperar, dado um tipo de peça,
 * as teses e os precedentes PUBLICADOS e validados (axiomas A1 e A6) e os formata
 * como um bloco de texto pronto para injeção no system prompt do LLM.
 *
 * RESTRIÇÃO CRÍTICA: este módulo NUNCA inventa teses ou precedentes.
 * Só são incluídos nós com status PUBLICADO e, para precedentes, verificadoEm != null.
 * Se a ontologia não tiver dados para o tipo de peça, retorna string vazia.
 */

import { getDb } from "./db";
import { logger } from "./_core/logger";
import {
  tiposPeca,
  teses,
  precedentes,
  dispositivos,
  requisitosLegais,
  tesesPeca,
  tesesDispositivo,
  tesesPrecedente,
} from "../drizzle/schema";
import { eq, and, inArray, isNotNull, desc, asc } from "drizzle-orm";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface OntologiaContexto {
  /** Bloco de texto formatado para injeção no system prompt */
  blocoTexto: string;
  /** Número de teses incluídas */
  totalTeses: number;
  /** Número de precedentes incluídos */
  totalPrecedentes: number;
  /** ID do tipo de peça encontrado (null se não encontrado) */
  tipoPecaId: number | null;
}

// ─── Mapeamento tipo de documento → nomes canônicos na ontologia ──────────────
// O gerador usa valores como "peticao", "recurso_especial", "apelacao", etc.
// A ontologia usa nomes como "Recurso Especial", "Apelação", etc.

const TIPO_DOC_TO_ONTOLOGIA: Record<string, string[]> = {
  peticao: ["Petição Inicial", "Petição"],
  recurso_especial: ["Recurso Especial", "REsp"],
  recurso_ordinario: ["Recurso Ordinário"],
  recurso_extraordinario: ["Recurso Extraordinário", "RE"],
  apelacao: ["Apelação", "AP"],
  agravo_regimental: ["Agravo Regimental", "AgReg"],
  agravo_interno: ["Agravo Interno"],
  embargos_declaracao: ["Embargos de Declaração", "ED"],
  contestacao: ["Contestação"],
  contrarrazoes: ["Contrarrazões"],
  habeas_corpus: ["Habeas Corpus", "HC"],
  mandado_seguranca: ["Mandado de Segurança", "MS"],
  parecer: ["Parecer"],
  contrato: ["Contrato"],
  notificacao: ["Notificação Extrajudicial"],
};

// ─── Função principal ─────────────────────────────────────────────────────────

/**
 * Busca dados da ontologia para um tipo de documento e retorna um bloco
 * de texto formatado para enriquecer o system prompt do LLM.
 *
 * @param tipoDocumento - Valor do tipo de documento (ex: "recurso_especial")
 * @param maxTeses - Número máximo de teses a incluir (padrão: 5)
 * @param maxPrecedentesPorTese - Máximo de precedentes por tese (padrão: 3)
 */
export async function buildOntologiaContexto(
  tipoDocumento: string,
  maxTeses = 5,
  maxPrecedentesPorTese = 3
): Promise<OntologiaContexto> {
  const vazio: OntologiaContexto = {
    blocoTexto: "",
    totalTeses: 0,
    totalPrecedentes: 0,
    tipoPecaId: null,
  };

  try {
    const db = await getDb();
    if (!db) {
      logger.warn("[OntologiaCtx] Banco não disponível — enriquecimento ignorado");
      return vazio;
    }

    // ── 1. Encontrar o TipoPeca PUBLICADO correspondente ──────────────────────
    const candidatos = TIPO_DOC_TO_ONTOLOGIA[tipoDocumento] ?? [];
    const todosTipos = await db
      .select({
        id: tiposPeca.id,
        nome: tiposPeca.nome,
        sigla: tiposPeca.sigla,
        cabimento: tiposPeca.cabimento,
        prazoDias: tiposPeca.prazoDias,
      })
      .from(tiposPeca)
      .where(eq(tiposPeca.status, "PUBLICADO"));

    if (todosTipos.length === 0) return vazio;

    // Match exato por nome ou sigla
    type TipoPecaRow = { id: number; nome: string; sigla: string | null; cabimento: string | null; prazoDias: number | null };
    let tipoPeca: TipoPecaRow | undefined = todosTipos.find((t: TipoPecaRow) =>
      candidatos.some(
        (c) =>
          t.nome.toLowerCase() === c.toLowerCase() ||
          (t.sigla && t.sigla.toLowerCase() === c.toLowerCase())
      )
    );

    // Fallback: match por substring do tipoDocumento
    if (!tipoPeca) {
      const normalizado = tipoDocumento.replace(/_/g, " ").toLowerCase();
      tipoPeca = todosTipos.find(
        (t: TipoPecaRow) =>
          t.nome.toLowerCase().includes(normalizado) ||
          normalizado.includes(t.nome.toLowerCase())
      );
    }

    if (!tipoPeca) {
      logger.info("[OntologiaCtx] Nenhum TipoPeca encontrado para:", tipoDocumento);
      return vazio;
    }

    // ── 2. Buscar requisitos legais obrigatórios ───────────────────────────────
    const reqs = await db
      .select({ descricao: requisitosLegais.descricao })
      .from(requisitosLegais)
      .where(
        and(
          eq(requisitosLegais.tipoPecaId, tipoPeca.id),
          eq(requisitosLegais.obrigatorio, true)
        )
      )
      .orderBy(asc(requisitosLegais.ordem));

    // ── 3. Buscar teses PUBLICADAS vinculadas ao tipo de peça ─────────────────
    const arestas = await db
      .select({ teseId: tesesPeca.teseId })
      .from(tesesPeca)
      .where(eq(tesesPeca.tipoPecaId, tipoPeca.id));

    if (arestas.length === 0) {
      return buildBlocoMinimo(tipoPeca, reqs);
    }

    const teseIds = arestas.map((a: { teseId: number }) => a.teseId);

    const teseRows = await db
      .select()
      .from(teses)
      .where(and(inArray(teses.id, teseIds), eq(teses.status, "PUBLICADO")))
      .limit(maxTeses);

    if (teseRows.length === 0) {
      return buildBlocoMinimo(tipoPeca, reqs);
    }

    // ── 4. Para cada tese: buscar fundamentos + precedentes validados ─────────
    const tesesBlocos: string[] = [];
    let totalPrecedentes = 0;

    for (const tese of teseRows) {
      // Fundamentos normativos
      const fundamentos = await db
        .select({ diploma: dispositivos.diploma, artigo: dispositivos.artigo })
        .from(tesesDispositivo)
        .innerJoin(dispositivos, eq(dispositivos.id, tesesDispositivo.dispositivoId))
        .where(eq(tesesDispositivo.teseId, tese.id));

      // Precedentes validados — A1: verificadoEm != null; A5: vinculante→peso; top-N
      const precRows = await db
        .select({
          tribunal: precedentes.tribunal,
          identificador: precedentes.identificador,
          ementa: precedentes.ementa,
          vinculante: precedentes.vinculante,
          peso: tesesPrecedente.peso,
        })
        .from(tesesPrecedente)
        .innerJoin(precedentes, eq(precedentes.id, tesesPrecedente.precedenteId))
        .where(
          and(
            eq(tesesPrecedente.teseId, tese.id),
            eq(precedentes.status, "PUBLICADO"),
            isNotNull(precedentes.verificadoEm)
          )
        )
        .orderBy(desc(precedentes.vinculante), desc(tesesPrecedente.peso))
        .limit(maxPrecedentesPorTese);

      totalPrecedentes += precRows.length;

      const linhasFundamentos =
        fundamentos.length > 0
          ? `   Fundamento: ${fundamentos
              .map((f: { diploma: string; artigo: string }) => `${f.diploma}, art. ${f.artigo}`)
              .join("; ")}`
          : "";

      const linhasPrecedentes =
        precRows.length > 0
          ? precRows
              .map(
                (p: {
                  vinculante: boolean;
                  tribunal: string;
                  identificador: string;
                  ementa: string | null;
                }) =>
                  `   - ${p.vinculante ? "[VINCULANTE] " : ""}${p.tribunal} — ${p.identificador}: ${
                    p.ementa
                      ? p.ementa.substring(0, 120) + (p.ementa.length > 120 ? "…" : "")
                      : "(ementa não disponível)"
                  }`
              )
              .join("\n")
          : "";

      const blocoTese = [
        `• ${tese.enunciado}`,
        linhasFundamentos,
        linhasPrecedentes
          ? `   Precedentes validados:\n${linhasPrecedentes}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");

      tesesBlocos.push(blocoTese);
    }

    // ── 5. Montar o bloco final ────────────────────────────────────────────────
    const linhasCabimento = tipoPeca.cabimento
      ? `Cabimento: ${tipoPeca.cabimento}\n`
      : "";
    const linhasPrazo = tipoPeca.prazoDias
      ? `Prazo: ${tipoPeca.prazoDias} dias\n`
      : "";
    const linhasRequisitos =
      reqs.length > 0
        ? `Requisitos obrigatórios:\n${reqs
            .map((r: { descricao: string }) => `  - ${r.descricao}`)
            .join("\n")}\n`
        : "";

    const blocoTexto = [
      `ONTOLOGIA JURÍDICA — ${tipoPeca.nome.toUpperCase()}${tipoPeca.sigla ? ` (${tipoPeca.sigla})` : ""}:`,
      linhasCabimento,
      linhasPrazo,
      linhasRequisitos,
      tesesBlocos.length > 0
        ? `Teses e precedentes validados (${tesesBlocos.length} tese(s), ${totalPrecedentes} precedente(s)):\n${tesesBlocos.join("\n\n")}`
        : "",
      `\nINSTRUÇÃO: Utilize as teses e precedentes acima como fundamentos jurídicos verificados. Cite-os quando pertinentes. NÃO invente ou extrapole além do que está listado.`,
    ]
      .filter(Boolean)
      .join("\n");

    logger.info("[OntologiaCtx] Contexto montado", {
      tipoDocumento,
      tipoPecaId: tipoPeca.id,
      totalTeses: teseRows.length,
      totalPrecedentes,
    });

    return {
      blocoTexto,
      totalTeses: teseRows.length,
      totalPrecedentes,
      tipoPecaId: tipoPeca.id,
    };
  } catch (err) {
    // Falha silenciosa: a geração continua sem enriquecimento da ontologia
    logger.error("[OntologiaCtx] Erro ao montar contexto", {
      error: err,
      tipoDocumento,
    });
    return vazio;
  }
}

// ─── Helper interno ───────────────────────────────────────────────────────────

function buildBlocoMinimo(
  tipoPeca: {
    nome: string;
    sigla: string | null;
    cabimento: string | null;
    prazoDias: number | null;
  },
  reqs: { descricao: string }[]
): OntologiaContexto {
  const linhasCabimento = tipoPeca.cabimento
    ? `Cabimento: ${tipoPeca.cabimento}\n`
    : "";
  const linhasPrazo = tipoPeca.prazoDias
    ? `Prazo: ${tipoPeca.prazoDias} dias\n`
    : "";
  const linhasRequisitos =
    reqs.length > 0
      ? `Requisitos obrigatórios:\n${reqs
          .map((r) => `  - ${r.descricao}`)
          .join("\n")}`
      : "";

  const partes = [
    `ONTOLOGIA JURÍDICA — ${tipoPeca.nome.toUpperCase()}${tipoPeca.sigla ? ` (${tipoPeca.sigla})` : ""}:`,
    linhasCabimento,
    linhasPrazo,
    linhasRequisitos,
  ].filter(Boolean);

  return {
    blocoTexto: partes.length > 1 ? partes.join("\n") : "",
    totalTeses: 0,
    totalPrecedentes: 0,
    tipoPecaId: null,
  };
}
