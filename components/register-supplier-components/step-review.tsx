import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StepReviewProps {
  formData: any;
  supplyLines: string[];
  representatives: { name: string; email: string; cpf: string }[];
  documents: {
    socialContract: File | null;
    powerOfAttorney: File | null;
    personalDocument: File | null;
    termsOfAgreement: File | null;
  };
  supplierType: string;
}

import { getSupplyLineLabel } from "@/lib/utils/database-utils";

export default function StepReview({
  formData,
  supplyLines,
  representatives,
  documents,
  supplierType,
}: StepReviewProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div><b>Tipo:</b> {supplierType === "foreign" ? "Fornecedor Estrangeiro" : "Fornecedor Nacional"}</div>
          <div><b>Razão Social:</b> {formData.companyName}</div>
          {supplierType === "national" ? (
            <>
              <div><b>CNPJ:</b> {formData.cnpj}</div>
              <div>
                <b>Inscrição Estadual:</b>{" "}
                {formData.isStateRegistrationExempt ? "ISENTO" : formData.stateRegistration}
              </div>
            </>
          ) : (
            <div><b>Número de Registro:</b> {formData.foreignRegistrationNumber}</div>
          )}
          <div><b>Endereço:</b> {formData.address}</div>
          <div><b>CEP:</b> {formData.cep}</div>
          <div><b>Email:</b> {formData.email}</div>
          <div><b>Telefone:</b> {formData.phone}</div>
          <div><b>Site:</b> {formData.website || "-"}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Linhas de Fornecimento</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5">
            {supplyLines.map((line) => (
              <li key={line}>{getSupplyLineLabel(line)}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Representantes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {representatives.map((rep, idx) => (
              <li key={idx}>
                <b>{rep.name}</b> — {rep.email} — {rep.cpf}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li>
              <b>Contrato Social:</b> {documents.socialContract?.name || <span className="text-red-500">Não enviado</span>}
            </li>
            <li>
              <b>Procuração:</b> {documents.powerOfAttorney?.name || <span className="text-red-500">Não enviado</span>}
            </li>
            <li>
              <b>Documento do Representante:</b> {documents.personalDocument?.name || <span className="text-red-500">Não enviado</span>}
            </li>
            <li>
              <b>Termo de Adesão:</b> {documents.termsOfAgreement?.name || <span className="text-red-500">Não enviado</span>}
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}