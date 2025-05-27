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
import { AlertCircle, CheckCircle, Clock, FileText, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { format, addBusinessDays, isAfter } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function AppealsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tenderId = searchParams.get("id")
  const lotId = searchParams.get("lot")
  const supabase = createClientComponentClient()

  const [tender, setTender] = useState<any>(null)
  const [lot, setLot] = useState<any>(null)
  const [appeals, setAppeals] = useState<any[]>([])
  const [counterArguments, setCounterArguments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [newAppeal, setNewAppeal] = useState("")
  const [newCounterArgument, setNewCounterArgument] = useState("")
  const [newDecision, setNewDecision] = useState("")
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [appealDeadline, setAppealDeadline] = useState<Date | null>(null)
  const [counterArgumentDeadline, setCounterArgumentDeadline] = useState<Date | null>(null)
  const [selectedAppeal, setSelectedAppeal] = useState<string | null>(null)

  useEffect(() => {
    if (!tenderId || !lotId) {
      router.push("/dashboard/search")
      return
    }

    async function fetchData() {
      setLoading(true)

      // Get user info
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)

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

      // Get lot details
      const { data: lotData, error: lotError } = await supabase.from("tender_lots").select("*").eq("id", lotId).single()

      if (lotError) {
        console.error("Error fetching lot:", lotError)
        setError("Erro ao carregar dados do lote")
      } else {
        setLot(lotData)

        // Calculate deadlines
        if (lotData.appeal_start_date) {
          const appealStart = new Date(lotData.appeal_start_date)
          const appealEnd = addBusinessDays(appealStart, 3)
          setAppealDeadline(appealEnd)

          const counterArgumentEnd = addBusinessDays(appealEnd, 3)
          setCounterArgumentDeadline(counterArgumentEnd)
        }
      }

      // Get appeals
      const { data: appealsData, error: appealsError } = await supabase
        .from("appeals")
        .select(`
          *,
          profiles:user_id(name, role)
        `)
        .eq("lot_id", lotId)
        .order("created_at", { ascending: true })

      if (appealsError) {
        console.error("Error fetching appeals:", appealsError)
      } else {
        setAppeals(appealsData || [])
      }

      // Get counter arguments
      const { data: counterArgumentsData, error: counterArgumentsError } = await supabase
        .from("counter_arguments")
        .select(`
          *,
          profiles:user_id(name, role)
        `)
        .eq("lot_id", lotId)
        .order("created_at", { ascending: true })

      if (counterArgumentsError) {
        console.error("Error fetching counter arguments:", counterArgumentsError)
      } else {
        setCounterArguments(counterArgumentsData || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [tenderId, lotId, router, supabase])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachmentFile(e.target.files[0])
    }
  }

  const submitAppeal = async () => {
    if (!newAppeal.trim()) {
      setError("Por favor, preencha o texto do recurso")
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
        const filePath = `appeals/${fileName}`

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

      // Insert appeal
      const { error: insertError } = await supabase.from("appeals").insert({
        tender_id: tenderId,
        lot_id: lotId,
        user_id: user.id,
        content: newAppeal,
        attachment_url: attachmentUrl,
        status: "pending",
      })

      if (insertError) {
        console.error("Error submitting appeal:", insertError)
        setError("Erro ao enviar recurso")
        setSubmitting(false)
        return
      }

      // Refresh appeals
      const { data: appealsData } = await supabase
        .from("appeals")
        .select(`
          *,
          profiles:user_id(name, role)
        `)
        .eq("lot_id", lotId)
        .order("created_at", { ascending: true })

      setAppeals(appealsData || [])
      setNewAppeal("")
      setAttachmentFile(null)
      setSuccess("Recurso enviado com sucesso")

      // Create notification for agency users
      await supabase.from("notifications").insert({
        user_id: tender.agency_id,
        title: "Novo recurso",
        content: `Um novo recurso foi registrado para o lote ${lot.number} da licitação ${tender.title}`,
        type: "appeal",
        reference_id: lotId,
        read: false,
      })
    } catch (err) {
      console.error("Error:", err)
      setError("Ocorreu um erro ao processar sua solicitação")
    } finally {
      setSubmitting(false)
    }
  }

  const submitCounterArgument = async (appealId: string) => {
    if (!newCounterArgument.trim()) {
      setError("Por favor, preencha o texto da contrarrazão")
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
        const filePath = `counter_arguments/${fileName}`

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

      // Insert counter argument
      const { error: insertError } = await supabase.from("counter_arguments").insert({
        appeal_id: appealId,
        tender_id: tenderId,
        lot_id: lotId,
        user_id: user.id,
        content: newCounterArgument,
        attachment_url: attachmentUrl,
      })

      if (insertError) {
        console.error("Error submitting counter argument:", insertError)
        setError("Erro ao enviar contrarrazão")
        setSubmitting(false)
        return
      }

      // Refresh counter arguments
      const { data: counterArgumentsData } = await supabase
        .from("counter_arguments")
        .select(`
          *,
          profiles:user_id(name, role)
        `)
        .eq("lot_id", lotId)
        .order("created_at", { ascending: true })

      setCounterArguments(counterArgumentsData || [])
      setNewCounterArgument("")
      setAttachmentFile(null)
      setSelectedAppeal(null)
      setSuccess("Contrarrazão enviada com sucesso")

      // Create notification for the appeal creator
      const appeal = appeals.find((a) => a.id === appealId)
      if (appeal) {
        await supabase.from("notifications").insert({
          user_id: appeal.user_id,
          title: "Nova contrarrazão",
          content: `Uma nova contrarrazão foi registrada para o seu recurso no lote ${lot.number} da licitação ${tender.title}`,
          type: "counter_argument",
          reference_id: lotId,
          read: false,
        })
      }
    } catch (err) {
      console.error("Error:", err)
      setError("Ocorreu um erro ao processar sua solicitação")
    } finally {
      setSubmitting(false)
    }
  }

  const submitDecision = async (appealId: string) => {
    if (!newDecision.trim()) {
      setError("Por favor, preencha o texto da decisão")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Update appeal with decision
      const { error: updateError } = await supabase
        .from("appeals")
        .update({
          decision: newDecision,
          decision_date: new Date().toISOString(),
          status: "decided",
        })
        .eq("id", appealId)

      if (updateError) {
        console.error("Error submitting decision:", updateError)
        setError("Erro ao registrar decisão")
        setSubmitting(false)
        return
      }

      // Refresh appeals
      const { data: appealsData } = await supabase
        .from("appeals")
        .select(`
          *,
          profiles:user_id(name, role)
        `)
        .eq("lot_id", lotId)
        .order("created_at", { ascending: true })

      setAppeals(appealsData || [])
      setNewDecision("")
      setSuccess("Decisão registrada com sucesso")

      // Create notification for the appeal creator
      const appeal = appeals.find((a) => a.id === appealId)
      if (appeal) {
        await supabase.from("notifications").insert({
          user_id: appeal.user_id,
          title: "Decisão sobre recurso",
          content: `Seu recurso para o lote ${lot.number} da licitação ${tender.title} foi julgado`,
          type: "appeal_decision",
          reference_id: lotId,
          read: false,
        })
      }

      // Create notification for all suppliers who submitted counter arguments
      const relatedCounterArguments = counterArguments.filter((ca) => ca.appeal_id === appealId)
      for (const ca of relatedCounterArguments) {
        await supabase.from("notifications").insert({
          user_id: ca.user_id,
          title: "Decisão sobre recurso",
          content: `Um recurso para o lote ${lot.number} da licitação ${tender.title} foi julgado`,
          type: "appeal_decision",
          reference_id: lotId,
          read: false,
        })
      }
    } catch (err) {
      console.error("Error:", err)
      setError("Ocorreu um erro ao processar sua solicitação")
    } finally {
      setSubmitting(false)
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

  if (!tender || !lot) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            Licitação ou lote não encontrado ou você não tem permissão para acessá-los.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const isAgency = userRole === "agency"
  const isSupplier = userRole === "supplier"
  const canSubmitAppeal = isSupplier && appealDeadline && !isAfter(new Date(), appealDeadline)
  const canSubmitCounterArgument =
    isSupplier &&
    counterArgumentDeadline &&
    !isAfter(new Date(), counterArgumentDeadline) &&
    isAfter(new Date(), appealDeadline || new Date())
  const canDecide = isAgency && appeals.some((a) => a.status === "pending")

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Recursos e Contrarrazões</h1>
            <p className="text-muted-foreground">
              Licitação: {tender.title} - Lote: {lot.number}
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

        {appealDeadline && (
          <Alert
            className={isAfter(new Date(), appealDeadline) ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}
          >
            <Clock className={`h-4 w-4 ${isAfter(new Date(), appealDeadline) ? "text-red-600" : "text-blue-600"}`} />
            <AlertTitle className={isAfter(new Date(), appealDeadline) ? "text-red-600" : "text-blue-600"}>
              {isAfter(new Date(), appealDeadline) ? "Prazo encerrado" : "Prazo em andamento"}
            </AlertTitle>
            <AlertDescription className={isAfter(new Date(), appealDeadline) ? "text-red-600" : "text-blue-600"}>
              Prazo para recursos: até {format(appealDeadline, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </AlertDescription>
          </Alert>
        )}

        {counterArgumentDeadline && isAfter(new Date(), appealDeadline || new Date()) && (
          <Alert
            className={
              isAfter(new Date(), counterArgumentDeadline) ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
            }
          >
            <Clock
              className={`h-4 w-4 ${isAfter(new Date(), counterArgumentDeadline) ? "text-red-600" : "text-blue-600"}`}
            />
            <AlertTitle className={isAfter(new Date(), counterArgumentDeadline) ? "text-red-600" : "text-blue-600"}>
              {isAfter(new Date(), counterArgumentDeadline) ? "Prazo encerrado" : "Prazo em andamento"}
            </AlertTitle>
            <AlertDescription
              className={isAfter(new Date(), counterArgumentDeadline) ? "text-red-600" : "text-blue-600"}
            >
              Prazo para contrarrazões: até {format(counterArgumentDeadline, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="appeals">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="appeals">Recursos</TabsTrigger>
            <TabsTrigger value="counter_arguments">Contrarrazões</TabsTrigger>
          </TabsList>

          <TabsContent value="appeals" className="space-y-4">
            {canSubmitAppeal && (
              <Card>
                <CardHeader>
                  <CardTitle>Novo Recurso</CardTitle>
                  <CardDescription>
                    Envie um recurso para este lote. Você pode anexar documentos para fundamentar sua solicitação.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="appeal">Texto do Recurso</Label>
                    <Textarea
                      id="appeal"
                      placeholder="Descreva detalhadamente os motivos do recurso..."
                      rows={5}
                      value={newAppeal}
                      onChange={(e) => setNewAppeal(e.target.value)}
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
                  <Button onClick={submitAppeal} disabled={submitting || !newAppeal.trim()}>
                    {submitting ? "Enviando..." : "Enviar Recurso"}
                  </Button>
                </CardFooter>
              </Card>
            )}

            {appeals.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum recurso registrado para este lote.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {appeals.map((appeal) => (
                  <Card key={appeal.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            Recurso
                            <Badge variant={appeal.status === "pending" ? "outline" : "default"}>
                              {appeal.status === "pending" ? "Pendente" : "Decidido"}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            Enviado por {appeal.profiles?.name || "Usuário"} em{" "}
                            {format(new Date(appeal.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </CardDescription>
                        </div>
                        {canSubmitCounterArgument && appeal.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAppeal(selectedAppeal === appeal.id ? null : appeal.id)}
                          >
                            {selectedAppeal === appeal.id ? "Cancelar" : "Responder"}
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Conteúdo do Recurso:</h4>
                        <div className="bg-muted p-3 rounded-md whitespace-pre-wrap">{appeal.content}</div>
                      </div>

                      {appeal.attachment_url && (
                        <div>
                          <h4 className="font-medium mb-2">Anexo:</h4>
                          <a
                            href={appeal.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:underline"
                          >
                            <FileText className="h-4 w-4" />
                            Visualizar anexo
                          </a>
                        </div>
                      )}

                      {selectedAppeal === appeal.id && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <Label htmlFor={`counter-${appeal.id}`}>Contrarrazão</Label>
                            <Textarea
                              id={`counter-${appeal.id}`}
                              placeholder="Digite sua contrarrazão..."
                              rows={3}
                              value={newCounterArgument}
                              onChange={(e) => setNewCounterArgument(e.target.value)}
                            />
                            <div className="space-y-2">
                              <Label htmlFor={`attachment-${appeal.id}`}>Anexo (opcional)</Label>
                              <Input id={`attachment-${appeal.id}`} type="file" onChange={handleFileChange} />
                            </div>
                            <Button
                              onClick={() => submitCounterArgument(appeal.id)}
                              disabled={submitting || !newCounterArgument.trim()}
                            >
                              {submitting ? "Enviando..." : "Enviar Contrarrazão"}
                            </Button>
                          </div>
                        </>
                      )}

                      {appeal.decision && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="font-medium mb-2">Decisão:</h4>
                            <div className="bg-muted p-3 rounded-md whitespace-pre-wrap">{appeal.decision}</div>
                            <p className="text-sm text-muted-foreground mt-2">
                              Decisão em{" "}
                              {format(new Date(appeal.decision_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </>
                      )}

                      {canDecide && appeal.status === "pending" && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <Label htmlFor={`decision-${appeal.id}`}>Decisão do Recurso</Label>
                            <Textarea
                              id={`decision-${appeal.id}`}
                              placeholder="Digite sua decisão..."
                              rows={3}
                              value={newDecision}
                              onChange={(e) => setNewDecision(e.target.value)}
                            />
                            <Button
                              onClick={() => submitDecision(appeal.id)}
                              disabled={submitting || !newDecision.trim()}
                            >
                              Registrar Decisão
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

          <TabsContent value="counter_arguments" className="space-y-4">
            {counterArguments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma contrarrazão registrada para este lote.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {counterArguments.map((counterArgument) => {
                  const relatedAppeal = appeals.find((a) => a.id === counterArgument.appeal_id)

                  return (
                    <Card key={counterArgument.id}>
                      <CardHeader>
                        <CardTitle>Contrarrazão</CardTitle>
                        <CardDescription>
                          Enviada por {counterArgument.profiles?.name || "Usuário"} em{" "}
                          {format(new Date(counterArgument.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {relatedAppeal && (
                          <Alert className="bg-muted border-muted-foreground/20">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Recurso Relacionado</AlertTitle>
                            <AlertDescription className="line-clamp-2">{relatedAppeal.content}</AlertDescription>
                          </Alert>
                        )}

                        <div>
                          <h4 className="font-medium mb-2">Conteúdo da Contrarrazão:</h4>
                          <div className="bg-muted p-3 rounded-md whitespace-pre-wrap">{counterArgument.content}</div>
                        </div>

                        {counterArgument.attachment_url && (
                          <div>
                            <h4 className="font-medium mb-2">Anexo:</h4>
                            <a
                              href={counterArgument.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:underline"
                            >
                              <FileText className="h-4 w-4" />
                              Visualizar anexo
                            </a>
                          </div>
                        )}

                        {relatedAppeal && relatedAppeal.decision && (
                          <>
                            <Separator />
                            <div>
                              <h4 className="font-medium mb-2">Decisão do Recurso:</h4>
                              <div className="bg-muted p-3 rounded-md whitespace-pre-wrap">
                                {relatedAppeal.decision}
                              </div>
                              <p className="text-sm text-muted-foreground mt-2">
                                Decisão em{" "}
                                {format(new Date(relatedAppeal.decision_date), "dd/MM/yyyy 'às' HH:mm", {
                                  locale: ptBR,
                                })}
                              </p>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
