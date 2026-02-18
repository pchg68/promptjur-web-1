/**
 * Utilitários para formatação ABNT de documentos jurídicos
 */

/**
 * Converte Markdown para HTML com formatação ABNT preservada
 * @param markdown - Texto em formato Markdown
 * @returns HTML formatado com estilos ABNT inline
 */
export function markdownToABNTHtml(markdown: string): string {
  let html = markdown;

  // Converter títulos (# Título -> <h1>Título</h1>)
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Converter negrito (**texto** -> <strong>texto</strong>)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Converter itálico (*texto* -> <em>texto</em>)
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Converter listas não ordenadas
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
  // Agrupar <li> consecutivos em <ul>
  html = html.replace(/(<li>.*?<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

  // Converter listas ordenadas
  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');

  // Converter quebras de linha duplas em parágrafos
  const paragraphs = html.split('\n\n');
  html = paragraphs
    .map(p => {
      // Não envolver títulos e listas em <p>
      if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<ol') || p.startsWith('<li')) {
        return p;
      }
      // Remover quebras de linha simples dentro de parágrafos
      const cleanP = p.replace(/\n/g, ' ').trim();
      return cleanP ? `<p>${cleanP}</p>` : '';
    })
    .filter(p => p)
    .join('\n');

  return html;
}

/**
 * Cria HTML completo com estilos ABNT inline para cópia formatada
 * @param content - Conteúdo em Markdown
 * @returns HTML completo com estilos inline
 */
export function createFormattedABNTHtml(content: string): string {
  const bodyHtml = markdownToABNTHtml(content);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.5;
      text-align: justify;
      color: #000;
      margin: 0;
      padding: 0;
    }
    p {
      margin-bottom: 1.5cm;
      text-indent: 2cm;
    }
    h1, h2, h3, h4, h5, h6 {
      font-weight: bold;
      text-indent: 0;
      margin-top: 1.5cm;
      margin-bottom: 1cm;
    }
    h1 {
      font-size: 14pt;
      text-transform: uppercase;
    }
    h2 {
      font-size: 13pt;
    }
    h3 {
      font-size: 12pt;
    }
    h1 + p, h2 + p, h3 + p, h4 + p, h5 + p, h6 + p {
      text-indent: 0;
    }
    ul, ol {
      margin-bottom: 1.5cm;
      padding-left: 2cm;
    }
    li {
      margin-bottom: 0.5cm;
    }
    blockquote {
      margin-left: 4cm;
      margin-right: 0;
      font-size: 11pt;
      margin-bottom: 1.5cm;
    }
    strong, b {
      font-weight: bold;
    }
    em, i {
      font-style: italic;
    }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>
  `.trim();
}

/**
 * Copia HTML formatado para o clipboard (rich text)
 * @param content - Conteúdo em Markdown
 * @returns Promise que resolve quando a cópia é concluída
 */
export async function copyFormattedToClipboard(content: string): Promise<void> {
  const html = createFormattedABNTHtml(content);
  
  // Criar Blob com HTML
  const htmlBlob = new Blob([html], { type: 'text/html' });
  
  // Criar Blob com texto puro como fallback
  const textBlob = new Blob([content], { type: 'text/plain' });
  
  // Criar ClipboardItem com ambos os formatos
  const clipboardItem = new ClipboardItem({
    'text/html': htmlBlob,
    'text/plain': textBlob,
  });
  
  // Copiar para clipboard
  await navigator.clipboard.write([clipboardItem]);
}
