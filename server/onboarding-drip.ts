/**
 * Módulo de Onboarding Drip Emails — PromptJur
 * Sequência de 5 emails enviados ao longo de 14 dias para novos usuários.
 * 
 * Cronograma:
 *   Email 1 (Dia 1): Boas-vindas + primeiros passos (já enviado no welcome)
 *   Email 2 (Dia 3): Dicas de uso — como criar prompts eficazes
 *   Email 3 (Dia 5): Personas jurídicas — especialize seu assistente
 *   Email 4 (Dia 8): Recursos avançados — RAG, verificação, exportação
 *   Email 5 (Dia 14): Convite para upgrade + resumo de uso
 */

import { eq, and, lte } from "drizzle-orm";
import { getDb } from "./db";
import { onboardingEmails, users } from "../drizzle/schema";
import { Resend } from "resend";

// ─── Configuração ────────────────────────────────────────────────────────────

/** Dias após cadastro para cada email da sequência */
const DRIP_SCHEDULE_DAYS = [1, 3, 5, 8, 14];

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

function getFromAddress(): string {
  const configured = process.env.EMAIL_FROM;
  if (configured && configured.trim().length > 0) return configured.trim();
  return "PromptJur <onboarding@resend.dev>";
}

function getAppUrl(): string {
  return process.env.VITE_APP_URL ?? "https://promptjur.com";
}

// ─── Agendar sequência para novo usuário ─────────────────────────────────────

/**
 * Agenda toda a sequência de onboarding para um novo usuário.
 * Deve ser chamado após o primeiro login (primeiroAcesso = true).
 */
export async function scheduleOnboardingSequence(userId: number, email: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const now = new Date();

  // Verificar se já existe sequência agendada para este usuário
  const existing = await db
    .select()
    .from(onboardingEmails)
    .where(eq(onboardingEmails.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    console.log(`[Onboarding] Sequência já existe para userId=${userId}, ignorando.`);
    return;
  }

  // Agendar emails 2-5 (email 1 é o welcome já enviado)
  const records = DRIP_SCHEDULE_DAYS.slice(1).map((days, index) => {
    const scheduledAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return {
      userId,
      email,
      sequenceNumber: index + 2, // Emails 2, 3, 4, 5
      status: "pendente" as const,
      scheduledAt,
    };
  });

  // Inserir email 1 como já enviado (é o welcome email)
  await db.insert(onboardingEmails).values({
    userId,
    email,
    sequenceNumber: 1,
    status: "enviado" as const,
    scheduledAt: now,
    sentAt: now,
  });

  // Inserir emails 2-5 como pendentes
  if (records.length > 0) {
    await db.insert(onboardingEmails).values(records);
  }

  console.log(`[Onboarding] Sequência agendada para userId=${userId} (${email}): 4 emails pendentes`);
}

// ─── Processar emails pendentes ──────────────────────────────────────────────

/**
 * Processa todos os emails de onboarding que estão pendentes e cuja data agendada já passou.
 * Deve ser chamado periodicamente (ex: a cada hora via scheduled task).
 */
export async function processOnboardingEmails(): Promise<{
  enviados: number;
  falhas: number;
  total: number;
}> {
  const db = await getDb();
  if (!db) return { enviados: 0, falhas: 0, total: 0 };

  const now = new Date();

  // Buscar emails pendentes cuja data agendada já passou
  const pendentes = await db
    .select()
    .from(onboardingEmails)
    .where(
      and(
        eq(onboardingEmails.status, "pendente"),
        lte(onboardingEmails.scheduledAt, now)
      )
    )
    .limit(50); // Processar no máximo 50 por vez

  let enviados = 0;
  let falhas = 0;

  for (const email of pendentes) {
    try {
      const success = await sendDripEmail(email.email, email.sequenceNumber);

      if (success) {
        await db
          .update(onboardingEmails)
          .set({ status: "enviado", sentAt: new Date() })
          .where(eq(onboardingEmails.id, email.id));
        enviados++;
      } else {
        await db
          .update(onboardingEmails)
          .set({ status: "falha", errorMessage: "Falha no envio via Resend" })
          .where(eq(onboardingEmails.id, email.id));
        falhas++;
      }

      // Delay entre envios para evitar rate limiting
      await new Promise((r) => setTimeout(r, 300));
    } catch (err: any) {
      await db
        .update(onboardingEmails)
        .set({ status: "falha", errorMessage: err?.message ?? "Erro desconhecido" })
        .where(eq(onboardingEmails.id, email.id));
      falhas++;
    }
  }

  if (pendentes.length > 0) {
    console.log(`[Onboarding] Processados: ${enviados} enviados, ${falhas} falhas de ${pendentes.length} total`);
  }

  return { enviados, falhas, total: pendentes.length };
}

// ─── Cancelar sequência (ex: quando usuário exclui conta) ────────────────────

export async function cancelOnboardingSequence(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(onboardingEmails)
    .set({ status: "cancelado" })
    .where(
      and(
        eq(onboardingEmails.userId, userId),
        eq(onboardingEmails.status, "pendente")
      )
    );

  console.log(`[Onboarding] Sequência cancelada para userId=${userId}`);
}

// ─── Envio individual de email drip ──────────────────────────────────────────

async function sendDripEmail(toEmail: string, sequenceNumber: number): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.log(`[Onboarding] Skipped email #${sequenceNumber} to ${toEmail} — API key not set`);
    return true; // Não considerar como falha
  }

  const appUrl = getAppUrl();
  const template = getDripTemplate(sequenceNumber, appUrl);

  try {
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to: [toEmail],
      subject: template.subject,
      html: template.html,
    });

    if (error) {
      console.error(`[Onboarding] Erro email #${sequenceNumber} para ${toEmail}:`, error);
      return false;
    }

    console.log(`[Onboarding] Email #${sequenceNumber} enviado para ${toEmail}`);
    return true;
  } catch (err) {
    console.error(`[Onboarding] Exceção email #${sequenceNumber} para ${toEmail}:`, err);
    return false;
  }
}

