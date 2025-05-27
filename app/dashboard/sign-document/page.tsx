"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { FileText, CheckCircle, Shield, Loader2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

export default function SignDocumentPage() {
  const [certificates, setCertificates] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [selectedCertificate, setSelectedCertificate] = useState<string>("")
  const [selectedDocument, setSelectedDocument] = useState<string>("")
  const [password, setPassword] = useState("")
  const [reason, setReason] = useState("")
  const [location, setLocation] = useState("")
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  const [signedDocuments, setSignedDocuments] = useState<any[]>([])
  const [progress, setProgress] = useState(0)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Carregar certificados e documentos do usuário
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/login")
          return
        }

        // Buscar certificados ativos
        const { data: certificatesData, error: certificatesError } = await supabase
          .from("digital_certificates")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })

        if (certificatesError) throw certificatesError

        // Filtrar certificados expirados
        const activeCertificates = certificatesData?.filter((cert) => new Date(cert.valid_to) > new Date()) || []

        setCertificates(activeCertificates)

        // Buscar documentos
        const { data: documentsData, error: documentsError } = await supabase
          .from("documents")
          .select("*")
          .eq("uploaded_by", user.id)
          .order("created_at", { ascending: false })

        if (documentsError) throw documentsError

        setDocuments(documentsData || [])

        // Buscar documentos assinados
        const { data: signedDocsData, error: signedDocsError } = await supabase
          .from("signed_documents")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (signedDocsError) throw signedDocsError

        setSignedDocuments(signedDocsData || [])
      } catch (error) {
        console.error("Erro ao buscar dados:", error)
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar seus certificados e documentos. Tente novamente.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, router, toast])

  // Assinar documento
  const signDocument = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCertificate) {
      toast({
        title: "Certificado não selecionado",
        description: "Por favor, selecione um certificado para assinar o documento.",
        variant: "destructive",
      })
      return
    }

    if (!selectedDocument) {
      toast({
        title: "Documento não selecionado",
        description: "Por favor, selecione um documento para assinar.",
        variant: "destructive",
      })
      return
    }

    if (!password) {
      toast({
        title: "Senha não fornecida",
        description: "Por favor, digite a senha do certificado.",
        variant: "destructive",
      })
      return
    }

    setSigning(true)
    setProgress(0)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 5
        })
      }, 200)

      // Buscar informações do documento e certificado
      const { data: documentData, error: documentError } = await supabase
        .from("documents")
        .select("*")
        .eq("id", selectedDocument)
        .single()

      if (documentError) throw documentError

      const { data: certificateData, error: certificateError } = await supabase
        .from("digital_certificates")
        .select("*")
        .eq("id", selectedCertificate)
        .single()

      if (certificateError) throw certificateError

      // Simular assinatura do documento
      // Em um ambiente de produção, você enviaria o documento e o certificado para um serviço de assinatura
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Gerar nome para o documento assinado
      const originalName = documentData.name
      const fileExt = originalName.split(".").pop()
      const baseName = originalName.replace(`.${fileExt}`, "")
      const signedName = `${baseName}_assinado.${fileExt}`
      const signedPath = `signed_documents/${user.id}/${Date.now()}_${signedName}`

      // Em um ambiente real, você faria upload do documento assinado
      // Aqui estamos apenas simulando
      const { data: publicUrlData } = supabase.storage.from("documents").getPublicUrl(documentData.file_path)

      // Salvar informações do documento assinado
      const { data: signedDoc, error: signedError } = await supabase
        .from("signed_documents")
        .insert({
          user_id: user.id,
          document_id: documentData.id,
          certificate_id: certificateData.id,
          original_name: documentData.name,
          signed_name: signedName,
          file_path: signedPath,
          file_url: publicUrlData.publicUrl, // Em produção, seria a URL do documento assinado
          reason: reason || "Assinatura digital",
          location: location || "Brasil",
          signature_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (signedError) throw signedError

      // Atualizar lista de documentos assinados
      setSignedDocuments([signedDoc, ...signedDocuments])

      clearInterval(progressInterval)
      setProgress(100)

      toast({
        title: "Documento assinado com sucesso",
        description: "O documento foi assinado digitalmente e está disponível para download.",
      })

      // Limpar formulário
      setSelectedDocument("")
      setPassword("")
      setReason("")
      setLocation("")
    } catch (error: any) {
      console.error("Erro ao assinar documento:", error)
      toast({
        title: "Erro ao assinar documento",
        description: error.message || "Ocorreu um erro ao assinar o documento. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setSigning(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Assinatura Digital</h2>
        <p className="text-muted-foreground">Assine documentos digitalmente usando seus certificados</p>
      </div>

      <Tabs defaultValue="sign">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sign">Assinar Documento</TabsTrigger>
          <TabsTrigger value="history">Histórico de Assinaturas</TabsTrigger>
        </TabsList>

        <TabsContent value="sign" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : certificates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-center text-muted-foreground mb-4">Você não possui certificados digitais ativos.</p>
                <Button onClick={() => router.push("/dashboard/certificates")}>Gerenciar Certificados</Button>
              </CardContent>
            </Card>
          ) : documents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-center text-muted-foreground mb-4">Você não possui documentos para assinar.</p>
                <Button onClick={() => router.push("/dashboard/documents")}>Gerenciar Documentos</Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Assinar Documento</CardTitle>
                <CardDescription>Selecione um certificado e um documento para assinar digitalmente</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={signDocument} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="certificate">Certificado Digital</Label>
                    <Select value={selectedCertificate} onValueChange={setSelectedCertificate} required>
                      <SelectTrigger id="certificate">
                        <SelectValue placeholder="Selecione um certificado" />
                      </SelectTrigger>
                      <SelectContent>
                        {certificates.map((cert) => (
                          <SelectItem key={cert.id} value={cert.id}>
                            {cert.subject_name} ({new Date(cert.valid_to).toLocaleDateString("pt-BR")})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="document">Documento</Label>
                    <Select value={selectedDocument} onValueChange={setSelectedDocument} required>
                      <SelectTrigger id="document">
                        <SelectValue placeholder="Selecione um documento" />
                      </SelectTrigger>
                      <SelectContent>
                        {documents.map((doc) => (
                          <SelectItem key={doc.id} value={doc.id}>
                            {doc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha do Certificado</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Digite a senha do certificado"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Motivo da Assinatura (opcional)</Label>
                    <Input
                      id="reason"
                      placeholder="Ex: Aprovação, Concordância, etc."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Localização (opcional)</Label>
                    <Input
                      id="location"
                      placeholder="Ex: São Paulo, Brasil"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>

                  {signing && (
                    <div className="space-y-2">
                      <Label>Progresso da Assinatura</Label>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={signing}>
                    {signing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Assinando...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Assinar Documento
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : signedDocuments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-center text-muted-foreground">Você ainda não assinou nenhum documento.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {signedDocuments.map((doc) => (
                <Card key={doc.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium truncate" title={doc.signed_name}>
                      {doc.signed_name}
                    </CardTitle>
                    <CardDescription>
                      {new Date(doc.signature_date).toLocaleDateString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                      <span>Assinado digitalmente</span>
                    </div>
                    {doc.reason && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Motivo: </span>
                        <span>{doc.reason}</span>
                      </div>
                    )}
                    {doc.location && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Local: </span>
                        <span>{doc.location}</span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Baixar Documento Assinado
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
