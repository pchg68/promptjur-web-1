# Diagnóstico de saneamento técnico: TypeScript e testes globais

Este documento registra o diagnóstico inicial realizado em branch separada após a integração da refatoração de fluxo único. O objetivo é **não misturar a mudança funcional já aprovada** com a correção ampla de dívida técnica existente no projeto.

## Estado-base

| Item | Valor |
|---|---|
| Branch de saneamento | `fix/technical-debt-typecheck-tests` |
| Base | `main` após merge do PR #13 |
| Commit de checkpoint | `15bceeb` |
| Comando de typecheck | `pnpm exec tsc --noEmit --pretty false` |
| Comando de testes | `pnpm test -- --run` |

## Resultado do diagnóstico

| Validação | Resultado |
|---|---:|
| Erros TypeScript totais | 191 |
| Arquivos com erro TypeScript | 69 |
| Test files | 15 failed / 65 passed / 80 total |
| Testes | 60 failed / 1096 passed / 10 skipped / 1166 total |
| Duração dos testes | 9.09s |

## Perfil dos erros TypeScript

A maioria dos erros decorre de tipagem implícita ou incompleta, especialmente `TS7006`, que indica parâmetro com tipo `any` implícito quando o compilador está configurado para rejeitar inferência insegura. Esse tipo de erro normalmente é corrigido por tipagem explícita dos dados retornados por queries, handlers e callbacks, sem necessariamente alterar comportamento de runtime.

| Código TS | Ocorrências | Interpretação técnica |
|---|---:|---|
| TS7006 | 163 | Parâmetros sem tipo explícito em callbacks/handlers |
| TS2802 | 11 | Iteração sobre tipos que exigem alvo `es2015` ou `--downlevelIteration` |
| TS2339 | 7 | Acesso a propriedade inexistente no tipo inferido |
| TS2322 | 4 | Atribuição incompatível entre tipos |
| TS2304 | 2 | Nome não encontrado no escopo |
| TS7053 | 1 | Índice dinâmico sem assinatura compatível |
| TS2538 | 1 | Uso de `unknown` como índice |
| TS2347 | 1 | Chamada sem tipo não aceita com type arguments |
| TS2345 | 1 | Argumento incompatível com parâmetro esperado |

## Arquivos com maior concentração de erros TypeScript

| Arquivo | Erros |
|---|---:|
| `server/db.legacy.ts` | 17 |
| `server/db/historico.ts` | 12 |
| `client/src/pages/Blog.tsx` | 9 |
| `client/src/components/HistoricoVersoes.tsx` | 9 |
| `client/src/components/TabWhitelist.tsx` | 8 |
| `server/routers/crm.ts` | 5 |
| `server/routers/admin/leads.ts` | 5 |
| `server/performance.ts` | 5 |
| `server/db-search.ts` | 5 |
| `server/_core/query-error-alert.ts` | 5 |
| `client/src/pages/Templates.tsx` | 5 |

## Perfil das falhas de teste

As falhas de teste estão distribuídas por grupos funcionais distintos, o que confirma que o saneamento deve ser tratado em PR próprio e subdividido em commits temáticos. Há falhas dependentes de ambiente/segredos, falhas de testes de contrato obsoletos e falhas de regras de negócio/serialização.

| Grupo | Exemplos observados | Prioridade sugerida |
|---|---|---|
| Testes dependentes de ambiente externo | `OpenAI API Key Validation`, `Resend API Key Validation`, `Sentry DSN Validation` | Alta: isolar ou mockar para CI/local |
| Contratos/refactors obsoletos | `Dashboard.tsx should import refactored components`, `TabGerar should have Artifact View` | Alta: atualizar expectativa dos testes ao código atual |
| Serialização tRPC | `prompts.search não deve retornar objetos Date` | Alta: risco funcional em cliente/API |
| Histórico/cache | `historico-painel`, `cache-system`, `historico-filtros` | Média/Alta: validar regra de negócio |
| Stripe/planos | `stripe-products.test.ts` | Média: alinhar fixture com preço/plano vigente |
| Estabilidade/performance | `stability-fixes`, `iceberg-critical-fixes`, `memory-leak-fixes` | Média: revisar se são testes-guia ou regressões reais |

## Estratégia recomendada de correção

A correção deve seguir ordem de baixo risco para alto impacto. Primeiro, atacar os erros TypeScript mais mecânicos, especialmente `TS7006`, pois eles representam a maior parte do volume e tendem a desbloquear uma visão mais limpa dos erros realmente semânticos. Em seguida, separar os testes que exigem ambiente real de serviços externos, substituindo validações diretas por mocks ou pulando-as explicitamente quando variáveis obrigatórias não estiverem configuradas. Por fim, revisar os testes de contrato que aparentam estar acoplados a componentes/arquiteturas antigas.

