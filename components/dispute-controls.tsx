"use client"

import { useState } from "react"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Pause, MessageSquare, CheckCircle } from "lucide-react"

interface DisputeControlsProps {
  tenderId: string
  status: string
  activeItem: string | null
  items: any[]
}

export function DisputeControls({ tenderId, status, activeItem, items }: DisputeControlsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<string>(activeItem || "")
  const [openItemDialog, setOpenItemDialog] = useState(false)
  const supabase = createClientSupabaseClient()
  const { toast } = useToast()

  const updateDisputeStatus = async (newStatus: string) => {
    setIsLoading(true)

    try {
      const { error } = await supabase.from("tender_disputes").update({ status: newStatus }).eq("tender_id", tenderId)

      if (error) throw error

      toast({
        title: "Status atualizado",
        description: `Status da disputa atualizado para ${getStatusLabel(newStatus)}.`,
      })

      // Enviar mensagem no sistema
      await supabase.from("dispute_messages").insert({
        tender_id: tenderId,
        item_id: activeItem,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        content: `Disputa ${getStatusLabel(newStatus).toLowerCase()}.`,
        type: "system",
        is_private: false,
      })
    } catch (error) {
      console.error("Erro ao atualizar status da disputa:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da disputa.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectItem = async () => {
    if (!selectedItem) return

    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("tender_disputes")
        .update({ active_item_id: selectedItem })
        .eq("tender_id", tenderId)

      if (error) throw error

      const selectedItemData = items.find((item) => item.id === selectedItem)

      toast({
        title: "Item selecionado",
        description: `Item "${selectedItemData?.description.substring(0, 30)}..." selecionado para disputa.`,
      })

      // Enviar mensagem no sistema
      await supabase.from("dispute_messages").insert({
        tender_id: tenderId,
        item_id: selectedItem,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        content: `Item "${selectedItemData?.description.substring(0, 50)}..." selecionado para disputa.`,
        type: "system",
        is_private: false,
      })

      setOpenItemDialog(false)
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

  const getStatusLabel = (statusCode: string) => {
    switch (statusCode) {
      case "waiting":
        return "Aguardando Início"
      case "open":
        return "Disputa Aberta"
      case "negotiation":
        return "Em Negociação"
      case "closed":
        return "Encerrada"
      default:
        return statusCode
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "waiting" && (
        <>
          <Dialog open={openItemDialog} onOpenChange={setOpenItemDialog}>
            <DialogTrigger asChild>
              <Button disabled={isLoading}>
                <Play className="mr-2 h-4 w-4" />
                Iniciar Disputa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Selecionar Item para Disputa</DialogTitle>
                <DialogDescription>Escolha o item ou lote que será aberto para disputa.</DialogDescription>
              </DialogHeader>
              <Select value={selectedItem} onValueChange={setSelectedItem}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.description.substring(0, 50)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenItemDialog(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    await selectItem()
                    await updateDisputeStatus("open")
                  }}
                  disabled={!selectedItem || isLoading}
                >
                  Iniciar Disputa
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {status === "open" && (
        <>
          <Button variant="default" onClick={() => updateDisputeStatus("negotiation")} disabled={isLoading}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Iniciar Negociação
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={isLoading}>
                <Pause className="mr-2 h-4 w-4" />
                Trocar Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Selecionar Novo Item</DialogTitle>
                <DialogDescription>Escolha outro item ou lote para continuar a disputa.</DialogDescription>
              </DialogHeader>
              <Select value={selectedItem} onValueChange={setSelectedItem}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.description.substring(0, 50)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenItemDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={selectItem} disabled={!selectedItem || isLoading}>
                  Selecionar Item
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {status === "negotiation" && (
        <Button variant="destructive" onClick={() => updateDisputeStatus("closed")} disabled={isLoading}>
          <CheckCircle className="mr-2 h-4 w-4" />
          Encerrar Disputa
        </Button>
      )}

      {status === "closed" && (
        <Button variant="outline" onClick={() => updateDisputeStatus("waiting")} disabled={isLoading}>
          <Play className="mr-2 h-4 w-4" />
          Nova Disputa
        </Button>
      )}
    </div>
  )
}
