"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Check,
  X,
  Eye,
  FileText,
  Clock,
  AlertCircle,
  Gavel,
  Play,
  MessageSquare,
  Download,
} from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";

interface Proposal {
  id: string;
  supplier_id: string;
  lot_id: string;
  total_value: number;
  status: string;
  created_at: string;
  supplier: {
    name: string;
    cnpj: string;
  };
  items: ProposalItem[];
}

interface ProposalItem {
  id: string;
  tender_item_id: string;
  unit_price: number;
  total_price: number;
  brand?: string;
  model?: string;
  description?: string;
  tender_item: {
    number: number;
    description: string;
    quantity: number;
    unit: string;
  };
}

export default function TenderProposalsPage() {
  const params = useParams();
  const tenderId = params.id as string;
  const supabase = createClientSupabaseClient();
  const { user, profile } = useAuth();

  const [tender, setTender] = useState<any>(null);
  const [lots, setLots] = useState<any[]>([]);
  const [proposals, setProposals] = useState<Record<string, Proposal[]>>({});
  const [selectedLot, setSelectedLot] = useState<string>("");
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"classify" | "declassify" | "view" | "negotiate">(
    "view"
  );
  const [justification, setJustification] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTenderData();
  }, [tenderId]);

  const fetchTenderData = async () => {
    try {
      setIsLoading(true);

      // Buscar dados da licitação
      const { data: tenderData, error: tenderError } = await supabase
        .from("tenders")
        .select("*")
        .eq("id", tenderId)
        .single();

      if (tenderError) throw tenderError;
      setTender(tenderData);

      // Buscar lotes
      const { data: lotsData, error: lotsError } = await supabase
        .from("tender_lots")
        .select("*")
        .eq("tender_id", tenderId)
        .order("number", { ascending: true });

      if (lotsError) throw lotsError;
      setLots(lotsData || []);

      if (lotsData && lotsData.length > 0) {
        setSelectedLot(lotsData[0].id);
        await fetchProposals(lotsData[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da licitação.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProposals = async (lotId: string) => {
    try {
      const { data, error } = await supabase
        .from("proposals")
        .select(
          `
          *,
          supplier:profiles!supplier_id(name, cnpj),
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

      setProposals((prev) => ({
        ...prev,
        [lotId]: data || [],
      }));
    } catch (error) {
      console.error("Erro ao carregar propostas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as propostas.",
        variant: "destructive",
      });
    }
  };

  const handleLotChange = async (lotId: string) => {
    setSelectedLot(lotId);
    if (!proposals[lotId]) {
      await fetchProposals(lotId);
    }
  };

  const handleProposalAction = (proposal: Proposal, action: typeof actionType) => {
    setSelectedProposal(proposal);
    setActionType(action);
    setJustification("");
    setIsDialogOpen(true);
  };

  const executeAction = async () => {
    if (!selectedProposal) return;

    try {
      setIsSubmitting(true);

      let updateData: any = {};
      let systemMessage = "";

      switch (actionType) {
        case "classify":
          updateData = { status: "classified" };
          systemMessage = `Proposta do fornecedor ${selectedProposal.supplier.name} foi classificada.`;
          break;
        case "declassify":
          if (!justification.trim()) {
            toast({
              title: "Erro",
              description: "Justificativa é obrigatória para desclassificar.",
              variant: "destructive",
            });
            return;
          }
          updateData = {
            status: "disqualified",
            disqualification_reason: justification,
          };
          systemMessage = `Proposta do fornecedor ${selectedProposal.supplier.name} foi desclassificada. Justificativa: ${justification}`;
          break;
        case "negotiate":
          updateData = { status: "in_negotiation" };
          systemMessage = `Iniciada negociação com o fornecedor ${selectedProposal.supplier.name}.`;
          break;
      }

      // Atualizar proposta
      const { error: updateError } = await supabase
        .from("proposals")
        .update(updateData)
        .eq("id", selectedProposal.id);

      if (updateError) throw updateError;

      // Adicionar mensagem do sistema
      const { error: messageError } = await supabase.from("session_messages").insert({
        tender_id: tenderId,
        user_id: user?.id,
        content: systemMessage,
        type: "system",
      });

      if (messageError) throw messageError;

      toast({
        title: "Sucesso",
        description: "Ação executada com sucesso.",
      });

      // Recarregar propostas
      await fetchProposals(selectedLot);
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Erro ao executar ação:", error);
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao executar a ação.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      submitted: { label: "Enviada", variant: "default", icon: Clock },
      classified: { label: "Classificada", variant: "success", icon: Check },
      disqualified: { label: "Desclassificada", variant: "destructive", icon: X },
      in_negotiation: { label: "Em Negociação", variant: "warning", icon: MessageSquare },
      winner: { label: "Vencedora", variant: "success", icon: Gavel },
    };

    const config = statusConfig[status] || { label: status, variant: "outline", icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Propostas</h1>
          <p className="text-muted-foreground">
            {tender?.title} - Nº {tender?.number}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button>
            <Play className="h-4 w-4 mr-2" />
            Iniciar Sessão
          </Button>
        </div>
      </div>

      <Tabs value={selectedLot} onValueChange={handleLotChange}>
        <TabsList>
          {lots.map((lot) => (
            <TabsTrigger key={lot.id} value={lot.id}>
              Lote {lot.number}
              {proposals[lot.id] && (
                <Badge variant="secondary" className="ml-2">
                  {proposals[lot.id].length}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {lots.map((lot) => (
          <TabsContent key={lot.id} value={lot.id}>
            <Card>
              <CardHeader>
                <CardTitle>
                  Lote {lot.number}: {lot.description}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {proposals[lot.id]?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>CNPJ</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead>Data Envio</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proposals[lot.id].map((proposal, index) => (
                        <TableRow key={proposal.id}>
                          <TableCell className="font-medium">{proposal.supplier.name}</TableCell>
                          <TableCell>{proposal.supplier.cnpj}</TableCell>
                          <TableCell>{formatCurrency(proposal.total_value)}</TableCell>
                          <TableCell>{formatDate(proposal.created_at)}</TableCell>
                          <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleProposalAction(proposal, "view")}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {proposal.status === "submitted" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleProposalAction(proposal, "classify")}
                                    className="text-green-600 border-green-600 hover:bg-green-50">
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleProposalAction(proposal, "declassify")}
                                    className="text-red-600 border-red-600 hover:bg-red-50">
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {proposal.status === "classified" && index === 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleProposalAction(proposal, "negotiate")}
                                  className="text-blue-600 border-blue-600 hover:bg-blue-50">
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma proposta recebida para este lote.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog para ações */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {actionType === "view" && "Detalhes da Proposta"}
              {actionType === "classify" && "Classificar Proposta"}
              {actionType === "declassify" && "Desclassificar Proposta"}
              {actionType === "negotiate" && "Iniciar Negociação"}
            </DialogTitle>
            <DialogDescription>Fornecedor: {selectedProposal?.supplier.name}</DialogDescription>
          </DialogHeader>

          {selectedProposal && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Valor Total</Label>
                  <p className="text-lg font-semibold">
                    {formatCurrency(selectedProposal.total_value)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status Atual</Label>
                  <div className="mt-1">{getStatusBadge(selectedProposal.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Data de Envio</Label>
                  <p>{formatDate(selectedProposal.created_at)}</p>
                </div>
              </div>

              <div>
                <Label className="text-lg font-medium mb-4 block">Itens da Proposta</Label>
                <div className="space-y-4">
                  {selectedProposal.items.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium">
                              Item {item.tender_item.number}: {item.tender_item.description}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Quantidade: {item.tender_item.quantity} {item.tender_item.unit}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <Label className="text-sm text-muted-foreground">
                                Preço Unitário
                              </Label>
                              <p className="font-semibold">{formatCurrency(item.unit_price)}</p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Valor Total</Label>
                              <p className="font-semibold">{formatCurrency(item.total_price)}</p>
                            </div>
                          </div>
                        </div>
                        {(item.brand || item.model || item.description) && (
                          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                            {item.brand && (
                              <div>
                                <Label className="text-sm text-muted-foreground">Marca</Label>
                                <p>{item.brand}</p>
                              </div>
                            )}
                            {item.model && (
                              <div>
                                <Label className="text-sm text-muted-foreground">Modelo</Label>
                                <p>{item.model}</p>
                              </div>
                            )}
                            {item.description && (
                              <div className="md:col-span-2">
                                <Label className="text-sm text-muted-foreground">
                                  Descrição Detalhada
                                </Label>
                                <p className="whitespace-pre-line">{item.description}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {actionType === "declassify" && (
                <div>
                  <Label htmlFor="justification">Justificativa *</Label>
                  <Textarea
                    id="justification"
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Digite a justificativa para desclassificação..."
                    className="mt-1"
                    rows={4}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {actionType !== "view" && (
              <Button
                onClick={executeAction}
                disabled={isSubmitting}
                className={
                  actionType === "declassify"
                    ? "bg-red-600 hover:bg-red-700"
                    : actionType === "classify"
                    ? "bg-green-600 hover:bg-green-700"
                    : ""
                }>
                {isSubmitting ? "Processando..." : "Confirmar"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
