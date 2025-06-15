"use client";

import type React from "react";

import { Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DisputeHeaderProps {
  tender: any;
  disputeStatus: string;
  currentTime: Date;
  userInfo: {
    icon: React.ReactNode;
    label: string;
    description: string;
    variant: "default" | "secondary" | "destructive" | "outline";
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
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <header className="bg-blue-700 text-white p-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Licitação Digital Nº: {tender.number}</h1>
          <Badge variant="secondary" className="bg-blue-600 text-white text-sm px-3 py-1">
            Pregão Eletrônico {tender.type}
          </Badge>
          <span className="text-sm text-blue-200">
            Unidade: {tender.agency_name} - {tender.city}
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span className="text-lg font-semibold">{formatTime(currentTime)}</span>
          </div>
          <Badge variant={userInfo.variant} className="flex items-center gap-2 text-sm px-3 py-1">
            {userInfo.icon}
            <span>{userInfo.label}</span>
          </Badge>
          {supplierIdentifier && (
            <Badge
              variant="default"
              className="flex items-center gap-2 text-sm px-3 py-1 bg-blue-500 text-white">
              <Users className="h-4 w-4" />
              <span>Você é o {supplierIdentifier}</span>
            </Badge>
          )}
        </div>
      </div>
      <div className="container mx-auto mt-2 flex items-center justify-between text-sm text-blue-100">
        <span>Intervalo mínimo: R$ 0,10</span>
        <span>Formato de lance: Unitário</span>
        <Badge variant="secondary" className="bg-blue-600 text-white text-sm px-3 py-1">
          Modo {disputeMode === "open" ? "aberto" : "fechado"}
        </Badge>
      </div>
    </header>
  );
}
