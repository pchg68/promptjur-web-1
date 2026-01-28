import { describe, it, expect } from 'vitest';

describe('OpenAI API Key Validation', () => {
  it('should validate OpenAI API key by making a simple API call', async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    
    expect(apiKey).toBeDefined();
    expect(apiKey).toMatch(/^sk-/);
    
    // Fazer chamada simples à API OpenAI para validar a chave
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
    
    // Verificar se modelos GPT estão disponíveis
    const models = data.data.map((m: any) => m.id);
    const hasGPTModels = models.some((id: string) => id.includes('gpt'));
    expect(hasGPTModels).toBe(true);
  }, 10000); // Timeout de 10s para chamada de API
});
