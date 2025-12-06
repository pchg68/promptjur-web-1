import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PromptExportData {
  id: number;
  tipo: 'analise' | 'geracao' | 'otimizacao';
  areaJuridica?: string;
  qualidade?: string;
  promptOriginal?: string;
  promptOtimizado?: string;
  analise?: string;
  citacoesValidadas?: any[];
  createdAt: Date;
  userId: number;
}

export function exportPromptToPDF(data: PromptExportData): Buffer {
  const doc = new jsPDF();
  
  // Título
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PromptJur - Exportação de Prompt', 105, 20, { align: 'center' });
  
  // Linha separadora
  doc.setLineWidth(0.5);
  doc.line(20, 25, 190, 25);
  
  // Metadados
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Metadados', 20, 35);
  
  const metadados = [
    ['ID', `#${data.id}`],
    ['Tipo', getTipoLabel(data.tipo)],
    ['Área Jurídica', data.areaJuridica || 'Não especificada'],
    ['Qualidade', data.qualidade ? getQualidadeLabel(data.qualidade) : 'Não avaliada'],
    ['Data de Criação', new Date(data.createdAt).toLocaleString('pt-BR')],
  ];
  
  autoTable(doc, {
    startY: 40,
    head: [],
    body: metadados,
    theme: 'grid',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 'auto' }
    }
  });
  
  let currentY = (doc as any).lastAutoTable.finalY + 10;
  
  // Prompt Original (se existir)
  if (data.promptOriginal) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Prompt Original', 20, currentY);
    currentY += 5;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const promptLines = doc.splitTextToSize(data.promptOriginal, 170);
    doc.text(promptLines, 20, currentY);
    currentY += (promptLines.length * 5) + 10;
  }
  
  // Prompt Otimizado (se existir)
  if (data.promptOtimizado) {
    // Nova página se necessário
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Prompt Otimizado/Gerado', 20, currentY);
    currentY += 5;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const promptLines = doc.splitTextToSize(data.promptOtimizado, 170);
    doc.text(promptLines, 20, currentY);
    currentY += (promptLines.length * 5) + 10;
  }
  
  // Análise (se existir)
  if (data.analise) {
    // Nova página se necessário
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Análise', 20, currentY);
    currentY += 5;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const analiseLines = doc.splitTextToSize(data.analise, 170);
    doc.text(analiseLines, 20, currentY);
    currentY += (analiseLines.length * 5) + 10;
  }
  
  // Citações Validadas (se existirem)
  if (data.citacoesValidadas && data.citacoesValidadas.length > 0) {
    // Nova página se necessário
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Citações Legais Validadas', 20, currentY);
    currentY += 5;
    
    const citacoesTable = data.citacoesValidadas.map(cit => [
      cit.citacao || cit.texto,
      cit.confiabilidade || 'N/A',
      cit.fonte || 'N/A'
    ]);
    
    autoTable(doc, {
      startY: currentY,
      head: [['Citação', 'Confiabilidade', 'Fonte']],
      body: citacoesTable,
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] }
    });
  }
  
  // Rodapé
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(
      `Página ${i} de ${pageCount} - Gerado por PromptJur em ${new Date().toLocaleString('pt-BR')}`,
      105,
      290,
      { align: 'center' }
    );
  }
  
  return Buffer.from(doc.output('arraybuffer'));
}

function getTipoLabel(tipo: string): string {
  switch (tipo) {
    case 'analise': return 'Análise de Prompt';
    case 'geracao': return 'Geração de Prompt';
    case 'otimizacao': return 'Otimização de Prompt';
    default: return tipo;
  }
}

function getQualidadeLabel(qualidade: string): string {
  switch (qualidade) {
    case 'excelente': return 'Excelente ⭐⭐⭐';
    case 'bom': return 'Bom ⭐⭐';
    case 'ruim': return 'Ruim ⭐';
    default: return qualidade;
  }
}
