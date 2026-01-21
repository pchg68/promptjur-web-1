import { describe, it, expect } from 'vitest';
import { sugerirArea } from './sugestao-area';

describe('Sugestão Inteligente de Área', () => {
  it('deve sugerir área Civil para contexto com palavras-chave civis', () => {
    const contexto = "Elaborar contrato de compra e venda de imóvel com cláusulas de responsabilidade civil e indenização por danos materiais";
    const resultado = sugerirArea(contexto);

    expect(resultado.area).toBe("Civil");
    expect(resultado.confianca).toBeGreaterThan(0);
    expect(resultado.motivo).toBeTruthy();
  });

  it('deve sugerir área Penal para contexto com palavras-chave penais', () => {
    const contexto = "Defesa em processo criminal por crime de furto qualificado com pedido de absolvição do réu acusado";
    const resultado = sugerirArea(contexto);

    expect(resultado.area).toBe("Penal");
    expect(resultado.confianca).toBeGreaterThan(0);
  });

  it('deve sugerir área Trabalhista para contexto com palavras-chave trabalhistas', () => {
    const contexto = "Reclamação trabalhista por rescisão indireta com pedido de verbas rescisórias, FGTS e férias proporcionais do empregado";
    const resultado = sugerirArea(contexto);

    expect(resultado.area).toBe("Trabalhista");
    expect(resultado.confianca).toBeGreaterThan(0);
  });

  it('deve sugerir área Tributário para contexto com palavras-chave tributárias', () => {
    const contexto = "Mandado de segurança contra cobrança indevida de ICMS e ISS com pedido de restituição de tributos pagos";
    const resultado = sugerirArea(contexto);

    expect(resultado.area).toBe("Tributário");
    expect(resultado.confianca).toBeGreaterThan(0);
  });

  it('deve retornar confiança entre 0 e 100', () => {
    const contexto = "Análise de contrato empresarial com cláusulas de responsabilidade";
    const resultado = sugerirArea(contexto);

    expect(resultado.confianca).toBeGreaterThanOrEqual(0);
    expect(resultado.confianca).toBeLessThanOrEqual(100);
  });

  it('deve incluir motivo na sugestão', () => {
    const contexto = "Petição inicial de ação de cobrança com pedido de indenização";
    const resultado = sugerirArea(contexto);

    expect(resultado.motivo).toBeTruthy();
    expect(typeof resultado.motivo).toBe('string');
    expect(resultado.motivo.length).toBeGreaterThan(10);
  });

  it('deve considerar objetivo além do contexto', () => {
    const contexto = "Análise de situação envolvendo empregado e empregador";
    const objetivo = "Elaborar defesa trabalhista para rescisão indireta";
    const resultado = sugerirArea(contexto, objetivo);

    expect(resultado.area).toBe("Trabalhista");
  });

  it('deve retornar área padrão para contexto genérico', () => {
    const contexto = "Texto genérico sem palavras-chave específicas de área jurídica";
    const resultado = sugerirArea(contexto);

    expect(resultado.area).toBeTruthy();
    expect(resultado.confianca).toBeLessThan(70); // Baixa confiança
  });

  it('deve ter maior confiança com mais palavras-chave', () => {
    const contextoSimples = "Contrato de compra e venda";
    const contextoDetalhado = "Contrato de compra e venda de imóvel com cláusulas de responsabilidade civil, indenização por danos, posse e propriedade";
    
    const resultadoSimples = sugerirArea(contextoSimples);
    const resultadoDetalhado = sugerirArea(contextoDetalhado);

    expect(resultadoDetalhado.confianca).toBeGreaterThanOrEqual(resultadoSimples.confianca);
  });

  it('deve identificar múltiplas palavras-chave da mesma área', () => {
    const contexto = "Crime de furto qualificado com pena de prisão para o réu acusado no processo criminal";
    const resultado = sugerirArea(contexto);

    expect(resultado.area).toBe("Penal");
    expect(resultado.motivo).toContain("palavras-chave");
  });
});

describe('Sugestão Inteligente - Validação de Entrada', () => {
  it('deve funcionar com contexto mínimo', () => {
    const contexto = "Contrato civil";
    const resultado = sugerirArea(contexto);

    expect(resultado.area).toBeTruthy();
    expect(resultado.confianca).toBeGreaterThanOrEqual(0);
  });

  it('deve funcionar sem objetivo', () => {
    const contexto = "Análise de responsabilidade civil em acidente de trânsito";
    const resultado = sugerirArea(contexto);

    expect(resultado.area).toBe("Civil");
  });

  it('deve ser case-insensitive', () => {
    const contextoMaiusculo = "CONTRATO DE COMPRA E VENDA COM RESPONSABILIDADE CIVIL";
    const contextoMinusculo = "contrato de compra e venda com responsabilidade civil";
    
    const resultadoMaiusculo = sugerirArea(contextoMaiusculo);
    const resultadoMinusculo = sugerirArea(contextoMinusculo);

    expect(resultadoMaiusculo.area).toBe(resultadoMinusculo.area);
  });
});
