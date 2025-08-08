"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";

interface FormData {
  agencyName: string;
  cnpj: string;
  agencyType: string;
  sphere: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  description: string;
}

interface AgencyUser {
  name: string;
  email: string;
  document: string;
  role: string;
}

interface Documents {
  normativeAct: File | null;
  termsOfAgreement: File | null;
}

interface StepReviewProps {
  formData: FormData;
  users: AgencyUser[];
  documents: Documents;
}

// Helper functions
function getAgencyTypeLabel(value: string): string {
  const agencyTypes: Record<string, string> = {
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
  return agencyTypes[value] || value;
}

function getSphereLabel(value: string): string {
  const spheres: Record<string, string> = {
    federal: "Federal",
    estadual: "Estadual",
    municipal: "Municipal",
    distrital: "Distrital",
  };
  return spheres[value] || value;
}

function getRoleLabel(value: string): string {
  const roles: Record<string, string> = {
    auctioneer: "Pregoeiro/Agente de Contratação",
    authority: "Autoridade Superior",
    agency_support: "Equipe de Apoio",
  };
  return roles[value] || value;
}

export default function StepReview({ formData, users, documents }: StepReviewProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-md border p-4">
        <h3 className="mb-4 font-medium">Dados Básicos</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Nome do Órgão</p>
            <p className="text-sm">{formData.agencyName}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">CNPJ</p>
            <p className="text-sm">{formData.cnpj}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Tipo de Órgão</p>
            <p className="text-sm">{getAgencyTypeLabel(formData.agencyType)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Esfera</p>
            <p className="text-sm">{getSphereLabel(formData.sphere)}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-muted-foreground">Endereço</p>
            <p className="text-sm">{formData.address}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">E-mail</p>
            <p className="text-sm">{formData.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Telefone</p>
            <p className="text-sm">{formData.phone}</p>
          </div>
          {formData.website && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Site</p>
              <p className="text-sm">{formData.website}</p>
            </div>
          )}
          {formData.description && (
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Descrição</p>
              <p className="text-sm">{formData.description}</p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-md border p-4">
        <h3 className="mb-4 font-medium">Usuários</h3>
        <div className="space-y-4">
          {users.map((user, index) => (
            <div key={index} className="rounded-md bg-gray-50 p-3">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm">Documento: {user.document}</p>
              <p className="text-sm">E-mail: {user.email}</p>
              <p className="text-sm">Função: {getRoleLabel(user.role)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-md border p-4">
        <h3 className="mb-4 font-medium">Documentos</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-md bg-gray-50 p-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm">
              Ato Normativo: {documents.normativeAct?.name || "Não anexado"}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-gray-50 p-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm">
              Termo de adesão: {documents.termsOfAgreement?.name || "Não anexado"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="terms" required />
        <Label htmlFor="terms" className="text-sm">
          Declaro que todas as informações fornecidas são verdadeiras e que estou ciente
          das responsabilidades legais decorrentes da falsidade das informações prestadas.
        </Label>
      </div>
    </div>
  );
}