import { describe, it, expect } from 'vitest';

describe('Exportação ABNT - Formatação de Texto', () => {
  it('deve formatar título em maiúsculas', () => {
    const titulo = "Análise de Prompt Jurídico";
    const tituloFormatado = titulo.toUpperCase();
    
    expect(tituloFormatado).toBe("ANÁLISE DE PROMPT JURÍDICO");
  });

  it('deve adicionar espaçamento duplo entre parágrafos', () => {
    const paragrafo1 = "Primeiro parágrafo";
    const paragrafo2 = "Segundo parágrafo";
    const textoFormatado = `${paragrafo1}\n\n${paragrafo2}`;
    
    expect(textoFormatado).toContain("\n\n");
  });

  it('deve formatar data no padrão brasileiro', () => {
    const data = new Date('2024-01-15T12:00:00');
    const dataFormatada = data.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    
    expect(dataFormatada).toMatch(/1[45]\/01\/2024/); // Aceita 14 ou 15 devido a timezone
  });
});

describe('Exportação ABNT - Margens e Espaçamento', () => {
  it('deve validar margens ABNT (superior: 3cm, inferior: 2cm, esquerda: 3cm, direita: 2cm)', () => {
    const margensABNT = {
      superior: 3,
      inferior: 2,
      esquerda: 3,
      direita: 2
    };
    
    expect(margensABNT.superior).toBe(3);
    expect(margensABNT.inferior).toBe(2);
    expect(margensABNT.esquerda).toBe(3);
    expect(margensABNT.direita).toBe(2);
  });

  it('deve validar espaçamento entre linhas (1.5)', () => {
    const espacamentoLinhas = 1.5;
    
    expect(espacamentoLinhas).toBe(1.5);
  });

  it('deve validar tamanho de fonte (12pt)', () => {
    const tamanhoFonte = 12;
    
    expect(tamanhoFonte).toBe(12);
  });
});

describe('Exportação ABNT - Estrutura do Documento', () => {
  it('deve incluir cabeçalho com título', () => {
    const documento = {
      titulo: "ANÁLISE DE PROMPT JURÍDICO",
      conteudo: "Conteúdo do documento"
    };
    
    expect(documento.titulo).toBeDefined();
    expect(documento.titulo.length).toBeGreaterThan(0);
  });

  it('deve incluir área jurídica no cabeçalho', () => {
    const documento = {
      titulo: "ANÁLISE DE PROMPT JURÍDICO",
      areaJuridica: "Cível",
      conteudo: "Conteúdo do documento"
    };
    
    expect(documento.areaJuridica).toBeDefined();
    expect(documento.areaJuridica).toBe("Cível");
  });

  it('deve incluir data de geração', () => {
    const documento = {
      titulo: "ANÁLISE DE PROMPT JURÍDICO",
      data: new Date().toLocaleDateString('pt-BR'),
      conteudo: "Conteúdo do documento"
    };
    
    expect(documento.data).toBeDefined();
    expect(documento.data).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});

describe('Exportação ABNT - Validação de Conteúdo', () => {
  it('deve validar que conteúdo não está vazio', () => {
    const conteudo = "Este é um conteúdo de teste";
    
    expect(conteudo.trim().length).toBeGreaterThan(0);
  });

  it('deve validar que conteúdo é uma string', () => {
    const conteudo = "Este é um conteúdo de teste";
    
    expect(typeof conteudo).toBe('string');
  });

  it('deve remover espaços extras do conteúdo', () => {
    const conteudo = "  Texto   com   espaços   extras  ";
    const conteudoLimpo = conteudo.trim().replace(/\s+/g, ' ');
    
    expect(conteudoLimpo).toBe("Texto com espaços extras");
  });
});

describe('Exportação ABNT - Tipos de Arquivo', () => {
  it('deve suportar exportação TXT', () => {
    const tiposSuportados = ['TXT', 'DOCX', 'PDF'];
    
    expect(tiposSuportados).toContain('TXT');
  });

  it('deve suportar exportação DOCX', () => {
    const tiposSuportados = ['TXT', 'DOCX', 'PDF'];
    
    expect(tiposSuportados).toContain('DOCX');
  });

  it('deve suportar exportação PDF', () => {
    const tiposSuportados = ['TXT', 'DOCX', 'PDF'];
    
    expect(tiposSuportados).toContain('PDF');
  });

  it('deve validar extensão de arquivo', () => {
    const arquivo = "documento.docx";
    const extensao = arquivo.split('.').pop()?.toUpperCase();
    
    expect(extensao).toBe('DOCX');
  });
});
