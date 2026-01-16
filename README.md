# ⚖️ PromptJur - Sistema de Engenharia de Prompts Jurídicos

![PromptJur](https://img.shields.io/badge/PromptJur-v1.0.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-22+-green)
![License](https://img.shields.io/badge/license-MIT-blue)

Sistema avançado de engenharia de prompts jurídicos que utiliza inteligência artificial para **analisar**, **otimizar** e **gerar** prompts profissionais para peças jurídicas brasileiras, seguindo normas ABNT e aplicando 7 técnicas avançadas de prompt engineering.

---

## 🎯 Funcionalidades Principais

### 📊 Análise de Prompts
- Análise detalhada de qualidade (clareza, especificidade, contexto)
- Identificação de pontos fortes e fracos
- Sugestões de melhoria específicas
- Score de qualidade visual

### ✨ Otimização de Prompts
- Aplicação de 7 técnicas avançadas de prompt engineering:
  - **Persona**: Define papel especializado do assistente
  - **Contexto Rico**: Adiciona informações relevantes
  - **Instruções Estruturadas**: Organiza comandos claramente
  - **Exemplos**: Fornece referências práticas
  - **Restrições**: Define limites e requisitos
  - **Chain-of-Thought**: Raciocínio passo a passo
  - **Verificação de Qualidade**: Critérios de validação
- Comparação lado a lado (antes/depois)
- Exportação em formato ABNT (.TXT, .DOCX, PDF)

### 🚀 Geração de Prompts Profissionais
- 16 áreas jurídicas especializadas
- 15 tipos de documentos jurídicos
- Modelos personalizados com variáveis dinâmicas
- Biblioteca pública de templates comunitários
- Preview antes de exportar

### 📝 Sistema de Modelos Personalizados
- Criar e salvar templates customizados
- Variáveis dinâmicas ({{nomeVariavel}})
- Compartilhamento público/privado
- Duplicar e editar modelos existentes
- Busca e filtros avançados

### 📈 Histórico e Analytics
- Registro completo de todas as operações
- Filtros por tipo, área jurídica e data
- Estatísticas de uso
- Favoritos e organização

---

## 🏗️ Arquitetura

### Stack Tecnológica

**Frontend:**
- React 19 + TypeScript
- Vite (build tool)
- Tailwind CSS 4
- shadcn/ui (componentes)
- tRPC (type-safe API)
- Wouter (roteamento)

**Backend:**
- Node.js 22+
- Express 4
- tRPC 11
- Drizzle ORM
- MySQL/TiDB

**IA/LLM:**
- OpenAI API (recomendado)
- Suporte para Manus LLM (opcional)

**Autenticação:**
- JWT tokens
- OAuth 2.0 (Google, GitHub, Email)

---

## 📋 Pré-requisitos

- **Node.js** 22.0.0 ou superior
- **pnpm** 9.0.0 ou superior
- **MySQL** 8.0 ou superior
- **Conta OpenAI** (para funcionalidade de IA)

---

## 🚀 Instalação Local

### 1. Clone o Repositório

```bash
git clone https://github.com/SEU-USUARIO/promptjur-web.git
cd promptjur-web
```

### 2. Instale as Dependências

```bash
pnpm install
```

### 3. Configure Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com seus valores
nano .env
```

**Variáveis obrigatórias:**

```env
DATABASE_URL=mysql://user:password@localhost:3306/promptjur
JWT_SECRET=sua-chave-secreta-super-segura-aqui
OPENAI_API_KEY=sk-proj-...
NODE_ENV=development
PORT=3000
```

### 4. Configure o Banco de Dados

```bash
# Criar banco de dados
mysql -u root -p -e "CREATE DATABASE promptjur CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Executar migrações
pnpm db:push
```

### 5. Inicie o Servidor de Desenvolvimento

```bash
pnpm dev
```

Acesse: http://localhost:3000

---

## 🌐 Deploy em Produção

### Railway (Recomendado)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

1. Conecte seu repositório GitHub
2. Adicione MySQL database
3. Configure variáveis de ambiente
4. Deploy automático!

**Guia completo**: [GUIA-DEPLOY-RAILWAY.md](./docs/GUIA-DEPLOY-RAILWAY.md)

### Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

1. Conecte seu repositório GitHub
2. Render detecta `render.yaml` automaticamente
3. Configure variáveis de ambiente
4. Deploy!

### Vercel (Frontend) + Railway (Backend + DB)

**Frontend (Vercel):**
```bash
vercel --prod
```

**Backend (Railway):**
- Deploy backend separadamente no Railway
- Configure CORS para aceitar domínio Vercel

---

## 📁 Estrutura do Projeto

```
promptjur-web/
├── client/                    # Frontend React
│   ├── public/               # Assets estáticos
│   ├── src/
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── lib/             # Utilitários e configurações
│   │   ├── utils/           # Funções auxiliares
│   │   └── App.tsx          # Componente principal
├── server/                   # Backend Express + tRPC
│   ├── routers.ts           # Rotas tRPC
│   ├── db.ts                # Funções de banco de dados
│   └── _core/               # Infraestrutura
├── drizzle/                 # Schema e migrações
│   └── schema.ts            # Definição de tabelas
├── shared/                  # Código compartilhado
│   └── juridico.ts          # Constantes jurídicas
├── .env.example             # Exemplo de variáveis
├── railway.json             # Config Railway
├── render.yaml              # Config Render
└── package.json             # Dependências
```

---

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev              # Inicia servidor de desenvolvimento

# Build
pnpm build            # Compila para produção

# Produção
pnpm start            # Inicia servidor de produção

# Banco de Dados
pnpm db:push          # Aplica schema ao banco
pnpm db:generate      # Gera migrações

# Testes
pnpm test             # Executa testes (se configurado)
```

---

## 🗄️ Banco de Dados

### Schema Principal

**Tabelas:**
- `users` - Usuários do sistema
- `historico` - Histórico de prompts
- `templates` - Modelos personalizados
- `legislacao_cache` - Cache de legislação

### Migrações

```bash
# Aplicar mudanças no schema
pnpm db:push

# Gerar arquivos de migração
pnpm db:generate
```

### Backup

```bash
# Exportar banco
mysqldump -u user -p promptjur > backup.sql

# Importar banco
mysql -u user -p promptjur < backup.sql
```

---

## 🔐 Segurança

### Variáveis de Ambiente

- ✅ Nunca commite arquivos `.env`
- ✅ Use `.env.example` como template
- ✅ Gere JWT_SECRET forte: `openssl rand -base64 32`
- ✅ Rotacione chaves regularmente

### Autenticação

- JWT tokens com expiração
- Senhas hasheadas (bcrypt)
- OAuth 2.0 para login social
- Rate limiting em endpoints sensíveis

### Banco de Dados

- Conexões SSL em produção
- Prepared statements (Drizzle ORM)
- Backup automático recomendado

---

## 📊 Áreas Jurídicas Suportadas

1. Direito Civil
2. Direito Penal
3. Direito Trabalhista
4. Direito Tributário
5. Direito Empresarial
6. Direito Administrativo
7. Direito Constitucional
8. Direito do Consumidor
9. Direito Ambiental
10. Direito Previdenciário
11. Direito de Família
12. Direito Imobiliário
13. Direito Eleitoral
14. Direito Médico
15. Direito Digital
16. Direito Internacional

---

## 📄 Tipos de Documentos

1. Petição Inicial
2. Contestação
3. Recurso
4. Agravo
5. Apelação
6. Embargos
7. Mandado de Segurança
8. Habeas Corpus
9. Parecer Jurídico
10. Contrato
11. Notificação Extrajudicial
12. Procuração
13. Memorando
14. Ofício
15. Requerimento

---

## 🎨 Personalização

### Temas

Edite `client/src/index.css` para customizar cores:

```css
:root {
  --primary: 217 91% 60%;
  --secondary: 217 91% 70%;
  /* ... */
}
```

### Logo e Título

Configure em `.env`:

```env
VITE_APP_TITLE=Seu Título
VITE_APP_LOGO=/seu-logo.svg
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🐛 Problemas Conhecidos

### TypeScript Errors (Não-bloqueantes)
- 20 erros em `Historico.tsx` e `db-legislacao-cache.ts`
- Não afetam funcionalidade
- Correção planejada para próxima versão

### Dependência Manus (Temporária)
- OAuth e LLM dependem de APIs Manus
- Migração para OpenAI recomendada
- Guia de migração disponível

---

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/SEU-USUARIO/promptjur-web/issues)
- **Discussões**: [GitHub Discussions](https://github.com/SEU-USUARIO/promptjur-web/discussions)
- **Email**: seu-email@exemplo.com

---

## 🗺️ Roadmap

### v1.1 (Próxima versão)
- [ ] Corrigir erros TypeScript
- [ ] Migração completa para OpenAI
- [ ] Autenticação independente (email/senha)
- [ ] Testes automatizados (vitest)

### v1.2
- [ ] Sistema de avaliação de templates
- [ ] Comentários em templates públicos
- [ ] Analytics para autores de templates
- [ ] Exportação em mais formatos

### v2.0
- [ ] API pública para integrações
- [ ] Mobile app (React Native)
- [ ] Integração com tribunais brasileiros
- [ ] IA multimodal (análise de documentos)

---

## 🙏 Agradecimentos

- **Manus** - Plataforma de desenvolvimento inicial
- **OpenAI** - API de inteligência artificial
- **shadcn/ui** - Componentes de interface
- **Comunidade jurídica brasileira** - Feedback e validação

---

## 📸 Screenshots

### Dashboard Principal
![Dashboard](docs/screenshots/dashboard.png)

### Análise de Prompts
![Análise](docs/screenshots/analise.png)

### Geração de Documentos
![Geração](docs/screenshots/geracao.png)

---

**Desenvolvido com ⚖️ para a comunidade jurídica brasileira**
