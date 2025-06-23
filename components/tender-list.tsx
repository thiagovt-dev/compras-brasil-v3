"use client";

import { useState, useEffect } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { TenderCard } from "@/components/tender-card";
import { TenderFilters } from "@/components/tender-filters";
import { TenderSort } from "@/components/tender-sort";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface TenderListProps {
  initialTenders?: any[];
  showAgency?: boolean;
  agencyId?: string;
  showFilters?: boolean;
  showSort?: boolean;
  limit?: number;
  className?: string;
}

// Função para gerar dados mockados
const generateMockTenders = (count: number = 6) => {
  const modalities = ["Pregão Eletrônico", "Concorrência", "Tomada de Preços", "Convite"];
  const categories = ["Tecnologia", "Obras", "Serviços", "Material"];
  const agencies = [
    { id: "mock-1", name: "Prefeitura Municipal de São Paulo" },
    { id: "mock-2", name: "Governo do Estado de SP" },
    { id: "mock-3", name: "Secretaria de Saúde" },
    { id: "mock-4", name: "Secretaria de Educação" },
    { id: "mock-5", name: "Departamento de Trânsito" },
  ];

  return Array.from({ length: count }).map((_, index) => {
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30));
    
    const openingDate = new Date();
    openingDate.setDate(openingDate.getDate() + Math.floor(Math.random() * 15) + 1);
    
    const closingDate = new Date(openingDate);
    closingDate.setDate(closingDate.getDate() + Math.floor(Math.random() * 10) + 5);

    const agency = agencies[Math.floor(Math.random() * agencies.length)];
    const modality = modalities[Math.floor(Math.random() * modalities.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];

    return {
      id: `mock-tender-${index + 1}`,
      number: `2024/${String(index + 1).padStart(3, '0')}`,
      title: `Licitação para ${category} - ${agency.name.split(' ').pop()}`,
      description: `Processo licitatório para contratação de ${category.toLowerCase()} visando atender às necessidades da ${agency.name}. Modalidade: ${modality}.`,
      modality,
      category,
      status: "published",
      estimated_value: (Math.random() * 900000 + 100000), // Entre 100k e 1M
      opening_date: openingDate.toISOString(),
      closing_date: closingDate.toISOString(),
      created_at: createdDate.toISOString(),
      updated_at: createdDate.toISOString(),
      agency_id: agency.id,
      agency: agency,
      impugnation_deadline: openingDate.toISOString(),
      clarification_deadline: openingDate.toISOString(),
      proposal_deadline: closingDate.toISOString(),
      session_date: closingDate.toISOString(),
      documents: [],
      lots: [],
      is_mock: true, // Flag para identificar dados mockados
    };
  });
};

