/**
 * Gerador de Documentos PDF com Formatação ABNT
 * 
 * Gera arquivos PDF com formatação completa segundo normas ABNT:
 * - Fonte: Arial 12pt
 * - Espaçamento entre linhas: 1.5
 * - Margens: 3cm (superior/esquerda), 2cm (inferior/direita)
 * - Tabulação de parágrafos: 2cm
 * - Espaçamento entre parágrafos: 1.5cm
 */

import PDFDocument from 'pdfkit';

export interface CabecalhoInfo {
  nomeEscritorio?: string;
  numeroOAB?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
}

export interface PdfOptions {
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
 * Converte texto markdown simples para texto limpo
 */
function limparMarkdown(texto: string): string {
  return texto
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1') // Bold + Italic
    .replace(/\*\*(.+?)\*\*/g, '$1')     // Bold
    .replace(/\*(.+?)\*/g, '$1')         // Italic
    .replace(/~~(.+?)~~/g, '$1')         // Strikethrough
    .replace(/`(.+?)`/g, '$1')           // Code inline
    .replace(/^#+\s+/gm, '')             // Headers
    .replace(/^\s*[-*+]\s+/gm, '• ')     // Lista não ordenada
    .replace(/^\s*\d+\.\s+/gm, '')       // Lista ordenada
    .trim();
}

/**
 * Gera documento PDF com formatação ABNT
 */
export async function generatePdfABNT(options: PdfOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Criar documento PDF com margens ABNT
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 85.04,    // 3cm
          bottom: 56.69, // 2cm
          left: 85.04,   // 3cm
          right: 56.69   // 2cm
        },
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Processar conteúdo
      let conteudoFinal = options.conteudo;
      if (options.removerPersonaContexto) {
        conteudoFinal = removerPersonaContexto(conteudoFinal);
      }

      // Adicionar cabeçalho se fornecido
      if (options.cabecalho) {
        doc.fontSize(10);
        if (options.cabecalho.nomeEscritorio) {
          doc.font('Helvetica-Bold').text(options.cabecalho.nomeEscritorio, { align: 'center' });
        }
        if (options.cabecalho.numeroOAB) {
          doc.font('Helvetica').text(`OAB: ${options.cabecalho.numeroOAB}`, { align: 'center' });
        }
        if (options.cabecalho.endereco) {
          doc.text(options.cabecalho.endereco, { align: 'center' });
        }
        if (options.cabecalho.telefone) {
          doc.text(`Tel: ${options.cabecalho.telefone}`, { align: 'center' });
        }
        if (options.cabecalho.email) {
          doc.text(`Email: ${options.cabecalho.email}`, { align: 'center' });
        }
        doc.moveDown(1.5);
      }

      // Adicionar data/hora se solicitado
      if (options.incluirDataHora) {
        const dataHora = new Date().toLocaleString('pt-BR', {
          dateStyle: 'long',
          timeStyle: 'short',
        });
        doc.fontSize(9).font('Helvetica').text(`Gerado em: ${dataHora}`, { align: 'right' });
        doc.moveDown(1);
      }

      // Adicionar título
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .text(options.titulo, { align: 'center' });
      doc.moveDown(1.5);

      // Processar conteúdo linha por linha
      const linhas = conteudoFinal.split('\n');
      let emLista = false;

      for (const linha of linhas) {
        const linhaTrim = linha.trim();

        // Linha vazia
        if (!linhaTrim) {
          doc.moveDown(0.75);
          emLista = false;
          continue;
        }

        // Título principal (# )
        if (linhaTrim.startsWith('# ')) {
          if (emLista) doc.moveDown(0.5);
          doc.fontSize(14)
            .font('Helvetica-Bold')
            .text(limparMarkdown(linhaTrim.substring(2)), { align: 'left' });
          doc.moveDown(0.75);
          emLista = false;
          continue;
        }

        // Subtítulo (## )
        if (linhaTrim.startsWith('## ')) {
          if (emLista) doc.moveDown(0.5);
          doc.fontSize(13)
            .font('Helvetica-Bold')
            .text(limparMarkdown(linhaTrim.substring(3)), { align: 'left' });
          doc.moveDown(0.5);
          emLista = false;
          continue;
        }

        // Subtítulo menor (### )
        if (linhaTrim.startsWith('### ')) {
          if (emLista) doc.moveDown(0.5);
          doc.fontSize(12)
            .font('Helvetica-Bold')
            .text(limparMarkdown(linhaTrim.substring(4)), { align: 'left' });
          doc.moveDown(0.5);
          emLista = false;
          continue;
        }

        // Lista com marcador (- ou * ou •)
        if (/^[-*•]\s+/.test(linhaTrim)) {
          const textoLista = limparMarkdown(linhaTrim.replace(/^[-*•]\s+/, ''));
          doc.fontSize(12)
            .font('Helvetica')
            .text(`• ${textoLista}`, {
              indent: 20,
              lineGap: 4,
              align: 'justify'
            });
          emLista = true;
          continue;
        }

        // Lista numerada (1. 2. etc)
        const matchNumero = linhaTrim.match(/^(\d+)\.\s+(.+)/);
        if (matchNumero) {
          const [, numero, textoLista] = matchNumero;
          doc.fontSize(12)
            .font('Helvetica')
            .text(`${numero}. ${limparMarkdown(textoLista)}`, {
              indent: 20,
              lineGap: 4,
              align: 'justify'
            });
          emLista = true;
          continue;
        }

        // Texto normal (parágrafo)
        if (emLista) doc.moveDown(0.5);
        
        const textoLimpo = limparMarkdown(linhaTrim);
        doc.fontSize(12)
          .font('Helvetica')
          .text(textoLimpo, {
            indent: 56.69, // 2cm de tabulação
            lineGap: 6,    // Espaçamento 1.5
            align: 'justify'
          });
        
        emLista = false;
      }

      // Finalizar documento
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Gera nome de arquivo baseado no título
 */
export function gerarNomeArquivoPdf(titulo: string): string {
  const tituloLimpo = titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '')    // Remove caracteres especiais
    .replace(/\s+/g, '-')            // Espaços → hífens
    .substring(0, 50);               // Limita tamanho
  
  const timestamp = Date.now();
  return `${tituloLimpo}-${timestamp}.pdf`;
}
