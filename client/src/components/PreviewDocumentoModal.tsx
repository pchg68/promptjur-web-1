import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileDown, FileText, X, Loader2 } from "lucide-react";
import { exportAsTextABNT } from "@/utils/exportABNT";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";

interface PreviewDocumentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo: string;
  conteudo: string;
  areaJuridica?: string;
  tipoDocumento?: string;
  promptId?: number; // Opcional - para registrar no histórico
}

/**
 * Modal de preview de documento antes de exportar
 * Mostra preview formatado, opções de formatação e botões de exportação
 */
export function PreviewDocumentoModal({
  open,
  onOpenChange,
  titulo,
  conteudo,
  areaJuridica,
  tipoDocumento,
  promptId
}: PreviewDocumentoModalProps) {
  
  // Opções de formatação
  const [incluirCabecalho, setIncluirCabecalho] = useState(true);
  const [incluirDataHora, setIncluirDataHora] = useState(true);
  
  // Carregar template padrão do usuário
  const templatePadraoQuery = trpc.formatacaoTemplates.buscarPadrao.useQuery(undefined, {
    enabled: open, // Apenas carregar quando o modal estiver aberto
  });
  
  // Aplicar template padrão quando carregado
  useEffect(() => {
    if (templatePadraoQuery.data) {
      setIncluirCabecalho(templatePadraoQuery.data.incluirCabecalho);
      setIncluirDataHora(templatePadraoQuery.data.incluirDataHora);
    }
  }, [templatePadraoQuery.data]);
  
  // Mutations para exportação via tRPC
  const exportarDocxMutation = trpc.prompts.exportarDocx.useMutation({
    onSuccess: (data) => {
      // Converter base64 para blob e fazer download
      const byteCharacters = atob(data.buffer);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Documento exportado: ${data.filename}`);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Erro ao exportar DOCX: ${error.message}`);
    }
  });
  
  const exportarPdfMutation = trpc.prompts.exportarPdf.useMutation({
    onSuccess: (data) => {
      // Converter base64 para blob e fazer download
      const byteCharacters = atob(data.buffer);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Documento exportado: ${data.filename}`);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Erro ao exportar PDF: ${error.message}`);
    }
  });

  const handleExportTXT = () => {
    exportAsTextABNT(titulo, conteudo);
    toast.success("Arquivo .TXT salvo com formatação ABNT!");
  };

  const handleExportDOCX = () => {
    exportarDocxMutation.mutate({
      promptId,
      titulo,
      conteudo,
      incluirCabecalho,
      incluirDataHora
    });
  };
  
  const handleExportPDF = () => {
    exportarPdfMutation.mutate({
      promptId,
      titulo,
      conteudo,
      incluirCabecalho,
      incluirDataHora
    });
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
            Visualize o documento antes de exportar. Formatação ABNT: Arial 12pt, espaçamento 1.5
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
        
        {/* Opções de Formatação */}
        <div className="flex gap-6 border-b pb-3">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="incluir-cabecalho" 
              checked={incluirCabecalho}
              onCheckedChange={(checked) => setIncluirCabecalho(checked as boolean)}
            />
            <Label htmlFor="incluir-cabecalho" className="text-sm cursor-pointer">
              Incluir cabeçalho do escritório
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="incluir-datahora" 
              checked={incluirDataHora}
              onCheckedChange={(checked) => setIncluirDataHora(checked as boolean)}
            />
            <Label htmlFor="incluir-datahora" className="text-sm cursor-pointer">
              Incluir data e hora
            </Label>
          </div>
        </div>

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
                lineHeight: '1.5'
              }}
            >
              {conteudo.split('\n\n').map((paragrafo, index) => (
                <p key={index} className="mb-4" style={{ textIndent: '2cm' }}>
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
            disabled={exportarDocxMutation.isPending}
          >
            {exportarDocxMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4 mr-2" />
            )}
            Salvar .DOCX
          </Button>
          <Button
            variant="default"
            onClick={handleExportPDF}
            disabled={exportarPdfMutation.isPending}
          >
            {exportarPdfMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4 mr-2" />
            )}
            Salvar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
