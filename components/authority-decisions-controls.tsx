"use client";

import { useState } from "react";
import { useTenderWorkflow } from "@/lib/contexts/tender-workflow-context";
import ResourcePhaseValidations from "@/lib/helpers/resource-phase-validations";
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
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gavel,
  RotateCcw,
  Info,
  XCircle,
  FileText,
  FolderCheck,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export interface AuthorityDecisionsControlsProps {
  lotId: string;
  isAuctioneer?: boolean; // Pregoeiro tem algumas permissões
  isAuthority: boolean; // Autoridade Superior tem todas as permissões
}

export default function AuthorityDecisionsControls({
  lotId,
  isAuctioneer = false,
  isAuthority = false,
}: AuthorityDecisionsControlsProps) {
  const {
    lots,
    lotStatuses,
    resourcePhase,
    suppliers,
    resources,
    addSystemMessage,
    adjudicate,
    homologate,
    revoke,
    cancel,
    tenderStatus,
    setTenderStatus,
  } = useTenderWorkflow();

  // Estados locais
  const [dialogType, setDialogType] = useState<
    null | "adjudicate" | "homologate" | "revoke" | "cancel" | "return_diligence"
  >(null);
  const [justification, setJustification] = useState("");

  const { toast } = useToast();

  // Encontrar o lote atual
  const currentLot = lots.find((lot) => lot.id === lotId);

  // Encontrar o fornecedor vencedor
  const winnerSupplier = suppliers.find((s) => s.lotId === lotId && s.status === "winner");

  // Status atual do lote
  const lotStatus = lotStatuses[lotId];

  // Função para abrir diálogo
  const openDialog = (
    type: "adjudicate" | "homologate" | "revoke" | "cancel" | "return_diligence"
  ) => {
    setDialogType(type);
    setJustification("");
  };

  // Função para fechar diálogo
  const closeDialog = () => {
    setDialogType(null);
    setJustification("");
  };

  // Função para adjudicar o lote
  const handleAdjudicate = () => {
    if (!winnerSupplier) {
      toast({
        title: "Erro",
        description: "Nenhum fornecedor vencedor encontrado para este lote.",
      });
      closeDialog();
      return;
    }

    adjudicate(lotId, winnerSupplier.id);

    toast({
      title: "Lote Adjudicado",
      description: `O lote ${currentLot?.number} foi adjudicado com sucesso.`,
    });

    closeDialog();
  };

  // Função para homologar o lote
  const handleHomologate = () => {
    if (!justification.trim()) return;

    homologate(lotId);

    addSystemMessage(
      `A autoridade competente homologou o resultado do item ${currentLot?.number} com a seguinte justificativa: "${justification}"`
    );

    toast({
      title: "Lote Homologado",
      description: `O lote ${currentLot?.number} foi homologado com sucesso.`,
    });

    closeDialog();
  };

  // Função para revogar o lote
  const handleRevoke = () => {
    if (!justification.trim()) return;

    revoke(lotId, justification);

    toast({
      title: "Lote Revogado",
      description: `O lote ${currentLot?.number} foi revogado.`,
    });

    closeDialog();
  };

  // Função para anular o lote
  const handleCancel = () => {
    if (!justification.trim()) return;

    cancel(lotId, justification);

    toast({
      title: "Lote Anulado",
      description: `O lote ${currentLot?.number} foi anulado.`,
    });

    closeDialog();
  };

  // Função para retornar para diligência
  const handleReturnForDiligence = () => {
    if (!justification.trim()) return;

    // Usar o método do contexto para retornar para análise
    // Isso é uma simulação já que não temos essa ação no contexto
    addSystemMessage(
      `A autoridade competente retornou o item ${currentLot?.number} para diligência com a seguinte justificativa: "${justification}"`
    );

    // Atualizamos o status de volta para análise
    setTenderStatus("document_analysis");

    toast({
      title: "Retornado para Diligência",
      description: `O lote ${currentLot?.number} foi retornado para diligência.`,
    });

    closeDialog();
  };

  // Função para formatar data/hora
  const formatDateTime = (date: Date) => {
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  // Verificação se existem recursos
  // Filtrando recursos relacionados a este lote
  const resourcesForLot = resources;
  const hasOpenResources = resourcePhase === "judgment" ? false : true;
  const hasSuccessfulResources = false;
  const allResourcesJudged = resourcePhase === "judgment";

  // Verifica se as ações estão disponíveis
  const canAdjudicate = isAuctioneer && resourcePhase === "judgment" && !hasOpenResources;

  const canHomologate = isAuthority && resourcePhase === "adjudicated";

  const canRevoke = isAuthority && lotStatus !== "revoked" && lotStatus !== "canceled";

  const canCancel = isAuthority && lotStatus !== "revoked" && lotStatus !== "canceled";

  const canReturnForDiligence =
    isAuthority && lotStatus !== "waiting" && lotStatus !== "revoked" && lotStatus !== "canceled";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Decisões do Certame</CardTitle>
            <CardDescription>Ações da Autoridade Superior e adjudicação do objeto</CardDescription>
          </div>
          <Badge
            variant="outline"
            className={
              lotStatus === "adjudicated" || lotStatus === "homologated"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }>
            <Gavel className="h-4 w-4 mr-1" />
            Decisões
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Fluxo:</strong> Julgamento de Recursos → Adjudicação → Homologação →
            Encerramento
          </AlertDescription>
        </Alert>

        {/* Status atual da licitação */}
        <div className="p-4 rounded-lg bg-gray-50 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-medium">Status Atual do Lote {currentLot?.number}</h3>
            <p className="text-sm text-gray-600">
              {lotStatus === "waiting" && "Aguardando abertura"}
              {lotStatus === "open" && "Em disputa"}
              {lotStatus === "paused" && "Disputa pausada"}
              {lotStatus === "finished" && "Disputa encerrada"}
              {lotStatus === "negotiation" && "Em negociação"}
              {lotStatus === "winner_declared" && "Vencedor declarado"}
              {lotStatus === "resource_phase" && "Em fase recursal"}
              {lotStatus === "adjudicated" && "Adjudicado"}
              {lotStatus === "homologated" && "Homologado"}
              {lotStatus === "revoked" && "Revogado"}
              {lotStatus === "canceled" && "Anulado"}
            </p>
          </div>
          <div>
            {lotStatus === "adjudicated" && (
              <Badge className="bg-emerald-600">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Adjudicado
              </Badge>
            )}
            {lotStatus === "homologated" && (
              <Badge className="bg-green-700">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Homologado
              </Badge>
            )}
            {lotStatus === "revoked" && (
              <Badge className="bg-red-600">
                <XCircle className="h-4 w-4 mr-1" />
                Revogado
              </Badge>
            )}
            {lotStatus === "canceled" && (
              <Badge className="bg-red-700">
                <XCircle className="h-4 w-4 mr-1" />
                Anulado
              </Badge>
            )}
          </div>
        </div>

        {/* Fornecedor vencedor */}
        {winnerSupplier && (
          <div className="p-4 rounded-lg border bg-white">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Fornecedor Vencedor
                </h3>
                <p className="text-sm font-medium">{winnerSupplier.name}</p>
                <p className="text-sm text-gray-600">{winnerSupplier.company}</p>
              </div>
              <div className="text-right">
                <div className="font-mono text-lg font-medium">
                  R$ {winnerSupplier.value.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">Melhor proposta</div>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Ações disponíveis */}
        <div className="space-y-2">
          <h3 className="font-medium">Ações disponíveis:</h3>

          <div className="grid grid-cols-1 gap-3">
            {/* Adjudicação */}
            <div
              className={`p-3 rounded-lg border ${
                canAdjudicate ? "bg-white" : "bg-gray-50 text-gray-400"
              }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Gavel className="h-5 w-5 text-emerald-600" />
                  <div>
                    <div className="font-medium">Adjudicar</div>
                    <div className="text-xs text-gray-600">
                      O pregoeiro pode adjudicar o lote após recursos ou com declaração de vencedor
                    </div>
                  </div>
                </div>
                <Button
                  disabled={!canAdjudicate}
                  onClick={() => openDialog("adjudicate")}
                  className="bg-emerald-600 hover:bg-emerald-700">
                  Adjudicar
                </Button>
              </div>
            </div>

            {/* Homologação */}
            <div
              className={`p-3 rounded-lg border ${
                canHomologate ? "bg-white" : "bg-gray-50 text-gray-400"
              }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FolderCheck className="h-5 w-5 text-green-700" />
                  <div>
                    <div className="font-medium">Homologar</div>
                    <div className="text-xs text-gray-600">
                      A autoridade superior pode homologar após a adjudicação
                    </div>
                  </div>
                </div>
                <Button
                  disabled={!canHomologate}
                  onClick={() => openDialog("homologate")}
                  className="bg-green-700 hover:bg-green-800">
                  Homologar
                </Button>
              </div>
            </div>

            {/* Retornar para Diligência */}
            <div
              className={`p-3 rounded-lg border ${
                canReturnForDiligence ? "bg-white" : "bg-gray-50 text-gray-400"
              }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RotateCcw className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Retornar para Diligência</div>
                    <div className="text-xs text-gray-600">
                      Devolver processo para o pregoeiro realizar verificações adicionais
                    </div>
                  </div>
                </div>
                <Button
                  disabled={!canReturnForDiligence}
                  variant="outline"
                  onClick={() => openDialog("return_diligence")}>
                  Retornar
                </Button>
              </div>
            </div>

            {/* Revogar */}
            <div
              className={`p-3 rounded-lg border ${
                canRevoke ? "bg-white" : "bg-gray-50 text-gray-400"
              }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="font-medium">Revogar</div>
                    <div className="text-xs text-gray-600">
                      Revogar a licitação por razões de interesse público (exige justificativa)
                    </div>
                  </div>
                </div>
                <Button
                  disabled={!canRevoke}
                  variant="outline"
                  onClick={() => openDialog("revoke")}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50">
                  Revogar
                </Button>
              </div>
            </div>

            {/* Anular */}
            <div
              className={`p-3 rounded-lg border ${
                canCancel ? "bg-white" : "bg-gray-50 text-gray-400"
              }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="font-medium">Anular</div>
                    <div className="text-xs text-gray-600">
                      Anular a licitação por ilegalidade (exige justificativa)
                    </div>
                  </div>
                </div>
                <Button
                  disabled={!canCancel}
                  variant="outline"
                  onClick={() => openDialog("cancel")}
                  className="text-red-600 border-red-200 hover:bg-red-50">
                  Anular
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Histórico de decisões - Implementação futura */}
      <CardFooter className="border-t pt-4">
        <Button variant="outline" className="w-full" disabled>
          <Clock className="h-4 w-4 mr-2" /> Ver Histórico de Decisões
        </Button>
      </CardFooter>

      {/* Diálogos */}

      {/* Diálogo para adjudicação */}
      <Dialog open={dialogType === "adjudicate"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjudicar Lote</DialogTitle>
            <DialogDescription>
              Confirme a adjudicação do lote {currentLot?.number} ao fornecedor vencedor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                A adjudicação atribui ao vencedor o objeto da licitação. Após a adjudicação, o
                processo seguirá para homologação pela autoridade superior.
              </AlertDescription>
            </Alert>

            {winnerSupplier && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium">Fornecedor Vencedor:</h4>
                <p>
                  {winnerSupplier.name} - {winnerSupplier.company}
                </p>
                <p className="mt-1 font-mono font-medium">R$ {winnerSupplier.value.toFixed(2)}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button onClick={handleAdjudicate} className="bg-emerald-600 hover:bg-emerald-700">
              Confirmar Adjudicação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para homologação */}
      <Dialog open={dialogType === "homologate"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Homologar Licitação</DialogTitle>
            <DialogDescription>
              Confirme a homologação do lote {currentLot?.number}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                A homologação representa a ratificação de todos os atos praticados no procedimento
                licitatório. Após homologação o processo será encerrado e pronto para emissão do
                contrato.
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="justification">Justificativa *</Label>
              <Textarea
                id="justification"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Informe a justificativa para homologação..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handleHomologate}
              disabled={!justification.trim()}
              className="bg-green-700 hover:bg-green-800">
              Homologar Licitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para revogação */}
      <Dialog open={dialogType === "revoke"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revogar Licitação</DialogTitle>
            <DialogDescription>
              Revogação do lote {currentLot?.number} por razões de interesse público.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                A revogação ocorre por razões de interesse público decorrente de fato superveniente.
                Essa ação é irreversível.
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="revoke_justification">Justificativa *</Label>
              <Textarea
                id="revoke_justification"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Informe a justificativa detalhada para revogação..."
                className="min-h-[150px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRevoke} disabled={!justification.trim()}>
              Revogar Licitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para anulação */}
      <Dialog open={dialogType === "cancel"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anular Licitação</DialogTitle>
            <DialogDescription>
              Anulação do lote {currentLot?.number} por ilegalidade.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                A anulação ocorre quando há ilegalidade no processo licitatório. Essa ação é
                irreversível e deve estar fundamentada em aspectos legais.
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="cancel_justification">Justificativa Legal *</Label>
              <Textarea
                id="cancel_justification"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Informe o fundamento legal e a justificativa detalhada para anulação..."
                className="min-h-[150px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={!justification.trim()}>
              Anular Licitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para retorno para diligência */}
      <Dialog open={dialogType === "return_diligence"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retornar para Diligência</DialogTitle>
            <DialogDescription>
              Devolver lote {currentLot?.number} para análise adicional pelo pregoeiro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                O retorno para diligência permite que o pregoeiro realize análises adicionais ou
                solicite esclarecimentos antes de prosseguir com o processo.
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="diligence_justification">Motivo do retorno *</Label>
              <Textarea
                id="diligence_justification"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Descreva o motivo do retorno para diligência e quais informações ou documentos precisam ser verificados..."
                className="min-h-[150px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={handleReturnForDiligence}
              disabled={!justification.trim()}>
              Confirmar Retorno para Diligência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
