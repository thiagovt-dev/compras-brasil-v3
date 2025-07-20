"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Users, User } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface TenderParticipantsProps {
  participants: TenderParticipant[];
  hasParticipantError: boolean;
}

export default function TenderParticipants({ participants, hasParticipantError }: TenderParticipantsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Participantes Habilitados</CardTitle>
      </CardHeader>
      <CardContent>
        {hasParticipantError ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-700">
                Erro ao carregar participantes. Tente recarregar a página.
              </p>
            </div>
          </div>
        ) : participants.length > 0 ? (
          <div className="space-y-3">
            {participants.map((participant, index) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {participant.suppliers?.name || `Participante ${index + 1}`}
                    </h4>
                    {participant.suppliers?.cnpj && (
                      <p className="text-sm text-gray-600">
                        CNPJ: {participant.suppliers.cnpj}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Habilitado em {formatDate(participant.registered_at)}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Habilitado
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum participante encontrado
            </h3>
            <p className="text-gray-600">
              Esta licitação ainda não possui participantes habilitados.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}