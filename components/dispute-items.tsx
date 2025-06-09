"use client"

import { useState } from "react"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"

interface DisputeItemsProps {
  items: any[]
  activeItem: string | null
  tenderId: string
}

export function DisputeItems({ items, activeItem, tenderId }: DisputeItemsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientSupabaseClient()
  const { toast } = useToast()

  const selectItem = async (itemId: string) => {
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("tender_disputes")
        .update({ active_item_id: itemId })
        .eq("tender_id", tenderId)

      if (error) throw error

      const selectedItem = items.find((item) => item.id === itemId)

      toast({
        title: "Item selecionado",
        description: `Item "${selectedItem?.description.substring(0, 30)}..." selecionado para disputa.`,
      })

      // Enviar mensagem no sistema
      await supabase.from("dispute_messages").insert({
        tender_id: tenderId,
        item_id: itemId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        content: `Item "${selectedItem?.description.substring(0, 50)}..." selecionado para disputa.`,
        type: "system",
        is_private: false,
      })
    } catch (error) {
      console.error("Erro ao selecionar item:", error)
      toast({
        title: "Erro",
        description: "Não foi possível selecionar o item para disputa.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">Itens/Lotes da Licitação</h3>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Valor Estimado</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={item.id} className={item.id === activeItem ? "bg-muted/30" : ""}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{item.description.substring(0, 50)}...</TableCell>
                <TableCell>{formatCurrency(item.estimated_value || 0)}</TableCell>
                <TableCell>
                  {item.id === activeItem ? (
                    <Badge variant="default">Em Disputa</Badge>
                  ) : (
                    <Badge variant="outline">Pendente</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant={item.id === activeItem ? "default" : "outline"}
                    size="sm"
                    onClick={() => selectItem(item.id)}
                    disabled={isLoading || item.id === activeItem}
                  >
                    {item.id === activeItem ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Ativo
                      </>
                    ) : (
                      "Selecionar"
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
