"use client";

import { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  FileText,
  Scale,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  MessageSquare,
  Gavel,
  ArrowLeft,
  Info,
  Package,
} from "lucide-react";
import { format, addBusinessDays, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import {
  useTenderWorkflow,
  ResourceData,
  ResourcePhase,
} from "@/lib/contexts/tender-workflow-context";

export default function ResourcePhasePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const lotId = searchParams.get("lot") || "lot-001";

  // Use o contexto de workflow
  const {
    resourcePhase: currentPhase,
    setResourcePhase: setCurrentPhase,
    manifestationDeadline,
    setManifestationDeadline,
    resourceDeadline,
    setResourceDeadline,
    counterArgumentDeadline,
    setCounterArgumentDeadline,
    resources,
    addResource,
    updateResource,
    systemMessages,
    addSystemMessage,
    lots,
    suppliers,
    openResourcePhase,
    addResourceManifestation,
    submitResource,
    submitCounterArgument,
    judgeResource,
    adjudicate,
    homologate,
    revoke,
  } = useTenderWorkflow();

  // Definimos o lote atual com base no ID
  const currentLot = lots.find((lot) => lot.id === lotId) || lots[0];

  // Encontramos o fornecedor vencedor para este lote
  const winnerSupplier = suppliers.find((s) => s.lotId === lotId && s.status === "winner");

  // Mockado para manter o formato dos dados original
  const tenderData = {
    id: "tender-001",
    number: "001/2024",
    title: "Pregão Eletrônico - Material de Escritório",
    agency: "Prefeitura Municipal de São Paulo",
  };

  // Convertemos o lote do contexto para o formato esperado pela UI
  const lotData = {
    id: currentLot.id,
    number: currentLot.number,
    name: currentLot.name,
    description: currentLot.description,
    estimatedValue: currentLot.estimatedValue,
    winner: winnerSupplier
      ? {
          id: winnerSupplier.id,
          name: winnerSupplier.name,
          company: winnerSupplier.company,
          value: winnerSupplier.value,
        }
      : {
          id: "no-winner",
          name: "Nenhum vencedor declarado",
          company: "",
          value: 0,
        },
  };

  // Estados locais apenas para controle da UI
  const [dialogType, setDialogType] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [manifestationHours, setManifestationHours] = useState("2");
  const [justification, setJustification] = useState("");
  const [resourceContent, setResourceContent] = useState("");
  const [counterArgumentContent, setCounterArgumentContent] = useState("");
  const [judgment, setJudgment] = useState<"procedente" | "improcedente" | null>(null);

  const { toast } = useToast();

  // Convertendo mensagens do sistema para o formato esperado pela UI
  const chatMessages = systemMessages.map((msg) => ({
    message: msg.content,
    timestamp: msg.timestamp,
    type: msg.type === "system" ? ("system" as const) : ("auctioneer" as const),
  }));

  const getPhaseInfo = (phase: ResourcePhase) => {
    const phaseMap = {
      not_started: {
        label: "Não Iniciada",
        color: "bg-gray-500",
        icon: Clock,
        description: "Fase recursal ainda não foi aberta",
      },
      manifestation_open: {
        label: "Manifestação Aberta",
        color: "bg-blue-500",
        icon: MessageSquare,
        description: "Período aberto para manifestação de intenção de recurso",
      },
      waiting_resource: {
        label: "Aguardando Recursos",
        color: "bg-yellow-500",
        icon: FileText,
        description: "Aguardando envio das razões de recurso",
      },
      resource_submitted: {
        label: "Recurso Apresentado",
        color: "bg-orange-500",
        icon: Scale,
        description: "Recurso apresentado, aguardando contrarrazões",
      },
      counter_argument: {
        label: "Fase de Contrarrazões",
        color: "bg-purple-500",
        icon: MessageSquare,
        description: "Período aberto para contrarrazões dos demais licitantes",
      },
      judgment: {
        label: "Em Julgamento",
        color: "bg-red-500",
        icon: Gavel,
        description: "Recurso em análise pela autoridade competente",
      },
      adjudicated: {
        label: "Adjudicado",
        color: "bg-green-500",
        icon: CheckCircle,
        description: "Item adjudicado ao vencedor",
      },
      homologated: {
        label: "Homologado",
        color: "bg-emerald-600",
        icon: CheckCircle,
        description: "Licitação homologada pela autoridade superior",
      },
      revoked: {
        label: "Revogado",
        color: "bg-red-600",
        icon: XCircle,
        description: "Licitação revogada pela autoridade superior",
      },
    };
    return phaseMap[phase];
  };

  const handleOpenManifestation = () => {
    setDialogType("open_manifestation");
  };

  const confirmOpenManifestation = () => {
    const hours = Number.parseInt(manifestationHours);

    // Usamos a função do contexto para abrir a fase recursal
    openResourcePhase(lotId, hours);

    // Atualizamos os prazos localmente também para a UI
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + hours);
    setManifestationDeadline(deadline);

    toast({
      title: "Fase Recursal Aberta",
      description: `Prazo de ${manifestationHours} hora(s) para manifestação.`,
    });

    closeDialog();

    // Simular timeout para demo (5 segundos)
    setTimeout(() => {
      if (resources.length === 0) {
        setCurrentPhase("adjudicated");
        addSystemMessage(
          `Não houve manifestação de recurso para o lote ${lotData.number}. O item está em adjudicação.`
        );
      } else {
        setCurrentPhase("waiting_resource");
        const resourceDeadline = addBusinessDays(new Date(), 3);
        resourceDeadline.setHours(23, 59, 59);
        setResourceDeadline(resourceDeadline);
      }
    }, 5000);
  };

  const handleManifestResource = (supplierId: string) => {
    // Usamos a função do contexto para manifestar intenção de recurso
    addResourceManifestation(lotId, supplierId);

    // Atualizamos o prazo localmente também para a UI
    const resourceDeadline = addBusinessDays(new Date(), 3);
    resourceDeadline.setHours(23, 59, 59);
    setResourceDeadline(resourceDeadline);

    // Encontramos o fornecedor para mostrar a notificação
    const supplier = suppliers.find((s) => s.id === supplierId);

    toast({
      title: "Recurso Manifestado",
      description: supplier
        ? `${supplier.name} manifestou intenção de recurso.`
        : "Recurso manifestado com sucesso",
    });
  };

  const handleSubmitResource = (resourceId: string) => {
    setSelectedResource(resourceId);
    setDialogType("submit_resource");
  };

  const confirmSubmitResource = () => {
    if (!selectedResource || !resourceContent.trim()) return;

    // Encontramos o recurso e o fornecedor para obter informações necessárias
    const resource = resources.find((r) => r.id === selectedResource);
    if (resource) {
      // Atualizamos o recurso utilizando a função do contexto
      updateResource(selectedResource, {
        phase: "submitted",
        submissionDate: new Date(),
        content: resourceContent,
      });

      // Configuramos o prazo para contrarrazões
      const counterDeadline = addBusinessDays(new Date(), 3);
      counterDeadline.setHours(23, 59, 59);
      setCounterArgumentDeadline(counterDeadline);
      setCurrentPhase("counter_argument");

      // Usamos a função do contexto para submeter o recurso
      submitResource(lotId, resource.supplierId, resourceContent);
    }

    toast({
      title: "Recurso Apresentado",
      description: "Recurso foi submetido com sucesso.",
    });

    closeDialog();
  };

  const handleSubmitCounterArgument = (resourceId: string) => {
    setSelectedResource(resourceId);
    setDialogType("submit_counter_argument");
  };

  const confirmSubmitCounterArgument = () => {
    if (!selectedResource || !counterArgumentContent.trim()) return;

    // Usamos um fornecedor existente para contrarrazão (o primeiro da lista diferente do autor do recurso)
    const resource = resources.find((r) => r.id === selectedResource);
    if (!resource) return;

    // Encontramos um fornecedor para contrarrazão que não seja o autor do recurso
    const counterSupplier = suppliers.find((s) => s.id !== resource.supplierId);
    if (!counterSupplier) return;

    // Usando a função do contexto para adicionar contrarrazão
    submitCounterArgument(selectedResource, counterSupplier.id, counterArgumentContent);

    // Também atualizamos o recurso diretamente para refletir a mudança na UI
    updateResource(selectedResource, {
      counterArguments: [
        ...(resource.counterArguments || []),
        {
          id: `counter-${Date.now()}`,
          supplierId: counterSupplier.id,
          supplierName: counterSupplier.name,
          content: counterArgumentContent,
          submissionDate: new Date(),
        },
      ],
    });

    toast({
      title: "Contrarrazão Apresentada",
      description: "Contrarrazão foi submetida com sucesso.",
    });

    closeDialog();
  };

  const handleJudgeResource = (resourceId: string) => {
    setSelectedResource(resourceId);
    setDialogType("judge_resource");
  };

  const confirmJudgeResource = () => {
    if (!selectedResource || !judgment || !justification.trim()) return;

    // Usamos a função do contexto para julgar o recurso
    judgeResource(selectedResource, judgment, justification);

    // Também atualizamos o recurso diretamente para refletir a mudança na UI
    updateResource(selectedResource, {
      phase: "judged",
      judgment: {
        decision: judgment,
        justification,
        date: new Date(),
      },
    });

    setCurrentPhase("adjudicated");

    toast({
      title: "Recurso Julgado",
      description: `Recurso foi julgado como ${judgment}.`,
    });

    closeDialog();
  };

  const handleAdjudicate = () => {
    setDialogType("adjudicate");
  };

  const confirmAdjudicate = () => {
    // Usamos a função do contexto para adjudicar o lote
    const winner = lotData.winner.id;
    adjudicate(lotId, winner);

    setCurrentPhase("adjudicated");

    toast({
      title: "Lote Adjudicado",
      description: `Lote adjudicado para ${lotData.winner.name}.`,
    });

    closeDialog();
  };

  const handleHomologate = () => {
    setDialogType("homologate");
  };

  const confirmHomologate = () => {
    // Usamos a função do contexto para homologar o lote
    homologate(lotId);

    setCurrentPhase("homologated");

    toast({
      title: "Lote Homologado",
      description: "Licitação foi homologada com sucesso.",
    });

    closeDialog();
  };

  const handleRevoke = () => {
    setDialogType("revoke");
  };

  const confirmRevoke = () => {
    if (!justification.trim()) return;

    // Usamos a função do contexto para revogar o lote
    revoke(lotId, justification);

    setCurrentPhase("revoked");

    toast({
      title: "Lote Revogado",
      description: "Licitação foi revogada pela autoridade superior.",
    });

    closeDialog();
  };

  const closeDialog = () => {
    setDialogType(null);
    setSelectedResource(null);
    setJustification("");
    setResourceContent("");
    setCounterArgumentContent("");
    setJudgment(null);
  };

  const handleBack = () => {
    router.push(`/demo/dispute`);

    // router.push(`/tenders/${resolvedParams.id}/session/dispute`);
  };

  const phaseInfo = getPhaseInfo(currentPhase);
  const PhaseIcon = phaseInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Sessão
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Fase Recursal</h1>
              <p className="text-gray-600">
                {tenderData.title} - Lote {lotData.number}
              </p>
            </div>
          </div>
          <Badge className={`${phaseInfo.color} text-white`}>
            <PhaseIcon className="h-4 w-4 mr-1" />
            {phaseInfo.label}
          </Badge>
        </div>

        {/* Layout em Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status da Fase */}
            <Alert>
              <PhaseIcon className="h-4 w-4" />
              <AlertDescription>
                <strong>Status Atual:</strong> {phaseInfo.description}
              </AlertDescription>
            </Alert>

            {/* Informações do Lote */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Informações do Lote
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Lote:</span>
                    <p className="font-medium">
                      {lotData.number} - {lotData.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Valor Estimado:</span>
                    <p className="font-medium">
                      R${" "}
                      {lotData.estimatedValue.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Vencedor Declarado:</span>
                    <p className="font-medium">{lotData.winner.name}</p>
                    <p className="text-sm text-gray-600">{lotData.winner.company}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Valor Vencedor:</span>
                    <p className="font-medium text-green-600">
                      R${" "}
                      {lotData.winner.value.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prazos Ativos */}
            {(manifestationDeadline || resourceDeadline || counterArgumentDeadline) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Prazos Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {manifestationDeadline && currentPhase === "manifestation_open" && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <div className="font-medium">Manifestação de Recurso</div>
                        <div className="text-sm text-gray-600">Prazo para manifestar intenção</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm">
                          {format(manifestationDeadline, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {isAfter(new Date(), manifestationDeadline)
                            ? "Encerrado"
                            : "Em andamento"}
                        </div>
                      </div>
                    </div>
                  )}

                  {resourceDeadline && currentPhase === "waiting_resource" && (
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <div className="font-medium">Envio de Recursos</div>
                        <div className="text-sm text-gray-600">Prazo para envio das razões</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm">
                          {format(resourceDeadline, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {isAfter(new Date(), resourceDeadline) ? "Encerrado" : "Em andamento"}
                        </div>
                      </div>
                    </div>
                  )}

                  {counterArgumentDeadline && currentPhase === "counter_argument" && (
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div>
                        <div className="font-medium">Contrarrazões</div>
                        <div className="text-sm text-gray-600">Prazo para contrarrazões</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm">
                          {format(counterArgumentDeadline, "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {isAfter(new Date(), counterArgumentDeadline)
                            ? "Encerrado"
                            : "Em andamento"}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Ações Disponíveis */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {currentPhase === "not_started" && (
                    <Button onClick={handleOpenManifestation}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Abrir Fase Recursal
                    </Button>
                  )}

                  {currentPhase === "manifestation_open" && (
                    <div className="space-y-3 w-full">
                      <p className="text-sm text-gray-600">
                        Fornecedores podem manifestar intenção de recurso:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {suppliers
                          .filter((s) => s.lotId === lotId)
                          .map((supplier) => (
                            <Button
                              key={supplier.id}
                              variant="outline"
                              size="sm"
                              onClick={() => handleManifestResource(supplier.id)}
                              disabled={resources.some((r) => r.supplierId === supplier.id)}>
                              <User className="h-4 w-4 mr-2" />
                              {supplier.name}
                            </Button>
                          ))}
                      </div>
                    </div>
                  )}

                  {currentPhase === "waiting_resource" &&
                    resources.map((resource) => (
                      <Button
                        key={resource.id}
                        variant="outline"
                        onClick={() => handleSubmitResource(resource.id)}
                        disabled={resource.phase === "submitted"}>
                        <FileText className="h-4 w-4 mr-2" />
                        {resource.supplierName} -{" "}
                        {resource.phase === "submitted" ? "Recurso Enviado" : "Enviar Recurso"}
                      </Button>
                    ))}

                  {currentPhase === "counter_argument" && (
                    <div className="space-y-3 w-full">
                      <p className="text-sm text-gray-600">
                        Demais fornecedores podem apresentar contrarrazões:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {resources.map((resource) => (
                          <Button
                            key={`counter-${resource.id}`}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSubmitCounterArgument(resource.id)}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Contrarrazão - {resource.supplierName}
                          </Button>
                        ))}
                        <Button onClick={() => setCurrentPhase("judgment")}>
                          <Gavel className="h-4 w-4 mr-2" />
                          Iniciar Julgamento
                        </Button>
                      </div>
                    </div>
                  )}

                  {currentPhase === "judgment" &&
                    resources.map((resource) => (
                      <Button
                        key={`judge-${resource.id}`}
                        onClick={() => handleJudgeResource(resource.id)}
                        disabled={resource.phase === "judged"}>
                        <Scale className="h-4 w-4 mr-2" />
                        {resource.phase === "judged"
                          ? "Recurso Julgado"
                          : `Julgar - ${resource.supplierName}`}
                      </Button>
                    ))}

                  {(currentPhase === "adjudicated" ||
                    (currentPhase === "judgment" &&
                      resources.every((r) => r.phase === "judged"))) && (
                    <div className="flex gap-3">
                      <Button onClick={handleAdjudicate}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Adjudicar Lote
                      </Button>
                      <Button onClick={handleHomologate}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Homologar
                      </Button>
                      <Button variant="destructive" onClick={handleRevoke}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Revogar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recursos e Contrarrazões */}
            {resources.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recursos Apresentados</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="resources">
                    <TabsList>
                      <TabsTrigger value="resources">Recursos</TabsTrigger>
                      <TabsTrigger value="counter_arguments">Contrarrazões</TabsTrigger>
                      <TabsTrigger value="judgments">Julgamentos</TabsTrigger>
                    </TabsList>

                    <TabsContent value="resources" className="space-y-4">
                      {resources.map((resource) => (
                        <div key={resource.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{resource.supplierName}</h4>
                              <p className="text-sm text-gray-600">{resource.supplierCompany}</p>
                              <p className="text-sm text-gray-600">
                                Manifestado em: {resource.manifestationDate?.toLocaleString()}
                              </p>
                            </div>
                            <Badge
                              variant={
                                resource.phase === "submitted"
                                  ? "default"
                                  : resource.phase === "judged"
                                  ? "secondary"
                                  : "outline"
                              }>
                              {resource.phase === "manifested" && "Manifestado"}
                              {resource.phase === "submitted" && "Recurso Enviado"}
                              {resource.phase === "judged" && "Julgado"}
                            </Badge>
                          </div>

                          {resource.content && (
                            <div className="bg-gray-50 p-3 rounded-lg mb-3">
                              <h5 className="font-medium text-sm mb-2">Conteúdo do Recurso:</h5>
                              <p className="text-sm whitespace-pre-wrap">{resource.content}</p>
                            </div>
                          )}

                          {resource.judgment && (
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <h5 className="font-medium text-sm mb-2">Julgamento:</h5>
                              <div className="space-y-1">
                                <p className="text-sm">
                                  <strong>Decisão:</strong>{" "}
                                  <Badge
                                    variant={
                                      resource.judgment.decision === "procedente"
                                        ? "default"
                                        : "destructive"
                                    }>
                                    {resource.judgment.decision.toUpperCase()}
                                  </Badge>
                                </p>
                                <p className="text-sm">
                                  <strong>Justificativa:</strong> {resource.judgment.justification}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Julgado em: {resource.judgment.date.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="counter_arguments" className="space-y-4">
                      {resources.map((resource) => (
                        <div key={`counter-${resource.id}`}>
                          {resource.counterArguments.length > 0 && (
                            <div className="border rounded-lg p-4">
                              <h4 className="font-medium mb-3">
                                Contrarrazões ao recurso de {resource.supplierName}
                              </h4>
                              {resource.counterArguments.map((counter) => (
                                <div key={counter.id} className="bg-gray-50 p-3 rounded-lg mb-2">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-sm">
                                      {counter.supplierName}
                                    </span>
                                    <span className="text-xs text-gray-600">
                                      {counter.submissionDate.toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="text-sm whitespace-pre-wrap">{counter.content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="judgments" className="space-y-4">
                      {resources
                        .filter((resource) => resource.judgment)
                        .map((resource) => (
                          <div key={`judgment-${resource.id}`} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium">Julgamento - {resource.supplierName}</h4>
                              <Badge
                                variant={
                                  resource.judgment?.decision === "procedente"
                                    ? "default"
                                    : "destructive"
                                }>
                                {resource.judgment?.decision.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm whitespace-pre-wrap">
                                {resource.judgment?.justification}
                              </p>
                              <p className="text-xs text-gray-600 mt-2">
                                Julgado em: {resource.judgment?.date.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Coluna Lateral - 1/3 */}
          <div className="space-y-6">
            {/* Chat de Mensagens */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Histórico de Eventos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {chatMessages.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nenhum evento registrado ainda
                    </p>
                  ) : (
                    chatMessages.map((msg, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="text-xs">
                            {msg.type === "system" ? "Sistema" : "Pregoeiro"}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {msg.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Informações Adicionais */}
            <Card>
              <CardHeader>
                <CardTitle>Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Esta é uma página dedicada exclusivamente para gerenciar a fase recursal do lote
                    selecionado.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Pregão:</span> {tenderData.number}
                  </div>
                  <div>
                    <span className="font-medium">Órgão:</span> {tenderData.agency}
                  </div>
                  <div>
                    <span className="font-medium">Lote:</span> {lotData.number} - {lotData.name}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={dialogType === "open_manifestation"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir Fase Recursal</DialogTitle>
            <DialogDescription>
              Defina o prazo para manifestação de intenção de recurso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="manifestationHours">Prazo para Manifestação (horas)</Label>
              <Select value={manifestationHours} onValueChange={setManifestationHours}>
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
            <Button onClick={confirmOpenManifestation}>Abrir Fase Recursal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogType === "submit_resource"} onOpenChange={closeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Apresentar Recurso</DialogTitle>
            <DialogDescription>Digite as razões do recurso que será apresentado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="resourceContent">Conteúdo do Recurso *</Label>
              <Textarea
                id="resourceContent"
                value={resourceContent}
                onChange={(e) => setResourceContent(e.target.value)}
                placeholder="Digite aqui as razões do recurso..."
                className="min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button onClick={confirmSubmitResource} disabled={!resourceContent.trim()}>
              Apresentar Recurso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogType === "submit_counter_argument"} onOpenChange={closeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Apresentar Contrarrazão</DialogTitle>
            <DialogDescription>Digite as contrarrazões ao recurso apresentado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="counterArgumentContent">Conteúdo da Contrarrazão *</Label>
              <Textarea
                id="counterArgumentContent"
                value={counterArgumentContent}
                onChange={(e) => setCounterArgumentContent(e.target.value)}
                placeholder="Digite aqui as contrarrazões..."
                className="min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button
              onClick={confirmSubmitCounterArgument}
              disabled={!counterArgumentContent.trim()}>
              Apresentar Contrarrazão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogType === "judge_resource"} onOpenChange={closeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Julgar Recurso</DialogTitle>
            <DialogDescription>
              Analise o recurso e emita sua decisão fundamentada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Decisão *</Label>
              <div className="flex gap-4 mt-2">
                <Button
                  variant={judgment === "procedente" ? "default" : "outline"}
                  onClick={() => setJudgment("procedente")}>
                  Procedente
                </Button>
                <Button
                  variant={judgment === "improcedente" ? "default" : "outline"}
                  onClick={() => setJudgment("improcedente")}>
                  Improcedente
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="judgmentJustification">Justificativa *</Label>
              <Textarea
                id="judgmentJustification"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Digite a fundamentação da decisão..."
                className="min-h-[150px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button onClick={confirmJudgeResource} disabled={!judgment || !justification.trim()}>
              Julgar Recurso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogType === "adjudicate"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjudicar Lote</DialogTitle>
            <DialogDescription>
              Confirme a adjudicação do lote ao vencedor declarado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                O lote será adjudicado para <strong>{lotData.winner.name}</strong> pelo valor de{" "}
                <strong>
                  R$ {lotData.winner.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </strong>
                .
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button onClick={confirmAdjudicate}>Adjudicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogType === "homologate"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Homologar Licitação</DialogTitle>
            <DialogDescription>
              Confirme a homologação da licitação pela autoridade superior.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                A licitação será homologada e o processo será finalizado oficialmente.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button onClick={confirmHomologate}>Homologar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogType === "revoke"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revogar Licitação</DialogTitle>
            <DialogDescription>
              Informe a justificativa para revogação da licitação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="revokeJustification">Justificativa *</Label>
              <Textarea
                id="revokeJustification"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Digite a justificativa para revogação..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmRevoke} disabled={!justification.trim()}>
              Revogar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
