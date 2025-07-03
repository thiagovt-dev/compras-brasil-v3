"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, FileText, Plus, Loader2, AlertCircle, Calendar, DollarSign } from "lucide-react";

// Função para gerar dados mockados
const generateMockProposals = () => {
  const mockTenders = [
    {
      id: "mock-tender-1",
      title: "Aquisição de Equipamentos de Informática",
      description: "Contratação de empresa especializada para fornecimento de equipamentos de informática para modernização do parque tecnológico.",
      status: "published",
      agency: {
        id: "mock-agency-1",
        name: "Ministério da Educação",
        city: "Brasília",
        state: "DF",
      },
      modality: "Pregão Eletrônico",
      estimated_value: 150000,
      opening_date: "2024-01-15T10:00:00",
      closing_date: "2024-01-30T14:00:00",
    },
    {
      id: "mock-tender-2",
      title: "Serviços de Limpeza e Conservação",
      description: "Contratação de empresa para prestação de serviços de limpeza e conservação predial.",
      status: "in_progress",
      agency: {
        id: "mock-agency-2",
        name: "Prefeitura Municipal de São Paulo",
        city: "São Paulo",
        state: "SP",
      },
      modality: "Concorrência",
      estimated_value: 80000,
      opening_date: "2024-01-10T08:00:00",
      closing_date: "2024-01-25T16:00:00",
    },
    {
      id: "mock-tender-3",
      title: "Contratação de Serviços de Desenvolvimento de Software",
      description: "Desenvolvimento de sistema web para gestão de processos internos da organização.",
      status: "finished",
      agency: {
        id: "mock-agency-3",
        name: "Tribunal Regional do Trabalho",
        city: "Rio de Janeiro",
        state: "RJ",
      },
      modality: "Pregão Eletrônico",
      estimated_value: 200000,
      opening_date: "2023-12-01T09:00:00",
      closing_date: "2023-12-20T17:00:00",
    },
  ];

  const statuses = ["submitted", "under_analysis", "accepted", "rejected", "winner"];
  const types = ["lot", "item"];

  return mockTenders.map((tender, index) => {
    const proposalStatus = statuses[index % statuses.length];
    const proposalType = types[index % types.length];
    
    // Gerar valor da proposta baseado no valor estimado
    const proposalValue = tender.estimated_value * (0.85 + Math.random() * 0.2); // 85% a 105% do valor estimado
    
    const createdDate = new Date(tender.opening_date);
    createdDate.setDate(createdDate.getDate() + Math.floor(Math.random() * 5));
    
    const updatedDate = new Date(createdDate);
    updatedDate.setDate(updatedDate.getDate() + Math.floor(Math.random() * 3));

    return {
      id: `mock-proposal-${index + 1}`,
      tender_id: tender.id,
      lot_id: `lot-${index + 1}`,
      item_id: proposalType === "item" ? `item-${index + 1}` : null,
      type: proposalType,
      total_value: proposalValue,
      status: proposalStatus,
      created_at: createdDate.toISOString(),
      updated_at: proposalStatus === "submitted" ? createdDate.toISOString() : updatedDate.toISOString(),
      notes: index % 2 === 0 ? `Proposta ${proposalType === "item" ? "por item" : "por lote completo"} com condições especiais de entrega e garantia estendida.` : null,
      tenders: tender,
    };
  });
};

