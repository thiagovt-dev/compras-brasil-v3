"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepProgress } from "@/components/step-progress";
import { useToast } from "@/hooks/use-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/lib/supabase/auth-context";
import {
  Building2,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useCepLookup } from "@/hooks/use-cep-lookup";

export default function RegisterSupplierPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const supabase = createClientComponentClient();

  const { data: cepData, loading: cepLoading, error: cepError, fetchCep } = useCepLookup();

  useEffect(() => {
    if (cepData && cepData.logradouro) {
      setFormData((prev) => ({
        ...prev,
        address: `${cepData.logradouro}${cepData.bairro ? ", " + cepData.bairro : ""}${
          cepData.localidade ? " - " + cepData.localidade : ""
        }${cepData.uf ? "/" + cepData.uf : ""}`,
      }));
    }
  }, [cepData]);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supplierType, setSupplierType] = useState("national");
  const [supplyLines, setSupplyLines] = useState<string[]>([]);
  const [representatives, setRepresentatives] = useState<
    { name: string; email: string; cpf: string }[]
  >([{ name: "", email: "", cpf: "" }]);
  const [documents, setDocuments] = useState<{
    socialContract: File | null;
    powerOfAttorney: File | null;
    personalDocument: File | null;
    termsOfAgreement: File | null;
  }>({
    socialContract: null,
    powerOfAttorney: null,
    personalDocument: null,
    termsOfAgreement: null,
  });
  const [formData, setFormData] = useState({
    cep: "",
    companyName: "",
    cnpj: "",
    stateRegistration: "",
    isStateRegistrationExempt: false,
    address: "",
    email: "",
    phone: "",
    website: "",
    foreignRegistrationNumber: "",
  });

  const steps = [
    { id: 1, name: "Dados Básicos" },
    { id: 2, name: "Linhas de Fornecimento" },
    { id: 3, name: "Representantes" },
    { id: 4, name: "Documentos" },
    { id: 5, name: "Revisão" },
  ];

  // Format functions
  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
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

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  const handleSupplyLineChange = (value: string) => {
    if (!supplyLines.includes(value)) {
      setSupplyLines([...supplyLines, value]);
    }
  };

  const removeSupplyLine = (index: number) => {
    setSupplyLines(supplyLines.filter((_, i) => i !== index));
  };

  const handleRepresentativeChange = (index: number, field: string, value: string) => {
    const updatedRepresentatives = [...representatives];
    if (field === "cpf") {
      updatedRepresentatives[index] = {
        ...updatedRepresentatives[index],
        [field]: formatCPF(value),
      };
    } else {
      updatedRepresentatives[index] = { ...updatedRepresentatives[index], [field]: value };
    }
    setRepresentatives(updatedRepresentatives);
  };

  const addRepresentative = () => {
    setRepresentatives([...representatives, { name: "", email: "", cpf: "" }]);
  };

  const removeRepresentative = (index: number) => {
    if (representatives.length > 1) {
      setRepresentatives(representatives.filter((_, i) => i !== index));
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    documentType: keyof typeof documents
  ) => {
    if (e.target.files && e.target.files[0]) {
      setDocuments({ ...documents, [documentType]: e.target.files[0] });
    }
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        if (supplierType === "national") {
          if (
            !formData.companyName ||
            !formData.cnpj ||
            !formData.address ||
            !formData.email ||
            !formData.phone
          ) {
            toast({
              title: "Campos obrigatórios",
              description: "Por favor, preencha todos os campos obrigatórios.",
              variant: "destructive",
            });
            return false;
          }
        } else {
          if (
            !formData.companyName ||
            !formData.foreignRegistrationNumber ||
            !formData.address ||
            !formData.email ||
            !formData.phone
          ) {
            toast({
              title: "Campos obrigatórios",
              description: "Por favor, preencha todos os campos obrigatórios.",
              variant: "destructive",
            });
            return false;
          }
        }
        return true;
      case 2:
        if (supplyLines.length === 0) {
          toast({
            title: "Linhas de fornecimento",
            description: "Por favor, selecione pelo menos uma linha de fornecimento.",
            variant: "destructive",
          });
          return false;
        }
        return true;
      case 3:
        for (const rep of representatives) {
          if (!rep.name || !rep.email || !rep.cpf) {
            toast({
              title: "Representantes",
              description: "Por favor, preencha todos os dados dos representantes.",
              variant: "destructive",
            });
            return false;
          }
        }
        return true;
      case 4:
        if (
          !documents.socialContract ||
          !documents.personalDocument ||
          !documents.termsOfAgreement ||
          (!formData.isStateRegistrationExempt && !documents.powerOfAttorney)
        ) {
          toast({
            title: "Documentos obrigatórios",
            description: "Por favor, anexe todos os documentos obrigatórios.",
            variant: "destructive",
          });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // In a real app, we would upload the documents to storage
      // and create a supplier registration request in the database

      // Example of uploading a file to Supabase Storage
      // const { data: fileData, error: fileError } = await supabase.storage
      //   .from('supplier-documents')
      //   .upload(`${user?.id}/social-contract.pdf`, documents.socialContract);

      // Example of creating a supplier registration request
      const { data, error } = await supabase.from("suppliers").insert({
        name: formData.companyName,
        cnpj: formData.cnpj,
        state_registration: formData.isStateRegistrationExempt
          ? "ISENTO"
          : formData.stateRegistration,
        address: formData.address,
        email: formData.email,
        phone: formData.phone,
        website: formData.website || null,
        is_foreign: supplierType === "foreign",
        foreign_registration_number: formData.foreignRegistrationNumber || null,
        supply_lines: supplyLines,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Cadastro enviado com sucesso",
        description:
          "Seu cadastro foi enviado para análise. Você receberá uma notificação quando for aprovado ou se forem necessárias correções.",
      });

      router.push("/dashboard/citizen");
      // Redirect to dashboard
      
    } catch (error: any) {
      toast({
        title: "Erro ao enviar cadastro",
        description: error.message || "Ocorreu um erro ao processar seu cadastro",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cadastrar Fornecedor</h1>
        <p className="text-muted-foreground">
          Preencha o formulário abaixo para cadastrar um fornecedor no sistema Licitações Brasil.
        </p>
      </div>

      <StepProgress steps={steps.map((step) => step.name)} currentStep={currentStep} />
      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 1 && "Dados Básicos do Fornecedor"}
            {currentStep === 2 && "Linhas de Fornecimento"}
            {currentStep === 3 && "Representantes Legais"}
            {currentStep === 4 && "Documentação"}
            {currentStep === 5 && "Revisão e Envio"}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && "Informe os dados básicos do fornecedor"}
            {currentStep === 2 && "Selecione as linhas de fornecimento da empresa"}
            {currentStep === 3 && "Cadastre os representantes legais da empresa"}
            {currentStep === 4 && "Anexe os documentos necessários para o cadastro"}
            {currentStep === 5 && "Revise os dados e envie o cadastro para análise"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {currentStep === 1 && (
              <div className="space-y-6">
                <Tabs defaultValue="national" onValueChange={(value) => setSupplierType(value)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="national">Fornecedor Nacional</TabsTrigger>
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
                        <Label htmlFor="stateRegistration">Inscrição Estadual</Label>
                        <Input
                          id="stateRegistration"
                          name="stateRegistration"
                          placeholder="Inscrição Estadual"
                          value={formData.stateRegistration}
                          onChange={handleChange}
                          disabled={formData.isStateRegistrationExempt}
                        />
                      </div>
                      <div className="flex items-end space-x-2">
                        <div className="flex items-center space-x-2 pt-6">
                          <Checkbox
                            id="isStateRegistrationExempt"
                            name="isStateRegistrationExempt"
                            checked={formData.isStateRegistrationExempt}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                isStateRegistrationExempt: checked as boolean,
                                stateRegistration: checked ? "" : formData.stateRegistration,
                              })
                            }
                          />
                          <Label htmlFor="isStateRegistrationExempt">
                            Isento de Inscrição Estadual
                          </Label>
                        </div>
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
                            onChange={handleChange}
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
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

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
                      onChange={(e) => {
                        const cep = e.target.value
                          .replace(/\D/g, "")
                          .replace(/^(\d{5})(\d)/, "$1-$2");
                        setFormData({ ...formData, cep });
                        if (cep.length === 9) fetchCep(cep);
                      }}
                      maxLength={9}
                      className="w-1/4"
                      required
                    />
                    <div className="relative  w-3/4">
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
                        placeholder="email@empresa.com"
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
                      placeholder="www.empresa.com"
                      value={formData.website}
                      onChange={handleChange}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="supplyLine">
                    Linhas de Fornecimento <span className="text-red-500">*</span>
                  </Label>
                  <Select onValueChange={handleSupplyLineChange}>
                    <SelectTrigger id="supplyLine">
                      <SelectValue placeholder="Selecione uma linha de fornecimento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="informatica">Equipamentos de Informática</SelectItem>
                      <SelectItem value="moveis">Móveis e Utensílios</SelectItem>
                      <SelectItem value="material_escritorio">Material de Escritório</SelectItem>
                      <SelectItem value="limpeza">Produtos de Limpeza</SelectItem>
                      <SelectItem value="construcao">Material de Construção</SelectItem>
                      <SelectItem value="alimentos">Alimentos e Bebidas</SelectItem>
                      <SelectItem value="medicamentos">Medicamentos</SelectItem>
                      <SelectItem value="servicos_ti">Serviços de TI</SelectItem>
                      <SelectItem value="servicos_limpeza">Serviços de Limpeza</SelectItem>
                      <SelectItem value="servicos_manutencao">Serviços de Manutenção</SelectItem>
                      <SelectItem value="servicos_consultoria">Serviços de Consultoria</SelectItem>
                      <SelectItem value="servicos_engenharia">Serviços de Engenharia</SelectItem>
                      <SelectItem value="veiculos">Veículos</SelectItem>
                      <SelectItem value="combustiveis">Combustíveis</SelectItem>
                      <SelectItem value="equipamentos_medicos">Equipamentos Médicos</SelectItem>
                      <SelectItem value="uniformes">Uniformes e EPIs</SelectItem>
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
                          className="flex items-center justify-between rounded-md border p-3">
                          <span className="text-sm">{getSupplyLineLabel(line)}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSupplyLine(index)}
                            className="h-8 w-8 p-0 text-red-500">
                            <span className="sr-only">Remover</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round">
                              <path d="M18 6 6 18" />
                              <path d="m6 6 12 12" />
                            </svg>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed p-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        Nenhuma linha de fornecimento selecionada. Selecione pelo menos uma linha de
                        fornecimento.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 3 && (
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
                            placeholder="Nome do representante"
                            value={rep.name}
                            onChange={(e) =>
                              handleRepresentativeChange(index, "name", e.target.value)
                            }
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`cpf-${index}`}>
                          CPF <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`cpf-${index}`}
                          placeholder="000.000.000-00"
                          value={rep.cpf}
                          onChange={(e) => handleRepresentativeChange(index, "cpf", e.target.value)}
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
                          onChange={(e) =>
                            handleRepresentativeChange(index, "email", e.target.value)
                          }
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addRepresentative}
                  className="w-full">
                  Adicionar Representante
                </Button>

                <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p>
                        Os representantes devem estar previamente cadastrados no sistema. Caso não
                        estejam, um convite será enviado para o e-mail informado.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="socialContract">
                    Contrato Social (última alteração consolidada){" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="socialContract"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange(e, "socialContract")}
                      className="flex-1"
                      required
                    />
                    {documents.socialContract && (
                      <div className="flex items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-xs text-green-800">
                        <CheckCircle className="h-3 w-3" />
                        <span>Anexado</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="powerOfAttorney">
                    Procuração (se o usuário não for administrador da empresa)
                    {!formData.isStateRegistrationExempt && <span className="text-red-500">*</span>}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="powerOfAttorney"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange(e, "powerOfAttorney")}
                      className="flex-1"
                      required={!formData.isStateRegistrationExempt}
                    />
                    {documents.powerOfAttorney && (
                      <div className="flex items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-xs text-green-800">
                        <CheckCircle className="h-3 w-3" />
                        <span>Anexado</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="personalDocument">
                    Documento pessoal do representante <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="personalDocument"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(e, "personalDocument")}
                      className="flex-1"
                      required
                    />
                    {documents.personalDocument && (
                      <div className="flex items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-xs text-green-800">
                        <CheckCircle className="h-3 w-3" />
                        <span>Anexado</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="termsOfAgreement">
                    Termo de adesão assinado pela empresa <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="termsOfAgreement"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, "termsOfAgreement")}
                      className="flex-1"
                      required
                    />
                    {documents.termsOfAgreement && (
                      <div className="flex items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-xs text-green-800">
                        <CheckCircle className="h-3 w-3" />
                        <span>Anexado</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p>
                        Após o preenchimento e anexar esses documentos, o cadastro será enviado para
                        análise. Uma vez não aprovado, o cadastro volta para o usuário com as
                        observações para correção e reenvio até que seja aprovado.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="rounded-md border p-4">
                  <h3 className="mb-4 font-medium">Dados Básicos</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Tipo de Fornecedor
                      </p>
                      <p className="text-sm">
                        {supplierType === "national" ? "Nacional" : "Estrangeiro"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Razão Social</p>
                      <p className="text-sm">{formData.companyName}</p>
                    </div>
                    {supplierType === "national" ? (
                      <>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">CNPJ</p>
                          <p className="text-sm">{formData.cnpj}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Inscrição Estadual
                          </p>
                          <p className="text-sm">
                            {formData.isStateRegistrationExempt
                              ? "ISENTO"
                              : formData.stateRegistration}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Número de Registro
                        </p>
                        <p className="text-sm">{formData.foreignRegistrationNumber}</p>
                      </div>
                    )}
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
                  </div>
                </div>

                <div className="rounded-md border p-4">
                  <h3 className="mb-4 font-medium">Linhas de Fornecimento</h3>
                  <div className="space-y-2">
                    {supplyLines.map((line, index) => (
                      <div key={index} className="rounded-md bg-gray-50 p-2 text-sm">
                        {getSupplyLineLabel(line)}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border p-4">
                  <h3 className="mb-4 font-medium">Representantes</h3>
                  <div className="space-y-4">
                    {representatives.map((rep, index) => (
                      <div key={index} className="rounded-md bg-gray-50 p-3">
                        <p className="font-medium">{rep.name}</p>
                        <p className="text-sm">CPF: {rep.cpf}</p>
                        <p className="text-sm">E-mail: {rep.email}</p>
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
                        Contrato Social: {documents.socialContract?.name || "Não anexado"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 rounded-md bg-gray-50 p-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm">
                        Procuração: {documents.powerOfAttorney?.name || "Não anexado"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 rounded-md bg-gray-50 p-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm">
                        Documento pessoal: {documents.personalDocument?.name || "Não anexado"}
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
            )}
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          {currentStep > 1 ? (
            <Button type="button" variant="outline" onClick={prevStep}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/citizen")}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          )}

          {currentStep < 5 ? (
            <Button type="button" onClick={nextStep}>
              Próximo
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Enviar Cadastro"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

// Helper function to get the label for a supply line
function getSupplyLineLabel(value: string): string {
  const supplyLines: Record<string, string> = {
    informatica: "Equipamentos de Informática",
    moveis: "Móveis e Utensílios",
    material_escritorio: "Material de Escritório",
    limpeza: "Produtos de Limpeza",
    construcao: "Material de Construção",
    alimentos: "Alimentos e Bebidas",
    medicamentos: "Medicamentos",
    servicos_ti: "Serviços de TI",
    servicos_limpeza: "Serviços de Limpeza",
    servicos_manutencao: "Serviços de Manutenção",
    servicos_consultoria: "Serviços de Consultoria",
    servicos_engenharia: "Serviços de Engenharia",
    veiculos: "Veículos",
    combustiveis: "Combustíveis",
    equipamentos_medicos: "Equipamentos Médicos",
    uniformes: "Uniformes e EPIs",
  };

  return supplyLines[value] || value;
}
