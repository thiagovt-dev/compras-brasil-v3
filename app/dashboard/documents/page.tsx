"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { FileText, Upload, Trash2, Download, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { formatFileSize } from "@/lib/utils"

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [documentType, setDocumentType] = useState("all")
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Carregar documentos do usuário
  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true)

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/login")
          return
        }

        const query = supabase
          .from("documents")
          .select("*")
          .eq("uploaded_by", user.id)
          .order("created_at", { ascending: false })

        const { data, error } = await query

        if (error) throw error

        setDocuments(data || [])
      } catch (error) {
        console.error("Erro ao buscar documentos:", error)
        toast({
          title: "Erro ao carregar documentos",
          description: "Não foi possível carregar seus documentos. Tente novamente.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDocuments()
  }, [supabase, router, toast])

  // Filtrar documentos
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = documentType === "all" || doc.entity_type === documentType

    return matchesSearch && matchesType
  })

  // Fazer upload de documento
  const uploadDocument = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo para fazer upload.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // Gerar nome único para o arquivo
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `documents/${user.id}/${fileName}`

      // Fazer upload do arquivo para o storage
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file)

      if (uploadError) throw uploadError

      // Obter URL pública do arquivo
      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath)

      // Salvar informações do documento no banco de dados
      const { error: dbError } = await supabase.from("documents").insert({
        name: file.name,
        description: description,
        file_path: publicUrl,
        file_type: fileExt,
        file_size: file.size,
        entity_type: "user",
        uploaded_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (dbError) throw dbError

      // Atualizar lista de documentos
      const { data: newDocuments, error } = await supabase
        .from("documents")
        .select("*")
        .eq("uploaded_by", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setDocuments(newDocuments || [])

      toast({
        title: "Documento enviado com sucesso",
        description: "Seu documento foi enviado e está disponível para uso.",
      })

      // Limpar formulário
      setFile(null)
      setDescription("")
      setDialogOpen(false)
    } catch (error) {
      console.error("Erro ao fazer upload do documento:", error)
      toast({
        title: "Erro ao enviar documento",
        description: "Ocorreu um erro ao enviar seu documento. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  // Excluir documento
  const deleteDocument = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este documento?")) {
      return
    }

    try {
      const { error } = await supabase.from("documents").delete().eq("id", id)

      if (error) throw error

      // Atualizar lista de documentos
      setDocuments(documents.filter((doc) => doc.id !== id))

      toast({
        title: "Documento excluído",
        description: "O documento foi excluído com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao excluir documento:", error)
      toast({
        title: "Erro ao excluir documento",
        description: "Ocorreu um erro ao excluir o documento. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Meus Documentos</h2>
          <p className="text-muted-foreground">Gerencie seus documentos e arquivos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Enviar Documento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Novo Documento</DialogTitle>
              <DialogDescription>
                Faça upload de um documento para usar em suas propostas ou processos.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={uploadDocument} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">Arquivo</Label>
                <Input id="file" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o conteúdo deste documento"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Enviar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar documentos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64">
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os documentos</SelectItem>
              <SelectItem value="user">Documentos pessoais</SelectItem>
              <SelectItem value="tender">Documentos de licitação</SelectItem>
              <SelectItem value="proposal">Documentos de proposta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredDocuments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium truncate" title={doc.name}>
                  {doc.name}
                </CardTitle>
                <CardDescription>{new Date(doc.created_at).toLocaleDateString("pt-BR")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <FileText className="mr-2 h-4 w-4" />
                  <span>{doc.file_type?.toUpperCase()}</span>
                  {doc.file_size && <span className="ml-2">({formatFileSize(doc.file_size)})</span>}
                </div>
                {doc.description && <p className="text-sm text-muted-foreground line-clamp-2">{doc.description}</p>}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" asChild>
                  <a href={doc.file_path} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Baixar
                  </a>
                </Button>
                <Button variant="outline" size="sm" onClick={() => deleteDocument(doc.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">
              {searchTerm || documentType !== "all"
                ? "Nenhum documento encontrado com os filtros aplicados."
                : 'Você ainda não possui documentos. Clique em "Enviar Documento" para começar.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
