# 📈 Guia de Escalabilidade do PromptJur

Este documento descreve quando e como implementar soluções de escalabilidade avançadas (Redis, Elasticsearch) no PromptJur.

---

## 🎯 Estado Atual

O PromptJur atualmente utiliza:

- **Cache em Memória** (Map/LRU) - Suficiente para escala pequena/média
- **MySQL FULLTEXT** - Busca textual nativa do banco de dados
- **Drizzle ORM** - Queries otimizadas com prepared statements

**Capacidade estimada**: 1.000-10.000 usuários ativos/mês sem degradação de performance.

---

## 🔴 Redis - Cache Distribuído

### Quando Implementar

Implemente Redis quando:

✅ **Múltiplas instâncias do servidor** (horizontal scaling)  
✅ **Cache hit rate < 60%** com cache em memória  
✅ **>10.000 usuários ativos/mês**  
✅ **Necessidade de sessões distribuídas**  
✅ **Filas de processamento assíncrono** (Bull/BullMQ)

### Quando NÃO Implementar

❌ **Servidor único** (cache em memória é mais rápido)  
❌ **< 5.000 usuários ativos/mês** (overhead desnecessário)  
❌ **Dados que mudam frequentemente** (invalidação complexa)

### Estratégia de Migração

```typescript
// 1. Instalar dependências
pnpm add ioredis

// 2. Criar cliente Redis
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

// 3. Wrapper compatível com cache atual
export async function getCachedData<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Tentar Redis primeiro
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fallback para fetch
  const data = await fetchFn();
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
}
```

### Casos de Uso Recomendados

1. **Cache de templates do sistema** (TTL: 1 hora)
2. **Cache de modelos profissionais** (TTL: 30 minutos)
3. **Sessões de usuário** (TTL: 24 horas)
4. **Rate limiting distribuído** (TTL: 1 minuto)
5. **Filas de geração de documentos** (Bull)

### Custos Estimados

- **AWS ElastiCache (t4g.micro)**: ~$12/mês
- **DigitalOcean Managed Redis (1GB)**: ~$15/mês
- **Redis Cloud (30MB grátis)**: $0-$7/mês

---

## 🟡 Elasticsearch - Busca Full-Text

### Quando Implementar

Implemente Elasticsearch quando:

✅ **>100.000 documentos** (prompts, templates, análises)  
✅ **Busca complexa** (fuzzy, sinônimos, relevância)  
✅ **Faceted search** (filtros múltiplos combinados)  
✅ **Autocomplete avançado** com typo tolerance  
✅ **Analytics de busca** (queries mais comuns, etc)

### Quando NÃO Implementar

❌ **< 50.000 documentos** (MySQL FULLTEXT é suficiente)  
❌ **Busca simples** (LIKE, MATCH AGAINST)  
❌ **Equipe sem experiência** (curva de aprendizado íngreme)  
❌ **Budget limitado** (custo operacional alto)

### Alternativas Mais Leves

Antes de Elasticsearch, considere:

#### 1. MySQL FULLTEXT Indexes (Atual)

```sql
-- Já implementado no PromptJur
CREATE FULLTEXT INDEX idx_prompts_search 
ON prompts(titulo, conteudo, descricao);

-- Busca com relevância
SELECT *, MATCH(titulo, conteudo) AGAINST('direito trabalhista' IN NATURAL LANGUAGE MODE) AS relevance
FROM prompts
WHERE MATCH(titulo, conteudo) AGAINST('direito trabalhista' IN NATURAL LANGUAGE MODE)
ORDER BY relevance DESC;
```

**Vantagens**: Já configurado, zero custo adicional, suficiente para 90% dos casos.

#### 2. PostgreSQL + pg_trgm (Migração)

```sql
-- Extensão para busca fuzzy
CREATE EXTENSION pg_trgm;

-- Índice GIN para busca rápida
CREATE INDEX idx_prompts_trgm ON prompts USING GIN (titulo gin_trgm_ops, conteudo gin_trgm_ops);

-- Busca com similaridade
SELECT *, similarity(titulo, 'trabalhista') AS sim
FROM prompts
WHERE titulo % 'trabalhista'  -- Operador de similaridade
ORDER BY sim DESC;
```

