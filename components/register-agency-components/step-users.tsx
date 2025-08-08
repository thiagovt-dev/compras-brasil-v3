"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Mail,
  PlusCircle,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AgencyUser {
  name: string;
  email: string;
  cpf: string;
  document: string;
  role: "auctioneer" | "authority" | "agency_support";
}

interface StepUsersProps {
  users: AgencyUser[];
  setUsers: (users: AgencyUser[]) => void;
}

export default function StepUsers({ users, setUsers }: StepUsersProps) {
  const { toast } = useToast();

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const handleUserChange = (index: number, field: string, value: string) => {
    const updatedUsers = [...users];
    if (field === "cpf" || field === "document") {
      updatedUsers[index] = { ...updatedUsers[index], [field]: formatCPF(value) };
    } else {
      updatedUsers[index] = { ...updatedUsers[index], [field]: value };
    }
    setUsers(updatedUsers);
  };

  const addUser = () => {
    setUsers([...users, { name: "", email: "", cpf: "", document: "", role: "agency_support" }]);
  };

  const removeUser = (index: number) => {
    if (users.length > 3) {
      setUsers(users.filter((_, i) => i !== index));
    } else {
      toast({
        title: "Não é possível remover",
        description:
          "É necessário ter pelo menos um pregoeiro, uma autoridade superior e um membro da equipe de apoio.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <p>
              É necessário cadastrar pelo menos um pregoeiro/agente de contratação, uma
              autoridade superior e um membro da equipe de apoio.
            </p>
          </div>
        </div>
      </div>

      {users.map((user, index) => (
        <div key={index} className="space-y-4 rounded-md border p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Usuário {index + 1}</h3>
            {users.length > 3 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeUser(index)}
                className="text-red-500">
                Remover
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`name-${index}`}>
                Nome Completo <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id={`name-${index}`}
                  placeholder="Nome do usuário"
                  value={user.name}
                  onChange={(e) => handleUserChange(index, "name", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`document-${index}`}>
                Documento (CPF) <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`document-${index}`}
                placeholder="000.000.000-00"
                value={user.document}
                onChange={(e) => handleUserChange(index, "document", e.target.value)}
                maxLength={14}
                required
              />
              <p className="text-xs text-muted-foreground">
                Este documento será usado como senha temporária
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
                  value={user.email}
                  onChange={(e) => handleUserChange(index, "email", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`role-${index}`}>
                Função <span className="text-red-500">*</span>
              </Label>
              <Select
                value={user.role}
                onValueChange={(value) =>
                  handleUserChange(
                    index,
                    "role",
                    value as "auctioneer" | "authority" | "agency_support"
                  )
                }>
                <SelectTrigger id={`role-${index}`}>
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auctioneer">
                    Pregoeiro/Agente de Contratação
                  </SelectItem>
                  <SelectItem value="authority">Autoridade Superior</SelectItem>
                  <SelectItem value="agency_support">Equipe de Apoio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addUser} className="w-full">
        <PlusCircle className="mr-2 h-4 w-4" />
        Adicionar Usuário
      </Button>

      <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <p>
              O documento informado será usado como senha temporária para o primeiro
              acesso. O usuário deverá alterar a senha no primeiro login.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}