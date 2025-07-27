"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSupplyLineLabel } from "@/lib/utils/database-utils";

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>{supplier.name}</CardTitle>
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
            ? supplier.supply_line_names
                .map((name) => getSupplyLineLabel(name))
                .join(", ")
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