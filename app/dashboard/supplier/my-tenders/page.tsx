"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Calendar,
  MapPin,
  Building2,
  FileText,
  Clock,
  DollarSign,
  Eye,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { getSession } from "@/lib/supabase/auth-utils";
import { getSupabaseClient } from "@/lib/supabase/client-singleton";
import { createClientSupabaseClient } from "@/lib/supabase/client";

interface Tender {
  id: string;
  title: string;
  description: string;
  status: string;
  opening_date: string;
  closing_date: string;
  estimated_value?: number;
  modality: string;
  agency: {
    name: string;
    city: string;
    state: string;
  };
  proposals: Array<{
    id: string;
    status: string;
    total_value?: number;
    created_at: string;
    updated_at: string;
  }>;
}

export default function MyTendersPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [myTenders, setMyTenders] = useState<Tender[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const supabase = createClientSupabaseClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const session = await getSession();

        setUser(session?.user);

        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session?.user?.id)
          .single();

        if (profileError || !profileData || profileData.profile_type !== "supplier") {
          router.push("/dashboard");
          return;
        }
        setProfile(profileData);

        // Fetch tenders with proposals
        let query = supabase
          .from("tenders")
          .select(
            `
            *,
            agency:agencies(name, address),
            proposals!inner(id, status, total_value, created_at, updated_at)
          `
          )
          .eq("proposals.supplier_id", profileData?.id)
          .order("created_at", { ascending: false });

        const { data: tendersData, error: tendersError } = await query;

        if (tendersError) throw tendersError;

        setMyTenders(tendersData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ocorreu um erro");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, router]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: "Rascunho", variant: "secondary" as const },
      published: { label: "Publicada", variant: "default" as const },
      active: { label: "Ativa", variant: "default" as const },
      in_progress: { label: "Em Andamento", variant: "default" as const },
      finished: { label: "Finalizada", variant: "outline" as const },
      cancelled: { label: "Cancelada", variant: "destructive" as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || {
      label: status,
      variant: "secondary" as const,
    };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getProposalStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: "Rascunho", variant: "secondary" as const },
      submitted: { label: "Enviada", variant: "default" as const },
      accepted: { label: "Aceita", variant: "default" as const },
      rejected: { label: "Rejeitada", variant: "destructive" as const },
      winner: { label: "Vencedora", variant: "default" as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || {
      label: status,
      variant: "secondary" as const,
    };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const filteredTenders = myTenders?.filter(
    (tender) =>
      tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.modality.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4">Carregando suas licitações...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-red-500 text-center max-w-md p-4 rounded-lg bg-red-50">
          <p className="font-medium">Erro ao carregar licitações</p>
          <p className="mt-2 text-sm">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minhas Licitações</h1>
          <p className="text-muted-foreground">Licitações onde você possui propostas enviadas</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/supplier/tenders">
            <Search className="h-4 w-4 mr-2" />
            Buscar Novas Licitações
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, órgão ou modalidade..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tenders List */}
      {filteredTenders && filteredTenders.length > 0 ? (
        <div className="grid gap-6">
          {filteredTenders.map((tender) => {
            const proposal = tender.proposals[0];
            return (
              <Card key={tender.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl">{tender.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {tender.description}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2">
                      {getStatusBadge(tender.status)}
                      {getProposalStatusBadge(proposal.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[1rem]">{tender.agency?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[1rem]">
                        {tender.agency?.city}, {tender.agency?.state}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[1rem]">
                        Abertura: {formatDate(tender.opening_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[1rem]">
                        Encerramento: {formatDate(tender.closing_date)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {tender.estimated_value && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-[1rem]">
                          Valor Estimado: {formatCurrency(tender.estimated_value)}
                        </span>
                      </div>
                    )}
                    {proposal.total_value && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-[1rem]">
                          Minha Proposta: {formatCurrency(proposal.total_value)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-[1rem] text-muted-foreground">
                      Modalidade: <span className="font-medium">{tender.modality}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/supplier/proposals/${proposal.id}`}>
                          <FileText className="h-4 w-4 mr-2" />
                          Ver Proposta
                        </Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link href={`/dashboard/supplier/my-tenders/${tender.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma licitação encontrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm
                ? "Nenhum resultado para sua busca."
                : "Você ainda não possui propostas enviadas para nenhuma licitação."}
            </p>
            <Button asChild>
              <Link href="/dashboard/supplier/tenders">
                <Search className="h-4 w-4 mr-2" />
                Buscar Licitações
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
