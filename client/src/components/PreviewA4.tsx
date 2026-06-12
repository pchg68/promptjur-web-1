import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-react";

interface PreviewA4Props {
  content: string;
  tipoDocumento?: string;
  areaJuridica?: string;
  isEditing?: boolean;
  editedContent?: string;
  onEditChange?: (value: string) => void;
}

/**
 * Renderiza o prompt gerado como uma folha A4 com tipografia jurídica ABNT.
 * Fundo branco, fonte serif, margens reais, simulando um documento real.
 *
 * CORREÇÃO: O container de scroll usa bg-background (tema) em vez de cor hardcoded,
 * e a folha A4 usa transformOrigin "top center" com marginBottom compensatório
 * para evitar que o fundo escuro apareça abaixo da folha ao rolar.
 */
export function PreviewA4({
  content,
  tipoDocumento,
  areaJuridica,
  isEditing,
  editedContent,
  onEditChange,
}: PreviewA4Props) {
  const [zoom, setZoom] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);

  const displayContent = isEditing ? (editedContent ?? content) : content;

  // Formata o texto para exibição jurídica:
  // - Linhas em maiúsculas que parecem títulos ficam em negrito/centrado
  // - Parágrafos normais ficam com recuo
  const renderContent = (text: string) => {
    const lines = text.split("\n");
    const elements: JSX.Element[] = [];
    let paraBuffer: string[] = [];

    const flushPara = (key: string) => {
      if (paraBuffer.length > 0) {
        const joined = paraBuffer.join(" ").trim();
        if (joined) {
          elements.push(
            <p
              key={key}
              className="text-justify leading-[1.8] mb-3 text-[13px] text-gray-900"
              style={{ textIndent: "2cm", fontFamily: "Arial, sans-serif" }}
            >
              {joined}
            </p>
          );
        }
        paraBuffer = [];
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      if (!trimmed) {
        flushPara(`para-${idx}`);
        return;
      }

      // Detectar títulos: linha toda em maiúsculas ou começa com número romano/arábico seguido de ponto
      const isTitulo =
        /^[IVXLCDM]+\s*[-–—.]/.test(trimmed) ||
        /^\d+\s*[-–—.]/.test(trimmed) ||
        (trimmed === trimmed.toUpperCase() && trimmed.length > 4 && !/^\d/.test(trimmed));

      // Detectar cabeçalho (EXCELENTÍSSIMO, AO JUÍZO, etc.)
      const isCabecalho =
        /^(EXCELENTÍSSIMO|AO JUÍZO|EXMO|MM\.|ILUSTRÍSSIMO|MERITÍSSIMO)/i.test(trimmed);

      // Detectar assinatura/local/data
      const isAssinatura =
        /^[A-Z][a-z]+,\s+\d{1,2}\s+de\s+[a-z]+/.test(trimmed) ||
        /^[A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+/.test(trimmed) ||
        /^OAB\//.test(trimmed);

      if (isCabecalho) {
        flushPara(`para-${idx}`);
        elements.push(
          <p
            key={`cab-${idx}`}
            className="text-center font-semibold text-[13px] mb-4 leading-[1.8] text-gray-900"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            {trimmed}
          </p>
        );
      } else if (isTitulo) {
        flushPara(`para-${idx}`);
        elements.push(
          <h3
            key={`titulo-${idx}`}
            className="text-center font-bold text-[13px] mt-6 mb-3 uppercase tracking-wide text-gray-900"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            {trimmed}
          </h3>
        );
      } else if (isAssinatura) {
        flushPara(`para-${idx}`);
        elements.push(
          <p
            key={`assin-${idx}`}
            className="text-right text-[13px] mt-4 leading-[1.8] text-gray-900"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            {trimmed}
          </p>
        );
      } else {
        paraBuffer.push(trimmed);
      }
    });

    flushPara("final");
    return elements;
  };

  const zoomIn = () => setZoom(z => Math.min(z + 10, 150));
  const zoomOut = () => setZoom(z => Math.max(z - 10, 60));

  // Calcula a altura real da folha A4 após o scale para compensar o espaço vazio
  // A4 base height = 1123px. Após scale, a altura visual = 1123 * (zoom/100)
  // O espaço "perdido" = 1123 * (1 - zoom/100), que deve ser subtraído como margin negativo
  const a4BaseHeight = 1123;
  const scaledHeight = a4BaseHeight * (zoom / 100);
  const marginBottomCompensation = zoom < 100 ? scaledHeight - a4BaseHeight : 0;

  return (
    <div className={`flex flex-col ${fullscreen ? "fixed inset-0 z-50 bg-background" : ""}`}
         style={{ height: fullscreen ? "100vh" : "auto" }}>
      {/* Barra de controles do preview */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border border-border rounded-t-md flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Visualização A4</span>
          {tipoDocumento && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{tipoDocumento}</Badge>
          )}
          {areaJuridica && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5">{areaJuridica}</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={zoomOut} disabled={zoom <= 60}>
            <ZoomOut className="w-3 h-3" />
          </Button>
          <span className="text-[10px] text-muted-foreground w-8 text-center">{zoom}%</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={zoomIn} disabled={zoom >= 150}>
            <ZoomIn className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={() => setFullscreen(f => !f)}>
            {fullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {/* Área de scroll do documento — fundo neutro que combina com o tema */}
      <div
        className="overflow-y-auto border border-t-0 border-border rounded-b-md"
        style={{
          background: "#e8e8e8",
          // Altura fixa para o container de scroll: mostra ~2/3 da folha A4 por padrão
          // Em fullscreen, ocupa o restante da tela
          height: fullscreen ? "calc(100vh - 40px)" : "600px",
        }}
      >
        {/* Wrapper centralizado que contém a folha A4 */}
        <div className="flex justify-center py-6 px-4">
          {isEditing ? (
            /* Modo edição: textarea simples */
            <textarea
              value={editedContent ?? content}
              onChange={e => onEditChange?.(e.target.value)}
              className="w-full max-w-[794px] min-h-[1123px] p-[2.5cm] bg-white text-gray-900 font-mono text-sm resize-none border border-gray-200 outline-none shadow-xl"
              style={{
                fontFamily: "Arial, sans-serif",
                lineHeight: "1.5",
                fontSize: "12pt",
              }}
            />
          ) : (
            /* Modo visualização: folha A4 branca com sombra */
            <div
              className="bg-white shadow-2xl flex-shrink-0"
              style={{
                width: "794px",
                minHeight: `${a4BaseHeight}px`,
                padding: "3cm 2.5cm 2.5cm 3cm",
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
                // Compensação: quando zoom < 100%, a folha encolhe mas ocupa menos espaço visual.
                // marginBottom negativo remove o espaço vazio abaixo da folha transformada.
                marginBottom: marginBottomCompensation !== 0 ? `${marginBottomCompensation}px` : undefined,
                // Sombra premium para simular papel real
                boxShadow: "0 4px 32px rgba(0,0,0,0.25), 0 1px 4px rgba(0,0,0,0.15)",
              }}
            >
              {/* Conteúdo do documento */}
              <div>
                {renderContent(displayContent)}
              </div>

              {/* Rodapé do documento */}
              <div
                className="mt-12 pt-4 border-t border-gray-200 text-center text-[10px] text-gray-400"
                style={{ fontFamily: "Arial, sans-serif" }}
              >
                Documento gerado pelo PromptJur — Sempre revise antes de usar em contexto profissional
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
