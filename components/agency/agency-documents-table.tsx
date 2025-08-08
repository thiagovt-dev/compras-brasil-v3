"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Eye, Calendar } from "lucide-react";

interface AgencyDocument {
  id: string;
  name: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  created_at: string;
  signedUrl?: string;
}

const documentLabels: Record<string, string> = {
  normativeAct: "Ato Normativo",
  termsOfAgreement: "Termo de Adesão",
  organizationChart: "Organograma",
  statute: "Estatuto",
  other: "Outros",
};

export function AgencyDocumentsTable({ documents }: { documents: AgencyDocument[] }) {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "-";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileTypeColor = (fileType?: string) => {
    if (!fileType) return "bg-gray-100 text-gray-800";
    if (fileType.includes("pdf")) return "bg-red-100 text-red-800";
    if (fileType.includes("doc")) return "bg-blue-100 text-blue-800";
    if (fileType.includes("image")) return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documentos ({documents.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length > 0 ? (
          <div className="rounded-md border">
            <div className="grid grid-cols-12 border-b bg-gray-50 px-4 py-3 text-sm font-medium">
              <div className="col-span-3">Documento</div>
              <div className="col-span-2">Tipo</div>
              <div className="col-span-2">Tamanho</div>
              <div className="col-span-3">Data de Upload</div>
              <div className="col-span-2 text-right">Ações</div>
            </div>
            <div className="divide-y">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="grid grid-cols-12 items-center px-4 py-3 hover:bg-gray-50/50"
                >
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {documentLabels[doc.name] || doc.name}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Badge
                      variant="outline"
                      className={getFileTypeColor(doc.file_type)}
                    >
                      {doc.file_type?.split("/").pop()?.toUpperCase() || "N/A"}
                    </Badge>
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {formatFileSize(doc.file_size)}
                  </div>
                  <div className="col-span-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(doc.created_at)}
                    </div>
                  </div>
                  <div className="col-span-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {doc.signedUrl && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(doc.signedUrl, "_blank")}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = doc.signedUrl!;
                              link.download = `${documentLabels[doc.name] || doc.name}`;
                              link.click();
                            }}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Baixar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum documento</h3>
            <p>Este órgão ainda não possui documentos anexados.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}