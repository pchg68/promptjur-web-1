/**
 * Sistema de Feature Flags
 * Controla ativação/desativação de funcionalidades experimentais
 */

import { eq } from "drizzle-orm";
import { featureFlags, InsertFeatureFlag } from "../drizzle/schema";
import { getDb } from "./db";

// Cache em memória para evitar queries repetidas
const flagCache = new Map<string, boolean>();
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 1 minuto

/**
 * Verifica se uma feature está ativa
 */
export async function isFeatureEnabled(nome: string): Promise<boolean> {
  // Verificar cache
  const now = Date.now();
  if (now - cacheTimestamp < CACHE_TTL && flagCache.has(nome)) {
    return flagCache.get(nome)!;
  }

  const db = await getDb();
  if (!db) return false;

  const resultado = await db
    .select()
    .from(featureFlags)
    .where(eq(featureFlags.nome, nome))
    .limit(1);

  const isAtivo = resultado.length > 0 ? resultado[0].isAtivo : false;
  
  // Atualizar cache
  flagCache.set(nome, isAtivo);
  cacheTimestamp = now;

  return isAtivo;
}

/**
 * Lista todas as feature flags
 */
export async function listarFeatures() {
  const db = await getDb();
  if (!db) return [];

  const flags = await db.select().from(featureFlags);
  
  // Converter Date para string
  return flags.map(flag => ({
    ...flag,
    createdAt: flag.createdAt.toISOString(),
    updatedAt: flag.updatedAt.toISOString()
  }));
}

/**
 * Ativa/desativa uma feature flag
 */
export async function toggleFeature(nome: string): Promise<{ nome: string; isAtivo: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar flag atual
  const resultado = await db
    .select()
    .from(featureFlags)
    .where(eq(featureFlags.nome, nome))
    .limit(1);

  if (resultado.length === 0) {
    throw new Error(`Feature flag "${nome}" não encontrada`);
  }

  const novoEstado = !resultado[0].isAtivo;

  // Atualizar no banco
  await db
    .update(featureFlags)
    .set({ isAtivo: novoEstado })
    .where(eq(featureFlags.nome, nome));

  // Limpar cache
  flagCache.delete(nome);

  return { nome, isAtivo: novoEstado };
}

/**
 * Cria uma nova feature flag
 */
export async function criarFeature(params: {
  nome: string;
  descricao?: string;
  isAtivo?: boolean;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const flagData: InsertFeatureFlag = {
    nome: params.nome,
    descricao: params.descricao,
    isAtivo: params.isAtivo ?? false
  };

  const resultado = await db.insert(featureFlags).values(flagData).returning({ id: featureFlags.id });

  // Limpar cache
  flagCache.clear();

  return resultado[0].id;
}

/**
 * Inicializa feature flags padrão se não existirem
 */
export async function inicializarFeatures() {
  const db = await getDb();
  if (!db) return;

  const featuresDefault = [
    {
      nome: "knowledge_retrieval",
      descricao: "Busca de precedentes no DataJud e cálculo de prazos processuais",
      isAtivo: true
    },
    {
      nome: "modelos_premium",
      descricao: "Acesso a modelos de IA premium (GPT-4, Claude, etc)",
      isAtivo: false
    },
    {
      nome: "notificacoes",
      descricao: "Sistema de notificações em tempo real",
      isAtivo: true
    },
    {
      nome: "exportacao_avancada",
      descricao: "Exportação de prompts em múltiplos formatos (PDF, DOCX, JSON)",
      isAtivo: true
    },
    {
      nome: "colaboracao",
      descricao: "Compartilhamento e colaboração em prompts entre usuários",
      isAtivo: false
    },
    {
      nome: "whitelist_ativa",
      descricao: "Controla o acesso ao sistema: quando ATIVO, somente e-mails cadastrados na whitelist podem entrar; quando INATIVO, qualquer usuário pode acessar livremente.",
      isAtivo: false
    },
    {
      nome: "pagamentos_ativos",
      descricao: "Habilita o sistema de pagamentos e assinaturas via Stripe. Desative durante testes para bloquear o checkout.",
      isAtivo: false
    }
  ];

  for (const feature of featuresDefault) {
    const existe = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.nome, feature.nome))
      .limit(1);

    if (existe.length === 0) {
      await db.insert(featureFlags).values(feature);
    }
  }
}

/**
 * Limpa o cache de feature flags
 */
export function limparCacheFeatures() {
  const tamanho = flagCache.size;
  flagCache.clear();
  cacheTimestamp = 0;
  return { entradasRemovidas: tamanho };
}
