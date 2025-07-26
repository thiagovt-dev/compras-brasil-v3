import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";

interface StepDocumentsProps {
  documents: {
    socialContract: File | null;
    powerOfAttorney: File | null;
    personalDocument: File | null;
    termsOfAgreement: File | null;
  };
  setDocuments: (docs: any) => void;
  formData: {
    isStateRegistrationExempt: boolean;
  };
}

export default function StepDocuments({ documents, setDocuments, formData }: StepDocumentsProps) {
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    documentType: keyof typeof documents
  ) => {
    if (e.target.files && e.target.files[0]) {
      setDocuments((prev: any) => ({
        ...prev,
        [documentType]: e.target.files![0],
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="socialContract">
          Contrato Social (última alteração consolidada) <span className="text-red-500">*</span>
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="socialContract"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={e => handleFileChange(e, "socialContract")}
            className="flex-1"
            required
          />
          {documents.socialContract && (
            <span className="text-xs text-green-700 flex items-center gap-1">
              <FileText className="h-4 w-4" /> {documents.socialContract.name}
            </span>
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
            onChange={e => handleFileChange(e, "powerOfAttorney")}
            className="flex-1"
            required={!formData.isStateRegistrationExempt}
          />
          {documents.powerOfAttorney && (
            <span className="text-xs text-green-700 flex items-center gap-1">
              <FileText className="h-4 w-4" /> {documents.powerOfAttorney.name}
            </span>
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
            onChange={e => handleFileChange(e, "personalDocument")}
            className="flex-1"
            required
          />
          {documents.personalDocument && (
            <span className="text-xs text-green-700 flex items-center gap-1">
              <FileText className="h-4 w-4" /> {documents.personalDocument.name}
            </span>
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
            onChange={e => handleFileChange(e, "termsOfAgreement")}
            className="flex-1"
            required
          />
          {documents.termsOfAgreement && (
            <span className="text-xs text-green-700 flex items-center gap-1">
              <FileText className="h-4 w-4" /> {documents.termsOfAgreement.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}