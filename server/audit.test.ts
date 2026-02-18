import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logAuditoria, listarLogs, getAuditStats } from './audit';
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
          values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
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
      ).rejects.toThrow('Database not available');
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
          createdAt: new Date(),
        },
      ];

      // Mock que simula query sem where (sem filtros)
      const mockQuery = {
        where: vi.fn().mockResolvedValue(mockLogs)
      };
      
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(mockQuery),
            }),
          }),
        }),
      };
      
      // Mock para query sem where (retorna promise diretamente)
      Object.assign(mockQuery, {
        then: (resolve: any) => resolve(mockLogs)
      });
      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await listarLogs({ limit: 10 });

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('acao', 'limpar_cache');
      expect(result[0]).toHaveProperty('createdAt');
      expect(typeof result[0].createdAt).toBe('string'); // Convertido para ISO string
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('deve retornar array vazio quando banco não disponível', async () => {
      vi.mocked(db.getDb).mockResolvedValue(null);

      const result = await listarLogs({});

      expect(result).toEqual([]);
    });
  });

  describe('getAuditStats', () => {
    it('deve retornar estatísticas de auditoria', async () => {
      const mockLogs = [
        { id: 1, userId: 1, acao: 'limpar_cache', descricao: 'Cache limpo', metadata: null, ipAddress: '127.0.0.1', userAgent: 'Mozilla', createdAt: new Date() },
        { id: 2, userId: 1, acao: 'limpar_cache', descricao: 'Cache limpo', metadata: null, ipAddress: '127.0.0.1', userAgent: 'Mozilla', createdAt: new Date() },
        { id: 3, userId: 1, acao: 'executar_testes', descricao: 'Testes executados', metadata: null, ipAddress: '127.0.0.1', userAgent: 'Mozilla', createdAt: new Date() },
      ];

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockResolvedValue(mockLogs),
        }),
      };
      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await getAuditStats();

      expect(result).toHaveProperty('totalLogs');
      expect(result).toHaveProperty('acoesUnicas');
      expect(result).toHaveProperty('topAcoes');
      expect(result.totalLogs).toBe(3);
      expect(result.topAcoes).toHaveLength(2);
    });
  });
});
