import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type VoiceState = "idle" | "recording" | "transcribing";

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

const MAX_RECORDING_SECONDS = 120; // 2 minutos
const MAX_FILE_SIZE_MB = 16;

export function VoiceInput({ onTranscription, disabled, className = "" }: VoiceInputProps) {
  const [state, setState] = useState<VoiceState>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const transcribeMutation = trpc.voice.transcribe.useMutation({
    onSuccess: (data) => {
      onTranscription(data.text);
      toast.success("Transcrição concluída", {
        description: `${data.text.length} caracteres transcritos (${data.language || "pt"})`,
      });
    },
    onError: (error) => {
      toast.error("Erro na transcrição", {
        description: error.message,
      });
    },
    onSettled: () => {
      setState("idle");
    },
  });

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      // Check browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Navegador não suporta gravação de áudio", {
          description: "Use um navegador moderno como Chrome, Firefox ou Edge.",
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      streamRef.current = stream;

      // Prefer webm/opus, fallback to other formats
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/ogg";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        
        // Check file size
        const sizeMB = audioBlob.size / (1024 * 1024);
        if (sizeMB > MAX_FILE_SIZE_MB) {
          toast.error("Áudio muito grande", {
            description: `O arquivo tem ${sizeMB.toFixed(1)}MB. O limite é ${MAX_FILE_SIZE_MB}MB.`,
          });
          setState("idle");
          return;
        }

        if (audioBlob.size < 1000) {
          toast.error("Gravação muito curta", {
            description: "Fale por pelo menos 1 segundo.",
          });
          setState("idle");
          return;
        }

        setState("transcribing");

        // Convert blob to base64 for upload
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          transcribeMutation.mutate({
            audioBase64: base64Data.split(",")[1], // Remove data:audio/... prefix
            mimeType: mimeType.split(";")[0], // e.g. "audio/webm"
            language: "pt",
            prompt: "Transcreva o texto jurídico em português brasileiro",
          });
        };
        reader.readAsDataURL(audioBlob);
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setState("recording");
      setRecordingTime(0);

      // Timer for recording duration
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const next = prev + 1;
          if (next >= MAX_RECORDING_SECONDS) {
            stopRecording();
            toast.info("Gravação encerrada", {
              description: `Limite de ${MAX_RECORDING_SECONDS / 60} minutos atingido.`,
            });
          }
          return next;
        });
      }, 1000);

    } catch (error: any) {
      if (error.name === "NotAllowedError") {
        toast.error("Permissão de microfone negada", {
          description: "Permita o acesso ao microfone nas configurações do navegador.",
        });
      } else if (error.name === "NotFoundError") {
        toast.error("Microfone não encontrado", {
          description: "Conecte um microfone e tente novamente.",
        });
      } else {
        toast.error("Erro ao iniciar gravação", {
          description: error.message || "Erro desconhecido",
        });
      }
      setState("idle");
    }
  }, [stopRecording, transcribeMutation]);

  const handleClick = () => {
    if (state === "idle") {
      startRecording();
    } else if (state === "recording") {
      stopRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const isDisabled = disabled || state === "transcribing";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={state === "recording" ? "destructive" : "outline"}
          size="icon"
          className={`relative h-8 w-8 ${className} ${
            state === "recording" ? "animate-pulse" : ""
          }`}
          onClick={handleClick}
          disabled={isDisabled}
        >
          {state === "idle" && <Mic className="h-4 w-4" />}
          {state === "recording" && <Square className="h-3.5 w-3.5" />}
          {state === "transcribing" && <Loader2 className="h-4 w-4 animate-spin" />}
          
          {/* Recording indicator dot */}
          {state === "recording" && (
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {state === "idle" && "Gravar áudio para transcrição"}
        {state === "recording" && `Gravando... ${formatTime(recordingTime)} (clique para parar)`}
        {state === "transcribing" && "Transcrevendo áudio..."}
      </TooltipContent>
    </Tooltip>
  );
}
