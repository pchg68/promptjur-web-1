/**
 * Admin Sub-Router: Diagnóstico Resend
 * - Verifica status de configuração do Resend
 * - Testa conectividade (compatível com API keys restritas a envio)
 */

import { router } from "../../_core/trpc";
import { adminProcedure } from "./shared";

export const adminResendRouter = router({
  /**
   * Verifica o status de configuração do Resend e testa conectividade.
   * 
   * NOTA: A API key pode ser restrita a "sending access only", o que bloqueia
   * endpoints como GET /domains, GET /api-keys, etc. Para testar conectividade
   * de forma confiável, tentamos primeiro GET /domains (full access) e, se falhar
   * com 401 "restricted_api_key", fazemos um teste alternativo validando o formato
   * da chave e considerando como "ok_restrita" (a key funciona para envio).
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

    let conectividade: 'ok' | 'ok_restrita' | 'erro' | 'sem_chave' = 'sem_chave';
    let erroConectividade: string | null = null;
    let tipoChave: 'full_access' | 'sending_only' | 'desconhecido' = 'desconhecido';

    if (apiKey) {
      try {
        // Primeiro, tenta GET /domains (funciona com full access keys)
        const resp = await fetch('https://api.resend.com/domains', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (resp.ok) {
          conectividade = 'ok';
          tipoChave = 'full_access';
        } else {
          const body = await resp.json().catch(() => ({})) as Record<string, unknown>;
          const message = (body as { name?: string; message?: string }).name ?? '';

          if (message === 'restricted_api_key' || resp.status === 401) {
            // A key é restrita a envio — isso é normal e esperado.
            // Validamos que a key tem formato correto (re_xxxx) e consideramos funcional.
            if (apiKey.startsWith('re_') && apiKey.length > 10) {
              conectividade = 'ok_restrita';
              tipoChave = 'sending_only';
            } else {
              conectividade = 'erro';
              erroConectividade = 'Formato de API key inválido';
            }
          } else if (resp.status === 403) {
            conectividade = 'erro';
            erroConectividade = 'API key sem permissão (403 Forbidden)';
          } else {
            conectividade = 'erro';
            erroConectividade = (body as { message?: string }).message ?? `HTTP ${resp.status}`;
          }
        }
      } catch (err: unknown) {
        conectividade = 'erro';
        erroConectividade = err instanceof Error ? err.message : 'Erro de rede ao conectar com Resend';
      }
    }

    // Gerar instruções contextuais
    let instrucoes: string | null = null;
    if (!configurado) {
      instrucoes = 'Configure RESEND_API_KEY em Settings → Secrets no painel do Manus.';
    } else if (conectividade === 'erro') {
      instrucoes = `Erro na conectividade: ${erroConectividade}. Verifique a API key em resend.com/api-keys.`;
    } else if (conectividade === 'ok_restrita') {
      instrucoes = dominioStatus === 'onboarding'
        ? 'API key funcional (restrita a envio). Domínio de onboarding detectado — para produção, verifique um domínio próprio em resend.com/domains e atualize EMAIL_FROM.'
        : 'API key funcional (restrita a envio). Para diagnóstico completo (domínios, logs), use uma key com Full Access em resend.com/api-keys.';
    } else if (dominioStatus === 'onboarding') {
      instrucoes = 'Domínio de onboarding detectado. Para produção, verifique um domínio próprio em resend.com/domains e atualize EMAIL_FROM.';
    } else if (dominioStatus === 'personalizado' && (conectividade === 'ok' || conectividade === 'ok_restrita')) {
      instrucoes = 'Configuração OK. Domínio personalizado detectado e API acessível.';
    }

    return {
      configurado,
      chavePreview,
      fromAddress,
      dominioRemetente,
      dominioStatus,
      conectividade,
      erroConectividade,
      tipoChave,
      appUrl,
      instrucoes,
    };
  }),
});
