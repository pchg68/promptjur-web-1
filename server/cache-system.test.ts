/**
 * Testes para o sistema de cache de validação de legislação
 */

import { describe, it, expect } from 'vitest';
import { getCachedValidation, setCachedValidation, getCacheStatistics, cleanExpiredCache, populateCommonLaws } from '../server/db-legislacao-cache';

describe('Sistema de Cache de Legislação', () => {
  it('deve salvar e recuperar validação do cache', async () => {
    const citacao = 'Lei 8.078/90';
    const tipo = 'lei';
    const confiabilidade = 'alta';
    const motivo = 'Código de Defesa do Consumidor';
    const linkOficial = 'http://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm';

    // Salvar no cache
    const saved = await setCachedValidation(citacao, tipo, confiabilidade, motivo, linkOficial);
    expect(saved).toBe(true);

    // Recuperar do cache
    const cached = await getCachedValidation(citacao);
    expect(cached).not.toBeNull();
    expect(cached?.citacao).toBe(citacao);
    expect(cached?.tipo).toBe(tipo);
    expect(cached?.confiabilidade).toBe(confiabilidade);
    expect(cached?.motivo).toBe(motivo);
  });

  it('deve retornar estatísticas do cache', async () => {
    const stats = await getCacheStatistics();
    
    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('porTipo');
    expect(stats).toHaveProperty('porConfiabilidade');
    expect(typeof stats.total).toBe('number');
    expect(stats.total).toBeGreaterThanOrEqual(0);
  });

  it('deve popular cache com leis comuns', async () => {
    const count = await populateCommonLaws();
    
    // Deve popular pelo menos 40 leis (das 50 planejadas)
    expect(count).toBeGreaterThanOrEqual(40);
    
    // Verificar se algumas leis específicas foram adicionadas
    const cdc = await getCachedValidation('Lei 8.078/90');
    expect(cdc).not.toBeNull();
    expect(cdc?.motivo).toContain('Consumidor');
    
    const lgpd = await getCachedValidation('Lei 13.709/2018');
    expect(lgpd).not.toBeNull();
    expect(lgpd?.motivo).toContain('LGPD');
  });

  it('deve limpar cache expirado', async () => {
    // Executar limpeza
    const removed = await cleanExpiredCache();
    
    // Deve retornar número de registros removidos (pode ser 0 se nenhum expirou)
    expect(typeof removed).toBe('number');
    expect(removed).toBeGreaterThanOrEqual(0);
  });

  it('deve retornar null para citação não encontrada', async () => {
    const cached = await getCachedValidation('Lei Inexistente 99999/9999');
    expect(cached).toBeNull();
  });

  it('deve atualizar cache existente', async () => {
    const citacao = 'Lei 10.406/2002';
    
    // Primeira inserção
    await setCachedValidation(citacao, 'lei', 'alta', 'Código Civil v1', 'http://example.com');
    
    // Atualização
    await setCachedValidation(citacao, 'lei', 'alta', 'Código Civil v2 atualizado', 'http://planalto.gov.br');
    
    // Verificar atualização
    const cached = await getCachedValidation(citacao);
    expect(cached?.motivo).toBe('Código Civil v2 atualizado');
  });
});
