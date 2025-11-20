#!/usr/bin/env node
/**
 * Script de Teste para Webhook Stripe
 * 
 * Simula eventos do Stripe para testar o processamento de webhooks
 * de assinatura, pagamento e cancelamento.
 */

import fetch from 'node-fetch';

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/stripe/webhook';

// Eventos de teste do Stripe
const eventos = {
  assinatura_criada: {
    id: 'evt_test_webhook_001',
    object: 'event',
    type: 'customer.subscription.created',
    data: {
      object: {
        id: 'sub_test_123',
        customer: 'cus_test_123',
        status: 'active',
        items: {
          data: [{
            price: {
              id: 'price_test_pro',
              product: 'prod_test_pro',
              unit_amount: 9900,
              currency: 'brl'
            }
          }]
        },
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
      }
    }
  },
  
  pagamento_sucesso: {
    id: 'evt_test_webhook_002',
    object: 'event',
    type: 'invoice.payment_succeeded',
    data: {
      object: {
        id: 'in_test_123',
        customer: 'cus_test_123',
        subscription: 'sub_test_123',
        amount_paid: 9900,
        currency: 'brl',
        status: 'paid'
      }
    }
  },
  
  assinatura_cancelada: {
    id: 'evt_test_webhook_003',
    object: 'event',
    type: 'customer.subscription.deleted',
    data: {
      object: {
        id: 'sub_test_123',
        customer: 'cus_test_123',
        status: 'canceled',
        canceled_at: Math.floor(Date.now() / 1000)
      }
    }
  }
};

async function testarWebhook(nomeEvento, evento) {
  console.log(`\n📤 Testando evento: ${nomeEvento}`);
  console.log(`   Tipo: ${evento.type}`);
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 'test_signature' // Em produção, usar assinatura real
      },
      body: JSON.stringify(evento)
    });
    
    const status = response.status;
    const texto = await response.text();
    
    if (status === 200) {
      console.log(`   ✅ Sucesso (${status})`);
      if (texto) console.log(`   Resposta: ${texto}`);
    } else {
      console.log(`   ❌ Erro (${status})`);
      console.log(`   Resposta: ${texto}`);
    }
  } catch (error) {
    console.log(`   ❌ Erro de conexão: ${error.message}`);
  }
}

async function executarTestes() {
  console.log('🧪 Iniciando testes de Webhook Stripe');
  console.log(`📍 URL: ${WEBHOOK_URL}`);
  console.log('=' .repeat(60));
  
  // Testar cada evento
  await testarWebhook('Assinatura Criada', eventos.assinatura_criada);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testarWebhook('Pagamento Bem-Sucedido', eventos.pagamento_sucesso);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testarWebhook('Assinatura Cancelada', eventos.assinatura_cancelada);
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Testes concluídos!');
  console.log('\n💡 Dica: Verifique os logs do servidor para ver o processamento dos eventos.');
}

// Executar testes
executarTestes().catch(console.error);
