/**
 * Script de reenvio do e-mail de boas-vindas para toda a whitelist
 * Execute APÓS verificar o domínio promptjur.com no Resend:
 *   node scripts/reenviar-boas-vindas.mjs
 *
 * Flags opcionais:
 *   --dry-run    Simula o envio sem realmente enviar (para testar)
 *   --email=x    Envia apenas para um e-mail específico
 */
import { Resend } from "resend";
import mysql from "mysql2/promise";

const isDryRun = process.argv.includes("--dry-run");
const targetEmail = process.argv.find(a => a.startsWith("--email="))?.split("=")[1];

const apiKey = process.env.RESEND_API_KEY;
const dbUrl = process.env.DATABASE_URL;
const appUrl = process.env.VITE_APP_URL ?? "https://promptjur.com";
const fromAddress = process.env.EMAIL_FROM ?? "PromptJur <noreply@promptjur.com>";

if (!apiKey) { console.error("❌ RESEND_API_KEY não configurada"); process.exit(1); }
if (!dbUrl)  { console.error("❌ DATABASE_URL não configurada"); process.exit(1); }

const resend = new Resend(apiKey);

// ── Verificar domínio antes de enviar ──────────────────────────────────────
console.log("🔍 Verificando domínio remetente...");
const testResult = await resend.emails.send({
  from: fromAddress,
  to: ["check@resend.dev"],
  subject: "domain-check",
  html: "<p>check</p>",
}).catch(() => null);

// Se o erro for de domínio não verificado, abortar
if (testResult?.error?.message?.includes("not verified")) {
  console.error("❌ Domínio não verificado:", testResult.error.message);
  console.log("\n📋 INSTRUÇÕES PARA VERIFICAR O DOMÍNIO:");
  console.log("   1. Acesse https://resend.com/domains");
  console.log("   2. Clique em 'Add Domain' e adicione 'promptjur.com'");
  console.log("   3. Adicione os registros DNS indicados no painel do seu provedor de domínio");
  console.log("   4. Aguarde a verificação (pode levar até 48h, mas geralmente é imediata)");
  console.log("   5. Execute este script novamente após a verificação");
  process.exit(1);
}

// ── Conectar ao banco de dados ─────────────────────────────────────────────
console.log("🗄️  Conectando ao banco de dados...");
const conn = await mysql.createConnection(dbUrl);

// Buscar whitelist ativa
let query = "SELECT email, nome FROM access_whitelist WHERE ativo = 1";
const params = [];
if (targetEmail) {
  query += " AND email = ?";
  params.push(targetEmail);
}
const [rows] = await conn.execute(query, params);
await conn.end();

console.log(`📋 ${rows.length} destinatário(s) encontrado(s) na whitelist\n`);

if (rows.length === 0) {
  console.log("ℹ️  Nenhum destinatário encontrado. Verifique a whitelist no AdminTools.");
  process.exit(0);
}

// ── Enviar e-mails ─────────────────────────────────────────────────────────
let enviados = 0, erros = 0, pulados = 0;
const dashboardUrl = `${appUrl}/dashboard`;
const contatoUrl = `${appUrl}/contato`;

for (const row of rows) {
  const email = row.email;
  const nome = row.nome ?? email.split("@")[0];
  const primeiroNome = nome.split(" ")[0];

  if (isDryRun) {
    console.log(`[DRY-RUN] Enviaria para: ${email} (${nome})`);
    pulados++;
    continue;
  }

  process.stdout.write(`📧 Enviando para ${email}... `);

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [email],
      subject: `✅ ${primeiroNome}, seu acesso ao PromptJur foi liberado!`,
      html: buildHtml({ nome, email, appUrl, dashboardUrl, contatoUrl }),
      text: buildText({ nome, email, appUrl, dashboardUrl, contatoUrl }),
    });

    if (error) {
      console.log(`❌ Erro: ${error.message}`);
      erros++;
    } else {
      console.log(`✅ Enviado (ID: ${data?.id})`);
      enviados++;
    }
  } catch (err) {
    console.log(`❌ Exceção: ${err.message}`);
    erros++;
  }

  // Pausa entre envios para respeitar rate limit (5/s no Resend)
  await new Promise(r => setTimeout(r, 300));
}

