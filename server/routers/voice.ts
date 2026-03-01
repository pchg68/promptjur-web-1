import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { transcribeAudio } from "../_core/voiceTranscription";
import { storagePut } from "../storage";

export const voiceRouter = router({
  /**
   * Transcreve áudio enviado como base64
   * 
   * Fluxo:
   * 1. Recebe áudio em base64 do frontend
   * 2. Faz upload para S3
   * 3. Chama o serviço Whisper com a URL do S3
   * 4. Retorna a transcrição
   */
  transcribe: protectedProcedure
    .input(z.object({
      audioBase64: z.string().min(1, "Áudio vazio"),
      mimeType: z.string().default("audio/webm"),
      language: z.string().optional(),
      prompt: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // 1. Decode base64 to buffer
      const audioBuffer = Buffer.from(input.audioBase64, "base64");
      
      // Check file size (16MB limit)
      const sizeMB = audioBuffer.length / (1024 * 1024);
      if (sizeMB > 16) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Arquivo de áudio muito grande (${sizeMB.toFixed(1)}MB). O limite é 16MB.`,
        });
      }

      // 2. Upload to S3
      const ext = input.mimeType.includes("webm") ? "webm" 
        : input.mimeType.includes("mp4") ? "m4a"
        : input.mimeType.includes("ogg") ? "ogg"
        : "webm";
      
      const randomSuffix = Math.random().toString(36).substring(2, 10);
      const fileKey = `voice/${ctx.user.id}/audio-${Date.now()}-${randomSuffix}.${ext}`;
      
      let audioUrl: string;
      try {
        const uploadResult = await storagePut(fileKey, audioBuffer, input.mimeType);
        audioUrl = uploadResult.url;
      } catch (error) {
        console.error("[Voice] Upload error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao fazer upload do áudio. Tente novamente.",
        });
      }

      // 3. Call Whisper transcription
      const result = await transcribeAudio({
        audioUrl,
        language: input.language,
        prompt: input.prompt,
      });

      // 4. Check for errors
      if ("error" in result) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
          cause: result,
        });
      }

      return {
        text: result.text,
        language: result.language,
        duration: result.duration,
      };
    }),
});
