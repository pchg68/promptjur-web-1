/**
 * prisma/seed-ontologia.ts
 * Seed inicial da Ontologia Jurídica (JurisOS) — dados estruturais de exemplo.
 *
 * AVISO: Os dispositivos e precedentes abaixo são EXEMPLOS ESTRUTURAIS.
 * Antes de uso em produção, cada Dispositivo e Precedente DEVE ser validado
 * contra fonte oficial (planalto.gov.br para legislação; sítios do STF/STJ/TJ
 * para súmulas e precedentes), preenchendo urlOficial e verificadoEm.
 * Precedente com verificadoEm == null é reprovado pelo verificador (axioma A1).
 *
 * Execução: pnpm db:seed
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq, and } from "drizzle-orm";
import {
  areasDireito,
  dispositivos,
  tiposPeca,
  requisitosLegais,
  institutos,
  teses,
  precedentes,
  tesesPeca,
  tesesDispositivo,
  tesesPrecedente,
  institutosDispositivo,
} from "../drizzle/schema";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const db = drizzle(dbUrl);

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function upsertArea(nome: string, descricao: string): Promise<number> {
  const [existing] = await db
    .select({ id: areasDireito.id })
    .from(areasDireito)
    .where(eq(areasDireito.nome, nome));
  if (existing) return existing.id;
  const [r] = await db.insert(areasDireito).values({ nome, descricao });
  return (r as { insertId: number }).insertId;
}

async function upsertDispositivo(
  artigo: string,
  diploma: string,
  texto: string,
  urlOficial: string | null = null
): Promise<number> {
  const [existing] = await db
    .select({ id: dispositivos.id })
    .from(dispositivos)
    .where(and(eq(dispositivos.artigo, artigo), eq(dispositivos.diploma, diploma)));
  if (existing) return existing.id;
  const [r] = await db.insert(dispositivos).values({ artigo, diploma, texto, urlOficial });
  return (r as { insertId: number }).insertId;
}

async function upsertInstituto(
  nome: string,
  descricao: string,
  areaId: number
): Promise<number> {
  const [existing] = await db
    .select({ id: institutos.id })
    .from(institutos)
    .where(eq(institutos.nome, nome));
  if (existing) return existing.id;
  const [r] = await db.insert(institutos).values({ nome, descricao, areaId, status: "RASCUNHO" });
  return (r as { insertId: number }).insertId;
}

async function upsertTipoPeca(
  nome: string,
  sigla: string,
  areaId: number,
  cabimento: string,
  prazoDias: number,
  prazoBaseId: number
): Promise<number> {
  const [existing] = await db
    .select({ id: tiposPeca.id })
    .from(tiposPeca)
    .where(eq(tiposPeca.nome, nome));
  if (existing) return existing.id;
  const [r] = await db
    .insert(tiposPeca)
    .values({ nome, sigla, areaId, cabimento, prazoDias, prazoBaseId, status: "RASCUNHO" });
  return (r as { insertId: number }).insertId;
}

async function upsertRequisito(
  tipoPecaId: number,
  descricao: string,
  obrigatorio: boolean,
  ordem: number,
  dispositivoId: number | null = null
): Promise<void> {
  const [existing] = await db
    .select({ id: requisitosLegais.id })
    .from(requisitosLegais)
    .where(
      and(
        eq(requisitosLegais.tipoPecaId, tipoPecaId),
        eq(requisitosLegais.descricao, descricao)
      )
    );
  if (existing) return;
  await db.insert(requisitosLegais).values({
    tipoPecaId,
    descricao,
    obrigatorio,
    ordem,
    dispositivoId,
  });
}

type TipoPrecedente =
  | "SUMULA_VINCULANTE"
  | "REPETITIVO"
  | "REPERCUSSAO_GERAL"
  | "SUMULA"
  | "ACORDAO"
  | "IRDR"
  | "IAC"
  | "ORIENTACAO";

async function upsertPrecedente(
  identificador: string,
  tipo: TipoPrecedente,
  tribunal: string,
  ementa: string,
  vinculante: boolean
): Promise<number> {
  const [existing] = await db
    .select({ id: precedentes.id })
    .from(precedentes)
    .where(
      and(
        eq(precedentes.identificador, identificador),
        eq(precedentes.tribunal, tribunal)
      )
    );
  if (existing) return existing.id;
  const [r] = await db.insert(precedentes).values({
    identificador,
    tipo,
    tribunal,
    ementa,
    vinculante,
    urlOficial: null,
    verificadoEm: null,
    status: "RASCUNHO",
  });
  return (r as { insertId: number }).insertId;
}

async function upsertTese(
  enunciado: string,
  favoravelA: "AUTOR" | "REU" | "AMBOS",
  institutoId: number
): Promise<number> {
  const [existing] = await db
    .select({ id: teses.id })
    .from(teses)
    .where(eq(teses.enunciado, enunciado));
  if (existing) return existing.id;
  const [r] = await db.insert(teses).values({ enunciado, favoravelA, institutoId, status: "RASCUNHO" });
  return (r as { insertId: number }).insertId;
}

async function linkInstitutoDispositivo(institutoId: number, dispositivoId: number): Promise<void> {
  const [ex] = await db
    .select()
    .from(institutosDispositivo)
    .where(
      and(
        eq(institutosDispositivo.institutoId, institutoId),
        eq(institutosDispositivo.dispositivoId, dispositivoId)
      )
    );
  if (ex) return;
  await db.insert(institutosDispositivo).values({ institutoId, dispositivoId });
}

async function linkTeseDispositivo(teseId: number, dispositivoId: number): Promise<void> {
  const [ex] = await db
    .select()
    .from(tesesDispositivo)
    .where(
      and(eq(tesesDispositivo.teseId, teseId), eq(tesesDispositivo.dispositivoId, dispositivoId))
    );
  if (ex) return;
  await db.insert(tesesDispositivo).values({ teseId, dispositivoId });
}

async function linkTesePeca(teseId: number, tipoPecaId: number): Promise<void> {
  const [ex] = await db
    .select()
    .from(tesesPeca)
    .where(and(eq(tesesPeca.teseId, teseId), eq(tesesPeca.tipoPecaId, tipoPecaId)));
  if (ex) return;
  await db.insert(tesesPeca).values({ teseId, tipoPecaId });
}

async function linkTesePrecedente(
  teseId: number,
  precedenteId: number,
  peso: number
): Promise<void> {
  const [ex] = await db
    .select()
    .from(tesesPrecedente)
    .where(
      and(
        eq(tesesPrecedente.teseId, teseId),
        eq(tesesPrecedente.precedenteId, precedenteId)
      )
    );
  if (ex) {
    await db
      .update(tesesPrecedente)
      .set({ peso })
      .where(
        and(
          eq(tesesPrecedente.teseId, teseId),
          eq(tesesPrecedente.precedenteId, precedenteId)
        )
      );
    return;
  }
  await db.insert(tesesPrecedente).values({ teseId, precedenteId, peso });
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Seed Ontologia Jurídica (JurisOS) ===\n");

  // 1. Áreas do Direito
  const areaProcessualId = await upsertArea(
    "Processual Civil",
    "Recursos e procedimento comum (CPC/2015)"
  );
  const areaFalimentarId = await upsertArea(
    "Falimentar",
    "Falência e recuperação (Lei 11.101/2005 e DL 7.661/1945)"
  );
  console.log(
    `Áreas criadas: Processual Civil (id=${areaProcessualId}), Falimentar (id=${areaFalimentarId})`
  );

  // 2. Dispositivos
  // AVISO: urlOficial deve ser preenchido antes de uso em produção
  const dispCF105Id = await upsertDispositivo(
    "105, III",
    "CF/1988",
    "Competência do STJ para julgar REsp"
  );
  const dispCPC319Id = await upsertDispositivo(
    "319",
    "CPC/2015",
    "Requisitos da petição inicial"
  );
  const dispCPC1010Id = await upsertDispositivo(
    "1.010",
    "CPC/2015",
    "Requisitos da apelação"
  );
  const dispCPC1003Id = await upsertDispositivo(
    "1.003, §5º",
    "CPC/2015",
    "Prazo recursal de 15 dias"
  );
  const dispCPC1022Id = await upsertDispositivo(
    "1.022",
    "CPC/2015",
    "Hipóteses dos embargos de declaração"
  );
  const dispCPC927Id = await upsertDispositivo(
    "927",
    "CPC/2015",
    "Precedentes de observância obrigatória"
  );
  console.log("Dispositivos criados: 6");
  // suprimir aviso de variável não usada — dispCPC319Id e dispCPC927Id reservados para seeds futuras
  void dispCPC319Id;
  void dispCPC927Id;

  // 3. Institutos
  const instPreqId = await upsertInstituto(
    "Prequestionamento",
    "Exigência de que a matéria federal tenha sido debatida e decidida no acórdão recorrido.",
    areaProcessualId
  );
  await linkInstitutoDispositivo(instPreqId, dispCF105Id);
  console.log(`Instituto criado: Prequestionamento (id=${instPreqId})`);

  // 4. Tipos de Peça
  const pecaRespId = await upsertTipoPeca(
    "Recurso Especial",
    "REsp",
    areaProcessualId,
    "Cabível contra acórdão de TJ ou TRF, nas hipóteses do art. 105, III, da CF.",
    15,
    dispCPC1003Id
  );
  const pecaApId = await upsertTipoPeca(
    "Apelação",
    "AP",
    areaProcessualId,
    "Cabível contra sentença.",
    15,
    dispCPC1003Id
  );
  const pecaEdId = await upsertTipoPeca(
    "Embargos de Declaração",
    "ED",
    areaProcessualId,
    "Cabíveis para sanar obscuridade, contradição, omissão ou corrigir erro material.",
    5,
    dispCPC1022Id
  );
  console.log("Tipos de peça criados: REsp, Apelação, ED");

  // 5. Requisitos Legais
  // REsp
  await upsertRequisito(pecaRespId, "Esgotamento das instâncias ordinárias", true, 1);
  await upsertRequisito(pecaRespId, "Prequestionamento da matéria federal", true, 2, dispCF105Id);
  await upsertRequisito(pecaRespId, "Ausência de reexame de prova", true, 3);
  // Apelação
  await upsertRequisito(pecaApId, "Exposição do fato e do direito", true, 1, dispCPC1010Id);
  await upsertRequisito(
    pecaApId,
    "Razões do pedido de reforma ou de decretação de nulidade",
    true,
    2,
    dispCPC1010Id
  );
  await upsertRequisito(pecaApId, "Pedido de nova decisão", true, 3, dispCPC1010Id);
  // ED
  await upsertRequisito(
    pecaEdId,
    "Indicação do vício (obscuridade, contradição, omissão ou erro material)",
    true,
    1,
    dispCPC1022Id
  );
  console.log("Requisitos legais criados: 7");

  // 6. Precedentes
  // AVISO: verificadoEm = null → reprovado pelo verificador (axioma A1)
  // Preencher urlOficial e verificadoEm antes de PUBLICAR
  const precSumula7Id = await upsertPrecedente(
    "Súmula 7",
    "SUMULA",
    "STJ",
    "A pretensão de simples reexame de prova não enseja recurso especial.",
    false
  );
  console.log(
    `Precedente criado: Súmula 7/STJ (id=${precSumula7Id}) — verificadoEm=null (não validado)`
  );

  // 7. Teses
  const teseReexameId = await upsertTese(
    "O STJ não reexamina o conjunto fático-probatório em sede de recurso especial.",
    "AMBOS",
    instPreqId
  );
  // Ancoragem normativa
  await linkTeseDispositivo(teseReexameId, dispCF105Id);
  // Pertinência a tipos de peça
  await linkTesePeca(teseReexameId, pecaRespId);
  // Sustentação jurisprudencial (aresta-chave do verificador — axioma A2)
  await linkTesePrecedente(teseReexameId, precSumula7Id, 5);
  console.log(`Tese criada: reexame de prova (id=${teseReexameId})`);

  console.log("\n=== Seed concluído com sucesso ===");
  console.log("ATENÇÃO: Todos os nós estão em status RASCUNHO.");
  console.log("Para disponibilizar ao usuário final, altere status para PUBLICADO");
  console.log("após validar urlOficial e verificadoEm de cada Precedente.");

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed falhou:", err);
  process.exit(1);
});
