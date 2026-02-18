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
      registrarMetrica({ rota: 'auth.me', duracao: 150 });

      const metricas = getMetricasPorRota();

      expect(metricas).toBeDefined();
      expect(metricas.length).toBeGreaterThan(0);
      const authMetric = metricas.find(m => m.rota === 'auth.me');
      expect(authMetric).toBeDefined();
      expect(authMetric?.total).toBe(1);
      expect(authMetric?.media).toBe(150);
    });

    it('deve calcular média corretamente após múltiplas métricas', () => {
      registrarMetrica({ rota: 'prompts.listar', duracao: 100 });
      registrarMetrica({ rota: 'prompts.listar', duracao: 200 });
      registrarMetrica({ rota: 'prompts.listar', duracao: 300 });

      const metricas = getMetricasPorRota();
      const promptMetric = metricas.find(m => m.rota === 'prompts.listar');

      expect(promptMetric?.total).toBe(3);
      expect(promptMetric?.media).toBe(200);
      expect(promptMetric?.min).toBe(100);
      expect(promptMetric?.max).toBe(300);
    });

    it('deve calcular percentis corretamente', () => {
      // Adicionar 100 métricas para testar percentis
      for (let i = 1; i <= 100; i++) {
        registrarMetrica({ rota: 'test.route', duracao: i });
      }

      const metricas = getMetricasPorRota();
      const testMetric = metricas.find(m => m.rota === 'test.route');

      expect(testMetric?.p50).toBeGreaterThan(45);
      expect(testMetric?.p50).toBeLessThan(55);
      expect(testMetric?.p95).toBeGreaterThan(90);
      expect(testMetric?.p99).toBeGreaterThan(95);
    });
  });

  describe('getStatsPerformance', () => {
    it('deve retornar estatísticas gerais', () => {
      registrarMetrica({ rota: 'route1', duracao: 100 });
      registrarMetrica({ rota: 'route2', duracao: 200 });
      registrarMetrica({ rota: 'route3', duracao: 300 });

      const stats = getStatsPerformance();

      expect(stats.rotasUnicas).toBe(3);
      expect(stats.totalRequisicoes).toBe(3);
      expect(stats.duracaoMedia).toBe(200);
    });

    it('deve identificar rota mais lenta', () => {
      registrarMetrica({ rota: 'fast', duracao: 50 });
      registrarMetrica({ rota: 'slow', duracao: 500 });
      registrarMetrica({ rota: 'medium', duracao: 200 });

      const stats = getStatsPerformance();

      expect(stats.rotaMaisLenta).toHaveProperty('rota');
      expect(stats.rotaMaisLenta?.rota).toBe('slow');
    });
  });

  describe('limparMetricas', () => {
    it('deve limpar todas as métricas', () => {
      registrarMetrica({ rota: 'test1', duracao: 100 });
      registrarMetrica({ rota: 'test2', duracao: 200 });

      let stats = getStatsPerformance();
      expect(stats.rotasUnicas).toBe(2);

      limparMetricas();

      stats = getStatsPerformance();
      expect(stats.rotasUnicas).toBe(0);
      expect(stats.totalRequisicoes).toBe(0);
    });
  });

  describe('Limites de armazenamento', () => {
    it('deve respeitar limite de 1000 métricas por rota', () => {
      // Adicionar mais de 1000 métricas
      for (let i = 0; i < 1500; i++) {
        registrarMetrica({ rota: 'test.limit', duracao: i });
      }

      const stats = getStatsPerformance();

      // Deve manter apenas as últimas 1000 métricas no total
      expect(stats.totalRequisicoes).toBeLessThanOrEqual(1000);
    });
  });
});
