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
              className="text-justify leading-[1.8] mb-3 text-[13px]"
              style={{ textIndent: "2cm", fontFamily: "'Times New Roman', Georgia, serif" }}
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
            className="text-center font-semibold text-[13px] mb-4 leading-[1.8]"
            style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
          >
            {trimmed}
          </p>
        );
      } else if (isTitulo) {
        flushPara(`para-${idx}`);
        elements.push(
          <h3
            key={`titulo-${idx}`}
            className="text-center font-bold text-[13px] mt-6 mb-3 uppercase tracking-wide"
            style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
          >
            {trimmed}
          </h3>
        );
      } else if (isAssinatura) {
        flushPara(`para-${idx}`);
        elements.push(
          <p
            key={`assin-${idx}`}
            className="text-right text-[13px] mt-4 leading-[1.8]"
            style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
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

  return (
    <div className={`flex flex-col h-full ${fullscreen ? "fixed inset-0 z-50 bg-[#1a1a2e]" : ""}`}>
      {/* Barra de controles do preview */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-b border-border flex-shrink-0">
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

      {/* Área de scroll do documento */}
      <div className="flex-1 overflow-y-auto bg-[#2a2a3e] p-4 flex justify-center">
        {isEditing ? (
          /* Modo edição: textarea simples */
          <textarea
            value={editedContent ?? content}
            onChange={e => onEditChange?.(e.target.value)}
            className="w-full max-w-[794px] min-h-[1123px] p-[2.5cm] bg-white text-gray-900 font-mono text-sm resize-none border-0 outline-none shadow-xl"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
              fontFamily: "'Times New Roman', Georgia, serif",
              lineHeight: "1.8",
            }}
          />
        ) : (
          /* Modo visualização: folha A4 branca */
          <div
            className="bg-white shadow-2xl"
            style={{
              width: "794px",
              minHeight: "1123px",
              padding: "2.5cm 3cm 2.5cm 3cm",
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
              marginBottom: zoom < 100 ? `${(zoom - 100) * 11.23}px` : "0",
            }}
          >
            {/* Conteúdo do documento */}
            <div className="text-gray-900">
              {renderContent(displayContent)}
            </div>

            {/* Rodapé do documento */}
            <div
              className="mt-12 pt-4 border-t border-gray-200 text-center text-[10px] text-gray-400"
              style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
            >
              Documento gerado pelo PromptJur — Sempre revise antes de usar em contexto profissional
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
