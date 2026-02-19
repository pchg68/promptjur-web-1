/**
 * Gerador de Documentos DOCX com Formatação ABNT
 * 
 * Gera arquivos Word (.docx) com formatação completa segundo normas ABNT:
 * - Fonte: Arial 12pt
 * - Espaçamento entre linhas: 1.5
 * - Margens: 3cm (superior/esquerda), 2cm (inferior/direita)
 * - Tabulação de parágrafos: 2cm (1417 twips)
 * - Espaçamento entre parágrafos: 1.5cm (425 twips)
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  convertInchesToTwip,
} from 'docx';

export interface CabecalhoInfo {
  nomeEscritorio?: string;
  numeroOAB?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
}

export interface DocxOptions {
  titulo: string;
  conteudo: string;
  cabecalho?: CabecalhoInfo;
  incluirDataHora?: boolean;
  removerPersonaContexto?: boolean;
}

/**
 * Remove seções de "persona e contexto" do texto
 */
function removerPersonaContexto(texto: string): string {
  // Remove seções comuns de persona/contexto
  const patterns = [
    /\*\*Persona:\*\*[\s\S]*?(?=\n\n|\*\*|$)/gi,
    /\*\*Contexto:\*\*[\s\S]*?(?=\n\n|\*\*|$)/gi,
    /\[Persona:[\s\S]*?\]/gi,
    /\[Contexto:[\s\S]*?\]/gi,
    /Você é um[\s\S]*?(?=\n\n|$)/gi,
  ];

  let resultado = texto;
  patterns.forEach(pattern => {
    resultado = resultado.replace(pattern, '');
  });

  // Remove linhas vazias consecutivas
  resultado = resultado.replace(/\n{3,}/g, '\n\n');
  
  return resultado.trim();
}

/**
 * Processa texto markdown/plain para parágrafos DOCX
 */
function processarTextoParaParagrafos(texto: string): Paragraph[] {
  const paragrafos: Paragraph[] = [];
  const linhas = texto.split('\n');

  let paragrafoAtual: string[] = [];

  for (const linha of linhas) {
    const linhaTrim = linha.trim();

    // Linha vazia = fim de parágrafo
    if (!linhaTrim) {
      if (paragrafoAtual.length > 0) {
        paragrafos.push(criarParagrafoABNT(paragrafoAtual.join(' ')));
        paragrafoAtual = [];
      }
      continue;
    }

    // Título (# ou ##)
    if (linhaTrim.startsWith('# ')) {
      if (paragrafoAtual.length > 0) {
        paragrafos.push(criarParagrafoABNT(paragrafoAtual.join(' ')));
        paragrafoAtual = [];
      }
      paragrafos.push(criarTituloABNT(linhaTrim.substring(2), HeadingLevel.HEADING_1));
      continue;
    }

    if (linhaTrim.startsWith('## ')) {
      if (paragrafoAtual.length > 0) {
        paragrafos.push(criarParagrafoABNT(paragrafoAtual.join(' ')));
        paragrafoAtual = [];
      }
      paragrafos.push(criarTituloABNT(linhaTrim.substring(3), HeadingLevel.HEADING_2));
      continue;
    }

    // Lista (- ou *)
    if (linhaTrim.startsWith('- ') || linhaTrim.startsWith('* ')) {
      if (paragrafoAtual.length > 0) {
        paragrafos.push(criarParagrafoABNT(paragrafoAtual.join(' ')));
        paragrafoAtual = [];
      }
      paragrafos.push(criarItemListaABNT(linhaTrim.substring(2)));
      continue;
    }

    // Linha normal - adiciona ao parágrafo atual
    paragrafoAtual.push(linhaTrim);
  }

  // Adiciona último parágrafo se houver
  if (paragrafoAtual.length > 0) {
    paragrafos.push(criarParagrafoABNT(paragrafoAtual.join(' ')));
  }

  return paragrafos;
}

/**
 * Cria parágrafo com formatação ABNT
 */
function criarParagrafoABNT(texto: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: texto,
        font: 'Arial',
        size: 24, // 12pt = 24 half-points
      }),
    ],
    spacing: {
      line: 360, // 1.5 line spacing (240 = single, 360 = 1.5, 480 = double)
      after: 425, // 1.5cm após parágrafo (aprox. 425 twips)
    },
    indent: {
      firstLine: convertInchesToTwip(0.79), // 2cm = ~0.79 inches
    },
    alignment: AlignmentType.JUSTIFIED,
  });
}

