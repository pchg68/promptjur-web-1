import { useRef, useState, useCallback } from "react";
import { Paperclip, X, FileText, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

/**
 * Anexo de documento client-side para enriquecer o contexto do gerador
 * de prompts. O texto é extraído INTEIRAMENTE no navegador — nenhum
 * byte do arquivo trafega para o servidor. Após extração, o usuário
 * pode revisar/editar o texto, que então é mesclado ao contexto
 * jurídico pelo componente pai.
 *
 * Formatos suportados:
 *  - PDF (pdfjs-dist, extração por página)
 *  - DOCX (mammoth.extractRawText)
 *  - TXT/MD (leitura direta como texto)
 *
 * Sem persistência, sem upload, sem RAG — MVP deliberadamente pequeno.
 */

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_TEXT_CHARS = 15_000; // soft limit; acima disso avisa o usuário
const HARD_TEXT_LIMIT = 30_000; // hard limit; acima disso trunca

export interface AttachedDocument {
  fileName: string;
  fileSize: number;
  text: string;
  truncated: boolean;
}

interface DocumentAttachmentProps {
  attached: AttachedDocument | null;
  onAttach: (doc: AttachedDocument) => void;
  onRemove: () => void;
  disabled?: boolean;
}

async function extractFromPdf(file: File): Promise<string> {
  // Import dinâmico — pdfjs é pesado (~1MB) e só queremos carregar sob demanda
  const pdfjsLib = await import("pdfjs-dist");
  // O worker é servido via CDN para evitar fricção de bundling com Vite.
  // Em produção pode-se servir o worker do próprio domínio — ver docs do pdfjs.
  const workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerSrc;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const chunks: string[] = [];
  const maxPages = Math.min(pdf.numPages, 50); // teto defensivo — 50 páginas
  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const text = content.items.map((item: any) => (item.str ?? "")).join(" ");
    chunks.push(text);
  }
  return chunks.join("\n\n").replace(/\s+/g, " ").trim();
}

async function extractFromDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return (result.value ?? "").trim();
}

async function extractFromTxt(file: File): Promise<string> {
  return (await file.text()).trim();
}

function detectKind(file: File): "pdf" | "docx" | "txt" | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") return "pdf";
  if (name.endsWith(".docx")) return "docx";
  if (name.endsWith(".txt") || name.endsWith(".md") || file.type.startsWith("text/")) return "txt";
  return null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function DocumentAttachment({ attached, onAttach, onRemove, disabled }: DocumentAttachmentProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewText, setPreviewText] = useState("");

  const handleFile = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      toast.error(`Arquivo muito grande (${formatBytes(file.size)}). Limite: 10 MB.`);
      return;
    }
    const kind = detectKind(file);
    if (!kind) {
      toast.error("Formato não suportado. Use PDF, DOCX, TXT ou MD.");
      return;
    }

    setIsExtracting(true);
    try {
      let text = "";
      if (kind === "pdf") text = await extractFromPdf(file);
      else if (kind === "docx") text = await extractFromDocx(file);
      else text = await extractFromTxt(file);

      if (!text) {
        toast.error("Não foi possível extrair texto deste arquivo.");
        return;
      }

      let finalText = text;
      let truncated = false;
      if (finalText.length > HARD_TEXT_LIMIT) {
        finalText = finalText.slice(0, HARD_TEXT_LIMIT) + "\n\n[...texto truncado pelo limite de 30.000 caracteres...]";
        truncated = true;
      }

      setPreviewText(finalText);
      setShowPreview(true);

      // Mantém o estado do pai atualizado já — o usuário ainda pode editar no preview
      onAttach({
        fileName: file.name,
        fileSize: file.size,
        text: finalText,
        truncated,
      });

      if (truncated) {
        toast.warning("Texto truncado para caber no limite de contexto.");
      } else {
        toast.success(`Documento anexado: ${file.name}`);
      }
    } catch (err) {
      console.error("[DocumentAttachment] extraction error", err);
      toast.error("Erro ao extrair texto do arquivo. Tente outro formato ou cole o conteúdo manualmente.");
    } finally {
      setIsExtracting(false);
    }
  }, [onAttach]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    // Reset input para permitir re-upload do mesmo arquivo
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = () => {
    setPreviewText("");
    setShowPreview(false);
    onRemove();
  };

  const handlePreviewChange = (newText: string) => {
    setPreviewText(newText);
    if (attached) {
      onAttach({ ...attached, text: newText, truncated: newText.length >= HARD_TEXT_LIMIT });
    }
  };

  const isOverSoftLimit = previewText.length > MAX_TEXT_CHARS;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">Documento Anexado (opcional)</Label>
        {attached && (
          <button
            type="button"
            onClick={() => setShowPreview(v => !v)}
            className="text-xs text-primary hover:underline"
          >
            {showPreview ? "Ocultar preview" : "Ver preview"}
          </button>
        )}
      </div>

      {!attached ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md,application/pdf,text/plain,text/markdown"
            onChange={onFileChange}
            disabled={disabled || isExtracting}
            className="hidden"
            aria-label="Anexar documento"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || isExtracting}
            className="w-full justify-start gap-2"
          >
            {isExtracting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Extraindo texto...
              </>
            ) : (
              <>
                <Paperclip className="w-4 h-4" />
                Anexar PDF, DOCX ou TXT
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            O texto é extraído no seu navegador — o arquivo não é enviado ao servidor. Máx 10 MB, 50 páginas.
          </p>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 rounded-md border border-primary/20 bg-primary/5 p-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{attached.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(attached.fileSize)} · {attached.text.length.toLocaleString("pt-BR")} chars
                  {attached.truncated && " · truncado"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              aria-label="Remover documento"
              className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {showPreview && (
            <div className="space-y-2">
              {isOverSoftLimit && (
                <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-500">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>
                    Texto extenso ({previewText.length.toLocaleString("pt-BR")} chars). Considere editar ou resumir para melhor qualidade do prompt.
                  </span>
                </div>
              )}
              <Textarea
                value={previewText}
                onChange={e => handlePreviewChange(e.target.value)}
                className="min-h-[160px] font-mono text-xs"
                placeholder="Texto extraído do documento..."
              />
              <p className="text-xs text-muted-foreground">
                Você pode editar o texto acima. O conteúdo final será incluído no contexto do prompt.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
