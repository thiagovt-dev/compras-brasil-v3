"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  FileText,
  Building,
  RefreshCw,
  Calendar,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface TenderSearchClientProps {
  initialTenders: Tender[];
  agencies: Agency[];
  categories: string[];
  tenderTypes: TenderType[];
  statuses: TenderStatus[];
  agencyTypes: TenderType[];
  spheres: TenderType[];
  searchParams: {
    query?: string;
    agency_id?: string;
    tender_type?: string;
    status?: string;
    category?: string;
    opening_date_from?: string;
    opening_date_to?: string;
    page?: string;
    filter?: string;
  };
  currentPage: number;
  hasSearchError?: boolean;
  searchErrorMessage?: string;
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "Data não informada";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  } catch {
    return "Data inválida";
  }
}

function formatTenderType(type: string) {
  const types: Record<string, string> = {
    pregao_eletronico: "Pregão Eletrônico",
    concorrencia: "Concorrência",
    tomada_de_precos: "Tomada de Preços",
    convite: "Convite",
    leilao: "Leilão",
    concurso: "Concurso",
  };
  return types[type] || type;
}

function formatStatus(status: string) {
  const statusMap: Record<string, string> = {
    draft: "Rascunho",
    published: "Publicada",
    in_progress: "Em Andamento",
    under_review: "Em Análise",
    completed: "Concluída",
    cancelled: "Cancelada",
    revoked: "Revogada",
    failed: "Fracassada",
    deserted: "Deserta",
  };
  return statusMap[status] || status;
}

function getStatusColor(status: string) {
  const colorMap: Record<string, string> = {
    published: "green",
    in_progress: "blue",
    under_review: "yellow",
    completed: "gray",
    cancelled: "red",
    revoked: "red",
    failed: "red",
    deserted: "orange",
  };
  return colorMap[status] || "gray";
}

function getTypeIcon(type: string) {
  const iconMap: Record<string, string> = {
    pregao_eletronico: "⚖️",
    concorrencia: "🏛️",
    tomada_de_precos: "📋",
    convite: "📄",
    leilao: "🔨",
    concurso: "🏆",
  };
  return iconMap[type] || "📋";
}

// Função helper para extrair dados da agência
function getAgencyData(agencies: Tender["agencies"]) {
  if (!agencies) return { name: "Não informado", agency_type: undefined, sphere: undefined };

  // Se é array (formato do Supabase), pega o primeiro item
  if (Array.isArray(agencies)) {
    return agencies[0] || { name: "Não informado", agency_type: undefined, sphere: undefined };
  }

  // Se é objeto direto
  return agencies;
}

