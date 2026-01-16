# 🤝 Guia de Contribuição - PromptJur

Obrigado por considerar contribuir com o PromptJur! Este documento fornece diretrizes para contribuir com o projeto.

---

## 📋 Código de Conduta

Ao participar deste projeto, você concorda em manter um ambiente respeitoso e colaborativo. Esperamos:

- ✅ Respeito mútuo entre todos os colaboradores
- ✅ Comunicação construtiva e profissional
- ✅ Foco em melhorar o projeto para a comunidade
- ❌ Linguagem ofensiva ou discriminatória
- ❌ Assédio de qualquer tipo

---

## 🚀 Como Contribuir

### 1. Reportar Bugs

Se você encontrou um bug, por favor:

1. Verifique se já não existe uma [issue aberta](https://github.com/SEU-USUARIO/promptjur-web/issues)
2. Crie uma nova issue com:
   - **Título claro**: "Bug: [descrição curta]"
   - **Descrição detalhada**: O que aconteceu vs. o esperado
   - **Passos para reproduzir**: Lista numerada
   - **Ambiente**: Sistema operacional, navegador, versão Node.js
   - **Screenshots**: Se aplicável

**Template de Bug Report:**
```markdown
## Descrição
[Descrição clara do bug]

## Passos para Reproduzir
1. Vá para '...'
2. Clique em '...'
3. Role até '...'
4. Veja o erro

## Comportamento Esperado
[O que deveria acontecer]

## Comportamento Atual
[O que está acontecendo]

## Ambiente
- OS: [ex: Windows 11]
- Navegador: [ex: Chrome 120]
- Node.js: [ex: 22.0.0]

## Screenshots
[Se aplicável]
```

### 2. Sugerir Funcionalidades

Para sugerir novas funcionalidades:

1. Abra uma [issue](https://github.com/SEU-USUARIO/promptjur-web/issues/new)
2. Use o título: "Feature: [descrição]"
3. Descreva:
   - **Problema**: Que problema resolve?
   - **Solução**: Como funcionaria?
   - **Alternativas**: Outras abordagens consideradas?
   - **Contexto**: Por que é importante?

### 3. Contribuir com Código

#### 3.1 Fork e Clone

```bash
# 1. Fork o repositório no GitHub (botão "Fork")

# 2. Clone seu fork
git clone https://github.com/SEU-USUARIO/promptjur-web.git
cd promptjur-web

# 3. Adicione o repositório original como upstream
git remote add upstream https://github.com/ORIGINAL-USUARIO/promptjur-web.git
```

#### 3.2 Criar Branch

```bash
# Atualizar main
git checkout main
git pull upstream main

# Criar branch para sua feature/fix
git checkout -b feature/nome-da-funcionalidade
# ou
git checkout -b fix/nome-do-bug
```

**Convenção de nomes:**
- `feature/` - Novas funcionalidades
- `fix/` - Correção de bugs
- `docs/` - Documentação
- `refactor/` - Refatoração de código
- `test/` - Adição de testes

#### 3.3 Fazer Alterações

```bash
# Instalar dependências
pnpm install

# Configurar ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Executar em desenvolvimento
pnpm dev
```

**Diretrizes de Código:**

- ✅ Siga o estilo TypeScript do projeto
- ✅ Use componentes funcionais React
- ✅ Mantenha funções pequenas e focadas
- ✅ Adicione comentários em lógica complexa
- ✅ Use nomes descritivos para variáveis/funções
- ✅ Mantenha consistência com código existente

#### 3.4 Testar

```bash
# Executar testes (se disponível)
pnpm test

# Build de produção
pnpm build

# Verificar TypeScript
pnpm tsc --noEmit
```

#### 3.5 Commit

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Formato: tipo(escopo): descrição

git add .
git commit -m "feat(dashboard): adiciona filtro por data no histórico"
git commit -m "fix(export): corrige formatação ABNT em PDFs"
git commit -m "docs(readme): atualiza instruções de instalação"
```

**Tipos de commit:**
- `feat` - Nova funcionalidade
- `fix` - Correção de bug
- `docs` - Documentação
- `style` - Formatação (não afeta código)
- `refactor` - Refatoração
- `test` - Testes
- `chore` - Manutenção

#### 3.6 Push e Pull Request

```bash
# Enviar para seu fork
git push origin feature/nome-da-funcionalidade
```

No GitHub:
1. Vá para seu fork
2. Clique em **"Compare & pull request"**
3. Preencha o template:
   - **Título**: Descrição clara
   - **Descrição**: O que mudou e por quê
   - **Issues relacionadas**: Fecha #123
   - **Checklist**: Marque itens completados
4. Clique em **"Create pull request"**

**Template de Pull Request:**
```markdown
## Descrição
[Descrição clara das mudanças]

## Tipo de Mudança
- [ ] Bug fix (mudança que corrige um problema)
- [ ] Nova funcionalidade (mudança que adiciona funcionalidade)
- [ ] Breaking change (correção ou funcionalidade que quebraria funcionalidade existente)
- [ ] Documentação

## Como Foi Testado?
[Descreva os testes realizados]

## Checklist
- [ ] Meu código segue o estilo do projeto
- [ ] Revisei meu próprio código
- [ ] Comentei código complexo
- [ ] Atualizei documentação
- [ ] Minhas mudanças não geram novos warnings
- [ ] Adicionei testes (se aplicável)
- [ ] Testes passam localmente

## Screenshots (se aplicável)
[Adicione screenshots]
```

---

## 🎨 Padrões de Código

### TypeScript

```typescript
// ✅ Bom
interface User {
  id: number;
  name: string;
  email: string;
}

function getUserById(id: number): User | null {
  // implementação
}

// ❌ Ruim
function getUser(x: any): any {
  // implementação
}
```

### React Components

```tsx
// ✅ Bom - Componente funcional com tipos
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={`btn-${variant}`}>
      {label}
    </button>
  );
}

