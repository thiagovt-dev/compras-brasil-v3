"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/supabase/auth-context";
import StepBasicData from "./step-basic-data";
import StepUsers from "./step-users";
import StepDocuments from "./step-documents";
import StepReview from "./step-review";
import { uploadFileToSupabaseStorage } from "@/lib/actions/uploadAction";
import { registerAgency } from "@/lib/actions/agencyAction";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCepLookup } from "@/hooks/use-cep-lookup";
import { StepProgress } from "../step-progress";

function getInitialFormState() {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("register-agency-form");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          formData: parsed.formData || {
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
          },
          users: parsed.users || [
            { name: "", email: "", cpf: "", document: "", role: "auctioneer" },
            { name: "", email: "", cpf: "", document: "", role: "authority" },
            { name: "", email: "", cpf: "", document: "", role: "agency_support" },
          ],
          currentStep: parsed.currentStep || 1,
        };
      } catch {}
    }
  }
  return {
    formData: {
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
    },
    users: [
      { name: "", email: "", cpf: "", document: "", role: "auctioneer" },
      { name: "", email: "", cpf: "", document: "", role: "authority" },
      { name: "", email: "", cpf: "", document: "", role: "agency_support" },
    ],
    currentStep: 1,
  };
}

export default function RegisterAgencyForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { data: cepData, fetchCep } = useCepLookup();

  // Inicialização do estado lendo do localStorage
  const [formData, setFormData] = useState(getInitialFormState().formData);
  const [users, setUsers] = useState(getInitialFormState().users);
  const [currentStep, setCurrentStep] = useState(getInitialFormState().currentStep);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documents, setDocuments] = useState<{
    normativeAct: File | null;
    termsOfAgreement: File | null;
  }>({
    normativeAct: null,
    termsOfAgreement: null,
  });

  useEffect(() => {
    if (cepData && cepData.logradouro) {
    setFormData((prev: FormData) => ({
      ...prev,
      address: `${cepData.logradouro}${cepData.bairro ? ", " + cepData.bairro : ""}${
        cepData.localidade ? " - " + cepData.localidade : ""
      }${cepData.uf ? "/" + cepData.uf : ""}`,
    }));
    }
  }, [cepData]);

  useEffect(() => {
    localStorage.setItem(
      "register-agency-form",
      JSON.stringify({
        formData,
        users,
        currentStep,
      })
    );
  }, [formData, users, currentStep]);

  const steps = [
    { id: 1, name: "Dados Básicos" },
    { id: 2, name: "Usuários" },
    { id: 3, name: "Documentos" },
    { id: 4, name: "Revisão" },
  ];

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
        const hasAuctioneer = users.some((user: any) => user.role === "auctioneer");
        const hasAuthority = users.some((user: any) => user.role === "authority");
        const hasSupport = users.some((user: any) => user.role === "agency_support");

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
          if (!user.name || !user.email || !user.document || !user.role) {
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    try {
      // Upload documentos
      const uploadedDocs: {
        name: string;
        file_path: string;
        file_type?: string;
        file_size?: number;
      }[] = [];

      for (const [key, file] of Object.entries(documents)) {
        if (file) {
          const ext = file.name.split(".").pop();
          const path = `agencies/${user?.id}/${Date.now()}-${key}.${ext}`;
          const arrayBuffer = await file.arrayBuffer();
          const { filePath } = await uploadFileToSupabaseStorage(arrayBuffer, path, file.type);
          uploadedDocs.push({
            name: key,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
          });
        }
      }

      if (!user?.id) {
        throw new Error("Usuário não autenticado. Faça login para continuar.");
      }

      // Determinar se deve atualizar o perfil do usuário atual
      const shouldUpdateProfile = profile?.profile_type === "citizen";

      const result = await registerAgency({
        agencyData: {
          name: formData.agencyName,
          cnpj: formData.cnpj,
          agency_type: formData.agencyType,
          sphere: formData.sphere,
          address: formData.address,
          email: formData.email,
          phone: formData.phone,
          website: formData.website || undefined,
          description: formData.description || undefined,
        },
        users: users.map((user: any) => ({
          name: user.name,
          email: user.email,
          cpf: user.document,
          document: user.document,
          role: user.role as "auctioneer" | "authority" | "agency_support",
        })),
        documents: uploadedDocs,
        updateCurrentUserProfile: shouldUpdateProfile,
      });

      if (!result.success) {
        toast({
          title: "Erro ao registrar órgão",
          description: result.error || "Ocorreu um erro ao registrar o órgão. Verifique os dados e tente novamente.",
          variant: "destructive",
        });
        throw new Error("Erro ao registrar órgão");
      }

      const { successful, failed } = result?.data?.userResults || { successful: [], failed: [] };
      const userProfileUpdated = result?.data?.userProfileUpdated;

      // Mostrar toast de sucesso
      if (failed.length === 0) {
        if (userProfileUpdated) {
          toast({
            title: "Cadastro enviado com sucesso! 🎉",
            description: `Órgão cadastrado e ${successful.length} usuários criados. SEU PERFIL FOI ATUALIZADO PARA ÓRGÃO! Você precisa sair e entrar novamente para acessar o painel do órgão.`,
            duration: 8000,
          });
        } else {
          toast({
            title: "Cadastro enviado com sucesso",
            description: `Órgão cadastrado e ${successful.length} usuários criados. O cadastro foi enviado para análise.`,
          });
        }
      } else {
        if (userProfileUpdated) {
          toast({
            title: "Cadastro parcialmente concluído",
            description: `Órgão cadastrado com ${successful.length} usuários. ${failed.length} usuários falharam. SEU PERFIL FOI ATUALIZADO! Saia e entre novamente para ver o painel do órgão.`,
            variant: "destructive",
            duration: 8000,
          });
        } else {
          toast({
            title: "Cadastro parcialmente concluído",
            description: `Órgão cadastrado com ${successful.length} usuários. ${failed.length} usuários falharam na criação.`,
            variant: "destructive",
          });
        }
      }

      localStorage.removeItem("register-agency-form");

      // Se o profile foi atualizado, redirecionar para logout
      if (userProfileUpdated) {
        setTimeout(() => {
          toast({
            title: "Redirecionando para logout...",
            description: "Você será deslogado automaticamente para aplicar as mudanças.",
          });
          setTimeout(() => {
            window.location.href = "/login?message=profile-updated";
          }, 3000);
        }, 2000);
      } else {
        // Redirect normal to dashboard
        router.push("/dashboard/citizen");
      }
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
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}>
            {currentStep === 1 && (
              <StepBasicData
                formData={formData}
                setFormData={setFormData}
                fetchCep={fetchCep}
              />
            )}

            {currentStep === 2 && (
              <StepUsers users={users} setUsers={setUsers} />
            )}

            {currentStep === 3 && (
              <StepDocuments documents={documents} setDocuments={setDocuments} />
            )}

            {currentStep === 4 && (
              <StepReview formData={formData} users={users} documents={documents} />
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