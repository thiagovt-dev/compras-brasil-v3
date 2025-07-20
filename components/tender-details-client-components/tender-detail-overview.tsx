"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, FileText, MapPin, Phone, Mail } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface TenderOverviewProps {
  tender: Tender;
}

export default function TenderOverview({ tender }: TenderOverviewProps) {
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Descrição</h4>
              <p className="text-gray-600">{tender.description || "Descrição não informada"}</p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Categoria</h4>
                <p className="text-gray-600">{tender.category || "Não informado"}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Modalidade</h4>
                <p className="text-gray-600">{formatTenderType(tender.tender_type)}</p>
              </div>
            </div>

            {tender.judgment_criteria && (
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Critério de Julgamento</h4>
                <p className="text-gray-600">{tender.judgment_criteria}</p>
              </div>
            )}

            {tender.dispute_mode && (
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Modo de Disputa</h4>
                <p className="text-gray-600">{tender.dispute_mode}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Órgão Responsável</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Nome</h4>
              <p className="text-gray-600">{tender.agencies?.name || "Não informado"}</p>
            </div>

            {tender.agencies?.cnpj && (
              <div>
                <h4 className="font-medium text-gray-900 mb-1">CNPJ</h4>
                <p className="text-gray-600">{tender.agencies.cnpj}</p>
              </div>
            )}

            {tender.agencies?.address && (
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Endereço</h4>
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <p className="text-gray-600">{tender.agencies.address}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col space-y-2">
              {tender.agencies?.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-600">{tender.agencies.phone}</p>
                </div>
              )}

              {tender.agencies?.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-600">{tender.agencies.email}</p>
                </div>
              )}
            </div>

            {tender.agencies?.sphere && (
              <div>
                <Badge variant="outline" className="text-xs">
                  Esfera{" "}
                  {tender.agencies.sphere.charAt(0).toUpperCase() +
                    tender.agencies.sphere.slice(1)}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Prazos Importantes */}
      <Card>
        <CardHeader>
          <CardTitle>Prazos Importantes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900 mb-1">Publicação</h4>
              <p className="text-sm text-gray-600">
                {tender.publication_date
                  ? formatDate(tender.publication_date)
                  : "Não informado"}
              </p>
            </div>

            {tender.impugnation_deadline && (
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <FileText className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900 mb-1">Impugnações até</h4>
                <p className="text-sm text-gray-600">
                  {formatDate(tender.impugnation_deadline)}
                </p>
              </div>
            )}

            {tender.closing_date && (
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900 mb-1">Encerramento</h4>
                <p className="text-sm text-gray-600">{formatDate(tender.closing_date)}</p>
              </div>
            )}

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900 mb-1">Abertura</h4>
              <p className="text-sm text-gray-600">
                {tender.opening_date ? formatDate(tender.opening_date) : "Não informado"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}