"use client";

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, Package } from "lucide-react";

interface DisputeRightPanelDemoProps {
  activeLot: any | null;
  lotProposals: any[]; // Recebe as propostas específicas do lote ativo
  lotItems: any[]; // Recebe os itens específicos do lote ativo
}

export function DisputeRightPanelDemo({
  activeLot,
  lotProposals,
  lotItems,
}: DisputeRightPanelDemoProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Propostas Classificadas
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        {!activeLot ? (
          <div className="flex items-center justify-center h-full text-center text-gray-500">
            Selecione um lote para ver as propostas e itens.
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {/* Propostas Classificadas */}
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2 text-gray-900">
                <Filter className="h-5 w-5" />
                Propostas Classificadas
              </h4>
              {lotProposals.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  Nenhuma proposta classificada para este lote.
                </div>
              ) : (
                <div className="space-y-2">
                  {lotProposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                      <span className="font-medium text-gray-900">{proposal.name}</span>
                      <span className="font-bold text-gray-700">
                        {formatCurrency(proposal.value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Itens Do Lote */}
            <div className="mt-6">
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2 text-gray-900">
                <Package className="h-5 w-5" />
                Itens Do Lote
              </h4>
              {lotItems.length === 0 ? (
                <div className="text-center text-gray-500 py-4">Nenhum item para este lote.</div>
              ) : (
                <div className="space-y-2">
                  {lotItems.map((item) => (
                    <div key={item.id} className="p-3 bg-gray-50 rounded-lg border">
                      <p className="font-medium text-gray-900">{item.description}</p>
                      <p className="text-sm text-gray-600">Referência: {item.reference}</p>
                      <p className="font-bold text-gray-700 mt-1">{formatCurrency(item.value)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </div>
  );
}
