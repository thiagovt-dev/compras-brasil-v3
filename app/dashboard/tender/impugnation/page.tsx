"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, Clock, FileText } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function ImpugnationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tenderId = searchParams.get("id")
  const supabase = createClientComponentClient()

  const [tender, setTender] = useState<any>(null)
  const [impugnations, setImpugnations] = useState<any[]>([])
  const [clarifications, setClarifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [newImpugnation, setNewImpugnation] = useState("")
  const [newClarification, setNewClarification] = useState("")
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!tenderId) {
      router.push("/dashboard/search")
      return
    }

    async function fetchData() {
      setLoading(true)

      // Get user role
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

        if (profile) {
          setUserRole(profile.role)
        }
      }

      // Get tender details
      const { data: tenderData, error: tenderError } = await supabase
        .from("tenders")
        .select("*")
        .eq("id", tenderId)
        .single()

      if (tenderError) {
        console.error("Error fetching tender:", tenderError)
        setError("Erro ao carregar dados da licitação")
      } else {
        setTender(tenderData)
      }

      // Get impugnations
      const { data: impugnationsData, error: impugnationsError } = await supabase
        .from("impugnations")
        .select(`
          *,
          profiles:user_id(name, role)
        `)
        .eq("tender_id", tenderId)
        .order("created_at", { ascending: false })

      if (impugnationsError) {
        console.error("Error fetching impugnations:", impugnationsError)
      } else {
        setImpugnations(impugnationsData || [])
      }

      // Get clarifications
      const { data: clarificationsData, error: clarificationsError } = await supabase
        .from("clarifications")
        .select(`
          *,
          profiles:user_id(name, role)
        `)
        .eq("tender_id", tenderId)
        .order("created_at", { ascending: false })

      if (clarificationsError) {
        console.error("Error fetching clarifications:", clarificationsError)
      } else {
        setClarifications(clarificationsData || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [tenderId, router, supabase])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachmentFile(e.target.files[0])
    }
  }

  const submitImpugnation = async () => {
    if (!newImpugnation.trim()) {
      setError("Por favor, preencha o texto da impugnação")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Usuário não autenticado")
        setSubmitting(false)
        return
      }

      let attachmentUrl = null

      // Upload attachment if exists
      if (attachmentFile) {
        const fileExt = attachmentFile.name.split(".").pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
        const filePath = `impugnations/${fileName}`

        const { error: uploadError } = await supabase.storage.from("attachments").upload(filePath, attachmentFile)

        if (uploadError) {
          console.error("Error uploading file:", uploadError)
          setError("Erro ao fazer upload do arquivo")
          setSubmitting(false)
          return
        }

        const { data: urlData } = supabase.storage.from("attachments").getPublicUrl(filePath)

        attachmentUrl = urlData.publicUrl
      }

      // Insert impugnation
      const { error: insertError } = await supabase.from("impugnations").insert({
        tender_id: tenderId,
        user_id: user.id,
        content: newImpugnation,
        attachment_url: attachmentUrl,
        status: "pending",
      })

      if (insertError) {
        console.error("Error submitting impugnation:", insertError)
        setError("Erro ao enviar impugnação")
        setSubmitting(false)
        return
      }

      // Refresh impugnations
      const { data: impugnationsData } = await supabase
        .from("impugnations")
        .select(`
          *,
          profiles:user_id(name, role)
        `)
        .eq("tender_id", tenderId)
        .order("created_at", { ascending: false })

      setImpugnations(impugnationsData || [])
      setNewImpugnation("")
      setAttachmentFile(null)
      setSuccess("Impugnação enviada com sucesso")

      // Create notification for agency users
      await supabase.from("notifications").insert({
        user_id: tender.agency_id,
        title: "Nova impugnação",
        content: `Uma nova impugnação foi registrada para a licitação ${tender.title}`,
        type: "impugnation",
        reference_id: tenderId,
        read: false,
      })
    } catch (err) {
      console.error("Error:", err)
      setError("Ocorreu um erro ao processar sua solicitação")
    } finally {
      setSubmitting(false)
    }
  }

  const submitClarification = async () => {
    if (!newClarification.trim()) {
      setError("Por favor, preencha o texto do pedido de esclarecimento")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Usuário não autenticado")
        setSubmitting(false)
        return
      }

      let attachmentUrl = null

      // Upload attachment if exists
      if (attachmentFile) {
        const fileExt = attachmentFile.name.split(".").pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
        const filePath = `clarifications/${fileName}`

        const { error: uploadError } = await supabase.storage.from("attachments").upload(filePath, attachmentFile)

        if (uploadError) {
          console.error("Error uploading file:", uploadError)
          setError("Erro ao fazer upload do arquivo")
          setSubmitting(false)
          return
        }

        const { data: urlData } = supabase.storage.from("attachments").getPublicUrl(filePath)

        attachmentUrl = urlData.publicUrl
      }

      // Insert clarification
      const { error: insertError } = await supabase.from("clarifications").insert({
        tender_id: tenderId,
        user_id: user.id,
        content: newClarification,
        attachment_url: attachmentUrl,
        status: "pending",
      })

      if (insertError) {
        console.error("Error submitting clarification:", insertError)
        setError("Erro ao enviar pedido de esclarecimento")
        setSubmitting(false)
        return
      }

      // Refresh clarifications
      const { data: clarificationsData } = await supabase
        .from("clarifications")
        .select(`
          *,
          profiles:user_id(name, role)
        `)
        .eq("tender_id", tenderId)
        .order("created_at", { ascending: false })

      setClarifications(clarificationsData || [])
      setNewClarification("")
      setAttachmentFile(null)
      setSuccess("Pedido de esclarecimento enviado com sucesso")

      // Create notification for agency users
      await supabase.from("notifications").insert({
        user_id: tender.agency_id,
        title: "Novo pedido de esclarecimento",
        content: `Um novo pedido de esclarecimento foi registrado para a licitação ${tender.title}`,
        type: "clarification",
        reference_id: tenderId,
        read: false,
      })
    } catch (err) {
      console.error("Error:", err)
      setError("Ocorreu um erro ao processar sua solicitação")
    } finally {
      setSubmitting(false)
    }
  }

  const respondToImpugnation = async (id: string, response: string) => {
    try {
      const { error } = await supabase
        .from("impugnations")
        .update({
          response,
          response_date: new Date().toISOString(),
          status: "answered",
        })
        .eq("id", id)

      if (error) {
        console.error("Error responding to impugnation:", error)
        setError("Erro ao responder impugnação")
        return
      }

      // Refresh impugnations
      const { data: impugnationsData } = await supabase
        .from("impugnations")
        .select(`
          *,
          profiles:user_id(name, role)
        `)
        .eq("tender_id", tenderId)
        .order("created_at", { ascending: false })

      setImpugnations(impugnationsData || [])
      setSuccess("Resposta enviada com sucesso")

      // Create notification for the impugnation creator
      const impugnation = impugnations.find((imp) => imp.id === id)
      if (impugnation) {
        await supabase.from("notifications").insert({
          user_id: impugnation.user_id,
          title: "Impugnação respondida",
          content: `Sua impugnação para a licitação ${tender?.title} foi respondida`,
          type: "impugnation_response",
          reference_id: tenderId,
          read: false,
        })
      }
    } catch (err) {
      console.error("Error:", err)
      setError("Ocorreu um erro ao processar sua solicitação")
    }
  }

  const respondToClarification = async (id: string, response: string) => {
    try {
      const { error } = await supabase
        .from("clarifications")
        .update({
          response,
          response_date: new Date().toISOString(),
          status: "answered",
        })
        .eq("id", id)

      if (error) {
        console.error("Error responding to clarification:", error)
        setError("Erro ao responder pedido de esclarecimento")
        return
      }

      // Refresh clarifications
      const { data: clarificationsData } = await supabase
        .from("clarifications")
        .select(`
          *,
          profiles:user_id(name, role)
        `)
        .eq("tender_id", tenderId)
        .order("created_at", { ascending: false })

      setClarifications(clarificationsData || [])
      setSuccess("Resposta enviada com sucesso")

      // Create notification for the clarification creator
      const clarification = clarifications.find((clar) => clar.id === id)
      if (clarification) {
        await supabase.from("notifications").insert({
          user_id: clarification.user_id,
          title: "Esclarecimento respondido",
          content: `Seu pedido de esclarecimento para a licitação ${tender?.title} foi respondido`,
          type: "clarification_response",
          reference_id: tenderId,
          read: false,
        })
      }
    } catch (err) {
      console.error("Error:", err)
      setError("Ocorreu um erro ao processar sua solicitação")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!tender) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>Licitação não encontrada ou você não tem permissão para acessá-la.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const canSubmit = ["citizen", "supplier"].includes(userRole || "")
  const canRespond = ["agency", "admin"].includes(userRole || "")
  const isBeforeDeadline = tender.impugnation_deadline ? new Date() < new Date(tender.impugnation_deadline) : false

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Impugnações e Esclarecimentos</h1>
            <p className="text-muted-foreground">
              Licitação: {tender.title} - {tender.number}
            </p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            Voltar
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="my-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">Sucesso</AlertTitle>
            <AlertDescription className="text-green-600">{success}</AlertDescription>
          </Alert>
        )}

        {tender.impugnation_deadline && (
          <Alert className={isBeforeDeadline ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"}>
            <Clock className={`h-4 w-4 ${isBeforeDeadline ? "text-blue-600" : "text-red-600"}`} />
            <AlertTitle className={isBeforeDeadline ? "text-blue-600" : "text-red-600"}>
              {isBeforeDeadline ? "Prazo em andamento" : "Prazo encerrado"}
            </AlertTitle>
            <AlertDescription className={isBeforeDeadline ? "text-blue-600" : "text-red-600"}>
              Data limite para impugnações e esclarecimentos:{" "}
              {format(new Date(tender.impugnation_deadline), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="impugnations">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="impugnations">Impugnações</TabsTrigger>
            <TabsTrigger value="clarifications">Pedidos de Esclarecimento</TabsTrigger>
          </TabsList>

          <TabsContent value="impugnations" className="space-y-4">
            {canSubmit && isBeforeDeadline && (
              <Card>
                <CardHeader>
                  <CardTitle>Nova Impugnação</CardTitle>
                  <CardDescription>
                    Envie uma impugnação para esta licitação. Você pode anexar documentos para fundamentar sua
                    solicitação.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="impugnation">Texto da Impugnação</Label>
                    <Textarea
                      id="impugnation"
                      placeholder="Descreva detalhadamente os motivos da impugnação..."
                      rows={5}
                      value={newImpugnation}
                      onChange={(e) => setNewImpugnation(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="attachment">Anexo (opcional)</Label>
                    <Input id="attachment" type="file" onChange={handleFileChange} />
                    <p className="text-xs text-muted-foreground">
                      Formatos aceitos: PDF, DOC, DOCX, JPG, PNG (máx. 10MB)
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={submitImpugnation} disabled={submitting || !newImpugnation.trim()}>
                    {submitting ? "Enviando..." : "Enviar Impugnação"}
                  </Button>
                </CardFooter>
              </Card>
            )}

            {impugnations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma impugnação registrada para esta licitação.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {impugnations.map((impugnation) => (
                  <Card key={impugnation.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            Impugnação
                            <Badge variant={impugnation.status === "pending" ? "outline" : "default"}>
                              {impugnation.status === "pending" ? "Pendente" : "Respondida"}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            Enviada por {impugnation.profiles?.name || "Usuário"} em{" "}
                            {format(new Date(impugnation.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Conteúdo da Impugnação:</h4>
                        <div className="bg-muted p-3 rounded-md whitespace-pre-wrap">{impugnation.content}</div>
                      </div>

                      {impugnation.attachment_url && (
                        <div>
                          <h4 className="font-medium mb-2">Anexo:</h4>
                          <a
                            href={impugnation.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:underline"
                          >
                            <FileText className="h-4 w-4" />
                            Visualizar anexo
                          </a>
                        </div>
                      )}

                      {impugnation.response && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="font-medium mb-2">Resposta:</h4>
                            <div className="bg-muted p-3 rounded-md whitespace-pre-wrap">{impugnation.response}</div>
                            <p className="text-sm text-muted-foreground mt-2">
                              Respondido em{" "}
                              {format(new Date(impugnation.response_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </>
                      )}

                      {canRespond && impugnation.status === "pending" && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <Label htmlFor={`response-${impugnation.id}`}>Resposta à Impugnação</Label>
                            <Textarea id={`response-${impugnation.id}`} placeholder="Digite sua resposta..." rows={3} />
                            <Button
                              onClick={(e) => {
                                const textarea = document.getElementById(
                                  `response-${impugnation.id}`,
                                ) as HTMLTextAreaElement
                                respondToImpugnation(impugnation.id, textarea.value)
                              }}
                            >
                              Responder
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="clarifications" className="space-y-4">
            {canSubmit && isBeforeDeadline && (
              <Card>
                <CardHeader>
                  <CardTitle>Novo Pedido de Esclarecimento</CardTitle>
                  <CardDescription>
                    Envie um pedido de esclarecimento para esta licitação. Você pode anexar documentos para fundamentar
                    sua solicitação.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clarification">Texto do Pedido de Esclarecimento</Label>
                    <Textarea
                      id="clarification"
                      placeholder="Descreva detalhadamente sua dúvida ou pedido de esclarecimento..."
                      rows={5}
                      value={newClarification}
                      onChange={(e) => setNewClarification(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="attachment-clarification">Anexo (opcional)</Label>
                    <Input id="attachment-clarification" type="file" onChange={handleFileChange} />
                    <p className="text-xs text-muted-foreground">
                      Formatos aceitos: PDF, DOC, DOCX, JPG, PNG (máx. 10MB)
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={submitClarification} disabled={submitting || !newClarification.trim()}>
                    {submitting ? "Enviando..." : "Enviar Pedido de Esclarecimento"}
                  </Button>
                </CardFooter>
              </Card>
            )}

            {clarifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum pedido de esclarecimento registrado para esta licitação.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {clarifications.map((clarification) => (
                  <Card key={clarification.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            Pedido de Esclarecimento
                            <Badge variant={clarification.status === "pending" ? "outline" : "default"}>
                              {clarification.status === "pending" ? "Pendente" : "Respondido"}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            Enviado por {clarification.profiles?.name || "Usuário"} em{" "}
                            {format(new Date(clarification.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Conteúdo do Pedido:</h4>
                        <div className="bg-muted p-3 rounded-md whitespace-pre-wrap">{clarification.content}</div>
                      </div>

                      {clarification.attachment_url && (
                        <div>
                          <h4 className="font-medium mb-2">Anexo:</h4>
                          <a
                            href={clarification.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:underline"
                          >
                            <FileText className="h-4 w-4" />
                            Visualizar anexo
                          </a>
                        </div>
                      )}

                      {clarification.response && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="font-medium mb-2">Resposta:</h4>
                            <div className="bg-muted p-3 rounded-md whitespace-pre-wrap">{clarification.response}</div>
                            <p className="text-sm text-muted-foreground mt-2">
                              Respondido em{" "}
                              {format(new Date(clarification.response_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </>
                      )}

                      {canRespond && clarification.status === "pending" && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <Label htmlFor={`response-${clarification.id}`}>Resposta ao Pedido de Esclarecimento</Label>
                            <Textarea
                              id={`response-${clarification.id}`}
                              placeholder="Digite sua resposta..."
                              rows={3}
                            />
                            <Button
                              onClick={(e) => {
                                const textarea = document.getElementById(
                                  `response-${clarification.id}`,
                                ) as HTMLTextAreaElement
                                respondToClarification(clarification.id, textarea.value)
                              }}
                            >
                              Responder
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