| Etapa | Escopo | Critério de conclusão |
|---|---|---|
| 1 | Tipagem explícita em callbacks e dados de queries | Reduzir significativamente `TS7006` sem alterar runtime |
| 2 | Ajustes pontuais de tipos semânticos (`TS2339`, `TS2322`, `TS7053`) | `typecheck` sem erros ou com lista residual justificada |
| 3 | Testes dependentes de API/segredos | Testes locais não devem falhar por ausência de credenciais |
| 4 | Testes obsoletos de refatoração/componentes | Expectativas devem refletir arquitetura atual |
| 5 | Testes de domínio: histórico, cache, Stripe e tRPC | Diferenciar bug real de fixture obsoleta |

## Decisão técnica

Não é recomendável corrigir todas as falhas globais no mesmo PR da refatoração de fluxo único, porque isso misturaria alterações de UX, tipagem, infraestrutura de testes e regras de negócio. A branch `fix/technical-debt-typecheck-tests` deve permanecer como trilha independente, com commits pequenos e revisáveis.

## Referências

[1]: https://www.typescriptlang.org/tsconfig/#noImplicitAny "TypeScript TSConfig — noImplicitAny"
[2]: https://vitest.dev/guide/ "Vitest — Guide"
[3]: https://playwright.dev/docs/best-practices "Playwright — Best Practices"

## Atualização: etapa TypeScript concluída

Após a aplicação da estratégia de baixo risco, foram tipados explicitamente callbacks, handlers e retornos de queries que geravam `TS7006`, além de ajustes pontuais para símbolos ausentes, campos de catálogo incorretos, inferências `unknown`, parâmetros curinga do Express e compatibilidade de iteração. O `tsconfig.json` também passou a declarar `target: "ES2020"`, coerente com o ambiente Node/Vite do projeto e necessário para iteração segura sobre `Map` e `Set`.

| Validação | Resultado |
|---|---:|
| Typecheck após correções | 0 erros |
| Comando | `pnpm exec tsc --noEmit --pretty false` |
| Observação operacional | Foi necessário remover `node_modules/typescript/tsbuildinfo` para invalidar cache incremental antigo; após a limpeza, a configuração efetiva exibiu `target: "es2020"` e o typecheck concluiu com sucesso. |

A próxima frente permanece concentrada nos testes globais. A prioridade técnica é isolar validações que dependem de serviços externos e segredos reais, depois revisar testes de contrato possivelmente acoplados a componentes ou arquitetura anterior.

## Atualização: etapa de testes concluída

A frente de testes foi saneada seguindo a ordem de menor risco. Primeiro, as validações que exigiam serviços externos foram convertidas para execução condicional, mantendo verificações estruturais locais e pulando chamadas reais quando as credenciais ou a intenção explícita de teste de integração não estiverem presentes. Em seguida, foram corrigidos contratos textuais acoplados à arquitetura antiga, especialmente testes que ainda apontavam para módulos monolíticos ou componentes removidos. Por fim, foram tratados casos de domínio em backup, cache legislativo, histórico, serialização tRPC, Sentry e catálogo de planos, separando bugs reais de fixtures obsoletas.

| Validação | Resultado |
|---|---:|
| Typecheck final após saneamento de testes | 0 erros |
| Comando de typecheck | `pnpm exec tsc --noEmit` |
| Suíte global final | 78 test files passed / 2 skipped / 80 total |
| Testes finais | 1165 passed / 17 skipped / 1182 total |
| Comando de testes | `pnpm test -- --run` |
| Log de evidência | `/tmp/promptjur-tech-debt/global-tests-final-before-commit.log` |

As principais decisões técnicas foram: manter testes de integração real atrás de skips condicionais quando `OPENAI_API_KEY`, `RESEND_API_KEY`, `SENTRY_DSN` ou banco real não estiverem disponíveis; atualizar contratos de estabilidade e memory leak para os módulos split atuais em vez de ressuscitar `server/db.ts` monolítico; mockar banco, dump e armazenamento nos testes de backup/cache para remover dependência de infraestrutura local; e introduzir fallbacks vazios em leitores de busca/histórico quando o banco está indisponível, preservando a forma esperada pelo cliente e evitando `Date` nativo em respostas tRPC.

Permanece apenas ruído controlado de stderr em testes que intencionalmente exercitam caminhos de erro, como jobs de preço, e-mail sem provedor e alertas de schema/query. Esses logs não indicam falhas de asserção na execução final, mas podem ser alvo de refinamento futuro se o objetivo passar a incluir suíte silenciosa.
