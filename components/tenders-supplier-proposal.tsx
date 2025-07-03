"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Send, Package, PackageOpen, AlertCircle, CheckCircle2, PartyPopper } from "lucide-react";
import { createClientSupabaseClient } from "@/lib/supabase/client";

interface SupplierProposalFormProps {
  tender: any;
  lots: any[];
  supplierId: string;
  usingMockData?: boolean;
}

export function SupplierProposalForm({
  tender,
  lots,
  supplierId,
  usingMockData = false,
}: SupplierProposalFormProps) {
  const supabase = createClientSupabaseClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(lots[0]?.id || "");
  const [proposalType, setProposalType] = useState<"lot" | "item">("lot");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState<any>(null);
  const [submittedProposals, setSubmittedProposals] = useState<Set<string>>(new Set());
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Estados para propostas por lote
  const [lotProposals, setLotProposals] = useState<Record<string, any>>({});

  // Estados para propostas por item
  const [itemProposals, setItemProposals] = useState<Record<string, any>>({});

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const parseCurrency = (value: string) => {
    return parseFloat(value.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
  };

  const handleLotProposalChange = (lotId: string, field: string, value: any) => {
    setLotProposals(prev => ({
      ...prev,
      [lotId]: {
        ...prev[lotId],
        [field]: value,
      },
    }));
  };

  const handleItemProposalChange = (lotId: string, itemId: string, field: string, value: any) => {
    setItemProposals(prev => ({
      ...prev,
      [lotId]: {
        ...prev[lotId],
        [itemId]: {
          ...prev[lotId]?.[itemId],
          [field]: value,
        },
      },
    }));
  };

  const calculateLotTotal = (lotId: string) => {
    const lot = lots.find(l => l.id === lotId);
    if (!lot?.items) return 0;

    if (proposalType === "lot") {
      const proposal = lotProposals[lotId];
      if (!proposal) return 0;

      return lot.items.reduce((total: number, item: any) => {
        const itemTotal = (proposal[`item_${item.id}_unit_price`] || 0) * item.quantity;
        return total + itemTotal;
      }, 0);
    } else {
      const lotItems = itemProposals[lotId];
      if (!lotItems) return 0;

      return lot.items.reduce((total: number, item: any) => {
        const itemData = lotItems[item.id];
        if (!itemData) return total;
        const itemTotal = (itemData.unit_price || 0) * item.quantity;
        return total + itemTotal;
      }, 0);
    }
  };

  const validateProposal = (lotId: string) => {
    const lot = lots.find(l => l.id === lotId);
    if (!lot?.items) return false;

    if (proposalType === "lot") {
      const proposal = lotProposals[lotId];
      if (!proposal) return false;

      // Verificar se todos os itens têm preços unitários
      for (const item of lot.items) {
        const unitPrice = proposal[`item_${item.id}_unit_price`];
        if (!unitPrice || unitPrice <= 0) return false;
      }
    } else {
      const lotItems = itemProposals[lotId];
      if (!lotItems) return false;

      // Verificar se pelo menos um item tem proposta
      const hasAnyProposal = lot.items.some((item: any) => {
        const itemData = lotItems[item.id];
        return itemData && itemData.unit_price > 0;
      });

      if (!hasAnyProposal) return false;
    }

    return true;
  };

  const handleSubmitProposal = async (lotId: string) => {
    if (!validateProposal(lotId)) {
      toast({
        title: "Proposta inválida",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const lot = lots.find(l => l.id === lotId);

      if (usingMockData) {
        // Simular envio para dados mockados
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mostrar animação de sucesso
        setShowSuccessAnimation(true);
        setTimeout(() => setShowSuccessAnimation(false), 3000);

        // Marcar lote como enviado
        setSubmittedProposals(prev => new Set([...prev, lotId]));

        toast({
          title: "🎉 Proposta enviada com sucesso!",
          description: `Sua proposta ${proposalType === "lot" ? "por lote" : "por item"} foi enviada para análise. Você receberá atualizações sobre o status.`,
          duration: 5000,
        });

        // Limpar formulário
        if (proposalType === "lot") {
          setLotProposals(prev => ({ ...prev, [lotId]: {} }));
        } else {
          setItemProposals(prev => ({ ...prev, [lotId]: {} }));
        }

        setIsDialogOpen(false);
        return;
      }

      // Código real para dados reais
      if (proposalType === "lot") {
        const proposal = lotProposals[lotId];
        const totalValue = calculateLotTotal(lotId);

        const proposalData = {
          tender_id: tender.id,
          lot_id: lotId,
          supplier_id: supplierId,
          type: "lot",
          total_value: totalValue,
          notes: proposal.notes || "",
          status: "submitted",
        };

        const { data: proposalRecord, error: proposalError } = await supabase
          .from("proposals")
          .insert([proposalData])
          .select()
          .single();

        if (proposalError) throw proposalError;

        // Inserir itens da proposta
        const itemsData = lot.items.map((item: any) => ({
          proposal_id: proposalRecord.id,
          tender_item_id: item.id,
          unit_price: proposal[`item_${item.id}_unit_price`] || 0,
          total_price: (proposal[`item_${item.id}_unit_price`] || 0) * item.quantity,
          brand: proposal[`item_${item.id}_brand`] || "",
          model: proposal[`item_${item.id}_model`] || "",
          description: proposal[`item_${item.id}_description`] || "",
        }));

        const { error: itemsError } = await supabase
          .from("proposal_items")
          .insert(itemsData);

        if (itemsError) throw itemsError;

      } else {
        // Propostas por item individual
        const lotItems = itemProposals[lotId];
        const proposalsToInsert = [];

        for (const item of lot.items) {
          const itemData = lotItems[item.id];
          if (itemData && itemData.unit_price > 0) {
            proposalsToInsert.push({
              tender_id: tender.id,
              lot_id: lotId,
              item_id: item.id,
              supplier_id: supplierId,
              type: "item",
              total_value: itemData.unit_price * item.quantity,
              notes: itemData.notes || "",
              status: "submitted",
            });
          }
        }

        if (proposalsToInsert.length > 0) {
          const { error } = await supabase
            .from("proposals")
            .insert(proposalsToInsert);

          if (error) throw error;
        }
      }

      // Mostrar animação de sucesso
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 3000);

      // Marcar lote como enviado
      setSubmittedProposals(prev => new Set([...prev, lotId]));

      toast({
        title: "🎉 Proposta enviada com sucesso!",
        description: `Sua proposta ${proposalType === "lot" ? "por lote" : "por item"} foi enviada para análise. Você receberá atualizações sobre o status.`,
        duration: 5000,
      });

      // Limpar formulário
      if (proposalType === "lot") {
        setLotProposals(prev => ({ ...prev, [lotId]: {} }));
      } else {
        setItemProposals(prev => ({ ...prev, [lotId]: {} }));
      }

      setIsDialogOpen(false);

    } catch (error: any) {
      console.error("Error submitting proposal:", error);
      toast({
        title: "Erro ao enviar proposta",
        description: error.message || "Ocorreu um erro ao enviar a proposta.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openProposalDialog = (lot: any) => {
    setSelectedLot(lot);
    setIsDialogOpen(true);
  };

  const isLotSubmitted = (lotId: string) => {
    return submittedProposals.has(lotId);
  };

  return (
    <div className="space-y-6">
      {/* Animação de sucesso */}
      {showSuccessAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center animate-pulse">
            <div className="relative">
              <CheckCircle2 className="h-16 w-16 text-green-500 animate-bounce" />
              <PartyPopper className="h-8 w-8 text-yellow-500 absolute -top-2 -right-2 animate-spin" />
            </div>
            <h3 className="text-2xl font-bold text-green-600 mt-4">Proposta Enviada!</h3>
            <p className="text-gray-600 mt-2 text-center">
              Sua proposta foi enviada com sucesso e está sendo processada.
            </p>
          </div>
        </div>
      )}

      {usingMockData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <p className="text-sm text-blue-800">
              <strong>Modo Demonstração:</strong> Você pode enviar propostas de exemplo. 
              Em produção, suas propostas serão enviadas para análise real.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Enviar Proposta
          </CardTitle>
          <div className="flex items-center gap-4">
            <Label htmlFor="proposal-type">Tipo de Proposta:</Label>
            <div className="flex items-center gap-2">
              <Switch
                id="proposal-type"
                checked={proposalType === "item"}
                onCheckedChange={(checked) => setProposalType(checked ? "item" : "lot")}
              />
              <Label htmlFor="proposal-type">
                {proposalType === "item" ? "Por Item Individual" : "Por Lote Completo"}
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              {lots.map((lot) => (
                <TabsTrigger key={lot.id} value={lot.id} className="relative">
                  Lote {lot.number}
                  {isLotSubmitted(lot.id) && (
                    <CheckCircle2 className="h-4 w-4 text-green-500 ml-2" />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {lots.map((lot) => (
              <TabsContent key={lot.id} value={lot.id}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {proposalType === "item" ? (
                          <PackageOpen className="h-5 w-5" />
                        ) : (
                          <Package className="h-5 w-5" />
                        )}
                        Lote {lot.number}: {lot.description}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={proposalType === "item" ? "secondary" : "outline"}>
                          {proposalType === "item" ? "Por Item" : "Por Lote"}
                        </Badge>
                        {isLotSubmitted(lot.id) && (
                          <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Enviado
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLotSubmitted(lot.id) ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-green-800 mb-2">
                          Proposta Enviada com Sucesso!
                        </h3>
                        <p className="text-green-700 mb-4">
                          Sua proposta para o Lote {lot.number} foi enviada e está sendo processada.
                        </p>
                        <div className="bg-white rounded-lg p-4 text-left">
                          <h4 className="font-medium text-gray-800 mb-2">Próximos Passos:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Aguarde a análise da documentação</li>
                            <li>• Você receberá notificações sobre atualizações</li>
                            <li>• Acompanhe o status na sua área do fornecedor</li>
                            <li>• Prepare-se para a fase de disputa, se aprovado</li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Informações do lote */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Informações do Lote</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Valor Estimado:</span>
                              <p className="font-medium">{formatCurrency(lot.estimated_value || 0)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Quantidade de Itens:</span>
                              <p className="font-medium">{lot.items?.length || 0}</p>
                            </div>
                          </div>
                        </div>

                        {/* Lista de itens */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Itens do Lote</h4>
                          {lot.items?.map((item: any) => (
                            <div key={item.id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h5 className="font-medium">
                                    Item {item.number}: {item.description}
                                  </h5>
                                  <p className="text-sm text-muted-foreground">
                                    Quantidade: {item.quantity} {item.unit} | 
                                    Valor estimado: {formatCurrency(item.unit_price || 0)}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Campos de proposta baseados no tipo */}
                              {proposalType === "lot" ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                  <div>
                                    <Label htmlFor={`lot-${lot.id}-item-${item.id}-unit-price`}>
                                      Preço Unitário *
                                    </Label>
                                    <Input
                                      id={`lot-${lot.id}-item-${item.id}-unit-price`}
                                      type="number"
                                      step="0.01"
                                      placeholder="0,00"
                                      value={lotProposals[lot.id]?.[`item_${item.id}_unit_price`] || ""}
                                      onChange={(e) => handleLotProposalChange(
                                        lot.id,
                                        `item_${item.id}_unit_price`,
                                        parseFloat(e.target.value) || 0
                                      )}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`lot-${lot.id}-item-${item.id}-brand`}>
                                      Marca
                                    </Label>
                                    <Input
                                      id={`lot-${lot.id}-item-${item.id}-brand`}
                                      placeholder="Marca do produto"
                                      value={lotProposals[lot.id]?.[`item_${item.id}_brand`] || ""}
                                      onChange={(e) => handleLotProposalChange(
                                        lot.id,
                                        `item_${item.id}_brand`,
                                        e.target.value
                                      )}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`lot-${lot.id}-item-${item.id}-model`}>
                                      Modelo
                                    </Label>
                                    <Input
                                      id={`lot-${lot.id}-item-${item.id}-model`}
                                      placeholder="Modelo do produto"
                                      value={lotProposals[lot.id]?.[`item_${item.id}_model`] || ""}
                                      onChange={(e) => handleLotProposalChange(
                                        lot.id,
                                        `item_${item.id}_model`,
                                        e.target.value
                                      )}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                  <div>
                                    <Label htmlFor={`item-${item.id}-unit-price`}>
                                      Preço Unitário
                                    </Label>
                                    <Input
                                      id={`item-${item.id}-unit-price`}
                                      type="number"
                                      step="0.01"
                                      placeholder="0,00"
                                      value={itemProposals[lot.id]?.[item.id]?.unit_price || ""}
                                      onChange={(e) => handleItemProposalChange(
                                        lot.id,
                                        item.id,
                                        "unit_price",
                                        parseFloat(e.target.value) || 0
                                      )}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`item-${item.id}-brand`}>
                                      Marca
                                    </Label>
                                    <Input
                                      id={`item-${item.id}-brand`}
                                      placeholder="Marca do produto"
                                      value={itemProposals[lot.id]?.[item.id]?.brand || ""}
                                      onChange={(e) => handleItemProposalChange(
                                        lot.id,
                                        item.id,
                                        "brand",
                                        e.target.value
                                      )}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Valor total por item */}
                              <div className="mt-2 text-right">
                                <span className="text-sm font-medium">
                                  Total do Item: {formatCurrency(
                                    proposalType === "lot" 
                                      ? ((lotProposals[lot.id]?.[`item_${item.id}_unit_price`] || 0) * item.quantity)
                                      : ((itemProposals[lot.id]?.[item.id]?.unit_price || 0) * item.quantity)
                                  )}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Observações */}
                        <div>
                          <Label htmlFor={`${proposalType}-${lot.id}-notes`}>
                            Observações
                          </Label>
                          <Textarea
                            id={`${proposalType}-${lot.id}-notes`}
                            placeholder="Observações adicionais sobre sua proposta..."
                            value={
                              proposalType === "lot" 
                                ? (lotProposals[lot.id]?.notes || "")
                                : (itemProposals[lot.id]?.notes || "")
                            }
                            onChange={(e) => {
                              if (proposalType === "lot") {
                                handleLotProposalChange(lot.id, "notes", e.target.value);
                              } else {
                                setItemProposals(prev => ({
                                  ...prev,
                                  [lot.id]: {
                                    ...prev[lot.id],
                                    notes: e.target.value,
                                  },
                                }));
                              }
                            }}
                          />
                        </div>

                        {/* Resumo da proposta */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Resumo da Proposta</h4>
                          <div className="flex justify-between items-center">
                            <span>Valor Total:</span>
                            <span className="text-xl font-bold text-blue-600">
                              {formatCurrency(calculateLotTotal(lot.id))}
                            </span>
                          </div>
                          {lot.estimated_value && (
                            <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
                              <span>Valor Estimado:</span>
                              <span>{formatCurrency(lot.estimated_value)}</span>
                            </div>
                          )}
                        </div>

                        {/* Botão de envio */}
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              onClick={() => openProposalDialog(lot)}
                              disabled={!validateProposal(lot.id)}
                              className="w-full"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Enviar Proposta
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Confirmar Envio de Proposta</DialogTitle>
                              <DialogDescription>
                                Tem certeza que deseja enviar esta proposta para o Lote {selectedLot?.number}?
                                <br />
                                <strong>Valor Total: {formatCurrency(calculateLotTotal(selectedLot?.id || ""))}</strong>
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancelar
                              </Button>
                              <Button 
                                onClick={() => handleSubmitProposal(selectedLot?.id)}
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4 mr-2" />
                                )}
                                Confirmar Envio
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}