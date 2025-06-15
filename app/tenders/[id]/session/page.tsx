"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { DisputeChat } from "@/components/dispute-chat";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, FileText } from "lucide-react";

const SessionPage = () => {
  const { id: tenderId } = useParams();
  const [tender, setTender] = useState<any>(null);
  const [activeLotId, setActiveLotId] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientSupabaseClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar sessão do usuário
        const {
          data: { session: userSession },
        } = await supabase.auth.getSession();
        setSession(userSession);

        if (!userSession) {
          window.location.href = "/login";
          return;
        }

        // Buscar dados da licitação
        const { data: tenderData, error } = await supabase
          .from("tenders")
          .select(
            `
            id,
            title,
            number,
            status,
            opening_date,
            pregoeiro_id,
            agencies!inner (
              name
            )
          `
          )
          .eq("id", tenderId)
          .single();

        if (error) {
          console.error("Erro ao buscar licitação:", error);
          return;
        }

        setTender(tenderData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    if (tenderId) {
      fetchData();
    }
  }, [tenderId, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecionando para login...</div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Licitação não encontrada</div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Rascunho", variant: "secondary" as const },
      published: { label: "Publicada", variant: "default" as const },
      active: { label: "Ativa", variant: "default" as const },
      in_progress: { label: "Em Andamento", variant: "default" as const },
      completed: { label: "Concluída", variant: "outline" as const },
      cancelled: { label: "Cancelada", variant: "destructive" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header da Sessão */}
      <div className="bg-blue-600 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{tender.title}</h1>
              <p className="text-blue-100">Pregão Eletrônico Nº {tender.number}</p>
              <p className="text-blue-100">{tender.agencies?.[0]?.name}</p>
            </div>
            <div className="text-right">
              {getStatusBadge(tender.status)}
              <div className="flex items-center gap-2 mt-2 text-blue-100">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  {tender.opening_date ? formatDate(tender.opening_date) : "Data não definida"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat de Mensagens - 25% */}
          <div className="lg:col-span-1">
            <Card className="h-[600px]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Mensagens
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-80px)]">
                <DisputeChat
                  tenderId={tenderId as string}
                  activeLotId={activeLotId}
                  isAuctioneer={session.user.id === tender.pregoeiro_id}
                  isSupplier={true} // Temporário para teste
                  isCitizen={false}
                  userId={session.user.id}
                  status={tender.status}
                />
              </CardContent>
            </Card>
          </div>

          {/* Área Central - 50% */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Área de Disputa
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[calc(100%-80px)]">
                <div className="text-center text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Nenhum lote selecionado</h3>
                  <p className="text-sm">Aguardando o pregoeiro selecionar um lote.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Painel de Lances - 25% */}
          <div className="lg:col-span-1">
            <Card className="h-[600px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Lances</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[calc(100%-80px)]">
                <div className="text-center text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Users className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Nenhum lance para exibir</h3>
                  <p className="text-sm">Os lances aparecerão aqui quando a disputa iniciar.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionPage;
