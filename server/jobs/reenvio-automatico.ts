/**
 * Job de Reenvio Automático de Convites
 * Executa semanalmente para reenviar convites para e-mails ativos
 * que ainda não acessaram o sistema (se configurado assim).
 */
import { getDb } from "../db";
import { accessWhitelist, users } from "../../drizzle/schema";
import { eq, sql, isNull, and } from "drizzle-orm";
import { sendWelcomeEmail } from "../email";
import {
  buscarConfigReenvioAuto,
  registrarConviteLog,
  atualizarUltimaExecucao,
} from "../db-convite-logs";
import { notifyOwner } from "../_core/notification";

// Referência ao timeout atual para poder cancelar e reagendar
let jobTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Calcula quantos ms faltam até o próximo disparo com base na configuração.
 */
function calcularProximoDisparo(diaSemana: number, hora: number): number {
  const agora = new Date();
  // Converter para horário de Brasília (UTC-3)
  const brasilia = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
  const diaSemanaAtual = brasilia.getUTCDay();
  const horaAtual = brasilia.getUTCHours();
  const minutoAtual = brasilia.getUTCMinutes();

  let diasAte = (diaSemana - diaSemanaAtual + 7) % 7;
  // Se é hoje mas a hora já passou, agendar para a próxima semana
  if (diasAte === 0 && (horaAtual > hora || (horaAtual === hora && minutoAtual > 0))) {
    diasAte = 7;
  }

  const proximoDisparo = new Date(brasilia);
  proximoDisparo.setUTCDate(brasilia.getUTCDate() + diasAte);
  proximoDisparo.setUTCHours(hora, 0, 0, 0);

  // Converter de volta para UTC real
  const proximoUTC = new Date(proximoDisparo.getTime() + 3 * 60 * 60 * 1000);
  return proximoUTC.getTime() - agora.getTime();
}

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/**
 * Executa o reenvio automático de convites.
 */
