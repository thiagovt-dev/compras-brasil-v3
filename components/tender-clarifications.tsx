"use client";

import { useState, useEffect } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { FileUploadField } from "@/components/file-upload-field";
import { useAuth } from "@/lib/supabase/auth-context";
import { Loader2, MessageSquare, Send, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const clarificationSchema = z.object({
  content: z.string().min(10, "O esclarecimento deve ter pelo menos 10 caracteres"),
});

const responseSchema = z.object({
  response: z.string().min(10, "A resposta deve ter pelo menos 10 caracteres"),
});

type ClarificationFormValues = z.infer<typeof clarificationSchema>;
type ResponseFormValues = z.infer<typeof responseSchema>;

interface TenderClarificationsProps {
  tenderId: string;
}

export function TenderClarifications({ tenderId }: TenderClarificationsProps) {
  const supabase = createClientSupabaseClient();
  const { user, profile } = useAuth();
  const [clarifications, setClarifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [responding, setResponding] = useState(false);
  const [selectedClarification, setSelectedClarification] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [deadlinePassed, setDeadlinePassed] = useState(false);

  const form = useForm<ClarificationFormValues>({
    resolver: zodResolver(clarificationSchema),
    defaultValues: {
      content: "",
    },
  });

  const responseForm = useForm<ResponseFormValues>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      response: "",
    },
  });

  // Fetch clarifications and tender details
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch tender details to get deadline
        const { data: tender, error: tenderError } = await supabase
          .from("tenders")
          .select("impugnation_deadline")
          .eq("id", tenderId)
          .single();

        if (tenderError) throw tenderError;

        if (tender?.impugnation_deadline) {
          const deadlineDate = new Date(tender.impugnation_deadline);
          setDeadline(deadlineDate);
          setDeadlinePassed(new Date() > deadlineDate);
        }

        // Fetch clarifications
        const response = await fetch(`/api/tenders/${tenderId}/clarifications`);
        if (!response.ok) throw new Error("Falha ao carregar esclarecimentos");

        const { data } = await response.json();
        setClarifications(data || []);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast({
          title: "Erro ao carregar esclarecimentos",
          description: error.message || "Ocorreu um erro ao carregar os dados.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, tenderId]);

  const onSubmit = async (data: ClarificationFormValues) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para enviar um esclarecimento.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`/api/tenders/${tenderId}/clarifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: data.content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao enviar esclarecimento");
      }

      form.reset();

      toast({
        title: "Esclarecimento enviado",
        description: "Seu esclarecimento foi enviado com sucesso e está aguardando resposta.",
      });

      // Refresh clarifications
      const refreshResponse = await fetch(`/api/tenders/${tenderId}/clarifications`);
      if (!refreshResponse.ok) throw new Error("Falha ao atualizar esclarecimentos");

      const { data: refreshedData } = await refreshResponse.json();
      setClarifications(refreshedData || []);
    } catch (error: any) {
      console.error("Error submitting clarification:", error);
      toast({
        title: "Erro ao enviar esclarecimento",
        description: error.message || "Ocorreu um erro ao enviar o esclarecimento.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespond = async (data: ResponseFormValues) => {
    if (!selectedClarification) return;

    try {
      setResponding(true);

      const response = await fetch(
        `/api/tenders/${tenderId}/clarifications/${selectedClarification}/respond`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            response: data.response,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao responder esclarecimento");
      }

      responseForm.reset();
      setDialogOpen(false);

      toast({
        title: "Resposta enviada",
        description: "Sua resposta foi enviada com sucesso.",
      });

      // Refresh clarifications
      const refreshResponse = await fetch(`/api/tenders/${tenderId}/clarifications`);
      if (!refreshResponse.ok) throw new Error("Falha ao atualizar esclarecimentos");

      const { data: refreshedData } = await refreshResponse.json();
      setClarifications(refreshedData || []);
    } catch (error: any) {
      console.error("Error responding to clarification:", error);
      toast({
        title: "Erro ao responder esclarecimento",
        description: error.message || "Ocorreu um erro ao responder o esclarecimento.",
        variant: "destructive",
      });
    } finally {
      setResponding(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isAgencyUser = profile?.role === "agency";
  const isAdminUser = profile?.role === "admin";
  const canRespond = isAgencyUser || isAdminUser;

  return (
    <div className="space-y-6">
      {deadline && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Prazo para Esclarecimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {deadlinePassed
                    ? "O prazo para esclarecimentos já expirou."
                    : "O prazo para esclarecimentos termina em:"}
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
            <CardTitle>Enviar Esclarecimento</CardTitle>
            <CardDescription>
              Envie um pedido de esclarecimento sobre o edital ou seus anexos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Esclarecimento</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Digite seu pedido de esclarecimento..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FileUploadField
                  label="Anexo (opcional)"
                  description="Você pode anexar um arquivo para complementar seu esclarecimento"
                  folder="clarifications"
                  entityType="clarification"
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
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Esclarecimento
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Esclarecimentos</CardTitle>
          <CardDescription>Esclarecimentos sobre a licitação</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : clarifications.length > 0 ? (
            <div className="space-y-6">
              {clarifications.map((clarification) => (
                <div key={clarification.id} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {clarification.user?.name || "Usuário"}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(clarification.created_at)}
                            </span>
                          </div>
                          <Badge
                            variant={clarification.status === "pending" ? "outline" : "secondary"}>
                            {clarification.status === "pending" ? "Pendente" : "Respondido"}
                          </Badge>
                        </div>
                        <p className="text-sm whitespace-pre-line">{clarification.content}</p>

                        {clarification.attachment_url && (
                          <div className="mt-2">
                            <a
                              href={clarification.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center">
                              Ver anexo
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {clarification.response ? (
                    <>
                      <Separator className="my-4" />
                      <div className="ml-8 space-y-2">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-5 w-5 text-green-600 mt-0.5" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Resposta</span>
                              <span className="text-sm text-muted-foreground">
                                {clarification.response_date
                                  ? formatDate(clarification.response_date)
                                  : ""}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-line">{clarification.response}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    canRespond && (
                      <div className="ml-8">
                        <Dialog
                          open={dialogOpen && selectedClarification === clarification.id}
                          onOpenChange={(open) => {
                            setDialogOpen(open);
                            if (!open) setSelectedClarification(null);
                          }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedClarification(clarification.id)}>
                              Responder
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                              <DialogTitle>Responder Esclarecimento</DialogTitle>
                              <DialogDescription>
                                Forneça uma resposta para o esclarecimento. Esta resposta será
                                visível para todos os participantes.
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...responseForm}>
                              <form
                                onSubmit={responseForm.handleSubmit(handleRespond)}
                                className="space-y-4">
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
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDialogOpen(false)}>
                                Cancelar
                              </Button>
                              <Button
                                type="submit"
                                onClick={responseForm.handleSubmit(handleRespond)}
                                disabled={responding}>
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
              <p className="text-muted-foreground">Nenhum esclarecimento disponível.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
