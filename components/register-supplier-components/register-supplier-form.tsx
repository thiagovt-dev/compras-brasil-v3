"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/supabase/auth-context";
import StepBasicData from "./step-basic-data";
import StepSupplyLines from "./step-supply-lines";
import StepRepresentatives from "./step-supply-representative";
import StepDocuments from "./step-supply-documents";
import StepReview from "./step-review";
import { uploadFileToSupabaseStorage } from "@/lib/actions/uploadAction";
import { registerSupplier } from "@/lib/actions/supplierAction";
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
    const saved = localStorage.getItem("register-supplier-form");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          formData: parsed.formData || {
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
          },
          supplyLines: parsed.supplyLines || [],
          representatives: parsed.representatives || [{ name: "", email: "", cpf: "" }],
          supplierType: parsed.supplierType || "national",
          currentStep: parsed.currentStep || 1,
        };
      } catch {}
    }
  }
  return {
    formData: {
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
    },
    supplyLines: [],
    representatives: [{ name: "", email: "", cpf: "" }],
    supplierType: "national",
    currentStep: 1,
  };
}

export default function RegisterSupplierForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: cepData, fetchCep } = useCepLookup();

  // Inicialização do estado lendo do localStorage
  const [formData, setFormData] = useState(getInitialFormState().formData);
  const [supplyLines, setSupplyLines] = useState<string[]>(getInitialFormState().supplyLines);
  const [representatives, setRepresentatives] = useState<
    { name: string; email: string; cpf: string }[]
  >(getInitialFormState().representatives);
  const [supplierType, setSupplierType] = useState(getInitialFormState().supplierType);
  const [currentStep, setCurrentStep] = useState(getInitialFormState().currentStep);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  useEffect(() => {
    if (cepData && cepData.logradouro) {
      setFormData((prev: any) => ({
        ...prev,
        address: `${cepData.logradouro}${cepData.bairro ? ", " + cepData.bairro : ""}${
          cepData.localidade ? " - " + cepData.localidade : ""
        }${cepData.uf ? "/" + cepData.uf : ""}`,
      }));
    }
  }, [cepData]);

  useEffect(() => {
    localStorage.setItem(
      "register-supplier-form",
      JSON.stringify({
        formData,
        supplyLines,
        representatives,
        supplierType,
        currentStep,
      })
    );
  }, [formData, supplyLines, representatives, supplierType, currentStep]);

  const steps = [
    { id: 1, name: "Dados Básicos" },
    { id: 2, name: "Linhas de Fornecimento" },
    { id: 3, name: "Representantes" },
    { id: 4, name: "Documentos" },
    { id: 5, name: "Revisão" },
  ];

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
      const uploadedDocs: {
        name: string;
        file_path: string;
        file_type?: string;
        file_size?: number;
      }[] = [];
      for (const [key, file] of Object.entries(documents)) {
        if (file) {
          const ext = file.name.split(".").pop();
          const path = `${user?.id}/${Date.now()}-${key}.${ext}`;
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
      const res = await registerSupplier({
        userId: user.id,
        supplierData: {
          name: formData.companyName,
          cnpj: formData.cnpj,
          is_foreign: supplierType === "foreign",
          foreign_registration_number: formData.foreignRegistrationNumber,
          state_registration: formData.isStateRegistrationExempt
            ? "ISENTO"
            : formData.stateRegistration,
          address: formData.address,
          email: formData.email,
          phone: formData.phone,
          website: formData.website || undefined,
        },
        supplyLines,
        representatives,
        documents: uploadedDocs,
      });

      if (!res.success) {
        toast({
          title: "Erro ao registrar fornecedor",
          description: res.error || "Ocorreu um erro ao registrar o fornecedor. Verifique os dados e tente novamente.",
          variant: "destructive",
        });
        throw new Error("Erro ao registrar fornecedor");
      }

      toast({
        title: "Cadastro enviado com sucesso",
        description: "Seu cadastro foi enviado para análise.",
      });
      localStorage.removeItem("register-supplier-form");

      router.push("/dashboard/citizen");
    } catch (error: any) {
      toast({
        title: "Erro ao enviar cadastro",
        description: error.message || "Ocorreu um erro ao processar seu cadastro",
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
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}>
            {currentStep === 1 && (
              <StepBasicData
                formData={formData}
                setFormData={setFormData}
                supplierType={supplierType}
                setSupplierType={setSupplierType}
                fetchCep={fetchCep}
              />
            )}

            {currentStep === 2 && (
              <StepSupplyLines supplyLines={supplyLines} setSupplyLines={setSupplyLines} />
            )}

            {currentStep === 3 && (
              <StepRepresentatives
                representatives={representatives}
                setRepresentatives={setRepresentatives}
              />
            )}

            {currentStep === 4 && (
              <StepDocuments
                documents={documents}
                setDocuments={setDocuments}
                formData={formData}
              />
            )}

            {currentStep === 5 && (
              <StepReview
                formData={formData}
                supplyLines={supplyLines}
                representatives={representatives}
                documents={documents}
                supplierType={supplierType}
              />
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
