/**
 * Helpers de cache de validação de legislação
 * Otimiza performance armazenando resultados de validações anteriores
 */

import { eq, lt } from "drizzle-orm";
import { legislacaoCache, InsertLegislacaoCache, type LegislacaoCache } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Busca uma validação no cache
 * Retorna null se não encontrada ou expirada
 */
export async function getCachedValidation(citacao: string): Promise<LegislacaoCache | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(legislacaoCache)
      .where(eq(legislacaoCache.citacao, citacao.trim()))
      .limit(1);

    if (result.length === 0) return null;

    const cached = result[0];

    // Verificar se expirou
    if (cached.expiresAt && new Date() > new Date(cached.expiresAt)) {
      // Cache expirado, remover
      await db.delete(legislacaoCache).where(eq(legislacaoCache.id, cached.id));
      return null;
    }

    return cached;
  } catch (error) {
    console.error("[Cache] Erro ao buscar validação:", error);
    return null;
  }
}

/**
 * Salva uma validação no cache
 * TTL padrão: 30 dias
 */
export async function setCachedValidation(
  citacao: string,
  tipo: "artigo" | "lei" | "codigo" | "decreto" | "portaria",
  confiabilidade: "alta" | "media" | "baixa",
  motivo: string,
  linkOficial?: string,
  ttlDays: number = 30
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);

    const cacheEntry: InsertLegislacaoCache = {
      citacao: citacao.trim(),
      tipo,
      confiabilidade,
      motivo,
      linkOficial: linkOficial || null,
      expiresAt,
    };

    // Usar INSERT ... ON DUPLICATE KEY UPDATE para atualizar se já existir
    await db
      .insert(legislacaoCache)
      .values(cacheEntry)
      .onDuplicateKeyUpdate({
        set: {
          confiabilidade,
          motivo,
          linkOficial: linkOficial || null,
          expiresAt,
        },
      });

    return true;
  } catch (error) {
    console.error("[Cache] Erro ao salvar validação:", error);
    return false;
  }
}

/**
 * Limpa registros expirados do cache
 * Deve ser executado periodicamente (cron job)
 */
export async function cleanExpiredCache(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const now = new Date();
    const result = await db
      .delete(legislacaoCache)
      .where(lt(legislacaoCache.expiresAt, now));

    const rowsAffected = (result as any)[0]?.affectedRows || 0;
    console.log(`[Cache] ${rowsAffected} registros expirados removidos`);
    return rowsAffected;
  } catch (error) {
    console.error("[Cache] Erro ao limpar cache expirado:", error);
    return 0;
  }
}

/**
 * Obtém estatísticas do cache
 */
export async function getCacheStatistics(): Promise<{
  total: number;
  porTipo: Record<string, number>;
  porConfiabilidade: Record<string, number>;
}> {
  const db = await getDb();
  if (!db) {
    return { total: 0, porTipo: {}, porConfiabilidade: {} };
  }

  try {
    const allEntries = await db.select().from(legislacaoCache);

    const porTipo: Record<string, number> = {};
    const porConfiabilidade: Record<string, number> = {};

    allEntries.forEach((entry) => {
      porTipo[entry.tipo] = (porTipo[entry.tipo] || 0) + 1;
      porConfiabilidade[entry.confiabilidade] = (porConfiabilidade[entry.confiabilidade] || 0) + 1;
    });

    return {
      total: allEntries.length,
      porTipo,
      porConfiabilidade,
    };
  } catch (error) {
    console.error("[Cache] Erro ao obter estatísticas:", error);
    return { total: 0, porTipo: {}, porConfiabilidade: {} };
  }
}

/**
 * Popular cache com as 50 leis mais citadas na prática jurídica brasileira
 */