export default function TenderSearchClient({
  initialTenders,
  agencies,
  categories,
  tenderTypes,
  statuses,
  agencyTypes,
  spheres,
  searchParams,
  currentPage,
  hasSearchError = false,
  searchErrorMessage,
}: TenderSearchClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Estados dos filtros
  const [searchTerm, setSearchTerm] = useState(searchParams.query || "");
  const [selectedAgency, setSelectedAgency] = useState(searchParams.agency_id || "all");
  const [selectedType, setSelectedType] = useState(searchParams.tender_type || "all");
  const [selectedStatus, setSelectedStatus] = useState(searchParams.status || "all");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.category || "all");
  const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>(
    searchParams.filter ? searchParams.filter.split(",") : []
  );

  // Filtros rápidos
  const quickFilters = [
    { id: "suspended", label: "Apenas suspensos", count: 0, color: "orange" },
    { id: "proposals", label: "Apenas propostas", count: 0, color: "blue" },
    { id: "favorites", label: "Apenas favoritos", count: 0, color: "blue" },
  ];

  // Função para atualizar URL com filtros
  const updateFilters = () => {
    const params = new URLSearchParams();

    if (searchTerm) params.set("query", searchTerm);
    if (selectedAgency !== "all") params.set("agency_id", selectedAgency);
    if (selectedType !== "all") params.set("tender_type", selectedType);
    if (selectedStatus !== "all") params.set("status", selectedStatus);
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (activeQuickFilters.length > 0) params.set("filter", activeQuickFilters.join(","));

    startTransition(() => {
      router.push(`/dashboard/citizen/search?${params.toString()}`);
    });
  };

  // Debounce para busca por texto
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== searchParams.query) {
        updateFilters();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Atualizar filtros quando mudarem
  useEffect(() => {
    updateFilters();
  }, [selectedAgency, selectedType, selectedStatus, selectedCategory, activeQuickFilters]);

  const toggleQuickFilter = (filterId: string) => {
    setActiveQuickFilters((prev) =>
      prev.includes(filterId) ? prev.filter((id) => id !== filterId) : [...prev, filterId]
    );
  };

  const clearFilters = () => {
    setActiveQuickFilters([]);
    setSelectedAgency("all");
    setSelectedType("all");
    setSelectedStatus("all");
    setSelectedCategory("all");
    setSearchTerm("");

    startTransition(() => {
      router.push("/dashboard/citizen/search");
    });
  };

  const getStatusBadge = (status: string) => {
    const color = getStatusColor(status);
    const colorClasses: Record<string, string> = {
      blue: "bg-blue-600 text-white",
      green: "bg-green-600 text-white",
      orange: "bg-orange-600 text-white",
      red: "bg-red-600 text-white",
      yellow: "bg-yellow-600 text-white",
      gray: "bg-gray-600 text-white",
    };

    return <Badge className={`${colorClasses[color]} px-3 py-1`}>{formatStatus(status)}</Badge>;
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <div className="w-80 border-r min-h-screen p-6">
        <div className="space-y-6">
          {/* Advanced Filters Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Filtros avançados</h2>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Filters */}
          <div className="space-y-3">
            {quickFilters.map((filter) => (
              <Button
                key={filter.id}
                variant={activeQuickFilters.includes(filter.id) ? "default" : "outline"}
                className={`w-full justify-start gap-2 ${
                  filter.color === "orange"
                    ? activeQuickFilters.includes(filter.id)
                      ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                      : "border-orange-500 text-orange-600 hover:bg-orange-50"
                    : activeQuickFilters.includes(filter.id)
                    ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                    : "border-blue-500 text-blue-600 hover:bg-blue-50"
                }`}
                onClick={() => toggleQuickFilter(filter.id)}>
                <div
                  className={`w-2 h-2 rounded-full ${
                    filter.color === "orange" ? "bg-orange-500" : "bg-blue-500"
                  }`}
                />
                {filter.label}
              </Button>
            ))}
          </div>

          {/* Dropdown Filters */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Órgão</label>
              <Select value={selectedAgency} onValueChange={setSelectedAgency}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um órgão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os órgãos</SelectItem>
                  {agencies.map((agency) => (
                    <SelectItem key={agency.id} value={agency.id}>
                      {agency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Modalidade</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma modalidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as modalidades</SelectItem>
                  {tenderTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {categories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Search Bar */}
        <div className=" rounded-lg border p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Input
                placeholder="Pesquisar licitações por título, descrição ou número"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Quick Filter Tags */}
        {activeQuickFilters.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              Filtros rápidos:
            </div>
            <div className="flex flex-wrap gap-2">
              {activeQuickFilters.map((filterId) => {
                const filter = quickFilters.find((f) => f.id === filterId);
                if (!filter) return null;

                return (
                  <Badge
                    key={filterId}
                    variant="secondary"
                    className={`${
                      filter.color === "orange"
                        ? "bg-orange-100 text-orange-700 border-orange-200"
                        : "bg-blue-100 text-blue-700 border-blue-200"
                    } px-3 py-1`}>
                    {filter.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Search Error */}
        {hasSearchError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Erro na busca</h3>
                <p className="text-sm text-red-700 mt-1">
                  {searchErrorMessage || "Ocorreu um erro ao buscar as licitações."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {isPending && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Buscando licitações...</span>
            </div>
          </div>
        )}

        {/* Results */}
        {!isPending && !hasSearchError && (
          <div className="space-y-4">
            {initialTenders.map((tender) => {
              const agencyData = getAgencyData(tender.agencies);

              return (
                <Link key={tender.id} href={`/dashboard/citizen/search/${tender.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-0">
                      <div className="flex">
                        {/* Left Date Section */}
                        <div className="bg-blue-600 text-white p-4 flex flex-col items-center justify-center min-w-[120px]">
                          <div className="text-xs font-medium">{tender.tender_number}</div>
                          <div className="mt-2 p-2  rounded">
                            <span className="text-2xl">{getTypeIcon(tender.tender_type)}</span>
                          </div>
                          <div className="text-xs mt-2 text-center">
                            {formatTenderType(tender.tender_type)}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Building className="h-4 w-4 text-blue-600" />
                                <h3 className="font-medium text-gray-900">{tender.title}</h3>
                              </div>

                              {tender.description && (
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                  {tender.description}
                                </p>
                              )}

                              <div className="space-y-1 text-xs text-gray-500">
                                <div>
                                  <span className="font-medium">Órgão:</span> {agencyData.name}
                                </div>

                                {tender.publication_date && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>Publicado em {formatDate(tender.publication_date)}</span>
                                  </div>
                                )}

                                {tender.opening_date && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>Abertura: {formatDate(tender.opening_date)}</span>
                                  </div>
                                )}

                                {tender.estimated_value && (
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    <span>{formatCurrency(tender.estimated_value)}</span>
                                  </div>
                                )}

                                {tender.category && (
                                  <div>
                                    <span className="font-medium">Categoria:</span>{" "}
                                    {tender.category}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Status */}
                            <div className="ml-4 flex flex-col items-end gap-2">
                              {getStatusBadge(tender.status)}

                              {agencyData.sphere && (
                                <Badge variant="outline" className="text-xs">
                                  {agencyData.sphere.charAt(0).toUpperCase() +
                                    agencyData.sphere.slice(1)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Action */}
                        <div className="bg-blue-600 p-4 flex items-center justify-center min-w-[80px]">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:bg-white/20">
                            <FileText className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* No Results */}
        {!isPending && !hasSearchError && initialTenders.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma licitação encontrada</h3>
            <p className="text-gray-600">Tente ajustar os filtros ou realizar uma nova pesquisa.</p>
          </div>
        )}

        {/* Pagination */}
        {!isPending && !hasSearchError && initialTenders.length > 0 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2">
              {currentPage > 1 && (
                <Link
                  href={`/dashboard/citizen/search?${new URLSearchParams({
                    ...searchParams,
                    page: (currentPage - 1).toString(),
                  }).toString()}`}>
                  <Button variant="outline" size="sm">
                    Anterior
                  </Button>
                </Link>
              )}

              <span className="px-4 py-2 text-sm text-gray-600">Página {currentPage}</span>

              {initialTenders.length > 10 && (
                <Link
                  href={`/dashboard/citizen/search?${new URLSearchParams({
                    ...searchParams,
                    page: (currentPage + 1).toString(),
                  }).toString()}`}>
                  <Button variant="outline" size="sm">
                    Próxima
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
