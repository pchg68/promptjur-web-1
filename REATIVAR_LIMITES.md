# Guia de Reativação de Limites de Uso

## 📋 Contexto

O sistema de limites de uso foi temporariamente desativado para permitir testes sem restrições. Este documento explica como reativá-lo quando o PromptJur estiver pronto para produção.

---

## 🔧 Passos para Reativação

### 1. Descomentar Verificações de Limite

Abra o arquivo `/home/ubuntu/promptjur-web/server/routers.ts` e localize as 3 ocorrências de código comentado:

```typescript
// TEMPORARIAMENTE DESATIVADO: Verificar limite de uso (para fase de testes)
// const usageCheck = checkUsageLimit(ctx.user.subscriptionPlan, ctx.user.usageCount);
// if (usageCheck.exceeded) {
//   throw new Error(getUpgradeMessage(ctx.user.subscriptionPlan));
// }
```

**Descomente** essas linhas nas seguintes procedures:
- `prompts.analisar` (linha ~36-40)
- `prompts.gerar` (linha ~169-173)
- `prompts.otimizar` (linha ~308-312)

**Código reativado deve ficar assim:**

```typescript
// Verificar limite de uso
const usageCheck = checkUsageLimit(ctx.user.subscriptionPlan, ctx.user.usageCount);
if (usageCheck.exceeded) {
  throw new Error(getUpgradeMessage(ctx.user.subscriptionPlan));
}
```

### 2. Ativar Stripe Sandbox (Obrigatório)

⚠️ **ATENÇÃO**: O link de ativação do Stripe expira em **18/01/2026**

1. Acesse: https://dashboard.stripe.com/claim_sandbox/YWNjdF8xU1VaS0lMWFRqTGR6dHY1LDE3NjQxNjcwOTEv100m8ueqxAA
2. Faça login ou crie conta Stripe
3. Ative o sandbox de testes
4. Configure os webhooks (já implementados em `/api/stripe/webhook`)

### 3. Configurar Planos de Pagamento

Os planos já estão definidos em `/server/stripe-products.ts`:

| Plano | Limite Mensal | Preço | Status |
|-------|---------------|-------|--------|
| **Free** | 5 gerações | Grátis | Ativo |
| **Pro** | Ilimitado | R$ 49/mês | Requer Stripe |
| **Enterprise** | Ilimitado + Suporte | R$ 199/mês | Requer Stripe |

### 4. Testar Fluxo de Upgrade

Após reativar:

1. Crie usuário de teste (plano Free)
2. Execute 6 gerações de prompts
3. Verifique se modal de upgrade aparece
4. Teste checkout Stripe
5. Confirme que webhook atualiza `subscriptionPlan` no banco

### 5. Monitorar Webhook Stripe

O webhook está configurado em `/server/routers.ts` (linha ~700+) e processa:
- ✅ `checkout.session.completed` - Atualiza plano após pagamento
- ✅ `customer.subscription.updated` - Sincroniza mudanças de plano
- ✅ `customer.subscription.deleted` - Rebaixa para Free ao cancelar

**Endpoint**: `https://SEU_DOMINIO/api/stripe/webhook`

---

## 📊 Limites Atuais

### Plano Free
- **Análises**: 5/mês
- **Gerações**: 5/mês
- **Otimizações**: 5/mês
- **Total**: 5 operações/mês (compartilhado)

### Plano Pro
- **Todas operações**: Ilimitadas

### Plano Enterprise
- **Todas operações**: Ilimitadas
- **Suporte prioritário**: Sim

---

## 🧪 Script de Teste

Use este script para testar o webhook Stripe:

```bash
cd /home/ubuntu/promptjur-web
node test-stripe-webhook.mjs
```

---

## ⚙️ Arquivos Relacionados

- `/server/routers.ts` - Verificações de limite (linhas 36, 169, 308)
- `/shared/usage-limits.ts` - Lógica de verificação de limites
- `/server/stripe-products.ts` - Definição de planos
- `/client/src/pages/Dashboard.tsx` - Modal de upgrade (linha ~50)
- `/server/db.ts` - Campo `usageCount` no schema de usuários

---

## 🚨 Avisos Importantes

1. **Não reative sem Stripe configurado** - Usuários não poderão fazer upgrade
2. **Teste em ambiente de desenvolvimento primeiro**
3. **Monitore logs do webhook** após ativar
4. **Comunique usuários** sobre mudança de política de uso

---

## 📞 Suporte

Em caso de dúvidas sobre reativação:
1. Revise código em `/server/routers.ts`
2. Consulte documentação Stripe: https://stripe.com/docs/webhooks
3. Verifique logs do servidor para erros
