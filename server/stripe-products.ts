/**
 * Definição centralizada dos produtos e planos do PromptJur
 * 
 * Os preços são definidos aqui e usados tanto no backend (checkout)
 * quanto no frontend (página de planos)
 */

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number; // em centavos BRL
  priceYearly: number; // em centavos BRL (total anual)
  currency: "brl";
  features: PlanFeature[];
  limits: {
    promptsPerMonth: number; // -1 = ilimitado
    modelsAvailable: string[];
    maxDocumentExports: number; // -1 = ilimitado
    maxTemplates: number; // -1 = ilimitado
    knowledgeRetrieval: boolean;
    multiAI: boolean;
    prioritySupport: boolean;
  };
  popular?: boolean;
  contactOnly?: boolean; // true = plano sob consulta, sem checkout Stripe
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
}

export const PLANS: Record<string, Plan> = {
  free: {
    id: "free",
    name: "Gratuito",
    description: "Para experimentar o PromptJur",
    priceMonthly: 0,
    priceYearly: 0,
    currency: "brl",
    features: [
      { text: "20 operações por mês", included: true },
      { text: "Análise básica de prompts", included: true },
      { text: "Geração com GPT-4o-mini", included: true },
      { text: "3 templates salvos", included: true },
      { text: "Exportação em TXT", included: true },
      { text: "Modelos profissionais básicos", included: true },
      { text: "Múltiplos provedores de IA", included: false },
      { text: "Knowledge Retrieval (DataJud)", included: false },
      { text: "Exportação DOCX/PDF", included: false },
      { text: "Suporte prioritário", included: false },
    ],
    limits: {
      promptsPerMonth: 20,
      modelsAvailable: ["gpt-4o-mini", "manus"],
      maxDocumentExports: 5,
      maxTemplates: 3,
      knowledgeRetrieval: false,
      multiAI: false,
      prioritySupport: false,
    },
  },
  pro: {
    id: "pro",
    name: "Profissional",
    description: "Para advogados e escritórios",
    priceMonthly: 4990, // R$ 49,90
    priceYearly: 47880, // R$ 478,80 (R$ 39,90/mês)
    currency: "brl",
    popular: true,
    features: [
      { text: "300 operações por mês", included: true },
      { text: "Análise avançada com IA", included: true },
      { text: "GPT-4o + Claude + Gemini", included: true },
      { text: "Templates ilimitados", included: true },
      { text: "Exportação DOCX/PDF/ABNT", included: true },
      { text: "Todos os modelos profissionais", included: true },
      { text: "Multi-IA com consenso", included: true },
      { text: "Knowledge Retrieval (DataJud)", included: true },
      { text: "Validação Planalto", included: true },
      { text: "Suporte por email", included: true },
    ],
    limits: {
      promptsPerMonth: 300,
      modelsAvailable: ["gpt-4o", "gpt-4o-mini", "claude-sonnet", "gemini-pro", "perplexity", "manus"],
      maxDocumentExports: -1,
      maxTemplates: -1,
      knowledgeRetrieval: true,
      multiAI: true,
      prioritySupport: false,
    },
  },
  enterprise: {
    id: "enterprise",
    name: "Escritório",
    description: "Para escritórios com múltiplos usuários e necessidades personalizadas",
    priceMonthly: 0, // Preço sob consulta
    priceYearly: 0,
    currency: "brl",
    contactOnly: true, // Plano sob consulta — sem checkout Stripe
    features: [
      { text: "Usuários ilimitados (multi-seat)", included: true },
      { text: "Operações sob medida para o escritório", included: true },
      { text: "Todos os provedores de IA premium", included: true },
      { text: "Templates e workflows personalizados", included: true },
      { text: "Exportação ilimitada DOCX/PDF/ABNT", included: true },
      { text: "Integração com sistemas do escritório", included: true },
      { text: "SLA e uptime garantidos por contrato", included: true },
      { text: "Knowledge Retrieval completo + API", included: true },
      { text: "Treinamento e onboarding dedicado", included: true },
      { text: "Gerente de conta exclusivo", included: true },
    ],
    limits: {
      promptsPerMonth: -1,
      modelsAvailable: ["gpt-4o", "gpt-4o-mini", "o1", "claude-sonnet", "claude-opus", "gemini-pro", "gemini-flash", "perplexity", "manus"],
      maxDocumentExports: -1,
      maxTemplates: -1,
      knowledgeRetrieval: true,
      multiAI: true,
      prioritySupport: true,
    },
  },
};

/**
 * Retorna o plano pelo ID
 */
export function getPlan(planId: string): Plan | undefined {
  return PLANS[planId];
}

/**
 * Formata preço em BRL
 */
export function formatPrice(priceInCents: number): string {
  if (priceInCents === 0) return "Grátis";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceInCents / 100);
}
