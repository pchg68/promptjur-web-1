import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { setUserContext, clearUserContext } from "./sentry";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Definir contexto de usuário no Sentry para rastreamento
  if (user) {
    setUserContext({ id: user.id, email: user.email, name: user.name, role: user.role });
  } else {
    clearUserContext();
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