export default function SupplierProposalsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if user is authenticated
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/login");
          return;
        }
        setUser(user);

        // Get user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!profile || profile.profile_type !== "supplier") {
          router.replace("/dashboard");
          return;
        }
        setProfile(profile);

        // Get supplier proposals
        const { data: proposalsData, error: proposalsError } = await supabase
          .from("proposals")
          .select(
            `
            *,
            tenders!inner(
              id,
              title,
              description,
              status,
              modality,
              estimated_value,
              opening_date,
              closing_date,
              agency:agencies(
                id,
                name,
                city,
                state
              )
            )
          `
          )
          .eq("supplier_id", user.id)
          .order("created_at", { ascending: false });

        if (proposalsError) {
          console.error("Error fetching proposals:", proposalsError);
        }

        // Se não há dados reais ou array vazio, usar dados mockados
        if (!proposalsData || proposalsData.length === 0) {
          console.log("Nenhuma proposta real encontrada, usando dados mockados");
          const mockProposals = generateMockProposals();
          setProposals(mockProposals);
          setUsingMockData(true);
        } else {
          console.log("Dados reais encontrados:", proposalsData.length, "propostas");
          setProposals(proposalsData);
          setUsingMockData(false);
        }

      } catch (error) {
        console.error("Error in fetchData:", error);
        // Em caso de erro, usar dados mockados
        console.log("Erro ao buscar dados, usando dados mockados");
        const mockProposals = generateMockProposals();
        setProposals(mockProposals);
        setUsingMockData(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, supabase]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: "default" | "outline" | "secondary" | "destructive" }
    > = {
      draft: { label: "Rascunho", variant: "outline" },
      submitted: { label: "Enviada", variant: "default" },
      under_analysis: { label: "Em Análise", variant: "secondary" },
      accepted: { label: "Aceita", variant: "default" },
      rejected: { label: "Rejeitada", variant: "destructive" },
      winner: { label: "Vencedora", variant: "default" },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTenderStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: "default" | "outline" | "secondary" | "destructive" }
    > = {
      draft: { label: "Rascunho", variant: "secondary" },
      published: { label: "Publicada", variant: "default" },
      active: { label: "Ativa", variant: "default" },
      in_progress: { label: "Em Andamento", variant: "default" },
      finished: { label: "Finalizada", variant: "outline" },
      cancelled: { label: "Cancelada", variant: "destructive" },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant={type === "item" ? "secondary" : "outline"} className="ml-2">
        {type === "item" ? "Por Item" : "Por Lote"}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Data não definida";
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(dateString));
    } catch (error) {
      return "Data inválida";
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getProposalDetailsLink = (proposal: any) => {
    if (usingMockData) {
      return `/dashboard/tenders/${proposal.tender_id}`;
    }
    return `/dashboard/supplier/proposals/${proposal.id}`;
  };

  if (loading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando suas propostas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className=" py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Minhas Propostas</h1>
          <p className="text-muted-foreground">
            Gerencie suas propostas para licitações
            {usingMockData && " (dados de demonstração)"}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/supplier/tenders">
            <Plus className="mr-2 h-4 w-4" />
            Nova Proposta
          </Link>
        </Button>
      </div>

      {/* Indicador de dados mockados */}
      {usingMockData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <p className="text-sm text-blue-800">
              <strong>Modo Demonstração:</strong> Você ainda não possui propostas reais. 
              Exibindo propostas de exemplo para demonstrar as funcionalidades.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {proposals && proposals.length > 0 ? (
          proposals.map((proposal) => (
            <Card key={proposal.id} className="h-full flex flex-col hover:shadow-lg transition-shadow w-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-medium line-clamp-2">
                    {proposal.tenders?.title || "Licitação sem título"}
                  </CardTitle>
                  <div className="flex flex-col gap-1">
                    {getStatusBadge(proposal.status)}
                    {proposal.type && getTypeBadge(proposal.type)}
                  </div>
                </div>
                <CardDescription className="space-y-1">
                  <div>ID: {proposal.tenders?.id || "N/A"}</div>
                  {proposal.lot_id && (
                    <div>Lote: {proposal.lot_id}</div>
                  )}
                  {proposal.item_id && (
                    <div>Item: {proposal.item_id}</div>
                  )}
                  <div className="flex items-center gap-1 text-xs">
                    <Calendar className="h-3 w-3" />
                    {proposal.tenders?.agency?.city}, {proposal.tenders?.agency?.state}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2 space-y-3 flex-grow">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Valor da Proposta:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(proposal.total_value || 0)}
                    </span>
                  </div>
                  {proposal.tenders?.estimated_value && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Valor Estimado:</span>
                      <span className="text-sm">
                        {formatCurrency(proposal.tenders.estimated_value)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Enviada em:</span>
                    <span className="text-sm">{formatDate(proposal.created_at || "")}</span>
                  </div>
                  {proposal.updated_at && proposal.updated_at !== proposal.created_at && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Atualizada em:</span>
                      <span className="text-sm">{formatDate(proposal.updated_at)}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Modalidade:</span>
                    <span className="text-sm">{proposal.tenders?.modality || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Status da Licitação:</span>
                    {getTenderStatusBadge(proposal.tenders?.status || "unknown")}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Órgão:</span>
                    <span className="text-sm text-right line-clamp-2">
                      {proposal.tenders?.agency?.name || "N/A"}
                    </span>
                  </div>
                </div>

                {proposal.notes && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Observações:</span>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {proposal.notes}
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-2">
                <Button variant="outline" asChild className="w-full">
                  <Link href={getProposalDetailsLink(proposal)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Ver Detalhes
                    <ArrowRight className="ml-auto h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full p-8 text-center border rounded-lg bg-muted">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma proposta encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Você ainda não enviou nenhuma proposta para licitações.
            </p>
            <Button asChild>
              <Link href="/dashboard/supplier/tenders">
                <Plus className="mr-2 h-4 w-4" />
                Buscar Licitações para Participar
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}