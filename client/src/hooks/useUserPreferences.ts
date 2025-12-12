import { useState, useEffect } from "react";

/**
 * Tipos de preferências do usuário
 */
export interface UserPreferences {
  /** Última plataforma de IA selecionada para testar prompts */
  lastAIPlatform: "manus" | "chatgpt" | "claude" | "gemini" | "perplexity" | null;
  /** Modo de interface preferido (wizard ou avançado) */
  preferredMode: "wizard" | "advanced";
  /** Tema de cores preferido */
  theme: "light" | "dark";
}

/**
 * Chave do localStorage para armazenar preferências
 */
const STORAGE_KEY = "promptjur-user-preferences";

/**
 * Preferências padrão
 */
const DEFAULT_PREFERENCES: UserPreferences = {
  lastAIPlatform: null,
  preferredMode: "advanced",
  theme: "dark",
};

/**
 * Hook customizado para gerenciar preferências do usuário no localStorage
 */
export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    // Carregar preferências do localStorage na inicialização
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (error) {
      console.error("[UserPreferences] Erro ao carregar preferências:", error);
    }
    return DEFAULT_PREFERENCES;
  });

  /**
   * Salvar preferências no localStorage sempre que mudarem
   */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error("[UserPreferences] Erro ao salvar preferências:", error);
    }
  }, [preferences]);

  /**
   * Atualizar última plataforma de IA selecionada
   */
  const setLastAIPlatform = (
    platform: "manus" | "chatgpt" | "claude" | "gemini" | "perplexity"
  ) => {
    setPreferences((prev) => ({
      ...prev,
      lastAIPlatform: platform,
    }));
  };

  /**
   * Atualizar modo preferido (wizard ou avançado)
   */
  const setPreferredMode = (mode: "wizard" | "advanced") => {
    setPreferences((prev) => ({
      ...prev,
      preferredMode: mode,
    }));
  };

  /**
   * Atualizar tema preferido
   */
  const setTheme = (theme: "light" | "dark") => {
    setPreferences((prev) => ({
      ...prev,
      theme: theme,
    }));
  };

  /**
   * Resetar todas as preferências para os valores padrão
   */
  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    preferences,
    setLastAIPlatform,
    setPreferredMode,
    setTheme,
    resetPreferences,
  };
}
