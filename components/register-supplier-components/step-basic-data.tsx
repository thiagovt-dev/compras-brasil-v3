import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, MapPin, Mail, Phone, Globe } from "lucide-react";

interface StepBasicDataProps {
  formData: {
    cep: string;
    companyName: string;
    cnpj: string;
    stateRegistration: string;
    isStateRegistrationExempt: boolean;
    address: string;
    email: string;
    phone: string;
    website: string;
    foreignRegistrationNumber: string;
  };
  setFormData: (data: any) => void;
  supplierType: string;
  setSupplierType: (type: string) => void;
  fetchCep?: (cep: string) => void;
}

export default function StepBasicData({
  formData,
  setFormData,
  supplierType,
  setSupplierType,
  fetchCep,
}: StepBasicDataProps) {
  return (
    <Tabs defaultValue={supplierType} onValueChange={setSupplierType}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger className="!py-1" value="national">
          Fornecedor Nacional
        </TabsTrigger>
        <TabsTrigger value="foreign">Fornecedor Estrangeiro</TabsTrigger>
      </TabsList>
      <TabsContent value="national" className="space-y-6 pt-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">
              Razão Social <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="companyName"
                name="companyName"
                placeholder="Razão Social da Empresa"
                value={formData.companyName}
                onChange={e => setFormData((prev: any) => ({ ...prev, companyName: e.target.value }))}
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
              onChange={e => setFormData((prev: any) => ({ ...prev, cnpj: e.target.value }))}
              maxLength={18}
              required
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="stateRegistration">Inscrição Estadual</Label>
            <Input
              id="stateRegistration"
              name="stateRegistration"
              placeholder="Inscrição Estadual"
              value={formData.stateRegistration}
              onChange={e => setFormData((prev: any) => ({ ...prev, stateRegistration: e.target.value }))}
              disabled={formData.isStateRegistrationExempt}
            />
          </div>
          <div className="flex items-end space-x-2">
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="isStateRegistrationExempt"
                name="isStateRegistrationExempt"
                checked={formData.isStateRegistrationExempt}
                onCheckedChange={checked =>
                  setFormData((prev: any) => ({
                    ...prev,
                    isStateRegistrationExempt: checked as boolean,
                    stateRegistration: checked ? "" : prev.stateRegistration,
                  }))
                }
              />
              <Label htmlFor="isStateRegistrationExempt">
                Isento de Inscrição Estadual
              </Label>
            </div>
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
              placeholder="CEP"
              value={formData.cep}
              onChange={e => {
                const cep = e.target.value.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2");
                setFormData((prev: any) => ({ ...prev, cep }));
                if (cep.length === 9 && fetchCep) fetchCep(cep);
              }}
              maxLength={9}
              className="w-1/4"
              required
            />
            <div className="relative w-3/4">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="address"
                name="address"
                placeholder="Endereço completo"
                value={formData.address}
                onChange={e => setFormData((prev: any) => ({ ...prev, address: e.target.value }))}
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
                placeholder="email@empresa.com"
                value={formData.email}
                onChange={e => setFormData((prev: any) => ({ ...prev, email: e.target.value }))}
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
                onChange={e => setFormData((prev: any) => ({ ...prev, phone: e.target.value }))}
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
              placeholder="www.empresa.com"
              value={formData.website}
              onChange={e => setFormData((prev: any) => ({ ...prev, website: e.target.value }))}
              className="pl-10"
            />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="foreign" className="space-y-6 pt-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">
              Razão Social ou Equivalente <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="companyName"
                name="companyName"
                placeholder="Razão Social da Empresa"
                value={formData.companyName}
                onChange={e => setFormData((prev: any) => ({ ...prev, companyName: e.target.value }))}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="foreignRegistrationNumber">
              Número de Registro ou Equivalente <span className="text-red-500">*</span>
            </Label>
            <Input
              id="foreignRegistrationNumber"
              name="foreignRegistrationNumber"
              placeholder="Número de Registro"
              value={formData.foreignRegistrationNumber}
              onChange={e => setFormData((prev: any) => ({ ...prev, foreignRegistrationNumber: e.target.value }))}
              required
            />
          </div>
        </div>
        {/* O restante dos campos (endereço, email, telefone, site) é igual ao nacional */}
        <div className="space-y-2">
          <Label htmlFor="address">
            Endereço <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-4 w-full">
            <Input
              id="cep"
              name="cep"
              placeholder="CEP"
              value={formData.cep}
              onChange={e => {
                const cep = e.target.value.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2");
                setFormData((prev: any) => ({ ...prev, cep }));
                if (cep.length === 9 && fetchCep) fetchCep(cep);
              }}
              maxLength={9}
              className="w-1/4"
              required
            />
            <div className="relative w-3/4">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="address"
                name="address"
                placeholder="Endereço completo"
                value={formData.address}
                onChange={e => setFormData((prev: any) => ({ ...prev, address: e.target.value }))}
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
                placeholder="email@empresa.com"
                value={formData.email}
                onChange={e => setFormData((prev: any) => ({ ...prev, email: e.target.value }))}
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
                onChange={e => setFormData((prev: any) => ({ ...prev, phone: e.target.value }))}
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
              placeholder="www.empresa.com"
              value={formData.website}
              onChange={e => setFormData((prev: any) => ({ ...prev, website: e.target.value }))}
              className="pl-10"
            />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}