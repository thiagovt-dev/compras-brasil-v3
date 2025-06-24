"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  FileText,
  Gavel,
  MessageSquare,
  Clock,
  Trophy,
  CheckCircle,
  XCircle,
  DollarSign,
  RotateCcw,
  Info,
  Users,
  Package,
  Scale,
} from "lucide-react";
import {
  useTenderWorkflow,
  LotStatus as WorkflowLotStatus,
} from "@/lib/contexts/tender-workflow-context";

interface DisputeAuctioneerControlsProps {
  lots: any[];
  onChatMessage: (message: string, type: "system" | "auctioneer") => void;
}

// Mapeamento de estados do workflow para estados locais (para compatibilidade com interface existente)
type LotStatus =
  | "waiting_to_open"
  | "proposals_opened"
  | "resource_manifestation"
  | "in_dispute"
  | "dispute_ended"
  | "winner_declared"
  | "finished";

// Mapeamento entre status do workflow e status local
const mapWorkflowToLocalStatus = (status: WorkflowLotStatus): LotStatus => {
  const statusMap: Record<WorkflowLotStatus, LotStatus> = {
    waiting: "waiting_to_open",
    open: "in_dispute",
    paused: "in_dispute",
    finished: "dispute_ended",
    negotiation: "dispute_ended",
    disqualified: "proposals_opened",
    winner_declared: "winner_declared",
    resource_phase: "resource_manifestation",
    adjudicated: "finished",
    homologated: "finished",
    revoked: "finished",
    canceled: "finished",
  };
  return statusMap[status];
};

// Fornecedor status mapping helpers
type SupplierStatus = "classified" | "disqualified" | "winner" | "eliminated";

