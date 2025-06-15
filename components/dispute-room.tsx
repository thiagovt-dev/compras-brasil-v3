"use client";

import { useState, useEffect } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const [activeLot, setActiveLot] = useState<any>(null); // Store active lot object
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [disputeMode, setDisputeMode] = useState<string>("open"); // Default mode

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
    // Carregar dados iniciais
    const loadInitialData = async () => {
      try {
        // Carregar status da disputa
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
          // If no dispute record, create one for auctioneer
          if (isAuctioneer) {
            const { error: createError } = await supabase.from("tender_disputes").insert({
              tender_id: tender.id,
              status: "waiting",
              active_lot_id: null,
              created_by: userId,
              dispute_mode: "open", // Default mode
            });
            if (createError) throw createError;
          }
        }

        // Carregar lotes com propostas (simplificado para o exemplo)
        // Em um cenário real, você buscaria as propostas aqui ou em um componente filho
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

    // Inscrever-se para atualizações em tempo real do status da disputa
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getUserTypeInfo = () => {
    if (isAuctioneer) {
      return {
        icon: <Users className="h-4 w-4" />,
        label: "Pregoeiro",
        description: "Você pode gerenciar esta disputa",
        variant: "default" as const,
      };
    }
    if (isSupplier) {
      return {
        icon: <Users className="h-4 w-4" />,
        label: "Fornecedor",
        description: "Você pode participar desta disputa",
        variant: "default" as const,
      };
    }
    return {
      icon: <Eye className="h-4 w-4" />,
      label: "Observador",
      description: "Você pode acompanhar esta disputa",
      variant: "secondary" as const,
    };
  };

  const userInfo = getUserTypeInfo();

  // Generate a simple supplier identifier for display
  const supplierIdentifier = isSupplier
    ? `FORNECEDOR ${userId.substring(0, 8).toUpperCase()}`
    : null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header da Sala de Disputa */}
      <DisputeHeader
        tender={tender}
        disputeStatus={disputeStatus}
        currentTime={currentTime}
        userInfo={userInfo}
        supplierIdentifier={supplierIdentifier}
        disputeMode={disputeMode}
      />

      <div className="container mx-auto p-4 space-y-4">
        {/* Controles do Pregoeiro */}
        {isAuctioneer && (
          <DisputeControls
            tenderId={tender.id}
            status={disputeStatus}
            activeLot={activeLot}
            lots={lots}
            userId={userId}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Coluna da Esquerda: Chat */}
          <div className="lg:col-span-1">
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

          {/* Coluna Central: Conteúdo Principal da Disputa */}
          <div className="lg:col-span-3">
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

          {/* Coluna da Direita: Painel de Lances e Propostas */}
          <div className="lg:col-span-1">
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

        {/* Botão para voltar */}
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            Voltar para Detalhes da Licitação
          </Button>
        </div>
      </div>
    </div>
  );
}