console.log(`\n📊 Resultado:`);
console.log(`   ✅ Enviados: ${enviados}`);
console.log(`   ❌ Erros:    ${erros}`);
if (isDryRun) console.log(`   🔍 Simulados: ${pulados}`);

// ── Templates ─────────────────────────────────────────────────────────────
function buildHtml({ nome, email, appUrl, dashboardUrl, contatoUrl }) {
  const primeiroNome = nome.split(" ")[0];
  const ano = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Bem-vindo ao PromptJur</title></head>
<body style="margin:0;padding:0;background-color:#060d1a;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#060d1a;padding:48px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td align="center" style="padding-bottom:36px;">
  <table cellpadding="0" cellspacing="0"><tr>
    <td style="background:linear-gradient(135deg,#1e3a8a,#2563eb);border-radius:14px;padding:13px 22px;">
      <span style="color:#fff;font-size:21px;font-weight:800;">⚖️ PromptJur</span>
    </td>
  </tr></table>
</td></tr>
<tr><td style="background-color:#0f172a;border-radius:20px;border:1px solid #1e293b;overflow:hidden;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="background:linear-gradient(135deg,#0f2d5c,#1e40af 60%,#2563eb);padding:44px 44px 36px;">
      <p style="margin:0 0 10px;color:#93c5fd;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">✅ Acesso Liberado</p>
      <h1 style="margin:0 0 14px;color:#fff;font-size:30px;font-weight:800;line-height:1.25;">Olá, ${primeiroNome}!<br/><span style="color:#93c5fd;">Seu acesso ao PromptJur</span><br/>está liberado.</h1>
      <p style="margin:0;color:#bfdbfe;font-size:14px;line-height:1.6;">Você foi selecionado(a) para acessar a plataforma de engenharia de prompts jurídicos com inteligência artificial.</p>
    </td>
  </tr></table>
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:36px 44px;">
    <p style="margin:0 0 10px;color:#e2e8f0;font-size:15px;line-height:1.7;">Caro(a) <strong style="color:#fff;">${nome}</strong>,</p>
    <p style="margin:0 0 28px;color:#94a3b8;font-size:15px;line-height:1.7;">É com satisfação que informamos que seu e-mail <strong style="color:#cbd5e1;">${email}</strong> foi adicionado à lista de acesso autorizado do PromptJur. A partir de agora, você pode acessar todos os recursos da plataforma e começar a transformar seus prompts jurídicos em peças profissionais com precisão e agilidade.</p>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:36px;"><tr>
      <td style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);border-radius:12px;">
        <a href="${dashboardUrl}" style="display:inline-block;padding:15px 36px;color:#fff;font-size:16px;font-weight:700;text-decoration:none;">Acessar o Dashboard →</a>
      </td>
    </tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;"><tr><td style="border-top:1px solid #1e293b;"></td></tr></table>
    <p style="margin:0 0 20px;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Primeiros Passos</p>
    ${[
      ["1","Faça login com sua conta Manus",`Acesse <a href="${appUrl}" style="color:#60a5fa;">promptjur.com</a> e clique em "Acessar Dashboard". Use o mesmo e-mail deste convite.`],
      ["2","Explore o Gerador de Prompts","No menu lateral, clique em \"Gerar Prompt\". Selecione o tipo de peça jurídica e gere seu primeiro prompt profissional."],
      ["3","Salve seus Templates Favoritos","Após gerar um prompt, clique em \"Salvar\" para adicioná-lo à sua biblioteca pessoal."],
    ].map(([n, t, d]) => `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;"><tr>
      <td style="background-color:#0f1f3d;border:1px solid #1e3a5f;border-radius:12px;padding:16px 20px;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="width:36px;vertical-align:top;padding-top:1px;">
            <span style="display:inline-block;width:26px;height:26px;background:#1d4ed8;border-radius:50%;text-align:center;line-height:26px;color:#fff;font-size:12px;font-weight:700;">${n}</span>
          </td>
          <td style="padding-left:12px;">
            <strong style="color:#e2e8f0;font-size:14px;">${t}</strong>
            <p style="margin:4px 0 0;color:#64748b;font-size:13px;line-height:1.5;">${d}</p>
          </td>
        </tr></table>
      </td>
    </tr></table>`).join("")}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;"><tr><td style="border-top:1px solid #1e293b;"></td></tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;"><tr>
      <td style="background:linear-gradient(135deg,#1a1a2e,#16213e);border:1px solid #2563eb;border-left:4px solid #3b82f6;border-radius:12px;padding:18px 20px;">
        <p style="margin:0 0 6px;color:#60a5fa;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">💡 Dica de Uso</p>
        <p style="margin:0;color:#cbd5e1;font-size:14px;line-height:1.6;">Para melhores resultados, seja específico ao descrever o contexto: informe a <strong style="color:#e2e8f0;">área do direito</strong>, o <strong style="color:#e2e8f0;">tipo de documento</strong> e os <strong style="color:#e2e8f0;">pontos principais</strong>. Quanto mais detalhes, mais preciso será o prompt gerado.</p>
      </td>
    </tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;"><tr>
      <td style="background-color:#0d2218;border:1px solid #166534;border-radius:12px;padding:16px 20px;">
        <p style="margin:0 0 4px;color:#4ade80;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">🧪 Fase de Acesso Antecipado</p>
        <p style="margin:0;color:#86efac;font-size:13px;line-height:1.6;">Você está entre os primeiros usuários selecionados do PromptJur. Sua experiência e feedback são fundamentais. Encontrou algo a melhorar? <a href="${contatoUrl}" style="color:#4ade80;text-decoration:underline;">Envie sua sugestão aqui</a>.</p>
      </td>
    </tr></table>
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="border-top:1px solid #1e293b;padding-top:24px;">
        <p style="margin:0 0 4px;color:#94a3b8;font-size:14px;">Atenciosamente,</p>
        <p style="margin:0 0 2px;color:#e2e8f0;font-size:15px;font-weight:700;">Equipe PromptJur</p>
        <p style="margin:0;color:#475569;font-size:13px;">Sistema de Engenharia de Prompts Jurídicos</p>
      </td>
    </tr></table>
  </td></tr></table>
</td></tr>
<tr><td style="padding:28px 0 0;text-align:center;">
  <p style="margin:0 0 10px;">
    <a href="${appUrl}" style="color:#3b82f6;text-decoration:none;font-size:13px;margin:0 10px;">Site</a>
    <span style="color:#334155;">·</span>
    <a href="${dashboardUrl}" style="color:#3b82f6;text-decoration:none;font-size:13px;margin:0 10px;">Dashboard</a>
    <span style="color:#334155;">·</span>
    <a href="${contatoUrl}" style="color:#3b82f6;text-decoration:none;font-size:13px;margin:0 10px;">Contato</a>
  </p>
  <p style="margin:0 0 6px;color:#334155;font-size:12px;">Este e-mail foi enviado para <strong style="color:#475569;">${email}</strong> porque seu endereço foi adicionado à lista de acesso do PromptJur.</p>
  <p style="margin:0;color:#1e293b;font-size:12px;">© ${new Date().getFullYear()} PromptJur — Sistema de Engenharia de Prompts Jurídicos</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function buildText({ nome, email, appUrl, dashboardUrl, contatoUrl }) {
  const primeiroNome = nome.split(" ")[0];
  return `Olá, ${primeiroNome}!

Seu acesso ao PromptJur foi liberado.

Caro(a) ${nome},

É com satisfação que informamos que seu e-mail (${email}) foi adicionado à lista de acesso autorizado do PromptJur.

ACESSAR O DASHBOARD
${dashboardUrl}

──────────────────────────────
PRIMEIROS PASSOS
──────────────────────────────

1. Faça login com sua conta Manus
   Acesse ${appUrl} e clique em "Acessar Dashboard".

2. Explore o Gerador de Prompts
   No menu lateral, clique em "Gerar Prompt".

3. Salve seus Templates Favoritos
   Após gerar um prompt, clique em "Salvar".

──────────────────────────────
DICA DE USO
──────────────────────────────

Para melhores resultados, informe a área do direito, o tipo de documento e os pontos principais. Quanto mais detalhes, mais preciso será o prompt gerado.

──────────────────────────────

Atenciosamente,
Equipe PromptJur
Sistema de Engenharia de Prompts Jurídicos

© ${new Date().getFullYear()} PromptJur — ${appUrl}
Este e-mail foi enviado para ${email} porque seu endereço foi adicionado à lista de acesso do PromptJur.
`;
}
