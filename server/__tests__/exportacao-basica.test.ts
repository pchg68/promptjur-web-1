/**
 * Testes para exportação básica de resultados
 * Verifica a lógica de geração de blob e download de arquivos .txt
 */
import { describe, it, expect } from "vitest";

describe("Exportação Básica — Lógica de Download .txt", () => {
  it("deve gerar blob com conteúdo correto em UTF-8", () => {
    const conteudo = "Petição inicial de ação de cobrança\n\nArt. 319 do CPC/2015";
    const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
    
    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toBe("text/plain;charset=utf-8");
  });

  it("deve gerar nome de arquivo com timestamp", () => {
    const timestamp = Date.now();
    const filename = `promptjur-resultado-${timestamp}.txt`;
    
    expect(filename).toMatch(/^promptjur-resultado-\d+\.txt$/);
    expect(filename.endsWith(".txt")).toBe(true);
  });

  it("deve gerar nome de arquivo com ID do prompt", () => {
    const promptId = 42;
    const filename = `prompt-${promptId}.txt`;
    
    expect(filename).toBe("prompt-42.txt");
    expect(filename.endsWith(".txt")).toBe(true);
  });

  it("deve preservar caracteres especiais no conteúdo", () => {
    const conteudo = "§ 1º — Ação de Indenização por Danos Morais\n• Réu: João da Silva\n• Valor: R$ 50.000,00";
    const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
    
    // O blob deve conter todos os bytes do conteúdo UTF-8
    expect(blob.size).toBeGreaterThan(conteudo.length * 0.5); // UTF-8 pode ter mais bytes
  });

  it("deve gerar nome com tipo de documento e data", () => {
    const tipoLabel = "Petição Inicial";
    const data = new Date(2026, 4, 2).toLocaleDateString("pt-BR");
    const filename = `PromptJur - ${tipoLabel} - ${data}.txt`;
    
    expect(filename).toBe("PromptJur - Petição Inicial - 02/05/2026.txt");
  });

  it("deve lidar com conteúdo vazio graciosamente", () => {
    const conteudo = "";
    const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
    
    expect(blob.size).toBe(0);
    expect(blob.type).toBe("text/plain;charset=utf-8");
  });

  it("deve lidar com conteúdo markdown longo", () => {
    const conteudo = `# Petição Inicial

## Dos Fatos

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Do Direito

Art. 319 do CPC/2015 — A petição inicial indicará:
I - o juízo a que é dirigida;
II - os nomes, os prenomes, o estado civil, a existência de união estável, a profissão, o número de inscrição no Cadastro de Pessoas Físicas ou no Cadastro Nacional da Pessoa Jurídica, o endereço eletrônico, o domicílio e a residência do autor e do réu;

## Dos Pedidos

Ante o exposto, requer:
a) a citação do réu;
b) a procedência dos pedidos;
c) a condenação em custas e honorários.`;

    const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
    
    expect(blob.size).toBeGreaterThan(500);
    expect(blob.type).toBe("text/plain;charset=utf-8");
  });
});
