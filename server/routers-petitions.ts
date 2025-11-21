import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import {
  createUserPetition,
  getUserPetitions,
  getPetitionById,
  deletePetition,
  updatePetition,
  getUserStyleProfile,
  updateUserStyleProfile,
  getUnanalyzedPetitions,
  markPetitionAsAnalyzed,
  incrementPeticoesAnalisadas,
} from "./db-petitions";
import { storagePut } from "./storage";
import { extractTextFromFile, isValidPetitionFile } from "./text-extraction";
import { invokeLLM } from "./_core/llm";

/**
 * Router para gerenciamento de petições pessoais e análise de estilo
 */
export const petitionsRouter = router({
  /**
   * Upload de petição pessoal (PDF ou DOCX)
   */
  upload: protectedProcedure
    .input(
      z.object({
        titulo: z.string().min(1).max(255),
        tipoDocumento: z.string().min(1).max(100),
        areaJuridica: z.string().max(100).optional(),
        fileName: z.string().min(1).max(255),
        fileBase64: z.string(), // Arquivo em base64
        mimeType: z.enum([
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Decodificar base64
      const fileBuffer = Buffer.from(input.fileBase64, "base64");
      const fileSize = fileBuffer.length;

      // Validar arquivo
      const validation = isValidPetitionFile(input.mimeType, fileSize);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Extrair texto do arquivo
      let textoExtraido = "";
      try {
        textoExtraido = await extractTextFromFile(fileBuffer, input.mimeType);
      } catch (error) {
        console.error("Erro ao extrair texto:", error);
        throw new Error(
          "Não foi possível extrair o texto do arquivo. Verifique se o arquivo não está corrompido."
        );
      }

      // Upload para S3
      const fileKey = `petitions/${ctx.user.id}/${Date.now()}-${input.fileName}`;
      const { url: fileUrl } = await storagePut(
        fileKey,
        fileBuffer,
        input.mimeType
      );

      // Salvar no banco
      const petitionId = await createUserPetition({
        userId: ctx.user.id,
        titulo: input.titulo,
        tipoDocumento: input.tipoDocumento,
        areaJuridica: input.areaJuridica || null,
        fileUrl,
        fileKey,
        fileName: input.fileName,
        fileSize,
        mimeType: input.mimeType,
        textoExtraido,
        analisado: false,
      });

      return {
        id: petitionId,
        fileUrl,
        textoExtraido: textoExtraido.substring(0, 500) + "...", // Preview
      };
    }),

  /**
   * Listar petições do usuário
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const petitions = await getUserPetitions(ctx.user.id);
    return petitions.map((p) => ({
      ...p,
      // Não retornar texto completo na listagem
      textoExtraido: p.textoExtraido
        ? p.textoExtraido.substring(0, 200) + "..."
        : null,
    }));
  }),

  /**
   * Obter detalhes de uma petição
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const petition = await getPetitionById(input.id, ctx.user.id);
      if (!petition) {
        throw new Error("Petição não encontrada");
      }
      return petition;
    }),

  /**
   * Deletar petição
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Deletar arquivo do S3 também (usar storageDelete quando implementado)
      const success = await deletePetition(input.id, ctx.user.id);
      if (!success) {
        throw new Error("Petição não encontrada ou sem permissão");
      }
      return { success: true };
    }),
});

/**
 * Router para análise de estilo e perfil do usuário
 */
export const styleRouter = router({
  /**
   * Analisar estilo de escrita baseado nas petições enviadas
   */
  analyze: protectedProcedure.mutation(async ({ ctx }) => {
    // Buscar petições não analisadas
    const unanalyzedPetitions = await getUnanalyzedPetitions(ctx.user.id);

    if (unanalyzedPetitions.length === 0) {
      throw new Error(
        "Nenhuma petição nova para analisar. Envie pelo menos uma petição primeiro."
      );
    }

    // Buscar perfil existente
    const existingProfile = await getUserStyleProfile(ctx.user.id);

    // Preparar textos para análise (limitar a 3 petições mais recentes)
    const textsToAnalyze = unanalyzedPetitions
      .slice(0, 3)
      .map((p) => p.textoExtraido)
      .filter((t): t is string => !!t);

    if (textsToAnalyze.length === 0) {
      throw new Error(
        "Não foi possível extrair texto das petições. Verifique os arquivos."
      );
    }

    // Analisar estilo com LLM
    const analysisPrompt = `Você é um especialista em análise de estilo de escrita jurídica. Analise as seguintes petições e extraia o perfil de estilo do autor:

${textsToAnalyze.map((text, i) => `\n=== PETIÇÃO ${i + 1} ===\n${text.substring(0, 5000)}\n`).join("\n")}

Retorne APENAS um JSON válido (sem markdown, sem explicações) com a seguinte estrutura:
{
  "estruturaArgumentativa": "string descrevendo como organiza fatos → direito → pedidos",
  "padraoOrganizacao": "string descrevendo uso de tópicos, numeração, parágrafos",
  "tomEscrita": "formal clássico | persuasivo moderno | técnico objetivo",
  "nivelFormalidade": "alto | médio | moderado",
  "tipoFundamentacao": "jurisprudencial | doutrinária | legalista | mista",
  "preferenciaCitacoes": "string descrevendo como cita (ementas completas, trechos, etc)",
  "expressoesRecorrentes": ["array", "de", "expressões", "favoritas"],
  "vocabularioPreferido": {"palavra_comum": "palavra_preferida"},
  "estiloPedidos": "string descrevendo como formula pedidos",
  "trechosExemplo": [{"tipo": "fundamentação", "trecho": "exemplo real", "fonte": "petição 1"}]
}`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "Você é um analisador de estilo jurídico. Retorne APENAS JSON válido, sem markdown.",
        },
        { role: "user", content: analysisPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "style_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              estruturaArgumentativa: { type: "string" },
              padraoOrganizacao: { type: "string" },
              tomEscrita: { type: "string" },
              nivelFormalidade: { type: "string" },
              tipoFundamentacao: { type: "string" },
              preferenciaCitacoes: { type: "string" },
              expressoesRecorrentes: {
                type: "array",
                items: { type: "string" },
              },
              vocabularioPreferido: { type: "object" },
              estiloPedidos: { type: "string" },
              trechosExemplo: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    tipo: { type: "string" },
                    trecho: { type: "string" },
                    fonte: { type: "string" },
                  },
                  required: ["tipo", "trecho", "fonte"],
                  additionalProperties: false,
                },
              },
            },
            required: [
              "estruturaArgumentativa",
              "padraoOrganizacao",
              "tomEscrita",
              "nivelFormalidade",
              "tipoFundamentacao",
              "preferenciaCitacoes",
              "expressoesRecorrentes",
              "vocabularioPreferido",
              "estiloPedidos",
              "trechosExemplo",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    const analysisResult = JSON.parse(
      typeof content === "string" ? content : "{}"
    );

    // Atualizar perfil de estilo
    await updateUserStyleProfile(ctx.user.id, {
      ...analysisResult,
      ultimaAnalise: new Date(),
    });

    // Marcar petições como analisadas
    for (const petition of unanalyzedPetitions.slice(0, 3)) {
      await markPetitionAsAnalyzed(petition.id, ctx.user.id);
      // Incrementar contador será feito na função updateUserStyleProfile
    }

    return {
      success: true,
      profile: analysisResult,
      peticoesAnalisadas: unanalyzedPetitions.slice(0, 3).length,
    };
  }),

  /**
   * Obter perfil de estilo do usuário
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getUserStyleProfile(ctx.user.id);
    return profile || null;
  }),

  /**
   * Atualizar perfil de estilo manualmente
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        estruturaArgumentativa: z.string().optional(),
        padraoOrganizacao: z.string().optional(),
        tomEscrita: z.string().optional(),
        nivelFormalidade: z.string().optional(),
        tipoFundamentacao: z.string().optional(),
        preferenciaCitacoes: z.string().optional(),
        expressoesRecorrentes: z.array(z.string()).optional(),
        vocabularioPreferido: z.record(z.string(), z.string()).optional(),
        estiloPedidos: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await updateUserStyleProfile(ctx.user.id, input);
      return { success: true };
    }),
});
