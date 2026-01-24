import { describe, it, expect } from 'vitest';

/**
 * Testes para validação de formulário de geração de prompts
 */

// Função de validação extraída da lógica do Dashboard
function validateContextoJuridico(value: string): string | undefined {
  if (!value.trim()) {
    return 'O contexto jurídico é obrigatório';
  }
  if (value.trim().length < 20) {
    return 'O contexto deve ter pelo menos 20 caracteres para gerar um prompt de qualidade';
  }
  return undefined;
}

function validateObjetivoEspecifico(value: string): string | undefined {
  if (!value.trim()) {
    return 'O objetivo específico é obrigatório';
  }
  if (value.trim().length < 10) {
    return 'O objetivo deve ter pelo menos 10 caracteres';
  }
  return undefined;
}

describe('Validação de Contexto Jurídico', () => {
  it('deve retornar erro quando contexto está vazio', () => {
    const erro = validateContextoJuridico('');
    expect(erro).toBe('O contexto jurídico é obrigatório');
  });

  it('deve retornar erro quando contexto tem apenas espaços', () => {
    const erro = validateContextoJuridico('   ');
    expect(erro).toBe('O contexto jurídico é obrigatório');
  });

  it('deve retornar erro quando contexto tem menos de 20 caracteres', () => {
    const erro = validateContextoJuridico('Contexto curto');
    expect(erro).toBe('O contexto deve ter pelo menos 20 caracteres para gerar um prompt de qualidade');
  });

  it('deve aceitar contexto com exatamente 20 caracteres', () => {
    const erro = validateContextoJuridico('12345678901234567890');
    expect(erro).toBeUndefined();
  });

  it('deve aceitar contexto válido com mais de 20 caracteres', () => {
    const erro = validateContextoJuridico('Cliente sofreu acidente de trânsito e busca indenização por danos materiais');
    expect(erro).toBeUndefined();
  });

  it('deve ignorar espaços no início e fim ao contar caracteres', () => {
    const erro = validateContextoJuridico('  Contexto válido com mais de vinte caracteres  ');
    expect(erro).toBeUndefined();
  });
});

describe('Validação de Objetivo Específico', () => {
  it('deve retornar erro quando objetivo está vazio', () => {
    const erro = validateObjetivoEspecifico('');
    expect(erro).toBe('O objetivo específico é obrigatório');
  });

  it('deve retornar erro quando objetivo tem apenas espaços', () => {
    const erro = validateObjetivoEspecifico('   ');
    expect(erro).toBe('O objetivo específico é obrigatório');
  });

  it('deve retornar erro quando objetivo tem menos de 10 caracteres', () => {
    const erro = validateObjetivoEspecifico('Objetivo');
    expect(erro).toBe('O objetivo deve ter pelo menos 10 caracteres');
  });

  it('deve aceitar objetivo com exatamente 10 caracteres', () => {
    const erro = validateObjetivoEspecifico('1234567890');
    expect(erro).toBeUndefined();
  });

  it('deve aceitar objetivo válido com mais de 10 caracteres', () => {
    const erro = validateObjetivoEspecifico('Redigir petição inicial de ação de cobrança');
    expect(erro).toBeUndefined();
  });

  it('deve ignorar espaços no início e fim ao contar caracteres', () => {
    const erro = validateObjetivoEspecifico('  Objetivo válido  ');
    expect(erro).toBeUndefined();
  });
});

describe('Validação Integrada', () => {
  it('deve validar formulário completo com dados válidos', () => {
    const contexto = 'Cliente assinou contrato de prestação de serviços mas empresa não cumpriu obrigações';
    const objetivo = 'Redigir petição inicial de ação de cobrança';
    
    const erroContexto = validateContextoJuridico(contexto);
    const erroObjetivo = validateObjetivoEspecifico(objetivo);
    
    expect(erroContexto).toBeUndefined();
    expect(erroObjetivo).toBeUndefined();
  });

  it('deve detectar múltiplos erros em formulário inválido', () => {
    const contexto = 'Curto';
    const objetivo = 'Curto';
    
    const erroContexto = validateContextoJuridico(contexto);
    const erroObjetivo = validateObjetivoEspecifico(objetivo);
    
    expect(erroContexto).toBeTruthy();
    expect(erroObjetivo).toBeTruthy();
  });

  it('deve validar casos reais de uso', () => {
    const casosValidos = [
      {
        contexto: 'Empregado foi demitido sem justa causa e não recebeu verbas rescisórias conforme CLT',
        objetivo: 'Elaborar reclamação trabalhista com pedido de verbas rescisórias'
      },
      {
        contexto: 'Consumidor adquiriu produto com vício oculto e fornecedor recusa troca ou devolução',
        objetivo: 'Redigir notificação extrajudicial com base no CDC'
      },
      {
        contexto: 'Cliente foi vítima de furto qualificado e deseja representação criminal',
        objetivo: 'Elaborar queixa-crime com descrição detalhada dos fatos'
      }
    ];

    casosValidos.forEach(caso => {
      const erroContexto = validateContextoJuridico(caso.contexto);
      const erroObjetivo = validateObjetivoEspecifico(caso.objetivo);
      
      expect(erroContexto).toBeUndefined();
      expect(erroObjetivo).toBeUndefined();
    });
  });
});

describe('Validação de Casos Extremos', () => {
  it('deve lidar com strings muito longas', () => {
    const contextoLongo = 'A'.repeat(10000);
    const objetivoLongo = 'B'.repeat(10000);
    
    const erroContexto = validateContextoJuridico(contextoLongo);
    const erroObjetivo = validateObjetivoEspecifico(objetivoLongo);
    
    expect(erroContexto).toBeUndefined();
    expect(erroObjetivo).toBeUndefined();
  });

  it('deve lidar com caracteres especiais', () => {
    const contexto = 'Cliente sofreu acidente com veículo (placa ABC-1234) e busca R$ 50.000,00 de indenização';
    const objetivo = 'Redigir petição inicial com pedido de tutela de urgência (art. 300 CPC)';
    
    const erroContexto = validateContextoJuridico(contexto);
    const erroObjetivo = validateObjetivoEspecifico(objetivo);
    
    expect(erroContexto).toBeUndefined();
    expect(erroObjetivo).toBeUndefined();
  });

  it('deve lidar com quebras de linha', () => {
    const contexto = 'Cliente sofreu acidente\nBusca indenização\nValor estimado: R$ 10.000';
    const objetivo = 'Redigir petição\nCom pedido de urgência';
    
    const erroContexto = validateContextoJuridico(contexto);
    const erroObjetivo = validateObjetivoEspecifico(objetivo);
    
    expect(erroContexto).toBeUndefined();
    expect(erroObjetivo).toBeUndefined();
  });
});
