import { describe, it, expect, beforeEach } from 'vitest';
import {
  registrarMetrica,
  getMetricasPorRota,
  getStatsPerformance,
  limparMetricas,
} from './performance';

describe('Performance Monitoring', () => {
  beforeEach(() => {
    limparMetricas();
  });

  describe('registrarMetrica', () => {
    it('deve registrar métrica de performance', () => {
      registrarMetrica('auth.me', 150);

      const metricas = getMetricasPorRota('auth.me');

      expect(metricas).toBeDefined();
      expect(metricas?.count).toBe(1);
      expect(metricas?.avg).toBe(150);
    });

    it('deve calcular média corretamente após múltiplas métricas', () => {
      registrarMetrica('prompts.listar', 100);
      registrarMetrica('prompts.listar', 200);
      registrarMetrica('prompts.listar', 300);

      const metricas = getMetricasPorRota('prompts.listar');

      expect(metricas?.count).toBe(3);
      expect(metricas?.avg).toBe(200);
      expect(metricas?.min).toBe(100);
      expect(metricas?.max).toBe(300);
    });

    it('deve calcular percentis corretamente', () => {
      // Adicionar 100 métricas para testar percentis
      for (let i = 1; i <= 100; i++) {
        registrarMetrica('test.route', i);
      }

      const metricas = getMetricasPorRota('test.route');

      expect(metricas?.p50).toBeGreaterThan(45);
      expect(metricas?.p50).toBeLessThan(55);
      expect(metricas?.p95).toBeGreaterThan(90);
      expect(metricas?.p99).toBeGreaterThan(95);
    });
  });

  describe('getStatsPerformance', () => {
    it('deve retornar estatísticas gerais', () => {
      registrarMetrica('route1', 100);
      registrarMetrica('route2', 200);
      registrarMetrica('route3', 300);

      const stats = getStatsPerformance();

      expect(stats.totalRotas).toBe(3);
      expect(stats.totalRequisicoes).toBe(3);
      expect(stats.tempoMedio).toBe(200);
    });

    it('deve identificar rota mais lenta', () => {
      registrarMetrica('fast', 50);
      registrarMetrica('slow', 500);
      registrarMetrica('medium', 200);

      const stats = getStatsPerformance();

      expect(stats.rotaMaisLenta).toBe('slow');
    });
  });

  describe('limparMetricas', () => {
    it('deve limpar todas as métricas', () => {
      registrarMetrica('test1', 100);
      registrarMetrica('test2', 200);

      let stats = getStatsPerformance();
      expect(stats.totalRotas).toBe(2);

      limparMetricas();

      stats = getStatsPerformance();
      expect(stats.totalRotas).toBe(0);
      expect(stats.totalRequisicoes).toBe(0);
    });
  });

  describe('Limites de armazenamento', () => {
    it('deve respeitar limite de 1000 métricas por rota', () => {
      // Adicionar mais de 1000 métricas
      for (let i = 0; i < 1500; i++) {
        registrarMetrica('test.limit', i);
      }

      const metricas = getMetricasPorRota('test.limit');

      // Deve manter apenas as últimas 1000
      expect(metricas?.count).toBeLessThanOrEqual(1000);
    });
  });
});