/**
 * Cria título com formatação ABNT
 */
function criarTituloABNT(texto: string, nivel: typeof HeadingLevel[keyof typeof HeadingLevel]): Paragraph {
  return new Paragraph({
    text: texto,
    heading: nivel,
    spacing: {
      before: 425, // 1.5cm antes
      after: 425, // 1.5cm depois
    },
    alignment: AlignmentType.LEFT,
    style: 'Heading1',
  });
}

/**
 * Cria item de lista com formatação ABNT
 */
function criarItemListaABNT(texto: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `• ${texto}`,
        font: 'Arial',
        size: 24,
      }),
    ],
    spacing: {
      line: 360,
      after: 200, // Menor espaçamento entre itens
    },
    indent: {
      left: convertInchesToTwip(0.39), // 1cm
    },
    alignment: AlignmentType.JUSTIFIED,
  });
}

/**
 * Cria cabeçalho do documento
 */
function criarCabecalho(cabecalho: CabecalhoInfo): Paragraph[] {
  const paragrafos: Paragraph[] = [];

  if (cabecalho.nomeEscritorio) {
    paragrafos.push(
      new Paragraph({
        children: [
          new TextRun({
            text: cabecalho.nomeEscritorio,
            font: 'Arial',
            size: 28, // 14pt
            bold: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
      })
    );
  }

  const infoLinhas: string[] = [];
  if (cabecalho.numeroOAB) infoLinhas.push(`OAB: ${cabecalho.numeroOAB}`);
  if (cabecalho.endereco) infoLinhas.push(cabecalho.endereco);
  if (cabecalho.telefone) infoLinhas.push(`Tel: ${cabecalho.telefone}`);
  if (cabecalho.email) infoLinhas.push(`Email: ${cabecalho.email}`);

  if (infoLinhas.length > 0) {
    paragrafos.push(
      new Paragraph({
        children: [
          new TextRun({
            text: infoLinhas.join(' | '),
            font: 'Arial',
            size: 20, // 10pt
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 425 }, // 1.5cm
      })
    );
  }

  return paragrafos;
}

/**
 * Gera documento DOCX com formatação ABNT
 */
export async function generateDocxABNT(options: DocxOptions): Promise<Buffer> {
  const {
    titulo,
    conteudo,
    cabecalho,
    incluirDataHora = true,
    removerPersonaContexto: removerPersona = true,
  } = options;

  // Processa conteúdo
  let textoFinal = conteudo;
  if (removerPersona) {
    textoFinal = removerPersonaContexto(textoFinal);
  }

  // Cria seções do documento
  const secoes: Paragraph[] = [];

  // 1. Cabeçalho (se fornecido)
  if (cabecalho) {
    secoes.push(...criarCabecalho(cabecalho));
  }

  // 2. Título do documento
  secoes.push(
    new Paragraph({
      children: [
        new TextRun({
          text: titulo,
          font: 'Arial',
          size: 32, // 16pt
          bold: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: {
        before: 425,
        after: 425,
      },
    })
  );

  // 3. Data/hora (opcional)
  if (incluirDataHora) {
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const horaFormatada = agora.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    secoes.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Gerado em ${dataFormatada} às ${horaFormatada}`,
            font: 'Arial',
            size: 20, // 10pt
            italics: true,
          }),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 425 },
      })
    );
  }

  // 4. Conteúdo processado
  secoes.push(...processarTextoParaParagrafos(textoFinal));

  // Cria documento com margens ABNT
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1.18), // 3cm
              right: convertInchesToTwip(0.79), // 2cm
              bottom: convertInchesToTwip(0.79), // 2cm
              left: convertInchesToTwip(1.18), // 3cm
            },
          },
        },
        children: secoes,
      },
    ],
    styles: {
      default: {
        document: {
          run: {
            font: 'Arial',
            size: 24, // 12pt
          },
          paragraph: {
            spacing: {
              line: 360, // 1.5
            },
          },
        },
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          run: {
            font: 'Arial',
            size: 28, // 14pt
            bold: true,
          },
          paragraph: {
            spacing: {
              before: 425,
              after: 425,
            },
          },
        },
      ],
    },
  });

  // Gera buffer
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

/**
 * Gera nome de arquivo sanitizado
 */
export function gerarNomeArquivo(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hífen
    .replace(/^-+|-+$/g, '') // Remove hífens no início/fim
    .substring(0, 50) // Limita tamanho
    + '.docx';
}
