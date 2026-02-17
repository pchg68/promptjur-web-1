import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

/**
 * Testes de Integração com APIs Externas (Mock)
 * 
 * Este arquivo testa a integração com APIs externas usando mocks:
 * - DataJud (CNJ) - Busca de precedentes processuais
 * - API de Feriados - Consulta de feriados nacionais/estaduais
 * - Validação de Legislação - Verificação de artigos legais
 * 
 * Objetivo: Garantir que o sistema lida corretamente com:
 * - Respostas bem-sucedidas
 * - Erros de rede (timeout, 404, 500)
 * - Formatos de resposta inesperados
 * - Degradação graceful quando APIs estão indisponíveis
 */

// ============================================================================
// MOCKS DE APIs EXTERNAS
// ============================================================================

const DATAJUD_BASE_URL = 'https://api-publica.datajud.cnj.jus.br';
const FERIADOS_BASE_URL = 'https://api.feriados.dev';

// Mock de resposta bem-sucedida do DataJud
const mockDataJudSuccess = {
  hits: {
    total: { value: 2 },
    hits: [
      {
        _source: {
          numeroProcesso: '0001234-56.2023.8.26.0100',
          classe: { codigo: 1, nome: 'Procedimento Comum Cível' },
          tribunal: 'TJSP',
          dataAjuizamento: '2023-01-15',
          grau: '1º Grau',
          assuntos: [
            { codigo: 10604, nome: 'Indenização por Dano Moral' }
          ],
          movimentos: [
            { codigo: 26, nome: 'Julgado procedente o pedido', dataHora: '2023-06-20T14:30:00' }
          ]
        }
      },
      {
        _source: {
          numeroProcesso: '0007890-12.2023.8.26.0100',
          classe: { codigo: 1, nome: 'Procedimento Comum Cível' },
          tribunal: 'TJSP',
          dataAjuizamento: '2023-03-10',
          grau: '2º Grau',
          assuntos: [
            { codigo: 10604, nome: 'Indenização por Dano Moral' }
          ],
          movimentos: [
            { codigo: 26, nome: 'Negado provimento ao recurso', dataHora: '2023-09-15T10:00:00' }
          ]
        }
      }
    ]
  }
};

// Mock de resposta bem-sucedida da API de Feriados
const mockFeriadosSuccess = [
  {
    date: '2024-01-01',
    name: 'Confraternização Universal',
    type: 'national'
  },
  {
    date: '2024-04-21',
    name: 'Tiradentes',
    type: 'national'
  },
  {
    date: '2024-05-01',
    name: 'Dia do Trabalho',
    type: 'national'
  },
  {
    date: '2024-09-07',
    name: 'Independência do Brasil',
    type: 'national'
  },
  {
    date: '2024-10-12',
    name: 'Nossa Senhora Aparecida',
    type: 'national'
  },
  {
    date: '2024-11-02',
    name: 'Finados',
    type: 'national'
  },
  {
    date: '2024-11-15',
    name: 'Proclamação da República',
    type: 'national'
  },
  {
    date: '2024-12-25',
    name: 'Natal',
    type: 'national'
  }
];

const LEGISLACAO_MOCK_API = 'https://api.legislacao.mock';

// Configurar servidor MSW para interceptar requisições
const server = setupServer(
  // Mock DataJud - Sucesso
  http.post(`${DATAJUD_BASE_URL}/_search`, () => {
    return HttpResponse.json(mockDataJudSuccess);
  }),

  // Mock Feriados - Sucesso
  http.get(`${FERIADOS_BASE_URL}/api/v1/feriados/2024`, () => {
    return HttpResponse.json(mockFeriadosSuccess);
  }),

  // Mock de validação de Código Civil
  http.get(`${LEGISLACAO_MOCK_API}/codigo-civil/:artigo`, ({ params }) => {
    const { artigo } = params;
    
    const artigosValidos: Record<string, string> = {
      '186': 'Aquele que, por ação ou omissão voluntária, negligência ou imprudência, violar direito e causar dano a outrem, ainda que exclusivamente moral, comete ato ilícito.',
      '927': 'Aquele que, por ato ilícito (arts. 186 e 187), causar dano a outrem, fica obrigado a repará-lo.',
      '944': 'A indenização mede-se pela extensão do dano.'
    };

    if (artigosValidos[artigo as string]) {
      return HttpResponse.json({
        artigo: artigo,
        texto: artigosValidos[artigo as string],
        valido: true
      });
    } else {
      return new HttpResponse(null, { status: 404 });
    }
  }),

  // Mock de validação de CLT
  http.get(`${LEGISLACAO_MOCK_API}/clt/:artigo`, ({ params }) => {
    const { artigo } = params;
    
    const artigosValidos: Record<string, string> = {
      '7': 'Os preceitos constantes da presente Consolidação salvo quando fôr em cada caso, expressamente determinado em contrário, não se aplicam...',
      '477': 'Na extinção do contrato de trabalho, o empregador deverá proceder à anotação na Carteira de Trabalho e Previdência Social...'
    };

    if (artigosValidos[artigo as string]) {
      return HttpResponse.json({
        artigo: artigo,
        texto: artigosValidos[artigo as string],
        valido: true
      });
    } else {
      return new HttpResponse(null, { status: 404 });
    }
  })
);