**Vantagens**: Busca fuzzy nativa, typo tolerance, menor overhead que Elasticsearch.

#### 3. Meilisearch (Alternativa Leve)

```bash
# Docker
docker run -d -p 7700:7700 getmeili/meilisearch:latest

# Indexação
curl -X POST 'http://localhost:7700/indexes/prompts/documents' \
  -H 'Content-Type: application/json' \
  --data-binary @prompts.json
```

**Vantagens**:
- 10x mais leve que Elasticsearch
- Setup em 5 minutos
- Typo tolerance nativo
- Faceted search
- Custo: ~$5-10/mês (vs $50-100/mês Elasticsearch)

### Estratégia de Migração (se necessário)

```typescript
// 1. Instalar cliente
pnpm add @elastic/elasticsearch

// 2. Criar índice
import { Client } from '@elastic/elasticsearch';

const client = new Client({
  node: process.env.ELASTICSEARCH_URL,
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY
  }
});

await client.indices.create({
  index: 'prompts',
  body: {
    mappings: {
      properties: {
        titulo: { type: 'text', analyzer: 'portuguese' },
        conteudo: { type: 'text', analyzer: 'portuguese' },
        areaJuridica: { type: 'keyword' },
        tags: { type: 'keyword' },
        createdAt: { type: 'date' }
      }
    }
  }
});

// 3. Indexar documentos (bulk)
const prompts = await db.select().from(promptsTable);

const body = prompts.flatMap(doc => [
  { index: { _index: 'prompts', _id: doc.id } },
  doc
]);

await client.bulk({ refresh: true, body });

// 4. Busca
const result = await client.search({
  index: 'prompts',
  body: {
    query: {
      multi_match: {
        query: 'ação trabalhista',
        fields: ['titulo^2', 'conteudo'],  // Boost no título
        fuzziness: 'AUTO'
      }
    },
    aggs: {
      areas: { terms: { field: 'areaJuridica' } }
    }
  }
});
```

### Custos Estimados

- **Elasticsearch Cloud (1GB)**: ~$45/mês
- **AWS OpenSearch (t3.small)**: ~$50/mês
- **Self-hosted (4GB RAM)**: ~$20/mês (servidor)
- **Meilisearch Cloud (1GB)**: ~$10/mês ⭐ Recomendado

---

## 📊 Métricas de Decisão

Use o Admin Tools para monitorar:

| Métrica | Threshold Redis | Threshold Elasticsearch |
|---------|----------------|------------------------|
| Cache hit rate | < 60% | N/A |
| Usuários ativos/mês | > 10.000 | > 50.000 |
| Documentos totais | N/A | > 100.000 |
| P95 query time | > 500ms | > 1000ms |
| Instâncias do servidor | > 1 | N/A |

---

## 🎯 Recomendação Final

### Curto Prazo (0-6 meses)

✅ **Manter arquitetura atual**  
✅ **Otimizar queries existentes**  
✅ **Monitorar métricas no Admin Tools**  
✅ **Adicionar índices MySQL conforme necessário**

### Médio Prazo (6-12 meses)

⚠️ **Considerar Meilisearch** se busca se tornar crítica  
⚠️ **Avaliar Redis** se escalar horizontalmente  

### Longo Prazo (12+ meses)

🔴 **Elasticsearch** apenas se >100k documentos + budget disponível  
🔴 **Redis** apenas se múltiplas instâncias + >10k usuários/mês

---

## 📚 Recursos Adicionais

- [MySQL FULLTEXT Documentation](https://dev.mysql.com/doc/refman/8.0/en/fulltext-search.html)
- [Meilisearch vs Elasticsearch](https://www.meilisearch.com/docs/learn/what_is_meilisearch/comparison_to_alternatives)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [PostgreSQL Full Text Search](https://www.postgresql.org/docs/current/textsearch.html)
