# Guia Completo: Migração do PromptJur do Manus para Railway

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Fase 1: Preparação do Código](#fase-1-preparação-do-código)
3. [Fase 2: Configuração do Railway](#fase-2-configuração-do-railway)
4. [Fase 3: Configuração do Banco MySQL](#fase-3-configuração-do-banco-mysql)
5. [Fase 4: Variáveis de Ambiente](#fase-4-variáveis-de-ambiente)
6. [Fase 5: Deploy e Testes](#fase-5-deploy-e-testes)
7. [Fase 6: Migração de Dados](#fase-6-migração-de-dados)
8. [Fase 7: Domínio Customizado](#fase-7-domínio-customizado-opcional)
9. [Troubleshooting](#troubleshooting)

---

## Pré-requisitos

### ✅ Checklist Antes de Começar

- [ ] Conta GitHub criada (https://github.com/signup)
- [ ] Conta Railway criada (https://railway.app/login)
- [ ] Código do PromptJur baixado localmente
- [ ] Git instalado no seu computador
- [ ] Backup do banco de dados atual (exportar via Manus UI)
- [ ] Lista de variáveis de ambiente atuais

### 💳 Custos Estimados

- **Desenvolvimento/Teste**: $5-10/mês
- **Produção (baixo tráfego)**: $10-20/mês
- **Produção (médio tráfego)**: $20-50/mês

Railway oferece **$5 de crédito grátis/mês** para começar.

---

## Fase 1: Preparação do Código

### 1.1 Criar Repositório GitHub

```bash
# 1. Criar repositório no GitHub
# Acesse: https://github.com/new
# Nome: promptjur-web
# Visibilidade: Private (recomendado)
# NÃO inicialize com README

# 2. No seu computador, navegue até a pasta do projeto
cd /caminho/para/promptjur-web

# 3. Inicializar Git (se ainda não estiver)
git init

# 4. Adicionar todos os arquivos
git add .

# 5. Fazer primeiro commit
git commit -m "Initial commit - PromptJur migration to Railway"

# 6. Conectar ao repositório GitHub
git remote add origin https://github.com/SEU-USUARIO/promptjur-web.git

# 7. Enviar código para GitHub
git branch -M main
git push -u origin main
```

### 1.2 Criar Arquivo de Configuração Railway

Crie o arquivo `railway.json` na raiz do projeto:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install && pnpm build"
  },
  "deploy": {
    "startCommand": "pnpm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 1.3 Atualizar package.json

Certifique-se de que o `package.json` tem os scripts corretos:

```json
{
  "scripts": {
    "dev": "tsx watch server/_core/index.ts",
    "build": "tsc && vite build",
    "start": "NODE_ENV=production node dist/server/_core/index.js",
    "db:push": "drizzle-kit push",
    "db:generate": "drizzle-kit generate"
  },
  "engines": {
    "node": ">=22.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

### 1.4 Criar .gitignore

Certifique-se de que `.gitignore` inclui:

```
node_modules/
dist/
.env
.env.local
.vite/
*.log
.DS_Store
```

### 1.5 Commit das Alterações

```bash
git add railway.json package.json .gitignore
git commit -m "Add Railway configuration"
git push
```

---

## Fase 2: Configuração do Railway

### 2.1 Criar Novo Projeto

1. Acesse https://railway.app/dashboard
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"**
4. Autorize Railway a acessar seu GitHub
5. Selecione o repositório **promptjur-web**
6. Railway detectará automaticamente que é um projeto Node.js

### 2.2 Configurar Build

Railway detectará automaticamente:
- **Runtime**: Node.js 22
- **Package Manager**: pnpm
- **Build Command**: `pnpm install && pnpm build`
- **Start Command**: `pnpm start`

Se não detectar, configure manualmente em **Settings → Build**:
- Build Command: `pnpm install && pnpm build`
- Start Command: `pnpm start`

---

## Fase 3: Configuração do Banco MySQL

### 3.1 Adicionar MySQL ao Projeto

1. No dashboard do Railway, clique em **"+ New"**
2. Selecione **"Database"**
3. Escolha **"Add MySQL"**
4. Railway criará automaticamente um banco MySQL

### 3.2 Obter Credenciais do Banco

1. Clique no serviço **MySQL** no dashboard
2. Vá para a aba **"Variables"**
3. Copie as seguintes variáveis:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLUSER`
   - `MYSQLDATABASE`
   - `MYSQLPASSWORD`

### 3.3 Construir DATABASE_URL

Formato da URL de conexão MySQL:

```
mysql://USUARIO:SENHA@HOST:PORTA/DATABASE
```

Exemplo:

```
mysql://root:abc123xyz@mysql.railway.internal:3306/railway
```

**Importante**: Railway fornece uma variável `DATABASE_URL` automaticamente. Você pode usar diretamente ou construir manualmente.

### 3.4 Testar Conexão (Opcional)

Você pode testar a conexão localmente antes do deploy:

```bash
# Instalar cliente MySQL
brew install mysql  # macOS
# ou
sudo apt install mysql-client  # Linux

# Conectar ao banco Railway
mysql -h MYSQLHOST -P MYSQLPORT -u MYSQLUSER -p MYSQLDATABASE
# Digite a senha quando solicitado
```

---

## Fase 4: Variáveis de Ambiente

### 4.1 Variáveis Obrigatórias

No Railway, vá para o serviço **promptjur-web** → **Variables** e adicione:

#### **Banco de Dados**
```
DATABASE_URL=mysql://user:pass@host:port/database
```
*(Copie do serviço MySQL ou use a variável automática)*

#### **Autenticação**

**Opção 1: Manter OAuth Manus (Temporário)**
```
JWT_SECRET=sua-chave-secreta-super-segura-aqui
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
VITE_APP_ID=seu-app-id-manus
OWNER_OPEN_ID=seu-open-id
OWNER_NAME=Seu Nome
```

**Opção 2: Implementar Auth Próprio (Recomendado para Produção)**
```
JWT_SECRET=sua-chave-secreta-super-segura-aqui
# Adicionar variáveis de email/senha conforme implementação
```

#### **LLM (IA)**

**Opção 1: Manter Manus LLM (Temporário)**
```
BUILT_IN_FORGE_API_KEY=sua-chave-manus
BUILT_IN_FORGE_API_URL=https://forge.manus.im
VITE_FRONTEND_FORGE_API_KEY=sua-chave-frontend
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.im
```

**Opção 2: Usar OpenAI (Recomendado para Produção)**
```
OPENAI_API_KEY=sk-proj-...
```

#### **Aplicação**
```
NODE_ENV=production
PORT=3000
VITE_APP_TITLE=PromptJur
VITE_APP_LOGO=/logo.svg
```

### 4.2 Adicionar Variáveis no Railway

1. Acesse **promptjur-web** → **Variables**
2. Clique em **"+ New Variable"**
3. Adicione cada variável (nome e valor)
4. Clique em **"Add"**

**Dica**: Use o botão **"Raw Editor"** para colar todas de uma vez:

```
DATABASE_URL=mysql://...
JWT_SECRET=...
OAUTH_SERVER_URL=...
# etc...
```

---

## Fase 5: Deploy e Testes

### 5.1 Iniciar Deploy

1. Railway iniciará o deploy automaticamente após adicionar variáveis
2. Acompanhe os logs em **"Deployments"** → **"View Logs"**
3. Aguarde até ver: `Server running on http://localhost:3000/`

### 5.2 Executar Migrações do Banco

**Opção 1: Via Railway CLI (Recomendado)**

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Conectar ao projeto
railway link

# Executar migração
railway run pnpm db:push
```

**Opção 2: Via Interface Web**

1. No Railway, vá para **promptjur-web** → **Settings**
2. Em **"Deploy Triggers"**, adicione comando:
   ```
   pnpm db:push
   ```
3. Ou execute manualmente via **"Run Command"**

### 5.3 Obter URL da Aplicação

1. No Railway, clique em **promptjur-web**
2. Vá para **"Settings"** → **"Domains"**
3. Railway gera automaticamente: `promptjur-web-production.up.railway.app`
4. Copie a URL

### 5.4 Testar Aplicação

Acesse a URL gerada e teste:

- [ ] Página inicial carrega
- [ ] Login funciona (se usando OAuth Manus)
- [ ] Dashboard abre
- [ ] Análise de prompt funciona
- [ ] Geração de prompt funciona
- [ ] Banco de dados está conectado

---

## Fase 6: Migração de Dados

### 6.1 Exportar Dados do Manus

1. Acesse o painel do Manus
2. Vá para **Database** → **Settings** (canto inferior esquerdo)
3. Copie as credenciais de conexão
4. Use um cliente MySQL (MySQL Workbench, DBeaver, ou linha de comando)

```bash
# Exportar banco de dados Manus
mysqldump -h HOST_MANUS -u USER_MANUS -p DATABASE_MANUS > backup-manus.sql
```

### 6.2 Importar para Railway

```bash
# Importar para Railway
mysql -h HOST_RAILWAY -u USER_RAILWAY -p DATABASE_RAILWAY < backup-manus.sql
```

**Ou via Railway CLI:**

```bash
railway connect MySQL
# Depois execute:
source backup-manus.sql;
```

### 6.3 Verificar Migração

```bash
# Conectar ao banco Railway
railway connect MySQL

# Verificar tabelas
SHOW TABLES;

# Verificar usuários
SELECT COUNT(*) FROM users;

# Verificar prompts
SELECT COUNT(*) FROM prompts;
```

---

## Fase 7: Domínio Customizado (Opcional)

### 7.1 Adicionar Domínio Próprio

1. No Railway, vá para **promptjur-web** → **Settings** → **Domains**
2. Clique em **"+ Custom Domain"**
3. Digite seu domínio: `promptjur.com.br`
4. Railway fornecerá um registro CNAME

### 7.2 Configurar DNS

No seu provedor de domínio (Registro.br, GoDaddy, etc.):

```
Tipo: CNAME
Nome: @ (ou www)
Valor: [valor fornecido pelo Railway]
TTL: 3600
```

### 7.3 Aguardar Propagação

- Propagação DNS: 5 minutos a 48 horas
- SSL automático: Railway gera certificado Let's Encrypt automaticamente

---

## Troubleshooting

### ❌ Erro: "Cannot connect to database"

**Solução:**
1. Verifique se `DATABASE_URL` está correta
2. Certifique-se de que MySQL está rodando no Railway
3. Teste conexão manualmente: `railway connect MySQL`

### ❌ Erro: "Port already in use"

**Solução:**
Railway usa a variável `PORT` automaticamente. Certifique-se de que seu código usa:

```typescript
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### ❌ Erro: "Build failed"

**Solução:**
1. Verifique logs de build no Railway
2. Certifique-se de que `package.json` tem `engines` definido
3. Verifique se todas as dependências estão em `package.json`

### ❌ Erro: "OAuth callback failed"

**Solução:**
1. Se usando Manus OAuth, atualize a URL de callback no painel Manus
2. Ou implemente autenticação própria (email/senha)

### ❌ Deploy não inicia automaticamente

**Solução:**
1. Vá para **Settings** → **Deploy Triggers**
2. Certifique-se de que "Deploy on push" está ativado
3. Ou faça deploy manual: **Deployments** → **"Deploy"**

---

## 📊 Checklist Final

### Antes do Deploy
- [ ] Código no GitHub
- [ ] `railway.json` criado
- [ ] `.gitignore` configurado
- [ ] `package.json` com scripts corretos

### Durante o Deploy
- [ ] Projeto Railway criado
- [ ] MySQL adicionado
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy bem-sucedido

### Após o Deploy
- [ ] Migrações executadas (`pnpm db:push`)
- [ ] Dados migrados do Manus
- [ ] Aplicação testada e funcionando
- [ ] Domínio customizado configurado (opcional)

---

## 🎯 Próximos Passos Recomendados

### Curto Prazo (1-2 semanas)
1. **Implementar autenticação própria** (email/senha) para não depender do Manus OAuth
2. **Migrar LLM para OpenAI** ou outro provedor independente
3. **Configurar monitoramento** (Sentry, LogRocket)

### Médio Prazo (1-2 meses)
1. **Implementar CI/CD** com GitHub Actions
2. **Adicionar testes automatizados** (vitest)
3. **Configurar backup automático** do banco de dados

### Longo Prazo (3-6 meses)
1. **Implementar cache Redis** para melhor performance
2. **Adicionar CDN** para assets estáticos
3. **Escalar horizontalmente** se necessário

---

## 💡 Dicas Importantes

1. **Sempre teste em ambiente de desenvolvimento primeiro** antes de migrar produção
2. **Mantenha backup do banco de dados Manus** por pelo menos 30 dias após migração
3. **Monitore custos no Railway** - configure alertas de billing
4. **Use variáveis de ambiente** para tudo que é sensível (nunca commite senhas)
5. **Configure logs** para facilitar debugging em produção

---

## 📞 Suporte

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app

---

**Tempo estimado de migração**: 2-4 horas (primeira vez)

**Boa sorte com a migração! 🚀**
