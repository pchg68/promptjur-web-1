import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from "docx";

interface GerarDocumentoParams {
  titulo: string;
  conteudo: string;
  area?: string;
  tipo?: string;
  data?: Date;
}

/**
 * Gera um documento DOCX formatado profissionalmente a partir de um prompt
 */
export async function gerarDocumentoWord(params: GerarDocumentoParams): Promise<Buffer> {
  const { titulo, conteudo, area, tipo, data = new Date() } = params;

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Cabeçalho
          new Paragraph({
            text: "PromptJur - Sistema de Engenharia de Prompts Jurídicos",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 200,
            },
          }),

          // Título do documento
          new Paragraph({
            text: titulo,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: {
              before: 200,
              after: 400,
            },
          }),

          // Metadados
          ...(area || tipo
            ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Informações do Documento",
                      bold: true,
                      size: 24,
                    }),
                  ],
                  spacing: {
                    before: 200,
                    after: 100,
                  },
                }),
                ...(tipo
                  ? [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Tipo: ", bold: true }),
                          new TextRun(tipo),
                        ],
                      }),
                    ]
                  : []),
                ...(area
                  ? [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Área Jurídica: ", bold: true }),
                          new TextRun(area),
                        ],
                      }),
                    ]
                  : []),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Data de Geração: ", bold: true }),
                    new TextRun(data.toLocaleDateString("pt-BR")),
                  ],
                  spacing: {
                    after: 300,
                  },
                }),
              ]
            : []),

          // Separador
          new Paragraph({
            border: {
              bottom: {
                color: "auto",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 6,
              },
            },
            spacing: {
              after: 300,
            },
          }),

          // Conteúdo principal
          new Paragraph({
            children: [
              new TextRun({
                text: "Prompt Profissional Gerado",
                bold: true,
                size: 24,
              }),
            ],
            spacing: {
              before: 200,
              after: 200,
            },
          }),

          // Processar conteúdo (quebrar por parágrafos)
          ...conteudo.split("\n\n").map(
            (paragrafo) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: paragrafo.trim(),
                    size: 22,
                  }),
                ],
                spacing: {
                  after: 150,
                },
                alignment: AlignmentType.JUSTIFIED,
              })
          ),

          // Rodapé
          new Paragraph({
            border: {
              top: {
                color: "auto",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 6,
              },
            },
            spacing: {
              before: 400,
              after: 200,
            },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Documento gerado automaticamente pelo PromptJur",
                italics: true,
                size: 18,
                color: "666666",
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `${data.toLocaleDateString("pt-BR")} às ${data.toLocaleTimeString("pt-BR")}`,
                italics: true,
                size: 18,
                color: "666666",
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
