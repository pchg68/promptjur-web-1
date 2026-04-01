/**
 * Script de diagnóstico do Resend
 * Testa a API key, verifica domínios e tenta envio de e-mail de teste
 */
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error("❌ RESEND_API_KEY não configurada");
  process.exit(1);
}

const resend = new Resend(apiKey);
const fromAddress = process.env.EMAIL_FROM ?? "PromptJur <noreply@promptjur.com>";

console.log("🔍 Diagnóstico do Resend");
console.log("========================");
console.log(`API Key: ${apiKey.substring(0, 12)}...`);
console.log(`From: ${fromAddress}`);
console.log("");

// 1. Verificar domínios cadastrados
console.log("📋 Verificando domínios cadastrados...");
try {
  const domains = await resend.domains.list();
  if (domains.data && domains.data.data && domains.data.data.length > 0) {
    console.log(`✅ ${domains.data.data.length} domínio(s) encontrado(s):`);
    for (const domain of domains.data.data) {
      console.log(`   - ${domain.name} | Status: ${domain.status} | Região: ${domain.region}`);
    }
  } else {
    console.log("⚠️  Nenhum domínio verificado. Usando domínio padrão do Resend (onboarding@resend.dev)");
  }
} catch (err) {
  console.error("❌ Erro ao listar domínios:", err.message);
}

// 2. Testar envio para o e-mail do owner
const testEmail = process.argv[2] || "pchg68@gmail.com";
console.log(`\n📧 Testando envio para: ${testEmail}`);
try {
  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to: [testEmail],
    subject: "✅ Teste de Diagnóstico — PromptJur",
    html: `<p>Este é um e-mail de diagnóstico do PromptJur. Se você recebeu este e-mail, o envio está funcionando corretamente.</p><p>Remetente: <strong>${fromAddress}</strong></p>`,
    text: `Teste de diagnóstico do PromptJur. Remetente: ${fromAddress}`,
  });

  if (error) {
    console.error("❌ Erro no envio:", JSON.stringify(error, null, 2));
    
    // Diagnóstico específico por tipo de erro
    if (error.message?.includes("domain") || error.message?.includes("sender")) {
      console.log("\n💡 SOLUÇÃO: O domínio remetente não está verificado no Resend.");
      console.log("   Opções:");
      console.log("   1. Verificar o domínio 'promptjur.com' em https://resend.com/domains");
      console.log("   2. Usar o domínio padrão do Resend: onboarding@resend.dev (apenas para testes)");
    }
  } else {
    console.log(`✅ E-mail enviado com sucesso! ID: ${data?.id}`);
  }
} catch (err) {
  console.error("❌ Exceção no envio:", err.message);
  if (err.message?.includes("domain") || err.message?.includes("sender") || err.message?.includes("validation")) {
    console.log("\n💡 SOLUÇÃO: Configure o domínio remetente no Resend ou use 'onboarding@resend.dev'");
  }
}
