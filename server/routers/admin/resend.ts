/**
 * Admin Sub-Router: Diagnóstico Resend
 * - Verifica status de configuração do Resend
 * - Testa conectividade
 */

import { router } from "../../_core/trpc";
import { adminProcedure } from "./shared";

export const adminResendRouter = router({
  /**
   * Verifica o status de configuração do Resend e testa conectividade
   * Retorna informações de diagnóstico sem expor a chave completa
   */
  diagnosticoResend: adminProcedure.query(async () => {
    const apiKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.EMAIL_FROM ?? null;
    const appUrl = process.env.VITE_APP_URL ?? null;

    const configurado = !!apiKey;
    const chavePreview = apiKey
      ? `${apiKey.slice(0, 6)}${'*'.repeat(Math.max(0, apiKey.length - 10))}${apiKey.slice(-4)}`
      : null;

    let dominioStatus: 'nao_configurado' | 'onboarding' | 'personalizado' = 'nao_configurado';
    let dominioRemetente: string | null = null;

    if (fromAddress) {
      const match = fromAddress.match(/@([\w.-]+)/);
      dominioRemetente = match ? match[1] : null;
      if (dominioRemetente) {
        if (dominioRemetente.includes('resend.dev') || dominioRemetente.includes('onboarding')) {
          dominioStatus = 'onboarding';
        } else {
          dominioStatus = 'personalizado';
        }
      }
    }

    let conectividade: 'ok' | 'erro' | 'sem_chave' = 'sem_chave';
    let erroConectividade: string | null = null;

    if (apiKey) {
      try {
        const resp = await fetch('https://api.resend.com/domains', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (resp.ok) {
          conectividade = 'ok';
        } else {
          const body = await resp.json().catch(() => ({})) as Record<string, unknown>;
          conectividade = 'erro';
          erroConectividade = (body as { message?: string }).message ?? `HTTP ${resp.status}`;
        }
      } catch (err: unknown) {
        conectividade = 'erro';
        erroConectividade = err instanceof Error ? err.message : 'Erro de rede';
      }
    }

    return {
      configurado,
      chavePreview,
      fromAddress,
      dominioRemetente,
      dominioStatus,
      conectividade,
      erroConectividade,
      appUrl,
      instrucoes: !configurado
        ? 'Configure RESEND_API_KEY em Settings → Secrets no painel do Manus.'
        : dominioStatus === 'onboarding'
        ? 'Domínio de onboarding detectado. Para produção, verifique um domínio próprio em resend.com/domains e atualize EMAIL_FROM.'
        : dominioStatus === 'personalizado' && conectividade === 'ok'
        ? 'Configuração OK. Domínio personalizado detectado e API acessível.'
        : null,
    };
  }),
});
