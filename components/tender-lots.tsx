"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertCircle } from "lucide-react"

interface TenderLotsProps {
  tender: any
  usingMockData?: boolean
}

export function TenderLots({ tender, usingMockData = false }: TenderLotsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const getBenefitTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      exclusive: "Exclusivo ME/EPP",
      benefit: "Ampla com benefício ME/EPP",
      open: "Ampla concorrência",
      regional: "Regional",
    }
    return typeMap[type] || "Ampla concorrência"
  }

  const getBenefitTypeBadge = (type: string) => {
    const typeConfig: Record<string, { label: string; variant: "default" | "outline" | "secondary" }> = {
      exclusive: {
        label: "Exclusivo ME/EPP",
        variant: "default",
      },
      benefit: {
        label: "Ampla com benefício ME/EPP",
        variant: "secondary",
      },
      open: {
        label: "Ampla concorrência",
        variant: "outline",
      },
      regional: {
        label: "Regional",
        variant: "outline",
      },
    }

    const config = typeConfig[type] || { label: "Ampla concorrência", variant: "outline" }

    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const lots = tender?.lots || []

  return (
    <div className="space-y-6">
      {/* Indicador de dados mockados */}
      {(usingMockData || tender?.is_mock) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            <strong>Lotes de demonstração:</strong> Estes são lotes e itens de exemplo para fins de demonstração.
          </p>
        </div>
      )}

      {lots.length > 0 ? (
        lots.map((lot: any) => (
          <Card key={lot.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  {tender.judgment_criteria === "menor-preco-item" ? "Item" : `Lote ${lot.number}`}:{" "}
                  {lot.description || "Sem descrição"}
                </CardTitle>
                {(lot.is_mock || tender?.is_mock) && (
                  <Badge variant="secondary" className="text-xs">
                    Demo
                  </Badge>
                )}
              </div>
              {lot.estimated_value && (
                <p className="text-sm text-muted-foreground">
                  Valor estimado: {tender.is_value_secret ? "Sigiloso" : formatCurrency(lot.estimated_value)}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-base font-semibold">Item</TableHead>
                      <TableHead className="text-base font-semibold min-w-[300px]">Descrição</TableHead>
                      <TableHead className="text-base font-semibold">Qtd</TableHead>
                      <TableHead className="text-base font-semibold">Unidade</TableHead>
                      <TableHead className="text-base font-semibold">Valor Unitário</TableHead>
                      <TableHead className="text-base font-semibold">Valor Total</TableHead>
                      <TableHead className="text-base font-semibold">Benefício</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lot.items && lot.items.length > 0 ? (
                      lot.items.map((item: any) => (
                        <TableRow key={item.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium text-base">{item.number}</TableCell>
                          <TableCell className="text-base">
                            <div>
                              <p className="font-medium">{item.description}</p>
                              {item.specifications && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {item.specifications}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-base">{item.quantity}</TableCell>
                          <TableCell className="text-base">{item.unit}</TableCell>
                          <TableCell className="text-base font-medium">
                            {tender.is_value_secret ? "Sigiloso" : formatCurrency(item.unit_price || 0)}
                          </TableCell>
                          <TableCell className="text-base font-semibold">
                            {tender.is_value_secret
                              ? "Sigiloso"
                              : formatCurrency(item.total_price || (item.unit_price || 0) * (item.quantity || 0))}
                          </TableCell>
                          <TableCell>
                            {getBenefitTypeBadge(item.benefit_type || "open")}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-muted-foreground">Nenhum item encontrado neste lote.</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">Nenhum lote ou item encontrado.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Os lotes e itens aparecerão aqui quando estiverem disponíveis.
          </p>
        </div>
      )}
    </div>
  )
}