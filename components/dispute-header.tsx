"use client";

import type React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Building, FileText, User } from "lucide-react";

interface DisputeHeaderProps {
  tender: any;
  disputeStatus: string;
  currentTime: Date;
  userInfo: {
    icon: React.ReactNode;
    label: string;
    description: string;
    variant: "default" | "secondary";
  };
  supplierIdentifier: string | null;
  disputeMode: string;
}

export function DisputeHeader({
  tender,
  disputeStatus,
  currentTime,
  userInfo,
  supplierIdentifier,
  disputeMode,
}: DisputeHeaderProps) {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "waiting":
        return { label: "Aguardando Início", variant: "outline" as const, color: "text-gray-600" };
      case "open":
        return { label: "Disputa Aberta", variant: "default" as const, color: "text-green-600" };
      case "negotiation":
        return { label: "Em Negociação", variant: "secondary" as const, color: "text-blue-600" };
      case "closed":
        return { label: "Encerrada", variant: "destructive" as const, color: "text-red-600" };
      default:
        return { label: "Indefinido", variant: "outline" as const, color: "text-gray-600" };
    }
  };

  const getDisputeModeLabel = (mode: string) => {
    switch (mode) {
      case "open":
        return "Modo Aberto";
      case "closed":
        return "Modo Fechado";
      case "open_closed":
        return "Modo Aberto-Fechado";
      case "closed_open":
        return "Modo Fechado-Aberto";
      case "random":
        return "Modo Randômico";
      default:
        return "Modo Desconhecido";
    }
  };

  const statusInfo = getStatusInfo(disputeStatus);

  return (
    <div className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Informações da Licitação */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-5 w-5" />
              <h1 className="text-lg font-bold">Processo Licitatório Nº {tender.tender_number}</h1>
              <span className="text-blue-200 text-sm">
                Pregão Eletrônico Nº {tender.tender_number}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-100">
              <Building className="h-4 w-4" />
              <span>Unidade Única: {tender.agency?.name}</span>
            </div>
          </div>

          {/* Status e Relógio */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            {supplierIdentifier && (
              <Badge
                variant="outline"
                className="bg-white/10 text-white border-white/20 flex items-center gap-1">
                <User className="h-4 w-4" />
                Você é o {supplierIdentifier}
              </Badge>
            )}
            <Badge variant="outline" className="bg-white/10 text-white border-white/20">
              {getDisputeModeLabel(disputeMode)}
            </Badge>
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-2">
                <div className="flex items-center gap-2 text-white">
                  <Clock className="h-4 w-4" />
                  <div className="text-center">
                    <div className="text-base font-mono font-bold">
                      {currentTime.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </div>
                    <div className="text-xs text-blue-100">
                      {currentTime.toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
