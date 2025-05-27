import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import Link from "next/link"
import { notFound } from "next/navigation"
import { FileText, Download, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatFileSize } from "@/lib/utils"

export default async function TenderDocumentsPage({ params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  // Verificar se o ID da licitação é válido
  if (!params.id || !/^[0-9a-fA-F-]+$/.test(params.id)) {
    return notFound()
  }

  // Buscar documentos relacionados à licitação
  const { data: documents, error } = await supabase
    .from("documents")
    .select("*")
    .eq("entity_type", "tender")
    .eq("entity_id", params.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Erro ao buscar documentos:", error)
  }

  // Buscar informações da licitação
  const { data: tender } = await supabase.from("tenders").select("title, reference_number").eq("id", params.id).single()

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Documentos da Licitação</h2>
          {tender && (
            <p className="text-muted-foreground">
              {tender.reference_number} - {tender.title}
            </p>
          )}
        </div>
        <Link href={`/dashboard/citizen/search/${params.id}`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Licitação
          </Button>
        </Link>
      </div>

      {documents && documents.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">{doc.name}</CardTitle>
                <CardDescription>{new Date(doc.created_at).toLocaleDateString("pt-BR")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>{doc.file_type?.toUpperCase()}</span>
                    {doc.file_size && <span className="ml-2">({formatFileSize(doc.file_size)})</span>}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={doc.file_path} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Baixar
                    </a>
                  </Button>
                </div>
                {doc.description && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{doc.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">Nenhum documento disponível para esta licitação.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
