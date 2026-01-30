# Guia de Segurança - PromptJur

Este documento descreve as práticas de segurança implementadas no PromptJur e as diretrizes para desenvolvedores.

## 📋 Índice

1. [Variáveis de Ambiente](#variáveis-de-ambiente)
2. [Autenticação e Autorização](#autenticação-e-autorização)
3. [Proteção de Dados Sensíveis](#proteção-de-dados-sensíveis)
4. [Checklist de Segurança](#checklist-de-segurança)
5. [Relatando Vulnerabilidades](#relatando-vulnerabilidades)

---

## 🔐 Variáveis de Ambiente

### Variáveis Obrigatórias (Gerenciadas pelo Sistema Manus)

As seguintes variáveis são injetadas automaticamente pelo sistema Manus:

```bash
# Banco de Dados
DATABASE_URL=mysql://...

# Autenticação OAuth
JWT_SECRET=...
OAUTH_SERVER_URL=...
VITE_OAUTH_PORTAL_URL=...
VITE_APP_ID=...

# Identidade do Proprietário
OWNER_OPEN_ID=...
OWNER_NAME=...

# APIs Internas Manus
BUILT_IN_FORGE_API_KEY=...
BUILT_IN_FORGE_API_URL=...
VITE_FRONTEND_FORGE_API_KEY=...
VITE_FRONTEND_FORGE_API_URL=...

# OpenAI
OPENAI_API_KEY=...

# Stripe (Pagamentos)
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
VITE_STRIPE_PUBLISHABLE_KEY=...

# Aplicação
VITE_APP_TITLE=...
VITE_APP_LOGO=...
```

### Variáveis Opcionais

```bash
# DataJud API (CNJ)
# Se não configurada, usa chave pública de demonstração
DATAJUD_API_KEY=cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==
```

---

## 🛡️ Autenticação e Autorização

### Sistema de Roles

O PromptJur implementa controle de acesso baseado em funções (RBAC):

- **`user`**: Usuário padrão com acesso às funcionalidades principais
- **`admin`**: Administrador com acesso total, incluindo Admin Tools

### Proteção de Rotas

**Backend (tRPC)**:
```typescript
// Rota pública (sem autenticação)
publicProcedure.query(() => { ... })

// Rota protegida (requer autenticação)
protectedProcedure.query(({ ctx }) => {
  // ctx.user está disponível
})

// Rota admin (requer role='admin')
adminProcedure.query(({ ctx }) => {
  // ctx.user.role === 'admin'
})
```

**Frontend (React)**:
```typescript
// Verificar autenticação
const { user, isAuthenticated } = useAuth();

// Verificar role
if (user?.role === 'admin') {
  // Mostrar funcionalidade admin
}
```

---

## 🔒 Proteção de Dados Sensíveis

### O Que NUNCA Deve Ser Commitado

❌ **Proibido no código-fonte**:
- Senhas em texto claro
- Chaves de API privadas
- Tokens de autenticação
- Strings de conexão de banco de dados com credenciais
- Certificados SSL/TLS privados
- Secrets do JWT

### Armazenamento Seguro

✅ **Práticas corretas**:

1. **Variáveis de Ambiente**: Use `process.env.VARIABLE_NAME`
2. **Secrets do Manus**: Configure via UI em Settings → Secrets
3. **Banco de Dados**: Armazene apenas hashes (bcrypt, argon2) para senhas
4. **S3**: Use `storagePut()` para arquivos sensíveis com ACL privada

### Dados Pessoais (LGPD/GDPR)

O PromptJur coleta e armazena:
- Nome completo
- E-mail
- Método de login (Google, etc.)
- Histórico de uso (prompts, documentos gerados)
- Logs de auditoria (ações administrativas)

**Direitos dos usuários**:
- Acesso aos dados (via dashboard)
- Exportação (funcionalidade futura)
- Exclusão (funcionalidade futura)

---

## ✅ Checklist de Segurança para Desenvolvedores

Antes de fazer commit/deploy, verifique:

### Código
- [ ] Nenhuma credencial hardcoded no código
- [ ] Todas as chaves de API usam `process.env`
- [ ] Validação de input em todas as rotas tRPC
- [ ] Sanitização de dados antes de inserir no banco
- [ ] Proteção contra SQL Injection (Drizzle ORM faz isso automaticamente)
- [ ] Proteção contra XSS (React faz isso automaticamente)

### Autenticação
- [ ] Rotas sensíveis protegidas com `protectedProcedure` ou `adminProcedure`
- [ ] Frontend verifica `isAuthenticated` antes de mostrar dados sensíveis
- [ ] Logout limpa cookies e sessão corretamente

### Dados
- [ ] Senhas nunca armazenadas em texto claro
- [ ] Dados sensíveis criptografados em trânsito (HTTPS)
- [ ] Logs não contêm informações sensíveis (senhas, tokens)
- [ ] Backups do banco de dados protegidos

### APIs Externas
- [ ] Chaves de API em variáveis de ambiente
- [ ] Rate limiting implementado (já existe no sistema)
- [ ] Timeout configurado para evitar travamentos
- [ ] Tratamento de erros não expõe detalhes internos

### Dependências
- [ ] Pacotes npm atualizados regularmente
- [ ] Vulnerabilidades conhecidas verificadas (`pnpm audit`)
- [ ] Dependências desnecessárias removidas

---

## 🚨 Relatando Vulnerabilidades

Se você descobrir uma vulnerabilidade de segurança no PromptJur:

1. **NÃO** abra uma issue pública no GitHub
2. Entre em contato diretamente com o proprietário via e-mail
3. Forneça detalhes sobre a vulnerabilidade:
   - Descrição do problema
   - Passos para reproduzir
   - Impacto potencial
   - Sugestões de correção (opcional)

Responderemos em até 48 horas e trabalharemos para corrigir o problema o mais rápido possível.

---

## 📚 Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [LGPD - Lei Geral de Proteção de Dados](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)
- [GDPR - General Data Protection Regulation](https://gdpr.eu/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [React Security Best Practices](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml)

---

**Última atualização**: 30 de janeiro de 2026
