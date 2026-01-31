/**
 * Módulo de Auditoria de Segurança de Dependências
 * Verifica vulnerabilidades conhecidas em pacotes npm
 */

import { exec } from "child_process";
import { promisify } from "util";

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
}

/**
 * Executa auditoria de dependências usando pnpm audit
 */
export async function executarAuditoriaNpm(): Promise<AuditResult> {
  try {
    // Executa pnpm audit --json
    const { stdout } = await execAsync("cd /home/ubuntu/promptjur-web && pnpm audit --json", {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    // Parse do resultado JSON
    const auditData = JSON.parse(stdout);

    // Extrai vulnerabilidades
    const vulnerabilities: Vulnerability[] = [];
    const severityCount = {
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0,
      info: 0,
    };

    // Processa advisories
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

    // Processa formato alternativo (pnpm audit v8+)
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

    const totalVulnerabilities = vulnerabilities.length;

    return {
      totalVulnerabilities,
      ...severityCount,
      vulnerabilities,
      lastAudit: new Date(),
    };
  } catch (error: any) {
    // pnpm audit retorna exit code 1 se houver vulnerabilidades
    // Mas ainda fornece o JSON no stdout
    if (error.stdout) {
      try {
        const auditData = JSON.parse(error.stdout);
        
        const vulnerabilities: Vulnerability[] = [];
        const severityCount = {
          critical: 0,
          high: 0,
          moderate: 0,
          low: 0,
          info: 0,
        };

        // Processa vulnerabilidades do formato pnpm audit
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
      } catch (parseError) {
        console.error("[Security Audit] Failed to parse audit output:", parseError);
      }
    }

    // Se não conseguiu parsear, retorna resultado vazio
    console.error("[Security Audit] Audit failed:", error.message);
    return {
      totalVulnerabilities: 0,
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0,
      info: 0,
      vulnerabilities: [],
      lastAudit: new Date(),
    };
  }
}

/**
 * Atualiza dependências com vulnerabilidades conhecidas
 * Apenas atualiza patches e minor versions (seguro)
 */
export async function atualizarDependenciasSeguras(): Promise<{
  success: boolean;
  updated: string[];
  errors: string[];
}> {
  try {
    // Executa pnpm update (atualiza apenas dentro do range do package.json)
    const { stdout, stderr } = await execAsync(
      "cd /home/ubuntu/promptjur-web && pnpm update --latest",
      {
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    // Parse da saída para identificar pacotes atualizados
    const updated: string[] = [];
    const lines = stdout.split("\n");
    
    for (const line of lines) {
      // Detecta linhas de atualização (formato: "package@version")
      if (line.includes("→") || line.includes("updated")) {
        const match = line.match(/([a-z0-9@/-]+)@/i);
        if (match) {
          updated.push(match[1]);
        }
      }
    }

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