// ─── Templates dos emails ────────────────────────────────────────────────────

interface DripTemplate {
  subject: string;
  html: string;
}

function getDripTemplate(sequenceNumber: number, appUrl: string): DripTemplate {
  const ano = new Date().getFullYear();
  const dashboardUrl = `${appUrl}/dashboard`;

  switch (sequenceNumber) {
    case 2:
      return {
        subject: "💡 3 dicas para criar prompts jurídicos mais eficazes — PromptJur",
        html: buildDripHtml({
          preheader: "Dicas práticas para melhorar seus prompts",
          heroTitle: "3 Dicas para Prompts Jurídicos Eficazes",
          heroSubtitle: "Pequenos ajustes que fazem grande diferença nos resultados",
          heroColor: "#1e40af",
          content: `
            <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.7;">
              Após seus primeiros dias no PromptJur, queremos compartilhar <strong style="color:#e2e8f0;">3 técnicas</strong> 
              que nossos usuários mais produtivos utilizam:
            </p>
            ${buildTipCard("1", "Seja específico no contexto", "Em vez de 'faça uma petição', informe: área do direito, tipo de ação, fatos relevantes e resultado pretendido. Quanto mais contexto, melhor o resultado.")}
            ${buildTipCard("2", "Use personas especializadas", "Selecione a persona jurídica adequada (Civilista, Trabalhista, Tributarista...) para obter linguagem técnica precisa da área.")}
            ${buildTipCard("3", "Itere e refine", "Use a função 'Refinar' para melhorar prompts existentes. Cada iteração adiciona precisão técnica e elimina generalidades.")}
          `,
          ctaText: "Experimentar Agora →",
          ctaUrl: `${appUrl}/gerar-prompt`,
          ctaColor: "#1d4ed8",
          appUrl,
          ano,
        }),
      };

    case 3:
      return {
        subject: "⚖️ Conheça as Personas Jurídicas — especialize seu assistente — PromptJur",
        html: buildDripHtml({
          preheader: "8 especialistas virtuais à sua disposição",
          heroTitle: "Personas Jurídicas: Seu Especialista Virtual",
          heroSubtitle: "8 personas treinadas para diferentes áreas do Direito",
          heroColor: "#7c3aed",
          content: `
            <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.7;">
              O PromptJur oferece <strong style="color:#e2e8f0;">8 personas jurídicas especializadas</strong> 
              que adaptam a linguagem, fundamentação e estrutura dos prompts para cada área:
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="padding:4px 0;color:#c4b5fd;font-size:14px;">⚖️ <strong>Civilista</strong> — Direito Civil e Processual</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#c4b5fd;font-size:14px;">👷 <strong>Trabalhista</strong> — Direito do Trabalho e CLT</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#c4b5fd;font-size:14px;">🏛️ <strong>Constitucionalista</strong> — Direito Constitucional</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#c4b5fd;font-size:14px;">💰 <strong>Tributarista</strong> — Direito Tributário</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#c4b5fd;font-size:14px;">🔒 <strong>Penalista</strong> — Direito Penal</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#c4b5fd;font-size:14px;">🏢 <strong>Empresarialista</strong> — Direito Empresarial</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#c4b5fd;font-size:14px;">🌐 <strong>Administrativista</strong> — Direito Administrativo</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#c4b5fd;font-size:14px;">👨‍👩‍👧 <strong>Familiarista</strong> — Direito de Família</td>
              </tr>
            </table>
            <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.6;">
              Cada persona ajusta automaticamente: terminologia técnica, fundamentação legal relevante, 
              estrutura argumentativa e referências doutrinárias da área.
            </p>
          `,
          ctaText: "Explorar Personas →",
          ctaUrl: `${appUrl}/gerar-prompt`,
          ctaColor: "#7c3aed",
          appUrl,
          ano,
        }),
      };

    case 4:
      return {
        subject: "🔍 Recursos avançados: RAG, verificação e exportação — PromptJur",
        html: buildDripHtml({
          preheader: "Descubra funcionalidades que elevam sua produtividade",
          heroTitle: "Recursos Avançados do PromptJur",
          heroSubtitle: "RAG jurídico, verificação de citações e exportação profissional",
          heroColor: "#059669",
          content: `
            <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.7;">
              Você já domina o básico. Agora conheça os recursos que diferenciam o PromptJur 
              de qualquer outra ferramenta de IA:
            </p>
            ${buildFeatureBlock("🔍 RAG Jurídico", "Busca semântica em legislação federal, estadual e jurisprudência do DataJud (CNJ). Seus prompts são enriquecidos com fundamentação legal real e atualizada.")}
            ${buildFeatureBlock("✅ Verificação de Citações", "Detecta automaticamente alucinações: artigos inexistentes, súmulas incorretas e jurisprudência fabricada. Nunca mais cite uma lei que não existe.")}
            ${buildFeatureBlock("📄 Exportação ABNT", "Exporte documentos em PDF ou DOCX com formatação ABNT completa: fonte Arial 12, espaçamento 1,5, tabulação 2cm. Pronto para protocolar.")}
            ${buildFeatureBlock("⚡ Comparação de Modelos", "Execute o mesmo prompt em 2-4 modelos de IA simultaneamente e compare resultados lado a lado. Escolha sempre o melhor output.")}
          `,
          ctaText: "Experimentar RAG →",
          ctaUrl: `${appUrl}/pesquisa-juridica`,
          ctaColor: "#059669",
          appUrl,
          ano,
        }),
      };

    case 5:
      return {
        subject: "🚀 Seu resumo de 14 dias + próximos passos — PromptJur",
        html: buildDripHtml({
          preheader: "Resumo da sua jornada e como ir além",
          heroTitle: "14 Dias com o PromptJur",
          heroSubtitle: "Resumo da sua jornada e como maximizar resultados",
          heroColor: "#d97706",
          content: `
            <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.7;">
              Parabéns por completar suas duas primeiras semanas! 🎉 
              Aqui está um resumo do que você já pode fazer:
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border:1px solid #374151;border-radius:12px;padding:20px;margin-bottom:24px;">
              <tr><td style="padding:8px 16px;color:#fbbf24;font-size:14px;">✅ Gerar prompts jurídicos especializados</td></tr>
              <tr><td style="padding:8px 16px;color:#fbbf24;font-size:14px;">✅ Usar personas por área do Direito</td></tr>
              <tr><td style="padding:8px 16px;color:#fbbf24;font-size:14px;">✅ Verificar citações com RAG jurídico</td></tr>
              <tr><td style="padding:8px 16px;color:#fbbf24;font-size:14px;">✅ Exportar documentos em formato ABNT</td></tr>
              <tr><td style="padding:8px 16px;color:#fbbf24;font-size:14px;">✅ Salvar e reutilizar templates</td></tr>
            </table>
            <p style="margin:0 0 16px;color:#e2e8f0;font-size:16px;font-weight:700;">
              Quer ir além?
            </p>
            <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.7;">
              Com o <strong style="color:#fbbf24;">Plano Pro</strong>, você desbloqueia:
              300 operações/mês, modelos premium (GPT-4o, Claude 3.5), 
              suporte prioritário e acesso a todas as funcionalidades avançadas.
            </p>
          `,
          ctaText: "Ver Planos →",
          ctaUrl: `${appUrl}/planos`,
          ctaColor: "#d97706",
          appUrl,
          ano,
        }),
      };

    default:
      return {
        subject: "PromptJur — Novidades para você",
        html: buildDripHtml({
          preheader: "Novidades do PromptJur",
          heroTitle: "Novidades do PromptJur",
          heroSubtitle: "Confira as últimas atualizações",
          heroColor: "#1e40af",
          content: `<p style="color:#94a3b8;font-size:15px;">Acesse o dashboard para ver as novidades.</p>`,
          ctaText: "Acessar Dashboard →",
          ctaUrl: dashboardUrl,
          ctaColor: "#1d4ed8",
          appUrl,
          ano,
        }),
      };
  }
}

