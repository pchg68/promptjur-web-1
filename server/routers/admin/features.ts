/**
 * Admin Sub-Router: Feature Flags
 * - Listar features
 * - Toggle feature flag
 * - Criar nova feature
 * - Inicializar features padrão
 * - Limpar cache de features
 */

import { z } from "zod";
import { router } from "../../_core/trpc";
import { adminProcedure } from "./shared";
import { logAuditoria } from "../../audit";
import { listarFeatures, toggleFeature, criarFeature, inicializarFeatures, limparCacheFeatures } from "../../feature-flags";
import { sendLaunchNotificationEmail } from "../../email";
import { launchInterests } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import * as db from "../../db";

export const adminFeaturesRouter = router({
  // Listar todas as features
  listarFeatures: adminProcedure.query(async () => {
    return listarFeatures();
  }),
  
  // Toggle feature flag
  toggleFeature: adminProcedure
    .input(z.object({
      nome: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const resultado = await toggleFeature(input.nome);

      // Hook especial: quando `pagamentos_ativos` é ativado, notificar todos os interessados
      if (resultado.nome === 'pagamentos_ativos' && resultado.isAtivo) {
        (async () => {
          try {
            const dbConn = await db.getDb();
            if (!dbConn) return;

            const interessados = await dbConn
              .select()
              .from(launchInterests)
              .where(eq(launchInterests.notificado, false));

            if (interessados.length === 0) return;

            let enviados = 0;
            let falhas = 0;

            for (const interessado of interessados) {
              const result = await sendLaunchNotificationEmail({ email: interessado.email });
              if (result.success && !result.skipped) {
                enviados++;
                await dbConn
                  .update(launchInterests)
                  .set({ notificado: true })
                  .where(eq(launchInterests.id, interessado.id));
              } else if (!result.skipped) {
                falhas++;
              }
              await new Promise(r => setTimeout(r, 200));
            }

            console.log(`[Admin] Launch notification: ${enviados} enviados, ${falhas} falhas de ${interessados.length} interessados`);

            await logAuditoria({
              userId: ctx.user.id,
              acao: 'notificar_lancamento',
              descricao: `Notificações de lançamento enviadas: ${enviados}/${interessados.length}`,
              metadata: { total: interessados.length, enviados, falhas },
              req: ctx.req,
            });
          } catch (err) {
            console.error('[Admin] Erro ao enviar notificações de lançamento:', err);
          }
        })(); // fire-and-forget
      }

      await logAuditoria({
        userId: ctx.user.id,
        acao: 'toggle_feature',
        descricao: `Feature "${resultado.nome}" ${resultado.isAtivo ? 'ativada' : 'desativada'}.`,
        metadata: resultado,
        req: ctx.req
      });
      
      return resultado;
    }),
  
  // Criar nova feature
  criarFeature: adminProcedure
    .input(z.object({
      nome: z.string(),
      descricao: z.string().optional(),
      isAtivo: z.boolean().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await criarFeature(input);
      
      await logAuditoria({
        userId: ctx.user.id,
        acao: 'criar_feature',
        descricao: `Nova feature "${input.nome}" criada.`,
        metadata: { id, ...input },
        req: ctx.req
      });
      
      return { id, ...input };
    }),
  
  // Inicializar features padrão
  inicializarFeatures: adminProcedure.mutation(async ({ ctx }) => {
    await inicializarFeatures();
    
    await logAuditoria({
      userId: ctx.user.id,
      acao: 'inicializar_features',
      descricao: 'Features padrão inicializadas.',
      req: ctx.req
    });
    
    return { sucesso: true };
  }),
  
  // Limpar cache de features
  limparCacheFeatures: adminProcedure.mutation(async ({ ctx }) => {
    const resultado = limparCacheFeatures();
    
    await logAuditoria({
      userId: ctx.user.id,
      acao: 'limpar_cache_features',
      descricao: `Cache de feature flags limpo. ${resultado.entradasRemovidas} entradas removidas.`,
      metadata: resultado,
      req: ctx.req
    });
    
    return resultado;
  }),
});
