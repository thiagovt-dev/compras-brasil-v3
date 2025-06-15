"use client";

import { useState, useEffect } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Filter, Package } from "lucide-react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DisputeRightPanelProps {
  tenderId: string;
  activeLot: any | null; // Agora recebe o objeto do lote ativo
  isAuctioneer: boolean;
  isSupplier: boolean;
  isCitizen: boolean;
  userId: string;
  disputeStatus: string;
}

interface Proposal {
  id: string;
  user_id: string;
  value: number;
  profiles: {
    name?: string;
    email?: string;
  };
  items?: any[]; // Adicionado para incluir itens da proposta
}

export function DisputeRightPanel({
  tenderId,
  activeLot,
  isAuctioneer,
  isSupplier,
  isCitizen,
  userId,
  disputeStatus,
}: DisputeRightPanelProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(true);
  const supabase = createClientSupabaseClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!activeLot) {
      setProposals([]);
      setLoadingProposals(false);
      return;
    }

    const loadProposals = async () => {
      setLoadingProposals(true);
      try {
        const { data, error } = await supabase
          .from("tender_proposals")
          .select(
            `
            *,
            profiles:user_id(name, email),
            items:tender_proposal_items(*)
          `
          )
          .eq("tender_id", tenderId)
          .eq("tender_lot_id", activeLot.id)
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

    loadProposals();

    const proposalsSubscription = supabase
      .channel(`proposals_lot_${activeLot.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tender_proposals",
          filter: `tender_lot_id=eq.${activeLot.id}`,
        },
        () => {
          loadProposals();
        }
      )
      .subscribe();

    return () => {
      proposalsSubscription.unsubscribe();
    };
  }, [tenderId, activeLot, supabase, toast]);

  const formatValue = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Propostas Classificadas
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        {!activeLot ? (
          <div className="flex items-center justify-center h-full text-center text-gray-500">
            Selecione um lote para ver as propostas e itens.
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {/* Propostas Classificadas */}
            <div>
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
                  {proposals.map((proposal, index) => (
                    <div
                      key={proposal.id}
                      className={`flex justify-between items-center p-3 rounded-lg border ${
                        index === 0 ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                      }`}>
                      <span className="font-medium text-gray-900">
                        {getUserDisplayName(
                          proposal.user_id,
                          proposal.profiles?.name || proposal.profiles?.email || "Fornecedor"
                        )}
                      </span>
                      <span className="font-bold text-gray-700">{formatValue(proposal.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Itens Do Lote */}
            <div className="mt-6">
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2 text-gray-900">
                <Package className="h-5 w-5" />
                Itens Do Lote
              </h4>
              {activeLot.items && activeLot.items.length > 0 ? (
                <div className="space-y-2">
                  {activeLot.items.map((item: any) => (
                    <div key={item.id} className="p-3 bg-gray-50 rounded-lg border">
                      <p className="font-medium text-gray-900">{item.description}</p>
                      <p className="text-sm text-gray-600">
                        Referência: {item.reference} • {item.quantity} {item.unit}
                      </p>
                      <p className="font-bold text-gray-700 mt-1">
                        {formatValue(item.estimated_value || 0)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">Nenhum item para este lote.</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </div>
  );
}
