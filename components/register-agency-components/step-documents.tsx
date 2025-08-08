"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, AlertCircle } from "lucide-react";

interface Documents {
  normativeAct: File | null;
  termsOfAgreement: File | null;
}

interface StepDocumentsProps {
  documents: Documents;
  setDocuments: (documents: Documents) => void;
}

export default function StepDocuments({ documents, setDocuments }: StepDocumentsProps) {
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    documentType: keyof Documents
  ) => {
    if (e.target.files && e.target.files[0]) {
      setDocuments({ ...documents, [documentType]: e.target.files[0] });
    }
  };

  return (
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
            <div className="flex items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-sm text-green-800">
              <CheckCircle className="h-3 w-3" />
              <span>Anexado</span>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
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
            <div className="flex items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-sm text-green-800">
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
  );
}