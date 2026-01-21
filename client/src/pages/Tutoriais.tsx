import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle, Clock, BookOpen, ExternalLink, ArrowLeft } from "lucide-react";
import { useState } from "react";

interface Video {
  id: string;
  numero: number;
  titulo: string;
  descricao: string;
  duracao: string;
  youtubeId: string; // ID do vídeo no YouTube (parte após watch?v=)
  topicos: string[];
}

const videos: Video[] = [
  {
    id: "video-1",
    numero: 1,
    titulo: "Introdução ao PromptJur",
    descricao: "Conheça o PromptJur e descubra como transformar prompts em peças jurídicas profissionais usando IA.",
    duracao: "3:00",
    youtubeId: "SEU_VIDEO_ID_1", // Substituir pelo ID real após upload
    topicos: [
      "O que é o PromptJur",
      "Principais funcionalidades",
      "Benefícios práticos",
      "Visão geral do sistema"
    ]
  },
  {
    id: "video-2",
    numero: 2,
    titulo: "Analisando Prompts Jurídicos",
    descricao: "Aprenda a usar a funcionalidade de Análise para avaliar a qualidade de prompts e identificar pontos de melhoria.",
    duracao: "3:00",
    youtubeId: "SEU_VIDEO_ID_2",
    topicos: [
      "Acessando a Análise",
      "Inserindo prompts",
      "Interpretando resultados",
      "Salvando análises"
    ]
  },
  {
    id: "video-3",
    numero: 3,
    titulo: "Gerando Prompts Profissionais",
    descricao: "Descubra como criar prompts jurídicos completos e estruturados do zero usando IA.",
    duracao: "3:00",
    youtubeId: "SEU_VIDEO_ID_3",
    topicos: [
      "Configurando a geração",
      "Definindo objetivo e contexto",
      "Explorando resultados",
      "Criando modelos"
    ]
  },
  {
    id: "video-4",
    numero: 4,
    titulo: "Otimizando Prompts Existentes",
    descricao: "Transforme prompts básicos em prompts profissionais com a funcionalidade de Otimização.",
    duracao: "3:00",
    youtubeId: "SEU_VIDEO_ID_4",
    topicos: [
      "Preparando otimização",
      "Focos: Clareza, Completude, Precisão",
      "Comparando antes e depois",
      "Aplicando melhorias"
    ]
  },
  {
    id: "video-5",
    numero: 5,
    titulo: "Recursos Avançados e Dicas Finais",
    descricao: "Aprenda recursos avançados: modelos personalizados, validação de legislação e exportação em formato ABNT.",
    duracao: "3:00",
    youtubeId: "SEU_VIDEO_ID_5",
    topicos: [
      "Modelos personalizados",
      "Validação de legislação",
      "Exportação ABNT",
      "Dicas profissionais"
    ]
  }
];

export default function Tutoriais() {
  const [videoSelecionado, setVideoSelecionado] = useState<Video | null>(null);

  const abrirVideo = (video: Video) => {
    setVideoSelecionado(video);
  };

  const fecharVideo = () => {
    setVideoSelecionado(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container py-8">
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Tutoriais em Vídeo</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Aprenda a usar todas as funcionalidades do PromptJur em 15 minutos com nossa série de 5 vídeos
          </p>
        </div>
      </div>

      {/* Modal de Vídeo */}
      {videoSelecionado && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={fecharVideo}
        >
          <div 
            className="bg-background rounded-lg max-w-5xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Vídeo {videoSelecionado.numero}: {videoSelecionado.titulo}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {videoSelecionado.descricao}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={fecharVideo}>
                ✕
              </Button>
            </div>

            {/* Player do YouTube */}
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoSelecionado.youtubeId}?autoplay=1`}
                title={videoSelecionado.titulo}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Tópicos */}
            <div className="p-4 border-t bg-muted/30">
              <h3 className="font-semibold mb-2">Neste vídeo:</h3>
              <ul className="space-y-1">
                {videoSelecionado.topicos.map((topico, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{topico}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Vídeos */}
      <div className="container py-8">
        {/* Informações da Série */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-primary" />
              Série Completa: Tutorial PromptJur
            </CardTitle>
            <CardDescription>
              5 vídeos • 15 minutos no total • Do básico ao avançado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Duração</div>
                  <div className="text-sm text-muted-foreground">3 min por vídeo</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Nível</div>
                  <div className="text-sm text-muted-foreground">Iniciante a Avançado</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <PlayCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Formato</div>
                  <div className="text-sm text-muted-foreground">Demonstrações práticas</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Vídeos */}
        <div className="grid gap-6">
          {videos.map((video) => (
            <Card key={video.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="secondary" className="text-lg px-3 py-1">
                        {video.numero}
                      </Badge>
                      <CardTitle className="text-xl">{video.titulo}</CardTitle>
                    </div>
                    <CardDescription className="text-base">
                      {video.descricao}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className="whitespace-nowrap">
                      <Clock className="h-3 w-3 mr-1" />
                      {video.duracao}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Tópicos */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                      O que você vai aprender:
                    </h4>
                    <div className="grid md:grid-cols-2 gap-2">
                      {video.topicos.map((topico, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-0.5">✓</span>
                          <span>{topico}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => abrirVideo(video)}
                      className="flex-1"
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Assistir Agora
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => window.open(`https://www.youtube.com/watch?v=${video.youtubeId}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir no YouTube
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Pronto para começar?</CardTitle>
            <CardDescription>
              Assista os vídeos em sequência para dominar todas as funcionalidades do PromptJur
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              size="lg"
              onClick={() => abrirVideo(videos[0])}
            >
              <PlayCircle className="h-5 w-5 mr-2" />
              Começar pelo Vídeo 1
            </Button>
          </CardContent>
        </Card>

        {/* Ajuda Adicional */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Precisa de mais ajuda?{" "}
            <a href="mailto:contato@promptjur.com" className="text-primary hover:underline">
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
