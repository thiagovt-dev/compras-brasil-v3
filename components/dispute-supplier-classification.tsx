"use client";

import { useState, useEffect } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
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

interface Supplier {
  id: string;
  user_id: string;
  status: "qualified" | "disqualified" | "pending";
  justification?: string;
  profiles: {
    name?: string;
    email?: string;
    company_name?: string;
  };
  created_at: string;
}

export function DisputeSupplierClassification({
  tenderId,
  isAuctioneer,
  userId,
  disputeStatus,
}: SupplierClassificationProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [actionType, setActionType] = useState<"qualify" | "disqualify">("qualify");
  const [justification, setJustification] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClientSupabaseClient();
  const { toast } = useToast();

  useEffect(() => {
    loadSuppliers();

    // Subscription para atualizações em tempo real
    const suppliersSubscription = supabase
      .channel(`supplier_classification_${tenderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tender_participants",
          filter: `tender_id=eq.${tenderId}`,
        },
        () => {
          loadSuppliers();
        }
      )
      .subscribe();

    return () => {
      suppliersSubscription.unsubscribe();
    };
  }, [tenderId]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tender_participants")
        .select(
          `
          *,
          profiles:user_id(name, email, company_name)
        `
        )
        .eq("tender_id", tenderId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error("Erro ao carregar fornecedores:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de fornecedores.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openClassificationDialog = (supplier: Supplier, action: "qualify" | "disqualify") => {
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

    try {
      const newStatus = actionType === "qualify" ? "qualified" : "disqualified";

      const { error } = await supabase
        .from("tender_participants")
        .update({
          status: newStatus,
          justification: justification.trim(),
          classified_by: userId,
          classified_at: new Date().toISOString(),
        })
        .eq("id", selectedSupplier.id);

      if (error) throw error;

      // Registrar no chat da disputa
      await supabase.from("dispute_messages").insert({
        tender_id: tenderId,
        user_id: userId,
        content: `Fornecedor ${
          selectedSupplier.profiles?.company_name ||
          selectedSupplier.profiles?.name ||
          "Não informado"
        } foi ${
          newStatus === "qualified" ? "classificado" : "desclassificado"
        }. Justificativa: ${justification}`,
        type: "system",
        is_private: false,
      });

      toast({
        title: `Fornecedor ${newStatus === "qualified" ? "classificado" : "desclassificado"}`,
        description: "A classificação foi registrada com sucesso.",
      });

      setDialogOpen(false);
      setJustification("");
      setSelectedSupplier(null);
    } catch (error) {
      console.error("Erro ao classificar fornecedor:", error);
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
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum fornecedor participando desta licitação.
            </div>
          ) : (
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
                        <p className="font-medium">
                          {supplier.profiles?.company_name ||
                            supplier.profiles?.name ||
                            "Não informado"}
                        </p>
                        <p className="text-sm text-muted-foreground">{supplier.profiles?.email}</p>
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
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "qualify" ? "Classificar" : "Desclassificar"} Fornecedor
            </DialogTitle>
            <DialogDescription>
              Fornecedor:{" "}
              {selectedSupplier?.profiles?.company_name || selectedSupplier?.profiles?.name}
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
