"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Timer, Eye, Shuffle, Lock, Unlock } from "lucide-react";

interface DisputeModeIndicatorProps {
  mode: string;
  className?: string;
}

const modeConfig = {
  open: {
    name: "Aberto",
    description: "10 min + prorrogações automáticas de 2 min",
    icon: Unlock,
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  open_restart: {
    name: "Aberto (com reinício)",
    description: "Modo aberto + possibilidade de reinício manual",
    icon: Timer,
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  closed: {
    name: "Fechado",
    description: "Sem fase de lances, classificação direta",
    icon: Lock,
    color: "bg-gray-500",
    textColor: "text-gray-700",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
  open_closed: {
    name: "Aberto e Fechado",
    description: "Fase aberta + propostas finais fechadas",
    icon: Eye,
    color: "bg-purple-500",
    textColor: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  closed_open: {
    name: "Fechado e Aberto",
    description: "Propostas fechadas + disputa aberta com top 3",
    icon: Clock,
    color: "bg-orange-500",
    textColor: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  random: {
    name: "Randômico",
    description: "Tempo aleatório de 0 a 30 minutos (oculto)",
    icon: Shuffle,
    color: "bg-red-500",
    textColor: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
};

export function DisputeModeIndicator({ mode, className = "" }: DisputeModeIndicatorProps) {
  const config = modeConfig[mode as keyof typeof modeConfig] || modeConfig.open;
  const Icon = config.icon;

  return (
    <Card className={`${config.bgColor} ${config.borderColor} ${className}`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${config.color}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className={`font-semibold ${config.textColor}`}>{config.name}</h4>
              <Badge variant="outline" className="text-xs">
                ATIVO
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-1">{config.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
