import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { registrarMetrica } from "../performance";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

// Middleware para monitorar performance de todas as rotas
const performanceMiddleware = t.middleware(async ({ ctx, next, path, type }) => {
  const inicio = Date.now();
  const resultado = await next();
  const duracao = Date.now() - inicio;
  
  // Registrar métrica (apenas para queries e mutations, não subscriptions)
  if (type === 'query' || type === 'mutation') {
    registrarMetrica({
      rota: path,
      duracao,
      userId: ctx.user?.id
    });
  }
  
  return resultado;
});

export const router = t.router;
export const publicProcedure = t.procedure.use(performanceMiddleware);

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(performanceMiddleware).use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
