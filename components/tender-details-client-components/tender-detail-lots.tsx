"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "../ui/button";
import Link from "next/link";
import SupplierProposalDetails from "../supplier/supplier-proposal-details";

interface TenderLotsProps {
  tender: Tender;
  userProposals?: Record<string, any>; // propostas por lotId
  isSupplier?: boolean;
  userId?: string;
}

export default function TenderLots({ 
  tender, 
  userProposals = {},
  isSupplier = false,
  userId 
}: TenderLotsProps) {
  const canShowProposalButton = isSupplier && tender.status === "published";
  const isDeadlineOpen = !tender.closing_date || new Date(tender.closing_date) > new Date();

  return (
    <div className="flex flex-col gap-6">
      {canShowProposalButton && isDeadlineOpen && (
        <div>
          <Link href={`/dashboard/supplier/tenders/${tender.id}/proposals`}>
            <Button>Enviar Proposta</Button>
          </Link>
        </div>
      )}

      <div className="space-y-6">
        {tender.tender_lots && tender.tender_lots.length > 0 ? (
          tender.tender_lots.map((lot: any) => (
            <div key={lot.id} className="space-y-4">
              {/* Card do Lote */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Lote {lot.number}: {lot.description}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{lot.type}</Badge>
                    {lot.estimated_value && (
                      <span className="text-sm text-gray-600">
                        Valor estimado: {formatCurrency(lot.estimated_value)}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {lot.tender_items && lot.tender_items.length > 0 ? (
                    <div className="space-y-4">
                      {lot.tender_items.map((item: any) => (
                        <div key={item.id} className="border rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                              <h4 className="font-medium text-gray-900 mb-1">
                                Item {item.item_number}: {item.description}
                              </h4>
                              {item.benefit_type && (
                                <Badge variant="outline" className="mt-2">
                                  {item.benefit_type}
                                </Badge>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Quantidade</p>
                              <p className="font-medium">
                                {item.quantity} {item.unit}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Valor Unitário Estimado</p>
                              <p className="font-medium">
                                {item.estimated_unit_price
                                  ? formatCurrency(item.estimated_unit_price)
                                  : "Não informado"}
                              </p>
                            </div>
                          </div>
                          {item.estimated_unit_price && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Valor Total do Item:</span>{" "}
                                {formatCurrency(item.quantity * item.estimated_unit_price)}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">Nenhum item cadastrado para este lote.</p>
                  )}
                </CardContent>
              </Card>

              {isSupplier && userId && (
                <SupplierProposalDetails
                  proposal={userProposals[lot.id] || null}
                  lotId={lot.id}
                  tenderId={tender.id}
                  tender={tender}
                />
              )}
            </div>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum lote encontrado</h3>
              <p className="text-gray-600">Esta licitação ainda não possui lotes cadastrados.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}