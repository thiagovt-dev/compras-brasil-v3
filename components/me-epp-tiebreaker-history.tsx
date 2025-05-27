"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, ArrowDown, CheckCircle, XCircle, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MeEppTiebreakerHistoryProps {
  tenderId?: string
  lotId?: string
  supplierId?: string
}

export function MeEppTiebreakerHistory({ tenderId, lotId, supplierId }: MeEppTiebreakerHistoryProps) {
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const [tiebreakers, setTiebreakers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTiebreakers = async () => {
      setIsLoading(true)

      try {
        let query = supabase.from("me_epp_tiebreakers").select("*").order("tiebreaker_date", { ascending: false })

        if (tenderId) {
          query = query.eq("tender_id", tenderId)
        }

        if (lotId) {
          query = query.eq("lot_id", lotId)
        }

        if (supplierId) {
          query = query.eq("supplier_id", supplierId)
        }

        const { data, error } = await query

        if (error) throw error

        setTiebreakers(data || [])
      } catch (error) {
        console.error("Erro ao buscar histórico de desempates:", error)
        toast({
          title: "Erro ao carregar histórico",
          description: "Não foi possível carregar o histórico de desempates.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchTiebreakers()
  }, [supabase, tenderId, lotId, supplierId, toast])

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "accepted":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="mr-1 h-3 w-3" /> Aceito
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-500">
            <Clock className="mr-1 h-3 w-3" /> Pendente
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-500">
            <XCircle className="mr-1 h-3 w-3" /> Rejeitado
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (tiebreakers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <p className="text-center text-muted-foreground">Nenhum histórico de desempate ME/EPP encontrado.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Desempates ME/EPP</CardTitle>
        <CardDescription>Registro de desempates fictos conforme Lei Complementar 123/2006</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {tiebreakers.map((tiebreaker) => (
            <div key={tiebreaker.id} className="rounded-md border p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">Desempate em {formatDate(tiebreaker.tiebreaker_date)}</h3>
                  <p className="text-sm text-muted-foreground">ID da Licitação: {tiebreaker.tender_id}</p>
                  <p className="text-sm text-muted-foreground">ID do Lote: {tiebreaker.lot_id}</p>
                </div>
                <div>{getStatusBadge(tiebreaker.status)}</div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Valor Original</p>
                  <p className="text-lg">{formatCurrency(tiebreaker.original_value)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Novo Valor</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg">{formatCurrency(tiebreaker.new_value)}</p>
                    <Badge variant="outline" className="bg-green-500/10 text-green-700">
                      <ArrowDown className="mr-1 h-3 w-3" />
                      {tiebreaker.reduction_percentage.toFixed(2)}%
                    </Badge>
                  </div>
                </div>
              </div>

              {tiebreaker.notes && (
                <div className="mt-4 text-sm">
                  <p className="font-medium">Observações:</p>
                  <p className="text-muted-foreground">{tiebreaker.notes}</p>
                </div>
              )}

              {tiebreaker.response_date && (
                <div className="mt-4 text-sm">
                  <p className="font-medium">Resposta em:</p>
                  <p className="text-muted-foreground">{formatDate(tiebreaker.response_date)}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
