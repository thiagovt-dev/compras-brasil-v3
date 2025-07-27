"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Download } from "lucide-react";

export function SupplierDocumentsTable({ documents }: { documents: SupplierDocument[] }) {
    const documentNameMap: Record<string, string> = {
      socialContract: "Contrato Social",
      powerOfAttorney: "Procuração",
      personalDocument: "Documento Pessoal",
      termsOfAgreement: "Termo de Adesão",
    };
  if (!documents || documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Nenhum documento enviado.</div>
        </CardContent>
      </Card>
    );
  }

  const formatSize = (size?: number) =>
    size ? `${(size / 1024).toFixed(1)} KB` : "-";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos Enviados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left">Nome</th>
                <th className="px-4 py-2 text-left">Tipo</th>
                <th className="px-4 py-2 text-left">Tamanho</th>
                <th className="px-4 py-2 text-left">Enviado em</th>
                <th className="px-4 py-2 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{documentNameMap[doc.name] || doc.name}</td>
                  <td className="px-4 py-2">{doc.file_type || "-"}</td>
                  <td className="px-4 py-2">{formatSize(doc.file_size)}</td>
                  <td className="px-4 py-2">
                    {doc.created_at ? new Date(doc.created_at).toLocaleDateString("pt-BR") : "-"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <a
                      href={doc.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                      <Download size={16} />
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}