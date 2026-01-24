import { describe, it, expect } from 'vitest';
import { AREAS_JURIDICAS, PALAVRAS_CHAVE_AREAS } from '../juridico';

/**
 * Testes para constantes e tipos de áreas jurídicas
 */

describe('AREAS_JURIDICAS', () => {
  it('deve conter todas as 16 áreas jurídicas esperadas', () => {
    expect(AREAS_JURIDICAS).toHaveLength(16);
  });

  it('deve incluir áreas jurídicas principais', () => {
    const areasEsperadas = [
      'Civil',
      'Penal',
      'Trabalhista',
      'Tributário',
      'Administrativo',
      'Constitucional',
      'Empresarial',
      'Consumidor',
      'Família',
      'Previdenciário',
      'Ambiental',
      'Internacional',
      'Processo Civil',
      'Direito Médico',
      'Direito Digital',
      'Direito Internacional'
    ];

    areasEsperadas.forEach(area => {
      expect(AREAS_JURIDICAS).toContain(area);
    });
  });

  it('não deve conter áreas duplicadas', () => {
    const areasUnicas = new Set(AREAS_JURIDICAS);
    expect(areasUnicas.size).toBe(AREAS_JURIDICAS.length);
  });

  it('todas as áreas devem ser strings não vazias', () => {
    AREAS_JURIDICAS.forEach(area => {
      expect(typeof area).toBe('string');
      expect(area.length).toBeGreaterThan(0);
      expect(area.trim()).toBe(area); // Sem espaços extras
    });
  });
});

describe('PALAVRAS_CHAVE_AREAS', () => {
  it('deve ter palavras-chave para todas as áreas jurídicas', () => {
    AREAS_JURIDICAS.forEach(area => {
      expect(PALAVRAS_CHAVE_AREAS[area]).toBeDefined();
      expect(Array.isArray(PALAVRAS_CHAVE_AREAS[area])).toBe(true);
    });
  });

  it('cada área deve ter pelo menos 5 palavras-chave', () => {
    Object.entries(PALAVRAS_CHAVE_AREAS).forEach(([area, palavras]) => {
      expect(palavras.length).toBeGreaterThanOrEqual(5);
    });
  });

  it('palavras-chave devem ser strings não vazias', () => {
    Object.entries(PALAVRAS_CHAVE_AREAS).forEach(([area, palavras]) => {
      palavras.forEach(palavra => {
        expect(typeof palavra).toBe('string');
        expect(palavra.length).toBeGreaterThan(0);
      });
    });
  });

  it('palavras-chave de Civil devem incluir termos relevantes', () => {
    const palavrasCivil = PALAVRAS_CHAVE_AREAS['Civil'];
    const termosEsperados = ['contrato', 'responsabilidade civil', 'código civil'];
    
    termosEsperados.forEach(termo => {
      expect(palavrasCivil.some(p => p.toLowerCase().includes(termo.toLowerCase()))).toBe(true);
    });
  });

  it('palavras-chave de Penal devem incluir termos relevantes', () => {
    const palavrasPenal = PALAVRAS_CHAVE_AREAS['Penal'];
    const termosEsperados = ['crime', 'código penal', 'réu'];
    
    termosEsperados.forEach(termo => {
      expect(palavrasPenal.some(p => p.toLowerCase().includes(termo.toLowerCase()))).toBe(true);
    });
  });

  it('palavras-chave de Trabalhista devem incluir termos relevantes', () => {
    const palavrasTrabalhista = PALAVRAS_CHAVE_AREAS['Trabalhista'];
    const termosEsperados = ['empregado', 'CLT', 'salário'];
    
    termosEsperados.forEach(termo => {
      expect(palavrasTrabalhista.some(p => p.toLowerCase().includes(termo.toLowerCase()))).toBe(true);
    });
  });

  it('palavras-chave de Processo Civil devem ser distintas de Civil', () => {
    const palavrasProcessoCivil = PALAVRAS_CHAVE_AREAS['Processo Civil'];
    const termosProcessuais = ['CPC', 'petição', 'recurso', 'sentença'];
    
    termosProcessuais.forEach(termo => {
      expect(palavrasProcessoCivil.some(p => p.toLowerCase().includes(termo.toLowerCase()))).toBe(true);
    });
  });

  it('palavras-chave de Direito Digital devem incluir termos tecnológicos', () => {
    const palavrasDigital = PALAVRAS_CHAVE_AREAS['Direito Digital'];
    const termosEsperados = ['LGPD', 'dados pessoais', 'internet'];
    
    termosEsperados.forEach(termo => {
      expect(palavrasDigital.some(p => p.toLowerCase().includes(termo.toLowerCase()))).toBe(true);
    });
  });

  it('não deve haver sobreposição excessiva entre áreas', () => {
    // Verificar que áreas distintas têm palavras-chave distintas
    const palavrasCivil = new Set(PALAVRAS_CHAVE_AREAS['Civil'].map(p => p.toLowerCase()));
    const palavrasPenal = new Set(PALAVRAS_CHAVE_AREAS['Penal'].map(p => p.toLowerCase()));
    
    // Calcular interseção
    const intersecao = [...palavrasCivil].filter(p => palavrasPenal.has(p));
    
    // Deve haver no máximo 20% de sobreposição
    const porcentagemSobreposicao = intersecao.length / Math.min(palavrasCivil.size, palavrasPenal.size);
    expect(porcentagemSobreposicao).toBeLessThan(0.2);
  });
});

describe('Validação de Tipos', () => {
  it('AREAS_JURIDICAS deve ser readonly', () => {
    // TypeScript garante isso em tempo de compilação
    // Aqui verificamos que é um array
    expect(Array.isArray(AREAS_JURIDICAS)).toBe(true);
  });

  it('deve ser possível usar AREAS_JURIDICAS em validação de enum', () => {
    const areaValida = 'Civil';
    const areaInvalida = 'Área Inexistente';
    
    expect(AREAS_JURIDICAS.includes(areaValida as any)).toBe(true);
    expect(AREAS_JURIDICAS.includes(areaInvalida as any)).toBe(false);
  });

  it('deve validar área jurídica corretamente', () => {
    function isAreaJuridicaValida(area: string): boolean {
      return AREAS_JURIDICAS.includes(area as any);
    }

    expect(isAreaJuridicaValida('Civil')).toBe(true);
    expect(isAreaJuridicaValida('Penal')).toBe(true);
    expect(isAreaJuridicaValida('Processo Civil')).toBe(true);
    expect(isAreaJuridicaValida('Direito Digital')).toBe(true);
    expect(isAreaJuridicaValida('Área Inválida')).toBe(false);
    expect(isAreaJuridicaValida('')).toBe(false);
  });
});

describe('Consistência de Dados', () => {
  it('todas as áreas em PALAVRAS_CHAVE_AREAS devem estar em AREAS_JURIDICAS', () => {
    const areasComPalavrasChave = Object.keys(PALAVRAS_CHAVE_AREAS);
    
    areasComPalavrasChave.forEach(area => {
      expect(AREAS_JURIDICAS.includes(area as any)).toBe(true);
    });
  });

  it('todas as áreas em AREAS_JURIDICAS devem ter palavras-chave', () => {
    AREAS_JURIDICAS.forEach(area => {
      expect(PALAVRAS_CHAVE_AREAS[area]).toBeDefined();
      expect(PALAVRAS_CHAVE_AREAS[area].length).toBeGreaterThan(0);
    });
  });
});
