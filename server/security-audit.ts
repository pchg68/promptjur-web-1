/**
 * Módulo de Auditoria de Segurança de Dependências
 * - Cache de 24h para resultados locais
 * - Fallback para último resultado do CI quando pnpm indisponível
 * - Bloqueio de update em produção
 */

import { exec } from "child_process";
import { promisify } from "util";
import { getDb } from "./db";
import { auditResults } from "../drizzle/schema";
import { desc } from "drizzle-orm";

const execAsync = promisify(exec);

export interface Vulnerability {
  name: string;
  severity: "critical" | "high" | "moderate" | "low" | "info";
  title: string;
  url: string;
  range: string;
  fixAvailable: boolean;
  via: string[];
}

export interface AuditResult {
  totalVulnerabilities: number;
  critical: number;
  high: number;
  moderate: number;
  low: number;
  info: number;
  vulnerabilities: Vulnerability[];
  lastAudit: Date;
  unavailable?: boolean;
  message?: string;
  source?: "local" | "ci" | "cache";
}

// ─── Cache de 24h ─────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas
let cachedResult: AuditResult | null = null;
let cachedAt: number = 0;

function getCachedAudit(): AuditResult | null {
  if (cachedResult && Date.now() - cachedAt < CACHE_TTL_MS) {
    return { ...cachedResult, source: "cache" };
  }
  return null;
}

function setCachedAudit(result: AuditResult): void {
  cachedResult = result;
  cachedAt = Date.now();
}

// ─── Buscar último resultado do CI no banco ───────────────────────────────────
async function getLatestCIResult(): Promise<AuditResult | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const rows = await db
      .select()
      .from(auditResults)
      .orderBy(desc(auditResults.createdAt))
      .limit(1);

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      totalVulnerabilities: row.totalVulnerabilities,
      critical: row.critical,
      high: row.high,
      moderate: row.moderate,
      low: row.low,
      info: row.info,
      vulnerabilities: (row.vulnerabilities as Vulnerability[]) || [],
      lastAudit: row.createdAt,
      source: "ci",
    };
  } catch (error) {
    console.error("[Security Audit] Falha ao buscar resultado do CI:", error);
    return null;
  }
}

/**
 * Executa auditoria de dependências usando pnpm audit.
 * - Retorna cache se disponível (< 24h)
 * - Se pnpm indisponível, retorna último resultado do CI
 */
export async function executarAuditoriaNpm(): Promise<AuditResult> {
  // 1. Verificar cache
  const cached = getCachedAudit();
  if (cached) {
    console.log("[Security Audit] Retornando resultado do cache (< 24h)");
    return cached;
  }

  // 2. Verificar se pnpm está disponível
  try {
    await execAsync('which pnpm', { timeout: 5000 });
  } catch {
    console.warn('[Security Audit] pnpm não disponível — buscando último resultado do CI');
    
    // Fallback: buscar último resultado do CI no banco
    const ciResult = await getLatestCIResult();
    if (ciResult) {
      setCachedAudit(ciResult);
      return ciResult;
    }

    return {
      totalVulnerabilities: -1,
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0,
      info: 0,
      vulnerabilities: [],
      lastAudit: new Date(),
      unavailable: true,
      message: 'Auditoria não disponível neste ambiente e nenhum resultado do CI encontrado. Configure CI_AUDIT_TOKEN no GitHub Actions.',
    };
  }

  // 3. Executar pnpm audit
  try {
    const { stdout } = await execAsync(`cd ${process.cwd()} && pnpm audit --json`, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000,
    });

    const result = parseAuditOutput(stdout);
    result.source = "local";
    setCachedAudit(result);
    return result;
  } catch (error: any) {
    // pnpm audit retorna exit code 1 se houver vulnerabilidades
    if (error.stdout) {
      try {
        const result = parseAuditOutput(error.stdout);
        result.source = "local";
        setCachedAudit(result);
        return result;
      } catch (parseError) {
        console.error("[Security Audit] Failed to parse audit output:", parseError);
      }
    }

    // Fallback: tentar resultado do CI
    const ciResult = await getLatestCIResult();
    if (ciResult) {
      setCachedAudit(ciResult);
      return ciResult;
    }

    const isTimeout = error.killed || error.message?.includes('TIMEOUT');
    return {
      totalVulnerabilities: 0,
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0,
      info: 0,
      vulnerabilities: [],
      lastAudit: new Date(),
      unavailable: true,
      message: isTimeout
        ? 'Auditoria excedeu o tempo limite (30s). Tente novamente.'
        : `Erro na auditoria: ${error.message?.substring(0, 200)}`,
    };
  }
}

