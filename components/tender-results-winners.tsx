"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Award, User, DollarSign, Package } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface TenderResultsWinnersProps {
  tenderId: string
}

export function TenderResultsWinners({ tenderId }: TenderResultsWinnersProps) {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [lots, setLots] = useState<any[]>([])
  const [winners, setWinners] = useState<Record<string, any>>({})

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      // Fetch lots
      const { data: lotsData, error: lotsError } = await supabase
        .from("tender_lots")
        .select("*")
        .eq("tender_id", tenderId)
        .order("number")

      if (lotsError) {
        console.error("Error fetching lots:", lotsError)
        setLoading(false)
        return
      }

      setLots(lotsData || [])

      // Fetch winning proposals for each lot
      const winnersByLot: Record<string, any> = {}

      for (const lot of lotsData || []) {
        const { data: proposalData, error: proposalError } = await supabase
          .from("proposals")
          .select(`
            *,
            supplier:profiles(*)
          `)
          .eq("lot_id", lot.id)
          .eq("status", "winner")
          .single()

        if (!proposalError && proposalData) {
          winnersByLot[lot.id] = proposalData
        }
      }

      setWinners(winnersByLot)
      setLoading(false)
    }

    fetchData()
  }, [tenderId, supabase])

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="mb-4">
            <Skeleton className="h-6 w-[150px] mb-2" />
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="flex justify-between items-center border-b pb-2">
                  <Skeleton className="h-5 w-[200px]" />
                  <Skeleton className="h-5 w-[100px]" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (lots.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Não há lotes disponíveis para esta licitação.</p>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {lots.map((lot) => {
        const winner = winners[lot.id]

        return (
          <AccordionItem key={lot.id} value={lot.id}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>
                  Lote {lot.number}: {lot.description}
                </span>
                {winner ? (
                  <Badge variant="success" className="ml-2">
                    Adjudicado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="ml-2">
                    Pendente
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {winner ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-500" />
                        <h4 className="font-medium">Fornecedor Vencedor</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm text-muted-foreground">Fornecedor</span>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{winner.supplier?.company_name || winner.supplier?.name}</span>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-1">
                          <span className="text-sm text-muted-foreground">Valor Total</span>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{formatCurrency(winner.total_value)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h5 className="text-sm font-medium mb-2">Detalhes da Proposta</h5>
                        <div className="text-sm text-muted-foreground">
                          {winner.notes || "Nenhuma observação adicional."}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-muted-foreground">Este lote ainda não possui um vencedor definido.</p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}
