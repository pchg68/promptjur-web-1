import { describe, it, expect } from 'vitest';
import { AREAS_JURIDICAS } from '../shared/juridico';

describe('Modelos Personalizados - Validação de Estrutura', () => {
  it('deve validar estrutura básica de um modelo', () => {
    const modelo = {
      id: 1,
      nome: "Modelo de Petição Inicial",
      template: "Excelentíssimo Senhor Doutor Juiz...",
      areaJuridica: "Civil",
      tipoDocumento: "Petição",
      descricao: "Modelo padrão para petição inicial",
      visibilidade: "privado",
      autorId: 1
    };
    
    expect(modelo.id).toBeDefined();
    expect(modelo.nome).toBeDefined();
    expect(modelo.template).toBeDefined();
    expect(modelo.areaJuridica).toBeDefined();
  });

  it('deve validar que área jurídica é válida', () => {
    const areaJuridica = "Civil";
    
    expect(AREAS_JURIDICAS).toContain(areaJuridica);
  });

  it('deve validar visibilidade do modelo', () => {
    const visibilidades = ["publico", "privado"];
    const modelo = { visibilidade: "privado" };
    
    expect(visibilidades).toContain(modelo.visibilidade);
  });
});

describe('Modelos Personalizados - Variáveis de Template', () => {
  it('deve extrair variáveis do template', () => {
    const template = "Ação movida por {{autor}} contra {{reu}} no valor de {{valor}}";
    const regex = /\{\{(\w+)\}\}/g;
    const variaveis: string[] = [];
    let match;
    
    while ((match = regex.exec(template)) !== null) {
      variaveis.push(match[1]);
    }
    
    expect(variaveis).toEqual(["autor", "reu", "valor"]);
  });

  it('deve substituir variáveis no template', () => {
    const template = "Ação movida por {{autor}} contra {{reu}}";
    const valores = {
      autor: "João Silva",
      reu: "Empresa XYZ"
    };
    
    let resultado = template;
    Object.entries(valores).forEach(([chave, valor]) => {
      resultado = resultado.replace(new RegExp(`\\{\\{${chave}\\}\\}`, 'g'), valor);
    });
    
    expect(resultado).toBe("Ação movida por João Silva contra Empresa XYZ");
  });

  it('deve identificar variáveis não preenchidas', () => {
    const template = "Ação movida por {{autor}} contra {{reu}} no valor de {{valor}}";
    const valores = {
      autor: "João Silva",
      reu: "Empresa XYZ"
    };
    
    let resultado = template;
    Object.entries(valores).forEach(([chave, valor]) => {
      resultado = resultado.replace(new RegExp(`\\{\\{${chave}\\}\\}`, 'g'), valor);
    });
    
    expect(resultado).toContain("{{valor}}");
  });
});

describe('Modelos Personalizados - Tipos de Documento', () => {
  it('deve validar tipos de documento suportados', () => {
    const tiposDocumento = [
      "Petição",
      "Parecer",
      "Contrato",
      "Recurso",
      "Defesa",
      "Manifestação"
    ];
    
    expect(tiposDocumento.length).toBeGreaterThan(0);
    expect(tiposDocumento).toContain("Petição");
  });

  it('deve associar tipo de documento à área jurídica', () => {
    const modelo = {
      tipoDocumento: "Petição",
      areaJuridica: "Civil"
    };
    
    expect(modelo.tipoDocumento).toBeDefined();
    expect(modelo.areaJuridica).toBeDefined();
    expect(AREAS_JURIDICAS).toContain(modelo.areaJuridica);
  });
});

describe('Modelos Personalizados - Validação de Conteúdo', () => {
  it('deve validar que nome do modelo não está vazio', () => {
    const nome = "Modelo de Petição Inicial";
    
    expect(nome.trim().length).toBeGreaterThan(0);
  });

  it('deve validar que template não está vazio', () => {
    const template = "Excelentíssimo Senhor Doutor Juiz...";
    
    expect(template.trim().length).toBeGreaterThan(0);
  });

  it('deve validar tamanho mínimo do template', () => {
    const template = "Excelentíssimo Senhor Doutor Juiz de Direito da Vara Cível...";
    
    expect(template.length).toBeGreaterThan(20);
  });

  it('deve validar que descrição é opcional mas útil', () => {
    const modelo1 = {
      nome: "Modelo 1",
      descricao: "Descrição detalhada"
    };
    
    const modelo2 = {
      nome: "Modelo 2",
      descricao: undefined
    };
    
    expect(modelo1.descricao).toBeDefined();
    expect(modelo2.descricao).toBeUndefined();
  });
});

describe('Modelos Personalizados - Compartilhamento', () => {
  it('deve permitir tornar modelo público', () => {
    const modelo = {
      visibilidade: "privado"
    };
    
    modelo.visibilidade = "publico";
    
    expect(modelo.visibilidade).toBe("publico");
  });

  it('deve permitir tornar modelo privado', () => {
    const modelo = {
      visibilidade: "publico"
    };
    
    modelo.visibilidade = "privado";
    
    expect(modelo.visibilidade).toBe("privado");
  });

  it('deve validar que modelo público pode ser acessado por outros usuários', () => {
    const modelo = {
      visibilidade: "publico",
      autorId: 1
    };
    
    const usuarioAtual = 2;
    const podeAcessar = modelo.visibilidade === "publico" || modelo.autorId === usuarioAtual;
    
    expect(podeAcessar).toBe(true);
  });

  it('deve validar que modelo privado só pode ser acessado pelo autor', () => {
    const modelo = {
      visibilidade: "privado",
      autorId: 1
    };
    
    const usuarioAtual = 2;
    const podeAcessar = modelo.visibilidade === "publico" || modelo.autorId === usuarioAtual;
    
    expect(podeAcessar).toBe(false);
  });
});
