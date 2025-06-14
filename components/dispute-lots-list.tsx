"use client"

import { useState, useEffect } from "react"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Package, TrendingDown, Clock, CheckCircle, AlertCircle } from "lucide-react"

interface DisputeLotsListProps {
  lots: any[]
  activeLot: string | null
  disputeStatus: string
  isAuctioneer: boolean
  isSupplier: boolean
  userId: string
  tenderId: string
}

export function DisputeLotsList({
  lots,
  activeLot,
  disputeStatus,
  isAuctioneer,
  isSupplier,
  userId,
  tenderId,
}: DisputeLotsListProps) {
  const [lotStatuses, setLotStatuses] = useState<Record<string, any>>({})
  const supabase = createClientSupabaseClient()
  const { toast } = useToast()

  useEffect(() => {
    // Carregar status dos lotes
    const loadLotStatuses = async () => {
      try {
        const { data } = await supabase.from("tender_lot_disputes").select("*").eq("tender_id", tenderId)

        const statusMap: Record<string, any> = {}
        data?.forEach((item) => {
          statusMap[item.lot_id] = item
        })
        setLotStatuses(statusMap)
      } catch (error) {
        console.error("Erro ao carregar status dos lotes:", error)
      }
    }

    loadLotStatuses()

    // Inscrever-se para atualizações
    const subscription = supabase
      .channel("lot_statuses")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tender_lot_disputes",
          filter: `tender_id=eq.${tenderId}`,
        },
        () => {
          loadLotStatuses()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [tenderId, supabase])

  const getLotStatusInfo = (lotId: string) => {
    const status = lotStatuses[lotId]?.status || "waiting"
    switch (status) {
      case "waiting":
        return { label: "Não iniciado", variant: "outline" as const, icon: Clock }
      case "open":
        return { label: "Em disputa", variant: "default" as const, icon: TrendingDown }
      case "negotiation":
        return { label: "Negociação finalizada", variant: "secondary" as const, icon: CheckCircle }
      case "closed":
        return { label: "Encerrado", variant: "destructive" as const, icon: AlertCircle }
      default:
        return { label: "Indefinido", variant: "outline" as const, icon: Clock }
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const getBestProposal = (proposals: any[]) => {
    if (!proposals || proposals.length === 0) return null
    return proposals.reduce((best, current) => (current.value < best.value ? current : best))
  }

  const selectLot = async (lotId: string) => {
    if (!isAuctioneer) return

    try {
      const { error } = await supabase
        .from("tender_disputes")
        .update({ active_lot_id: lotId })
        .eq("tender_id", tenderId)

      if (error) throw error

      toast({
        title: "Lote selecionado",
        description: "Lote selecionado para disputa.",
      })
    } catch (error) {
      console.error("Erro ao selecionar lote:", error)
      toast({
        title: "Erro",
        description: "Não foi possível selecionar o lote.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="h-[600px] overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Lotes da Licitação
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[520px] overflow-y-auto">
          {lots.map((lot) => {
            const statusInfo = getLotStatusInfo(lot.id)
            const StatusIcon = statusInfo.icon
            const bestProposal = getBestProposal(lot.proposals)
            const isActive = activeLot === lot.id
            const proposalCount = lot.proposals?.length || 0

            return (
              <div
                key={lot.id}
                className={`p-4 border-b hover:bg-gray-50 transition-colors ${
                  isActive ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{lot.name}</h3>
                      {isActive && <Badge variant="default">Ativo</Badge>}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{lot.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{proposalCount} propostas</span>
                      <span>{lot.items?.length || 0} itens</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={statusInfo.variant} className="mb-2">
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                    {bestProposal && (
                      <div className="text-sm">
                        <div className="text-gray-500">Melhor valor</div>
                        <div className="font-semibold text-green-600">{formatCurrency(bestProposal.value)}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2 mt-3">
                  {isAuctioneer && disputeStatus === "waiting" && (
                    <Button size="sm" variant="outline" onClick={() => selectLot(lot.id)}>
                      Selecionar Lote
                    </Button>
                  )}
                  {isSupplier && (
                    <Button size="sm" variant="outline">
                      Ver Detalhes
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
