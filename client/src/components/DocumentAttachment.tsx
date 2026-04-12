import { useRef, useState, useCallback } from "react";
import { Paperclip, X, FileText, Loader2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

/**
 * Anexo de múltiplos documentos client-side para enriquecer o contexto
 * do gerador de prompts. O texto é extraído INTEIRAMENTE no navegador —
 * nenhum byte do arquivo trafega para o servidor. Após extração, o
 * usuário pode revisar/editar o texto de cada documento, que então é
 * mesclado ao contexto jurídico pelo componente pai.
 *
 * Formatos suportados:
 *  - PDF (pdfjs-dist, extração por página, até 200 páginas)
 *  - DOCX (mammoth.extractRawText)
 *  - TXT/MD (leitura direta como texto)
 *
 * Limites dimensionados para casos jurídicos reais (processos e
 * contratos costumam ser grandes):
 *  - 25 MB por arquivo
 *  - 200 páginas por PDF
 *  - 50k chars soft / 120k chars hard por documento
 *  - 300k chars agregados no total (para caber em contextos de LLMs)
 *
 * Sem persistência, sem upload, sem RAG — MVP deliberadamente pequeno.
 */

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_PDF_PAGES = 200; // teto defensivo de páginas por PDF
const MAX_TEXT_CHARS = 50_000; // soft limit por doc; acima disso avisa o usuário
const HARD_TEXT_LIMIT = 120_000; // hard limit por doc; acima disso trunca
const MAX_TOTAL_CHARS = 300_000; // hard limit agregado (todos os docs)

export interface AttachedDocument {
  id: string;
  fileName: string;
  fileSize: number;
  text: string;
  truncated: boolean;
}

interface DocumentAttachmentProps {
  docs: AttachedDocument[];
  onChange: (docs: AttachedDocument[]) => void;
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
  const maxPages = Math.min(pdf.numPages, MAX_PDF_PAGES);
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

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function totalChars(docs: AttachedDocument[]): number {
  return docs.reduce((sum, d) => sum + d.text.length, 0);
}

interface DocumentCardProps {
  doc: AttachedDocument;
  onRemove: () => void;
  onEdit: (newText: string) => void;
  disabled?: boolean;
}

function DocumentCard({ doc, onRemove, onEdit, disabled }: DocumentCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const isOverSoftLimit = doc.text.length > MAX_TEXT_CHARS;

  return (
    <div className="rounded-md border border-primary/20 bg-primary/5 p-2.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FileText className="w-4 h-4 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{doc.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(doc.fileSize)} · {doc.text.length.toLocaleString("pt-BR")} chars
              {doc.truncated && " · truncado"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setShowPreview(v => !v)}
            className="text-xs text-primary hover:underline px-1.5 py-0.5 flex items-center gap-0.5"
            aria-label={showPreview ? "Ocultar preview" : "Ver preview"}
          >
            {showPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showPreview ? "Ocultar" : "Preview"}
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            aria-label="Remover documento"
            className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showPreview && (
        <div className="space-y-2">
          {isOverSoftLimit && (
            <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-500">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                Texto extenso ({doc.text.length.toLocaleString("pt-BR")} chars). Considere editar ou resumir para melhor qualidade do prompt.
              </span>
            </div>
          )}
          <Textarea
            value={doc.text}
            onChange={e => onEdit(e.target.value)}
            className="min-h-[160px] font-mono text-xs"
            placeholder="Texto extraído do documento..."
          />
          <p className="text-xs text-muted-foreground">
            Você pode editar o texto acima. O conteúdo final será incluído no contexto do prompt.
          </p>
        </div>
      )}
    </div>
  );
}

export function DocumentAttachment({ docs, onChange, disabled }: DocumentAttachmentProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      toast.error(`Arquivo muito grande (${formatBytes(file.size)}). Limite: 25 MB.`);
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
        finalText = finalText.slice(0, HARD_TEXT_LIMIT) + "\n\n[...texto truncado pelo limite de 120.000 caracteres por documento...]";
        truncated = true;
      }

      // Checa limite agregado antes de aceitar o novo doc
      const currentTotal = totalChars(docs);
      const remaining = MAX_TOTAL_CHARS - currentTotal;
      if (remaining <= 0) {
        toast.error(`Limite total de ${MAX_TOTAL_CHARS.toLocaleString("pt-BR")} chars atingido. Remova algum documento antes de anexar outro.`);
        return;
      }
      if (finalText.length > remaining) {
        finalText = finalText.slice(0, remaining) + "\n\n[...texto truncado para caber no limite agregado de 300.000 caracteres...]";
        truncated = true;
      }

      const newDoc: AttachedDocument = {
        id: newId(),
        fileName: file.name,
        fileSize: file.size,
        text: finalText,
        truncated,
      };

      onChange([...docs, newDoc]);

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
  }, [docs, onChange]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    // Reset input para permitir re-upload do mesmo arquivo
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = (id: string) => {
    onChange(docs.filter(d => d.id !== id));
  };

  const handleEdit = (id: string, newText: string) => {
    onChange(
      docs.map(d =>
        d.id === id
          ? { ...d, text: newText, truncated: newText.length >= HARD_TEXT_LIMIT }
          : d,
      ),
    );
  };

  const aggregateChars = totalChars(docs);
  const aggregatePct = Math.min(100, Math.round((aggregateChars / MAX_TOTAL_CHARS) * 100));
  const isNearAggregateLimit = aggregatePct >= 80;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">Documentos Anexados (opcional)</Label>
        {docs.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {docs.length} {docs.length === 1 ? "documento" : "documentos"} · {aggregateChars.toLocaleString("pt-BR")} chars
          </span>
        )}
      </div>

      {/* Lista de documentos anexados */}
      {docs.length > 0 && (
        <div className="space-y-2">
          {docs.map(doc => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onRemove={() => handleRemove(doc.id)}
              onEdit={(newText) => handleEdit(doc.id, newText)}
              disabled={disabled}
            />
          ))}
          {isNearAggregateLimit && (
            <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-500">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                Contexto próximo do limite ({aggregatePct}% de {MAX_TOTAL_CHARS.toLocaleString("pt-BR")} chars). Considere remover algum documento.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Botão de upload */}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md,application/pdf,text/plain,text/markdown"
        onChange={onFileChange}
        disabled={disabled || isExtracting || aggregateChars >= MAX_TOTAL_CHARS}
        className="hidden"
        aria-label="Anexar documento"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || isExtracting || aggregateChars >= MAX_TOTAL_CHARS}
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
            {docs.length === 0 ? "Anexar PDF, DOCX ou TXT" : "Anexar outro documento"}
          </>
        )}
      </Button>
      {docs.length === 0 && (
        <p className="text-xs text-muted-foreground">
          O texto é extraído no seu navegador — o arquivo não é enviado ao servidor. Máx 25 MB, 200 páginas por arquivo.
        </p>
      )}
    </div>
  );
}
