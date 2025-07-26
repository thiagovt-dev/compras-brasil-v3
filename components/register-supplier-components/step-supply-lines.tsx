import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getSupplyLineLabel } from "@/lib/utils/database-utils";

interface StepSupplyLinesProps {
  supplyLines: string[];
  setSupplyLines: (lines: string[]) => void;
}

const ALL_SUPPLY_LINES = [
  "informatica",
  "moveis",
  "material_escritorio",
  "limpeza",
  "construcao",
  "alimentos",
  "medicamentos",
  "servicos_ti",
  "servicos_limpeza",
  "servicos_manutencao",
  "servicos_consultoria",
  "servicos_engenharia",
  "veiculos",
  "combustiveis",
  "equipamentos_medicos",
  "uniformes",
];

export default function StepSupplyLines({ supplyLines, setSupplyLines }: StepSupplyLinesProps) {
  const handleAdd = (value: string) => {
    if (!supplyLines.includes(value)) {
      setSupplyLines([...supplyLines, value]);
    }
  };

  const handleRemove = (index: number) => {
    setSupplyLines(supplyLines.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="supplyLine">
          Linhas de Fornecimento <span className="text-red-500">*</span>
        </Label>
        <Select onValueChange={handleAdd}>
          <SelectTrigger id="supplyLine">
            <SelectValue placeholder="Selecione uma linha de fornecimento" />
          </SelectTrigger>
          <SelectContent>
            {ALL_SUPPLY_LINES.map((line) => (
              <SelectItem key={line} value={line}>
                {getSupplyLineLabel(line)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Linhas de Fornecimento Selecionadas</Label>
        {supplyLines.length > 0 ? (
          <div className="space-y-2">
            {supplyLines.map((line, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <span>{getSupplyLineLabel(line)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(index)}
                  className="text-red-500"
                >
                  Remover
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-6 text-center">
            <p className="text-[1rem] text-muted-foreground">
              Nenhuma linha de fornecimento selecionada. Selecione pelo menos uma linha de fornecimento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}