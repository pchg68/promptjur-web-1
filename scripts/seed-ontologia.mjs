/**
 * seed-ontologia.mjs
 * Seed inicial da Ontologia Jurídica (JurisOS) — dados estruturais de exemplo.
 *
 * AVISO: Os dispositivos e precedentes abaixo são EXEMPLOS ESTRUTURAIS.
 * Antes de uso em produção, cada Dispositivo e Precedente DEVE ser validado
 * contra fonte oficial (planalto.gov.br para legislação; sítios do STF/STJ/TJ
 * para súmulas e precedentes), preenchendo urlOficial e verificadoEm.
 * Precedente com verificadoEm == null é reprovado pelo verificador (axioma A1).
 *
 * Execução: node scripts/seed-ontologia.mjs
 */

import mysql from 'mysql2/promise';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const conn = await mysql.createConnection(dbUrl);

async function insertOrGet(table, uniqueField, value, extraFields = {}) {
  const [existing] = await conn.execute(
    `SELECT id FROM \`${table}\` WHERE \`${uniqueField}\` = ?`,
    [value]
  );
  if (existing.length > 0) {
    return existing[0].id;
  }
  const fields = { [uniqueField]: value, ...extraFields };
  const cols = Object.keys(fields).map(k => `\`${k}\``).join(', ');
  const vals = Object.values(fields);
  const placeholders = vals.map(() => '?').join(', ');
  const [result] = await conn.execute(
    `INSERT INTO \`${table}\` (${cols}) VALUES (${placeholders})`,
    vals
  );
  return result.insertId;
}

async function insertJunction(table, col1, val1, col2, val2, extra = {}) {
  const [existing] = await conn.execute(
    `SELECT 1 FROM \`${table}\` WHERE \`${col1}\` = ? AND \`${col2}\` = ?`,
    [val1, val2]
  );
  if (existing.length > 0) return;
  const fields = { [col1]: val1, [col2]: val2, ...extra };
  const cols = Object.keys(fields).map(k => `\`${k}\``).join(', ');
  const vals = Object.values(fields);
  const placeholders = vals.map(() => '?').join(', ');
  await conn.execute(
    `INSERT INTO \`${table}\` (${cols}) VALUES (${placeholders})`,
    vals
  );
}

console.log('=== Seed Ontologia Jurídica (JurisOS) ===\n');

// ─── 1. Áreas do Direito ──────────────────────────────────────────────────────
const areaProcessualId = await insertOrGet('ont_areas_direito', 'nome', 'Processual Civil', {
  descricao: 'Recursos e procedimento comum (CPC/2015)',
});
const areaFalimentarId = await insertOrGet('ont_areas_direito', 'nome', 'Falimentar', {
  descricao: 'Falência e recuperação (Lei 11.101/2005 e DL 7.661/1945)',
});
console.log('Áreas criadas: Processual Civil (id=' + areaProcessualId + '), Falimentar (id=' + areaFalimentarId + ')');

// ─── 2. Dispositivos ──────────────────────────────────────────────────────────
// AVISO: urlOficial deve ser preenchido antes de uso em produção
const dispCF105Id = await insertOrGet('ont_dispositivos', 'artigo', '105, III', {
  diploma: 'CF/1988',
  texto: 'Competência do STJ para julgar REsp',
  urlOficial: null,
});
const dispCPC319Id = await insertOrGet('ont_dispositivos', 'artigo', '319', {
  diploma: 'CPC/2015',
  texto: 'Requisitos da petição inicial',
  urlOficial: null,
});
const dispCPC1010Id = await insertOrGet('ont_dispositivos', 'artigo', '1.010', {
  diploma: 'CPC/2015',
  texto: 'Requisitos da apelação',
  urlOficial: null,
});
const dispCPC1003Id = await insertOrGet('ont_dispositivos', 'artigo', '1.003, §5º', {
  diploma: 'CPC/2015',
  texto: 'Prazo recursal de 15 dias',
  urlOficial: null,
});
const dispCPC1022Id = await insertOrGet('ont_dispositivos', 'artigo', '1.022', {
  diploma: 'CPC/2015',
  texto: 'Hipóteses dos embargos de declaração',
  urlOficial: null,
});
const dispCPC927Id = await insertOrGet('ont_dispositivos', 'artigo', '927', {
  diploma: 'CPC/2015',
  texto: 'Precedentes de observância obrigatória',
  urlOficial: null,
});
console.log('Dispositivos criados: 6');

// ─── 3. Institutos ────────────────────────────────────────────────────────────
const instPreqId = await insertOrGet('ont_institutos', 'nome', 'Prequestionamento', {
  descricao: 'Exigência de que a matéria federal tenha sido debatida e decidida no acórdão recorrido.',
  areaId: areaProcessualId,
  status: 'RASCUNHO',
});
await insertJunction('ont_institutos_dispositivo', 'institutoId', instPreqId, 'dispositivoId', dispCF105Id);
console.log('Instituto criado: Prequestionamento (id=' + instPreqId + ')');

