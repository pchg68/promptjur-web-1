/**
 * Teste de validação da RESEND_API_KEY
 * Verifica se a key tem Full Access (pode acessar GET /domains)
 */
import { describe, it, expect } from 'vitest';

const runExternalApiTests = process.env.RUN_EXTERNAL_API_TESTS === 'true';
const hasResendApiKey = !!process.env.RESEND_API_KEY;

describe('Resend API Key Validation', () => {
  it.skipIf(!hasResendApiKey)('deve ter RESEND_API_KEY configurada', () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).toBeTruthy();
    expect(apiKey!.startsWith('re_')).toBe(true);
  });

  it.skipIf(!runExternalApiTests || !hasResendApiKey)('deve conseguir acessar GET /domains (Full Access)', async () => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY não configurada');
    }

    const resp = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    // Full Access: deve retornar 200
    // Sending Only: retornaria 401/403
    expect(resp.status).toBe(200);

    const body = await resp.json();
    expect(body).toHaveProperty('data');
  });

  it.skipIf(!runExternalApiTests || !hasResendApiKey)('deve conseguir acessar GET /api-keys (Full Access)', async () => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY não configurada');
    }

    const resp = await fetch('https://api.resend.com/api-keys', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    expect(resp.status).toBe(200);
  });
});
