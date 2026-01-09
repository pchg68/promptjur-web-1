import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileDown, FileText, X } from "lucide-react";
import { exportAsTextABNT } from "@/utils/exportABNT";
import { exportAsDOCXABNT } from "@/utils/exportDOCX";
import { toast } from "sonner";

interface PreviewDocumentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo: string;
  conteudo: string;
  areaJuridica?: string;
  tipoDocumento?: string;
  onExportPDF: () => void;
}

/**
 * Modal de preview de documento antes de exportar
 * Mostra preview formatado e botões de exportação
 */
export function PreviewDocumentoModal({
  open,
  onOpenChange,
  titulo,
  conteudo,
  areaJuridica,
  tipoDocumento,
  onExportPDF
}: PreviewDocumentoModalProps) {
  
  const handleExportTXT = () => {
    exportAsTextABNT(titulo, conteudo);
    toast.success("Arquivo .TXT salvo com formatação ABNT!");
  };

  const handleExportDOCX = async () => {
    await exportAsDOCXABNT({
      titulo,
      conteudo,
      areaJuridica,
      tipoDocumento
    });
    toast.success("Arquivo .DOCX salvo com formatação ABNT!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Preview do Documento</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Visualize o documento antes de exportar. Formatação ABNT: Arial 12pt, espaçamento 1.0
          </DialogDescription>
        </DialogHeader>

        {/* Metadados */}
        {(areaJuridica || tipoDocumento) && (
          <div className="flex gap-4 text-sm text-muted-foreground border-b pb-3">
            {tipoDocumento && <span><strong>Tipo:</strong> {tipoDocumento}</span>}
            {areaJuridica && <span><strong>Área:</strong> {areaJuridica}</span>}
            <span><strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        )}

        {/* Preview do Conteúdo */}
        <div className="flex-1 overflow-y-auto border rounded-lg p-6 bg-white dark:bg-gray-900">
          <div className="max-w-3xl mx-auto">
            {/* Título */}
            <h1 className="text-2xl font-bold text-center mb-6" style={{ fontFamily: 'Arial, sans-serif' }}>
              {titulo}
            </h1>

            {/* Conteúdo */}
            <div 
              className="text-justify space-y-4" 
              style={{ 
                fontFamily: 'Arial, sans-serif',
                fontSize: '12pt',
                lineHeight: '1.0'
              }}
            >
              {conteudo.split('\n\n').map((paragrafo, index) => (
                <p key={index} className="mb-4">
                  {paragrafo.trim()}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Botões de Exportação */}
        <DialogFooter className="flex flex-row gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="outline"
            onClick={handleExportTXT}
          >
            <FileText className="w-4 h-4 mr-2" />
            Salvar .TXT
          </Button>
          <Button
            variant="outline"
            onClick={handleExportDOCX}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Salvar .DOCX
          </Button>
          <Button
            variant="default"
            onClick={() => {
              onExportPDF();
              onOpenChange(false);
            }}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Salvar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
