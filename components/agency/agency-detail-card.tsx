"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  FileText,
  Save,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateAgencyStatus } from "@/lib/actions/agencyAction";

interface Agency {
  id: string;
  name: string;
  cnpj?: string;
  agency_type?: string;
  sphere?: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  status?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

const statusLabels: Record<string, string> = {
  active: "Ativo",
  pending: "Pendente",
  blocked: "Bloqueado",
  inactive: "Inativo",
};

const sphereLabels: Record<string, string> = {
  federal: "Federal",
  estadual: "Estadual",
  municipal: "Municipal",
  distrital: "Distrital",
};

const agencyTypeLabels: Record<string, string> = {
  ministerio: "Ministério",
  secretaria: "Secretaria",
  autarquia: "Autarquia",
  fundacao: "Fundação",
  empresa_publica: "Empresa Pública",
  sociedade_economia_mista: "Sociedade de Economia Mista",
  agencia_reguladora: "Agência Reguladora",
  tribunal: "Tribunal",
  prefeitura: "Prefeitura",
  camara_municipal: "Câmara Municipal",
  assembleia_legislativa: "Assembleia Legislativa",
  outro: "Outro",
};

function getBadgeVariant(status?: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default";
    case "pending":
      return "secondary";
    case "blocked":
      return "destructive";
    case "inactive":
      return "outline";
    default:
      return "outline";
  }
}

export function AgencyDetailCard({ agency }: { agency: Agency }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(agency.status || "pending");
  const { toast } = useToast();

  const handleStatusUpdate = async () => {
    if (currentStatus === agency.status) {
      toast({
        title: "Nenhuma alteração",
        description: "O status selecionado é o mesmo atual.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updateAgencyStatus(agency.id, currentStatus);

      if (result.success) {
        toast({
          title: "Status atualizado",
          description: `Status do órgão alterado para ${statusLabels[currentStatus]}.`,
        });
        // Recarregar a página para refletir as mudanças
        window.location.reload();
      } else {
        toast({
          title: "Erro ao atualizar",
          description: result.error || "Não foi possível atualizar o status.",
          variant: "destructive",
        });
        setCurrentStatus(agency.status || "pending");
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao atualizar o status.",
        variant: "destructive",
      });
      setCurrentStatus(agency.status || "pending");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatCNPJ = (cnpj?: string) => {
    if (!cnpj) return "-";
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return "-";
    return phone.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Status e Ações */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Alterar Status
            </CardTitle>
            <Badge variant={getBadgeVariant(agency.status)}>
              {statusLabels[agency.status || "pending"]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="status">Novo Status</Label>
              <Select value={currentStatus} onValueChange={setCurrentStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Ativo
                    </div>
                  </SelectItem>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-yellow-600" />
                      Pendente
                    </div>
                  </SelectItem>
                  <SelectItem value="blocked">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Bloqueado
                    </div>
                  </SelectItem>
                  <SelectItem value="inactive">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-gray-600" />
                      Inativo
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleStatusUpdate}
              disabled={isUpdating || currentStatus === agency.status}
              className="mt-6"
            >
              {isUpdating ? (
                "Salvando..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informações Gerais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Nome do Órgão</h3>
              <p className="text-sm">{agency.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">CNPJ</h3>
              <p className="text-sm">{formatCNPJ(agency.cnpj)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Tipo</h3>
              <p className="text-sm">
                {agencyTypeLabels[agency.agency_type || ""] || agency.agency_type || "-"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Esfera</h3>
              <p className="text-sm">
                {sphereLabels[agency.sphere || ""] || agency.sphere || "-"}
              </p>
            </div>
            {agency.description && (
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Descrição</h3>
                <p className="text-sm">{agency.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informações de Contato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Informações de Contato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Mail className="h-4 w-4" />
                E-mail
              </h3>
              <p className="text-sm">{agency.email || "-"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Phone className="h-4 w-4" />
                Telefone
              </h3>
              <p className="text-sm">{formatPhone(agency.phone)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Endereço
              </h3>
              <p className="text-sm">{agency.address || "-"}</p>
            </div>
            {agency.website && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  Website
                </h3>
                <a
                  href={agency.website.startsWith("http") ? agency.website : `https://${agency.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {agency.website}
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Cadastrado em</h3>
              <p className="text-sm">{formatDate(agency.created_at)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Última atualização</h3>
              <p className="text-sm">{formatDate(agency.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}