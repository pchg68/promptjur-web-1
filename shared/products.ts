/**
 * Definição de produtos e planos do PromptJur
 */

export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    currency: 'BRL',
    interval: 'month' as const,
    features: [
      '10 análises de prompts por mês',
      '5 gerações de prompts por mês',
      '3 otimizações por mês',
      'Acesso a templates básicos',
      'Histórico de 30 dias',
    ],
    limits: {
      analises: 10,
      geracoes: 5,
      otimizacoes: 3,
      templates: 5,
    }
  },
  PRO: {
    id: 'pro',
    name: 'Profissional',
    price: 4900, // R$ 49,00
    currency: 'BRL',
    interval: 'month' as const,
    stripePriceId: process.env.STRIPE_PRICE_PRO || 'price_pro_monthly',
    features: [
      'Análises ilimitadas',
      'Gerações ilimitadas',
      'Otimizações ilimitadas',
      'Todos os templates premium',
      'Histórico completo',
      'Exportação PDF/Markdown',
      'Suporte prioritário',
    ],
    limits: {
      analises: -1, // ilimitado
      geracoes: -1,
      otimizacoes: -1,
      templates: -1,
    }
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 19900, // R$ 199,00
    currency: 'BRL',
    interval: 'month' as const,
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise_monthly',
    features: [
      'Tudo do plano Pro',
      'API de integração',
      'Templates personalizados ilimitados',
      'Compartilhamento de equipe',
      'Análise de documentos em lote',
      'Suporte dedicado 24/7',
      'Treinamento personalizado',
    ],
    limits: {
      analises: -1,
      geracoes: -1,
      otimizacoes: -1,
      templates: -1,
      teamMembers: 10,
    }
  }
} as const;

export type PlanId = keyof typeof PLANS;
export type Plan = typeof PLANS[PlanId];
