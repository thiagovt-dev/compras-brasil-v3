"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
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
  Shuffle,
  Timer,
} from "lucide-react";

interface DisputeAuctioneerControlsProps {
  lots: any[];
  onChatMessage: (message: string, type: "system" | "auctioneer", lotId?: string, action?: string) => void;
  showControls?: boolean;
  onDisputeFinalized?: (lotId: string) => void;
}

type LotStatus =
  | "waiting_to_open"
  | "proposals_opened"
  | "resource_manifestation"
  | "dispute_ended"
  | "dispute_ended_tie"
  | "tiebreaker_active"
  | "winner_declared"
  | "finished";

type SupplierStatus = "classified" | "disqualified" | "winner" | "eliminated" | "tiebreaker";

// Dados mocados dos fornecedores por lote - Incluindo empates para demonstração
const mockSuppliersData: Record<string, any[]> = {
  "lot-001": [
    {
      id: "s1",
      name: "FORNECEDOR 15",
      company: "Tech Solutions LTDA",
      value: 2890.0,
      status: "classified" as SupplierStatus,
    },
    {
      id: "s2",
      name: "FORNECEDOR 22",
      company: "Inovação Digital ME",
      value: 2890.0,
      status: "classified" as SupplierStatus,
    },
    {
      id: "s3",
      name: "FORNECEDOR 8",
      company: "Sistemas Avançados S.A.",
      value: 2904.0,
      status: "classified" as SupplierStatus,
    },
  ],
  "lot-002": [
    {
      id: "s5",
      name: "FORNECEDOR 5",
      company: "Fornecedora Premium LTDA",
      value: 110.0,
      status: "classified" as SupplierStatus,
    },
    {
      id: "s6",
      name: "FORNECEDOR 18",
      company: "Distribuidora Central ME",
      value: 115.0,
      status: "classified" as SupplierStatus,
    },
  ],
  "lot-003": [
    {
      id: "s7",
      name: "FORNECEDOR 1",
      company: "Comercial Norte S.A.",
      value: 48.0,
      status: "classified" as SupplierStatus,
    },
    {
      id: "s8",
      name: "FORNECEDOR 7",
      company: "Suprimentos Sul LTDA",
      value: 49.5,
      status: "classified" as SupplierStatus,
    },
  ],
};

