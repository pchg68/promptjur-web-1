import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { History, RotateCcw, Trash2, GitCompare, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface VersionHistoryProps {
  promptId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVersionRestored?: () => void;
}

export function VersionHistory({ promptId, open, onOpenChange, onVersionRestored }: VersionHistoryProps) {
  const [selectedVersion1, setSelectedVersion1] = useState<number | null>(null);
  const [selectedVersion2, setSelectedVersion2] = useState<number | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const utils = trpc.useUtils();
  const { data: versions, isLoading } = trpc.versioning.getVersions.useQuery(
    { promptId },
    { enabled: open }
  );

  const restoreMutation = trpc.versioning.restoreVersion.useMutation({
    onSuccess: (data) => {
      toast.success(`Versão ${data.versaoRestaurada} restaurada! Nova versão ${data.novaVersao} criada.`);
      utils.versioning.getVersions.invalidate({ promptId });
      onVersionRestored?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.versioning.deleteVersion.useMutation({
    onSuccess: () => {
      toast.success("Versão deletada");
      utils.versioning.getVersions.invalidate({ promptId });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { data: comparison } = trpc.versioning.compareVersions.useQuery(
    {
      promptId,
      versaoId1: selectedVersion1!,
      versaoId2: selectedVersion2!,
    },
    { enabled: showComparison && !!selectedVersion1 && !!selectedVersion2 }
  );

  const handleRestore = (versaoId: number) => {
    if (confirm("Tem certeza que deseja restaurar esta versão? Isso criará uma nova versão com este conteúdo.")) {
      restoreMutation.mutate({ promptId, versaoId });
    }
  };

  const handleDelete = (versaoId: number) => {
    if (confirm("Tem certeza que deseja deletar esta versão? Esta ação não pode ser desfeita.")) {
      deleteMutation.mutate({ promptId, versaoId });
    }
  };

  const handleCompare = () => {
    if (!selectedVersion1 || !selectedVersion2) {
      toast.error("Selecione duas versões para comparar");
      return;
    }
    setShowComparison(true);
  };

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case "original":
        return "bg-blue-100 text-blue-800";
      case "otimizado":
        return "bg-green-100 text-green-800";
      case "manual":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <Dialog open={open && !showComparison} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Histórico de Versões
            </DialogTitle>
            <DialogDescription>
              Gerencie e compare diferentes versões deste prompt
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : versions && versions.length > 0 ? (
            <div className="space-y-4">
              {/* Botões de ação */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCompare}
                  disabled={!selectedVersion1 || !selectedVersion2}
                >
                  <GitCompare className="w-4 h-4 mr-2" />
                  Comparar Selecionadas
                </Button>
                <span className="text-sm text-gray-500">
                  {selectedVersion1 && selectedVersion2
                    ? "2 versões selecionadas"
                    : "Selecione 2 versões para comparar"}
                </span>
              </div>

              {/* Lista de versões */}
              <div className="space-y-3">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      selectedVersion1 === version.id || selectedVersion2 === version.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={selectedVersion1 === version.id || selectedVersion2 === version.id}
                            onChange={(e) => {
                              if (e.target.checked) {
                                if (!selectedVersion1) {
                                  setSelectedVersion1(version.id);
                                } else if (!selectedVersion2 && selectedVersion1 !== version.id) {
                                  setSelectedVersion2(version.id);
                                }
                              } else {
                                if (selectedVersion1 === version.id) {
                                  setSelectedVersion1(selectedVersion2);
                                  setSelectedVersion2(null);
                                } else if (selectedVersion2 === version.id) {
                                  setSelectedVersion2(null);
                                }
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <h4 className="font-semibold text-gray-900">Versão {version.versao}</h4>
                          <Badge className={getTipoBadgeColor(version.tipo)}>{version.tipo}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {version.conteudo.substring(0, 150)}...
                        </p>
                        {version.observacoes && (
                          <p className="text-xs text-gray-500 italic">"{version.observacoes}"</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {format(new Date(version.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(version.id)}
                          disabled={restoreMutation.isPending}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(version.id)}
                          disabled={deleteMutation.isPending || versions.length <= 1}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma versão salva ainda</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Comparação */}
      <Dialog open={showComparison} onOpenChange={setShowComparison}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="w-5 h-5" />
              Comparação de Versões
            </DialogTitle>
            <DialogDescription>
              Compare as diferenças entre duas versões
            </DialogDescription>
          </DialogHeader>

          {comparison && (
            <div className="space-y-4">
              {/* Estatísticas */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Versão {comparison.versao1.versao}</p>
                  <p className="text-2xl font-bold">{comparison.diff.tamanhoV1}</p>
                  <p className="text-xs text-gray-500">caracteres</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Diferença</p>
                  <p className={`text-2xl font-bold ${comparison.diff.diferencaTamanho > 0 ? "text-green-600" : "text-red-600"}`}>
                    {comparison.diff.diferencaTamanho > 0 ? "+" : ""}
                    {comparison.diff.diferencaTamanho}
                  </p>
                  <p className="text-xs text-gray-500">caracteres</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Versão {comparison.versao2.versao}</p>
                  <p className="text-2xl font-bold">{comparison.diff.tamanhoV2}</p>
                  <p className="text-xs text-gray-500">caracteres</p>
                </div>
              </div>

              {/* Comparação lado a lado */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    Versão {comparison.versao1.versao}
                    <Badge className={getTipoBadgeColor(comparison.versao1.tipo)}>
                      {comparison.versao1.tipo}
                    </Badge>
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto text-sm whitespace-pre-wrap">
                    {comparison.versao1.conteudo}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    Versão {comparison.versao2.versao}
                    <Badge className={getTipoBadgeColor(comparison.versao2.tipo)}>
                      {comparison.versao2.tipo}
                    </Badge>
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto text-sm whitespace-pre-wrap">
                    {comparison.versao2.conteudo}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowComparison(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
