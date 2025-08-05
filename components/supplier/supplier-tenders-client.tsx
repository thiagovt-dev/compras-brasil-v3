"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Calendar, MapPin, Building2, Eye, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";

interface SupplierTendersClientProps {
  initialTenders: Tender[];
  agencies: Agency[];
  categories: string[];
  tenderTypes: TenderType[];
  statuses: TenderStatus[];
  searchParams: {
    query?: string;
    agency_id?: string;
    tender_type?: string;
    status?: string;
    category?: string;
    opening_date_from?: string;
    opening_date_to?: string;
  };
  currentPage: number;
  hasSearchError: boolean;
  searchErrorMessage?: string;
}

const statusColors: Record<string, string> = {
  published: "bg-green-100 text-green-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

const tenderTypeLabels: Record<string, string> = {
  pregao_eletronico: "Pregão Eletrônico",
  concorrencia: "Concorrência",
  tomada_de_precos: "Tomada de Preços",
  convite: "Convite",
  leilao: "Leilão",
  concurso: "Concurso",
};

export default function SupplierTendersClient({
  initialTenders,
  agencies,
  categories,
  tenderTypes,
  statuses,
  searchParams,
  currentPage,
  hasSearchError,
  searchErrorMessage,
}: SupplierTendersClientProps) {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const { toast } = useToast();

  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [localSearchParams, setLocalSearchParams] = useState(searchParams);

  const updateSearchParam = useCallback((key: string, value: string) => {
    setLocalSearchParams(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  }, []);

  const handleSearch = useCallback(() => {
    setIsSearching(true);
    
    const params = new URLSearchParams();
    
    Object.entries(localSearchParams).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value);
      }
    });
    
    // Reset para primeira página ao fazer nova busca
    params.delete('page');
    
    const queryString = params.toString();
    const url = queryString ? `?${queryString}` : '';
    
    router.push(`/dashboard/supplier/tenders${url}`);
    
    // Simular delay de busca
    setTimeout(() => setIsSearching(false), 1000);
  }, [localSearchParams, router]);

  const clearFilters = useCallback(() => {
    setLocalSearchParams({});
    router.push('/dashboard/supplier/tenders');
  }, [router]);

  const viewTenderDetails = (tenderId: string) => {
    router.push(`/dashboard/supplier/tenders/${tenderId}`);
  };

  const toggleFavorite = async (tenderId: string) => {
    // Implementar toggle de favorito aqui
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Sistema de favoritos será implementado em breve.",
    });
  };

  if (hasSearchError) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">
          <p className="font-semibold">Erro ao buscar licitações</p>
          <p className="text-sm">{searchErrorMessage}</p>
        </div>
        <Button onClick={() => window.location.reload()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros de busca */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filtros de Busca</CardTitle>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca por texto */}
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por título, número ou descrição..."
              value={localSearchParams.query || ''}
              onChange={(e) => updateSearchParam('query', e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              <Search className="mr-2 h-4 w-4" />
              {isSearching ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>

          {/* Filtros avançados */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <Select
                value={localSearchParams.agency_id || 'all'}
                onValueChange={(value) => updateSearchParam('agency_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Órgão" />
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

              <Select
                value={localSearchParams.tender_type || 'all'}
                onValueChange={(value) => updateSearchParam('tender_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Modalidade" />
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

              <Select
                value={localSearchParams.category || 'all'}
                onValueChange={(value) => updateSearchParam('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
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

              <div className="flex gap-2">
                <Button variant="outline" onClick={clearFilters} className="flex-1">
                  Limpar
                </Button>
                <Button onClick={handleSearch} disabled={isSearching} className="flex-1">
                  Aplicar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultados */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {initialTenders.length === 0 
              ? 'Nenhuma licitação encontrada'
              : `${initialTenders.length} licitação(ões) encontrada(s)`
            }
          </p>
        </div>

        {initialTenders.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">
                Nenhuma licitação encontrada com os filtros aplicados.
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Limpar filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {initialTenders.map((tender) => (
              <Card key={tender.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{tender.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Building2 className="h-4 w-4" />
                        {tender.agencies?.name}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge className={statusColors[tender.status] || statusColors.published}>
                        {statuses.find(s => s.value === tender.status)?.label || tender.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(tender.id)}
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Valor Estimado</p>
                      <p className="font-semibold">
                        {tender.estimated_value 
                          ? formatCurrency(tender.estimated_value)
                          : 'Não informado'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Modalidade</p>
                      <p className="font-semibold">
                        {tenderTypeLabels[tender.tender_type] || tender.tender_type}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data de Abertura</p>
                      <p className="font-semibold flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {tender.opening_date 
                          ? formatDate(tender.opening_date)
                          : 'Não informada'
                        }
                      </p>
                    </div>
                  </div>
                  
                  {tender.description && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {tender.description}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{tender.agencies?.sphere || 'Federal'}</span>
                      {tender.tender_number && (
                        <>
                          <span>•</span>
                          <span>Nº {tender.tender_number}</span>
                        </>
                      )}
                    </div>
                    <Button onClick={() => viewTenderDetails(tender.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}