export function DisputeAuctioneerControls({ 
  lots, 
  onChatMessage,
  showControls = false,
  onDisputeFinalized
}: DisputeAuctioneerControlsProps) {
  // Inicializar com status "dispute_ended" como se a disputa já tivesse acontecido
  const [lotStatuses, setLotStatuses] = useState<Record<string, LotStatus>>(
    lots.reduce((acc, lot) => ({ ...acc, [lot.id]: "dispute_ended" as LotStatus }), {})
  );
  const [suppliersData, setSuppliersData] = useState(mockSuppliersData);
  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [dialogType, setDialogType] = useState<string | null>(null);
  const [justification, setJustification] = useState("");
  const [timeLimit, setTimeLimit] = useState("1");
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  
  // Estados para controle de tempo com horas e minutos
  const [timeLimitHours, setTimeLimitHours] = useState("2");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState("0");
  
  // Estados para controle de desempate
  const [tiebreakerSuppliers, setTiebreakerSuppliers] = useState<string[]>([]);
  const [tiebreakerTimeLeft, setTiebreakerTimeLeft] = useState<Record<string, number>>({});

  const { toast } = useToast();

  // Não renderizar se showControls for false
  if (!showControls) {
    return null;
  }

  // Verificar se há empate no lote
  const hasLotTie = (lotId: string) => {
    const suppliers = suppliersData[lotId]?.filter((s) => s.status === "classified") || [];
    if (suppliers.length < 2) return false;
    
    const minValue = Math.min(...suppliers.map(s => s.value));
    const tiedSuppliers = suppliers.filter(s => s.value === minValue);
    return tiedSuppliers.length > 1;
  };

  // Obter fornecedores empatados
  const getTiedSuppliers = (lotId: string) => {
    const suppliers = suppliersData[lotId]?.filter((s) => s.status === "classified") || [];
    if (suppliers.length < 2) return [];
    
    const minValue = Math.min(...suppliers.map(s => s.value));
    return suppliers.filter(s => s.value === minValue);
  };

  // Iniciar disputa de desempate
  const handleStartTiebreaker = (lotId: string) => {
    const tiedSuppliers = getTiedSuppliers(lotId);
    
    if (tiedSuppliers.length < 2) {
      toast({
        title: "Erro",
        description: "Não há empate entre fornecedores neste lote.",
        variant: "destructive",
      });
      return;
    }

    // Atualizar status do lote
    setLotStatuses(prev => ({ ...prev, [lotId]: "tiebreaker_active" }));
    
    // Marcar fornecedores empatados
    setSuppliersData(prev => ({
      ...prev,
      [lotId]: prev[lotId].map(supplier => 
        tiedSuppliers.some(tied => tied.id === supplier.id)
          ? { ...supplier, status: "tiebreaker" as SupplierStatus }
          : supplier
      )
    }));

    // Iniciar timer de 5 minutos
    setTiebreakerTimeLeft(prev => ({ ...prev, [lotId]: 300 })); // 5 minutos = 300 segundos
    
    // Simular countdown
    const countdown = setInterval(() => {
      setTiebreakerTimeLeft(prev => {
        const currentTime = prev[lotId];
        if (!currentTime || currentTime <= 1) {
          clearInterval(countdown);
          handleTiebreakerEnd(lotId);
          return { ...prev, [lotId]: 0 };
        }
        return { ...prev, [lotId]: currentTime - 1 };
      });
    }, 1000);

    // Enviar mensagem para o chat com ação especial de desempate
    const supplierNames = tiedSuppliers.map(s => s.name);
    
    // Incluir variações de nome para garantir compatibilidade com o usuário demo
    const supplierNamesForTiebreaker = [
      ...supplierNames,
      "FORNECEDOR 23", // Número do fornecedor demo
      "Fornecedor 23",
      "João Silva" // Nome do perfil demo
    ];
    
    onChatMessage(
      `Iniciada disputa de desempate para o lote ${lotId}. Fornecedores em disputa: ${supplierNames.join(", ")}. Tempo: 5 minutos.`,
      "system",
      lotId, // Passar o ID do lote
      "start_tiebreaker" // Ação especial
    );

    toast({
      title: "Disputa de Desempate Iniciada",
      description: `Disputa entre ${tiedSuppliers.length} fornecedores por 5 minutos.`,
    });
  };

  // Finalizar disputa de desempate
  const handleTiebreakerEnd = (lotId: string) => {
    // Simular que um dos fornecedores "venceu" o desempate com um lance ligeiramente menor
    const tiebreakerSuppliersInLot = suppliersData[lotId]?.filter(s => s.status === "tiebreaker") || [];
    
    if (tiebreakerSuppliersInLot.length > 0) {
      // Escolher aleatoriamente um vencedor do desempate
      const winner = tiebreakerSuppliersInLot[Math.floor(Math.random() * tiebreakerSuppliersInLot.length)];
      
      // Simular um lance ligeiramente menor para o vencedor
      const newValue = winner.value - 0.01;
      
      // Atualizar dados dos fornecedores
      setSuppliersData(prev => ({
        ...prev,
        [lotId]: prev[lotId].map(supplier => {
          if (supplier.id === winner.id) {
            return { ...supplier, value: newValue, status: "classified" as SupplierStatus };
          } else if (supplier.status === "tiebreaker") {
            return { ...supplier, status: "classified" as SupplierStatus };
          }
          return supplier;
        })
      }));

      // Atualizar status do lote
      setLotStatuses(prev => ({ ...prev, [lotId]: "dispute_ended" }));

      // Enviar mensagem para o chat
      onChatMessage(
        `Disputa de desempate finalizada para o lote ${lotId}. ${winner.name} apresentou lance de R$ ${newValue.toFixed(2)}.`,
        "system"
      );

      toast({
        title: "Disputa de Desempate Finalizada",
        description: `${winner.name} venceu com lance de R$ ${newValue.toFixed(2)}`,
      });
    }
  };

  // Finalizar manualmente disputa de desempate
  const handleFinalizeTiebreaker = (lotId: string) => {
    setTiebreakerTimeLeft(prev => ({ ...prev, [lotId]: 0 }));
    handleTiebreakerEnd(lotId);
  };

  // Função para formatar tempo do desempate
  const formatTiebreakerTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calcular tempo total em horas a partir de horas e minutos
  const getTotalTimeInHours = () => {
    const hours = parseInt(timeLimitHours) || 0;
    const minutes = parseInt(timeLimitMinutes) || 0;
    return hours + (minutes / 60);
  };

  // Formatar tempo para exibição
  const formatTimeDisplay = () => {
    const hours = parseInt(timeLimitHours) || 0;
    const minutes = parseInt(timeLimitMinutes) || 0;
    
    if (hours === 0 && minutes === 0) return "0 minutos";
    if (hours === 0) return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    if (minutes === 0) return `${hours} hora${hours !== 1 ? 's' : ''}`;
    return `${hours} hora${hours !== 1 ? 's' : ''} e ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  };

  const getStatusInfo = (status: LotStatus) => {
    const statusMap = {
      waiting_to_open: {
        label: "Aguardando Abertura",
        color: "bg-gray-500",
        icon: Clock,
        description: "Clique em 'Abrir Propostas' para iniciar a análise das propostas recebidas",
      },
      proposals_opened: {
        label: "Propostas Abertas",
        color: "bg-blue-500",
        icon: Eye,
        description: "Analise as propostas e classifique/desclassifique os fornecedores",
      },
      resource_manifestation: {
        label: "Manifestação de Recursos",
        color: "bg-yellow-500",
        icon: MessageSquare,
        description: "Período aberto para manifestação de recursos pelos fornecedores",
      },
      dispute_ended: {
        label: "Disputa Encerrada",
        color: "bg-purple-500",
        icon: Trophy,
        description: "Disputa finalizada. Proceda com declaração de vencedor",
      },
      dispute_ended_tie: {
        label: "Disputa Encerrada com Empate",
        color: "bg-orange-500",
        icon: Shuffle,
        description: "Empate detectado. Inicie disputa de desempate",
      },
      tiebreaker_active: {
        label: "Desempate em Andamento",
        color: "bg-red-500",
        icon: Timer,
        description: "Disputa de desempate ativa entre fornecedores empatados",
      },
      winner_declared: {
        label: "Vencedor Declarado",
        color: "bg-green-500",
        icon: CheckCircle,
        description: "Vencedor declarado. Processo pode seguir para fase recursal",
      },
      finished: {
        label: "Finalizado",
        color: "bg-gray-700",
        icon: CheckCircle,
        description: "Processo de licitação finalizado",
      },
    };
    return statusMap[status];
  };

  const handleOpenProposals = (lotId: string) => {
    setLotStatuses((prev) => ({ ...prev, [lotId]: "proposals_opened" }));
    onChatMessage(
      `O processo está em fase de análise das propostas para o lote ${lotId}`,
      "system"
    );
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

    setSuppliersData((prev) => ({
      ...prev,
      [selectedLot]: prev[selectedLot].map((supplier) =>
        supplier.id === selectedSupplier
          ? { ...supplier, status: "disqualified" as SupplierStatus }
          : supplier
      ),
    }));

    const supplier = suppliersData[selectedLot]?.find((s) => s.id === selectedSupplier);
    onChatMessage(
      `A proposta do ${supplier?.name} para o lote ${selectedLot} foi desclassificada com a seguinte justificativa: "${justification}"`,
      "system"
    );

    toast({
      title: "Fornecedor Desclassificado",
      description: `${supplier?.name} foi desclassificado do lote ${selectedLot}.`,
    });

    closeDialog();
  };

  const handleReclassifySupplier = (lotId: string, supplierId: string) => {
    setSuppliersData((prev) => ({
      ...prev,
      [lotId]: prev[lotId].map((supplier) =>
        supplier.id === supplierId
          ? { ...supplier, status: "classified" as SupplierStatus }
          : supplier
      ),
    }));

    const supplier = suppliersData[lotId]?.find((s) => s.id === supplierId);
    onChatMessage(
      `O fornecedor ${supplier?.name} foi reclassificado para o lote ${lotId}`,
      "system"
    );

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
    if (!selectedLot) return;

    const totalTime = getTotalTimeInHours();
    const timeDisplay = formatTimeDisplay();

    setLotStatuses((prev) => ({ ...prev, [selectedLot]: "resource_manifestation" }));
    onChatMessage(
      `Aberta manifestação de recursos para o lote ${selectedLot} pelo período de ${timeDisplay}`,
      "system"
    );

    toast({
      title: "Manifestação de Recursos Aberta",
      description: `Período de ${timeDisplay} para manifestação de recursos.`,
    });

    closeDialog();
  };

  // Função modificada: Agora verifica empate antes de definir vencedor
  const handleDefineWinnerAutomatically = (lotId: string) => {
    const suppliers = suppliersData[lotId]?.filter((s) => s.status === "classified") || [];
    if (suppliers.length === 0) return;

    // Verificar se há empate
    if (hasLotTie(lotId)) {
      // Atualizar status para empate
      setLotStatuses((prev) => ({ ...prev, [lotId]: "dispute_ended_tie" }));
      
      const tiedSuppliers = getTiedSuppliers(lotId);
      const supplierNames = tiedSuppliers.map(s => s.name).join(", ");
      
      onChatMessage(
        `Empate detectado no lote ${lotId} entre os fornecedores: ${supplierNames}, todos com R$ ${tiedSuppliers[0].value.toFixed(2)}`,
        "system"
      );

      toast({
        title: "Empate Detectado",
        description: `${tiedSuppliers.length} fornecedores empatados com R$ ${tiedSuppliers[0].value.toFixed(2)}`,
        variant: "default",
      });
      return;
    }

    // Se não há empate, proceder normalmente
    const winner = suppliers.reduce((prev, current) =>
      prev.value < current.value ? prev : current
    );

    // Atualizar status do vencedor
    setSuppliersData((prev) => ({
      ...prev,
      [lotId]: prev[lotId].map((supplier) =>
        supplier.id === winner.id ? { ...supplier, status: "winner" as SupplierStatus } : supplier
      ),
    }));

    // Declarar vencedor automaticamente com justificativa padrão
    setLotStatuses((prev) => ({ ...prev, [lotId]: "winner_declared" }));

    onChatMessage(
      `O Pregoeiro/Agente de Contratação declarou vencedor ${winner.name} (${winner.company}) para o lote ${lotId}, com a seguinte justificativa: "Fornecedor com menor lance - R$ ${winner.value.toFixed(2)}"`,
      "system"
    );

    toast({
      title: "Vencedor Declarado",
      description: `${winner.name} foi declarado vencedor com R$ ${winner.value.toFixed(2)} (menor lance)`,
    });
  };

  // Classificar fornecedor específico como vencedor
  const handleClassifyAsWinner = (lotId: string, supplierId: string) => {
    setSelectedLot(lotId);
    setSelectedSupplier(supplierId);
    setDialogType("classify_winner");
  };

  const confirmClassifyAsWinner = () => {
    if (!selectedLot || !selectedSupplier || !justification.trim()) return;

    const supplier = suppliersData[selectedLot]?.find((s) => s.id === selectedSupplier);

    // Atualizar status do vencedor
    setSuppliersData((prev) => ({
      ...prev,
      [selectedLot]: prev[selectedLot].map((supplier) =>
        supplier.id === selectedSupplier ? { ...supplier, status: "winner" as SupplierStatus } : supplier
      ),
    }));

    // Declarar vencedor com justificativa personalizada
    setLotStatuses((prev) => ({ ...prev, [selectedLot]: "winner_declared" }));

    onChatMessage(
      `O Pregoeiro/Agente de Contratação declarou vencedor ${supplier?.name} (${supplier?.company}) para o lote ${selectedLot}, com a seguinte justificativa: "${justification}"`,
      "system"
    );

    toast({
      title: "Vencedor Declarado",
      description: `${supplier?.name} foi declarado vencedor com justificativa personalizada.`,
    });

    closeDialog();
  };

  const handleNegotiate = (lotId: string) => {
    const winner = suppliersData[lotId]?.find((s) => s.status === "winner");
    onChatMessage(
      `O Pregoeiro/Agente de Contratação está negociando o lote ${lotId} com o detentor da melhor oferta.`,
      "system"
    );

    toast({
      title: "Negociação Iniciada",
      description: `Negociação iniciada com ${winner?.name}.`,
    });
  };

  const handleRequestDocuments = (lotId: string) => {
    setSelectedLot(lotId);
    setDialogType("request_documents");
  };

  const confirmRequestDocuments = () => {
    if (!selectedLot) return;

    const totalHours = getTotalTimeInHours();
    const timeDisplay = formatTimeDisplay();
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + Math.floor(totalHours));
    deadline.setMinutes(deadline.getMinutes() + Math.round((totalHours % 1) * 60));

    onChatMessage(
      `O Pregoeiro/Agente de Contratação solicita o envio dos documentos de habilitação para o lote ${selectedLot}. O prazo de envio é até às ${deadline.toLocaleTimeString()} do dia ${deadline.toLocaleDateString()}.`,
      "system"
    );

    toast({
      title: "Documentos Solicitados",
      description: `Documentos solicitados com prazo de ${timeDisplay}.`,
    });

    closeDialog();
  };

  const closeDialog = () => {
    setDialogType(null);
    setSelectedLot(null);
    setSelectedSupplier(null);
    setJustification("");
    setTimeLimit("1");
    setTimeLimitHours("2");
    setTimeLimitMinutes("0");
  };

  const getAvailableActions = (lotId: string, status: LotStatus) => {
    const actions = [];

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
        actions.push({
          key: "resource_manifestation",
          label: "Abrir Manifestação de Recursos",
          description: "Definir período para manifestação de recursos",
          icon: MessageSquare,
          variant: "outline" as const,
          onClick: () => handleOpenResourceManifestation(lotId),
        });
        break;

      case "dispute_ended":
        const hasTie = hasLotTie(lotId);
        actions.push(
          {
            key: "define_winner_auto",
            label: hasTie ? "🎯 Desempate" : "🎯 Definir Vencedor (Menor Lance)",
            description: hasTie 
              ? "Iniciar disputa de desempate entre fornecedores empatados" 
              : "Define automaticamente o vencedor pelo menor valor",
            icon: hasTie ? Shuffle : Trophy,
            variant: "default" as const,
            onClick: () => hasTie ? handleStartTiebreaker(lotId) : handleDefineWinnerAutomatically(lotId),
          },
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
          }
        );
        break;

      case "dispute_ended_tie":
        actions.push({
          key: "start_tiebreaker",
          label: "🎯 Iniciar Desempate",
          description: "Iniciar disputa de desempate (5 minutos)",
          icon: Shuffle,
          variant: "default" as const,
          onClick: () => handleStartTiebreaker(lotId),
        });
        break;

      case "tiebreaker_active":
        actions.push({
          key: "finalize_tiebreaker",
          label: "⏹️ Finalizar Desempate",
          description: "Finalizar disputa de desempate manualmente",
          icon: Timer,
          variant: "destructive" as const,
          onClick: () => handleFinalizeTiebreaker(lotId),
        });
        break;

      case "winner_declared":
        actions.push({
          key: "go_to_resource_phase",
          label: "Ir para Fase Recursal",
          description: "Gerenciar recursos em página dedicada",
          icon: Scale,
          variant: "default" as const,
          onClick: () => {
            window.location.href = `/demo/resource-phase?lot=${lotId}`;
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
      </div>

      {/* Cards dos lotes */}
      {lots.map((lot, index) => {
        const status = lotStatuses[lot.id];
        const statusInfo = getStatusInfo(status);
        const StatusIcon = statusInfo.icon;
        const actions = getAvailableActions(lot.id, status);
        const suppliers = suppliersData[lot.id] || [];
        const classifiedCount = suppliers.filter((s) => s.status === "classified").length;
        const disqualifiedCount = suppliers.filter((s) => s.status === "disqualified").length;
        const winnerCount = suppliers.filter((s) => s.status === "winner").length;
        const tiebreakerCount = suppliers.filter((s) => s.status === "tiebreaker").length;
        const timeLeft = tiebreakerTimeLeft[lot.id];

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
                      Valor estimado: R$ {lot.estimatedValue?.toFixed(2) || "10.000,00"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {suppliers.length} fornecedores participantes
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={`${statusInfo.color} text-white`}>
                    <StatusIcon className="h-4 w-4 mr-1" />
                    {statusInfo.label}
                  </Badge>
                  {/* Timer de desempate */}
                  {status === "tiebreaker_active" && timeLeft !== undefined && (
                    <Badge variant="destructive" className="animate-pulse">
                      <Timer className="h-4 w-4 mr-1" />
                      {formatTiebreakerTime(timeLeft)}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Descrição da fase atual */}
              <Alert className={status === "tiebreaker_active" ? "border-red-200 bg-red-50" : ""}>
                <StatusIcon className="h-4 w-4" />
                <AlertDescription>
                  <strong>Fase Atual:</strong> {statusInfo.description}
                  {status === "tiebreaker_active" && timeLeft !== undefined && (
                    <div className="mt-2 text-red-700 font-medium">
                      Tempo restante para desempate: {formatTiebreakerTime(timeLeft)}
                    </div>
                  )}
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
                      {tiebreakerCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {tiebreakerCount} Em Desempate
                        </Badge>
                      )}
                      {disqualifiedCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {disqualifiedCount} Desclassificados
                        </Badge>
                      )}
                      {winnerCount > 0 && (
                        <Badge className="bg-green-600 text-xs">{winnerCount} Vencedor</Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de fornecedores */}
              {(status === "proposals_opened" ||
                status === "resource_manifestation" ||
                status === "dispute_ended" ||
                status === "dispute_ended_tie" ||
                status === "tiebreaker_active" ||
                status === "winner_declared") && (
                <div className="space-y-2">
                  {suppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      className={`flex items-center justify-between p-3 border rounded-lg ${
                        supplier.status === "tiebreaker" ? "bg-red-50 border-red-200" : "bg-white"
                      }`}>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            supplier.status === "classified"
                              ? "default"
                              : supplier.status === "winner"
                              ? "default"
                              : supplier.status === "tiebreaker"
                              ? "destructive"
                              : supplier.status === "disqualified"
                              ? "destructive"
                              : "secondary"
                          }
                          className={
                            supplier.status === "winner" 
                              ? "bg-green-600" 
                              : supplier.status === "tiebreaker"
                              ? "bg-red-600 animate-pulse"
                              : ""
                          }>
                          {supplier.status === "classified" && "Classificado"}
                          {supplier.status === "disqualified" && "Desclassificado"}
                          {supplier.status === "winner" && "Vencedor"}
                          {supplier.status === "tiebreaker" && "Em Desempate"}
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
                        {supplier.status === "classified" && status !== "tiebreaker_active" && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleClassifyAsWinner(lot.id, supplier.id)}
                              className="bg-green-600 hover:bg-green-700">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Declarar Vencedor
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDisqualifySupplier(lot.id, supplier.id)}>
                              <XCircle className="h-4 w-4 mr-1" />
                              Desclassificar
                            </Button>
                          </>
                        )}
                        {supplier.status === "tiebreaker" && (
                          <Badge variant="destructive" className="animate-pulse">
                            <Timer className="h-4 w-4 mr-1" />
                            Disputando
                          </Badge>
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
                        {supplier.status === "winner" && (
                          <Badge className="bg-green-600 text-white">
                            <Trophy className="h-4 w-4 mr-1" />
                            Vencedor Declarado
                          </Badge>
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
              <Label>Período para Manifestação</Label>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1">
                  <Label htmlFor="hours" className="text-sm text-gray-600">Horas</Label>
                  <Input
                    id="hours"
                    type="number"
                    min="0"
                    max="72"
                    value={timeLimitHours}
                    onChange={(e) => setTimeLimitHours(e.target.value)}
                    placeholder="2"
                    className="mt-1"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="minutes" className="text-sm text-gray-600">Minutos</Label>
                  <Input
                    id="minutes"
                    type="number"
                    min="0"
                    max="59"
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(e.target.value)}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Período total: <strong>{formatTimeDisplay()}</strong>
              </p>
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

      <Dialog open={dialogType === "classify_winner"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Declarar Fornecedor Vencedor</DialogTitle>
            <DialogDescription>
              Informe a justificativa para declarar este fornecedor como vencedor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedSupplier && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium">Fornecedor Selecionado:</h4>
                <p>{suppliersData[selectedLot || ""]?.find(s => s.id === selectedSupplier)?.name}</p>
                <p className="text-sm text-gray-600">{suppliersData[selectedLot || ""]?.find(s => s.id === selectedSupplier)?.company}</p>
                <p className="mt-1 font-mono font-medium">R$ {suppliersData[selectedLot || ""]?.find(s => s.id === selectedSupplier)?.value.toFixed(2)}</p>
              </div>
            )}
            <div>
              <Label htmlFor="winner_justification">Justificativa *</Label>
              <Textarea
                id="winner_justification"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Digite a justificativa para declarar este fornecedor como vencedor..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmClassifyAsWinner} 
              disabled={!justification.trim()}
              className="bg-green-600 hover:bg-green-700">
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
              <Label>Prazo para Envio</Label>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1">
                  <Label htmlFor="docHours" className="text-sm text-gray-600">Horas</Label>
                  <Input
                    id="docHours"
                    type="number"
                    min="0"
                    max="168"
                    value={timeLimitHours}
                    onChange={(e) => setTimeLimitHours(e.target.value)}
                    placeholder="2"
                    className="mt-1"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="docMinutes" className="text-sm text-gray-600">Minutos</Label>
                  <Input
                    id="docMinutes"
                    type="number"
                    min="0"
                    max="59"
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(e.target.value)}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Prazo total: <strong>{formatTimeDisplay()}</strong>
              </p>
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