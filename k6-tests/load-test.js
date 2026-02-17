import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

/**
 * Testes de Performance com k6 - PromptJur
 * 
 * Este script simula carga de usuários reais utilizando o sistema:
 * - Análise de prompts
 * - Geração de documentos jurídicos
 * - Otimização de prompts
 * - Uso de modelos personalizados
 * 
 * Métricas monitoradas:
 * - Tempo de resposta (P95, P99)
 * - Taxa de erro
 * - Throughput (requisições/segundo)
 * - Duração de requisições
 */

// ============================================================================
// CONFIGURAÇÃO DE MÉTRICAS CUSTOMIZADAS
// ============================================================================

const errorRate = new Rate('errors');

// ============================================================================
// CONFIGURAÇÃO DE CARGA
// ============================================================================

export const options = {
  stages: [
    // Warmup: 10 usuários por 30 segundos
    { duration: '30s', target: 10 },
    
    // Ramp-up: Aumentar para 50 usuários em 1 minuto
    { duration: '1m', target: 50 },
    
    // Carga sustentada: Manter 50 usuários por 2 minutos
    { duration: '2m', target: 50 },
    
    // Pico de carga: Aumentar para 100 usuários em 1 minuto
    { duration: '1m', target: 100 },
    
    // Carga máxima sustentada: Manter 100 usuários por 2 minutos
    { duration: '2m', target: 100 },
    
    // Ramp-down: Reduzir para 0 em 30 segundos
    { duration: '30s', target: 0 },
  ],
  
  thresholds: {
    // 95% das requisições devem responder em menos de 3 segundos
    'http_req_duration': ['p(95)<3000'],
    
    // 99% das requisições devem responder em menos de 5 segundos
    'http_req_duration{scenario:default}': ['p(99)<5000'],
    
    // Taxa de erro deve ser menor que 1%
    'errors': ['rate<0.01'],
    
    // 95% das requisições devem ter sucesso (status 2xx ou 3xx)
    'http_req_failed': ['rate<0.05'],
  },
};

// ============================================================================
// DADOS DE TESTE
// ============================================================================

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const promptsExemplo = [
  'Elabore uma petição inicial de ação de cobrança contra devedor inadimplente',
  'Redija uma contestação para ação trabalhista de horas extras',
  'Crie um recurso de apelação para sentença desfavorável em ação de indenização',
  'Elabore um agravo de instrumento contra decisão interlocutória',
  'Redija uma réplica para contestação em ação de despejo',
];

const tiposDocumento = [
  'Petição Inicial',
  'Contestação',
  'Recurso',
  'Agravo',
  'Réplica',
];

const areasJuridicas = [
  'Direito Civil',
  'Direito Trabalhista',
  'Direito do Consumidor',
  'Direito Empresarial',
  'Direito Previdenciário',
];

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateSessionCookie() {
  // Simular cookie de sessão (em produção, usar autenticação real)
  return `session=test-session-${__VU}-${Date.now()}`;
}

// ============================================================================
// CENÁRIOS DE TESTE
// ============================================================================

/**
 * Cenário 1: Análise de Prompt
 * Simula usuário analisando qualidade de um prompt
 */