/**
 * Parse do output do pnpm audit --json
 */
function parseAuditOutput(stdout: string): AuditResult {
  const auditData = JSON.parse(stdout);
  const vulnerabilities: Vulnerability[] = [];
  const severityCount = { critical: 0, high: 0, moderate: 0, low: 0, info: 0 };

  // Formato advisories (pnpm < v8)
  if (auditData.advisories) {
    for (const [id, advisory] of Object.entries(auditData.advisories as any)) {
      const adv = advisory as any;
      const vuln: Vulnerability = {
        name: adv.module_name || "unknown",
        severity: adv.severity || "info",
        title: adv.title || "No title",
        url: adv.url || `https://npmjs.com/advisories/${id}`,
        range: adv.vulnerable_versions || "*",
        fixAvailable: adv.patched_versions !== "<0.0.0",
        via: adv.findings?.map((f: any) => f.version) || [],
      };
      vulnerabilities.push(vuln);
      severityCount[vuln.severity]++;
    }
  }

  // Formato vulnerabilities (pnpm v8+)
  if (auditData.vulnerabilities) {
    for (const [name, vulnData] of Object.entries(auditData.vulnerabilities as any)) {
      const vd = vulnData as any;
      const vuln: Vulnerability = {
        name,
        severity: vd.severity || "info",
        title: vd.title || `Vulnerability in ${name}`,
        url: vd.url || `https://npmjs.com/package/${name}`,
        range: vd.range || "*",
        fixAvailable: vd.fixAvailable !== false,
        via: Array.isArray(vd.via) ? vd.via.map((v: any) => typeof v === "string" ? v : v.name) : [],
      };
      vulnerabilities.push(vuln);
      severityCount[vuln.severity]++;
    }
  }

  return {
    totalVulnerabilities: vulnerabilities.length,
    ...severityCount,
    vulnerabilities,
    lastAudit: new Date(),
  };
}

/**
 * Atualiza dependências com vulnerabilidades conhecidas.
 * BLOQUEADO em produção para evitar instabilidade.
 */
export async function atualizarDependenciasSeguras(): Promise<{
  success: boolean;
  updated: string[];
  errors: string[];
  blocked?: boolean;
}> {
  // Bloquear em produção
  if (process.env.NODE_ENV === "production") {
    return {
      success: false,
      updated: [],
      errors: [],
      blocked: true,
    };
  }

  try {
    // Verifica se pnpm está disponível
    try {
      await execAsync('which pnpm', { timeout: 5000 });
    } catch {
      return {
        success: false,
        updated: [],
        errors: ['pnpm não disponível neste ambiente. Execute localmente com: pnpm update'],
      };
    }

    // Executa pnpm update
    const { stdout, stderr } = await execAsync(
      `cd ${process.cwd()} && pnpm update --latest`,
      {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 60000,
      }
    );

    const updated: string[] = [];
    const lines = stdout.split("\n");
    
    for (const line of lines) {
      if (line.includes("→") || line.includes("updated")) {
        const match = line.match(/([a-z0-9@/-]+)@/i);
        if (match) {
          updated.push(match[1]);
        }
      }
    }

    // Invalidar cache após update
    cachedResult = null;
    cachedAt = 0;

    return {
      success: true,
      updated,
      errors: stderr ? [stderr] : [],
    };
  } catch (error: any) {
    console.error("[Security Audit] Update failed:", error);
    return {
      success: false,
      updated: [],
      errors: [error.message],
    };
  }
}

/**
 * Retorna o último resultado de auditoria do CI armazenado no banco.
 * Usado pelo frontend para exibir dados mesmo quando pnpm indisponível.
 */
export async function getUltimoResultadoCI(): Promise<AuditResult | null> {
  return getLatestCIResult();
}
