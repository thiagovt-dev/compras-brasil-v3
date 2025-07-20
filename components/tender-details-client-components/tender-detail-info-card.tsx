"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, DollarSign, Building } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

interface TenderInfoCardsProps {
  tender: Tender;
}
export default function TenderInfoCards({ tender }: TenderInfoCardsProps) {
  const formatTenderType = (type: string) => {
    const types: Record<string, string> = {
      pregao_eletronico: "Pregão Eletrônico",
      concorrencia: "Concorrência",
      tomada_de_precos: "Tomada de Preços",
      convite: "Convite",
      leilao: "Leilão",
      concurso: "Concurso",
    };
    return types[type] || type;
  };

  const getTotalValue = () => {
    return (
      tender.tender_lots?.reduce((total: number, lot: any) => {
        return total + (lot.estimated_value || 0);
      }, 0) ||
      tender.estimated_value ||
      0
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Publicação</p>
              <p className="text-sm text-gray-600">
                {tender.publication_date
                  ? formatDate(tender.publication_date)
                  : "Não informado"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Abertura</p>
              <p className="text-sm text-gray-600">
                {tender.opening_date ? formatDate(tender.opening_date) : "Não informado"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Valor Estimado</p>
              <p className="text-sm text-gray-600">
                {tender.secret_value ? "Sigiloso" : formatCurrency(getTotalValue())}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Building className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Modalidade</p>
              <p className="text-sm text-gray-600">{formatTenderType(tender.tender_type)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}