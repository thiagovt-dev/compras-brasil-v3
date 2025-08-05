"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSupplyLineLabel } from "@/lib/utils/database-utils";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { updateSupplierStatus } from "@/lib/actions/supplierAction";
import { useRouter } from "next/navigation";
// Remova esta linha: import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast"; // Ajuste o caminho se necessário

const statusLabels: Record<string, string> = {
  active: "Ativo",
  pending: "Pendente",
  blocked: "Bloqueado",
};

export function SupplierDetailCard({
  supplier,
}: {
  supplier: Supplier & { supply_line_names?: string[] };
}) {
  const route = useRouter();
  const { toast } = useToast(); // Agora está correto

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(supplier.status || "pending");

  const handleStatusUpdate = async (newStatus: string) => {
    console.log("Updating status to:", newStatus);
    try {
      const res = await updateSupplierStatus(supplier.id, newStatus);
      if (res.success) {
        console.log("Status updated successfully:", res.data);
        setSelectedStatus(newStatus);
        toast({
          title: "Fornecedor atualizado",
          description: `Status do fornecedor atualizado para ${
            statusLabels[newStatus] || newStatus
          }.`,
        });
      }
      setIsModalOpen(false);
      route.refresh();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do fornecedor.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex justify-between">
            {supplier.name}
            <div>
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button>Atualizar status</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Atualizar Status do Fornecedor</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p>
                      Selecione o novo status para <strong>{supplier.name}</strong>:
                    </p>
                    <div className="space-y-2">
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <Button
                          key={value}
                          variant={selectedStatus === value ? "default" : "outline"}
                          className="w-full justify-start"
                          onClick={() => handleStatusUpdate(value)}>
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <b>Status:</b>{" "}
          <Badge variant="default">
            {statusLabels[supplier.status || "pending"] || supplier.status || "-"}
          </Badge>
        </div>
        <div>
          <b>CNPJ:</b> {supplier.cnpj || "-"}
        </div>
        {supplier.is_foreign && (
          <div>
            <b>Número de Registro Estrangeiro:</b> {supplier.foreign_registration_number || "-"}
          </div>
        )}
        <div>
          <b>Inscrição Estadual:</b> {supplier.state_registration || "-"}
        </div>
        <div>
          <b>Endereço:</b> {supplier.address || "-"}
        </div>
        <div>
          <b>Email:</b> {supplier.email || "-"}
        </div>
        <div>
          <b>Telefone:</b> {supplier.phone || "-"}
        </div>
        <div>
          <b>Site:</b> {supplier.website || "-"}
        </div>
        <div>
          <b>Linhas de Fornecimento:</b>{" "}
          {Array.isArray(supplier.supply_line_names) && supplier.supply_line_names.length > 0
            ? supplier.supply_line_names.map((name) => getSupplyLineLabel(name)).join(", ")
            : "-"}
        </div>
        <div>
          <b>Data de Cadastro:</b>{" "}
          {supplier.created_at ? new Date(supplier.created_at).toLocaleDateString("pt-BR") : "-"}
        </div>
      </CardContent>
    </Card>
  );
}
