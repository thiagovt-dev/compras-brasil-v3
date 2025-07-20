import { Suspense } from "react";
import { notFound } from "next/navigation";
import { fetchTenderDocuments } from "@/lib/actions/tenderAction";
import Link from "next/link";
import { FileText, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFileSize, formatDate } from "@/lib/utils";

interface TenderDocumentsPageProps {
  params: Promise<{ id: string }>;
}

export default async function TenderDocumentsPage({ params }: TenderDocumentsPageProps) {
  const resolvedParams = await params;
  const tenderId = resolvedParams.id;

  if (!tenderId || !/^[0-9a-fA-F-]+$/.test(tenderId)) {
    return notFound();
  }

  const documentsResult = await fetchTenderDocuments(tenderId);
  const documents = documentsResult.success ? documentsResult.data : [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Documentos da Licitação</h2>
        </div>
        <Link href={`/dashboard/citizen/search/${tenderId}`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Licitação
          </Button>
        </Link>
      </div>

      {!documentsResult.success ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">
              Erro ao carregar documentos: {documentsResult.error}
            </p>
          </CardContent>
        </Card>
      ) : documents && documents.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc: any) => (
            <Card key={doc.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">{doc.name}</CardTitle>
                <CardDescription>
                  {formatDate(doc.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>{doc.file_type?.toUpperCase() || 'DOC'}</span>
                    {doc.file_size && (
                      <span className="ml-2">({formatFileSize(doc.file_size)})</span>
                    )}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={doc.file_path} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Baixar
                    </a>
                  </Button>
                </div>
                {doc.profiles?.name && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Enviado por {doc.profiles.name}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">
              Nenhum documento disponível para esta licitação.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}