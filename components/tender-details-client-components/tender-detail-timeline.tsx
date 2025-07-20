"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface TenderTimelineProps {
  tender: Tender;
}

export default function TenderTimeline({ tender }: TenderTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cronograma da Licitação</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {tender.publication_date && (
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-3 h-3 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-gray-900">Publicação do Edital</h4>
                <p className="text-sm text-gray-600">{formatDate(tender.publication_date)}</p>
                <p className="text-sm text-green-600 font-medium">Concluído</p>
              </div>
            </div>
          )}

          {tender.impugnation_deadline && (
            <div className="flex items-start space-x-4">
              <div
                className={`flex-shrink-0 w-3 h-3 rounded-full mt-2 ${
                  new Date(tender.impugnation_deadline) > new Date()
                    ? "bg-yellow-500"
                    : "bg-gray-300"
                }`}
              ></div>
              <div>
                <h4 className="font-medium text-gray-900">Prazo para Impugnações</h4>
                <p className="text-sm text-gray-600">
                  Até {formatDate(tender.impugnation_deadline)}
                </p>
                <p
                  className={`text-sm font-medium ${
                    new Date(tender.impugnation_deadline) > new Date()
                      ? "text-yellow-600"
                      : "text-gray-500"
                  }`}
                >
                  {new Date(tender.impugnation_deadline) > new Date()
                    ? "Em andamento"
                    : "Encerrado"}
                </p>
              </div>
            </div>
          )}

          {tender.closing_date && (
            <div className="flex items-start space-x-4">
              <div
                className={`flex-shrink-0 w-3 h-3 rounded-full mt-2 ${
                  new Date(tender.closing_date) > new Date() ? "bg-gray-300" : "bg-green-500"
                }`}
              ></div>
              <div>
                <h4 className="font-medium text-gray-900">Prazo para Propostas</h4>
                <p className="text-sm text-gray-600">Até {formatDate(tender.closing_date)}</p>
                <p
                  className={`text-sm font-medium ${
                    new Date(tender.closing_date) > new Date()
                      ? "text-gray-500"
                      : "text-green-600"
                  }`}
                >
                  {new Date(tender.closing_date) > new Date() ? "Aguardando" : "Encerrado"}
                </p>
              </div>
            </div>
          )}

          {tender.opening_date && (
            <div className="flex items-start space-x-4">
              <div
                className={`flex-shrink-0 w-3 h-3 rounded-full mt-2 ${
                  new Date(tender.opening_date) > new Date() ? "bg-gray-300" : "bg-green-500"
                }`}
              ></div>
              <div>
                <h4 className="font-medium text-gray-900">Abertura da Sessão Pública</h4>
                <p className="text-sm text-gray-600">{formatDate(tender.opening_date)}</p>
                <p
                  className={`text-sm font-medium ${
                    new Date(tender.opening_date) > new Date()
                      ? "text-gray-500"
                      : "text-green-600"
                  }`}
                >
                  {new Date(tender.opening_date) > new Date() ? "Aguardando" : "Realizada"}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}