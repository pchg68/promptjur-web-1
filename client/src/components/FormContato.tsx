/**
 * FormContato — Formulário de contato público do PromptJur
 * Permite que visitantes enviem perguntas ou feedback sem precisar estar logados
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Send, CheckCircle2, Loader2, Mail, User, MessageSquare, Tag } from "lucide-react";

const contatoSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(255),
  email: z.string().email("E-mail inválido"),
  assunto: z.enum(["duvida", "feedback", "suporte", "parceria", "outro"]),
  mensagem: z
    .string()
    .min(10, "Mensagem deve ter pelo menos 10 caracteres")
    .max(5000, "Máximo de 5000 caracteres"),
});

type ContatoForm = z.infer<typeof contatoSchema>;

const assuntoLabels: Record<ContatoForm["assunto"], string> = {
  duvida: "Dúvida",
  feedback: "Feedback",
  suporte: "Suporte técnico",
  parceria: "Parceria comercial",
  outro: "Outro",
};

interface FormContatoProps {
  /** Modo compacto para uso em seção da landing page */
  compact?: boolean;
}

export default function FormContato({ compact = false }: FormContatoProps) {
  const [enviado, setEnviado] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ContatoForm>({
    resolver: zodResolver(contatoSchema),
    defaultValues: { assunto: "duvida" },
  });

  const assuntoAtual = watch("assunto");
  const mensagemAtual = watch("mensagem") ?? "";

  const enviarMutation = trpc.contato.enviar.useMutation({
    onSuccess: () => {
      setEnviado(true);
      reset();
    },
    onError: (err) => {
      toast.error(err.message ?? "Erro ao enviar mensagem. Tente novamente.");
    },
  });

  const onSubmit = (data: ContatoForm) => {
    enviarMutation.mutate(data);
  };

  // Estado de sucesso
  if (enviado) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Mensagem enviada!</h3>
        <p className="text-gray-400 text-sm max-w-sm mb-6">
          Obrigado pelo contato. Você receberá uma confirmação por e-mail e
          retornaremos em breve.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEnviado(false)}
          className="border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          Enviar outra mensagem
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Nome e E-mail em linha */}
      <div className={`grid gap-4 ${compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
        <div className="space-y-1.5">
          <Label htmlFor="nome" className="text-gray-300 text-sm flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-400" />
            Nome
          </Label>
          <Input
            id="nome"
            placeholder="Seu nome completo"
            {...register("nome")}
            className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/20"
          />
          {errors.nome && (
            <p className="text-red-400 text-xs">{errors.nome.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-gray-300 text-sm flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-blue-400" />
            E-mail
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            {...register("email")}
            className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/20"
          />
          {errors.email && (
            <p className="text-red-400 text-xs">{errors.email.message}</p>
          )}
        </div>
      </div>

      {/* Assunto */}
      <div className="space-y-1.5">
        <Label className="text-gray-300 text-sm flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-blue-400" />
          Assunto
        </Label>
        <Select
          value={assuntoAtual}
          onValueChange={(val) => setValue("assunto", val as ContatoForm["assunto"])}
        >
          <SelectTrigger className="bg-gray-800/60 border-gray-700 text-white focus:ring-blue-500/20">
            <SelectValue placeholder="Selecione o assunto" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            {Object.entries(assuntoLabels).map(([value, label]) => (
              <SelectItem
                key={value}
                value={value}
                className="text-gray-200 focus:bg-gray-800 focus:text-white"
              >
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.assunto && (
          <p className="text-red-400 text-xs">{errors.assunto.message}</p>
        )}
      </div>

      {/* Mensagem */}
      <div className="space-y-1.5">
        <Label htmlFor="mensagem" className="text-gray-300 text-sm flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
          Mensagem
        </Label>
        <Textarea
          id="mensagem"
          placeholder="Descreva sua dúvida, sugestão ou feedback..."
          rows={compact ? 4 : 6}
          {...register("mensagem")}
          className="bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/20 resize-none"
        />
        <div className="flex justify-between items-center">
          {errors.mensagem ? (
            <p className="text-red-400 text-xs">{errors.mensagem.message}</p>
          ) : (
            <span />
          )}
          <span
            className={`text-xs ${
              mensagemAtual.length > 4500 ? "text-red-400" : "text-gray-500"
            }`}
          >
            {mensagemAtual.length}/5000
          </span>
        </div>
      </div>

      {/* Botão de envio */}
      <Button
        type="submit"
        disabled={enviarMutation.isPending}
        className="w-full bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400 text-white font-semibold py-2.5 transition-all"
      >
        {enviarMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Enviar mensagem
          </>
        )}
      </Button>

      <p className="text-center text-gray-500 text-xs">
        Respondemos em até 2 dias úteis. Seus dados são tratados conforme a{" "}
        <a href="/privacidade" className="text-blue-400 hover:underline">
          Política de Privacidade
        </a>
        .
      </p>
    </form>
  );
}
