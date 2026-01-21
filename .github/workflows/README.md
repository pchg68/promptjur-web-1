# GitHub Actions CI/CD

Este diretório contém os workflows de CI/CD para o PromptJur.

## Workflows Disponíveis

### `ci.yml` - Pipeline Principal

Pipeline de Integração Contínua que executa em cada push ou pull request para as branches `main` e `develop`.

**Jobs:**

1. **Lint e Type Check**
   - Executa verificação de tipos TypeScript
   - Executa ESLint (quando configurado)
   - Garante qualidade de código

2. **Testes Automatizados**
   - Executa todos os testes com Vitest
   - Gera relatório de coverage
   - Upload opcional para Codecov

3. **Build**
   - Compila o projeto para produção
   - Verifica se o build foi bem-sucedido
   - Valida arquivos de saída

4. **Notificação**
   - Notifica sucesso do pipeline

## Como Funciona

### Trigger Automático

O pipeline é executado automaticamente quando:
- Você faz push para `main` ou `develop`
- Alguém abre um Pull Request para `main` ou `develop`

### Visualizar Resultados

1. Acesse a aba **Actions** no repositório GitHub
2. Clique no workflow que deseja visualizar
3. Veja os logs de cada job

### Status Badge

Adicione este badge ao README.md principal para mostrar o status do CI:

```markdown
![CI/CD Pipeline](https://github.com/SEU-USUARIO/promptjur-web/actions/workflows/ci.yml/badge.svg)
```

## Configuração Opcional

### Codecov (Coverage)

Para habilitar relatórios de coverage:

1. Crie conta em [codecov.io](https://codecov.io)
2. Adicione o repositório
3. Copie o token
4. Adicione como secret no GitHub:
   - Vá em Settings → Secrets and variables → Actions
   - Adicione `CODECOV_TOKEN` com o valor do token

### Notificações

Para receber notificações:

1. Configure notificações do GitHub em Settings → Notifications
2. Ou integre com Slack/Discord usando GitHub Actions

## Melhorias Futuras

- [ ] Adicionar deploy automático para Railway/Render
- [ ] Adicionar testes E2E com Playwright
- [ ] Adicionar análise de segurança com Snyk
- [ ] Adicionar verificação de dependências desatualizadas
- [ ] Adicionar build de Docker image

## Troubleshooting

### Pipeline Falhando

**Problema:** TypeScript check falha
- **Solução:** Execute `pnpm run typecheck` localmente e corrija os erros

**Problema:** Testes falhando
- **Solução:** Execute `pnpm test` localmente e corrija os testes

**Problema:** Build falha
- **Solução:** Execute `pnpm run build` localmente e verifique erros

### Performance

Se o pipeline está lento:
- Cache de dependências já está configurado
- Considere paralelizar jobs independentes
- Use self-hosted runners para projetos privados

## Recursos

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vitest Documentation](https://vitest.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
