// Setup global para testes vitest
import { beforeAll, afterAll } from 'vitest';

beforeAll(() => {
  // Setup antes de todos os testes
  console.log('🧪 Iniciando testes...');
});

afterAll(() => {
  // Cleanup após todos os testes
  console.log('✅ Testes concluídos!');
});
