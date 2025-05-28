"use client";

import { useState } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, Eye, Loader2, X } from "lucide-react";

interface TenderProposalsProps {
  tenderId: string;
  lots: any[];
  isAgencyUser: boolean;
}

export function TenderProposals({ tenderId, lots, isAgencyUser }: TenderProposalsProps) {
  const supabase = createClientSupabaseClient();
  const [activeTab, setActiveTab] = useState(lots[0]?.id || "");
  const [proposals, setProposals] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadProposals = async (lotId: string) => {
    if (proposals[lotId] || isLoading[lotId]) return;

    try {
      setIsLoading((prev) => ({ ...prev, [lotId]: true }));

      const { data, error } = await supabase
        .from("proposals")
        .select(
          `
          *,
          supplier:profiles(id, name, cnpj),
          items:proposal_items(
            *,
            tender_item:tender_items(*)
          )
        `
        )
        .eq("tender_id", tenderId)
        .eq("lot_id", lotId)
        .order("total_value", { ascending: true });

      if (error) throw error;

      setProposals((prev) => ({ ...prev, [lotId]: data || [] }));
    } catch (error) {
      console.error("Error loading proposals:", error);
      toast({
        title: "Erro ao carregar propostas",
        description: "Não foi possível carregar as propostas para este lote.",
        variant: "destructive",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, [lotId]: false }));
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    loadProposals(value);
  };

  const handleViewProposal = (proposal: any) => {
    setSelectedProposal(proposal);
    setIsDialogOpen(true);
  };

  const handleAcceptProposal = async () => {
    if (!selectedProposal) return;

    try {
      setIsSubmitting(true);

      // Update proposal status
      const { error: updateError } = await supabase
        .from("proposals")
        .update({ status: "accepted" })
        .eq("id", selectedProposal.id);

      if (updateError) throw updateError;

      // Update other proposals for the same lot to rejected
      const { error: rejectError } = await supabase
        .from("proposals")
        .update({ status: "rejected" })
        .eq("tender_id", tenderId)
        .eq("lot_id", selectedProposal.lot_id)
        .neq("id", selectedProposal.id);

      if (rejectError) throw rejectError;

      toast({
        title: "Proposta aceita",
        description: "A proposta foi aceita com sucesso.",
      });

      // Refresh proposals
      loadProposals(selectedProposal.lot_id);
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error accepting proposal:", error);
      toast({
        title: "Erro ao aceitar proposta",
        description: error.message || "Ocorreu um erro ao aceitar a proposta.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectProposal = async () => {
    if (!selectedProposal) return;

    try {
      setIsSubmitting(true);

      // Update proposal status
      const { error } = await supabase
        .from("proposals")
        .update({ status: "rejected" })
        .eq("id", selectedProposal.id);

      if (error) throw error;

      toast({
        title: "Proposta rejeitada",
        description: "A proposta foi rejeitada com sucesso.",
      });

      // Refresh proposals
      loadProposals(selectedProposal.lot_id);
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error rejecting proposal:", error);
      toast({
        title: "Erro ao rejeitar proposta",
        description: error.message || "Ocorreu um erro ao rejeitar a proposta.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: "default" | "outline" | "secondary" | "destructive" | "success" }
    > = {
      draft: {
        label: "Rascunho",
        variant: "outline",
      },
      submitted: {
        label: "Enviada",
        variant: "default",
      },
      under_analysis: {
        label: "Em Análise",
        variant: "secondary",
      },
      accepted: {
        label: "Aceita",
        variant: "success",
      },
      rejected: {
        label: "Rejeitada",
        variant: "destructive",
      },
      winner: {
        label: "Vencedora",
        variant: "success",
      },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" };

    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Data não definida";
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch (error) {
      return "Data inválida";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Load proposals for the initial tab
  if (activeTab && !proposals[activeTab] && !isLoading[activeTab]) {
    loadProposals(activeTab);
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          {lots.map((lot) => (
            <TabsTrigger key={lot.id} value={lot.id}>
              Lote {lot.number}
            </TabsTrigger>
          ))}
        </TabsList>

        {lots.map((lot) => (
          <TabsContent key={lot.id} value={lot.id}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>
                  Propostas para o Lote {lot.number}: {lot.description}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading[lot.id] ? (
                  <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : proposals[lot.id]?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead>Data de Envio</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proposals[lot.id].map((proposal) => (
                        <TableRow key={proposal.id}>
                          <TableCell>
                            {isAgencyUser ? proposal.supplier?.name : "Fornecedor Confidencial"}
                          </TableCell>
                          <TableCell>{formatCurrency(proposal.total_value || 0)}</TableCell>
                          <TableCell>{formatDate(proposal.created_at || "")}</TableCell>
                          <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewProposal(proposal)}>
                              <Eye className="h-4 w-4 mr-1" />
                              Detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center p-8 text-muted-foreground">
                    Nenhuma proposta recebida para este lote.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {selectedProposal && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Proposta</DialogTitle>
              <DialogDescription>
                {isAgencyUser ? (
                  <>Proposta enviada por {selectedProposal.supplier?.name}</>
                ) : (
                  <>Detalhes da proposta</>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Valor Total</h3>
                  <p className="text-lg font-semibold">
                    {formatCurrency(selectedProposal.total_value || 0)}
                  </p>
                </div>
                <div>{getStatusBadge(selectedProposal.status)}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Data de Envio</h3>
                  <p>{formatDate(selectedProposal.created_at || "")}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Última Atualização</h3>
                  <p>
                    {formatDate(selectedProposal.updated_at || selectedProposal.created_at || "")}
                  </p>
                </div>
              </div>

              {selectedProposal.notes && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Observações</h3>
                  <p className="whitespace-pre-line">{selectedProposal.notes}</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-medium mb-2">Itens da Proposta</h3>
                <div className="space-y-4">
                  {selectedProposal.items &&
                    selectedProposal.items.map((item: any) => (
                      <div key={item.id} className="border rounded-md p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium">
                              Item {item.tender_item?.number}: {item.tender_item?.description}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Quantidade: {item.tender_item?.quantity} {item.tender_item?.unit}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <h5 className="text-sm font-medium text-muted-foreground">
                                Preço Unitário
                              </h5>
                              <p className="font-semibold">
                                {formatCurrency(item.unit_price || 0)}
                              </p>
                            </div>

                            <div>
                              <h5 className="text-sm font-medium text-muted-foreground">
                                Valor Total
                              </h5>
                              <p className="font-semibold">
                                {formatCurrency(item.total_price || 0)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {(item.brand || item.model || item.description) && (
                          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                            {item.brand && (
                              <div>
                                <h5 className="text-sm font-medium text-muted-foreground">Marca</h5>
                                <p>{item.brand}</p>
                              </div>
                            )}

                            {item.model && (
                              <div>
                                <h5 className="text-sm font-medium text-muted-foreground">
                                  Modelo
                                </h5>
                                <p>{item.model}</p>
                              </div>
                            )}

                            {item.description && (
                              <div className="md:col-span-2">
                                <h5 className="text-sm font-medium text-muted-foreground">
                                  Descrição Detalhada
                                </h5>
                                <p className="whitespace-pre-line">{item.description}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              {isAgencyUser && selectedProposal.status === "submitted" && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleRejectProposal}
                    disabled={isSubmitting}
                    className="border-red-600 text-red-600 hover:bg-red-50">
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <X className="mr-2 h-4 w-4" />
                    )}
                    Rejeitar
                  </Button>
                  <Button onClick={handleAcceptProposal} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Aceitar
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
