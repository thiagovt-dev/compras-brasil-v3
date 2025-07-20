"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileText, Eye, Download } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatFileSize } from "@/lib/utils";

interface TenderDocumentsProps {
  documents: TenderDocument[];
  hasDocumentError: boolean;
}

export default function TenderDocuments({ documents, hasDocumentError }: TenderDocumentsProps) {
  const handleDocumentView = (document: any) => {
    if (document.file_path) {
      window.open(document.file_path, '_blank');
    } else {
      toast.error("Documento não disponível para visualização");
    }
  };

  const handleDocumentDownload = (document: any) => {
    if (document.file_path) {
      const link = document.createElement('a');
      link.href = document.file_path;
      link.download = document.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.error("Documento não disponível para download");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos da Licitação</CardTitle>
      </CardHeader>
      <CardContent>
        {hasDocumentError ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-700">
                Erro ao carregar documentos. Tente recarregar a página.
              </p>
            </div>
          </div>
        ) : documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">{doc.name}</h4>
                    <p className="text-sm text-gray-600">
                      {doc.file_size && formatFileSize(doc.file_size)} •
                      {doc.file_type && `${doc.file_type.toUpperCase()} • `}
                      Enviado em {formatDate(doc.created_at)}
                      {doc.profiles?.name && ` por ${doc.profiles.name}`}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleDocumentView(doc)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDocumentDownload(doc)}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum documento disponível
            </h3>
            <p className="text-gray-600">
              Esta licitação ainda não possui documentos públicos.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}