// ❌ Ruim - Sem tipos
export function Button({ label, onClick, variant }) {
  // ...
}
```

### tRPC Procedures

```typescript
// ✅ Bom
export const appRouter = router({
  user: router({
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        return await getUserById(input.id);
      }),
  }),
});

// ❌ Ruim - Sem validação
export const appRouter = router({
  user: router({
    getById: protectedProcedure.query(async ({ input }) => {
      return await getUserById(input.id); // input não validado
    }),
  }),
});
```

---

## 📚 Estrutura do Projeto

```
promptjur-web/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── lib/           # Utilitários
│   │   └── utils/         # Funções auxiliares
├── server/                # Backend Express + tRPC
│   ├── routers.ts         # Rotas tRPC
│   ├── db.ts              # Funções de banco
│   └── _core/             # Infraestrutura
├── drizzle/               # Schema do banco
├── shared/                # Código compartilhado
└── docs/                  # Documentação
```

---

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
pnpm test

# Modo watch
pnpm test:watch

# Com coverage
pnpm test:coverage
```

### Escrever Testes

```typescript
// Exemplo de teste unitário
import { describe, it, expect } from 'vitest';
import { formatABNT } from '@/utils/exportABNT';

describe('formatABNT', () => {
  it('deve formatar texto com Arial 12pt', () => {
    const result = formatABNT('Teste');
    expect(result).toContain('font-family: Arial');
    expect(result).toContain('font-size: 12pt');
  });
});
```

---

## 📖 Documentação

### Atualizar README

Se suas mudanças afetam:
- Instalação
- Configuração
- Uso da aplicação
- API

**Por favor, atualize o README.md!**

### Adicionar Comentários

```typescript
// ✅ Bom - Comenta o "porquê"
// Usamos debounce para evitar requisições excessivas durante digitação
const debouncedSearch = useMemo(
  () => debounce(handleSearch, 300),
  []
);

// ❌ Ruim - Comenta o "o quê" (óbvio)
// Define a variável count como 0
const count = 0;
```

---

## 🔍 Revisão de Código

Ao revisar Pull Requests, considere:

### Funcionalidade
- ✅ Resolve o problema proposto?
- ✅ Funciona conforme esperado?
- ✅ Não quebra funcionalidades existentes?

### Código
- ✅ Segue padrões do projeto?
- ✅ Está bem estruturado?
- ✅ É fácil de entender?
- ✅ Tem comentários onde necessário?

### Testes
- ✅ Inclui testes adequados?
- ✅ Testes passam?
- ✅ Coverage adequado?

### Documentação
- ✅ README atualizado (se necessário)?
- ✅ Comentários de código adequados?
- ✅ Changelog atualizado?

---

## 🎯 Áreas para Contribuir

### 🐛 Bugs Conhecidos
- Erros TypeScript em `Historico.tsx`
- Erros TypeScript em `db-legislacao-cache.ts`

### ✨ Funcionalidades Desejadas
- Sistema de avaliação de templates
- Comentários em templates públicos
- Analytics para autores
- Exportação em mais formatos
- Integração com tribunais brasileiros

### 📚 Documentação
- Tutoriais em vídeo
- Guias de uso avançado
- Tradução para inglês
- Exemplos de uso

### 🧪 Testes
- Aumentar coverage
- Testes E2E
- Testes de integração

---

## 💬 Comunicação

### Issues
- Para bugs e features: [GitHub Issues](https://github.com/SEU-USUARIO/promptjur-web/issues)

### Discussões
- Para perguntas e ideias: [GitHub Discussions](https://github.com/SEU-USUARIO/promptjur-web/discussions)

### Email
- Para questões privadas: seu-email@exemplo.com

---

## 📜 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma [Licença MIT](LICENSE) do projeto.

---

## 🙏 Agradecimentos

Obrigado por contribuir com o PromptJur! Sua ajuda é fundamental para melhorar a ferramenta para toda a comunidade jurídica brasileira.

**Principais Contribuidores:**
- [Lista será atualizada]

---

**Dúvidas?** Abra uma [issue](https://github.com/SEU-USUARIO/promptjur-web/issues) ou [discussão](https://github.com/SEU-USUARIO/promptjur-web/discussions)!