async function executarReenvioAutomatico(): Promise<void> {
  console.log("[ReenvioAuto] Iniciando execução do job de reenvio automático...");

  const config = await buscarConfigReenvioAuto();
  if (!config || !config.habilitado) {
    console.log("[ReenvioAuto] Job desabilitado — pulando execução.");
    return;
  }

  const dbConn = await getDb();
  if (!dbConn) {
    console.error("[ReenvioAuto] Banco de dados não disponível.");
    await atualizarUltimaExecucao("Erro: banco de dados não disponível");
    return;
  }

  try {
    // Buscar e-mails ativos da whitelist
    const ativos = await dbConn
      .select()
      .from(accessWhitelist)
      .where(eq(accessWhitelist.ativo, true));

    if (ativos.length === 0) {
      console.log("[ReenvioAuto] Nenhum e-mail ativo na whitelist.");
      await atualizarUltimaExecucao("Nenhum e-mail ativo na whitelist");
      return;
    }

    // Se configurado para reenviar apenas para quem não acessou, filtrar
    let alvosFiltrados = ativos;
    if (config.apenasNaoAcessaram) {
      // Buscar e-mails que já fizeram login
      const usuariosAtivos = await dbConn
        .select({ email: users.email })
        .from(users);
      const emailsAtivos = new Set(usuariosAtivos.map((u) => u.email?.toLowerCase()));
      alvosFiltrados = ativos.filter(
        (e) => !emailsAtivos.has(e.email.toLowerCase())
      );
    }

    if (alvosFiltrados.length === 0) {
      const msg = config.apenasNaoAcessaram
        ? "Todos os e-mails já acessaram o sistema"
        : "Nenhum e-mail para reenviar";
      console.log(`[ReenvioAuto] ${msg}`);
      await atualizarUltimaExecucao(msg);
      return;
    }

    let enviados = 0;
    let falhas = 0;
    let pulados = 0;

    for (const entry of alvosFiltrados) {
      try {
        const result = await sendWelcomeEmail(entry.email, entry.nome ?? undefined);
        const agora = new Date();

        if (result.skipped) {
          pulados++;
          await registrarConviteLog({
            email: entry.email,
            nome: entry.nome ?? null,
            resultado: "pulado",
            erroMsg: "RESEND_API_KEY não configurada",
            adminIp: null,
            adminId: null,
            tipoDisparo: "automatico",
          });
          break; // Sem API key, todos serão pulados
        } else if (result.success) {
          enviados++;
          await registrarConviteLog({
            email: entry.email,
            nome: entry.nome ?? null,
            resultado: "enviado",
            erroMsg: null,
            adminIp: null,
            adminId: null,
            tipoDisparo: "automatico",
          });
          // Atualizar contador e data do último envio
          await dbConn
            .update(accessWhitelist)
            .set({
              convitesEnviados: sql`${accessWhitelist.convitesEnviados} + 1`,
              ultimoEnvio: agora,
            })
            .where(eq(accessWhitelist.id, entry.id));
        } else {
          falhas++;
          await registrarConviteLog({
            email: entry.email,
            nome: entry.nome ?? null,
            resultado: "falha",
            erroMsg: result.error ?? "Erro desconhecido",
            adminIp: null,
            adminId: null,
            tipoDisparo: "automatico",
          });
        }
      } catch (err: any) {
        falhas++;
        await registrarConviteLog({
          email: entry.email,
          nome: entry.nome ?? null,
          resultado: "falha",
          erroMsg: err?.message ?? "Erro desconhecido",
          adminIp: null,
          adminId: null,
          tipoDisparo: "automatico",
        });
      }
      // Pausa para não sobrecarregar a API do Resend
      await new Promise((r) => setTimeout(r, 200));
    }

    const resumo = `${enviados} enviados, ${falhas} falhas, ${pulados} pulados de ${alvosFiltrados.length} alvos`;
    console.log(`[ReenvioAuto] Concluído: ${resumo}`);
    await atualizarUltimaExecucao(resumo);

    // Notificar owner
    await notifyOwner({
      title: `[PromptJur] Reenvio Automático de Convites`,
      content: `Job semanal executado.\n\n${resumo}\n\nPróximo disparo: ${DIAS_SEMANA[config.diaSemana]} às ${config.hora}h (Brasília)`,
    });
  } catch (err: any) {
    const msg = `Erro: ${err?.message ?? "Erro desconhecido"}`;
    console.error(`[ReenvioAuto] ${msg}`);
    await atualizarUltimaExecucao(msg);
  }
}

/**
 * Agenda o próximo disparo do job com base na configuração do banco.
 * Cancela o agendamento anterior se existir.
 */
export async function scheduleReenvioAutomatico(): Promise<void> {
  // Cancelar agendamento anterior
  if (jobTimeout) {
    clearTimeout(jobTimeout);
    jobTimeout = null;
  }

  const config = await buscarConfigReenvioAuto();
  if (!config || !config.habilitado) {
    console.log("[ReenvioAuto] Job desabilitado — nenhum agendamento criado.");
    return;
  }

  const msAteProximo = calcularProximoDisparo(config.diaSemana, config.hora);
  const proximaData = new Date(Date.now() + msAteProximo);
  const proximaStr = proximaData.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });

  console.log(
    `[ReenvioAuto] Próximo reenvio automático agendado para: ${proximaStr} (${DIAS_SEMANA[config.diaSemana]} às ${config.hora}h, Brasília)`
  );

  jobTimeout = setTimeout(async () => {
    await executarReenvioAutomatico();
    // Reagendar para a próxima semana
    await scheduleReenvioAutomatico();
  }, msAteProximo);
}

/**
 * Reagenda o job após uma alteração de configuração.
 * Deve ser chamado sempre que a configuração for salva.
 */
export async function reagendarReenvioAutomatico(): Promise<void> {
  console.log("[ReenvioAuto] Reagendando job após alteração de configuração...");
  await scheduleReenvioAutomatico();
}
