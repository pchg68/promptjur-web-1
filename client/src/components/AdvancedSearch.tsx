import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X, Filter, Calendar, Tag, Award, ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { AREAS_JURIDICAS } from "@/const";

export interface SearchFilters {
  texto?: string;
  areasJuridicas?: string[];
  dataInicio?: Date;
  dataFim?: Date;
  tagIds?: number[];
  qualidade?: ("excelente" | "bom" | "ruim")[];
  ordenacao?: "data_desc" | "data_asc" | "qualidade" | "relevancia";
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  availableTags?: { id: number; nome: string }[];
}

export function AdvancedSearch({ onSearch, availableTags = [] }: AdvancedSearchProps) {
  const [expanded, setExpanded] = useState(false);
  const [texto, setTexto] = useState("");
  const [areasJuridicas, setAreasJuridicas] = useState<string[]>([]);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [qualidade, setQualidade] = useState<("excelente" | "bom" | "ruim")[]>([]);
  const [ordenacao, setOrdenacao] = useState<SearchFilters["ordenacao"]>("data_desc");

  // Debounce para busca por texto
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [texto]);

  const handleSearch = () => {
    const filters: SearchFilters = {
      ordenacao,
    };

    if (texto.trim()) filters.texto = texto.trim();
    if (areasJuridicas.length > 0) filters.areasJuridicas = areasJuridicas;
    if (dataInicio) filters.dataInicio = new Date(dataInicio);
    if (dataFim) filters.dataFim = new Date(dataFim);
    if (tagIds.length > 0) filters.tagIds = tagIds;
    if (qualidade.length > 0) filters.qualidade = qualidade;

    onSearch(filters);
  };

  const clearFilters = () => {
    setTexto("");
    setAreasJuridicas([]);
    setDataInicio("");
    setDataFim("");
    setTagIds([]);
    setQualidade([]);
    setOrdenacao("data_desc");
    onSearch({ ordenacao: "data_desc" });
  };

  const toggleArea = (area: string) => {
    if (areasJuridicas.includes(area)) {
      setAreasJuridicas(areasJuridicas.filter((a) => a !== area));
    } else {
      setAreasJuridicas([...areasJuridicas, area]);
    }
  };

  const toggleQualidade = (qual: "excelente" | "bom" | "ruim") => {
    if (qualidade.includes(qual)) {
      setQualidade(qualidade.filter((q) => q !== qual));
    } else {
      setQualidade([...qualidade, qual]);
    }
  };

  const toggleTag = (tagId: number) => {
    if (tagIds.includes(tagId)) {
      setTagIds(tagIds.filter((id) => id !== tagId));
    } else {
      setTagIds([...tagIds, tagId]);
    }
  };

  const activeFiltersCount =
    (texto ? 1 : 0) +
    areasJuridicas.length +
    (dataInicio || dataFim ? 1 : 0) +
    tagIds.length +
    qualidade.length;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        {/* Barra de Busca Principal */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar em prompts jurídicos..."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="default" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Badges de Filtros Ativos */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {texto && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Search className="w-3 h-3" />
                Texto: "{texto}"
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setTexto("")}
                />
              </Badge>
            )}
            {areasJuridicas.map((area) => (
              <Badge key={area} variant="secondary" className="flex items-center gap-1">
                {area}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => toggleArea(area)}
                />
              </Badge>
            ))}
            {(dataInicio || dataFim) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {dataInicio && new Date(dataInicio).toLocaleDateString("pt-BR")}
                {dataInicio && dataFim && " - "}
                {dataFim && new Date(dataFim).toLocaleDateString("pt-BR")}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => {
                    setDataInicio("");
                    setDataFim("");
                  }}
                />
              </Badge>
            )}
            {qualidade.map((qual) => (
              <Badge key={qual} variant="secondary" className="flex items-center gap-1">
                <Award className="w-3 h-3" />
                {qual.charAt(0).toUpperCase() + qual.slice(1)}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => toggleQualidade(qual)}
                />
              </Badge>
            ))}
            {tagIds.map((tagId) => {
              const tag = availableTags.find((t) => t.id === tagId);
              return tag ? (
                <Badge key={tagId} variant="secondary" className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {tag.nome}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => toggleTag(tagId)}
                  />
                </Badge>
              ) : null;
            })}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 px-2 text-xs"
            >
              Limpar Tudo
            </Button>
          </div>
        )}

        {/* Filtros Avançados Expansíveis */}
        {expanded && (
          <div className="space-y-4 pt-4 border-t border-border">
            {/* Áreas Jurídicas */}
            <div>
              <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Áreas Jurídicas
              </Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {AREAS_JURIDICAS.map((area) => (
                  <Badge
                    key={area}
                    variant={areasJuridicas.includes(area) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleArea(area)}
                  >
                    {area}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Intervalo de Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Data Início
                </Label>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Data Fim
                </Label>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
            </div>

            {/* Qualidade */}
            <div>
              <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Qualidade
              </Label>
              <div className="flex gap-2 mt-2">
                {(["excelente", "bom", "ruim"] as const).map((qual) => (
                  <Badge
                    key={qual}
                    variant={qualidade.includes(qual) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleQualidade(qual)}
                  >
                    {qual.charAt(0).toUpperCase() + qual.slice(1)}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tags (se disponíveis) */}
            {availableTags.length > 0 && (
              <div>
                <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={tagIds.includes(tag.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.nome}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Ordenação */}
            <div>
              <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4" />
                Ordenar Por
              </Label>
              <Select value={ordenacao} onValueChange={(value: any) => setOrdenacao(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="data_desc">Mais Recentes</SelectItem>
                  <SelectItem value="data_asc">Mais Antigos</SelectItem>
                  <SelectItem value="qualidade">Melhor Qualidade</SelectItem>
                  <SelectItem value="relevancia">Mais Relevantes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSearch} className="flex-1">
                <Search className="w-4 h-4 mr-2" />
                Aplicar Filtros
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
