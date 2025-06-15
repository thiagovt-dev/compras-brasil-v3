"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Settings, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DisputeModeControlsDemoProps {
  currentMode: string;
  onModeChange: (mode: string) => void;
  isAuctioneer: boolean;
}

const disputeModes = [
  {
    value: "open",
    label: "Aberto",
    description: "10 min iniciais + prorrogações automáticas de 2 min",
    color: "bg-green-500",
  },
  {
    value: "open_restart",
    label: "Aberto (com reinício)",
    description: "Modo aberto + possibilidade de reinício manual",
    color: "bg-blue-500",
  },
  {
    value: "closed",
    label: "Fechado",
    description: "Sem fase de lances, classificação direta",
    color: "bg-gray-500",
  },
  {
    value: "open_closed",
    label: "Aberto e Fechado",
    description: "Fase aberta + propostas finais fechadas",
    color: "bg-purple-500",
  },
  {
    value: "closed_open",
    label: "Fechado e Aberto",
    description: "Propostas fechadas + disputa aberta com top 3",
    color: "bg-orange-500",
  },
  {
    value: "random",
    label: "Randômico",
    description: "Tempo aleatório de 0 a 30 minutos (oculto)",
    color: "bg-red-500",
  },
];

export function DisputeModeControlsDemo({
  currentMode,
  onModeChange,
  isAuctioneer,
}: DisputeModeControlsDemoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState(currentMode);
  const { toast } = useToast();

  const currentModeData = disputeModes.find((mode) => mode.value === currentMode);

  useEffect(() => {
    setSelectedMode(currentMode);
  }, [currentMode]);

  const handleModeChange = () => {
    console.log("Changing mode from", currentMode, "to", selectedMode);
    onModeChange(selectedMode);
    setIsOpen(false);
    toast({
      title: "Modo de Disputa Alterado",
      description: `Modo alterado para: ${
        disputeModes.find((m) => m.value === selectedMode)?.label
      }`,
    });
  };

  const handleOpenChange = (open: boolean) => {
    console.log("Dialog open state changed to:", open);
    setIsOpen(open);
  };

  if (!isAuctioneer) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${currentModeData?.color}`} />
          {currentModeData?.label}
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${currentModeData?.color}`} />
        {currentModeData?.label}
      </Badge>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-500"
            onClick={() => {
              console.log("Alterar Modo button clicked");
              setIsOpen(true);
            }}>
            <Settings className="h-4 w-4 mr-1" />
            Alterar Modo
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurar Modo de Disputa (Demo)
            </DialogTitle>
            <DialogDescription>
              Selecione o modo de disputa para testar diferentes comportamentos na demonstração.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="mode-select">Modo de Disputa</Label>
              <Select value={selectedMode} onValueChange={setSelectedMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {disputeModes.map((mode) => (
                    <SelectItem key={mode.value} value={mode.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${mode.color}`} />
                        {mode.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMode && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">
                      {disputeModes.find((m) => m.value === selectedMode)?.label}
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      {disputeModes.find((m) => m.value === selectedMode)?.description}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleModeChange} disabled={selectedMode === currentMode}>
              Aplicar Modo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