// ─── 4. Tipos de Peça ─────────────────────────────────────────────────────────
const pecaRespId = await insertOrGet('ont_tipos_peca', 'nome', 'Recurso Especial', {
  sigla: 'REsp',
  areaId: areaProcessualId,
  cabimento: 'Cabível contra acórdão de TJ ou TRF, nas hipóteses do art. 105, III, da CF.',
  prazoDias: 15,
  prazoBaseId: dispCPC1003Id,
  status: 'RASCUNHO',
});
const pecaApId = await insertOrGet('ont_tipos_peca', 'nome', 'Apelação', {
  sigla: 'AP',
  areaId: areaProcessualId,
  cabimento: 'Cabível contra sentença.',
  prazoDias: 15,
  prazoBaseId: dispCPC1003Id,
  status: 'RASCUNHO',
});
const pecaEdId = await insertOrGet('ont_tipos_peca', 'nome', 'Embargos de Declaração', {
  sigla: 'ED',
  areaId: areaProcessualId,
  cabimento: 'Cabíveis para sanar obscuridade, contradição, omissão ou corrigir erro material.',
  prazoDias: 5,
  prazoBaseId: dispCPC1022Id,
  status: 'RASCUNHO',
});
console.log('Tipos de peça criados: REsp, Apelação, ED');

// ─── 5. Requisitos Legais ─────────────────────────────────────────────────────
async function addRequisito(tipoPecaId, descricao, obrigatorio, ordem, dispositivoId = null) {
  const [ex] = await conn.execute(
    'SELECT id FROM `ont_requisitos_legais` WHERE `tipoPecaId` = ? AND `descricao` = ?',
    [tipoPecaId, descricao]
  );
  if (ex.length > 0) return;
  await conn.execute(
    'INSERT INTO `ont_requisitos_legais` (`descricao`, `obrigatorio`, `ordem`, `tipoPecaId`, `dispositivoId`) VALUES (?, ?, ?, ?, ?)',
    [descricao, obrigatorio, ordem, tipoPecaId, dispositivoId]
  );
}

// REsp
await addRequisito(pecaRespId, 'Esgotamento das instâncias ordinárias', true, 1);
await addRequisito(pecaRespId, 'Prequestionamento da matéria federal', true, 2, dispCF105Id);
await addRequisito(pecaRespId, 'Ausência de reexame de prova', true, 3);
// Apelação
await addRequisito(pecaApId, 'Exposição do fato e do direito', true, 1, dispCPC1010Id);
await addRequisito(pecaApId, 'Razões do pedido de reforma ou de decretação de nulidade', true, 2, dispCPC1010Id);
await addRequisito(pecaApId, 'Pedido de nova decisão', true, 3, dispCPC1010Id);
// ED
await addRequisito(pecaEdId, 'Indicação do vício (obscuridade, contradição, omissão ou erro material)', true, 1, dispCPC1022Id);
console.log('Requisitos legais criados: 7');

// ─── 6. Precedentes ───────────────────────────────────────────────────────────
// AVISO: verificadoEm = null → reprovado pelo verificador (axioma A1)
// Preencher urlOficial e verificadoEm antes de PUBLICAR
const precSumula7Id = await insertOrGet('ont_precedentes', 'identificador', 'Súmula 7', {
  tipo: 'SUMULA',
  tribunal: 'STJ',
  ementa: 'A pretensão de simples reexame de prova não enseja recurso especial.',
  urlOficial: null,
  vinculante: false,
  verificadoEm: null,
  status: 'RASCUNHO',
});
console.log('Precedente criado: Súmula 7/STJ (id=' + precSumula7Id + ') — verificadoEm=null (não validado)');

// ─── 7. Teses ─────────────────────────────────────────────────────────────────
const teseReexameId = await insertOrGet('ont_teses', 'enunciado',
  'O STJ não reexamina o conjunto fático-probatório em sede de recurso especial.', {
  favoravelA: 'AMBOS',
  institutoId: instPreqId,
  status: 'RASCUNHO',
});
// Ancoragem normativa
await insertJunction('ont_teses_dispositivo', 'teseId', teseReexameId, 'dispositivoId', dispCF105Id);
// Pertinência a tipos de peça
await insertJunction('ont_teses_peca', 'teseId', teseReexameId, 'tipoPecaId', pecaRespId);
// Sustentação jurisprudencial (aresta-chave do verificador — axioma A2)
await insertJunction('ont_teses_precedente', 'teseId', teseReexameId, 'precedenteId', precSumula7Id, { peso: 5 });
console.log('Tese criada: reexame de prova (id=' + teseReexameId + ')');

await conn.end();

console.log('\n=== Seed concluído com sucesso ===');
console.log('ATENÇÃO: Todos os nós estão em status RASCUNHO.');
console.log('Para disponibilizar ao usuário final, altere status para PUBLICADO');
console.log('após validar urlOficial e verificadoEm de cada Precedente.');