export function TenderList({
  initialTenders = [],
  showAgency = true,
  agencyId,
  showFilters = true,
  showSort = true,
  limit = 50,
  className = "",
}: TenderListProps) {
  const supabase = createClientSupabaseClient();
  const [tenders, setTenders] = useState<any[]>(initialTenders);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(initialTenders.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    modality: "",
    category: "",
    agency_id: agencyId || "",
    status: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    onlyOpen: true,
  });
  const [sort, setSort] = useState({
    field: "opening_date",
    direction: "asc" as "asc" | "desc",
  });

  // Fetch agencies for filters
  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        const { data, error } = await supabase
          .from("agencies")
          .select("id, name")
          .eq("status", "published");

        if (error) throw error;

        setAgencies(data || []);
      } catch (error: any) {
        console.error("Error fetching agencies:", error);
        // Se falhar ao buscar agencies, usar dados mockados
        const mockAgencies = [
          { id: "mock-1", name: "Prefeitura Municipal de São Paulo" },
          { id: "mock-2", name: "Governo do Estado de SP" },
          { id: "mock-3", name: "Secretaria de Saúde" },
          { id: "mock-4", name: "Secretaria de Educação" },
          { id: "mock-5", name: "Departamento de Trânsito" },
        ];
        setAgencies(mockAgencies);
      }
    };

    fetchAgencies();
  }, [supabase]);

  // Fetch tenders with filters and sorting
  const fetchTenders = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      let query = supabase
        .from("tenders")
        .select("*")
        .order(sort.field, { ascending: sort.direction === "asc" })
        .limit(limit);

      // Apply filters
      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,number.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      if (filters.modality) {
        query = query.eq("modality", filters.modality);
      }

      if (filters.category) {
        query = query.eq("category", filters.category);
      }

      if (filters.agency_id) {
        query = query.eq("agency_id", filters.agency_id);
      }

      if (filters.status) {
        query = query.eq("status", filters.status);
      } else if (filters.onlyOpen) {
        query = query.eq("status", "published");
      }

      if (filters.startDate) {
        query = query.gte("opening_date", filters.startDate.toISOString());
      }

      if (filters.endDate) {
        // Add one day to include the end date
        const endDate = new Date(filters.endDate);
        endDate.setDate(endDate.getDate() + 1);
        query = query.lt("opening_date", endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Buscar agencies separadamente se showAgency for true
      let tendersWithAgencies = data || [];
      if (showAgency && data && data.length > 0) {
        const agencyIds = [...new Set(data.map((tender) => tender.agency_id).filter(Boolean))];

        if (agencyIds.length > 0) {
          const { data: agenciesData } = await supabase
            .from("agencies")
            .select("id, name")
            .in("id", agencyIds);

          // Mapear agencies para os tenders
          tendersWithAgencies = data.map((tender) => ({
            ...tender,
            agency: agenciesData?.find((agency) => agency.id === tender.agency_id) || null,
          }));
        }
      }

      // Se não há dados reais, usar dados mockados
      if (!tendersWithAgencies || tendersWithAgencies.length === 0) {
        console.log("Nenhum dado real encontrado, usando dados mockados");
        const mockTenders = generateMockTenders(6);
        setTenders(mockTenders);
        setUsingMockData(true);
        
        // Toast informativo (opcional)
        if (!isRefreshing) {
          toast({
            title: "Exibindo dados de exemplo",
            description: "Mostrando licitações de exemplo para demonstração.",
            duration: 3000,
          });
        }
      } else {
        console.log("Dados reais encontrados:", tendersWithAgencies.length);
        setTenders(tendersWithAgencies);
        setUsingMockData(false);
      }
    } catch (error: any) {
      console.error("Error fetching tenders:", error);
      
      // Em caso de erro, usar dados mockados
      console.log("Erro ao carregar dados reais, usando dados mockados");
      const mockTenders = generateMockTenders(6);
      setTenders(mockTenders);
      setUsingMockData(true);
      
      toast({
        title: "Erro ao conectar",
        description: "Exibindo dados de exemplo. Verifique sua conexão.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch tenders when filters or sort change
  useEffect(() => {
    fetchTenders();
  }, [filters, sort]);

  // Initialize with mock data if no initial tenders
  useEffect(() => {
    if (initialTenders.length === 0) {
      const mockTenders = generateMockTenders(6);
      setTenders(mockTenders);
      setUsingMockData(true);
      setLoading(false);
    }
  }, [initialTenders]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleSortChange = (newSort: { field: string; direction: "asc" | "desc" }) => {
    setSort(newSort);
  };

  const handleRefresh = () => {
    fetchTenders(true);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Indicador de dados mockados */}
      {usingMockData && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            <strong>Modo Demonstração:</strong> Exibindo dados de exemplo. 
            Os dados reais aparecerão quando disponíveis.
          </p>
        </div>
      )}

      {showFilters && (
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <TenderFilters onFilterChange={handleFilterChange} agencies={agencies} />
          <div className="flex items-center gap-2">
            {showSort && <TenderSort onSortChange={handleSortChange} currentSort={sort} />}
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : tenders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenders.map((tender) => (
            <TenderCard key={tender.id} tender={tender} showAgency={showAgency} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">Nenhuma licitação encontrada.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Tente ajustar os filtros ou criar uma nova licitação.
          </p>
        </div>
      )}
    </div>
  );
}