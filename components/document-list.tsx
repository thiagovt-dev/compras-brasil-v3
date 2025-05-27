import { FileText } from "lucide-react"

interface Document {
  name: string
  file?: File | null
  document_id?: string
  file_path?: string
}

interface DocumentListProps {
  documents: Document[]
}

export function DocumentList({ documents }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center p-4 border rounded-md border-dashed">
        <p className="text-sm text-muted-foreground">Nenhum documento adicionado</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {documents.map((doc, index) => (
        <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm">{doc.name}</span>
          {doc.file_path && <span className="text-xs text-green-600 ml-auto">Enviado</span>}
        </div>
      ))}
    </div>
  )
}
