/**
 * quarterly-price-review.ts
 *
 * Job trimestral de revisão de preços do PromptJur.
 * Executa no primeiro dia de cada trimestre (1/jan, 1/abr, 1/jul, 1/out).
 *
 * Fluxo:
 * 1. Calcula o overhead atual de cada produto (Stripe + impostos)
 * 2. Compara com o overhead alvo (25% para carga tributária de 21%)
 * 3. Se algum produto estiver com margem < 70%, gera recomendação de reajuste
 * 4. Cria um registro em price_review_requests com status "pending"
 * 5. Notifica o owner para aprovar ou rejeitar
 *
 * O reajuste só é aplicado após aprovação explícita do administrador.
 */

import { getDb } from "../db";
import { priceReviewRequests } from "../../drizzle/schema";
import { PLANS, CREDIT_PACKAGES } from "../stripe-products";
import { notifyOwner } from "../_core/notification";
import { eq } from "drizzle-orm";

// ─── Configuração ─────────────────────────────────────────────────────────────

const REGIME = "reforma"; // "simples_f1" | "simples_f2" | "simples_f3" | "reforma"

const CARGA: Record<string, number> = {
  simples_f1: 0.060,
  simples_f2: 0.100,
  simples_f3: 0.135,
  reforma:    0.210,
};

const REGIME_LABEL: Record<string, string> = {
  simples_f1: "Simples Nacional faixa 1 (~6%)",
  simples_f2: "Simples Nacional faixa 2 (~10%)",
  simples_f3: "Simples Nacional faixa 3 (~13,5%)",
  reforma:    "Reforma Tributária LC 214/2025 (~21%)",
};

// Taxas Stripe Brasil 2026
const STRIPE_ASSINATURA = 0.0399 + 0.0070; // 4,69%
const STRIPE_AVULSO     = 0.0399;           // 3,99%
const STRIPE_FIXO       = 0.39;             // R$0,39

// Margem mínima aceitável (abaixo disso, recomenda reajuste)
const MARGEM_MINIMA = 70.0;

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ReviewItem {
  entityId: string;
  entityType: "plan" | "credit_package";
  entityName: string;
  currentPrice: number;   // centavos
  newPrice: number;       // centavos
  adjustmentPercent: number;
  currentMargin: number;  // %
  reason: string;
}

// ─── Funções auxiliares ───────────────────────────────────────────────────────

function calcularMargem(preco: number, tipo: "assinatura" | "avulso", carga: number): number {
  const pct = tipo === "assinatura" ? STRIPE_ASSINATURA : STRIPE_AVULSO;
  const stripe = preco * pct + STRIPE_FIXO;
  const imposto = preco * carga;
  const liquido = preco - stripe - imposto;
  return (liquido / preco) * 100;
}

function calcularPrecoRecomendado(liquido: number, tipo: "assinatura" | "avulso", carga: number): number {
  const pct = tipo === "assinatura" ? STRIPE_ASSINATURA : STRIPE_AVULSO;
  const bruto = (liquido + STRIPE_FIXO) / (1 - pct - carga);
  // Arredondamento psicológico para .90 ou .00
  const inteiro = Math.ceil(bruto);
  const rec = (inteiro - bruto) <= 0.10 ? inteiro : inteiro - 0.10;
  return Math.round(rec * 100); // centavos
}

function getLiquidoAtual(preco: number, tipo: "assinatura" | "avulso", carga: number): number {
  const pct = tipo === "assinatura" ? STRIPE_ASSINATURA : STRIPE_AVULSO;
  return preco - (preco * pct + STRIPE_FIXO) - (preco * carga);
}

function getQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${q}`;
}

// ─── Job Principal ────────────────────────────────────────────────────────────

export async function quarterlyPriceReviewJob(): Promise<void> {
  const tag = "[QuarterlyPriceReview]";
  const quarter = getQuarter();

  try {
    const db = await getDb();
    if (!db) {
      console.warn(`${tag} Banco não disponível, pulando revisão trimestral`);
      return;
    }

    // Verificar se já existe revisão para este trimestre
    const existing = await db
      .select({ id: priceReviewRequests.id, status: priceReviewRequests.status })
      .from(priceReviewRequests)
      .where(eq(priceReviewRequests.quarter, quarter))
      .limit(1);

    if (existing.length > 0) {
      console.log(`${tag} Revisão para ${quarter} já existe (id=${existing[0].id}, status=${existing[0].status}). Pulando.`);
      return;
    }

    const carga = CARGA[REGIME];
    const items: ReviewItem[] = [];

    // Analisar planos de assinatura
    for (const [planId, plan] of Object.entries(PLANS)) {
      const preco = plan.priceMonthly / 100; // centavos → reais
      const margem = calcularMargem(preco, "assinatura", carga);

      if (margem < MARGEM_MINIMA) {
        const liquido = getLiquidoAtual(preco, "assinatura", carga);
        const newPrice = calcularPrecoRecomendado(liquido, "assinatura", carga);
        const adjustmentPercent = ((newPrice - plan.priceMonthly) / plan.priceMonthly) * 100;

        items.push({
          entityId: planId,
          entityType: "plan",
          entityName: plan.name,
          currentPrice: plan.priceMonthly,
          newPrice,
          adjustmentPercent: Math.round(adjustmentPercent * 100) / 100,
          currentMargin: Math.round(margem * 10) / 10,
          reason: `Margem atual ${margem.toFixed(1)}% abaixo do mínimo de ${MARGEM_MINIMA}% com ${REGIME_LABEL[REGIME]}`,
        });
      }
    }

    // Analisar pacotes de crédito
    for (const [pkgId, pkg] of Object.entries(CREDIT_PACKAGES)) {
      const preco = pkg.price / 100;
      const margem = calcularMargem(preco, "avulso", carga);

      if (margem < MARGEM_MINIMA) {
        const liquido = getLiquidoAtual(preco, "avulso", carga);
        const newPrice = calcularPrecoRecomendado(liquido, "avulso", carga);
        const adjustmentPercent = ((newPrice - pkg.price) / pkg.price) * 100;

        items.push({
          entityId: pkgId,
          entityType: "credit_package",
          entityName: pkg.name,
          currentPrice: pkg.price,
          newPrice,
          adjustmentPercent: Math.round(adjustmentPercent * 100) / 100,
          currentMargin: Math.round(margem * 10) / 10,
          reason: `Margem atual ${margem.toFixed(1)}% abaixo do mínimo de ${MARGEM_MINIMA}% com ${REGIME_LABEL[REGIME]}`,
        });
      }
    }

    // Gerar resumo em markdown
    const summary = buildSummary(quarter, items, carga);

    if (items.length === 0) {
      console.log(`${tag} ${quarter}: Todos os produtos com margem saudável (≥${MARGEM_MINIMA}%). Nenhuma revisão necessária.`);
      await notifyOwner({
        title: `✅ Revisão Trimestral ${quarter}: Preços Saudáveis`,
        content: `Todos os produtos do PromptJur estão com margem ≥ ${MARGEM_MINIMA}% para o regime ${REGIME_LABEL[REGIME]}. Nenhum reajuste necessário neste trimestre.`,
      });
      return;
    }

    // Criar registro de revisão pendente
    await db.insert(priceReviewRequests).values({
      quarter,
      regime: REGIME,
      items: items as unknown as Record<string, unknown>[],
      summary,
      status: "pending",
    });

    console.log(`${tag} ${quarter}: ${items.length} produto(s) com reajuste recomendado. Revisão criada aguardando aprovação.`);

    // Notificar owner
    await notifyOwner({
      title: `⚠️ Revisão Trimestral ${quarter}: ${items.length} Produto(s) Precisam de Reajuste`,
      content: summary,
    });

  } catch (err) {
    console.error(`${tag} Erro na revisão trimestral:`, err);
  }
}

// ─── Verificar se deve executar hoje (1º dia do trimestre) ───────────────────

export function deveExecutarHoje(): boolean {
  const now = new Date();
  const dia = now.getDate();
  const mes = now.getMonth() + 1; // 1-indexed
  // Executa no dia 1 de janeiro, abril, julho e outubro
  return dia === 1 && [1, 4, 7, 10].includes(mes);
}

// ─── Construir resumo markdown ────────────────────────────────────────────────

function buildSummary(quarter: string, items: ReviewItem[], carga: number): string {
  const linhas = [
    `## Revisão Trimestral de Preços — ${quarter}`,
    ``,
    `**Regime tributário:** ${REGIME_LABEL[REGIME]} (${(carga * 100).toFixed(1)}%)`,
    `**Data da análise:** ${new Date().toLocaleDateString("pt-BR")}`,
    `**Produtos com reajuste recomendado:** ${items.length}`,
    ``,
    `### Produtos Analisados`,
    ``,
    `| Produto | Preço Atual | Novo Preço | Reajuste | Margem Atual |`,
    `|---|---|---|---|---|`,
    ...items.map(i =>
      `| ${i.entityName} | R$${(i.currentPrice / 100).toFixed(2)} | R$${(i.newPrice / 100).toFixed(2)} | +${i.adjustmentPercent.toFixed(1)}% | ${i.currentMargin}% |`
    ),
    ``,
    `### Próximos Passos`,
    ``,
    `1. Acesse **/admin-precos** no painel administrativo`,
    `2. Revise os valores sugeridos na seção "Revisões Pendentes"`,
    `3. Clique em **Aprovar** para iniciar o aviso prévio de 30 dias (CDC Art. 6º)`,
    `4. Ou clique em **Rejeitar** para manter os preços atuais`,
    ``,
    `> Os reajustes só serão aplicados após aprovação explícita e cumprimento do prazo de 30 dias.`,
  ];
  return linhas.join("\n");
}
