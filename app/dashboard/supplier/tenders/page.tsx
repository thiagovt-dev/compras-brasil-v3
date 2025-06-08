"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Agency {
  name: string;
}

interface Tender {
  id: string;
  title: string;
  description: string | null;
  agency_id: string;
  tender_number: string;
  tender_type: string;
  status: string;
  estimated_value: number | null;
  publication_date: string | null;
  opening_date: string | null;
  closing_date: string | null;
  created_at: string;
  agencies: Agency | null;
}

export default function SupplierTendersPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientSupabaseClient();

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("tenders")
          .select(
            `
            id,
            title,
            description,
            agency_id,
            tender_number,
            tender_type,
            status,
            estimated_value,
            publication_date,
            opening_date,
            closing_date,
            created_at,
            agencies (name)
          `
          )
          .eq("status", "published")
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Tipagem explícita para os dados transformados
        const transformedData: Tender[] = (data || []).map((tender: any) => ({
          ...tender,
          agencies: tender.agencies ? { name: tender.agencies.name } : null,
        }));

        // Combinar com dados mockados se necessário
        const allTenders = [...transformedData, ...getMockTenders()];
        setTenders(allTenders);
      } catch (err) {
        console.error("Error fetching tenders:", err);
        setError("Erro ao carregar licitações");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenders();
  }, [supabase]);

  // Função para gerar dados mockados com tipagem correta
  const getMockTenders = (): Tender[] => {
    return [
      {
        id: "1",
        title: "Aquisição de equipamentos de informática",
        description: null,
        agency_id: "mock-1",
        tender_number: "001/2023",
        tender_type: "pregao_eletronico",
        status: "published",
        estimated_value: 150000.0,
        publication_date: null,
        opening_date: "2024-01-10T00:00:00",
        closing_date: "2024-01-15T00:00:00",
        created_at: "2023-12-01T00:00:00",
        agencies: { name: "Ministério da Educação" },
      },
      {
        id: "2",
        title: "Contratação de serviços de limpeza",
        description: null,
        agency_id: "mock-2",
        tender_number: "002/2023",
        tender_type: "concorrencia",
        status: "published",
        estimated_value: 80000.0,
        publication_date: null,
        opening_date: "2024-01-15T00:00:00",
        closing_date: "2024-01-20T00:00:00",
        created_at: "2023-12-05T00:00:00",
        agencies: { name: "Prefeitura Municipal" },
      },
    ];
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "Não informado";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Não informado";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const getModalityName = (type: string) => {
    const modalities: Record<string, string> = {
      pregao_eletronico: "Pregão Eletrônico",
      concorrencia: "Concorrência",
      tomada_de_precos: "Tomada de Preços",
      convite: "Convite",
      leilao: "Leilão",
      concurso: "Concurso",
    };
    return modalities[type] || type;
  };

  const handleViewDetails = (tenderId: string) => {
    router.push(`/dashboard/tenders/${tenderId}`);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Buscar Licitações</h1>
        <p className="text-muted-foreground">
          Encontre novas oportunidades de licitações para participar
        </p>
      </div>

      <div className="flex gap-4">
        <Button>
          <Search className="mr-2 h-4 w-4" />
          Pesquisar
        </Button>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filtros
        </Button>
      </div>

      {tenders.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <p>Nenhuma licitação disponível no momento</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {tenders.map((tender) => (
            <Card key={tender.id}>
              <CardHeader>
                <CardTitle>{tender.title}</CardTitle>
                <CardDescription>
                  {tender.agencies?.name || "Órgão não especificado"} • Edital{" "}
                  {tender.tender_number}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <strong>Valor estimado:</strong> {formatCurrency(tender.estimated_value)}
                  </p>
                  <p>
                    <strong>Data de abertura:</strong> {formatDate(tender.opening_date)}
                  </p>
                  <p>
                    <strong>Data de encerramento:</strong> {formatDate(tender.closing_date)}
                  </p>
                  <p>
                    <strong>Modalidade:</strong> {getModalityName(tender.tender_type)}
                  </p>
                </div>
                <div className="mt-4">
                  <Button onClick={() => handleViewDetails(tender.id)}>Ver Detalhes</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
