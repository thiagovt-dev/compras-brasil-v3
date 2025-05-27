"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { FileUploadField } from "@/components/file-upload-field"
import { useAuth } from "@/lib/supabase/auth-context"
import { AlertTriangle, Loader2, MessageSquare, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const impugnationSchema = z.object({
  content: z.string().min(10, "A impugnação deve ter pelo menos 10 caracteres"),
})

const responseSchema = z.object({
  response: z.string().min(10, "A resposta deve ter pelo menos 10 caracteres"),
})

type ImpugnationFormValues = z.infer<typeof impugnationSchema>
type ResponseFormValues = z.infer<typeof responseSchema>

interface TenderImpugnationsProps {
  tenderId: string
}

export function TenderImpugnations({ tenderId }: TenderImpugnationsProps) {
  const supabase = createClientComponentClient()
  const { user, profile } = useAuth()
  const [impugnations, setImpugnations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [responding, setResponding] = useState(false)
  const [selectedImpugnation, setSelectedImpugnation] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deadline, setDeadline] = useState<Date | null>(null)
  const [deadlinePassed, setDeadlinePassed] = useState(false)

  const form = useForm<ImpugnationFormValues>({
    resolver: zodResolver(impugnationSchema),
    defaultValues: {
      content: "",
    },
  })

  const responseForm = useForm<ResponseFormValues>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      response: "",
    },
  })

  // Fetch impugnations and tender details
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch tender details to get deadline
        const { data: tenderData, error: tenderError } = await supabase
          .from("tenders")
          .select("impugnation_deadline")
          .eq("id", tenderId)
          .single()

        if (tenderError) throw tenderError

        if (tenderData?.impugnation_deadline) {
          const deadlineDate = new Date(tenderData.impugnation_deadline)
          setDeadline(deadlineDate)
          setDeadlinePassed(new Date() > deadlineDate)
        }

        // Fetch impugnations
        const response = await fetch(`/api/tenders/${tenderId}/impugnations`)
        if (!response.ok) throw new Error("Falha ao carregar impugnações")

        const { data } = await response.json()
        setImpugnations(data || [])
      } catch (error: any) {
        console.error("Error fetching data:", error)
        toast({
          title: "Erro ao carregar impugnações",
          description: error.message || "Ocorreu um erro ao carregar os dados.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, tenderId])

  const onSubmit = async (data: ImpugnationFormValues) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para enviar uma impugnação.",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch(`/api/tenders/${tenderId}/impugnations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: data.content,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao enviar impugnação")
      }

      form.reset()

      toast({
        title: "Impugnação enviada",
        description: "Sua impugnação foi enviada com sucesso e está aguardando resposta.",
      })

      // Refresh impugnations
      const refreshResponse = await fetch(`/api/tenders/${tenderId}/impugnations`)
      if (!refreshResponse.ok) throw new Error("Falha ao atualizar impugnações")

      const { data: refreshedData } = await refreshResponse.json()
      setImpugnations(refreshedData || [])
    } catch (error: any) {
      console.error("Error submitting impugnation:", error)
      toast({
        title: "Erro ao enviar impugnação",
        description: error.message || "Ocorreu um erro ao enviar a impugnação.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleRespond = async (data: ResponseFormValues) => {
    if (!selectedImpugnation) return

    try {
      setResponding(true)

      const response = await fetch(`/api/tenders/${tenderId}/impugnations/${selectedImpugnation}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          response: data.response,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao responder impugnação")
      }

      responseForm.reset()
      setDialogOpen(false)

      toast({
        title: "Resposta enviada",
        description: "Sua resposta foi enviada com sucesso.",
      })

      // Refresh impugnations
      const refreshResponse = await fetch(`/api/tenders/${tenderId}/impugnations`)
      if (!refreshResponse.ok) throw new Error("Falha ao atualizar impugnações")

      const { data: refreshedData } = await refreshResponse.json()
      setImpugnations(refreshedData || [])
    } catch (error: any) {
      console.error("Error responding to impugnation:", error)
      toast({
        title: "Erro ao responder impugnação",
        description: error.message || "Ocorreu um erro ao responder a impugnação.",
        variant: "destructive",
      })
    } finally {
      setResponding(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const isAgencyUser = profile?.role === "agency"
  const isAdminUser = profile?.role === "admin"
  const canRespond = isAgencyUser || isAdminUser

  return (
    <div className="space-y-6">
      {deadline && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Prazo para Impugnações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {deadlinePassed ? "O prazo para impugnações já expirou." : "O prazo para impugnações termina em:"}
                </p>
                <p className="font-medium">{formatDate(deadline.toISOString())}</p>
              </div>
              {deadlinePassed ? (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  Prazo encerrado
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Prazo aberto
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {user && !deadlinePassed && (
        <Card>
          <CardHeader>
            <CardTitle>Enviar Impugnação</CardTitle>
            <CardDescription>Envie uma impugnação ao edital caso identifique alguma irregularidade</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Impugnação</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Digite sua impugnação..." className="min-h-[120px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FileUploadField
                  label="Anexo (opcional)"
                  description="Você pode anexar um arquivo para complementar sua impugnação"
                  folder="impugnations"
                  entityType="impugnation"
                  entityId={tenderId}
                />
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Enviar Impugnação
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Impugnações</CardTitle>
          <CardDescription>Impugnações ao edital</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : impugnations.length > 0 ? (
            <div className="space-y-6">
              {impugnations.map((impugnation) => (
                <div key={impugnation.id} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{impugnation.user?.name || "Usuário"}</span>
                            <span className="text-sm text-muted-foreground">{formatDate(impugnation.created_at)}</span>
                          </div>
                          <Badge variant={impugnation.status === "pending" ? "outline" : "secondary"}>
                            {impugnation.status === "pending" ? "Pendente" : "Respondida"}
                          </Badge>
                        </div>
                        <p className="text-sm whitespace-pre-line">{impugnation.content}</p>

                        {impugnation.attachment_url && (
                          <div className="mt-2">
                            <a
                              href={impugnation.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center"
                            >
                              Ver anexo
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {impugnation.response ? (
                    <>
                      <Separator className="my-4" />
                      <div className="ml-8 space-y-2">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-5 w-5 text-green-600 mt-0.5" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Resposta</span>
                              <span className="text-sm text-muted-foreground">
                                {impugnation.response_date ? formatDate(impugnation.response_date) : ""}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-line">{impugnation.response}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    canRespond && (
                      <div className="ml-8">
                        <Dialog
                          open={dialogOpen && selectedImpugnation === impugnation.id}
                          onOpenChange={(open) => {
                            setDialogOpen(open)
                            if (!open) setSelectedImpugnation(null)
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedImpugnation(impugnation.id)}>
                              Responder
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                              <DialogTitle>Responder Impugnação</DialogTitle>
                              <DialogDescription>
                                Forneça uma resposta para a impugnação. Esta resposta será visível para todos os
                                participantes.
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...responseForm}>
                              <form onSubmit={responseForm.handleSubmit(handleRespond)} className="space-y-4">
                                <FormField
                                  control={responseForm.control}
                                  name="response"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Resposta</FormLabel>
                                      <FormControl>
                                        <Textarea
                                          placeholder="Digite sua resposta..."
                                          className="min-h-[150px]"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </form>
                            </Form>
                            <DialogFooter>
                              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancelar
                              </Button>
                              <Button
                                type="submit"
                                onClick={responseForm.handleSubmit(handleRespond)}
                                disabled={responding}
                              >
                                {responding ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enviando...
                                  </>
                                ) : (
                                  "Enviar Resposta"
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )
                  )}

                  <Separator />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma impugnação disponível.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
