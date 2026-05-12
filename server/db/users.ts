/**
 * Helpers de usuários.
 */
import { eq } from "drizzle-orm";
import { InsertUser, users } from "../../drizzle/schema";
import { getDb } from "./connection";
import { logger } from "../_core/logger";
import { ENV } from "../_core/env";


// ===== USER HELPERS =====

/**
 * Insere ou atualiza um usuário no banco de dados.
 * Se o usuário já existir (baseado em openId), atualiza os campos fornecidos.
 * Automaticamente promove o proprietário do projeto (ENV.ownerOpenId) para admin.
 * 
 * @param {InsertUser} user - Dados do usuário para inserir/atualizar
 * @param {string} user.openId - ID único do OAuth (obrigatório)
 * @param {string} [user.name] - Nome do usuário
 * @param {string} [user.email] - Email do usuário
 * @param {string} [user.loginMethod] - Método de login (google, github, etc)
 * @param {Date} [user.lastSignedIn] - Data do último login
 * @param {'admin' | 'user'} [user.role] - Role do usuário
 * @throws {Error} Se openId não for fornecido
 * @returns {Promise<void>}
 * @example
 * await upsertUser({
 *   openId: 'abc123',
 *   name: 'João Silva',
 *   email: 'joao@example.com',
 *   loginMethod: 'google'
 * });
 */
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    logger.warn('[Database] Cannot upsert user: database not available');
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    // Verificar se é o proprietário (por openId ou por e-mail)
    const isOwnerById = user.openId === ENV.ownerOpenId;
    const isOwnerByEmail = !!(user.email && ENV.ownerEmails.includes(user.email));
    const isOwner = isOwnerById || isOwnerByEmail;

    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (isOwner) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    // Garantir plano enterprise ilimitado para o proprietário
    if (isOwner) {
      values.subscriptionPlan = 'enterprise';
      updateSet.subscriptionPlan = 'enterprise';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet,
    });
  } catch (error) {
    logger.error('[Database] Failed to upsert user', { error });
    throw error;
  }
}


/**
 * Busca um usuário pelo openId (identificador OAuth).
 * 
 * @param {string} openId - ID único do OAuth
 * @returns {Promise<User | undefined>} Usuário encontrado ou undefined
 * @example
 * const user = await getUserByOpenId('abc123');
 * if (user) {
 *   console.log(`Usuário: ${user.name}`);
 * }
 */
export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    logger.warn('[Database] Cannot get user: database not available');
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}


/**
 * Buscar usuário por ID interno (para envio de e-mails de notificação)
 */
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}
