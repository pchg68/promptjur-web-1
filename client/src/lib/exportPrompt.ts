import { jsPDF } from "jspdf";
import { Document, Paragraph, TextRun, AlignmentType, HeadingLevel, Packer } from "docx";
import { saveAs } from "file-saver";

interface PromptData {
  id: number;
  tipo: string;
  areaJuridica?: string | null;
  promptOriginal: string;
  promptOtimizado?: string | null;
  qualidade?: string | null;
  createdAt: Date | string;
}

const getTipoLabel = (tipo: string): string => {
  const labels: Record<string, string> = {
    analise: "Análise",
    geracao: "Geração",
    otimizacao: "Otimização"
  };
  return labels[tipo] || tipo;
};

const formatDate = (date: Date | string): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

export async function exportToPDF(prompt: PromptData): Promise<void> {
  const doc = new jsPDF();
  
  // Configurações
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - (margin * 2);
  let yPosition = margin;
  
  // Título
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("PromptJur - Prompt Jurídico", margin, yPosition);
  yPosition += 15;
  
  // Metadados
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`ID: ${prompt.id} | Tipo: ${getTipoLabel(prompt.tipo)} | Data: ${formatDate(prompt.createdAt)}`, margin, yPosition);
  yPosition += 7;
  
  if (prompt.areaJuridica) {
    doc.text(`Área Jurídica: ${prompt.areaJuridica}`, margin, yPosition);
    yPosition += 7;
  }
  
  if (prompt.qualidade) {
    doc.text(`Qualidade: ${prompt.qualidade}`, margin, yPosition);
    yPosition += 7;
  }
  
  yPosition += 5;
  
  // Linha separadora
  doc.setDrawColor(200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  // Prompt Original
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text("Prompt Original:", margin, yPosition);
  yPosition += 8;
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const originalLines = doc.splitTextToSize(prompt.promptOriginal, maxWidth);
  doc.text(originalLines, margin, yPosition);
  yPosition += (originalLines.length * 6) + 10;
  
  // Prompt Otimizado (se existir)
  if (prompt.promptOtimizado) {
    // Verificar se precisa de nova página
    if (yPosition > 250) {
      doc.addPage();
      yPosition = margin;
    }
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Prompt Otimizado:", margin, yPosition);
    yPosition += 8;
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const otimizadoLines = doc.splitTextToSize(prompt.promptOtimizado, maxWidth);
    doc.text(otimizadoLines, margin, yPosition);
  }
  
  // Rodapé
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount} | © ${new Date().getFullYear()} PromptJur`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }
  
  // Salvar
  const filename = `promptjur-${prompt.id}-${Date.now()}.pdf`;
  doc.save(filename);
}

export async function exportToDOCX(prompt: PromptData): Promise<void> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Título
        new Paragraph({
          text: "PromptJur - Prompt Jurídico",
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 }
        }),
        
        // Metadados
        new Paragraph({
          children: [
            new TextRun({
              text: `ID: ${prompt.id} | Tipo: ${getTipoLabel(prompt.tipo)} | Data: ${formatDate(prompt.createdAt)}`,
              size: 20,
              color: "666666"
            })
          ],
          spacing: { after: 100 }
        }),
        
        ...(prompt.areaJuridica ? [
          new Paragraph({
            children: [
              new TextRun({
                text: `Área Jurídica: ${prompt.areaJuridica}`,
                size: 20,
                color: "666666"
              })
            ],
            spacing: { after: 100 }
          })
        ] : []),
        
        ...(prompt.qualidade ? [
          new Paragraph({
            children: [
              new TextRun({
                text: `Qualidade: ${prompt.qualidade}`,
                size: 20,
                color: "666666"
              })
            ],
            spacing: { after: 200 }
          })
        ] : []),
        
        // Prompt Original
        new Paragraph({
          text: "Prompt Original:",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        }),
        
        new Paragraph({
          text: prompt.promptOriginal,
          spacing: { after: 300 }
        }),
        
        // Prompt Otimizado (se existir)
        ...(prompt.promptOtimizado ? [
          new Paragraph({
            text: "Prompt Otimizado:",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          }),
          
          new Paragraph({
            text: prompt.promptOtimizado,
            spacing: { after: 300 }
          })
        ] : []),
        
        // Rodapé
        new Paragraph({
          children: [
            new TextRun({
              text: `© ${new Date().getFullYear()} PromptJur - Sistema de Engenharia de Prompts Jurídicos`,
              size: 16,
              color: "999999",
              italics: true
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 }
        })
      ]
    }]
  });
  
  // Gerar e salvar
  const blob = await Packer.toBlob(doc);
  const filename = `promptjur-${prompt.id}-${Date.now()}.docx`;
  saveAs(blob, filename);
}
