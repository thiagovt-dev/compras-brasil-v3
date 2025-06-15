"use client";

import { useState, useEffect } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { TrendingDown, Trophy, AlertCircle, Filter, Clock } from "lucide-react";
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
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <TrendingDown className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">Lances</h3>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="todos" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 rounded-none border-b bg-gray-50">
          <TabsTrigger value="todos" className="text-base">
            Todos
          </TabsTrigger>
          <TabsTrigger value="iniciados" className="text-base">
            Iniciados
          </TabsTrigger>
          <TabsTrigger value="negociacao" className="text-base">
            Em Negociação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="flex-1 overflow-y-auto p-4 mt-0">
          {loadingBids ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500">Carregando lances...</p>
              </div>
            </div>
          ) : bids.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-lg text-gray-500">Nenhum lance para exibir</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {bids.map((bid, index) => (
                <div
                  key={bid.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    index === 0
                      ? "bg-green-50 border-green-200 shadow-md"
                      : "bg-gray-50 border-gray-200"
                  } ${bid.user_id === userId ? "ring-2 ring-blue-300" : ""}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {index === 0 && <Trophy className="h-5 w-5 text-yellow-500" />}
                      <Badge
                        variant={index === 0 ? "default" : "outline"}
                        className="text-base px-3 py-1">
                        {index + 1}º
                      </Badge>
                      <span className="font-semibold text-lg text-gray-900">
                        {getUserDisplayName(
                          bid.user_id,
                          bid.user?.name || bid.user?.email || "Fornecedor"
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{formatTime(bid.created_at)}</span>
                    </div>
                    <div
                      className={`text-xl font-bold ${
                        index === 0 ? "text-green-600" : "text-gray-700"
                      }`}>
                      {formatValue(bid.value, bid.is_percentage)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="iniciados" className="flex-1 overflow-y-auto p-4 mt-0">
          <div className="flex items-center justify-center h-full text-gray-500 text-lg">
            Conteúdo para lances iniciados.
          </div>
        </TabsContent>

        <TabsContent value="negociacao" className="flex-1 overflow-y-auto p-4 mt-0">
          <div className="flex items-center justify-center h-full text-gray-500 text-lg">
            Conteúdo para lances em negociação.
          </div>
        </TabsContent>
      </Tabs>

      {/* Propostas Classificadas */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <h4 className="font-semibold text-lg mb-3 flex items-center gap-2 text-gray-900">
          <Filter className="h-5 w-5" />
          Propostas Classificadas
        </h4>
        {loadingProposals ? (
          <div className="flex items-center justify-center h-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Carregando propostas...</p>
            </div>
          </div>
        ) : proposals.length === 0 ? (
          <div className="text-center text-gray-500 py-4">Nenhuma proposta classificada.</div>
        ) : (
          <div className="space-y-2">
            {proposals.slice(0, 5).map((proposal, index) => (
              <div
                key={proposal.id}
                className="flex justify-between items-center p-3 bg-white rounded-lg border">
                <span className="font-medium text-gray-900">
                  {getUserDisplayName(
                    proposal.user_id,
                    proposal.profiles?.name || proposal.profiles?.email || "Fornecedor"
                  )}
                </span>
                <span className="font-bold text-gray-700">
                  {formatValue(proposal.value, false)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
