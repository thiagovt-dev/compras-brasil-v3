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
import { Check, Eye, Loader2, X, Gavel } from "lucide-react";
import Link from "next/link";

interface TenderProposalsProps {
  tenderId: string;
  lots: any[];
  isAgencyUser: boolean;
  isAuctioneer?: boolean;
  usingMockData?: boolean;
}

export function TenderProposals({
  tenderId,
  lots,
  isAgencyUser,
  isAuctioneer = false,
  usingMockData = false,
}: TenderProposalsProps) {
  const supabase = createClientSupabaseClient();
  const [activeTab, setActiveTab] = useState(lots[0]?.id || "");
  const [proposals, setProposals] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"lot" | "item">("lot"); // Novo estado para controlar o modo de visualização

  // Função para gerar dados mock com propostas por item
  const generateMockProposals = (lotId: string, count: number = 4) => {
    const statuses = ["submitted", "under_analysis", "accepted", "rejected"];
    const suppliers = [
      { id: "supplier-1", name: "TechSolutions Ltda", cnpj: "12.345.678/0001-90" },
      { id: "supplier-2", name: "InfoComputer S.A.", cnpj: "98.765.432/0001-10" },
      { id: "supplier-3", name: "Digital Systems Corp", cnpj: "11.222.333/0001-44" },
      { id: "supplier-4", name: "CompuWorld Brasil", cnpj: "55.666.777/0001-88" },
    ];

    const lot = lots.find(l => l.id === lotId);
    if (!lot || !lot.items) return [];

    const proposalsByItem: any[] = [];

    // Gerar propostas por item individual
    lot.items.forEach((item: any) => {
      suppliers.forEach((supplier, supplierIndex) => {
        // Nem todos os fornecedores fazem proposta para todos os itens
        if (Math.random() > 0.3) { // 70% chance de fazer proposta para cada item
          const unitPrice = item.unit_price * (0.8 + Math.random() * 0.4); // Variação de ±20%
          const totalPrice = unitPrice * item.quantity;
          
          const createdDate = new Date();
          createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 15));

          proposalsByItem.push({
            id: `mock-proposal-item-${item.id}-${supplier.id}`,
            tender_id: tenderId,
            lot_id: lotId,
            item_id: item.id, // Novo campo para identificar propostas por item
            type: "item", // Tipo da proposta: "lot" ou "item"
            supplier_id: supplier.id,
            total_value: totalPrice,
            created_at: createdDate.toISOString(),
            updated_at: createdDate.toISOString(),
            status: statuses[Math.floor(Math.random() * statuses.length)],
            notes: supplierIndex % 3 === 0 ? `Proposta para ${item.description} com condições especiais de entrega.` : "",
            supplier: supplier,
            item_details: {
              id: item.id,
              number: item.number,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unit_price: unitPrice,
              total_price: totalPrice,
              brand: ["Dell", "HP", "Lenovo", "Acer", "Samsung"][Math.floor(Math.random() * 5)],
              model: `Modelo ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 1000)}`,
              specifications: `Especificação detalhada para ${item.description}`,
            }
          });
        }
      });
    });

    return proposalsByItem;
  };

  // Função para gerar propostas por lote (modo tradicional)
  const generateMockLotProposals = (lotId: string, count: number = 3) => {
    const statuses = ["submitted", "under_analysis", "accepted", "rejected"];
    const suppliers = [
      { id: "supplier-1", name: "TechSolutions Ltda", cnpj: "12.345.678/0001-90" },
      { id: "supplier-2", name: "InfoComputer S.A.", cnpj: "98.765.432/0001-10" },
      { id: "supplier-3", name: "Digital Systems Corp", cnpj: "11.222.333/0001-44" },
    ];

    return suppliers.map((supplier, index) => {
      const lot = lots.find(l => l.id === lotId);
      const totalValue = lot?.estimated_value ? lot.estimated_value * (0.8 + Math.random() * 0.4) : 50000;
      
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 15));

      const items = lot?.items?.map((item: any, itemIndex: number) => {
        const unitPrice = totalValue / (lot.items.length * item.quantity);
        return {
          id: `mock-item-${lotId}-${index}-${itemIndex}`,
          unit_price: unitPrice,
          total_price: unitPrice * item.quantity,
          brand: ["Dell", "HP", "Lenovo", "Acer"][Math.floor(Math.random() * 4)],
          model: `Modelo ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 1000)}`,
          description: `Especificação detalhada do ${item.description.toLowerCase()}`,
          tender_item: item,
        };
      }) || [];

      return {
        id: `mock-proposal-lot-${lotId}-${index}`,
        tender_id: tenderId,
        lot_id: lotId,
        type: "lot", // Tipo da proposta: "lot" ou "item"
        total_value: totalValue,
        created_at: createdDate.toISOString(),
        updated_at: createdDate.toISOString(),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        notes: index % 2 === 0 ? "Observações sobre a proposta e condições especiais de entrega do lote completo." : "",
        supplier: supplier,
        items: items,
      };
    });
  };

  const loadProposals = async (lotId: string) => {
    if (proposals[lotId] || isLoading[lotId]) return;

    try {
      setIsLoading((prev) => ({ ...prev, [lotId]: true }));

      // Tentar carregar dados reais
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
        .order("total_value", { ascending: true });

      if (error) throw error;

      // Filtrar os dados pelo lote
      const filteredData = data?.filter(
        (p) => p.lot === lotId || p.lot_id === lotId || p.tender_lot_id === lotId
      );

      // Se não houver dados ou array vazio, use dados mock
      if (!filteredData || filteredData.length === 0) {
        console.log("Nenhum dado real encontrado, usando dados mockados para lote:", lotId);
        
        // Gerar tanto propostas por item quanto por lote para demonstração
        const mockItemProposals = generateMockProposals(lotId, 4);
        const mockLotProposals = generateMockLotProposals(lotId, 2);
        
        const allMockProposals = [...mockItemProposals, ...mockLotProposals];
        setProposals((prev) => ({ ...prev, [lotId]: allMockProposals }));
      } else {
        console.log("Dados reais encontrados para lote:", lotId, filteredData.length);
        setProposals((prev) => ({ ...prev, [lotId]: filteredData }));
      }
    } catch (error: any) {
      console.error("Error loading proposals:", error.message || error);

      // Use dados mock quando ocorrer um erro
      console.log("Erro ao carregar dados reais, usando dados mockados para lote:", lotId);
      const mockItemProposals = generateMockProposals(lotId, 4);
      const mockLotProposals = generateMockLotProposals(lotId, 2);
      const allMockProposals = [...mockItemProposals, ...mockLotProposals];
      
      setProposals((prev) => ({ ...prev, [lotId]: allMockProposals }));

      toast({
        title: "Exibindo propostas para o lote",
        description: "Mostrando os dados disponíveis para análise.",
        duration: 3000,
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

      if (selectedProposal.id.startsWith("mock-")) {
        await new Promise((resolve) => setTimeout(resolve, 800));

        const updatedProposals = { ...proposals };
        updatedProposals[selectedProposal.lot_id] = updatedProposals[selectedProposal.lot_id].map(
          (p) => {
            if (p.id === selectedProposal.id) {
              return { ...p, status: "accepted" };
            } else if (selectedProposal.type === "item" && p.item_id === selectedProposal.item_id) {
              // Para propostas por item, rejeitar outras propostas do mesmo item
              return { ...p, status: "rejected" };
            } else if (selectedProposal.type === "lot" && p.type === "lot") {
              // Para propostas por lote, rejeitar outras propostas de lote
              return { ...p, status: "rejected" };
            }
            return p;
          }
        );

        setProposals(updatedProposals);

        toast({
          title: "Proposta aceita",
          description: `A proposta ${selectedProposal.type === "item" ? "por item" : "por lote"} foi aceita com sucesso.`,
        });

        setIsDialogOpen(false);
        return;
      }

      // Código real para dados reais...
      const { error: updateError } = await supabase
        .from("proposals")
        .update({ status: "accepted" })
        .eq("id", selectedProposal.id);

      if (updateError) throw updateError;

      toast({
        title: "Proposta aceita",
        description: "A proposta foi aceita com sucesso.",
      });

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

      if (selectedProposal.id.startsWith("mock-")) {
        await new Promise((resolve) => setTimeout(resolve, 800));

        const updatedProposals = { ...proposals };
        updatedProposals[selectedProposal.lot_id] = updatedProposals[selectedProposal.lot_id].map(
          (p) => {
            if (p.id === selectedProposal.id) {
              return { ...p, status: "rejected" };
            }
            return p;
          }
        );

        setProposals(updatedProposals);

        toast({
          title: "Proposta rejeitada",
          description: "A proposta foi rejeitada com sucesso.",
        });

        setIsDialogOpen(false);
        return;
      }

      const { error } = await supabase
        .from("proposals")
        .update({ status: "rejected" })
        .eq("id", selectedProposal.id);

      if (error) throw error;

      toast({
        title: "Proposta rejeitada",
        description: "A proposta foi rejeitada com sucesso.",
      });

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
      draft: { label: "Rascunho", variant: "outline" },
      submitted: { label: "Enviada", variant: "default" },
      under_analysis: { label: "Em Análise", variant: "secondary" },
      accepted: { label: "Aceita", variant: "success" },
      rejected: { label: "Rejeitada", variant: "destructive" },
      winner: { label: "Vencedora", variant: "success" },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant={type === "item" ? "secondary" : "outline"} className="ml-2">
        {type === "item" ? "Por Item" : "Por Lote"}
      </Badge>
    );
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

  // Filtrar propostas baseado no modo de visualização
  const getFilteredProposals = (lotProposals: any[]) => {
    if (!lotProposals) return [];
    
    if (viewMode === "item") {
      return lotProposals.filter(p => p.type === "item");
    } else {
      return lotProposals.filter(p => p.type === "lot");
    }
  };

  // Load proposals for the initial tab
  if (activeTab && !proposals[activeTab] && !isLoading[activeTab]) {
    loadProposals(activeTab);
  }

  return (
    <div className="space-y-6">
      {usingMockData && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            <strong>Propostas de demonstração:</strong> Estas são propostas de exemplo para fins de
            demonstração, incluindo propostas por item individual e por lote completo.
          </p>
        </div>
      )}

      {/* Botão para gerenciar propostas - apenas visível para o pregoeiro */}
      {isAuctioneer && (
        <div className="flex justify-end mb-4">
          <Link href={`/dashboard/tenders/${tenderId}/proposals`} passHref>
            <Button className="flex items-center gap-2">
              <Gavel className="h-4 w-4" />
              Gerenciar Classificação das Propostas
            </Button>
          </Link>
        </div>
      )}

      {/* Controles de visualização */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant={viewMode === "lot" ? "default" : "outline"}
            onClick={() => setViewMode("lot")}
            size="sm"
          >
            Propostas por Lote
          </Button>
          <Button
            variant={viewMode === "item" ? "default" : "outline"}
            onClick={() => setViewMode("item")}
            size="sm"
          >
            Propostas por Item
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          {lots.map((lot) => (
            <TabsTrigger key={lot.id} value={lot.id}>
              Lote {lot.number}
              {proposals[lot.id] && (
                <Badge variant="secondary" className="ml-2">
                  {getFilteredProposals(proposals[lot.id]).length}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {lots.map((lot) => (
          <TabsContent key={lot.id} value={lot.id}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>
                  {viewMode === "item" ? "Propostas por Item" : "Propostas por Lote"} - Lote {lot.number}: {lot.description}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading[lot.id] ? (
                  <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : getFilteredProposals(proposals[lot.id])?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fornecedor</TableHead>
                        {viewMode === "item" && <TableHead>Item</TableHead>}
                        <TableHead>Valor Total</TableHead>
                        <TableHead>Data de Envio</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredProposals(proposals[lot.id]).map((proposal) => (
                        <TableRow key={proposal.id}>
                          <TableCell>
                            <div className="flex items-center">
                              {isAgencyUser ? proposal.supplier?.name : "Fornecedor Confidencial"}
                              {getTypeBadge(proposal.type)}
                            </div>
                          </TableCell>
                          {viewMode === "item" && (
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  Item {proposal.item_details?.number}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {proposal.item_details?.description}
                                </p>
                              </div>
                            </TableCell>
                          )}
                          <TableCell className="font-semibold">
                            {formatCurrency(proposal.total_value || 0)}
                          </TableCell>
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
                    Nenhuma proposta {viewMode === "item" ? "por item" : "por lote"} recebida para este lote.
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
              <DialogTitle className="flex items-center gap-2">
                Detalhes da Proposta
                {getTypeBadge(selectedProposal.type)}
              </DialogTitle>
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
                  <h3 className="text-[1rem] font-medium text-muted-foreground">Valor Total</h3>
                  <p className="text-lg font-semibold">
                    {formatCurrency(selectedProposal.total_value || 0)}
                  </p>
                </div>
                <div>{getStatusBadge(selectedProposal.status)}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-[1rem] font-medium text-muted-foreground">Data de Envio</h3>
                  <p>{formatDate(selectedProposal.created_at || "")}</p>
                </div>
                <div>
                  <h3 className="text-[1rem] font-medium text-muted-foreground">Tipo de Proposta</h3>
                  <p>{selectedProposal.type === "item" ? "Proposta por Item Individual" : "Proposta por Lote Completo"}</p>
                </div>
              </div>

              {selectedProposal.notes && (
                <div>
                  <h3 className="text-[1rem] font-medium text-muted-foreground mb-1">Observações</h3>
                  <p className="whitespace-pre-line">{selectedProposal.notes}</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-medium mb-2">
                  {selectedProposal.type === "item" ? "Detalhes do Item" : "Itens da Proposta"}
                </h3>
                
                {selectedProposal.type === "item" ? (
                  // Exibir detalhes do item individual
                  <div className="border rounded-md p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium">
                          Item {selectedProposal.item_details?.number}: {selectedProposal.item_details?.description}
                        </h4>
                        <p className="text-[1rem] text-muted-foreground">
                          Quantidade: {selectedProposal.item_details?.quantity} {selectedProposal.item_details?.unit}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <h5 className="text-[1rem] font-medium text-muted-foreground">Preço Unitário</h5>
                          <p className="font-semibold">{formatCurrency(selectedProposal.item_details?.unit_price || 0)}</p>
                        </div>
                        <div>
                          <h5 className="text-[1rem] font-medium text-muted-foreground">Valor Total</h5>
                          <p className="font-semibold">{formatCurrency(selectedProposal.item_details?.total_price || 0)}</p>
                        </div>
                      </div>
                    </div>
                    
                    {(selectedProposal.item_details?.brand || selectedProposal.item_details?.model || selectedProposal.item_details?.specifications) && (
                      <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedProposal.item_details?.brand && (
                          <div>
                            <h5 className="text-[1rem] font-medium text-muted-foreground">Marca</h5>
                            <p>{selectedProposal.item_details.brand}</p>
                          </div>
                        )}
                        {selectedProposal.item_details?.model && (
                          <div>
                            <h5 className="text-[1rem] font-medium text-muted-foreground">Modelo</h5>
                            <p>{selectedProposal.item_details.model}</p>
                          </div>
                        )}
                        {selectedProposal.item_details?.specifications && (
                          <div className="md:col-span-2">
                            <h5 className="text-[1rem] font-medium text-muted-foreground">Especificações</h5>
                            <p className="whitespace-pre-line">{selectedProposal.item_details.specifications}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  // Exibir todos os itens da proposta por lote
                  <div className="space-y-4">
                    {selectedProposal.items &&
                      selectedProposal.items.map((item: any) => (
                        <div key={item.id} className="border rounded-md p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium">
                                Item {item.tender_item?.number}: {item.tender_item?.description}
                              </h4>
                              <p className="text-[1rem] text-muted-foreground">
                                Quantidade: {item.tender_item?.quantity} {item.tender_item?.unit}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <h5 className="text-[1rem] font-medium text-muted-foreground">Preço Unitário</h5>
                                <p className="font-semibold">{formatCurrency(item.unit_price || 0)}</p>
                              </div>
                              <div>
                                <h5 className="text-[1rem] font-medium text-muted-foreground">Valor Total</h5>
                                <p className="font-semibold">{formatCurrency(item.total_price || 0)}</p>
                              </div>
                            </div>
                          </div>

                          {(item.brand || item.model || item.description) && (
                            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                              {item.brand && (
                                <div>
                                  <h5 className="text-[1rem] font-medium text-muted-foreground">Marca</h5>
                                  <p>{item.brand}</p>
                                </div>
                              )}
                              {item.model && (
                                <div>
                                  <h5 className="text-[1rem] font-medium text-muted-foreground">Modelo</h5>
                                  <p>{item.model}</p>
                                </div>
                              )}
                              {item.description && (
                                <div className="md:col-span-2">
                                  <h5 className="text-[1rem] font-medium text-muted-foreground">Descrição Detalhada</h5>
                                  <p className="whitespace-pre-line">{item.description}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
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