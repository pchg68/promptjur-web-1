import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface AvaliacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptId: number;
  plataforma: "manus" | "chatgpt" | "claude" | "gemini" | "perplexity";
  plataformaNome: string;
}

export function AvaliacaoModal({
  isOpen,
  onClose,
  promptId,
  plataforma,
  plataformaNome,
}: AvaliacaoModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comentario, setComentario] = useState("");

  const salvarAvaliacaoMutation = trpc.prompts.salvarAvaliacao.useMutation({
    onSuccess: () => {
      toast.success("Avaliação salva com sucesso!");
      onClose();
      // Reset
      setRating(0);
      setHoverRating(0);
      setComentario("");
    },
    onError: (error) => {
      toast.error(`Erro ao salvar avaliação: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error("Selecione uma avaliação de 1 a 5 estrelas");
      return;
    }

    salvarAvaliacaoMutation.mutate({
      promptId,
      plataforma,
      rating,
      comentario: comentario.trim() || undefined,
    });
  };

  const handleSkip = () => {
    onClose();
    setRating(0);
    setHoverRating(0);
    setComentario("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Como foi a resposta do {plataformaNome}?</DialogTitle>
          <DialogDescription>
            Sua avaliação nos ajuda a recomendar a melhor plataforma para cada tipo de caso jurídico.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating com estrelas */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm font-medium text-foreground">Avalie a qualidade da resposta</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                {rating === 1 && "Muito ruim"}
                {rating === 2 && "Ruim"}
                {rating === 3 && "Regular"}
                {rating === 4 && "Bom"}
                {rating === 5 && "Excelente"}
              </p>
            )}
          </div>

          {/* Comentário opcional */}
          <div className="space-y-2">
            <label htmlFor="comentario" className="text-sm font-medium text-foreground">
              Comentário (opcional)
            </label>
            <Textarea
              id="comentario"
              placeholder="Compartilhe sua experiência com esta plataforma..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              {comentario.length}/500 caracteres
            </p>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={salvarAvaliacaoMutation.isPending}
          >
            Pular
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || salvarAvaliacaoMutation.isPending}
          >
            {salvarAvaliacaoMutation.isPending ? "Salvando..." : "Enviar Avaliação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
