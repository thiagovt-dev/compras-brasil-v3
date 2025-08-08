"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Landmark,
  Mail,
  Phone,
  MapPin,
  Globe,
} from "lucide-react";

interface FormData {
  cep: string;
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

interface StepBasicDataProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  fetchCep: (cep: string) => void;
}

export default function StepBasicData({ formData, setFormData, fetchCep }: StepBasicDataProps) {
  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === "cnpj") {
      setFormData({ ...formData, [name]: formatCNPJ(value) });
    } else if (name === "phone") {
      setFormData({ ...formData, [name]: formatPhone(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="agencyName">
            Nome do Órgão <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Landmark className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="agencyName"
              name="agencyName"
              placeholder="Nome do Órgão Público"
              value={formData.agencyName}
              onChange={handleChange}
              className="pl-10"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cnpj">
            CNPJ <span className="text-red-500">*</span>
          </Label>
          <Input
            id="cnpj"
            name="cnpj"
            placeholder="00.000.000/0000-00"
            value={formData.cnpj}
            onChange={handleChange}
            maxLength={18}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="agencyType">
            Tipo de Órgão <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.agencyType}
            onValueChange={(value) => setFormData({ ...formData, agencyType: value })}>
            <SelectTrigger id="agencyType">
              <SelectValue placeholder="Selecione o tipo de órgão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ministerio">Ministério</SelectItem>
              <SelectItem value="secretaria">Secretaria</SelectItem>
              <SelectItem value="autarquia">Autarquia</SelectItem>
              <SelectItem value="fundacao">Fundação</SelectItem>
              <SelectItem value="empresa_publica">Empresa Pública</SelectItem>
              <SelectItem value="sociedade_economia_mista">
                Sociedade de Economia Mista
              </SelectItem>
              <SelectItem value="agencia_reguladora">Agência Reguladora</SelectItem>
              <SelectItem value="tribunal">Tribunal</SelectItem>
              <SelectItem value="prefeitura">Prefeitura</SelectItem>
              <SelectItem value="camara_municipal">Câmara Municipal</SelectItem>
              <SelectItem value="assembleia_legislativa">
                Assembleia Legislativa
              </SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sphere">
            Esfera <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.sphere}
            onValueChange={(value) => setFormData({ ...formData, sphere: value })}>
            <SelectTrigger id="sphere">
              <SelectValue placeholder="Selecione a esfera" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="federal">Federal</SelectItem>
              <SelectItem value="estadual">Estadual</SelectItem>
              <SelectItem value="municipal">Municipal</SelectItem>
              <SelectItem value="distrital">Distrital</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">
          Endereço <span className="text-red-500">*</span>
        </Label>
        <div className="flex gap-4 w-full">
          <Input
            id="cep"
            name="cep"
            placeholder="00000-000"
            value={formData.cep}
            className="w-1/4"
            onChange={(e) => {
              const cep = e.target.value
                .replace(/\D/g, "")
                .replace(/^(\d{5})(\d)/, "$1-$2");
              setFormData({ ...formData, cep });
              if (cep.length === 9) fetchCep(cep);
            }}
            maxLength={9}
            required
          />
          <div className="relative w-3/4">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="address"
              name="address"
              placeholder="Endereço completo"
              value={formData.address}
              onChange={handleChange}
              className="pl-10"
              required
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">
            E-mail <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="email@orgao.gov.br"
              value={formData.email}
              onChange={handleChange}
              className="pl-10"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">
            Telefone <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="phone"
              name="phone"
              placeholder="(00) 00000-0000"
              value={formData.phone}
              onChange={handleChange}
              className="pl-10"
              maxLength={15}
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Site (Opcional)</Label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="website"
            name="website"
            placeholder="www.orgao.gov.br"
            value={formData.website}
            onChange={handleChange}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição (Opcional)</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Breve descrição sobre o órgão"
          value={formData.description}
          onChange={handleChange}
          rows={4}
        />
      </div>
    </div>
  );
}