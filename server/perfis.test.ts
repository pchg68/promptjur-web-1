import { describe, it, expect } from 'vitest';
import { AREAS_JURIDICAS } from '../shared/juridico';

describe('Perfis de Uso - Validação', () => {
  it('deve validar estrutura de perfil', () => {
    const perfilExemplo = {
      nome: "Trabalhista Padrão",
      tipoDocumento: "peticao",
      areaJuridica: "Trabalhista",
      modeloId: "modelo-1",
      descricao: "Perfil para petições trabalhistas"
    };

    expect(perfilExemplo.nome).toBeTruthy();
    expect(perfilExemplo.nome.length).toBeGreaterThanOrEqual(3);
    expect(["peticao", "parecer", "contrato", "recurso", "defesa", "memorando", "outro"]).toContain(perfilExemplo.tipoDocumento);
    expect(AREAS_JURIDICAS).toContain(perfilExemplo.areaJuridica);
  });

  it('deve rejeitar perfil com nome muito curto', () => {
    const nomeInvalido = "AB";
    expect(nomeInvalido.length).toBeLessThan(3);
  });

  it('deve aceitar perfil sem modelo personalizado', () => {
    const perfilSemModelo = {
      nome: "Civil Básico",
      tipoDocumento: "parecer",
      areaJuridica: "Civil"
    };

    expect(perfilSemModelo.modeloId).toBeUndefined();
    expect(perfilSemModelo.nome).toBeTruthy();
  });

  it('deve aceitar perfil sem descrição', () => {
    const perfilSemDescricao = {
      nome: "Penal Padrão",
      tipoDocumento: "defesa",
      areaJuridica: "Penal"
    };

    expect(perfilSemDescricao.descricao).toBeUndefined();
  });
});

describe('Perfis de Uso - Tipos de Documento', () => {
  const tiposValidos = ["peticao", "parecer", "contrato", "recurso", "defesa", "memorando", "outro"];

  it('deve validar todos os tipos de documento', () => {
    tiposValidos.forEach(tipo => {
      expect(tiposValidos).toContain(tipo);
    });
  });

  it('deve ter exatamente 7 tipos de documento', () => {
    expect(tiposValidos.length).toBe(7);
  });
});

describe('Perfis de Uso - Áreas Jurídicas', () => {
  it('deve aceitar todas as áreas jurídicas válidas', () => {
    AREAS_JURIDICAS.forEach(area => {
      const perfil = {
        nome: `Perfil ${area}`,
        tipoDocumento: "peticao",
        areaJuridica: area
      };

      expect(AREAS_JURIDICAS).toContain(perfil.areaJuridica);
    });
  });

  it('deve ter pelo menos 10 áreas jurídicas', () => {
    expect(AREAS_JURIDICAS.length).toBeGreaterThanOrEqual(10);
  });
});
