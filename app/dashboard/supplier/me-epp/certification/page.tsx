"use client";

import { useState, useEffect } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileUploadField } from "@/components/file-upload-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, CheckCircle, Clock } from "lucide-react";

const formSchema = z.object({
  certificate_type: z.enum(["me", "epp", "mei"], {
    required_error: "Selecione o tipo de certificado",
  }),
  certificate_number: z.string().min(1, "Número do certificado é obrigatório"),
  issuing_authority: z.string().min(1, "Órgão emissor é obrigatório"),
  issue_date: z.string().min(1, "Data de emissão é obrigatória"),
  expiry_date: z.string().optional(),
  notes: z.string().optional(),
});

export default function MeEppCertificationPage() {
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      certificate_type: "me",
      certificate_number: "",
      issuing_authority: "",
      issue_date: new Date().toISOString().split("T")[0],
      expiry_date: "",
      notes: "",
    },
  });

  useEffect(() => {
    const fetchCertificate = async () => {
      setIsLoading(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Verificar se já existe um certificado
        const { data, error } = await supabase
          .from("me_epp_certificates")
          .select("*")
          .eq("supplier_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setCertificate(data);

          // Preencher o formulário com os dados do certificado
          form.reset({
            certificate_type: data.certificate_type as "me" | "epp" | "mei",
            certificate_number: data.certificate_number || "",
            issuing_authority: data.issuing_authority || "",
            issue_date: data.issue_date
              ? new Date(data.issue_date).toISOString().split("T")[0]
              : "",
            expiry_date: data.expiry_date
              ? new Date(data.expiry_date).toISOString().split("T")[0]
              : "",
            notes: data.notes || "",
          });
        }
      } catch (error) {
        console.error("Erro ao buscar certificado:", error);
        toast({
          title: "Erro ao carregar certificado",
          description: "Não foi possível carregar os dados do certificado.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificate();
  }, [supabase, router, toast, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Preparar dados para inserção/atualização
      const certificateData = {
        supplier_id: user.id,
        certificate_type: values.certificate_type,
        certificate_number: values.certificate_number,
        issuing_authority: values.issuing_authority,
        issue_date: values.issue_date,
        expiry_date: values.expiry_date || null,
        status: "pending",
        document_url: uploadedFile?.publicUrl || certificate?.document_url || null,
        notes: values.notes || null,
        updated_at: new Date().toISOString(),
      };

      let result;

      if (certificate) {
        // Atualizar certificado existente
        const { data, error } = await supabase
          .from("me_epp_certificates")
          .update(certificateData)
          .eq("id", certificate.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Inserir novo certificado
        const { data, error } = await supabase
          .from("me_epp_certificates")
          .insert({
            ...certificateData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      setCertificate(result);

      toast({
        title: certificate ? "Certificado atualizado" : "Certificado enviado",
        description: certificate
          ? "Seu certificado foi atualizado e está em análise."
          : "Seu certificado foi enviado e está em análise.",
      });
    } catch (error: any) {
      console.error("Erro ao enviar certificado:", error);
      toast({
        title: "Erro ao enviar certificado",
        description: error.message || "Ocorreu um erro ao enviar seu certificado.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUploadComplete = (fileData: any) => {
    setUploadedFile(fileData);
  };

  function getStatusBadge(status: string) {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="mr-1 h-3 w-3" /> Aprovado
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500">
            <Clock className="mr-1 h-3 w-3" /> Em análise
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500">
            <AlertCircle className="mr-1 h-3 w-3" /> Rejeitado
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Certificação ME/EPP</h1>
          <p className="text-muted-foreground">
            Envie seu certificado de Microempresa ou Empresa de Pequeno Porte para validação
          </p>
        </div>

        <Separator />

        {certificate && (
          <Alert variant={certificate.status === "rejected" ? "destructive" : "default"}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Status do Certificado</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>
                Seu certificado está {getStatusBadge(certificate.status)}
                {certificate.status === "rejected" && certificate.notes && (
                  <div className="mt-2">
                    <strong>Motivo:</strong> {certificate.notes}
                  </div>
                )}
              </span>
              <span className="text-sm">
                Enviado em {new Date(certificate.created_at).toLocaleDateString("pt-BR")}
              </span>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{certificate ? "Atualizar Certificado" : "Enviar Certificado"}</CardTitle>
            <CardDescription>
              Preencha os dados do seu certificado de ME/EPP para obter os benefícios da Lei
              Complementar 123/2006
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="certificate_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Certificado</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de certificado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="me">Microempresa (ME)</SelectItem>
                            <SelectItem value="epp">Empresa de Pequeno Porte (EPP)</SelectItem>
                            <SelectItem value="mei">Microempreendedor Individual (MEI)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Selecione o tipo de certificado de acordo com o porte da sua empresa
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="certificate_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do Certificado</FormLabel>
                        <FormControl>
                          <Input placeholder="Número do certificado" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="issuing_authority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Órgão Emissor</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Junta Comercial do Estado" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="issue_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Emissão</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expiry_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Validade (opcional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          Deixe em branco se não houver data de validade
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FileUploadField
                  label="Documento do Certificado"
                  folder="me-epp-certificates"
                  entityType="supplier"
                  onUploadComplete={handleFileUploadComplete}
                  required={!certificate?.document_url}
                  accept=".pdf,.jpg,.jpeg,.png"
                  description="Envie o documento que comprova sua condição de ME/EPP (PDF, JPG ou PNG)"
                />

                {certificate?.document_url && !uploadedFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Documento já enviado. Envie um novo apenas se desejar substituir.</span>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Informações adicionais sobre o certificado"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {certificate ? "Atualizando..." : "Enviando..."}
                    </>
                  ) : certificate ? (
                    "Atualizar Certificado"
                  ) : (
                    "Enviar Certificado"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <p className="text-sm text-muted-foreground">
              Conforme Lei Complementar 123/2006, a condição de ME/EPP deve ser comprovada para
              obtenção dos benefícios.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
