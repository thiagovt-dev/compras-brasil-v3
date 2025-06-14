"use client"

import { useState, useEffect } from "react"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { TrendingDown, Send, Clock, Trophy, AlertCircle } from "lucide-react"

interface DisputeBidsPanelProps {
  tenderId: string
  lotId: string
  isAuctioneer: boolean
  isSupplier: boolean
  isCitizen: boolean
  userId: string
  disputeStatus: string
}

interface Bid {
  id: string
  user_id: string
  value: number
  created_at: string
  status: "active" | "cancelled"
  user?: {
    name?: string
    email?: string
  }
}

export function DisputeBidsPanel({
  tenderId,
  lotId,
  isAuctioneer,
  isSupplier,
  isCitizen,
  userId,
  disputeStatus,
}: DisputeBidsPanelProps) {
  const [bids, setBids] = useState<Bid[]>([])
  const [newBidValue, setNewBidValue] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [minBidValue, setMinBidValue] = useState<number>(0)
  const [bidInterval, setBidInterval] = useState<number>(0.01)
  const [loading, setLoading] = useState(true)

  const supabase = createClientSupabaseClient()
  const { toast } = useToast()

  useEffect(() => {
    // Carregar lances
    const loadBids = async () => {
      try {
        const { data, error } = await supabase
          .from("tender_bids")
          .select(`
            *,
            profiles:user_id(name, email)
          `)
          .eq("tender_id", tenderId)
          .eq("lot_id", lotId)
          .eq("status", "active")
          .order("value", { ascending: true })

        if (error) throw error

        const formattedBids = (data || []).map((bid: any) => ({
          id: bid.id,
          user_id: bid.user_id,
          value: bid.value,
          created_at: bid.created_at,
          status: bid.status,
          user: {
            name: bid.profiles?.name,
            email: bid.profiles?.email,
          },
        }))

        setBids(formattedBids)

        // Definir valor mínimo para próximo lance
        if (formattedBids.length > 0) {
          const bestBid = formattedBids[0]
          setMinBidValue(bestBid.value - bidInterval)
        }
      } catch (error) {
        console.error("Erro ao carregar lances:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os lances.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    // Carregar configurações do lote
    const loadLotConfig = async () => {
      try {
        const { data } = await supabase.from("tender_lots").select("bid_interval").eq("id", lotId).single()

        if (data) {
          setBidInterval(data.bid_interval || 0.01)
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error)
      }
    }

    loadBids()
    loadLotConfig()

    // Inscrever-se para atualizações em tempo real
    const subscription = supabase
      .channel("tender_bids_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tender_bids",
          filter: `lot_id=eq.${lotId}`,
        },
        () => {
          loadBids()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [tenderId, lotId, supabase, toast, bidInterval])

  // Timer para prorrogação automática
  useEffect(() => {
    if (disputeStatus === "open" && timeRemaining !== null && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => (prev ? prev - 1 : 0))
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [disputeStatus, timeRemaining])

  const submitBid = async () => {
    if (!isSupplier || !newBidValue.trim()) return

    const bidValue = Number.parseFloat(newBidValue)
    if (isNaN(bidValue) || bidValue <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido para o lance.",
        variant: "destructive",
      })
      return
    }

    if (bidValue >= minBidValue) {
      toast({
        title: "Lance inválido",
        description: `O lance deve ser menor que ${formatCurrency(minBidValue)}.`,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase.from("tender_bids").insert({
        tender_id: tenderId,
        lot_id: lotId,
        user_id: userId,
        value: bidValue,
        status: "active",
      })

      if (error) throw error

      setNewBidValue("")

      // Enviar mensagem no chat
      await supabase.from("dispute_messages").insert({
        tender_id: tenderId,
        lot_id: lotId,
        user_id: userId,
        content: `Novo lance enviado: ${formatCurrency(bidValue)}`,
        type: "system",
        is_private: false,
      })

      // Iniciar timer de 10 segundos para prorrogação
      setTimeRemaining(10)

      toast({
        title: "Lance enviado",
        description: "Seu lance foi enviado com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao enviar lance:", error)
      toast({
        title: "Erro",
        description: "Não foi possível enviar seu lance.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const cancelBid = async (bidId: string) => {
    if (!isAuctioneer) return

    try {
      const { error } = await supabase.from("tender_bids").update({ status: "cancelled" }).eq("id", bidId)

      if (error) throw error

      toast({
        title: "Lance cancelado",
        description: "O lance foi cancelado com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao cancelar lance:", error)
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o lance.",
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const getUserDisplayName = (bid: Bid, index: number) => {
    if (isAuctioneer) {
      return bid.user?.name || bid.user?.email || `Fornecedor ${index + 1}`
    }
    if (bid.user_id === userId) {
      return "Você"
    }
    return `Fornecedor ${index + 1}`
  }

  if (loading) {
    return (
      <Card className="h-[400px]">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[400px] flex flex-col">
      <CardHeader className="px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Lances
            {timeRemaining && timeRemaining > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                <Clock className="h-3 w-3 mr-1" />
                {timeRemaining}s
              </Badge>
            )}
          </CardTitle>
          {bids.length > 0 && <Badge variant="outline">{bids.length} lances</Badge>}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4">
        {bids.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
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
                } ${bid.user_id === userId ? "ring-2 ring-blue-200" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                    <Badge variant={index === 0 ? "default" : "outline"}>{index + 1}º</Badge>
                  </div>
                  <div>
                    <div className="font-medium">{getUserDisplayName(bid, index)}</div>
                    <div className="text-sm text-gray-500">{formatTime(bid.created_at)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${index === 0 ? "text-green-600" : "text-gray-700"}`}>
                    {formatCurrency(bid.value)}
                  </div>
                  {isAuctioneer && (
                    <Button size="sm" variant="outline" onClick={() => cancelBid(bid.id)} className="mt-1">
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {isSupplier && disputeStatus === "open" && (
        <div className="p-4 border-t bg-gray-50">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Valor mínimo:</span>
              <span className="font-medium">{formatCurrency(minBidValue)}</span>
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                step={bidInterval}
                max={minBidValue - bidInterval}
                placeholder="Valor do lance"
                value={newBidValue}
                onChange={(e) => setNewBidValue(e.target.value)}
                disabled={isSubmitting}
              />
              <Button onClick={submitBid} disabled={isSubmitting || !newBidValue.trim()} size="sm">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
