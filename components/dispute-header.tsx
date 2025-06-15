"use client";

import type React from "react";
import { Badge } from "@/components/ui/badge";
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
        return "Modo Aberto";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "bg-yellow-500";
      case "open":
        return "bg-green-500";
      case "negotiation":
        return "bg-blue-500";
      case "closed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "waiting":
        return "Aguardando Início";
      case "open":
        return "Disputa Aberta";
      case "negotiation":
        return "Em Negociação";
      case "closed":
        return "Encerrada";
      default:
        return "Indefinido";
    }
  };

  return (
    <div className="bg-blue-600 text-white shadow-lg">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Informações da Licitação - Lado Esquerdo */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-6 w-6" />
              <div>
                <h1 className="text-2xl font-bold">
                  Processo Licitatório Nº {tender.tender_number}
                </h1>
                <p className="text-lg text-blue-100">Pregão Eletrônico Nº {tender.tender_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-blue-100">
              <Building className="h-5 w-5" />
              <span className="text-lg">Unidade Única: {tender.agency?.name}</span>
            </div>
          </div>

          {/* Status e Informações - Centro */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`px-4 py-2 rounded-full ${getStatusColor(
                  disputeStatus
                )} text-white font-semibold text-lg`}>
                {getStatusLabel(disputeStatus)}
              </div>
              <Badge
                variant="outline"
                className="bg-white/10 text-white border-white/20 text-base px-3 py-1">
                {getDisputeModeLabel(disputeMode)}
              </Badge>
            </div>
            {supplierIdentifier && (
              <Badge
                variant="outline"
                className="bg-white/10 text-white border-white/20 text-base px-3 py-1 flex items-center gap-2">
                <User className="h-4 w-4" />
                Você é o {supplierIdentifier}
              </Badge>
            )}
          </div>

          {/* Relógio - Lado Direito */}
          <div className="flex flex-col items-end">
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-3 text-white">
                <Clock className="h-6 w-6" />
                <div className="text-right">
                  <div className="text-3xl font-mono font-bold">
                    {currentTime.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </div>
                  <div className="text-sm text-blue-100">
                    {currentTime.toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
