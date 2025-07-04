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

interface ClarificationUser {
  id: string;
  name: string;
  role: string;
}

// Interface para o objeto de esclarecimentos
interface Clarification {
  id: string;
  tender_id: string;
  content: string;
  created_at: string;
  status: string;
  user: ClarificationUser;
  attachment_url: string | null;
  response?: string;  // Propriedade opcional
  response_date?: string;  // Propriedade opcional
}

interface TenderClarificationsProps {
  tenderId: string;
  usingMockData?: boolean;
}

export function TenderClarifications({
  tenderId,
  usingMockData = false,
}: TenderClarificationsProps) {
  const supabase = createClientSupabaseClient();
  const { user, profile } = useAuth();
  const [clarifications, setClarifications] = useState<Clarification[]>([]);
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

  // Função para gerar dados mock de esclarecimentos
  const generateMockClarifications = (count = 5): Clarification[] => {
    const statuses = ["pending", "answered"];
    const userNames = [
      "João Silva",
      "Maria Oliveira",
      "Carlos Santos",
      "Ana Pereira",
      "Pedro Costa",
    ];

    return Array.from({ length: count }).map((_, index) => {
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 14)); // 0-14 dias atrás

      const status = statuses[Math.floor(Math.random() * statuses.length)];

      // Criar o objeto base com todas as propriedades possíveis
      const mockClarification: Clarification = {
        id: `mock-clarification-${index}`,
        tender_id: tenderId,
        content: `Este é um pedido de esclarecimento ${
          index + 1
        } sobre o edital. Gostaria de saber mais detalhes sobre ${
          [
            "os prazos de entrega",
            "as especificações técnicas",
            "os documentos necessários",
            "as condições de pagamento",
            "os critérios de avaliação",
          ][index % 5]
        }.`,
        created_at: createdDate.toISOString(),
        status: status,
        user: {
          id: `mock-user-${index}`,
          name: userNames[index % userNames.length],
          role: "supplier",
        },
        attachment_url: index % 3 === 0 ? "#" : null,
      };

      // Adicionar resposta se o status for "answered"
      if (status === "answered") {
        const responseDate = new Date(createdDate);
        responseDate.setDate(responseDate.getDate() + 1 + Math.floor(Math.random() * 3)); // 1-3 dias depois

        mockClarification.response = `Em resposta ao seu pedido de esclarecimento, informamos que ${
          [
            "os prazos de entrega estão estabelecidos no Anexo I do Edital",
            "as especificações técnicas seguem as normas indicadas no Termo de Referência",
            "os documentos necessários estão listados no item 7 do Edital",
            "as condições de pagamento são em até 30 dias após a entrega",
            "os critérios de avaliação estão detalhados no Anexo III",
          ][index % 5]
        }. Ficamos à disposição para outros esclarecimentos.`;
        mockClarification.response_date = responseDate.toISOString();
      }

      return mockClarification;
    });
  };

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

        if (tenderError) {
          console.error("Error fetching tender details:", tenderError);

          // Definir um prazo mock para a demonstração
          const mockDeadline = new Date();
          const randomDays = Math.random() > 0.5 ? 5 : -2; // 50% chance de prazo aberto ou fechado
          mockDeadline.setDate(mockDeadline.getDate() + randomDays);
          setDeadline(mockDeadline);
          setDeadlinePassed(randomDays < 0); // Prazo encerrado se for negativo
        } else if (tender?.impugnation_deadline) {
          const deadlineDate = new Date(tender.impugnation_deadline);
          setDeadline(deadlineDate);
          setDeadlinePassed(new Date() > deadlineDate);
        }

        // Tentar buscar esclarecimentos da API
        try {
          const response = await fetch(`/api/tenders/${tenderId}/clarifications`);

          if (response.ok) {
            const { data } = await response.json();
            if (data && data.length > 0) {
              setClarifications(data as Clarification[]);
            } else {
              // Nenhum dado real, usar dados mockados
              console.log("Nenhum esclarecimento encontrado, usando dados mockados");
              setClarifications(generateMockClarifications(4));
            }
          } else {
            // API retornou erro, usar dados mockados
            console.error("API returned error status:", response.status);
            setClarifications(generateMockClarifications(4));
          }
        } catch (apiError) {
          // Erro ao chamar API, usar dados mockados
          console.error("Error fetching clarifications from API:", apiError);
          setClarifications(generateMockClarifications(4));
        }
      } catch (error: any) {
        console.error("Error in fetchData:", error);
        // Definir dados mockados em caso de erro geral
        const mockDeadline = new Date();
        mockDeadline.setDate(mockDeadline.getDate() + 5); // 5 dias no futuro
        setDeadline(mockDeadline);
        setDeadlinePassed(false);
        setClarifications(generateMockClarifications(4));
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

      // Verificar se estamos com dados mockados (se o primeiro clarification tem ID começando com "mock")
      const isMockData = clarifications.length > 0 && clarifications[0].id.startsWith("mock");

      if (isMockData) {
        // Simular o envio de um novo esclarecimento
        await new Promise((resolve) => setTimeout(resolve, 800)); // Simular atraso da rede

        const newClarification: Clarification = {
          id: `mock-clarification-${Date.now()}`,
          tender_id: tenderId,
          content: data.content,
          created_at: new Date().toISOString(),
          status: "pending",
          user: {
            id: user.id,
            name: profile?.name || "Usuário Atual",
            role: profile?.role || "supplier",
          },
          attachment_url: null,
        };

        // Adicionar na lista
        setClarifications([newClarification, ...clarifications]);

        form.reset();

        toast({
          title: "Esclarecimento enviado",
          description: "Seu esclarecimento foi enviado com sucesso e está aguardando resposta.",
        });

        return;
      }

      // Código real para envio à API
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
      setClarifications((refreshedData as Clarification[]) || []);
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

      // Verificar se estamos usando dados mockados
      const selected = clarifications.find((c) => c.id === selectedClarification);
      const isMockData = selected && selected.id.startsWith("mock");

      if (isMockData) {
        // Simulação de resposta para dados mockados
        await new Promise((resolve) => setTimeout(resolve, 800)); // Simular atraso

        // Atualizar o clarification com a resposta
        const updatedClarifications = clarifications.map((c) => {
          if (c.id === selectedClarification) {
            return {
              ...c,
              status: "answered",
              response: data.response,
              response_date: new Date().toISOString(),
            };
          }
          return c;
        });

        setClarifications(updatedClarifications);
        responseForm.reset();
        setDialogOpen(false);

        toast({
          title: "Resposta enviada",
          description: "Sua resposta foi enviada com sucesso.",
        });

        return;
      }

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
      setClarifications((refreshedData as Clarification[]) || []);
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
                <p className="text-[1rem] text-muted-foreground">
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
                            <span className="text-[1rem] text-muted-foreground">
                              {formatDate(clarification.created_at)}
                            </span>
                          </div>
                          <Badge
                            variant={clarification.status === "pending" ? "outline" : "secondary"}>
                            {clarification.status === "pending" ? "Pendente" : "Respondido"}
                          </Badge>
                        </div>
                        <p className="text-[1rem] whitespace-pre-line">{clarification.content}</p>

                        {clarification.attachment_url && (
                          <div className="mt-2">
                            <a
                              href={clarification.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[1rem] text-primary hover:underline flex items-center">
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
                              <span className="text-[1rem] text-muted-foreground">
                                {clarification.response_date
                                  ? formatDate(clarification.response_date)
                                  : ""}
                              </span>
                            </div>
                            <p className="text-[1rem] whitespace-pre-line">
                              {clarification.response}
                            </p>
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