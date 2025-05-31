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
import { Textarea } from "@/components/ui/textarea";
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
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth-context";
import {
  Landmark,
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

export default function RegisterAgencyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const supabase = createClientSupabaseClient();

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
  const [documents, setDocuments] = useState<{
    normativeAct: File | null;
    termsOfAgreement: File | null;
  }>({
    normativeAct: null,
    termsOfAgreement: null,
  });
  const [formData, setFormData] = useState({
    cep: "",
    agencyName: "",
    cnpj: "",
    agencyType: "",
    sphere: "",
    address: "",
    email: "",
    phone: "",
    website: "",
    description: "",
  });
  const [users, setUsers] = useState<
    {
      name: string;
      email: string;
      cpf: string;
      role: "auctioneer" | "authority" | "support";
    }[]
  >([
    { name: "", email: "", cpf: "", role: "auctioneer" },
    { name: "", email: "", cpf: "", role: "authority" },
    { name: "", email: "", cpf: "", role: "support" },
  ]);

  const steps = [
    { id: 1, name: "Dados Básicos" },
    { id: 2, name: "Usuários" },
    { id: 3, name: "Documentos" },
    { id: 4, name: "Revisão" },
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

  const handleUserChange = (index: number, field: string, value: string) => {
    const updatedUsers = [...users];
    if (field === "cpf") {
      updatedUsers[index] = { ...updatedUsers[index], [field]: formatCPF(value) };
    } else {
      updatedUsers[index] = { ...updatedUsers[index], [field]: value };
    }
    setUsers(updatedUsers);
  };

  const addUser = () => {
    setUsers([...users, { name: "", email: "", cpf: "", role: "support" }]);
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
        if (
          !formData.agencyName ||
          !formData.cnpj ||
          !formData.agencyType ||
          !formData.sphere ||
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
        return true;
      case 2:
        // Check if we have at least one of each role
        const hasAuctioneer = users.some((user) => user.role === "auctioneer");
        const hasAuthority = users.some((user) => user.role === "authority");
        const hasSupport = users.some((user) => user.role === "support");

        if (!hasAuctioneer || !hasAuthority || !hasSupport) {
          toast({
            title: "Usuários obrigatórios",
            description:
              "É necessário ter pelo menos um pregoeiro, uma autoridade superior e um membro da equipe de apoio.",
            variant: "destructive",
          });
          return false;
        }

        // Check if all users have complete information
        for (const user of users) {
          if (!user.name || !user.email || !user.cpf || !user.role) {
            toast({
              title: "Dados incompletos",
              description: "Por favor, preencha todos os dados dos usuários.",
              variant: "destructive",
            });
            return false;
          }
        }
        return true;
      case 3:
        if (!documents.normativeAct || !documents.termsOfAgreement) {
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
      // and create an agency registration request in the database

      // Example of uploading a file to Supabase Storage
      // const { data: fileData, error: fileError } = await supabase.storage
      //   .from('agency-documents')
      //   .upload(`${user?.id}/normative-act.pdf`, documents.normativeAct);

      // Example of creating an agency registration request
      const { data, error } = await supabase.from("agencies").insert({
        name: formData.agencyName,
        cnpj: formData.cnpj,
        agency_type: formData.agencyType,
        sphere: formData.sphere,
        address: formData.address,
        email: formData.email,
        phone: formData.phone,
        website: formData.website || null,
        status: "pending",
      });
      console.log("Agency registration data:", data);
      if (error) throw error;

      toast({
        title: "Cadastro enviado com sucesso",
        description:
          "Seu cadastro foi enviado para análise. Você receberá uma notificação quando for aprovado ou se forem necessárias correções.",
      });

      // Redirect to dashboard
      router.push("/dashboard/citizen");
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
        <h1 className="text-3xl font-bold tracking-tight">Cadastrar Órgão Público</h1>
        <p className="text-muted-foreground">
          Preencha o formulário abaixo para cadastrar um órgão público no sistema Licitações Brasil.
        </p>
      </div>

      <StepProgress steps={steps.map((step) => step.name)} currentStep={currentStep} />
      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 1 && "Dados Básicos do Órgão Público"}
            {currentStep === 2 && "Usuários do Órgão"}
            {currentStep === 3 && "Documentação"}
            {currentStep === 4 && "Revisão e Envio"}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && "Informe os dados básicos do órgão público"}
            {currentStep === 2 && "Cadastre os usuários iniciais do órgão"}
            {currentStep === 3 && "Anexe os documentos necessários para o cadastro"}
            {currentStep === 4 && "Revise os dados e envie o cadastro para análise"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {currentStep === 1 && (
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
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="rounded-md bg-blue-50 p-4 text-[1rem] text-blue-800">
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
                        <Label htmlFor={`cpf-${index}`}>
                          CPF <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`cpf-${index}`}
                          placeholder="000.000.000-00"
                          value={user.cpf}
                          onChange={(e) => handleUserChange(index, "cpf", e.target.value)}
                          maxLength={14}
                          required
                        />
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
                              value as "auctioneer" | "authority" | "support"
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
                            <SelectItem value="support">Equipe de Apoio</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={addUser} className="w-full">
                  Adicionar Usuário
                </Button>

                <div className="rounded-md bg-blue-50 p-4 text-[1rem] text-blue-800">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p>
                        Os usuários devem estar previamente cadastrados no sistema. Caso não
                        estejam, um convite será enviado para o e-mail informado.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="normativeAct">
                    Ato Normativo <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="normativeAct"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange(e, "normativeAct")}
                      className="flex-1"
                      required
                    />
                    {documents.normativeAct && (
                      <div className="flex items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-[1rem] text-green-800">
                        <CheckCircle className="h-3 w-3" />
                        <span>Anexado</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[1rem] text-muted-foreground">
                    Anexe o ato normativo de criação do órgão ou documento equivalente.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="termsOfAgreement">
                    Termo de adesão assinado <span className="text-red-500">*</span>
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
                      <div className="flex items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-[1rem] text-green-800">
                        <CheckCircle className="h-3 w-3" />
                        <span>Anexado</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-md bg-blue-50 p-4 text-[1rem] text-blue-800">
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

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="rounded-md border p-4">
                  <h3 className="mb-4 font-medium">Dados Básicos</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-[1rem] font-medium text-muted-foreground">Nome do Órgão</p>
                      <p className="text-[1rem]">{formData.agencyName}</p>
                    </div>
                    <div>
                      <p className="text-[1rem] font-medium text-muted-foreground">CNPJ</p>
                      <p className="text-[1rem]">{formData.cnpj}</p>
                    </div>
                    <div>
                      <p className="text-[1rem] font-medium text-muted-foreground">Tipo de Órgão</p>
                      <p className="text-[1rem]">{getAgencyTypeLabel(formData.agencyType)}</p>
                    </div>
                    <div>
                      <p className="text-[1rem] font-medium text-muted-foreground">Esfera</p>
                      <p className="text-[1rem]">{getSphereLabel(formData.sphere)}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-[1rem] font-medium text-muted-foreground">Endereço</p>
                      <p className="text-[1rem]">{formData.address}</p>
                    </div>
                    <div>
                      <p className="text-[1rem] font-medium text-muted-foreground">E-mail</p>
                      <p className="text-[1rem]">{formData.email}</p>
                    </div>
                    <div>
                      <p className="text-[1rem] font-medium text-muted-foreground">Telefone</p>
                      <p className="text-[1rem]">{formData.phone}</p>
                    </div>
                    {formData.website && (
                      <div>
                        <p className="text-[1rem] font-medium text-muted-foreground">Site</p>
                        <p className="text-[1rem]">{formData.website}</p>
                      </div>
                    )}
                    {formData.description && (
                      <div className="md:col-span-2">
                        <p className="text-[1rem] font-medium text-muted-foreground">Descrição</p>
                        <p className="text-[1rem]">{formData.description}</p>
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
                        <p className="text-[1rem]">CPF: {user.cpf}</p>
                        <p className="text-[1rem]">E-mail: {user.email}</p>
                        <p className="text-[1rem]">Função: {getRoleLabel(user.role)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border p-4">
                  <h3 className="mb-4 font-medium">Documentos</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 rounded-md bg-gray-50 p-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-[1rem]">
                        Ato Normativo: {documents.normativeAct?.name || "Não anexado"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 rounded-md bg-gray-50 p-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-[1rem]">
                        Termo de adesão: {documents.termsOfAgreement?.name || "Não anexado"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" required />
                  <Label htmlFor="terms" className="text-[1rem]">
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

          {currentStep < 4 ? (
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

// Helper functions to get labels
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
    support: "Equipe de Apoio",
  };

  return roles[value] || value;
}
