/**
 * Barrel file — re-exporta todos os módulos de db.
 * Mantém compatibilidade com imports existentes de "../db" e "./db".
 */
export { getDb } from "./connection";
export * from "./analises";
export * from "./analytics";
export * from "./cabecalho";
export * from "./configuracoes";
export * from "./fontes";
export * from "./formatacao";
export * from "./historico";
export * from "./modelos";
export * from "./prompts";
export * from "./tags";
export * from "./templates";
export * from "./tutoriais";
export * from "./users";
export * from "./versoes";
