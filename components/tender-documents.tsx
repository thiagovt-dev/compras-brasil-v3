import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText } from "lucide-react";

interface TenderDocumentsProps {
  tender: any;
}

export function TenderDocuments({ tender }: TenderDocumentsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos da Licitação</CardTitle>
      </CardHeader>
      <CardContent>
        {tender.documents && tender.documents.length > 0 ? (
          <div className="space-y-2">
            {tender.documents.map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-[1rem] text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${doc.file_path}`}
                    target="_blank"
                    rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Baixar
                  </a>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhum documento disponível.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
