"use client"

import { useState, useEffect } from "react"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { DisputeChat } from "@/components/dispute-chat"
import { DisputeProposals } from "@/components/dispute-proposals"
import { DisputeControls } from "@/components/dispute-controls"
import { DisputeItems } from "@/components/dispute-items"

interface DisputeRoomProps {
  tender: any
  isAuctioneer: boolean
  isSupplier: boolean
  userId: string
  profile: any
}

export default function DisputeRoom({ tender, isAuctioneer, isSupplier, userId, profile }: DisputeRoomProps) {
  const [activeItem, setActiveItem] = useState<string | null>(null)
  const [disputeStatus, setDisputeStatus] = useState<string>("waiting") // waiting, open, negotiation, closed
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientSupabaseClient()
  const { toast } = useToast()

  useEffect(() => {
    // Carregar status da disputa
    const fetchDisputeStatus = async () => {
      try {
        const { data, error } = await supabase.from("tender_disputes").select("*").eq("tender_id", tender.id).single()

        if (data) {
          setDisputeStatus(data.status)
          setActiveItem(data.active_item_id)
        } else {
          // Se não existir, criar um registro de disputa
          if (isAuctioneer) {
            const { error: createError } = await supabase.from("tender_disputes").insert({
              tender_id: tender.id,
              status: "waiting",
              active_item_id: null,
              created_by: userId,
            })

            if (createError) throw createError
          }
        }
      } catch (error) {
        console.error("Erro ao carregar status da disputa:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar o status da disputa.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDisputeStatus()

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
          const newData = payload.new as any
          setDisputeStatus(newData.status)
          setActiveItem(newData.active_item_id)
        },
      )
      .subscribe()

    return () => {
      disputeSubscription.unsubscribe()
    }
  }, [tender.id, isAuctioneer, userId, supabase, toast])

  // Carregar propostas quando um item estiver ativo
  useEffect(() => {
    if (activeItem) {
      const fetchProposals = async () => {
        try {
          const { data, error } = await supabase
            .from("tender_proposals")
            .select(`
              *,
              profiles:user_id (*)
            `)
            .eq("tender_item_id", activeItem)
            .order("value", { ascending: true })

          if (error) throw error

          setProposals(data || [])
        } catch (error) {
          console.error("Erro ao carregar propostas:", error)
          toast({
            title: "Erro",
            description: "Não foi possível carregar as propostas.",
            variant: "destructive",
          })
        }
      }

      fetchProposals()

      // Inscrever-se para atualizações em tempo real das propostas
      const proposalsSubscription = supabase
        .channel("tender_proposals_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tender_proposals",
            filter: `tender_item_id=eq.${activeItem}`,
          },
          () => {
            fetchProposals()
          },
        )
        .subscribe()

      return () => {
        proposalsSubscription.unsubscribe()
      }
    }
  }, [activeItem, supabase, toast])

  if (loading) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold">{tender.title}</h1>
          <p className="text-muted-foreground">Nº {tender.tender_number}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant={
                disputeStatus === "waiting"
                  ? "outline"
                  : disputeStatus === "open"
                    ? "default"
                    : disputeStatus === "negotiation"
                      ? "secondary"
                      : "destructive"
              }
            >
              {disputeStatus === "waiting"
                ? "Aguardando Início"
                : disputeStatus === "open"
                  ? "Disputa Aberta"
                  : disputeStatus === "negotiation"
                    ? "Em Negociação"
                    : "Encerrada"}
            </Badge>
            {activeItem && (
              <Badge variant="outline">
                Item/Lote Ativo:{" "}
                {tender.lots
                  .flatMap((lot) => lot.items)
                  .find((item) => item.id === activeItem)
                  ?.description.substring(0, 30)}
                ...
              </Badge>
            )}
          </div>
        </div>

        {isAuctioneer && (
          <DisputeControls
            tenderId={tender.id}
            status={disputeStatus}
            activeItem={activeItem}
            items={tender.lots.flatMap((lot) => lot.items)}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="chat">
            <TabsList>
              <TabsTrigger value="chat">Chat da Disputa</TabsTrigger>
              <TabsTrigger value="proposals">Propostas</TabsTrigger>
              {isAuctioneer && <TabsTrigger value="items">Itens/Lotes</TabsTrigger>}
            </TabsList>

            <TabsContent value="chat" className="h-[500px]">
              <DisputeChat
                tenderId={tender.id}
                itemId={activeItem}
                isAuctioneer={isAuctioneer}
                userId={userId}
                status={disputeStatus}
              />
            </TabsContent>

            <TabsContent value="proposals">
              <DisputeProposals
                proposals={proposals}
                isAuctioneer={isAuctioneer}
                userId={userId}
                status={disputeStatus}
                tenderId={tender.id}
                itemId={activeItem}
              />
            </TabsContent>

            {isAuctioneer && (
              <TabsContent value="items">
                <DisputeItems
                  items={tender.lots.flatMap((lot) => lot.items)}
                  activeItem={activeItem}
                  tenderId={tender.id}
                />
              </TabsContent>
            )}
          </Tabs>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Informações da Disputa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Status:</h3>
                <p>
                  {disputeStatus === "waiting"
                    ? "Aguardando Início da Disputa"
                    : disputeStatus === "open"
                      ? "Disputa em Andamento"
                      : disputeStatus === "negotiation"
                        ? "Negociação em Andamento"
                        : "Disputa Encerrada"}
                </p>
              </div>

              {activeItem && (
                <div>
                  <h3 className="font-medium">Item/Lote Atual:</h3>
                  <p>{tender.lots.flatMap((lot) => lot.items).find((item) => item.id === activeItem)?.description}</p>
                </div>
              )}

              {isSupplier && (
                <div>
                  <h3 className="font-medium">Sua Participação:</h3>
                  <p>
                    {proposals.find((p) => p.user_id === userId)
                      ? "Você enviou uma proposta para este item"
                      : "Você ainda não enviou proposta para este item"}
                  </p>
                </div>
              )}

              <div className="pt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => (window.location.href = `/tenders/${tender.id}/session`)}
                >
                  Voltar para Sessão
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
