import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Smoke Test - Teste de Fumaça
 * 
 * Teste rápido com 1-5 usuários para validar que o sistema está funcionando
 * Execução: k6 run k6-tests/smoke-test.js
 */

export const options = {
  vus: 5, // 5 usuários virtuais
  duration: '30s', // 30 segundos de teste
  
  thresholds: {
    'http_req_duration': ['p(95)<2000'], // 95% das requisições em menos de 2s
    'http_req_failed': ['rate<0.05'], // Menos de 5% de falhas
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Teste 1: Homepage
  let response = http.get(`${BASE_URL}/`);
  check(response, {
    'homepage: status 200': (r) => r.status === 200,
  });
  
  sleep(1);
  
  // Teste 2: Dashboard (simulando usuário logado)
  response = http.get(`${BASE_URL}/dashboard`, {
    headers: {
      'Cookie': `session=test-session-${__VU}`,
    },
  });
  check(response, {
    'dashboard: status 200 ou 302': (r) => r.status === 200 || r.status === 302,
  });
  
  sleep(1);
}

export function handleSummary(data) {
  console.log('\n========== SMOKE TEST SUMMARY ==========');
  console.log(`Total Requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s`);
  console.log(`Avg Duration: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`);
  console.log(`P95 Duration: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`Failed Rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%`);
  console.log('========================================\n');
  
  return {
    'k6-results/smoke-test-summary.json': JSON.stringify(data),
  };
}
