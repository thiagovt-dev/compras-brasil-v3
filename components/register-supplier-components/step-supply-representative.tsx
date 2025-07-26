import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, User } from "lucide-react";

interface Representative {
  name: string;
  email: string;
  cpf: string;
}

interface StepRepresentativesProps {
  representatives: Representative[];
  setRepresentatives: (reps: Representative[]) => void;
}

export default function StepRepresentatives({
  representatives,
  setRepresentatives,
}: StepRepresentativesProps) {
  const handleChange = (index: number, field: keyof Representative, value: string) => {
    const updated = [...representatives];
    updated[index] = { ...updated[index], [field]: value };
    setRepresentatives(updated);
  };

  const addRepresentative = () => {
    setRepresentatives([...representatives, { name: "", email: "", cpf: "" }]);
  };

  const removeRepresentative = (index: number) => {
    if (representatives.length > 1) {
      setRepresentatives(representatives.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6">
      {representatives.map((rep, index) => (
        <div key={index} className="space-y-4 rounded-md border p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Representante {index + 1}</h3>
            {representatives.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeRepresentative(index)}
                className="text-red-500"
              >
                Remover
              </Button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`name-${index}`}>Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id={`name-${index}`}
                  placeholder="Nome do representante"
                  value={rep.name}
                  onChange={e => handleChange(index, "name", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`cpf-${index}`}>CPF</Label>
              <Input
                id={`cpf-${index}`}
                placeholder="000.000.000-00"
                value={rep.cpf}
                onChange={e => handleChange(index, "cpf", e.target.value)}
                maxLength={14}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`email-${index}`}>
              E-mail <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id={`email-${index}`}
                type="email"
                placeholder="email@exemplo.com"
                value={rep.email}
                onChange={e => handleChange(index, "email", e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addRepresentative} className="w-full">
        Adicionar Representante
      </Button>

      <div className="rounded-md bg-blue-50 p-4 text-[1rem] text-blue-800">
        <p>
          Os representantes devem estar previamente cadastrados no sistema. Caso não estejam, um convite será enviado para o e-mail informado.
        </p>
      </div>
    </div>
  );
}