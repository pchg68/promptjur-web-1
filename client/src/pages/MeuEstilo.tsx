import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, FileText, Trash2, Loader2, Sparkles, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AREAS_JURIDICAS } from "@shared/juridico";

export default function MeuEstilo() {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [titulo, setTitulo] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("Petição");
  const [areaJuridica, setAreaJuridica] = useState("");
  const [viewPetitionId, setViewPetitionId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: petitions, isLoading: loadingPetitions } = trpc.petitions.list.useQuery();
  const { data: profile, isLoading: loadingProfile } = trpc.style.getProfile.useQuery();
  const { data: petitionDetails } = trpc.petitions.getById.useQuery(
    { id: viewPetitionId! },
    { enabled: !!viewPetitionId }
  );

  const uploadMutation = trpc.petitions.upload.useMutation({
    onSuccess: () => {
      toast.success("Petição enviada com sucesso!");
      setSelectedFile(null);
      setTitulo("");
      utils.petitions.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.petitions.delete.useMutation({
    onSuccess: () => {
      toast.success("Petição removida");
      utils.petitions.list.invalidate();
    },
  });

  const analyzeMutation = trpc.style.analyze.useMutation({
    onSuccess: (data) => {
      toast.success(`Análise concluída! ${data.peticoesAnalisadas} petição(ões) analisada(s).`);
      utils.style.getProfile.invalidate();
      utils.petitions.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo
      if (!file.type.includes("pdf") && !file.type.includes("wordprocessingml")) {
        toast.error("Apenas arquivos PDF ou DOCX são permitidos");
        return;
      }
      // Validar tamanho (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo: 10MB");
        return;
      }
      setSelectedFile(file);
      // Sugerir título baseado no nome do arquivo
      if (!titulo) {
        setTitulo(file.name.replace(/\.(pdf|docx)$/i, ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !titulo) {
      toast.error("Preencha o título e selecione um arquivo");
      return;
    }

    setUploading(true);
    try {
      // Converter arquivo para base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const fileBase64 = base64.split(",")[1]; // Remover prefixo data:...

        await uploadMutation.mutateAsync({
          titulo,
          tipoDocumento,
          areaJuridica: areaJuridica || undefined,
          fileName: selectedFile.name,
          fileBase64,
          mimeType: selectedFile.type.includes("pdf")
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        setUploading(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    await analyzeMutation.mutateAsync();
    setAnalyzing(false);
  };

  const unanalyzedCount = petitions?.filter((p) => !p.analisado).length || 0;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#1a2332]">Meu Estilo Jurídico</h1>
        <p className="text-gray-600 mt-2">
          Envie suas petições para que o sistema aprenda seu estilo de escrita e aplique nos prompts gerados
        </p>
      </div>

      {/* Upload de Petições */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Enviar Petição
          </CardTitle>
          <CardDescription>
            Faça upload de suas petições (PDF ou DOCX) para análise de estilo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título da Petição *</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Ação de Cobrança - Cliente X"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Documento</Label>
              <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Petição">Petição</SelectItem>
                  <SelectItem value="Parecer">Parecer</SelectItem>
                  <SelectItem value="Contrato">Contrato</SelectItem>
                  <SelectItem value="Recurso">Recurso</SelectItem>
                  <SelectItem value="Defesa">Defesa</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Área Jurídica (Opcional)</Label>
              <Select value={areaJuridica} onValueChange={setAreaJuridica}>
                <SelectTrigger id="area">
                  <SelectValue placeholder="Selecione uma área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Não especificar</SelectItem>
                  {AREAS_JURIDICAS.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Arquivo (PDF ou DOCX) *</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-900">{selectedFile.name}</span>
              <span className="text-xs text-blue-600 ml-auto">
                {(selectedFile.size / 1024).toFixed(0)} KB
              </span>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !titulo || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Enviar Petição
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Petições */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Petições Enviadas ({petitions?.length || 0})
              </CardTitle>
              <CardDescription>
                {unanalyzedCount > 0 && (
                  <span className="text-amber-600 font-medium">
                    {unanalyzedCount} petição(ões) aguardando análise
                  </span>
                )}
              </CardDescription>
            </div>
            {unanalyzedCount > 0 && (
              <Button onClick={handleAnalyze} disabled={analyzing} variant="default">
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analisar Estilo
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingPetitions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : petitions && petitions.length > 0 ? (
            <div className="space-y-3">
              {petitions.map((petition) => (
                <div
                  key={petition.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{petition.titulo}</h3>
                      {petition.analisado && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Analisado
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span>{petition.tipoDocumento}</span>
                      {petition.areaJuridica && <span>• {petition.areaJuridica}</span>}
                      <span>• {new Date(petition.createdAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewPetitionId(petition.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate({ id: petition.id })}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma petição enviada ainda</p>
              <p className="text-sm mt-1">Envie suas petições para começar a análise de estilo</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Perfil de Estilo */}
      {profile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Seu Perfil de Estilo
            </CardTitle>
            <CardDescription>
              Baseado em {profile.peticoesAnalisadas} petição(ões) analisada(s) •
              Confiança: {profile.confiancaPerfil}%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Estrutura Argumentativa</h4>
                <p className="text-sm text-gray-600">{profile.estruturaArgumentativa}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Padrão de Organização</h4>
                <p className="text-sm text-gray-600">{profile.padraoOrganizacao}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Tom de Escrita</h4>
                <Badge variant="outline">{profile.tomEscrita}</Badge>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Nível de Formalidade</h4>
                <Badge variant="outline">{profile.nivelFormalidade}</Badge>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Tipo de Fundamentação</h4>
                <p className="text-sm text-gray-600">{profile.tipoFundamentacao}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Preferência de Citações</h4>
                <p className="text-sm text-gray-600">{profile.preferenciaCitacoes}</p>
              </div>

              <div className="md:col-span-2">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Estilo de Pedidos</h4>
                <p className="text-sm text-gray-600">{profile.estiloPedidos}</p>
              </div>

              {profile.expressõesRecorrentes && Array.isArray(profile.expressõesRecorrentes) && profile.expressõesRecorrentes.length > 0 ? (
                <div className="md:col-span-2">
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Expressões Recorrentes</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.expressõesRecorrentes.map((expr: string, i: number) => (
                      <Badge key={i} variant="secondary">
                        {expr}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Visualização de Petição */}
      <Dialog open={!!viewPetitionId} onOpenChange={() => setViewPetitionId(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{petitionDetails?.titulo}</DialogTitle>
            <DialogDescription>
              {petitionDetails?.tipoDocumento} • {petitionDetails?.areaJuridica}
            </DialogDescription>
          </DialogHeader>
          {petitionDetails && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">Arquivo</h4>
                <a
                  href={petitionDetails.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  {petitionDetails.fileName}
                </a>
              </div>
              {petitionDetails.textoExtraido && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Texto Extraído (Preview)</h4>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 max-h-96 overflow-y-auto whitespace-pre-wrap">
                    {petitionDetails.textoExtraido}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
