import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

interface ExportDOCXOptions {
  titulo: string;
  conteudo: string;
  areaJuridica?: string;
  tipoDocumento?: string;
  data?: Date;
}

/**
 * Exporta texto em formato .DOCX com formatação ABNT
 * - Fonte: Arial 12pt
 * - Espaçamento: 1.0 (simples)
 * - Margens: 3cm superior/laterais, 2cm inferior
 * - Alinhamento: Justificado
 */
export async function exportAsDOCXABNT(options: ExportDOCXOptions) {
  const { titulo, conteudo, areaJuridica, tipoDocumento, data = new Date() } = options;

  // Criar parágrafos do documento
  const paragraphs: Paragraph[] = [];

  // Título principal
  paragraphs.push(
    new Paragraph({
      text: titulo,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 400,
      },
      children: [
        new TextRun({
          text: titulo,
          bold: true,
          size: 28, // 14pt
          font: 'Arial',
        }),
      ],
    })
  );

  // Metadados (se fornecidos)
  if (areaJuridica || tipoDocumento) {
    const metadataText: string[] = [];
    if (areaJuridica) metadataText.push(`Área Jurídica: ${areaJuridica}`);
    if (tipoDocumento) metadataText.push(`Tipo: ${tipoDocumento}`);
    metadataText.push(`Data: ${data.toLocaleDateString('pt-BR')}`);

    paragraphs.push(
      new Paragraph({
        text: metadataText.join(' | '),
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 400,
        },
        children: [
          new TextRun({
            text: metadataText.join(' | '),
            size: 20, // 10pt
            font: 'Arial',
            italics: true,
          }),
        ],
      })
    );
  }

  // Dividir conteúdo em parágrafos
  const paragrafos = conteudo.split('\n\n').filter(p => p.trim());

  paragrafos.forEach((paragrafo) => {
    paragraphs.push(
      new Paragraph({
        text: paragrafo.trim(),
        alignment: AlignmentType.JUSTIFIED,
        spacing: {
          line: 240, // Espaçamento 1.0 (simples)
          after: 200,
        },
        children: [
          new TextRun({
            text: paragrafo.trim(),
            size: 24, // 12pt
            font: 'Arial',
          }),
        ],
      })
    );
  });

  // Criar documento
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1701, // 3cm
              right: 1701, // 3cm
              bottom: 1134, // 2cm
              left: 1701, // 3cm
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  // Gerar blob e fazer download
  const blob = await Packer.toBlob(doc);
  const nomeArquivo = `${titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`;
  saveAs(blob, nomeArquivo);
}
