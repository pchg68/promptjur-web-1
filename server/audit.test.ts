import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logAuditoria, listarLogs, getStatsAuditoria } from './audit';
import * as db from './db';

// Mock do módulo db
vi.mock('./db', () => ({
  getDb: vi.fn(),
}));

describe('Audit System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logAuditoria', () => {
    it('deve registrar ação de auditoria com sucesso', async () => {
      const mockDb = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined),
        }),
      };
      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      await logAuditoria({
        userId: 1,
        acao: 'limpar_cache',
        descricao: 'Cache limpo manualmente',
        metadata: { cacheSize: 100 },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('deve lidar com erro ao registrar log', async () => {
      vi.mocked(db.getDb).mockResolvedValue(null);

      await expect(
        logAuditoria({
          userId: 1,
          acao: 'test',
          descricao: 'test',
        })
      ).resolves.not.toThrow();
    });
  });

  describe('listarLogs', () => {
    it('deve listar logs com filtros', async () => {
      const mockLogs = [
        {
          id: 1,
          userId: 1,
          acao: 'limpar_cache',
          descricao: 'Cache limpo',
          metadata: null,
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date().toISOString(),
        },
      ];

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(mockLogs),
              }),
            }),
          }),
        }),
      };
      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await listarLogs({ limit: 10 });

      expect(result).toEqual(mockLogs);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('deve retornar array vazio quando banco não disponível', async () => {
      vi.mocked(db.getDb).mockResolvedValue(null);

      const result = await listarLogs({});

      expect(result).toEqual([]);
    });
  });

  describe('getStatsAuditoria', () => {
    it('deve retornar estatísticas de auditoria', async () => {
      const mockStats = [
        { acao: 'limpar_cache', count: 5 },
        { acao: 'executar_testes', count: 3 },
      ];

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockStats),
            }),
          }),
        }),
      };
      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await getStatsAuditoria();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('acao');
      expect(result[0]).toHaveProperty('count');
    });
  });
});
