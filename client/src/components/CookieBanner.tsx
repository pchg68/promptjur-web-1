/**
 * CookieBanner — Banner de consentimento de cookies conforme LGPD (Lei 13.709/2018)
 *
 * Comportamento:
 * - Exibe na primeira visita (sem consentimento registrado)
 * - Persiste escolha no localStorage sob a chave "cookie_consent"
 * - Valores: "accepted" | "declined"
 * - Ao recusar, apenas cookies estritamente necessários são mantidos
 * - Reaparece se o consentimento tiver mais de 365 dias
 */
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Cookie, X, ChevronDown, ChevronUp, Shield } from "lucide-react";

const STORAGE_KEY = "cookie_consent";
const STORAGE_DATE_KEY = "cookie_consent_date";
const CONSENT_EXPIRY_DAYS = 365;

type ConsentValue = "accepted" | "declined" | null;

function getStoredConsent(): ConsentValue {
  try {
    const value = localStorage.getItem(STORAGE_KEY) as ConsentValue;
    const dateStr = localStorage.getItem(STORAGE_DATE_KEY);
    if (!value || !dateStr) return null;

    // Verificar se o consentimento expirou
    const consentDate = new Date(dateStr);
    const now = new Date();
    const diffDays = (now.getTime() - consentDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > CONSENT_EXPIRY_DAYS) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_DATE_KEY);
      return null;
    }

    return value;
  } catch {
    return null;
  }
}

function saveConsent(value: "accepted" | "declined") {
  try {
    localStorage.setItem(STORAGE_KEY, value);
    localStorage.setItem(STORAGE_DATE_KEY, new Date().toISOString());
  } catch {
    // localStorage indisponível (modo privado restrito)
  }
}

export function useCookieConsent() {
  return getStoredConsent();
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Pequeno delay para não bloquear o LCP
    const timer = setTimeout(() => {
      const stored = getStoredConsent();
      if (stored === null) setVisible(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    saveConsent("accepted");
    setVisible(false);
  };

  const handleDecline = () => {
    saveConsent("declined");
    setVisible(false);
  };

  return (
    <>
      {/* Overlay sutil para mobile */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-[998] md:hidden"
        aria-hidden="true"
      />

      {/* Banner */}
      <div
        role="dialog"
        aria-label="Consentimento de cookies"
        aria-modal="false"
        className="fixed bottom-0 left-0 right-0 z-[999] md:bottom-4 md:left-4 md:right-auto md:max-w-md animate-in slide-in-from-bottom-4 duration-300"
      >
        <div className="bg-[#0f1923] border border-[#1e3a5f] md:rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Header */}
          <div className="flex items-start gap-3 p-4 pb-3">
            <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0 mt-0.5">
              <Cookie className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-white">
                  Cookies e Privacidade
                </h2>
                <button
                  onClick={handleDecline}
                  className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
                  aria-label="Fechar e recusar cookies opcionais"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Usamos cookies essenciais para o funcionamento da plataforma. Conforme a{" "}
                <strong className="text-gray-300">LGPD (Lei 13.709/2018)</strong>, você pode
                aceitar ou recusar cookies não essenciais.
              </p>
            </div>
          </div>

          {/* Expandable details */}
          <div className="px-4 pb-2">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              aria-expanded={expanded}
            >
              {expanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
              {expanded ? "Ocultar detalhes" : "Ver detalhes dos cookies"}
            </button>

            {expanded && (
              <div className="mt-3 space-y-2 text-xs text-gray-400 border-t border-[#1e3a5f] pt-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <span className="font-medium text-gray-300">Essenciais (sempre ativos)</span>
                    <p className="mt-0.5">Sessão de autenticação, preferências de tema. Necessários para o funcionamento básico.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <span className="font-medium text-gray-300">Diagnóstico (opcional)</span>
                    <p className="mt-0.5">Logs de erros via Sentry para melhorar a estabilidade. Dados anonimizados.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="w-3 h-3 text-gray-500 flex-shrink-0 mt-0.5" />
                  <p>
                    Não utilizamos cookies de publicidade ou rastreamento de terceiros.{" "}
                    <Link href="/privacidade" className="text-blue-400 hover:underline">
                      Política de Privacidade completa →
                    </Link>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 p-4 pt-3 border-t border-[#1e3a5f]">
            <Button
              onClick={handleDecline}
              variant="outline"
              size="sm"
              className="flex-1 border-[#1e3a5f] text-gray-300 hover:bg-[#1a2332] hover:text-white text-xs h-8"
            >
              Apenas essenciais
            </Button>
            <Button
              onClick={handleAccept}
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
            >
              Aceitar todos
            </Button>
          </div>

          {/* Legal note */}
          <div className="px-4 pb-3 flex items-center justify-center gap-3 text-[10px] text-gray-600">
            <Link href="/termos" className="hover:text-gray-400 transition-colors">
              Termos de Uso
            </Link>
            <span>·</span>
            <Link href="/privacidade" className="hover:text-gray-400 transition-colors">
              Privacidade
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