function testarAnalisePrompt() {
  const prompt = randomItem(promptsExemplo);
  
  const payload = JSON.stringify({
    prompt: prompt,
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': generateSessionCookie(),
    },
    tags: { name: 'AnalisePrompt' },
  };
  
  const response = http.post(`${BASE_URL}/api/trpc/analisar`, payload, params);
  
  check(response, {
    'análise: status 200': (r) => r.status === 200,
    'análise: resposta em JSON': (r) => r.headers['Content-Type']?.includes('application/json'),
    'análise: tem resultado': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.result !== undefined;
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);
  
  sleep(1);
}

/**
 * Cenário 2: Geração de Documento Jurídico
 * Simula usuário gerando um documento completo
 */
function testarGeracaoDocumento() {
  const payload = JSON.stringify({
    tipoDocumento: randomItem(tiposDocumento),
    areaJuridica: randomItem(areasJuridicas),
    contexto: 'Contexto processual de teste para avaliação de performance',
    objetivo: 'Objetivo do documento jurídico para teste de carga',
    partes: 'Autor: Teste Silva | Réu: Teste Santos',
    legislacao: 'Art. 186 do Código Civil',
    modeloIA: 'gpt-4',
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': generateSessionCookie(),
    },
    tags: { name: 'GeracaoDocumento' },
    timeout: '60s', // Geração pode demorar mais
  };
  
  const response = http.post(`${BASE_URL}/api/trpc/gerar`, payload, params);
  
  check(response, {
    'geração: status 200': (r) => r.status === 200,
    'geração: resposta em JSON': (r) => r.headers['Content-Type']?.includes('application/json'),
    'geração: tem documento': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.result?.data?.documento !== undefined;
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);
  
  sleep(2);
}

/**
 * Cenário 3: Otimização de Prompt
 * Simula usuário otimizando um prompt existente
 */
function testarOtimizacaoPrompt() {
  const prompt = randomItem(promptsExemplo);
  
  const payload = JSON.stringify({
    promptOriginal: prompt,
    tecnicas: ['persona', 'contexto', 'chain-of-thought'],
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': generateSessionCookie(),
    },
    tags: { name: 'OtimizacaoPrompt' },
  };
  
  const response = http.post(`${BASE_URL}/api/trpc/otimizar`, payload, params);
  
  check(response, {
    'otimização: status 200': (r) => r.status === 200,
    'otimização: resposta em JSON': (r) => r.headers['Content-Type']?.includes('application/json'),
    'otimização: tem prompt otimizado': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.result?.data?.promptOtimizado !== undefined;
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);
  
  sleep(1.5);
}

/**
 * Cenário 4: Listagem de Modelos Personalizados
 * Simula usuário navegando pelos seus modelos
 */
function testarListagemModelos() {
  const params = {
    headers: {
      'Cookie': generateSessionCookie(),
    },
    tags: { name: 'ListagemModelos' },
  };
  
  const response = http.get(`${BASE_URL}/api/trpc/modelosPersonalizados.listar`, params);
  
  check(response, {
    'listagem: status 200': (r) => r.status === 200,
    'listagem: resposta em JSON': (r) => r.headers['Content-Type']?.includes('application/json'),
  }) || errorRate.add(1);
  
  sleep(0.5);
}

/**
 * Cenário 5: Busca no Histórico
 * Simula usuário buscando no histórico de prompts
 */
function testarBuscaHistorico() {
  const params = {
    headers: {
      'Cookie': generateSessionCookie(),
    },
    tags: { name: 'BuscaHistorico' },
  };
  
  const response = http.get(`${BASE_URL}/api/trpc/historico.listar?limit=20`, params);
  
  check(response, {
    'histórico: status 200': (r) => r.status === 200,
    'histórico: resposta em JSON': (r) => r.headers['Content-Type']?.includes('application/json'),
  }) || errorRate.add(1);
  
  sleep(0.5);
}

// ============================================================================
// FUNÇÃO PRINCIPAL (VU - Virtual User)
// ============================================================================

export default function () {
  // Simular comportamento real de usuário
  // Distribuição de ações:
  // - 40% Geração de documentos (ação mais comum)
  // - 25% Análise de prompts
  // - 20% Otimização de prompts
  // - 10% Listagem de modelos
  // - 5% Busca no histórico
  
  const action = Math.random();
  
  if (action < 0.40) {
    // 40% - Geração de documento
    testarGeracaoDocumento();
  } else if (action < 0.65) {
    // 25% - Análise de prompt
    testarAnalisePrompt();
  } else if (action < 0.85) {
    // 20% - Otimização de prompt
    testarOtimizacaoPrompt();
  } else if (action < 0.95) {
    // 10% - Listagem de modelos
    testarListagemModelos();
  } else {
    // 5% - Busca no histórico
    testarBuscaHistorico();
  }
}

// ============================================================================
// FUNÇÃO DE TEARDOWN (Executada ao final dos testes)
// ============================================================================

export function handleSummary(data) {
  return {
    'k6-results/summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options?.indent || '';
  const enableColors = options?.enableColors || false;
  
  let summary = '\n';
  summary += `${indent}========================================\n`;
  summary += `${indent}  RESUMO DOS TESTES DE PERFORMANCE\n`;
  summary += `${indent}========================================\n\n`;
  
  // Métricas principais
  const metrics = data.metrics;
  
  if (metrics.http_reqs) {
    summary += `${indent}Total de Requisições: ${metrics.http_reqs.values.count}\n`;
    summary += `${indent}Taxa de Requisições: ${metrics.http_reqs.values.rate.toFixed(2)}/s\n\n`;
  }
  
  if (metrics.http_req_duration) {
    summary += `${indent}Tempo de Resposta:\n`;
    summary += `${indent}  - Média: ${metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
    summary += `${indent}  - Mínimo: ${metrics.http_req_duration.values.min.toFixed(2)}ms\n`;
    summary += `${indent}  - Máximo: ${metrics.http_req_duration.values.max.toFixed(2)}ms\n`;
    summary += `${indent}  - P95: ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
    summary += `${indent}  - P99: ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n\n`;
  }
  
  if (metrics.http_req_failed) {
    const failRate = (metrics.http_req_failed.values.rate * 100).toFixed(2);
    summary += `${indent}Taxa de Falha: ${failRate}%\n\n`;
  }
  
  if (metrics.errors) {
    const errorRate = (metrics.errors.values.rate * 100).toFixed(2);
    summary += `${indent}Taxa de Erro: ${errorRate}%\n\n`;
  }
  
  summary += `${indent}========================================\n`;
  
  return summary;
}