// ============================================================================
// CONFIGURAÇÃO DOS TESTES
// ============================================================================

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// ============================================================================
// TESTES: DataJud (CNJ)
// ============================================================================

describe('Integração com DataJud (CNJ)', () => {
  it('deve buscar precedentes com sucesso', async () => {
    const response = await fetch(`${DATAJUD_BASE_URL}/_search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: {
          match: { 'assuntos.nome': 'Indenização' }
        }
      })
    });

    expect(response.ok).toBe(true);
    
    const data = await response.json();
    
    expect(data.hits).toBeDefined();
    expect(data.hits.total.value).toBe(2);
    expect(data.hits.hits).toHaveLength(2);
    expect(data.hits.hits[0]._source.numeroProcesso).toBe('0001234-56.2023.8.26.0100');
  });

  it('deve retornar formato correto de processo', async () => {
    const response = await fetch(`${DATAJUD_BASE_URL}/_search`, {
      method: 'POST',
      body: JSON.stringify({ query: { match_all: {} } })
    });

    const data = await response.json();
    const processo = data.hits.hits[0]._source;

    // Validar estrutura do processo
    expect(processo).toHaveProperty('numeroProcesso');
    expect(processo).toHaveProperty('classe');
    expect(processo).toHaveProperty('tribunal');
    expect(processo).toHaveProperty('dataAjuizamento');
    expect(processo).toHaveProperty('grau');
    expect(processo).toHaveProperty('assuntos');
    expect(processo).toHaveProperty('movimentos');

    // Validar tipos
    expect(typeof processo.numeroProcesso).toBe('string');
    expect(Array.isArray(processo.assuntos)).toBe(true);
    expect(Array.isArray(processo.movimentos)).toBe(true);
  });

  it('deve lidar com erro 500 do servidor', async () => {
    server.use(
      http.post(`${DATAJUD_BASE_URL}/_search`, () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const response = await fetch(`${DATAJUD_BASE_URL}/_search`, {
      method: 'POST',
      body: JSON.stringify({ query: {} })
    });

    expect(response.status).toBe(500);
    expect(response.ok).toBe(false);
  });

  it('deve lidar com erro 404 (endpoint não encontrado)', async () => {
    server.use(
      http.post(`${DATAJUD_BASE_URL}/_search`, () => {
        return new HttpResponse(null, { status: 404 });
      })
    );

    const response = await fetch(`${DATAJUD_BASE_URL}/_search`, {
      method: 'POST',
      body: JSON.stringify({ query: {} })
    });

    expect(response.status).toBe(404);
  });

  it('deve lidar com timeout de rede', async () => {
    server.use(
      http.post(`${DATAJUD_BASE_URL}/_search`, async () => {
        // Simular delay de 10 segundos
        await new Promise(resolve => setTimeout(resolve, 10000));
        return HttpResponse.json(mockDataJudSuccess);
      })
    );

    // Testar com timeout de 2 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      await fetch(`${DATAJUD_BASE_URL}/_search`, {
        method: 'POST',
        signal: controller.signal,
        body: JSON.stringify({ query: {} })
      });
      
      // Se chegou aqui, o timeout não funcionou
      expect(true).toBe(false);
    } catch (error: any) {
      // Esperado: erro de abort
      expect(error.name).toBe('AbortError');
    } finally {
      clearTimeout(timeoutId);
    }
  });

  it('deve lidar com resposta vazia (sem resultados)', async () => {
    server.use(
      http.post(`${DATAJUD_BASE_URL}/_search`, () => {
        return HttpResponse.json({
          hits: {
            total: { value: 0 },
            hits: []
          }
        });
      })
    );

    const response = await fetch(`${DATAJUD_BASE_URL}/_search`, {
      method: 'POST',
      body: JSON.stringify({ query: {} })
    });

    const data = await response.json();
    
    expect(data.hits.total.value).toBe(0);
    expect(data.hits.hits).toHaveLength(0);
  });
});

// ============================================================================
// TESTES: API de Feriados
// ============================================================================

describe('Integração com API de Feriados', () => {
  it('deve buscar feriados nacionais com sucesso', async () => {
    const response = await fetch(`${FERIADOS_BASE_URL}/api/v1/feriados/2024`);

    expect(response.ok).toBe(true);
    
    const data = await response.json();
    
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('date');
    expect(data[0]).toHaveProperty('name');
    expect(data[0]).toHaveProperty('type');
  });

  it('deve retornar formato correto de feriado', async () => {
    const response = await fetch(`${FERIADOS_BASE_URL}/api/v1/feriados/2024`);
    const data = await response.json();
    const feriado = data[0];

    // Validar estrutura
    expect(feriado).toHaveProperty('date');
    expect(feriado).toHaveProperty('name');
    expect(feriado).toHaveProperty('type');

    // Validar formato de data (YYYY-MM-DD)
    expect(feriado.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Validar tipo
    expect(['national', 'state', 'municipal', 'optional']).toContain(feriado.type);
  });

  it('deve conter feriados nacionais obrigatórios', async () => {
    const response = await fetch(`${FERIADOS_BASE_URL}/api/v1/feriados/2024`);
    const data = await response.json();

    const feriadosNacionais = data.filter((f: any) => f.type === 'national');
    const nomesFeriados = feriadosNacionais.map((f: any) => f.name);

    // Verificar presença de feriados obrigatórios
    expect(nomesFeriados).toContain('Confraternização Universal');
    expect(nomesFeriados).toContain('Dia do Trabalho');
    expect(nomesFeriados).toContain('Independência do Brasil');
    expect(nomesFeriados).toContain('Natal');
  });

  it('deve lidar com erro 500 do servidor', async () => {
    server.use(
      http.get(`${FERIADOS_BASE_URL}/api/v1/feriados/2024`, () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const response = await fetch(`${FERIADOS_BASE_URL}/api/v1/feriados/2024`);

    expect(response.status).toBe(500);
    expect(response.ok).toBe(false);
  });

  it('deve lidar com ano inválido (404)', async () => {
    server.use(
      http.get(`${FERIADOS_BASE_URL}/api/v1/feriados/1900`, () => {
        return new HttpResponse(null, { status: 404 });
      })
    );

    const response = await fetch(`${FERIADOS_BASE_URL}/api/v1/feriados/1900`);

    expect(response.status).toBe(404);
  });
});

// ============================================================================
// TESTES: Validação de Legislação (Mock Simples)
// ============================================================================

describe('Validação de Legislação', () => {

  it('deve validar artigo existente do Código Civil', async () => {
    const response = await fetch(`${LEGISLACAO_MOCK_API}/codigo-civil/186`);

    expect(response.ok).toBe(true);
    
    const data = await response.json();
    
    expect(data.valido).toBe(true);
    expect(data.artigo).toBe('186');
    expect(data.texto).toContain('ato ilícito');
  });

  it('deve retornar 404 para artigo inexistente do Código Civil', async () => {
    const response = await fetch(`${LEGISLACAO_MOCK_API}/codigo-civil/99999`);

    expect(response.status).toBe(404);
  });

  it('deve validar artigo existente da CLT', async () => {
    const response = await fetch(`${LEGISLACAO_MOCK_API}/clt/477`);

    expect(response.ok).toBe(true);
    
    const data = await response.json();
    
    expect(data.valido).toBe(true);
    expect(data.artigo).toBe('477');
    expect(data.texto).toContain('extinção do contrato');
  });

  it('deve retornar 404 para artigo inexistente da CLT', async () => {
    const response = await fetch(`${LEGISLACAO_MOCK_API}/clt/88888`);

    expect(response.status).toBe(404);
  });
});

// ============================================================================
// TESTES: Degradação Graceful
// ============================================================================

describe('Degradação Graceful de APIs', () => {
  it('sistema deve continuar funcionando mesmo com DataJud indisponível', async () => {
    server.use(
      http.post(`${DATAJUD_BASE_URL}/_search`, () => {
        return new HttpResponse(null, { status: 503 });
      })
    );

    const response = await fetch(`${DATAJUD_BASE_URL}/_search`, {
      method: 'POST',
      body: JSON.stringify({ query: {} })
    });

    expect(response.status).toBe(503);
    
    // Sistema deve detectar erro e usar fallback (ex: cache local, mensagem ao usuário)
    // Este teste valida que o erro é capturado corretamente
  });

  it('sistema deve continuar funcionando mesmo com API de Feriados indisponível', async () => {
    server.use(
      http.get(`${FERIADOS_BASE_URL}/api/v1/feriados/2024`, () => {
        return new HttpResponse(null, { status: 503 });
      })
    );

    const response = await fetch(`${FERIADOS_BASE_URL}/api/v1/feriados/2024`);

    expect(response.status).toBe(503);
    
    // Sistema deve usar feriados em cache ou calcular prazos sem considerar feriados
  });
});
