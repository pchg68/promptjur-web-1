/**
 * Módulo de extração de texto de arquivos PDF e DOCX
 * Usa utilitários do sistema para processar arquivos
 */

import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";

const execAsync = promisify(exec);

/**
 * Extrai texto de um buffer de arquivo PDF ou DOCX
 * @param fileBuffer Buffer do arquivo
 * @param mimeType Tipo MIME do arquivo
 * @returns Texto extraído
 */
export async function extractTextFromFile(
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  // Criar arquivo temporário
  const tempId = randomBytes(16).toString("hex");
  const extension = mimeType.includes("pdf") ? "pdf" : "docx";
  const tempPath = join("/tmp", `petition_${tempId}.${extension}`);

  try {
    // Salvar buffer em arquivo temporário
    await writeFile(tempPath, fileBuffer);

    let text = "";

    if (mimeType === "application/pdf") {
      // Extrair texto de PDF usando pdftotext (poppler-utils já instalado)
      const { stdout } = await execAsync(`pdftotext "${tempPath}" -`);
      text = stdout;
    } else if (
      mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // Extrair texto de DOCX usando pandoc ou unzip + grep
      try {
        // Tentar com pandoc primeiro (mais confiável)
        const { stdout } = await execAsync(
          `pandoc "${tempPath}" -t plain --wrap=none`
        );
        text = stdout;
      } catch {
        // Fallback: extrair XML do DOCX e processar
        const { stdout } = await execAsync(
          `unzip -p "${tempPath}" word/document.xml | grep -oP '(?<=<w:t>)[^<]+' || echo ""`
        );
        text = stdout;
      }
    } else {
      throw new Error(`Tipo de arquivo não suportado: ${mimeType}`);
    }

    // Limpar texto extraído
    return cleanExtractedText(text);
  } finally {
    // Remover arquivo temporário
    try {
      await unlink(tempPath);
    } catch {
      // Ignorar erro se arquivo não existir
    }
  }
}

/**
 * Limpa texto extraído removendo caracteres especiais e espaços extras
 */
function cleanExtractedText(text: string): string {
  return (
    text
      // Remover caracteres de controle
      .replace(/[\x00-\x1F\x7F]/g, " ")
      // Normalizar espaços em branco
      .replace(/\s+/g, " ")
      // Remover espaços no início e fim
      .trim()
      // Limitar tamanho (100KB de texto)
      .substring(0, 100000)
  );
}

/**
 * Valida se o arquivo é um PDF ou DOCX válido
 */
export function isValidPetitionFile(mimeType: string, fileSize: number): {
  valid: boolean;
  error?: string;
} {
  // Validar tipo MIME
  const validMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!validMimeTypes.includes(mimeType)) {
    return {
      valid: false,
      error: "Tipo de arquivo inválido. Envie apenas PDF ou DOCX.",
    };
  }

  // Validar tamanho (máximo 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (fileSize > maxSize) {
    return {
      valid: false,
      error: "Arquivo muito grande. Tamanho máximo: 10MB.",
    };
  }

  return { valid: true };
}
