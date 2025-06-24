"use client";

import React, { useState } from "react";
import { useTenderWorkflow, ResourceData } from "@/lib/contexts/tender-workflow-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Info,
  MessageSquare,
  Scale,
  XCircle,
} from "lucide-react";
import { format, formatDistanceToNow, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export interface ResourceManagementProps {
  lotId: string;
  isAuctioneer: boolean;
  isSupplier: boolean;
  supplierId?: string;
}

export default function ResourceManagement({
  lotId,
  isAuctioneer,
  isSupplier,
  supplierId,
}: ResourceManagementProps) {
  const {
    resources,
    resourcePhase,
    manifestationDeadline,
    resourceDeadline,
    counterArgumentDeadline,
    updateResource,
    addResourceManifestation,
    submitResource,
    submitCounterArgument,
    judgeResource,
  } = useTenderWorkflow();

  // Estados locais
  const [selectedResource, setSelectedResource] = useState<ResourceData | null>(null);
  const [dialogType, setDialogType] = useState<
    | null
    | "manifestation"
    | "submit_resource"
    | "submit_counter"
    | "judge_resource"
    | "view_resource"
    | "view_counter"
  >(null);
  const [content, setContent] = useState("");
  const [decision, setDecision] = useState<"procedente" | "improcedente">("improcedente");

  const { toast } = useToast();

  // Filtra recursos para o lote atual
  const lotResources = resources.filter((r) => {
    // Por enquanto vamos mostrar todos, depois podemos implementar a lógica baseada no lotId
    return true;
  });

  // Funções para verificar prazos
  const isManifestationDeadlinePassed = manifestationDeadline
    ? isAfter(new Date(), manifestationDeadline)
    : false;

  const isResourceDeadlinePassed = resourceDeadline ? isAfter(new Date(), resourceDeadline) : false;

  const isCounterArgumentDeadlinePassed = counterArgumentDeadline
    ? isAfter(new Date(), counterArgumentDeadline)
    : false;

  // Função para abrir diálogo
  const openDialog = (
    type:
      | "manifestation"
      | "submit_resource"
      | "submit_counter"
      | "judge_resource"
      | "view_resource"
      | "view_counter",
    resource: ResourceData | null = null
  ) => {
    setDialogType(type);
    setSelectedResource(resource);
    setContent("");
  };

  // Função para fechar diálogo
  const closeDialog = () => {
    setDialogType(null);
    setSelectedResource(null);
    setContent("");
    setDecision("improcedente");
  };

  // Função para manifestar intenção de recurso
  const handleManifestIntention = () => {
    if (supplierId) {
      addResourceManifestation(lotId, supplierId);
      toast({
        title: "Intenção de Recurso Registrada",
        description: "Sua intenção de recurso foi registrada com sucesso.",
      });
      closeDialog();
    }
  };

  // Função para submeter recurso
  const handleSubmitResource = () => {
    if (!content.trim() || !supplierId) return;

    submitResource(lotId, supplierId, content);

    if (selectedResource) {
      updateResource(selectedResource.id, {
        phase: "submitted",
        content,
        submissionDate: new Date(),
      });
    }

    toast({
      title: "Recurso Enviado",
      description: "Seu recurso foi enviado com sucesso.",
    });
    closeDialog();
  };

  // Função para submeter contrarrazão
  const handleSubmitCounterArgument = () => {
    if (!content.trim() || !supplierId || !selectedResource) return;

    submitCounterArgument(selectedResource.id, supplierId, content);

    // Adicionar contrarrazão ao recurso existente
    const updatedCounterArgs = [
      ...(selectedResource.counterArguments || []),
      {
        id: `counter-${Date.now()}`,
        supplierId,
        supplierName: "Seu Nome", // Idealmente vem do contexto do usuário
        content,
        submissionDate: new Date(),
      },
    ];

    updateResource(selectedResource.id, {
      counterArguments: updatedCounterArgs,
    });

    toast({
      title: "Contrarrazão Enviada",
      description: "Sua contrarrazão foi enviada com sucesso.",
    });
    closeDialog();
  };

  // Função para julgar recurso
  const handleJudgeResource = () => {
    if (!selectedResource || !content.trim()) return;

    judgeResource(selectedResource.id, decision, content);

    updateResource(selectedResource.id, {
      phase: "judged",
      judgment: {
        decision,
        justification: content,
        date: new Date(),
      },
    });

    toast({
      title: "Recurso Julgado",
      description: `O recurso foi julgado como ${
        decision === "procedente" ? "procedente" : "improcedente"
      }.`,
    });
    closeDialog();
  };

  // Função para formatar data/hora
  const formatDateTime = (date: Date) => {
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  // Função para mostrar prazo restante
  const getRemainingTime = (deadline: Date | null) => {
    if (!deadline) return "";

    if (isAfter(new Date(), deadline)) {
      return "Prazo encerrado";
    }

    return formatDistanceToNow(deadline, {
      addSuffix: true,
      locale: ptBR,
    });
  };

  // Estado atual da fase recursal
  const getResourcePhaseInfo = () => {
    const phaseInfo = {
      title: "",
      description: "",
      icon: Clock,
      color: "",
    };

    switch (resourcePhase) {
      case "not_started":
        phaseInfo.title = "Fase Recursal não iniciada";
        phaseInfo.description = "A fase recursal ainda não foi iniciada pelo pregoeiro.";
        phaseInfo.icon = Clock;
        phaseInfo.color = "bg-gray-500";
        break;
      case "manifestation_open":
        phaseInfo.title = "Manifestação de Interesse";
        phaseInfo.description =
          "Prazo para fornecedores manifestarem interesse em interpor recurso.";
        phaseInfo.icon = MessageSquare;
        phaseInfo.color = "bg-blue-500";
        break;
      case "waiting_resource":
        phaseInfo.title = "Aguardando Envio de Recursos";
        phaseInfo.description =
          "Prazo para envio das razões do recurso pelos fornecedores que manifestaram interesse.";
        phaseInfo.icon = FileText;
        phaseInfo.color = "bg-amber-500";
        break;
      case "resource_submitted":
        phaseInfo.title = "Recursos Enviados";
        phaseInfo.description = "Recursos foram enviados e aguarda-se o período de contrarrazões.";
        phaseInfo.icon = FileText;
        phaseInfo.color = "bg-orange-500";
        break;
      case "counter_argument":
        phaseInfo.title = "Fase de Contrarrazões";
        phaseInfo.description = "Prazo para fornecedores apresentarem contrarrazões aos recursos.";
        phaseInfo.icon = MessageSquare;
        phaseInfo.color = "bg-purple-500";
        break;
      case "judgment":
        phaseInfo.title = "Em Julgamento";
        phaseInfo.description = "Recursos estão sendo julgados pelo pregoeiro.";
        phaseInfo.icon = Scale;
        phaseInfo.color = "bg-indigo-600";
        break;
      case "adjudicated":
        phaseInfo.title = "Licitação Adjudicada";
        phaseInfo.description = "O pregoeiro adjudicou a licitação ao vencedor.";
        phaseInfo.icon = CheckCircle2;
        phaseInfo.color = "bg-emerald-600";
        break;
      case "homologated":
        phaseInfo.title = "Licitação Homologada";
        phaseInfo.description = "A autoridade superior homologou o resultado da licitação.";
        phaseInfo.icon = CheckCircle2;
        phaseInfo.color = "bg-green-700";
        break;
      case "revoked":
        phaseInfo.title = "Licitação Revogada";
        phaseInfo.description = "A licitação foi revogada pela autoridade superior.";
        phaseInfo.icon = XCircle;
        phaseInfo.color = "bg-red-600";
        break;
      default:
        phaseInfo.title = "Status Desconhecido";
        phaseInfo.description = "O status atual da fase recursal é desconhecido.";
        phaseInfo.icon = AlertCircle;
        phaseInfo.color = "bg-gray-500";
        break;
    }

    return phaseInfo;
  };

  const phaseInfo = getResourcePhaseInfo();
  const PhaseIcon = phaseInfo.icon;

  return (
    <div className="space-y-6">
      {/* Header da fase recursal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Fase Recursal</CardTitle>
              <CardDescription>
                Manifestação de intenção, recursos, contrarrazões e julgamento
              </CardDescription>
            </div>
            <Badge className={`${phaseInfo.color} text-white px-3 py-1`}>
              <PhaseIcon className="h-4 w-4 mr-2" />
              {phaseInfo.title}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="bg-blue-50">
            <Info className="h-4 w-4" />
            <AlertDescription>{phaseInfo.description}</AlertDescription>
          </Alert>

          {/* Prazos */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {manifestationDeadline && (
              <div
                className={`p-3 rounded-lg border ${
                  isManifestationDeadlinePassed
                    ? "bg-gray-50 text-gray-500"
                    : "bg-blue-50 border-blue-100"
                }`}>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Manifestação de Interesse</span>
                </div>
                <div className="text-sm">
                  <span>Até: {formatDateTime(manifestationDeadline)}</span>
                  <p className="mt-1 font-medium">{getRemainingTime(manifestationDeadline)}</p>
                </div>
              </div>
            )}

            {resourceDeadline && (
              <div
                className={`p-3 rounded-lg border ${
                  isResourceDeadlinePassed
                    ? "bg-gray-50 text-gray-500"
                    : "bg-amber-50 border-amber-100"
                }`}>
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Envio de Recursos</span>
                </div>
                <div className="text-sm">
                  <span>Até: {formatDateTime(resourceDeadline)}</span>
                  <p className="mt-1 font-medium">{getRemainingTime(resourceDeadline)}</p>
                </div>
              </div>
            )}

            {counterArgumentDeadline && (
              <div
                className={`p-3 rounded-lg border ${
                  isCounterArgumentDeadlinePassed
                    ? "bg-gray-50 text-gray-500"
                    : "bg-purple-50 border-purple-100"
                }`}>
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="h-4 w-4" />
                  <span className="font-medium">Envio de Contrarrazões</span>
                </div>
                <div className="text-sm">
                  <span>Até: {formatDateTime(counterArgumentDeadline)}</span>
                  <p className="mt-1 font-medium">{getRemainingTime(counterArgumentDeadline)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        {/* Botões de ação relevantes para cada perfil */}
        <CardFooter className="flex justify-between border-t pt-4">
          {isSupplier &&
            resourcePhase === "manifestation_open" &&
            !isManifestationDeadlinePassed && (
              <Button
                onClick={() => openDialog("manifestation")}
                className="bg-blue-600 hover:bg-blue-700">
                Manifestar Intenção de Recurso
              </Button>
            )}

          {isSupplier &&
            resourcePhase === "waiting_resource" &&
            !isResourceDeadlinePassed &&
            lotResources.some((r) => r.supplierId === supplierId && r.phase === "manifested") && (
              <Button
                onClick={() => {
                  const resource = lotResources.find((r) => r.supplierId === supplierId);
                  openDialog("submit_resource", resource || null);
                }}
                className="bg-amber-600 hover:bg-amber-700">
                Enviar Razões do Recurso
              </Button>
            )}

          {isAuctioneer && resourcePhase === "resource_submitted" && (
            <Button
              variant="outline"
              onClick={() => {
                // Lógica para definir prazo de contrarrazões
              }}>
              Definir Prazo para Contrarrazões
            </Button>
          )}

          {isAuctioneer &&
            (resourcePhase === "counter_argument" || isCounterArgumentDeadlinePassed) && (
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => {
                  // Mover para fase de julgamento
                }}>
                Iniciar Julgamento dos Recursos
              </Button>
            )}
        </CardFooter>
      </Card>

      {/* Lista de recursos */}
      {lotResources.length > 0 ? (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="judged">Julgados</TabsTrigger>
            <TabsTrigger value="counter">Contrarrazões</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4 space-y-4">
            {lotResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                isAuctioneer={isAuctioneer}
                isSupplier={isSupplier}
                supplierId={supplierId}
                onViewResource={() => openDialog("view_resource", resource)}
                onSubmitCounter={() => openDialog("submit_counter", resource)}
                onJudge={() => openDialog("judge_resource", resource)}
              />
            ))}
          </TabsContent>

          <TabsContent value="pending" className="mt-4 space-y-4">
            {lotResources
              .filter((r) => r.phase !== "judged")
              .map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  isAuctioneer={isAuctioneer}
                  isSupplier={isSupplier}
                  supplierId={supplierId}
                  onViewResource={() => openDialog("view_resource", resource)}
                  onSubmitCounter={() => openDialog("submit_counter", resource)}
                  onJudge={() => openDialog("judge_resource", resource)}
                />
              ))}
          </TabsContent>

          <TabsContent value="judged" className="mt-4 space-y-4">
            {lotResources
              .filter((r) => r.phase === "judged")
              .map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  isAuctioneer={isAuctioneer}
                  isSupplier={isSupplier}
                  supplierId={supplierId}
                  onViewResource={() => openDialog("view_resource", resource)}
                  onSubmitCounter={() => openDialog("submit_counter", resource)}
                  onJudge={() => openDialog("judge_resource", resource)}
                />
              ))}
          </TabsContent>

          <TabsContent value="counter" className="mt-4 space-y-4">
            {lotResources
              .filter((r) => r.counterArguments && r.counterArguments.length > 0)
              .map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  isAuctioneer={isAuctioneer}
                  isSupplier={isSupplier}
                  supplierId={supplierId}
                  onViewResource={() => openDialog("view_resource", resource)}
                  onSubmitCounter={() => openDialog("submit_counter", resource)}
                  onJudge={() => openDialog("judge_resource", resource)}
                />
              ))}
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            <FileText className="mx-auto h-10 w-10 mb-3" />
            <p>Nenhum recurso foi manifestado ou submetido até o momento.</p>
          </CardContent>
        </Card>
      )}

      {/* Diálogos */}
      {/* Diálogo para manifestação de intenção */}
      <Dialog open={dialogType === "manifestation"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manifestação de Intenção de Recurso</DialogTitle>
            <DialogDescription>
              Confirme sua intenção de interpor recurso. Você terá um prazo para apresentar as
              razões.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Após manifestar intenção, você terá até{" "}
                {resourceDeadline && formatDateTime(resourceDeadline)} para enviar as razões do
                recurso.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button onClick={handleManifestIntention}>Manifestar Intenção</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para submissão de recurso */}
      <Dialog open={dialogType === "submit_resource"} onOpenChange={closeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enviar Razões do Recurso</DialogTitle>
            <DialogDescription>
              Apresente as razões do seu recurso de forma clara e objetiva.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="resource">Razões do Recurso *</Label>
              <Textarea
                id="resource"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Descreva as razões do seu recurso..."
                className="min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitResource} disabled={!content.trim()}>
              Enviar Recurso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para visualização do recurso */}
      <Dialog open={dialogType === "view_resource"} onOpenChange={closeDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Recurso de {selectedResource?.supplierName}</DialogTitle>
            <DialogDescription>
              Enviado em{" "}
              {selectedResource?.submissionDate && formatDateTime(selectedResource.submissionDate)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="whitespace-pre-line">{selectedResource?.content}</p>
            </div>

            {selectedResource?.counterArguments && selectedResource.counterArguments.length > 0 && (
              <div className="space-y-3">
                <Separator />
                <h3 className="font-medium">Contrarrazões:</h3>

                {selectedResource.counterArguments.map((counter) => (
                  <div key={counter.id} className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{counter.supplierName}</h4>
                        <p className="text-xs text-gray-600">
                          Enviado em {formatDateTime(counter.submissionDate)}
                        </p>
                      </div>
                    </div>
                    <p className="whitespace-pre-line">{counter.content}</p>
                  </div>
                ))}
              </div>
            )}

            {selectedResource?.judgment && (
              <div className="space-y-3">
                <Separator />
                <h3 className="font-medium">Decisão:</h3>

                <div
                  className={`p-4 rounded-lg ${
                    selectedResource.judgment.decision === "procedente"
                      ? "bg-green-50"
                      : "bg-red-50"
                  }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium flex items-center">
                        {selectedResource.judgment.decision === "procedente" ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" /> Recurso
                            Procedente
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-1 text-red-600" /> Recurso Improcedente
                          </>
                        )}
                      </h4>
                      <p className="text-xs text-gray-600">
                        Julgado em {formatDateTime(selectedResource.judgment.date)}
                      </p>
                    </div>
                  </div>
                  <p className="whitespace-pre-line">{selectedResource.judgment.justification}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={closeDialog}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para submissão de contrarrazão */}
      <Dialog open={dialogType === "submit_counter"} onOpenChange={closeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enviar Contrarrazão</DialogTitle>
            <DialogDescription>
              Apresente suas contrarrazões ao recurso de {selectedResource?.supplierName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Exibir resumo do recurso */}
            <div>
              <Label htmlFor="resource">Recurso Original:</Label>
              <div className="p-4 bg-gray-50 rounded-lg mt-2 max-h-[150px] overflow-y-auto">
                <p className="whitespace-pre-line">{selectedResource?.content}</p>
              </div>
            </div>

            <div>
              <Label htmlFor="counter">Sua Contrarrazão *</Label>
              <Textarea
                id="counter"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Apresente sua contrarrazão ao recurso..."
                className="min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitCounterArgument} disabled={!content.trim()}>
              Enviar Contrarrazão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para julgamento de recurso */}
      <Dialog open={dialogType === "judge_resource"} onOpenChange={closeDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Julgar Recurso</DialogTitle>
            <DialogDescription>
              Avalie o recurso apresentado por {selectedResource?.supplierName} e as contrarrazões.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Exibir resumo do recurso */}
            <div>
              <Label htmlFor="original_resource">Recurso:</Label>
              <div className="p-4 bg-gray-50 rounded-lg mt-2 max-h-[150px] overflow-y-auto">
                <p className="whitespace-pre-line">{selectedResource?.content}</p>
              </div>
            </div>

            {/* Exibir contrarrazões se houver */}
            {selectedResource?.counterArguments && selectedResource.counterArguments.length > 0 && (
              <div>
                <Label htmlFor="counter_args">Contrarrazões:</Label>
                <div className="space-y-3 mt-2">
                  {selectedResource.counterArguments.map((counter) => (
                    <div key={counter.id} className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{counter.supplierName}</h4>
                          <p className="text-xs text-gray-600">
                            Enviado em {formatDateTime(counter.submissionDate)}
                          </p>
                        </div>
                      </div>
                      <p className="whitespace-pre-line">{counter.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2">
              <Label htmlFor="decision">Decisão *</Label>
              <div className="flex gap-3 mt-2">
                <Button
                  type="button"
                  variant={decision === "procedente" ? "default" : "outline"}
                  className={decision === "procedente" ? "bg-green-600" : ""}
                  onClick={() => setDecision("procedente")}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Procedente
                </Button>
                <Button
                  type="button"
                  variant={decision === "improcedente" ? "default" : "outline"}
                  className={decision === "improcedente" ? "bg-red-600" : ""}
                  onClick={() => setDecision("improcedente")}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Improcedente
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="justification">Justificativa *</Label>
              <Textarea
                id="justification"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Apresente a fundamentação para sua decisão..."
                className="min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handleJudgeResource}
              disabled={!content.trim()}
              className={
                decision === "procedente"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }>
              {decision === "procedente" ? "Dar Provimento" : "Negar Provimento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ResourceCardProps {
  resource: ResourceData;
  isAuctioneer: boolean;
  isSupplier: boolean;
  supplierId?: string;
  onViewResource: () => void;
  onSubmitCounter: () => void;
  onJudge: () => void;
}

// Componente para exibir um recurso na lista
function ResourceCard({
  resource,
  isAuctioneer,
  isSupplier,
  supplierId,
  onViewResource,
  onSubmitCounter,
  onJudge,
}: ResourceCardProps) {
  // Função para formatar data/hora
  const formatDateTime = (date: Date) => {
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  // Verifica se o fornecedor atual já enviou contrarrazão
  const hasSubmittedCounter = resource.counterArguments?.some((c) => c.supplierId === supplierId);

  // Obtém o status do recurso para exibição
  const getResourceStatus = () => {
    if (resource.phase === "judged") {
      return {
        label: resource.judgment?.decision === "procedente" ? "Procedente" : "Improcedente",
        color: resource.judgment?.decision === "procedente" ? "bg-green-600" : "bg-red-600",
        icon: resource.judgment?.decision === "procedente" ? CheckCircle2 : XCircle,
      };
    }

    if (resource.phase === "submitted") {
      return {
        label: "Recurso Enviado",
        color: "bg-amber-600",
        icon: FileText,
      };
    }

    if (resource.phase === "manifested") {
      return {
        label: "Intenção Manifestada",
        color: "bg-blue-600",
        icon: MessageSquare,
      };
    }

    return {
      label: "Pendente",
      color: "bg-gray-500",
      icon: Clock,
    };
  };

  const status = getResourceStatus();
  const StatusIcon = status.icon;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{resource.supplierName}</CardTitle>
            <CardDescription>{resource.supplierCompany}</CardDescription>
          </div>
          <Badge className={`${status.color} text-white`}>
            <StatusIcon className="h-4 w-4 mr-1" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          {resource.manifestationDate && (
            <div className="text-sm flex items-center gap-1 text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Manifestação: {formatDateTime(resource.manifestationDate)}</span>
            </div>
          )}

          {resource.submissionDate && (
            <div className="text-sm flex items-center gap-1 text-gray-500">
              <FileText className="h-4 w-4" />
              <span>Recurso enviado: {formatDateTime(resource.submissionDate)}</span>
            </div>
          )}

          {resource.counterArguments && resource.counterArguments.length > 0 && (
            <div className="text-sm flex items-center gap-1 text-gray-500">
              <MessageSquare className="h-4 w-4" />
              <span>{resource.counterArguments.length} contrarrazão(ões)</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex gap-2 justify-end border-t">
        <Button variant="outline" size="sm" onClick={onViewResource}>
          Ver Detalhes
        </Button>

        {isSupplier &&
          resource.phase === "submitted" &&
          !hasSubmittedCounter &&
          supplierId !== resource.supplierId && (
            <Button size="sm" onClick={onSubmitCounter}>
              Apresentar Contrarrazão
            </Button>
          )}

        {isAuctioneer && resource.phase === "submitted" && resource.content && (
          <Button size="sm" onClick={onJudge} className="bg-indigo-600 hover:bg-indigo-700">
            Julgar Recurso
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
