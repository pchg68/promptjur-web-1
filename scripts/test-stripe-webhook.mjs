#!/usr/bin/env node

/**
 * Script de Teste para Webhook Stripe
 * 
 * Este script simula eventos do Stripe para testar o processamento de webhooks.
 * Útil para desenvolvimento e validação sem precisar de eventos reais do Stripe.
 * 
 * Uso: node scripts/test-stripe-webhook.mjs
 */

import crypto from 'crypto';

const WEBHOOK_URL = 'http://localhost:3000/api/stripe/webhook';

/**
 * Eventos de teste do Stripe
 */
const TEST_EVENTS = {
  // Assinatura criada com sucesso
  subscriptionCreated: {
    type: 'customer.subscription.created',
    data: {
      object: {
        id: 'sub_test_123',
        customer: 'cus_test_456',
        status: 'active',
        items: {
          data: [{
            price: {
              id: 'price_test_789',
              product: 'prod_test_premium',
              recurring: {
                interval: 'month'
              }
            }
          }]
        },
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        metadata: {
          userId: '1',
          plan: 'premium'
        }
      }
    }
  },

  // Assinatura atualizada
  subscriptionUpdated: {
    type: 'customer.subscription.updated',
    data: {
      object: {
        id: 'sub_test_123',
        customer: 'cus_test_456',
        status: 'active',
        items: {
          data: [{
            price: {
              id: 'price_test_999',
              product: 'prod_test_enterprise',
              recurring: {
                interval: 'year'
              }
            }
          }]
        },
        metadata: {
          userId: '1',
          plan: 'enterprise'
        }
      }
    }
  },

  // Assinatura cancelada
  subscriptionDeleted: {
    type: 'customer.subscription.deleted',
    data: {
      object: {
        id: 'sub_test_123',
        customer: 'cus_test_456',
        status: 'canceled',
        metadata: {
          userId: '1'
        }
      }
    }
  },

  // Pagamento bem-sucedido
  invoicePaid: {
    type: 'invoice.paid',
    data: {
      object: {
        id: 'in_test_123',
        customer: 'cus_test_456',
        subscription: 'sub_test_123',
        amount_paid: 9900, // $99.00
        currency: 'brl',
        status: 'paid',
        metadata: {
          userId: '1'
        }
      }
    }
  },

  // Pagamento falhou
  invoicePaymentFailed: {
    type: 'invoice.payment_failed',
    data: {
      object: {
        id: 'in_test_456',
        customer: 'cus_test_456',
        subscription: 'sub_test_123',
        amount_due: 9900,
        status: 'open',
        metadata: {
          userId: '1'
        }
      }
    }
  }
};

/**
 * Gera assinatura Stripe para validação do webhook
 */
function generateStripeSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
}

/**
 * Envia evento de teste para o webhook
 */
async function sendTestEvent(eventName, eventData) {
  console.log(`\n📤 Enviando evento: ${eventName}`);
  console.log(`   Tipo: ${eventData.type}`);
  
  const payload = JSON.stringify({
    id: `evt_test_${Date.now()}`,
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    ...eventData
  });

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Nota: Em produção, o Stripe envia o header 'stripe-signature'
        // Para teste local, o webhook deve aceitar requisições sem assinatura em modo dev
      },
      body: payload
    });

    const responseText = await response.text();
    
    if (response.ok) {
      console.log(`   ✅ Sucesso: ${response.status}`);
      if (responseText) {
        console.log(`   Resposta: ${responseText}`);
      }
    } else {
      console.log(`   ❌ Erro: ${response.status}`);
      console.log(`   Resposta: ${responseText}`);
    }
  } catch (error) {
    console.log(`   ❌ Erro de conexão: ${error.message}`);
    console.log(`   Certifique-se de que o servidor está rodando em ${WEBHOOK_URL}`);
  }
}

/**
 * Executa todos os testes
 */
async function runTests() {
  console.log('🧪 Teste de Webhook Stripe - PromptJur');
  console.log('=====================================');
  console.log(`Endpoint: ${WEBHOOK_URL}`);
  
  // Testar cada tipo de evento
  for (const [eventName, eventData] of Object.entries(TEST_EVENTS)) {
    await sendTestEvent(eventName, eventData);
    // Aguardar um pouco entre requisições
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n✨ Testes concluídos!');
  console.log('\n💡 Dicas:');
  console.log('   - Verifique os logs do servidor para ver o processamento');
  console.log('   - Verifique o banco de dados para confirmar as atualizações');
  console.log('   - Em produção, o Stripe enviará eventos reais com assinaturas válidas');
}

// Executar testes
runTests().catch(console.error);
