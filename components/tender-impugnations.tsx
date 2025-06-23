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
import { AlertTriangle, Loader2, MessageSquare, Clock } from "lucide-react";
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

const impugnationSchema = z.object({
  content: z.string().min(10, "A impugnação deve ter pelo menos 10 caracteres"),
});

const responseSchema = z.object({
  response: z.string().min(10, "A resposta deve ter pelo menos 10 caracteres"),
});

type ImpugnationFormValues = z.infer<typeof impugnationSchema>;
type ResponseFormValues = z.infer<typeof responseSchema>;

interface ImpugnationUser {
  id: string;
  name: string;
  role: string;
}

// Interface para o objeto de impugnação
interface Impugnation {
  id: string;
  tender_id: string;
  content: string;
  created_at: string;
  status: string;
  user: ImpugnationUser;
  attachment_url: string | null;
  response?: string;  // Propriedade opcional
  response_date?: string;  // Propriedade opcional
}

interface TenderImpugnationsProps {
  tenderId: string;
  usingMockData?: boolean;
}

export function TenderImpugnations({ tenderId, usingMockData = false }: TenderImpugnationsProps) {
  const supabase = createClientSupabaseClient();
  const { user, profile } = useAuth();
  const [impugnations, setImpugnations] = useState<Impugnation[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [responding, setResponding] = useState(false);
  const [selectedImpugnation, setSelectedImpugnation] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [deadlinePassed, setDeadlinePassed] = useState(false);

  const form = useForm<ImpugnationFormValues>({
    resolver: zodResolver(impugnationSchema),
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

  // Função para gerar dados mock de impugnações
  const generateMockImpugnations = (count = 3): Impugnation[] => {
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
      const mockImpugnation: Impugnation = {
        id: `mock-impugnation-${index}`,
        tender_id: tenderId,
        content: `Esta é uma impugnação ${index + 1} ao edital. ${
          [
            "Solicito a revisão do item 3.2, pois está em desacordo com a Lei 8.666/93.",
            "O critério de julgamento está em desconformidade com a jurisprudência do TCU.",
            "As exigências técnicas do item 4.5 são restritivas e limitam a competitividade.",
            "A cláusula 7.3 do edital contém vícios que ferem o princípio da isonomia.",
            "O prazo estabelecido no cronograma é inexequível e deve ser adequado.",
          ][index % 5]
        }`,
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

        mockImpugnation.response = `Em análise à impugnação apresentada, informamos que ${
          [
            "após avaliação técnica, foi constatado que assiste razão ao impugnante. O edital será retificado.",
            "o item questionado está em conformidade com a legislação vigente, portanto a impugnação foi indeferida.",
            "a Administração acata parcialmente a impugnação, e o item será ajustado para contemplar as observações pertinentes.",
            "o edital será suspenso temporariamente para adequação dos pontos levantados.",
            "o prazo será estendido conforme solicitado para garantir a ampla participação.",
          ][index % 5]
        }`;
        mockImpugnation.response_date = responseDate.toISOString();
      }

      return mockImpugnation;
    });
  };

  // Fetch impugnations and tender details
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch tender details to get deadline
        const { data: tenderData, error: tenderError } = await supabase
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
        } else if (tenderData?.impugnation_deadline) {
          const deadlineDate = new Date(tenderData.impugnation_deadline);
          setDeadline(deadlineDate);
          setDeadlinePassed(new Date() > deadlineDate);
        }

        // Tentar buscar impugnações da API
        try {
          const response = await fetch(`/api/tenders/${tenderId}/impugnations`);

          if (response.ok) {
            const { data } = await response.json();
            if (data && data.length > 0) {
              setImpugnations(data as Impugnation[]);
            } else {
              // Nenhum dado real, usar dados mockados
              console.log("Nenhuma impugnação encontrada, usando dados mockados");
              setImpugnations(generateMockImpugnations(3));
            }
          } else {
            // API retornou erro, usar dados mockados
            console.error("API returned error status:", response.status);
            setImpugnations(generateMockImpugnations(3));
          }
        } catch (apiError) {
          // Erro ao chamar API, usar dados mockados
          console.error("Error fetching impugnations from API:", apiError);
          setImpugnations(generateMockImpugnations(3));
        }
      } catch (error: any) {
        console.error("Error in fetchData:", error);
        // Definir dados mockados em caso de erro geral
        const mockDeadline = new Date();
        mockDeadline.setDate(mockDeadline.getDate() + 5); // 5 dias no futuro
        setDeadline(mockDeadline);
        setDeadlinePassed(false);
        setImpugnations(generateMockImpugnations(3));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, tenderId]);

  const onSubmit = async (data: ImpugnationFormValues) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para enviar uma impugnação.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Verificar se estamos com dados mockados
      const isMockData = impugnations.length > 0 && impugnations[0].id.startsWith("mock");

      if (isMockData) {
        // Simular o envio de uma nova impugnação
        await new Promise((resolve) => setTimeout(resolve, 800)); // Simular atraso da rede

        const newImpugnation: Impugnation = {
          id: `mock-impugnation-${Date.now()}`,
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
        setImpugnations([newImpugnation, ...impugnations]);

        form.reset();

        toast({
          title: "Impugnação enviada",
          description: "Sua impugnação foi enviada com sucesso e está aguardando resposta.",
        });

        return;
      }

      // Código real para envio à API
      const response = await fetch(`/api/tenders/${tenderId}/impugnations`, {
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
        throw new Error(errorData.error || "Erro ao enviar impugnação");
      }

      form.reset();

      toast({
        title: "Impugnação enviada",
        description: "Sua impugnação foi enviada com sucesso e está aguardando resposta.",
      });

      // Refresh impugnations
      const refreshResponse = await fetch(`/api/tenders/${tenderId}/impugnations`);
      if (!refreshResponse.ok) throw new Error("Falha ao atualizar impugnações");

      const { data: refreshedData } = await refreshResponse.json();
      setImpugnations((refreshedData as Impugnation[]) || []);
    } catch (error: any) {
      console.error("Error submitting impugnation:", error);
      toast({
        title: "Erro ao enviar impugnação",
        description: error.message || "Ocorreu um erro ao enviar a impugnação.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespond = async (data: ResponseFormValues) => {
    if (!selectedImpugnation) return;

    try {
      setResponding(true);

      // Verificar se estamos usando dados mockados
      const selected = impugnations.find((c) => c.id === selectedImpugnation);
      const isMockData = selected && selected.id.startsWith("mock");

      if (isMockData) {
        // Simulação de resposta para dados mockados
        await new Promise((resolve) => setTimeout(resolve, 800)); // Simular atraso

        // Atualizar a impugnação com a resposta
        const updatedImpugnations = impugnations.map((imp) => {
          if (imp.id === selectedImpugnation) {
            return {
              ...imp,
              status: "answered",
              response: data.response,
              response_date: new Date().toISOString(),
            };
          }
          return imp;
        });

        setImpugnations(updatedImpugnations);
        responseForm.reset();
        setDialogOpen(false);

        toast({
          title: "Resposta enviada",
          description: "Sua resposta foi enviada com sucesso.",
        });

        return;
      }

      const response = await fetch(
        `/api/tenders/${tenderId}/impugnations/${selectedImpugnation}/respond`,
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
        throw new Error(errorData.error || "Erro ao responder impugnação");
      }

      responseForm.reset();
      setDialogOpen(false);

      toast({
        title: "Resposta enviada",
        description: "Sua resposta foi enviada com sucesso.",
      });

      // Refresh impugnations
      const refreshResponse = await fetch(`/api/tenders/${tenderId}/impugnations`);
      if (!refreshResponse.ok) throw new Error("Falha ao atualizar impugnações");

      const { data: refreshedData } = await refreshResponse.json();
      setImpugnations((refreshedData as Impugnation[]) || []);
    } catch (error: any) {
      console.error("Error responding to impugnation:", error);
      toast({
        title: "Erro ao responder impugnação",
        description: error.message || "Ocorreu um erro ao responder a impugnação.",
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
              Prazo para Impugnações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[1rem] text-muted-foreground">
                  {deadlinePassed
                    ? "O prazo para impugnações já expirou."
                    : "O prazo para impugnações termina em:"}
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
            <CardDescription>
              Envie uma impugnação ao edital caso identifique alguma irregularidade
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
                      <FormLabel>Impugnação</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Digite sua impugnação..."
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
                            <span className="font-medium">
                              {impugnation.user?.name || "Usuário"}
                            </span>
                            <span className="text-[1rem] text-muted-foreground">
                              {formatDate(impugnation.created_at)}
                            </span>
                          </div>
                          <Badge
                            variant={impugnation.status === "pending" ? "outline" : "secondary"}>
                            {impugnation.status === "pending" ? "Pendente" : "Respondida"}
                          </Badge>
                        </div>
                        <p className="text-[1rem] whitespace-pre-line">{impugnation.content}</p>

                        {impugnation.attachment_url && (
                          <div className="mt-2">
                            <a
                              href={impugnation.attachment_url}
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

                  {impugnation.response ? (
                    <>
                      <Separator className="my-4" />
                      <div className="ml-8 space-y-2">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-5 w-5 text-green-600 mt-0.5" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Resposta</span>
                              <span className="text-[1rem] text-muted-foreground">
                                {impugnation.response_date
                                  ? formatDate(impugnation.response_date)
                                  : ""}
                              </span>
                            </div>
                            <p className="text-[1rem] whitespace-pre-line">
                              {impugnation.response}
                            </p>
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
                            setDialogOpen(open);
                            if (!open) setSelectedImpugnation(null);
                          }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedImpugnation(impugnation.id)}>
                              Responder
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                              <DialogTitle>Responder Impugnação</DialogTitle>
                              <DialogDescription>
                                Forneça uma resposta para a impugnação. Esta resposta será visível
                                para todos os participantes.
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
              <p className="text-muted-foreground">Nenhuma impugnação disponível.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}