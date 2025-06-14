"use client"

import { useState, useEffect } from "react"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { DisputeHeader } from "@/components/dispute-header"
import { DisputeLotsList } from "@/components/dispute-lots-list"
import { DisputeChat } from "@/components/dispute-chat"
import { DisputeBidsPanel } from "@/components/dispute-bids-panel"
import { DisputeControls } from "@/components/dispute-controls"
import { Eye, Users } from "lucide-react"

interface DisputeRoomProps {
  tender: any
  isAuctioneer: boolean
  isSupplier: boolean
  isCitizen: boolean
  userId: string
  profile: any
}

export default function DisputeRoom({
  tender,
  isAuctioneer,
  isSupplier,
  isCitizen,
  userId,
  profile,
}: DisputeRoomProps) {
  const [disputeStatus, setDisputeStatus] = useState<string>("waiting")
  const [activeLot, setActiveLot] = useState<string | null>(null)
  const [lots, setLots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  const supabase = createClientSupabaseClient()
  const { toast } = useToast()

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // Carregar dados iniciais
    const loadInitialData = async () => {
      try {
        // Carregar status da disputa
        const { data: dispute } = await supabase.from("tender_disputes").select("*").eq("tender_id", tender.id).single()

        if (dispute) {
          setDisputeStatus(dispute.status)
          setActiveLot(dispute.active_lot_id)
        }

        // Carregar lotes com propostas
        const { data: lotsData } = await supabase
          .from("tender_lots")
          .select(`
            *,
            items:tender_items(*),
            proposals:tender_proposals(
              *,
              profiles:user_id(name, email)
            )
          `)
          .eq("tender_id", tender.id)
          .order("created_at", { ascending: true })

        setLots(lotsData || [])
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados da disputa.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()

    // Inscrever-se para atualizações em tempo real
    const disputeSubscription = supabase
      .channel("dispute_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tender_disputes",
          filter: `tender_id=eq.${tender.id}`,
        },
        (payload) => {
          const newData = payload.new as any
          setDisputeStatus(newData.status)
          setActiveLot(newData.active_lot_id)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tender_proposals",
          filter: `tender_id=eq.${tender.id}`,
        },
        () => {
          // Recarregar lotes quando houver mudanças nas propostas
          loadInitialData()
        },
      )
      .subscribe()

    return () => {
      disputeSubscription.unsubscribe()
    }
  }, [tender.id, supabase, toast])

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
    )
  }

  const getUserTypeInfo = () => {
    if (isAuctioneer) {
      return {
        icon: <Users className="h-4 w-4" />,
        label: "Pregoeiro",
        description: "Você pode gerenciar esta disputa",
        variant: "default" as const,
      }
    }
    if (isSupplier) {
      return {
        icon: <Users className="h-4 w-4" />,
        label: "Fornecedor",
        description: "Você pode participar desta disputa",
        variant: "default" as const,
      }
    }
    return {
      icon: <Eye className="h-4 w-4" />,
      label: "Observador",
      description: "Você pode acompanhar esta disputa",
      variant: "secondary" as const,
    }
  }

  const userInfo = getUserTypeInfo()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header da Sala de Disputa */}
      <DisputeHeader tender={tender} disputeStatus={disputeStatus} currentTime={currentTime} userInfo={userInfo} />

      <div className="container mx-auto p-4 space-y-4">
        {/* Controles do Pregoeiro */}
        {isAuctioneer && (
          <DisputeControls tenderId={tender.id} status={disputeStatus} activeLot={activeLot} lots={lots} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Lista de Lotes - 2 colunas */}
          <div className="lg:col-span-2">
            <DisputeLotsList
              lots={lots}
              activeLot={activeLot}
              disputeStatus={disputeStatus}
              isAuctioneer={isAuctioneer}
              isSupplier={isSupplier}
              userId={userId}
              tenderId={tender.id}
            />
          </div>

          {/* Chat e Painel de Lances - 2 colunas */}
          <div className="lg:col-span-2 space-y-4">
            {/* Chat */}
            <DisputeChat
              tenderId={tender.id}
              activeLot={activeLot}
              isAuctioneer={isAuctioneer}
              isSupplier={isSupplier}
              isCitizen={isCitizen}
              userId={userId}
              status={disputeStatus}
            />

            {/* Painel de Lances */}
            {activeLot && (
              <DisputeBidsPanel
                tenderId={tender.id}
                lotId={activeLot}
                isAuctioneer={isAuctioneer}
                isSupplier={isSupplier}
                isCitizen={isCitizen}
                userId={userId}
                disputeStatus={disputeStatus}
              />
            )}
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
  )
}
