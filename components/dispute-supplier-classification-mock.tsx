"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface SupplierClassificationProps {
  tenderId: string;
  isAuctioneer: boolean;
  userId: string;
  disputeStatus: string;
}

interface MockSupplier {
  id: string;
  user_id: string;
  status: "qualified" | "disqualified" | "pending";
  justification?: string;
  company_name: string;
  email: string;
  created_at: string;
}

// Dados mocados de fornecedores
const mockSuppliers: MockSupplier[] = [
  {
    id: "1",
    user_id: "user-1",
    status: "pending",
    company_name: "Tech Solutions LTDA",
    email: "contato@techsolutions.com",
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    user_id: "user-2",
    status: "qualified",
    justification: "Empresa atende todos os requisitos técnicos e documentais.",
    company_name: "Inovação Digital ME",
    email: "vendas@inovacaodigital.com",
    created_at: "2024-01-15T10:30:00Z",
  },
  {
    id: "3",
    user_id: "user-3",
    status: "disqualified",
    justification: "Documentação incompleta - faltou certidão negativa de débitos.",
    company_name: "Sistemas Avançados S.A.",
    email: "comercial@sistemasavancados.com",
    created_at: "2024-01-15T11:00:00Z",
  },
  {
    id: "4",
    user_id: "user-4",
    status: "pending",
    company_name: "Consultoria Empresarial EIRELI",
    email: "info@consultoriaempresarial.com",
    created_at: "2024-01-15T11:30:00Z",
  },
  {
    id: "5",
    user_id: "user-5",
    status: "qualified",
    justification: "Empresa qualificada com excelente histórico de fornecimento.",
    company_name: "Fornecedora Premium LTDA",
    email: "atendimento@fornecedorapremium.com",
    created_at: "2024-01-15T12:00:00Z",
  },
];

export function DisputeSupplierClassificationMock({
  tenderId,
  isAuctioneer,
  userId,
  disputeStatus,
}: SupplierClassificationProps) {
  const [suppliers, setSuppliers] = useState<MockSupplier[]>(mockSuppliers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<MockSupplier | null>(null);
  const [actionType, setActionType] = useState<"qualify" | "disqualify">("qualify");
  const [justification, setJustification] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  const openClassificationDialog = (supplier: MockSupplier, action: "qualify" | "disqualify") => {
    setSelectedSupplier(supplier);
    setActionType(action);
    setJustification(supplier.justification || "");
    setDialogOpen(true);
  };

  const handleClassification = async () => {
    if (!selectedSupplier || !justification.trim()) {
      toast({
        title: "Justificativa obrigatória",
        description: "Por favor, informe a justificativa para a classificação.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Simular delay de API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      const newStatus = actionType === "qualify" ? "qualified" : "disqualified";

      // Atualizar o estado local (simulando update no banco)
      setSuppliers((prev) =>
        prev.map((supplier) =>
          supplier.id === selectedSupplier.id
            ? {
                ...supplier,
                status: newStatus,
                justification: justification.trim(),
              }
            : supplier
        )
      );

      toast({
        title: `Fornecedor ${newStatus === "qualified" ? "classificado" : "desclassificado"}`,
        description: `${selectedSupplier.company_name} foi ${
          newStatus === "qualified" ? "classificado" : "desclassificado"
        } com sucesso.`,
      });

      setDialogOpen(false);
      setJustification("");
      setSelectedSupplier(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível realizar a classificação.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "qualified":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Classificado
          </Badge>
        );
      case "disqualified":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Desclassificado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  const getStatusCounts = () => {
    const qualified = suppliers.filter((s) => s.status === "qualified").length;
    const disqualified = suppliers.filter((s) => s.status === "disqualified").length;
    const pending = suppliers.filter((s) => s.status === "pending").length;
    return { qualified, disqualified, pending };
  };

  const statusCounts = getStatusCounts();

  if (!isAuctioneer) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Classificação de Fornecedores
          </CardTitle>
          <div className="flex gap-4 text-sm">
            <span className="text-green-600">✓ Classificados: {statusCounts.qualified}</span>
            <span className="text-red-600">✗ Desclassificados: {statusCounts.disqualified}</span>
            <span className="text-yellow-600">⏳ Pendentes: {statusCounts.pending}</span>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Justificativa</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{supplier.company_name}</p>
                      <p className="text-sm text-muted-foreground">{supplier.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {supplier.justification ? (
                        <p
                          className="text-sm text-muted-foreground truncate"
                          title={supplier.justification}>
                          {supplier.justification}
                        </p>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">
                          Sem justificativa
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {supplier.status !== "qualified" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openClassificationDialog(supplier, "qualify")}
                          disabled={disputeStatus === "closed"}
                          className="text-green-600 border-green-200 hover:bg-green-50">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Classificar
                        </Button>
                      )}
                      {supplier.status !== "disqualified" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openClassificationDialog(supplier, "disqualify")}
                          disabled={disputeStatus === "closed"}
                          className="text-red-600 border-red-200 hover:bg-red-50">
                          <XCircle className="h-4 w-4 mr-1" />
                          Desclassificar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "qualify" ? "Classificar" : "Desclassificar"} Fornecedor
            </DialogTitle>
            <DialogDescription>
              Fornecedor: <strong>{selectedSupplier?.company_name}</strong>
              <br />
              Informe a justificativa para esta{" "}
              {actionType === "qualify" ? "classificação" : "desclassificação"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder="Digite a justificativa..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground">
              A justificativa será registrada no histórico da licitação e será visível para todos os
              participantes.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              onClick={handleClassification}
              disabled={!justification.trim() || isSubmitting}
              variant={actionType === "qualify" ? "default" : "destructive"}>
              {isSubmitting
                ? "Processando..."
                : actionType === "qualify"
                ? "Classificar"
                : "Desclassificar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
