import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { referralCodes, referrals, users } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";

/**
 * Gera um código de referral único no formato "NOME-XXXXXX"
 */
function generateReferralCode(userName?: string | null): string {
  const prefix = userName
    ? userName.split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6)
    : "PJUR";
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${suffix}`;
}

export const referralRouter = router({
  /**
   * Retorna o código de referral do usuário logado.
   * Se não existir, cria um automaticamente.
   */
  getMyCode: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database indisponível" });

    // Buscar código existente
    const [existing] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.userId, ctx.user.id))
      .limit(1);

    if (existing) {
      return {
        code: existing.code,
        totalReferrals: existing.totalReferrals,
        convertedReferrals: existing.convertedReferrals,
        rewardCredits: existing.rewardCredits,
        referredRewardCredits: existing.referredRewardCredits,
        isActive: existing.isActive,
      };
    }

    // Criar novo código
    const code = generateReferralCode(ctx.user.name);
    await db.insert(referralCodes).values({
      userId: ctx.user.id,
      code,
      rewardCredits: 5,
      referredRewardCredits: 5,
    });

    return {
      code,
      totalReferrals: 0,
      convertedReferrals: 0,
      rewardCredits: 5,
      referredRewardCredits: 5,
      isActive: true,
    };
  }),

  /**
   * Valida um código de referral (usado na tela de cadastro/primeiro login)
   */
  validateCode: publicProcedure
    .input(z.object({ code: z.string().min(3).max(32) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { valid: false, referrerName: null };

      const [codeRow] = await db
        .select({
          id: referralCodes.id,
          userId: referralCodes.userId,
          isActive: referralCodes.isActive,
          referredRewardCredits: referralCodes.referredRewardCredits,
        })
        .from(referralCodes)
        .where(eq(referralCodes.code, input.code.toUpperCase()))
        .limit(1);

      if (!codeRow || !codeRow.isActive) {
        return { valid: false, referrerName: null, rewardCredits: 0 };
      }

      // Buscar nome do referrer
      const [referrer] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, codeRow.userId))
        .limit(1);

      return {
        valid: true,
        referrerName: referrer?.name || "Usuário PromptJur",
        rewardCredits: codeRow.referredRewardCredits,
      };
    }),

  /**
   * Aplica um código de referral ao usuário logado.
   * Chamado após o primeiro login quando o usuário informou um código.
   */
  applyCode: protectedProcedure
    .input(z.object({ code: z.string().min(3).max(32) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database indisponível" });

      const normalizedCode = input.code.toUpperCase().trim();

      // Buscar código
      const [codeRow] = await db
        .select()
        .from(referralCodes)
        .where(eq(referralCodes.code, normalizedCode))
        .limit(1);

      if (!codeRow || !codeRow.isActive) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Código de indicação inválido ou expirado." });
      }

      // Impedir auto-referral
      if (codeRow.userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode usar seu próprio código de indicação." });
      }

      // Verificar se já foi indicado antes
      const [existingReferral] = await db
        .select()
        .from(referrals)
        .where(eq(referrals.referredId, ctx.user.id))
        .limit(1);

      if (existingReferral) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Você já utilizou um código de indicação anteriormente." });
      }

      // Criar registro de referral
      await db.insert(referrals).values({
        referralCodeId: codeRow.id,
        referrerId: codeRow.userId,
        referredId: ctx.user.id,
        status: "convertido",
        referrerRewarded: true,
        referredRewarded: true,
        convertedAt: new Date(),
      });

      // Incrementar contadores do código
      await db
        .update(referralCodes)
        .set({
          totalReferrals: codeRow.totalReferrals + 1,
          convertedReferrals: codeRow.convertedReferrals + 1,
        })
        .where(eq(referralCodes.id, codeRow.id));

      // Creditar bônus ao indicado
      const [referredUser] = await db
        .select({ bonusCredits: users.bonusCredits })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      await db
        .update(users)
        .set({ bonusCredits: (referredUser?.bonusCredits ?? 0) + codeRow.referredRewardCredits })
        .where(eq(users.id, ctx.user.id));

      // Creditar bônus ao referrer
      const [referrerUser] = await db
        .select({ bonusCredits: users.bonusCredits })
        .from(users)
        .where(eq(users.id, codeRow.userId))
        .limit(1);

      await db
        .update(users)
        .set({ bonusCredits: (referrerUser?.bonusCredits ?? 0) + codeRow.rewardCredits })
        .where(eq(users.id, codeRow.userId));

      return {
        success: true,
        creditsEarned: codeRow.referredRewardCredits,
        referrerName: null, // privacidade
      };
    }),

  /**
   * Lista as indicações do usuário logado
   */
  getMyReferrals: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { referrals: [], totalEarned: 0 };

    // Buscar código do usuário
    const [codeRow] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.userId, ctx.user.id))
      .limit(1);

    if (!codeRow) return { referrals: [], totalEarned: 0 };

    // Buscar indicações
    const myReferrals = await db
      .select({
        id: referrals.id,
        status: referrals.status,
        referrerRewarded: referrals.referrerRewarded,
        convertedAt: referrals.convertedAt,
        createdAt: referrals.createdAt,
        referredName: users.name,
      })
      .from(referrals)
      .leftJoin(users, eq(referrals.referredId, users.id))
      .where(eq(referrals.referrerId, ctx.user.id))
      .orderBy(desc(referrals.createdAt))
      .limit(50);

    const totalEarned = myReferrals.filter(r => r.referrerRewarded).length * codeRow.rewardCredits;

    return {
      referrals: myReferrals.map(r => ({
        id: r.id,
        referredName: r.referredName ? r.referredName.split(" ")[0] + " ***" : "Usuário",
        status: r.status,
        rewarded: r.referrerRewarded,
        convertedAt: r.convertedAt,
        createdAt: r.createdAt,
      })),
      totalEarned,
    };
  }),
});
