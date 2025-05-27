"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, Check, Clock, FileText, Loader2, Upload, X } from "lucide-react"
import { FileUploadField } from "@/components/file-upload-field"
import { useAuth } from "@/lib/supabase/auth-context"

const documentSchema = z.object({
  name: z.string().min(1, "Nome do documento é obrigatório"),
  description: z.string().optional(),
  file: z.any().optional(),
})

type DocumentFormValues = z.infer<typeof documentSchema>

export default function DocumentsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { user, profile } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("required")
  const [documents, setDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      name: "",
      description: "",
    },
    mode: "onChange",
  })

  // Fetch documents from Supabase
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from("documents")
          .select("*")
          .eq("entity_type", "supplier")
          .eq("uploaded_by", user.id)
          .order("created_at", { ascending: false })

        if (error) throw error

        setDocuments(data || [])
      } catch (error: any) {
        console.error("Error fetching documents:", error)
        toast({
          title: "Erro ao carregar documentos",
          description: error.message || "Ocorreu um erro ao carregar seus documentos.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocuments()
  }, [supabase, user])

  async function onSubmit(data: DocumentFormValues) {
    try {
      setIsUploading(true)
      setError(null)
      setUploadProgress(0)

      if (!user) {
        router.push("/login")
        return
      }

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval)
            return prev
          }
          return prev + 5
        })
      }, 200)

      // Insert document metadata into Supabase
      const { data: documentData, error: documentError } = await supabase
        .from("documents")
        .insert({
          name: data.name,
          description: data.description || null,
          entity_type: "supplier",
          uploaded_by: user.id,
          status: "pending",
        })
        .select()
        .single()

      if (documentError) throw documentError

      clearInterval(interval)
      setUploadProgress(100)

      // Reset form
      form.reset()

      // Update documents list
      setDocuments((prev) => [documentData, ...prev])

      toast({
        title: "Documento enviado",
        description: "Seu documento foi enviado com sucesso e está em análise.",
      })

      // Switch to pending tab
      setTimeout(() => {
        setActiveTab("pending")
      }, 500)
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Erro ao enviar documento",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 500)
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500">
            <Check className="mr-1 h-3 w-3" /> Aprovado
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-500">
            <Clock className="mr-1 h-3 w-3" /> Em análise
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-500">
            <X className="mr-1 h-3 w-3" /> Rejeitado
          </Badge>
        )
      case "expired":
        return (
          <Badge className="bg-gray-500">
            <AlertCircle className="mr-1 h-3 w-3" /> Expirado
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const requiredDocuments = [
    "Certidão Negativa de Débitos Federais",
    "Certidão Negativa de Débitos Estaduais",
    "Certidão Negativa de Débitos Municipais",
    "Certidão de Regularidade do FGTS",
    "Contrato Social ou Estatuto",
    "Balanço Patrimonial",
    "Atestado de Capacidade Técnica",
  ]

  const pendingDocuments = documents.filter((doc) => doc.status === "pending")
  const approvedDocuments = documents.filter((doc) => doc.status === "approved")
  const rejectedDocuments = documents.filter((doc) => doc.status === "rejected")
  const expiredDocuments = documents.filter((doc) => doc.status === "expired")

  const handleFileUploadComplete = (fileData: any) => {
    console.log("File uploaded:", fileData)
    // You can update the form or state with the file data if needed
  }

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
          <p className="text-muted-foreground">Gerencie seus documentos para participação em licitações</p>
        </div>

        <Separator />

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>Visão geral dos seus documentos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Aprovados</span>
                  <Badge variant="outline" className="bg-green-500/10">
                    {approvedDocuments.length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Em análise</span>
                  <Badge variant="outline" className="bg-yellow-500/10">
                    {pendingDocuments.length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Rejeitados</span>
                  <Badge variant="outline" className="bg-red-500/10">
                    {rejectedDocuments.length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Expirados</span>
                  <Badge variant="outline" className="bg-gray-500/10">
                    {expiredDocuments.length}
                  </Badge>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Progresso</span>
                    <span className="text-sm text-muted-foreground">
                      {approvedDocuments.length}/{requiredDocuments.length}
                    </span>
                  </div>
                  <Progress value={(approvedDocuments.length / requiredDocuments.length) * 100} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Enviar novo documento</CardTitle>
                <CardDescription>Envie um novo documento para análise</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Documento</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Certidão Negativa de Débitos Federais" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição (opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Descrição do documento" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FileUploadField
                      label="Arquivo"
                      folder="supplier-documents"
                      entityType="supplier"
                      entityId={user?.id}
                      onUploadComplete={handleFileUploadComplete}
                      required
                    />

                    {isUploading && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Enviando...</span>
                          <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} />
                      </div>
                    )}

                    <Button type="submit" disabled={isUploading}>
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Enviar documento
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Meus documentos</CardTitle>
                <CardDescription>Visualize e gerencie seus documentos</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="required" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="required">Obrigatórios</TabsTrigger>
                    <TabsTrigger value="pending">Em análise</TabsTrigger>
                    <TabsTrigger value="approved">Aprovados</TabsTrigger>
                    <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
                    <TabsTrigger value="expired">Expirados</TabsTrigger>
                  </TabsList>

                  <TabsContent value="required" className="space-y-4">
                    {requiredDocuments.map((doc, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-md">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <span>{doc}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            form.setValue("name", doc)
                            setActiveTab("pending")
                          }}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Enviar
                        </Button>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="pending" className="space-y-4">
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : pendingDocuments.length > 0 ? (
                      pendingDocuments.map((doc) => (
                        <div key={doc.id} className="flex justify-between items-center p-3 border rounded-md">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <span>{doc.name}</span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Enviado em {formatDate(doc.created_at)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">{getStatusBadge(doc.status)}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">Nenhum documento em análise.</div>
                    )}
                  </TabsContent>

                  <TabsContent value="approved" className="space-y-4">
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : approvedDocuments.length > 0 ? (
                      approvedDocuments.map((doc) => (
                        <div key={doc.id} className="flex justify-between items-center p-3 border rounded-md">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <span>{doc.name}</span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Aprovado em {formatDate(doc.updated_at)}
                              {doc.expires_at && ` • Válido até ${formatDate(doc.expires_at)}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">{getStatusBadge(doc.status)}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">Nenhum documento aprovado.</div>
                    )}
                  </TabsContent>

                  <TabsContent value="rejected" className="space-y-4">
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : rejectedDocuments.length > 0 ? (
                      rejectedDocuments.map((doc) => (
                        <div key={doc.id} className="flex justify-between items-center p-3 border rounded-md">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <span>{doc.name}</span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Rejeitado em {formatDate(doc.updated_at)}
                            </div>
                            {doc.rejection_reason && (
                              <div className="text-sm text-red-500 mt-1">Motivo: {doc.rejection_reason}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(doc.status)}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                form.setValue("name", doc.name)
                                form.setValue("description", doc.description || "")
                              }}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Reenviar
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">Nenhum documento rejeitado.</div>
                    )}
                  </TabsContent>

                  <TabsContent value="expired" className="space-y-4">
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : expiredDocuments.length > 0 ? (
                      expiredDocuments.map((doc) => (
                        <div key={doc.id} className="flex justify-between items-center p-3 border rounded-md">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <span>{doc.name}</span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Expirado em {formatDate(doc.expires_at || doc.updated_at)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(doc.status)}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                form.setValue("name", doc.name)
                                form.setValue("description", doc.description || "")
                              }}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Renovar
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">Nenhum documento expirado.</div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