// ─── Helpers de template ─────────────────────────────────────────────────────

function buildTipCard(number: string, title: string, description: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
      <tr>
        <td style="background-color:#0f1f3d;border:1px solid #1e3a5f;border-radius:12px;padding:16px 20px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:36px;vertical-align:top;padding-top:1px;">
                <span style="display:inline-block;width:26px;height:26px;background:#1d4ed8;border-radius:50%;text-align:center;line-height:26px;color:#ffffff;font-size:12px;font-weight:700;">${number}</span>
              </td>
              <td style="padding-left:12px;">
                <strong style="color:#e2e8f0;font-size:14px;">${title}</strong>
                <p style="margin:4px 0 0;color:#64748b;font-size:13px;line-height:1.5;">${description}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

function buildFeatureBlock(title: string, description: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
      <tr>
        <td style="background-color:#0f1f3d;border:1px solid #1e3a5f;border-radius:12px;padding:16px 20px;">
          <strong style="color:#e2e8f0;font-size:14px;">${title}</strong>
          <p style="margin:6px 0 0;color:#64748b;font-size:13px;line-height:1.5;">${description}</p>
        </td>
      </tr>
    </table>`;
}

function buildDripHtml(opts: {
  preheader: string;
  heroTitle: string;
  heroSubtitle: string;
  heroColor: string;
  content: string;
  ctaText: string;
  ctaUrl: string;
  ctaColor: string;
  appUrl: string;
  ano: number;
}): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <title>${opts.heroTitle}</title>
  <span style="display:none;max-height:0;overflow:hidden;">${opts.preheader}</span>
</head>
<body style="margin:0;padding:0;background-color:#060d1a;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#060d1a;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:36px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);border-radius:14px;padding:13px 22px;">
                    <span style="color:#ffffff;font-size:21px;font-weight:800;letter-spacing:-0.5px;">⚖️&nbsp; PromptJur</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#0f172a;border-radius:20px;border:1px solid #1e293b;overflow:hidden;">

              <!-- Hero -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,${opts.heroColor}22 0%,${opts.heroColor}44 100%);padding:40px 44px 32px;border-bottom:2px solid ${opts.heroColor};">
                    <h1 style="margin:0 0 8px;color:#ffffff;font-size:26px;font-weight:800;line-height:1.3;">${opts.heroTitle}</h1>
                    <p style="margin:0;color:#94a3b8;font-size:14px;">${opts.heroSubtitle}</p>
                  </td>
                </tr>
              </table>

              <!-- Content -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:36px 44px;">
                    ${opts.content}

                    <!-- CTA -->
                    <table cellpadding="0" cellspacing="0" style="margin-top:28px;">
                      <tr>
                        <td style="background:${opts.ctaColor};border-radius:12px;box-shadow:0 4px 14px ${opts.ctaColor}66;">
                          <a href="${opts.ctaUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">
                            ${opts.ctaText}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0;text-align:center;">
              <p style="margin:0 0 6px;">
                <a href="${opts.appUrl}" style="color:#3b82f6;text-decoration:none;font-size:13px;">Site</a>
                <span style="color:#334155;margin:0 8px;">·</span>
                <a href="${opts.appUrl}/dashboard" style="color:#3b82f6;text-decoration:none;font-size:13px;">Dashboard</a>
                <span style="color:#334155;margin:0 8px;">·</span>
                <a href="${opts.appUrl}/contato" style="color:#3b82f6;text-decoration:none;font-size:13px;">Contato</a>
              </p>
              <p style="margin:0 0 6px;color:#334155;font-size:12px;">
                Você recebeu este email porque se cadastrou no PromptJur.
              </p>
              <p style="margin:0;color:#1e293b;font-size:11px;">
                © ${opts.ano} PromptJur — Sistema de Engenharia de Prompts Jurídicos
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
