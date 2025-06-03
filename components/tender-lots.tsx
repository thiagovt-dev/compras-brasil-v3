import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface TenderLotsProps {
  tender: any;
}

export function TenderLots({ tender }: TenderLotsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getBenefitTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      exclusive_for_me_epp: "Exclusivo ME/EPP",
      open_competition_with_benefit_for_me_epp: "Ampla com benefício ME/EPP",
      open_competition_without_benefit: "Ampla concorrência",
      regional: "Regional",
    };
    return typeMap[type] || type;
  };

  const getBenefitTypeBadge = (type: string) => {
    const typeConfig: Record<
      string,
      { label: string; variant: "default" | "outline" | "secondary" }
    > = {
      exclusive_for_me_epp: {
        label: "Exclusivo ME/EPP",
        variant: "default",
      },
      open_competition_with_benefit_for_me_epp: {
        label: "Ampla com benefício ME/EPP",
        variant: "secondary",
      },
      open_competition_without_benefit: {
        label: "Ampla concorrência",
        variant: "outline",
      },
      regional: {
        label: "Regional",
        variant: "outline",
      },
    };

    const config = typeConfig[type] || { label: type, variant: "outline" };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {tender.lots && tender.lots.length > 0 ? (
        tender.lots.map((lot: any) => (
          <Card key={lot.id}>
            <CardHeader>
              <CardTitle>
                {tender.judgment_criteria === "menor-preco-item" ? "Item" : `Lote ${lot.number}`}:{" "}
                {lot.description || "Sem descrição"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Valor Unitário</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Benefício</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lot.items && lot.items.length > 0 ? (
                    lot.items.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.number}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>
                          {tender.is_value_secret
                            ? "Sigiloso"
                            : formatCurrency(item.unit_price || 0)}
                        </TableCell>
                        <TableCell>
                          {tender.is_value_secret
                            ? "Sigiloso"
                            : formatCurrency((item.unit_price || 0) * (item.quantity || 0))}
                        </TableCell>
                        <TableCell>{getBenefitTypeBadge(item.benefit_type)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        Nenhum item encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-8 border rounded-md">
          <p className="text-muted-foreground">Nenhum lote ou item encontrado.</p>
        </div>
      )}
    </div>
  );
}
