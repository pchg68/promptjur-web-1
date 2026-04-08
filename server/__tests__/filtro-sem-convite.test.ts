/**
 * Testes para a lógica de filtragem de e-mails sem convite enviado na whitelist.
 * Valida as regras de negócio do filtro "Sem convite" (convitesEnviados === 0).
 */
import { describe, it, expect } from "vitest";

// Tipo que espelha os campos relevantes de um item da whitelist
type WhitelistItem = {
  id: number;
  email: string;
  nome?: string | null;
  ativo: boolean;
  convitesEnviados: number;
  ultimoEnvio?: Date | null;
  expiresAt?: Date | null;
};

// Helpers que espelham a lógica do componente TabWhitelist
function isExpired(iso: Date | null | undefined): boolean {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

function getAtivos(whitelist: WhitelistItem[]) {
  return whitelist.filter((w) => w.ativo && !isExpired(w.expiresAt));
}

function getSemConvitePendentes(ativos: WhitelistItem[]) {
  return ativos.filter((w) => (w.convitesEnviados ?? 0) === 0);
}

function getAtivosExibidos(ativos: WhitelistItem[], filtrarSemConvite: boolean) {
  return filtrarSemConvite ? getSemConvitePendentes(ativos) : ativos;
}

// Dados de teste
const mockWhitelist: WhitelistItem[] = [
  { id: 1, email: "sem-convite-1@test.com", ativo: true, convitesEnviados: 0, ultimoEnvio: null },
  { id: 2, email: "sem-convite-2@test.com", ativo: true, convitesEnviados: 0, ultimoEnvio: null },
  { id: 3, email: "com-convite-1@test.com", ativo: true, convitesEnviados: 1, ultimoEnvio: new Date("2026-04-01") },
  { id: 4, email: "com-convite-2@test.com", ativo: true, convitesEnviados: 3, ultimoEnvio: new Date("2026-04-05") },
  { id: 5, email: "inativo@test.com", ativo: false, convitesEnviados: 0, ultimoEnvio: null },
  {
    id: 6,
    email: "expirado@test.com",
    ativo: true,
    convitesEnviados: 0,
    ultimoEnvio: null,
    expiresAt: new Date("2020-01-01"), // expirado
  },
];

describe("Filtro: getAtivos", () => {
  it("deve retornar apenas e-mails ativos e não expirados", () => {
    const ativos = getAtivos(mockWhitelist);
    expect(ativos).toHaveLength(4); // exclui inativo (id=5) e expirado (id=6)
    expect(ativos.map((w) => w.id)).toEqual([1, 2, 3, 4]);
  });

  it("deve excluir e-mails inativos mesmo com convitesEnviados = 0", () => {
    const ativos = getAtivos(mockWhitelist);
    const inativo = ativos.find((w) => w.id === 5);
    expect(inativo).toBeUndefined();
  });

  it("deve excluir e-mails expirados mesmo com convitesEnviados = 0", () => {
    const ativos = getAtivos(mockWhitelist);
    const expirado = ativos.find((w) => w.id === 6);
    expect(expirado).toBeUndefined();
  });
});

describe("Filtro: getSemConvitePendentes", () => {
  const ativos = getAtivos(mockWhitelist);

  it("deve retornar apenas e-mails com convitesEnviados = 0", () => {
    const pendentes = getSemConvitePendentes(ativos);
    expect(pendentes).toHaveLength(2);
    expect(pendentes.map((w) => w.email)).toEqual([
      "sem-convite-1@test.com",
      "sem-convite-2@test.com",
    ]);
  });

  it("deve excluir e-mails com convitesEnviados > 0", () => {
    const pendentes = getSemConvitePendentes(ativos);
    const comConvite = pendentes.filter((w) => w.convitesEnviados > 0);
    expect(comConvite).toHaveLength(0);
  });

  it("deve retornar array vazio quando todos os ativos já receberam convite", () => {
    const todosComConvite: WhitelistItem[] = [
      { id: 1, email: "a@test.com", ativo: true, convitesEnviados: 1 },
      { id: 2, email: "b@test.com", ativo: true, convitesEnviados: 5 },
    ];
    const pendentes = getSemConvitePendentes(todosComConvite);
    expect(pendentes).toHaveLength(0);
  });

  it("deve tratar convitesEnviados undefined como 0 (pendente)", () => {
    const comUndefined = [
      { id: 1, email: "a@test.com", ativo: true, convitesEnviados: undefined as unknown as number },
    ];
    const pendentes = getSemConvitePendentes(comUndefined);
    expect(pendentes).toHaveLength(1);
  });
});

describe("Filtro: getAtivosExibidos", () => {
  const ativos = getAtivos(mockWhitelist);

  it("deve retornar todos os ativos quando filtrarSemConvite = false", () => {
    const exibidos = getAtivosExibidos(ativos, false);
    expect(exibidos).toHaveLength(4);
  });

  it("deve retornar apenas pendentes quando filtrarSemConvite = true", () => {
    const exibidos = getAtivosExibidos(ativos, true);
    expect(exibidos).toHaveLength(2);
    expect(exibidos.every((w) => w.convitesEnviados === 0)).toBe(true);
  });

  it("deve alternar corretamente entre os dois modos", () => {
    const semFiltro = getAtivosExibidos(ativos, false);
    const comFiltro = getAtivosExibidos(ativos, true);
    expect(semFiltro.length).toBeGreaterThan(comFiltro.length);
  });
});

describe("Filtro: badge de contagem", () => {
  it("deve exibir a contagem correta de pendentes no badge", () => {
    const ativos = getAtivos(mockWhitelist);
    const pendentes = getSemConvitePendentes(ativos);
    // O badge deve mostrar o número de e-mails sem convite
    expect(pendentes.length).toBe(2);
  });

  it("deve mostrar badge 0 quando todos já receberam convite", () => {
    const todosComConvite: WhitelistItem[] = [
      { id: 1, email: "a@test.com", ativo: true, convitesEnviados: 2 },
    ];
    const pendentes = getSemConvitePendentes(todosComConvite);
    expect(pendentes.length).toBe(0);
  });

  it("deve mostrar badge com total correto para whitelist grande", () => {
    const grande: WhitelistItem[] = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      email: `user${i + 1}@test.com`,
      ativo: true,
      convitesEnviados: i < 20 ? 0 : 1, // primeiros 20 sem convite
    }));
    const ativos = getAtivos(grande);
    const pendentes = getSemConvitePendentes(ativos);
    expect(pendentes.length).toBe(20);
  });
});

describe("Filtro: mensagem de sucesso quando todos enviados", () => {
  it("deve detectar corretamente que não há pendentes", () => {
    const todosEnviados: WhitelistItem[] = [
      { id: 1, email: "a@test.com", ativo: true, convitesEnviados: 1 },
      { id: 2, email: "b@test.com", ativo: true, convitesEnviados: 3 },
    ];
    const ativos = getAtivos(todosEnviados);
    const pendentes = getSemConvitePendentes(ativos);
    // Quando filtrarSemConvite=true e pendentes.length=0, deve mostrar mensagem de sucesso
    const mostrarMensagemSucesso = pendentes.length === 0;
    expect(mostrarMensagemSucesso).toBe(true);
  });
});
