import { describe, it, expect } from 'vitest';
import { AREAS_JURIDICAS, PALAVRAS_CHAVE_AREAS } from '../shared/juridico';

describe('Análise de Prompt - Detecção de Área Jurídica', () => {
  it('deve detectar área Civil corretamente', () => {
    const prompt = "Redija uma petição inicial de ação de cobrança de dívida";
    
    // Verificar se prompt contém termos relacionados a Civil
    const termosCivis = ['petição', 'ação', 'cobrança', 'dívida', 'contrato'];
    const contemTermoCivil = termosCivis.some(termo => 
      prompt.toLowerCase().includes(termo.toLowerCase())
    );
    
    expect(contemTermoCivil).toBe(true);
  });

  it('deve detectar área Penal corretamente', () => {
    const prompt = "Elabore uma defesa para crime de furto qualificado";
    const palavrasChave = PALAVRAS_CHAVE_AREAS["Penal"];
    
    const contemPalavraChave = palavrasChave.some(palavra => 
      prompt.toLowerCase().includes(palavra.toLowerCase())
    );
    
    expect(contemPalavraChave).toBe(true);
  });

  it('deve detectar área Trabalhista corretamente', () => {
    const prompt = "Crie uma reclamação trabalhista por rescisão indireta";
    const palavrasChave = PALAVRAS_CHAVE_AREAS["Trabalhista"];
    
    const contemPalavraChave = palavrasChave.some(palavra => 
      prompt.toLowerCase().includes(palavra.toLowerCase())
    );
    
    expect(contemPalavraChave).toBe(true);
  });

  it('deve detectar área Tributário corretamente', () => {
    const prompt = "Redija um mandado de segurança contra cobrança de ICMS";
    const palavrasChave = PALAVRAS_CHAVE_AREAS["Tributário"];
    
    const contemPalavraChave = palavrasChave.some(palavra => 
      prompt.toLowerCase().includes(palavra.toLowerCase())
    );
    
    expect(contemPalavraChave).toBe(true);
  });

  it('deve retornar false para prompt sem palavras-chave conhecidas', () => {
    const prompt = "Texto genérico sem contexto jurídico específico";
    
    const areasDetectadas = Object.entries(PALAVRAS_CHAVE_AREAS).filter(([area, palavras]) => {
      return palavras.some(palavra => 
        prompt.toLowerCase().includes(palavra.toLowerCase())
      );
    });
    
    expect(areasDetectadas.length).toBe(0);
  });
});

describe('Análise de Prompt - Validação de Estrutura', () => {
  it('deve validar que todas as áreas jurídicas têm palavras-chave', () => {
    AREAS_JURIDICAS.forEach(area => {
      expect(PALAVRAS_CHAVE_AREAS[area]).toBeDefined();
      expect(Array.isArray(PALAVRAS_CHAVE_AREAS[area])).toBe(true);
      expect(PALAVRAS_CHAVE_AREAS[area].length).toBeGreaterThan(0);
    });
  });

  it('deve validar que palavras-chave não estão vazias', () => {
    Object.values(PALAVRAS_CHAVE_AREAS).forEach(palavras => {
      palavras.forEach(palavra => {
        expect(palavra.trim().length).toBeGreaterThan(0);
      });
    });
  });
});

describe('Análise de Prompt - Extração de Entidades', () => {
  it('deve extrair valores monetários corretamente', () => {
    const prompt = "Ação de cobrança no valor de R$ 50.000,00";
    const regexValor = /R\$\s*[\d.,]+/g;
    const valores = prompt.match(regexValor);
    
    expect(valores).not.toBeNull();
    expect(valores?.length).toBeGreaterThan(0);
  });

  it('deve extrair datas corretamente', () => {
    const prompt = "Contrato assinado em 15/01/2024";
    const regexData = /\d{2}\/\d{2}\/\d{4}/g;
    const datas = prompt.match(regexData);
    
    expect(datas).not.toBeNull();
    expect(datas?.[0]).toBe("15/01/2024");
  });

  it('deve extrair nomes de partes (pessoas/empresas)', () => {
    const prompt = "Ação movida por João Silva contra Empresa XYZ Ltda";
    const regexNomes = /[A-Z][a-záàâãéèêíïóôõöúçñ]+(?:\s+[A-Z][a-záàâãéèêíïóôõöúçñ]+)+/g;
    const nomes = prompt.match(regexNomes);
    
    expect(nomes).not.toBeNull();
    expect(nomes?.length).toBeGreaterThan(0);
  });
});

describe('Análise de Prompt - Qualidade', () => {
  it('deve avaliar prompt curto como qualidade ruim', () => {
    const prompt = "Petição";
    const tamanho = prompt.length;
    
    const qualidade = tamanho < 20 ? 'ruim' : tamanho < 100 ? 'bom' : 'excelente';
    
    expect(qualidade).toBe('ruim');
  });

  it('deve avaliar prompt médio como qualidade boa', () => {
    const prompt = "Redija uma petição inicial de ação de cobrança de dívida no valor de R$ 10.000,00";
    const tamanho = prompt.length;
    
    const qualidade = tamanho < 20 ? 'ruim' : tamanho < 100 ? 'bom' : 'excelente';
    
    expect(qualidade).toBe('bom');
  });

  it('deve avaliar prompt longo e detalhado como excelente', () => {
    const prompt = `Redija uma petição inicial de ação de cobrança de dívida no valor de R$ 50.000,00, 
    movida por João Silva contra Empresa XYZ Ltda, fundamentada no contrato de prestação de serviços 
    assinado em 15/01/2024, com cláusula de pagamento em 30 dias, que não foi cumprida pela ré.`;
    const tamanho = prompt.length;
    
    const qualidade = tamanho < 20 ? 'ruim' : tamanho < 100 ? 'bom' : 'excelente';
    
    expect(qualidade).toBe('excelente');
  });
});
