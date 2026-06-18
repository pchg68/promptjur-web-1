# Runbook de Migração — Ontologia Jurídica (JurisOS / PromptJur)

> Roteiro executável para aplicar o grafo da ontologia ao Postgres, com checkpoint reversível em cada ponto de risco. Stack assumida: Prisma + PostgreSQL (Supabase), tRPC, React. Disciplina: **nada muda sem checkpoint antes**.
>
> Arquivos referenciados: `schema.prisma`, `seed-ontologia.example.json`, `rls-ontologia.sql`, `ontologia.router.ts`.
> Referência da ferramenta: https://www.prisma.io/docs/orm/prisma-migrate

---

## Fase 0 — Pré-requisitos

- `DATABASE_URL` apontando para o ambiente de **dev** (nunca rodar `migrate dev` em produção).
- `psql` e `pg_dump` disponíveis (ou acesso ao painel/CLI do Supabase para snapshot).
- Repositório limpo (`git status` sem alterações pendentes).

---

## Fase 1 — Checkpoint (antes de qualquer alteração)

```bash
# 1. Branch isolada e commit do estado atual
git checkout -b feat/ontologia-juridica
git add -A && git commit -m "checkpoint: pré-migração da ontologia"

# 2. Snapshot do banco de dev (rede reversível)
pg_dump "$DATABASE_URL" --format=custom --file="backup_pre_ontologia_$(date +%Y%m%d_%H%M).dump"
# Supabase: alternativamente, criar um Branch/Snapshot pelo painel antes de prosseguir.
```

Guardar o `.dump` fora do repositório. Este é o ponto de retorno garantido (ver Rollback).

---

## Fase 2 — Incorporar o schema

Copiar os `model`/`enum` de `schema.prisma` para o `prisma/schema.prisma` do projeto (preservando `generator`/`datasource` existentes). Validar:

```bash
npx prisma validate
npx prisma format
```

---

## Fase 3 — Gerar a migration (em dev)

```bash
npx prisma migrate dev --name add_ontologia_juridica
```

Isso cria `prisma/migrations/<timestamp>_add_ontologia_juridica/migration.sql`, aplica em dev e regenera o client. **Revisar o SQL gerado** antes de seguir — conferir criação de enums, tabelas, índices e chaves estrangeiras das junções. Commit:

```bash
git add prisma/ && git commit -m "feat: migration da ontologia jurídica"
```

---

## Fase 4 — RLS (defesa em profundidade)

Aplicar as policies de visibilidade por status:

```bash
psql "$DATABASE_URL" -f rls-ontologia.sql
```

Nota importante sobre o Prisma: por padrão o Prisma conecta com um role owner, que **ignora** RLS. As policies protegem o acesso direto via Supabase/PostgREST. Para que o Prisma também as respeite, conecte com um role **sem** `BYPASSRLS` (as tabelas já usam `FORCE ROW LEVEL SECURITY`) e propague o claim de papel por requisição. Enquanto isso não estiver configurado, **o filtro primário da aplicação é o tRPC** (Fase 5) — a RLS é a segunda camada.

---

## Fase 5 — tRPC

Registrar `ontologia.router.ts` no `appRouter` e ajustar os imports ao setup. Pontos que materializam os axiomas:

- `montarContexto` e `listTiposPeca` filtram `status: PUBLICADO` para usuário comum (A6).
- `montarContexto` só inclui precedentes com `verificadoEm != null` (A1).
- `verificarCitacao` aplica pertinência (A2), cabimento (A3) e validação de fonte (A1) — é o gancho do loop ancorado.
- Toda escrita passa por `adminProcedure` (RBAC developer/administrator); nós nascem em `RASCUNHO`.

---

## Fase 6 — Seed (somente dev)

`seed-ontologia.example.json` é **estrutural**. Antes de carregar:

- Validar cada `Dispositivo`/`Precedente` contra fonte oficial e preencher `urlOficial`.
- Só marcar `verificadoEm` após a validação. Precedente não verificado **não** deve ser semeado em produção — o axioma A1 o reprovaria de qualquer modo.

```bash
# Carregar apenas em dev, após validação:
npx tsx prisma/seed-ontologia.ts   # script que lê o .example.json validado
```

---

## Fase 7 — Smoke tests (provar os axiomas)

Antes de promover, confirmar:

1. Usuário comum chama `listTiposPeca` → vê **apenas** itens PUBLICADO (A6).
2. Um `TipoPeca` em RASCUNHO **não** aparece para usuário comum, mas aparece para administrator.
3. `verificarCitacao` com precedente de `verificadoEm = null` → retorna `aprovado: false`, código `FONTE_NAO_VALIDADA` (A1).
4. `verificarCitacao` com tese e precedente **sem** aresta `TesePrecedente` → `PRECEDENTE_IMPERTINENTE` (A2).
5. `montarContexto` de uma peça PUBLICADO retorna teses e precedentes validados, ordenados (vinculante → peso).

---

## Fase 8 — Deploy em produção

```bash
# 1. Checkpoint de produção (snapshot Supabase ou pg_dump do banco de prod)
pg_dump "$PROD_DATABASE_URL" --format=custom --file="backup_prod_pre_ontologia_$(date +%Y%m%d_%H%M).dump"

# 2. Aplicar migrations já revisadas (NÃO usar migrate dev em prod)
DATABASE_URL="$PROD_DATABASE_URL" npx prisma migrate deploy

# 3. Aplicar RLS em produção
psql "$PROD_DATABASE_URL" -f rls-ontologia.sql
```

Repetir os smoke tests da Fase 7 contra produção. Merge da branch só após verde.

---

## Rollback (reversível)

Em ordem de preferência:

1. **Restore do snapshot** (mais seguro): `pg_restore --clean --if-exists -d "$DATABASE_URL" backup_pre_ontologia_*.dump`. No Supabase, restaurar o Branch/Snapshot da Fase 1.
2. **Down manual** (se a migration aplicou parcialmente). Executar:

```sql
-- Desfazer policies primeiro (ver fim de rls-ontologia.sql), depois:
DROP TABLE IF EXISTS "TesePrecedente","TeseDispositivo","TesePeca","InstitutoDispositivo" CASCADE;
DROP TABLE IF EXISTS "RequisitoLegal" CASCADE;
DROP TABLE IF EXISTS "Tese","TipoPeca","Instituto","Precedente","Dispositivo","AreaDireito" CASCADE;
DROP TYPE IF EXISTS "StatusOntologia";
DROP TYPE IF EXISTS "TipoPrecedente";
DROP TYPE IF EXISTS "PoloProcessual";
```

3. **Marcar a migration como revertida** para o Prisma reconciliar o histórico:

```bash
npx prisma migrate resolve --rolled-back add_ontologia_juridica
```

4. `git revert` / descartar a branch para alinhar o código.

---

## Checklist final

- [ ] Backup de dev e de prod guardados fora do repositório.
- [ ] `migration.sql` revisado manualmente.
- [ ] RLS aplicada; papel de conexão do Prisma decidido (owner + filtro tRPC, ou role sem BYPASSRLS).
- [ ] `ontologia.router.ts` registrado; escrita sob `adminProcedure`.
- [ ] Seed só em dev e só com fontes validadas; nenhum precedente `verificadoEm = null` em prod.
- [ ] Smoke tests A1/A2/A6 verdes em dev e em prod.
- [ ] Editor da ontologia visível apenas a developer/administrator.
