/**
 * Endpoint para o CI (GitHub Actions) salvar resultados de auditoria de dependências.
 * POST /api/ci/audit
 * 
 * Autenticação: Bearer token usando BUILT_IN_FORGE_API_KEY (mesmo token do CI)
 * ou um CI_AUDIT_TOKEN dedicado.
 */
import { Request, Response } from "express";
import { getDb } from "../db";
import { auditResults } from "../../drizzle/schema";
import { ENV } from "../_core/env";

interface CIAuditPayload {
  totalVulnerabilities: number;
  critical: number;
  high: number;
  moderate: number;
  low: number;
  info: number;
  vulnerabilities: Array<{
    name: string;
    severity: string;
    title: string;
    url?: string;
    range?: string;
    fixAvailable?: boolean;
  }>;
  commitRef?: string;
  durationMs?: number;
}

export async function handleCIAuditWebhook(req: Request, res: Response) {
  try {
    // Autenticação via Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.slice(7);
    const validToken = process.env.CI_AUDIT_TOKEN || ENV.forgeApiKey;

    if (!validToken || token !== validToken) {
      return res.status(403).json({ error: "Invalid token" });
    }

    const payload = req.body as CIAuditPayload;

    // Validação básica
    if (typeof payload.totalVulnerabilities !== "number") {
      return res.status(400).json({ error: "Invalid payload: totalVulnerabilities is required" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(503).json({ error: "Database not available" });
    }

    // Salvar no banco (limitar vulnerabilities a top 20)
    const vulnsToStore = (payload.vulnerabilities || []).slice(0, 20);

    await db.insert(auditResults).values({
      source: "ci",
      totalVulnerabilities: payload.totalVulnerabilities,
      critical: payload.critical || 0,
      high: payload.high || 0,
      moderate: payload.moderate || 0,
      low: payload.low || 0,
      info: payload.info || 0,
      vulnerabilities: vulnsToStore,
      commitRef: payload.commitRef || null,
      durationMs: payload.durationMs || null,
    });

    console.log(`[CI Audit] Resultado salvo: ${payload.totalVulnerabilities} vulnerabilidades (commit: ${payload.commitRef || 'N/A'})`);

    return res.json({
      success: true,
      stored: {
        totalVulnerabilities: payload.totalVulnerabilities,
        critical: payload.critical || 0,
        high: payload.high || 0,
      },
    });
  } catch (error: any) {
    console.error("[CI Audit] Erro ao processar webhook:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