export function DisputeAuctioneerControls({ lots, onChatMessage }: DisputeAuctioneerControlsProps) {
  // Usar o contexto centralizado de workflow da licitação
  const {
    tenderStatus,
    lotStatuses,
    activeLotId,
    setActiveLotId,
    systemMessages,
    addSystemMessage,
    openProposals,
    startDispute,
    endDispute,
    startNegotiation,
    declareWinner,
    openResourcePhase,
    resources,
    updateLotStatus,
    suppliers,
    updateSupplierStatus,
  } = useTenderWorkflow();

  // Estados locais para controle de diálogos e formulários
  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [dialogType, setDialogType] = useState<string | null>(null);
  const [justification, setJustification] = useState("");
  const [timeLimit, setTimeLimit] = useState("1");
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);

  // Mapear os fornecedores por lote para compatibilidade com a UI existente
  const suppliersData: Record<string, any[]> = {};

  // Transformar os dados de fornecedores do contexto para o formato esperado pela UI
  useEffect(() => {
    const formattedSuppliers: Record<string, any[]> = {};

    // Para cada lote, agrupar os fornecedores
    lots.forEach((lot) => {
      formattedSuppliers[lot.id] = suppliers
        .filter((s) => s.lotId === lot.id)
        .map((s) => ({
          id: s.id,
          name: s.name,
          company: s.company,
          value: s.value,
          status: s.status as SupplierStatus,
        }));
    });

    // Atualizar o estado local de fornecedores formatados
    Object.assign(suppliersData, formattedSuppliers);
  }, [suppliers, lots]);

  // Efeito para sincronizar mensagens do sistema com o chat
  useEffect(() => {
    if (systemMessages.length > 0) {
      const lastMessage = systemMessages[systemMessages.length - 1];
      onChatMessage(lastMessage.content, "system");
    }
  }, [systemMessages, onChatMessage]);

  const { toast } = useToast();

  const getStatusInfo = (status: WorkflowLotStatus) => {
    const statusMap: Record<string, any> = {
      waiting: {
        label: "Aguardando Abertura",
        color: "bg-gray-500",
        icon: Clock,
        description: "Clique em 'Abrir Propostas' para iniciar a análise das propostas recebidas",
      },
      open: {
        label: "Em Disputa",
        color: "bg-green-500",
        icon: Gavel,
        description: "Disputa de lances em andamento entre fornecedores classificados",
      },
      paused: {
        label: "Disputa Pausada",
        color: "bg-yellow-500",
        icon: Clock,
        description: "Disputa pausada temporariamente",
      },
      finished: {
        label: "Disputa Encerrada",
        color: "bg-purple-500",
        icon: Trophy,
        description: "Disputa finalizada. Proceda com negociação ou declaração de vencedor",
      },
      negotiation: {
        label: "Em Negociação",
        color: "bg-blue-500",
        icon: DollarSign,
        description: "Negociando valores com o arrematante",
      },
      disqualified: {
        label: "Fornecedor Desclassificado",
        color: "bg-red-500",
        icon: XCircle,
        description: "Fornecedor desclassificado da disputa",
      },
      winner_declared: {
        label: "Vencedor Declarado",
        color: "bg-orange-500",
        icon: CheckCircle,
        description: "Vencedor declarado. Processo pode seguir para fase recursal",
      },
      resource_phase: {
        label: "Fase Recursal",
        color: "bg-yellow-600",
        icon: Scale,
        description: "Em fase recursal - manifestação, recursos, contrarrazões",
      },
      adjudicated: {
        label: "Adjudicado",
        color: "bg-emerald-500",
        icon: Gavel,
        description: "Lote adjudicado ao vencedor",
      },
      homologated: {
        label: "Homologado",
        color: "bg-teal-700",
        icon: CheckCircle,
        description: "Lote homologado pela autoridade superior",
      },
      revoked: {
        label: "Revogado",
        color: "bg-red-600",
        icon: XCircle,
        description: "Licitação revogada pela autoridade superior",
      },
      canceled: {
        label: "Anulado",
        color: "bg-red-700",
        icon: XCircle,
        description: "Licitação anulada",
      },
    };
    return statusMap[status] || statusMap.waiting;
  };

  const handleOpenProposals = (lotId: string) => {
    // Usar a função do contexto
    openProposals();

    // Estabelecer o lote ativo
    setActiveLotId(lotId);

    toast({
      title: "Propostas Abertas",
      description: `As propostas do lote ${lotId} foram abertas para análise.`,
    });
  };

  const handleDisqualifySupplier = (lotId: string, supplierId: string) => {
    setSelectedLot(lotId);
    setSelectedSupplier(supplierId);
    setDialogType("disqualify");
  };

  const confirmDisqualifySupplier = () => {
    if (!selectedLot || !selectedSupplier || !justification.trim()) return;

    // Encontrar o fornecedor para exibição de mensagens
    const supplier = suppliersData[selectedLot]?.find((s) => s.id === selectedSupplier);

    // Usar o método do contexto para atualizar o status do fornecedor
    updateSupplierStatus(selectedSupplier, "disqualified");

    // Adicionar uma mensagem do sistema via contexto
    addSystemMessage(
      `A proposta do ${supplier?.name} para o lote ${selectedLot} foi desclassificada com a seguinte justificativa: "${justification}"`
    );

    toast({
      title: "Fornecedor Desclassificado",
      description: `${supplier?.name} foi desclassificado do lote ${selectedLot}.`,
    });

    closeDialog();
  };

  const handleReclassifySupplier = (lotId: string, supplierId: string) => {
    // Encontrar o fornecedor para exibição de mensagens
    const supplier = suppliersData[lotId]?.find((s) => s.id === supplierId);

    // Usar o método do contexto para atualizar o status do fornecedor
    updateSupplierStatus(supplierId, "classified");

    // Adicionar uma mensagem do sistema via contexto
    addSystemMessage(`O fornecedor ${supplier?.name} foi reclassificado para o lote ${lotId}`);

    toast({
      title: "Fornecedor Reclassificado",
      description: `${supplier?.name} foi reclassificado no lote ${lotId}.`,
    });
  };

  const handleOpenResourceManifestation = (lotId: string) => {
    setSelectedLot(lotId);
    setDialogType("resource_manifestation");
  };

  const confirmOpenResourceManifestation = () => {
    if (!selectedLot || !timeLimit) return;

    // Usar o método do contexto para abrir a fase recursal
    openResourcePhase(selectedLot, parseInt(timeLimit));

    toast({
      title: "Manifestação de Recursos Aberta",
      description: `Período de ${timeLimit} hora(s) para manifestação de recursos.`,
    });

    closeDialog();
  };

  const handleStartDispute = (lotId: string) => {
    // Usar o método do contexto para iniciar a disputa
    startDispute(lotId);

    toast({
      title: "Disputa Iniciada",
      description: `A disputa do lote ${lotId} foi iniciada.`,
    });
  };

  const handleEndDispute = (lotId: string) => {
    // Usar o método do contexto para encerrar a disputa
    endDispute(lotId);

    // Determinar o arrematante (menor valor)
    const suppliers = suppliersData[lotId]?.filter((s) => s.status === "classified") || [];
    if (suppliers.length > 0) {
      const winner = suppliers.reduce((prev, current) =>
        prev.value < current.value ? prev : current
      );

      // Atualizar status do fornecedor para vencedor
      updateSupplierStatus(winner.id, "winner");

      // Adicionar mensagem do sistema
      addSystemMessage(
        `O lote ${lotId} teve como arrematante ${
          winner.name
        } com lance de R$ ${winner.value.toFixed(2)}`
      );
    }

    toast({
      title: "Disputa Encerrada",
      description: `A disputa do lote ${lotId} foi encerrada.`,
    });
  };

  const handleDeclareWinner = (lotId: string) => {
    setSelectedLot(lotId);
    setDialogType("declare_winner");
  };

  const confirmDeclareWinner = () => {
    if (!selectedLot || !justification.trim()) return;

    // Encontramos o fornecedor com status de vencedor
    const winner = suppliersData[selectedLot]?.find((s) => s.status === "winner");

    if (winner) {
      // Usar o método do contexto para declarar o vencedor
      declareWinner(selectedLot, winner.id, justification);

      toast({
        title: "Vencedor Declarado",
        description: `Vencedor declarado para o lote ${selectedLot}. Agora pode seguir para fase recursal.`,
      });
    }

    closeDialog();
  };

  const handleNegotiate = (lotId: string) => {
    const winner = suppliersData[lotId]?.find((s) => s.status === "winner");

    if (winner) {
      // Usar o método do contexto para iniciar a negociação
      startNegotiation(lotId, winner.id);

      toast({
        title: "Negociação Iniciada",
        description: `Negociação iniciada com ${winner.name}.`,
      });
    } else {
      toast({
        title: "Erro",
        description: "Nenhum vencedor definido para negociação.",
      });
    }
  };

  const handleRequestDocuments = (lotId: string) => {
    setSelectedLot(lotId);
    setDialogType("request_documents");
  };

  const confirmRequestDocuments = () => {
    if (!selectedLot || !timeLimit) return;

    const deadline = new Date();
    deadline.setHours(deadline.getHours() + Number.parseInt(timeLimit));

    onChatMessage(
      `O Pregoeiro/Agente de Contratação solicita o envio dos documentos de habilitação para o lote ${selectedLot}. O prazo de envio é até às ${deadline.toLocaleTimeString()} do dia ${deadline.toLocaleDateString()}.`,
      "system"
    );

    toast({
      title: "Documentos Solicitados",
      description: `Documentos solicitados com prazo de ${timeLimit} hora(s).`,
    });

    closeDialog();
  };

  const closeDialog = () => {
    setDialogType(null);
    setSelectedLot(null);
    setSelectedSupplier(null);
    setJustification("");
    setTimeLimit("1");
  };

  const getAvailableActions = (lotId: string, localStatus: LotStatus) => {
    const actions = [];
    const workflowStatus = lotStatuses[lotId];

    switch (status) {
      case "waiting_to_open":
        actions.push({
          key: "open_proposals",
          label: "Abrir Propostas",
          description: "Primeiro ato após abertura da sessão pública",
          icon: Eye,
          variant: "default" as const,
          onClick: () => handleOpenProposals(lotId),
        });
        break;

      case "proposals_opened":
        actions.push(
          {
            key: "resource_manifestation",
            label: "Abrir Manifestação de Recursos",
            description: "Definir período para manifestação de recursos",
            icon: MessageSquare,
            variant: "outline" as const,
            onClick: () => handleOpenResourceManifestation(lotId),
          },
          {
            key: "start_dispute",
            label: "Iniciar Disputa",
            description: "Iniciar disputa de lances entre fornecedores classificados",
            icon: Gavel,
            variant: "default" as const,
            onClick: () => handleStartDispute(lotId),
          }
        );
        break;

      case "in_dispute":
        actions.push({
          key: "end_dispute",
          label: "Encerrar Disputa",
          description: "Finalizar disputa e definir arrematante",
          icon: Trophy,
          variant: "destructive" as const,
          onClick: () => handleEndDispute(lotId),
        });
        break;

      case "dispute_ended":
        actions.push(
          {
            key: "negotiate",
            label: "Negociar",
            description: "Iniciar negociação com arrematante",
            icon: DollarSign,
            variant: "outline" as const,
            onClick: () => handleNegotiate(lotId),
          },
          {
            key: "request_documents",
            label: "Pedir Documentos",
            description: "Solicitar documentos de habilitação",
            icon: FileText,
            variant: "outline" as const,
            onClick: () => handleRequestDocuments(lotId),
          },
          {
            key: "declare_winner",
            label: "Declarar Vencedor",
            description: "Declarar vencedor oficial do lote",
            icon: CheckCircle,
            variant: "default" as const,
            onClick: () => handleDeclareWinner(lotId),
          }
        );
        break;

      case "winner_declared":
        actions.push({
          key: "go_to_resource_phase",
          label: "Ir para Fase Recursal",
          description: "Gerenciar recursos em página dedicada",
          icon: Scale,
          variant: "default" as const,
          onClick: () => {
            // Navegar para página de fase recursal
            const currentUrl = window.location.pathname;
            const baseUrl = currentUrl.replace("/session/dispute", "");
            window.location.href = `/tenders/${lotId}/resource-phase`;
          },
        });
        break;
    }

    return actions;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Controles do Pregoeiro</h3>
            <p className="text-sm text-gray-600">
              Gerencie as fases principais da licitação eletrônica
            </p>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Info className="h-4 w-4 mr-1" />
            Sessão Pública Ativa
          </Badge>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Fluxo:</strong> Abrir Propostas → Classificar Fornecedores → Iniciar Disputa →
            Declarar Vencedor →<strong> Fase Recursal (página separada)</strong>
          </AlertDescription>
        </Alert>
      </div>

      {/* Cards dos lotes */}
      {lots.map((lot, index) => {
        // Obter status do workflow e convertê-lo para status local
        const workflowStatus = lotStatuses[lot.id];
        const localStatus = mapWorkflowToLocalStatus(workflowStatus);

        // Obter informações do status atual
        const statusInfo = getStatusInfo(workflowStatus);
        const StatusIcon = statusInfo.icon;

        // Obter ações disponíveis para o lote
        const actions = getAvailableActions(lot.id, localStatus);

        // Obter fornecedores e contagens
        const suppliers = suppliersData[lot.id] || [];
        const classifiedCount = suppliers.filter((s) => s.status === "classified").length;
        const disqualifiedCount = suppliers.filter((s) => s.status === "disqualified").length;
        const winnerCount = suppliers.filter((s) => s.status === "winner").length;

        return (
          <Card key={lot.id} className="w-full">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-gray-500" />
                    <CardTitle className="text-lg">
                      Lote {index + 1}: {lot.name || `Lote ${lot.id}`}
                    </CardTitle>
                  </div>
                  <p className="text-sm text-gray-600">
                    {lot.description || "Material de escritório e equipamentos diversos"}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      Valor estimado: R$ {(Math.random() * 10000 + 5000).toFixed(2)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {suppliers.length} fornecedores participantes
                    </div>
                  </div>
                </div>
                <Badge className={`${statusInfo.color} text-white`}>
                  <StatusIcon className="h-4 w-4 mr-1" />
                  {statusInfo.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Descrição da fase atual */}
              <Alert>
                <StatusIcon className="h-4 w-4" />
                <AlertDescription>
                  <strong>Fase Atual:</strong> {statusInfo.description}
                </AlertDescription>
              </Alert>

              {/* Ações disponíveis */}
              {actions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Ações Disponíveis:</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {actions.map((action) => {
                      const ActionIcon = action.icon;
                      return (
                        <div
                          key={action.key}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <ActionIcon className="h-4 w-4 text-gray-600" />
                            <div>
                              <div className="font-medium text-sm">{action.label}</div>
                              <div className="text-xs text-gray-600">{action.description}</div>
                            </div>
                          </div>
                          <Button size="sm" variant={action.variant} onClick={action.onClick}>
                            {action.label}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Resumo dos fornecedores */}
              {suppliers.length > 0 && (
                <div className="space-y-3">
                  <Separator />
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Status dos Fornecedores:</h4>
                    <div className="flex gap-2">
                      {classifiedCount > 0 && (
                        <Badge variant="default" className="text-xs">
                          {classifiedCount} Classificados
                        </Badge>
                      )}
                      {disqualifiedCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {disqualifiedCount} Desclassificados
                        </Badge>
                      )}
                      {winnerCount > 0 && (
                        <Badge className="bg-green-600 text-xs">{winnerCount} Arrematante</Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de fornecedores */}
              {(localStatus === "proposals_opened" ||
                localStatus === "resource_manifestation" ||
                localStatus === "dispute_ended" ||
                localStatus === "winner_declared") && (
                <div className="space-y-2">
                  {suppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      className="flex items-center justify-between p-3 bg-white border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            supplier.status === "classified"
                              ? "default"
                              : supplier.status === "winner"
                              ? "default"
                              : supplier.status === "disqualified"
                              ? "destructive"
                              : "secondary"
                          }
                          className={supplier.status === "winner" ? "bg-green-600" : ""}>
                          {supplier.status === "classified" && "Classificado"}
                          {supplier.status === "disqualified" && "Desclassificado"}
                          {supplier.status === "winner" && "Arrematante"}
                          {supplier.status === "eliminated" && "Eliminado"}
                        </Badge>
                        <div>
                          <div className="font-medium text-sm">{supplier.name}</div>
                          <div className="text-xs text-gray-600">{supplier.company}</div>
                        </div>
                        <div className="font-mono text-sm font-medium">
                          R$ {supplier.value.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {supplier.status === "classified" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDisqualifySupplier(lot.id, supplier.id)}>
                            <XCircle className="h-4 w-4 mr-1" />
                            Desclassificar
                          </Button>
                        )}
                        {supplier.status === "disqualified" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReclassifySupplier(lot.id, supplier.id)}>
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Reclassificar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Dialogs */}
      <Dialog open={dialogType === "disqualify"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desclassificar Fornecedor</DialogTitle>
            <DialogDescription>
              Informe a justificativa para desclassificar este fornecedor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="justification">Justificativa *</Label>
              <Textarea
                id="justification"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Digite a justificativa para a desclassificação..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDisqualifySupplier}
              disabled={!justification.trim()}>
              Desclassificar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogType === "resource_manifestation"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir Manifestação de Recursos</DialogTitle>
            <DialogDescription>
              Defina o período para manifestação de recursos pelos fornecedores.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="timeLimit">Período (horas)</Label>
              <Select value={timeLimit} onValueChange={setTimeLimit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hora</SelectItem>
                  <SelectItem value="2">2 horas</SelectItem>
                  <SelectItem value="4">4 horas</SelectItem>
                  <SelectItem value="8">8 horas</SelectItem>
                  <SelectItem value="24">24 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button onClick={confirmOpenResourceManifestation}>Abrir Manifestação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogType === "declare_winner"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Declarar Vencedor</DialogTitle>
            <DialogDescription>
              Informe a justificativa para declarar o vencedor deste lote.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="winner_justification">Justificativa *</Label>
              <Textarea
                id="winner_justification"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Digite a justificativa para declarar o vencedor..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button onClick={confirmDeclareWinner} disabled={!justification.trim()}>
              Declarar Vencedor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogType === "request_documents"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Documentos</DialogTitle>
            <DialogDescription>
              Defina o prazo para envio dos documentos de habilitação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="docTimeLimit">Prazo (horas)</Label>
              <Select value={timeLimit} onValueChange={setTimeLimit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 horas</SelectItem>
                  <SelectItem value="4">4 horas</SelectItem>
                  <SelectItem value="8">8 horas</SelectItem>
                  <SelectItem value="24">24 horas</SelectItem>
                  <SelectItem value="48">48 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button onClick={confirmRequestDocuments}>Solicitar Documentos</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
