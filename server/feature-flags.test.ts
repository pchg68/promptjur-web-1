import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isFeatureEnabled, toggleFeature, criarFeature } from './feature-flags';
import * as db from './db';

vi.mock('./db', () => ({
  getDb: vi.fn(),
}));

describe('Feature Flags System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isFeatureEnabled', () => {
    it('deve retornar true para feature ativa', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ isAtivo: 1 }]),
            }),
          }),
        }),
      };
      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await isFeatureEnabled('knowledge_retrieval');

      expect(result).toBe(true);
    });

    it('deve retornar false para feature inativa', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ isAtivo: 0 }]),
            }),
          }),
        }),
      };
      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await isFeatureEnabled('modelos_premium');

      expect(result).toBe(false);
    });

    it('deve retornar false se feature não existir', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };
      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await isFeatureEnabled('feature_inexistente');

      expect(result).toBe(false);
    });

    it('deve retornar false se banco não disponível', async () => {
      vi.mocked(db.getDb).mockResolvedValue(null);

      const result = await isFeatureEnabled('test');

      expect(result).toBe(false);
    });
  });

  describe('toggleFeature', () => {
    it('deve alternar status da feature', async () => {
      const mockDb = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      };
      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      await toggleFeature('knowledge_retrieval', true);

      expect(mockDb.update).toHaveBeenCalled();
    });

    it('deve lidar com erro ao alternar feature', async () => {
      vi.mocked(db.getDb).mockResolvedValue(null);

      await expect(
        toggleFeature('test', true)
      ).resolves.not.toThrow();
    });
  });

  describe('criarFeature', () => {
    it('deve criar nova feature', async () => {
      const mockDb = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined),
        }),
      };
      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      await criarFeature({
        nome: 'nova_feature',
        descricao: 'Descrição da feature',
        isAtivo: true,
      });

      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('deve criar feature inativa por padrão', async () => {
      const mockDb = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockImplementation((values) => {
            expect(values.isAtivo).toBe(0);
            return Promise.resolve();
          }),
        }),
      };
      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      await criarFeature({
        nome: 'feature_inativa',
        descricao: 'Feature inativa',
        isAtivo: false,
      });
    });
  });
});
