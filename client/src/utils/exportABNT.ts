/**
 * Exporta texto em formato .txt com formatação ABNT
 * Arial 12, espaçamento 1.0
 */
export function exportAsTextABNT(title: string, content: string) {
  // Criar conteúdo do arquivo de texto
  const textContent = `${title.toUpperCase()}

Data: ${new Date().toLocaleString('pt-BR')}

${content}

---
Formatação: Arial 12pt, Espaçamento 1.0 (ABNT)
Gerado por PromptJur - Sistema de Engenharia de Prompts Jurídicos
`;

  // Criar blob e download
  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  return true;
}