export async function populateCommonLaws(): Promise<number> {
  const commonLaws = [
    // Códigos fundamentais
    { citacao: "Lei 10.406/2002", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Código Civil", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm" },
    { citacao: "Lei 13.105/2015", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Código de Processo Civil", linkOficial: "http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm" },
    { citacao: "Lei 3.689/1941", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Código de Processo Penal", linkOficial: "http://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm" },
    { citacao: "Lei 2.848/1940", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Código Penal", linkOficial: "http://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm" },
    { citacao: "Lei 5.172/1966", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Código Tributário Nacional (CTN)", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm" },
    
    // Leis consumeristas
    { citacao: "Lei 8.078/90", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Código de Defesa do Consumidor", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm" },
    
    // Leis trabalhistas
    { citacao: "Lei 13.467/2017", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Reforma Trabalhista", linkOficial: "http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13467.htm" },
    { citacao: "Lei 8.036/90", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei do FGTS", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l8036consol.htm" },
    
    // Leis empresariais
    { citacao: "Lei 6.404/76", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei das Sociedades Anônimas", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l6404consol.htm" },
    { citacao: "Lei 11.101/2005", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei de Recuperação Judicial e Falência", linkOficial: "http://www.planalto.gov.br/ccivil_03/_ato2004-2006/2005/lei/l11101.htm" },
    { citacao: "Lei 8.934/94", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei do Registro Público de Empresas", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l8934.htm" },
    
    // Leis digitais e tecnologia
    { citacao: "Lei 13.709/2018", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei Geral de Proteção de Dados (LGPD)", linkOficial: "http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm" },
    { citacao: "Lei 12.965/2014", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Marco Civil da Internet", linkOficial: "http://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm" },
    { citacao: "Lei 12.737/2012", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei Carolina Dieckmann (Crimes Informáticos)", linkOficial: "http://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12737.htm" },
    
    // Leis de licitações e contratos públicos
    { citacao: "Lei 14.133/2021", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Nova Lei de Licitações e Contratos", linkOficial: "http://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm" },
    { citacao: "Lei 8.666/93", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei de Licitações (antiga)", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm" },
    
    // Leis tributárias
    { citacao: "Lei 101/2000", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei de Responsabilidade Fiscal", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/lcp/lcp101.htm" },
    { citacao: "Lei 5.869/73", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei de Execução Fiscal", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l6830.htm" },
    
    // Leis de família e sucessões
    { citacao: "Lei 8.069/90", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Estatuto da Criança e do Adolescente (ECA)", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l8069.htm" },
    { citacao: "Lei 10.741/2003", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Estatuto do Idoso", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/2003/l10.741.htm" },
    { citacao: "Lei 11.340/2006", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei Maria da Penha", linkOficial: "http://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11340.htm" },
    
    // Leis processuais especiais
    { citacao: "Lei 9.099/95", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei dos Juizados Especiais", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l9099.htm" },
    { citacao: "Lei 12.016/2009", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei do Mandado de Segurança", linkOficial: "http://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l12016.htm" },
    { citacao: "Lei 7.347/85", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei da Ação Civil Pública", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l7347orig.htm" },
    { citacao: "Lei 4.717/65", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei da Ação Popular", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l4717.htm" },
    
    // Leis imobiliárias
    { citacao: "Lei 8.245/91", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei do Inquilinato", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l8245.htm" },
    { citacao: "Lei 6.766/79", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei de Parcelamento do Solo Urbano", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l6766.htm" },
    { citacao: "Lei 4.591/64", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei de Condomínios e Incorporações", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l4591.htm" },
    
    // Leis ambientais
    { citacao: "Lei 9.605/98", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei de Crimes Ambientais", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l9605.htm" },
    { citacao: "Lei 12.651/2012", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Novo Código Florestal", linkOficial: "http://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12651.htm" },
    
    // Leis penais especiais
    { citacao: "Lei 11.343/2006", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei de Drogas", linkOficial: "http://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11343.htm" },
    { citacao: "Lei 9.613/98", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei de Lavagem de Dinheiro", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l9613.htm" },
    { citacao: "Lei 8.072/90", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei de Crimes Hediondos", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l8072.htm" },
    { citacao: "Lei 7.210/84", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei de Execução Penal", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l7210.htm" },
    
    // Leis administrativas
    { citacao: "Lei 8.429/92", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei de Improbidade Administrativa", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l8429.htm" },
    { citacao: "Lei 9.784/99", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei do Processo Administrativo Federal", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l9784.htm" },
    { citacao: "Lei 12.527/2011", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei de Acesso à Informação", linkOficial: "http://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm" },
    
    // Leis previdenciárias
    { citacao: "Lei 8.213/91", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei de Benefícios da Previdência Social", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l8213cons.htm" },
    { citacao: "Lei 8.212/91", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei de Custeio da Previdência Social", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l8212cons.htm" },
    
    // Leis eleitorais
    { citacao: "Lei 9.504/97", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei das Eleições", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l9504.htm" },
    { citacao: "Lei 9.096/95", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei dos Partidos Políticos", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l9096.htm" },
    
    // Leis bancárias e financeiras
    { citacao: "Lei 4.595/64", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei do Sistema Financeiro Nacional", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l4595.htm" },
    { citacao: "Lei 6.385/76", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei do Mercado de Capitais", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l6385.htm" },
    
    // Leis de propriedade intelectual
    { citacao: "Lei 9.279/96", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei de Propriedade Industrial", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l9279.htm" },
    { citacao: "Lei 9.610/98", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei de Direitos Autorais", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l9610.htm" },
    
    // Leis de saúde
    { citacao: "Lei 9.656/98", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei dos Planos de Saúde", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l9656.htm" },
    { citacao: "Lei 8.080/90", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei do Sistema Único de Saúde (SUS)", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l8080.htm" },
  ];

  let count = 0;
  for (const law of commonLaws) {
    const success = await setCachedValidation(
      law.citacao,
      law.tipo,
      law.confiabilidade,
      law.motivo,
      law.linkOficial,
      90 // 90 dias para leis comuns
    );
    if (success) count++;
  }

  console.log(`[Cache] ${count} leis comuns populadas no cache`);
  return count;
}
