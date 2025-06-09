"use client"

import { useState } from "react"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface DisputeProposalsProps {
  proposals: any[]
  isAuctioneer: boolean
  userId: string
  status: string
  tenderId: string
  itemId: string | null
}

export function DisputeProposals({ proposals, isAuctioneer, userId, status, tenderId, itemId }: DisputeProposalsProps) {
  const [newProposalValue, setNewProposalValue] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [disqualifyDialogOpen, setDisqualifyDialogOpen] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState<any>(null)
  const [disqualificationReason, setDisqualificationReason] = useState("")
  const supabase = createClientSupabaseClient()
  const { toast } = useToast()

  const submitProposal = async () => {
    if (!newProposalValue.trim() || !itemId) return

    const value = Number.parseFloat(newProposalValue)
    if (isNaN(value) || value <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido para a proposta.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Verificar se já existe uma proposta deste usuário para este item
      const { data: existingProposal } = await supabase
        .from("tender_proposals")
        .select("id")
        .eq("tender_item_id", itemId)
        .eq("user_id", userId)
        .single()

      if (existingProposal) {
        // Atualizar proposta existente
        const { error } = await supabase.from("tender_proposals").update({ value }).eq("id", existingProposal.id)

        if (error) throw error

        toast({
          title: "Proposta atualizada",
          description: "Sua proposta foi atualizada com sucesso.",
        })
      } else {
        // Criar nova proposta
        const { error } = await supabase.from("tender_proposals").insert({
          tender_id: tenderId,
          tender_item_id: itemId,
          user_id: userId,
          value,
          status: "active",
        })

        if (error) throw error

        toast({
          title: "Proposta enviada",
          description: "Sua proposta foi enviada com sucesso.",
        })
      }

      setNewProposalValue("")

      // Enviar mensagem no chat
      await supabase.from("dispute_messages").insert({
        tender_id: tenderId,
        item_id: itemId,
        user_id: userId,
        content: `Nova proposta enviada: R$ ${value.toFixed(2)}`,
        type: "system",
        is_private: false,
      })
    } catch (error) {
      console.error("Erro ao enviar proposta:", error)
      toast({
        title: "Erro",
        description: "Não foi possível enviar sua proposta.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openDisqualifyDialog = (proposal: any) => {
    setSelectedProposal(proposal)
    setDisqualifyDialogOpen(true)
  }

  const disqualifyProposal = async () => {
    if (!selectedProposal || !disqualificationReason.trim()) return

    try {
      const { error } = await supabase
        .from("tender_proposals")
        .update({
          status: "disqualified",
          disqualification_reason: disqualificationReason,
        })
        .eq("id", selectedProposal.id)

      if (error) throw error

      toast({
        title: "Proposta desclassificada",
        description: "A proposta foi desclassificada com sucesso.",
      })

      // Enviar mensagem no chat
      await supabase.from("dispute_messages").insert({
        tender_id: tenderId,
        item_id: itemId,
        user_id: userId,
        content: `Proposta desclassificada. Motivo: ${disqualificationReason}`,
        type: "system",
        is_private: false,
      })

      setDisqualifyDialogOpen(false)
      setDisqualificationReason("")
    } catch (error) {
      console.error("Erro ao desclassificar proposta:", error)
      toast({
        title: "Erro",
        description: "Não foi possível desclassificar a proposta.",
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

  const canSubmitProposal = status === "open" && !isAuctioneer && itemId
  const userProposal = proposals.find((p) => p.user_id === userId)

  return (
    <Card>
      <CardContent className="p-6">
        {canSubmitProposal && (
          <div className="mb-6 p-4 border rounded-md">
            <h3 className="text-lg font-medium mb-2">Enviar Proposta</h3>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Valor da proposta"
                value={newProposalValue}
                onChange={(e) => setNewProposalValue(e.target.value)}
                disabled={isSubmitting}
              />
              <Button onClick={submitProposal} disabled={isSubmitting || !newProposalValue.trim()}>
                {userProposal ? "Atualizar" : "Enviar"}
              </Button>
            </div>
            {userProposal && (
              <p className="mt-2 text-sm text-muted-foreground">
                Sua proposta atual: {formatCurrency(userProposal.value)}
              </p>
            )}
          </div>
        )}

        <h3 className="text-lg font-medium mb-4">Propostas Recebidas</h3>

        {proposals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Nenhuma proposta recebida ainda.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Posição</TableHead>
                {isAuctioneer && <TableHead>Fornecedor</TableHead>}
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                {isAuctioneer && status !== "closed" && <TableHead>Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals
                .sort((a, b) => a.value - b.value)
                .map((proposal, index) => (
                  <TableRow key={proposal.id} className={proposal.user_id === userId ? "bg-muted/30" : ""}>
                    <TableCell>{index + 1}º</TableCell>
                    {isAuctioneer && (
                      <TableCell>{proposal.profiles?.name || proposal.profiles?.email || "Fornecedor"}</TableCell>
                    )}
                    <TableCell>{formatCurrency(proposal.value)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          proposal.status === "active"
                            ? "default"
                            : proposal.status === "disqualified"
                              ? "destructive"
                              : proposal.status === "winner"
                                ? "success"
                                : "outline"
                        }
                      >
                        {proposal.status === "active"
                          ? "Ativa"
                          : proposal.status === "disqualified"
                            ? "Desclassificada"
                            : proposal.status === "winner"
                              ? "Vencedora"
                              : proposal.status}
                      </Badge>
                    </TableCell>
                    {isAuctioneer && status !== "closed" && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDisqualifyDialog(proposal)}
                            disabled={proposal.status !== "active"}
                          >
                            Desclassificar
                          </Button>
                          {status === "negotiation" && index === 0 && proposal.status === "active" && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await supabase
                                    .from("tender_proposals")
                                    .update({ status: "winner" })
                                    .eq("id", proposal.id)

                                  toast({
                                    title: "Proposta vencedora",
                                    description: "Proposta definida como vencedora com sucesso.",
                                  })

                                  // Enviar mensagem no chat
                                  await supabase.from("dispute_messages").insert({
                                    tender_id: tenderId,
                                    item_id: itemId,
                                    user_id: userId,
                                    content: `Proposta declarada vencedora: ${formatCurrency(proposal.value)}`,
                                    type: "system",
                                    is_private: false,
                                  })
                                } catch (error) {
                                  console.error("Erro ao definir proposta vencedora:", error)
                                  toast({
                                    title: "Erro",
                                    description: "Não foi possível definir a proposta como vencedora.",
                                    variant: "destructive",
                                  })
                                }
                              }}
                            >
                              Declarar Vencedora
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={disqualifyDialogOpen} onOpenChange={setDisqualifyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Desclassificar Proposta</DialogTitle>
              <DialogDescription>Informe o motivo da desclassificação da proposta.</DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Motivo da desclassificação"
              value={disqualificationReason}
              onChange={(e) => setDisqualificationReason(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setDisqualifyDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={disqualifyProposal} disabled={!disqualificationReason.trim()}>
                Desclassificar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
