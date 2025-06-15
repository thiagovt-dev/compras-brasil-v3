"use client";

import { useState, useEffect } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DisputeHeader } from "@/components/dispute-header";
import { DisputeChat } from "@/components/dispute-chat";
import { DisputeControls } from "@/components/dispute-controls";
import { Eye, Users } from "lucide-react";
import { DisputeMainContent } from "./dispute-main-content";
import { DisputeRightPanel } from "./dispute-right-panel";

interface DisputeRoomProps {
  tender: any;
  isAuctioneer: boolean;
  isSupplier: boolean;
  isCitizen: boolean;
  userId: string;
  profile: any;
}

export default function DisputeRoom({
  tender,
  isAuctioneer,
  isSupplier,
  isCitizen,
  userId,
  profile,
}: DisputeRoomProps) {
  const [disputeStatus, setDisputeStatus] = useState<string>("waiting");
  const [activeLot, setActiveLot] = useState<any>(null);
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [disputeMode, setDisputeMode] = useState<string>("open");

  const supabase = createClientSupabaseClient();
  const { toast } = useToast();

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const { data: dispute } = await supabase
          .from("tender_disputes")
          .select("*")
          .eq("tender_id", tender.id)
          .single();

        if (dispute) {
          setDisputeStatus(dispute.status);
          setDisputeMode(dispute.dispute_mode || "open");
          if (dispute.active_lot_id) {
            const foundLot = tender.lots.find((lot: any) => lot.id === dispute.active_lot_id);
            setActiveLot(foundLot || null);
          }
        } else {
          if (isAuctioneer) {
            const { error: createError } = await supabase.from("tender_disputes").insert({
              tender_id: tender.id,
              status: "waiting",
              active_lot_id: null,
              created_by: userId,
              dispute_mode: "open",
            });
            if (createError) throw createError;
          }
        }

        setLots(tender.lots || []);
      } catch (error) {
        console.error("Erro ao carregar dados iniciais da disputa:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados da disputa.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    const disputeSubscription = supabase
      .channel("tender_disputes_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tender_disputes",
          filter: `tender_id=eq.${tender.id}`,
        },
        (payload) => {
          const newData = payload.new as any;
          setDisputeStatus(newData.status);
          setDisputeMode(newData.dispute_mode || "open");
          if (newData.active_lot_id) {
            const foundLot = tender.lots.find((lot: any) => lot.id === newData.active_lot_id);
            setActiveLot(foundLot || null);
          } else {
            setActiveLot(null);
          }
        }
      )
      .subscribe();

    return () => {
      disputeSubscription.unsubscribe();
    };
  }, [tender, isAuctioneer, userId, supabase, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Carregando sala de disputa...</p>
        </div>
      </div>
    );
  }

  const getUserTypeInfo = () => {
    if (isAuctioneer) {
      return {
        icon: <Users className="h-5 w-5" />,
        label: "Pregoeiro",
        description: "Você pode gerenciar esta disputa",
        variant: "default" as const,
      };
    }
    if (isSupplier) {
      return {
        icon: <Users className="h-5 w-5" />,
        label: "Fornecedor",
        description: "Você pode participar desta disputa",
        variant: "default" as const,
      };
    }
    return {
      icon: <Eye className="h-5 w-5" />,
      label: "Observador",
      description: "Você pode acompanhar esta disputa",
      variant: "secondary" as const,
    };
  };

  const userInfo = getUserTypeInfo();
  const supplierIdentifier = isSupplier
    ? `FORNECEDOR ${userId.substring(0, 8).toUpperCase()}`
    : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header da Sala de Disputa - Ocupa toda a largura */}
      <DisputeHeader
        tender={tender}
        disputeStatus={disputeStatus}
        currentTime={currentTime}
        userInfo={userInfo}
        supplierIdentifier={supplierIdentifier}
        disputeMode={disputeMode}
      />

      {/* Controles do Pregoeiro */}
      {isAuctioneer && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <DisputeControls
            tenderId={tender.id}
            status={disputeStatus}
            activeLot={activeLot}
            lots={lots}
            userId={userId}
          />
        </div>
      )}

      {/* Layout Principal - Usa toda a largura da tela */}
      <div className="flex-1 flex">
        {/* Coluna da Esquerda: Chat - 25% da largura */}
        <div className="w-1/4 bg-white border-r border-gray-200">
          <DisputeChat
            tenderId={tender.id}
            activeLotId={activeLot?.id || null}
            isAuctioneer={isAuctioneer}
            isSupplier={isSupplier}
            isCitizen={isCitizen}
            userId={userId}
            status={disputeStatus}
          />
        </div>

        {/* Coluna Central: Conteúdo Principal da Disputa - 50% da largura */}
        <div className="w-1/2 bg-gray-50">
          <DisputeMainContent
            tenderId={tender.id}
            activeLot={activeLot}
            disputeStatus={disputeStatus}
            disputeMode={disputeMode}
            isAuctioneer={isAuctioneer}
            isSupplier={isSupplier}
            userId={userId}
            profile={profile}
          />
        </div>

        {/* Coluna da Direita: Painel de Lances e Propostas - 25% da largura */}
        <div className="w-1/4 bg-white border-l border-gray-200">
          <DisputeRightPanel
            tenderId={tender.id}
            activeLotId={activeLot?.id || null}
            isAuctioneer={isAuctioneer}
            isSupplier={isSupplier}
            isCitizen={isCitizen}
            userId={userId}
            disputeStatus={disputeStatus}
          />
        </div>
      </div>
    </div>
  );
}
