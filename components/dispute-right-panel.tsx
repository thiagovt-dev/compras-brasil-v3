"use client";

import { useState, useEffect } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { TrendingDown, Trophy, AlertCircle, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DisputeRightPanelProps {
  tenderId: string;
  activeLotId: string | null;
  isAuctioneer: boolean;
  isSupplier: boolean;
  isCitizen: boolean;
  userId: string;
  disputeStatus: string;
}

interface Bid {
  id: string;
  user_id: string;
  value: number;
  created_at: string;
  status: "active" | "cancelled";
  is_percentage: boolean;
  user?: {
    name?: string;
    email?: string;
  };
}

interface Proposal {
  id: string;
  user_id: string;
  value: number;
  profiles: {
    name?: string;
    email?: string;
  };
}

export function DisputeRightPanel({
  tenderId,
  activeLotId,
  isAuctioneer,
  isSupplier,
  isCitizen,
  userId,
  disputeStatus,
}: DisputeRightPanelProps) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loadingBids, setLoadingBids] = useState(true);
  const [loadingProposals, setLoadingProposals] = useState(true);
  const supabase = createClientSupabaseClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!activeLotId) {
      setBids([]);
      setProposals([]);
      setLoadingBids(false);
      setLoadingProposals(false);
      return;
    }

    const loadBids = async () => {
      setLoadingBids(true);
      try {
        const { data, error } = await supabase
          .from("tender_bids")
          .select(
            `
            *,
            profiles:user_id(name, email)
          `
          )
          .eq("tender_id", tenderId)
          .eq("lot_id", activeLotId)
          .eq("status", "active")
          .order("value", { ascending: true });

        if (error) throw error;

        setBids(data || []);
      } catch (error) {
        console.error("Erro ao carregar lances:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os lances.",
          variant: "destructive",
        });
      } finally {
        setLoadingBids(false);
      }
    };

    const loadProposals = async () => {
      setLoadingProposals(true);
      try {
        const { data, error } = await supabase
          .from("tender_proposals")
          .select(
            `
            *,
            profiles:user_id(name, email)
          `
          )
          .eq("tender_id", tenderId)
          .eq("tender_lot_id", activeLotId)
          .order("value", { ascending: true });

        if (error) throw error;

        setProposals(data || []);
      } catch (error) {
        console.error("Erro ao carregar propostas classificadas:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as propostas classificadas.",
          variant: "destructive",
        });
      } finally {
        setLoadingProposals(false);
      }
    };

    loadBids();
    loadProposals();

    // Realtime subscriptions
    const bidsSubscription = supabase
      .channel(`bids_lot_${activeLotId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tender_bids",
          filter: `lot_id=eq.${activeLotId}`,
        },
        () => {
          loadBids();
        }
      )
      .subscribe();

    const proposalsSubscription = supabase
      .channel(`proposals_lot_${activeLotId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tender_proposals",
          filter: `tender_lot_id=eq.${activeLotId}`,
        },
        () => {
          loadProposals();
        }
      )
      .subscribe();

    return () => {
      bidsSubscription.unsubscribe();
      proposalsSubscription.unsubscribe();
    };
  }, [tenderId, activeLotId, supabase, toast]);

  const formatValue = (value: number, isPercentage: boolean) => {
    if (isPercentage) {
      return `${value.toFixed(2).replace(".", ",")}%`;
    }
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getUserDisplayName = (user_id: string, defaultName: string) => {
    if (isAuctioneer) {
      return defaultName;
    }
    if (user_id === userId) {
      return "Você";
    }
    return `FORNECEDOR ${user_id.substring(0, 8).toUpperCase()}`;
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Lances
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <Tabs defaultValue="todos" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="iniciados">Iniciados</TabsTrigger>
            <TabsTrigger value="negociacao">Em Negociação</TabsTrigger>
          </TabsList>
          <TabsContent value="todos" className="flex-1 overflow-y-auto p-4">
            {loadingBids ? (
              <div className="flex items-center justify-center h-full">Carregando lances...</div>
            ) : bids.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-center">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Nenhum lance para exibir</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {bids.map((bid, index) => (
                  <div
                    key={bid.id}
                    className={`flex items-center justify-between p-3 rounded-md border ${
                      index === 0 ? "bg-green-50 border-green-200" : "bg-gray-50"
                    } ${bid.user_id === userId ? "ring-2 ring-blue-200" : ""}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                        <Badge variant={index === 0 ? "default" : "outline"}>{index + 1}º</Badge>
                      </div>
                      <div>
                        <div className="font-medium">
                          {getUserDisplayName(
                            bid.user_id,
                            bid.user?.name || bid.user?.email || "Fornecedor"
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{formatTime(bid.created_at)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-bold ${index === 0 ? "text-green-600" : "text-gray-700"}`}>
                        {formatValue(bid.value, bid.is_percentage)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="iniciados" className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Conteúdo para lances iniciados.
            </div>
          </TabsContent>
          <TabsContent value="negociacao" className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Conteúdo para lances em negociação.
            </div>
          </TabsContent>
        </Tabs>

        <div className="p-4 border-t">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Propostas Classificadas
          </h3>
          {loadingProposals ? (
            <div className="flex items-center justify-center h-24">Carregando propostas...</div>
          ) : proposals.length === 0 ? (
            <div className="text-muted-foreground text-sm text-center">
              Nenhuma proposta classificada.
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              {proposals.map((proposal, index) => (
                <div
                  key={proposal.id}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                  <span className="font-medium">
                    {getUserDisplayName(
                      proposal.user_id,
                      proposal.profiles?.name || proposal.profiles?.email || "Fornecedor"
                    )}
                  </span>
                  <span className="font-bold">{formatValue(proposal.value, false)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
// This component is used to display the right panel in the dispute room, showing bids and proposals.