"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, FileText } from "lucide-react";

const formSchema = z.object({
  payment_method: z.enum(["credit_card", "pix", "boleto"]),
  card_number: z.string().optional(),
  card_name: z.string().optional(),
  card_expiry: z.string().optional(),
  card_cvv: z.string().optional(),
});

export default function SubscribePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientSupabaseClient();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [plan, setPlan] = useState<any>(null);

  const planId = searchParams.get("plan");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      payment_method: "credit_card",
      card_number: "",
      card_name: "",
      card_expiry: "",
      card_cvv: "",
    },
  });

  const paymentMethod = form.watch("payment_method");

  useEffect(() => {
    const fetchPlan = async () => {
      if (!planId) {
        router.push("/dashboard/supplier/financial/plans");
        return;
      }

      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("id", planId)
        .single();

      if (error || !data) {
        toast({
          title: "Erro ao carregar plano",
          description: "Não foi possível carregar os detalhes do plano.",
          variant: "destructive",
        });
        router.push("/dashboard/supplier/financial/plans");
        return;
      }

      setPlan(data);
      setIsLoading(false);
    };

    fetchPlan();
  }, [planId, router, supabase, toast]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!plan) return;

    setIsSubmitting(true);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para assinar um plano.",
          variant: "destructive",
        });
        return;
      }

      // Create payment transaction
      const { data: transaction, error: transactionError } = await supabase
        .from("payment_transactions")
        .insert({
          user_id: user.id,
          amount: plan.price,
          status: "pending",
          payment_method: values.payment_method,
          payment_details:
            values.payment_method === "credit_card"
              ? {
                  card_number: values.card_number?.replace(/\s/g, "").slice(-4),
                  card_name: values.card_name,
                  card_expiry: values.card_expiry,
                }
              : null,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Create or update subscription
      const startDate = new Date();
      const endDate = new Date();

      // Set end date based on billing cycle
      if (plan.billing_cycle === "monthly") {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (plan.billing_cycle === "quarterly") {
        endDate.setMonth(endDate.getMonth() + 3);
      } else if (plan.billing_cycle === "yearly") {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      // Check if user already has a subscription
      const { data: existingSubscription } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (existingSubscription) {
        // Update existing subscription
        await supabase
          .from("user_subscriptions")
          .update({
            plan_id: plan.id,
            status: "active",
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            payment_method: values.payment_method,
            payment_details:
              values.payment_method === "credit_card"
                ? {
                    card_number: values.card_number?.replace(/\s/g, "").slice(-4),
                    card_name: values.card_name,
                    card_expiry: values.card_expiry,
                  }
                : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSubscription.id);
      } else {
        // Create new subscription
        await supabase.from("user_subscriptions").insert({
          user_id: user.id,
          plan_id: plan.id,
          status: "active",
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          payment_method: values.payment_method,
          payment_details:
            values.payment_method === "credit_card"
              ? {
                  card_number: values.card_number?.replace(/\s/g, "").slice(-4),
                  card_name: values.card_name,
                  card_expiry: values.card_expiry,
                }
              : null,
        });
      }

      // Create invoice
      await supabase.from("invoices").insert({
        transaction_id: transaction.id,
        user_id: user.id,
        invoice_number: `INV-${Date.now()}`,
        amount: plan.price,
        tax_amount: plan.price * 0.05, // 5% tax example
        issue_date: new Date().toISOString(),
        due_date: new Date().toISOString(),
        status: "issued",
      });

      toast({
        title: "Assinatura realizada com sucesso",
        description: "Seu plano foi ativado e já está disponível para uso.",
      });

      router.push("/dashboard/supplier/financial");
    } catch (error) {
      console.error("Error subscribing to plan:", error);
      toast({
        title: "Erro ao processar assinatura",
        description: "Ocorreu um erro ao processar sua assinatura. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{4})(?=\d)/g, "$1 ")
      .trim()
      .substring(0, 19);
  };

  const formatCardExpiry = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(?=\d)/, "$1/")
      .substring(0, 5);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assinar Plano</h1>
        <p className="text-muted-foreground">Complete sua assinatura do plano {plan?.name}</p>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações de Pagamento</CardTitle>
              <CardDescription>
                Escolha a forma de pagamento e complete sua assinatura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="payment_method"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Forma de Pagamento</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1">
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="credit_card" />
                              </FormControl>
                              <FormLabel className="font-normal flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Cartão de Crédito
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="pix" />
                              </FormControl>
                              <FormLabel className="font-normal flex items-center gap-2">
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg">
                                  <path
                                    d="M11.6666 2.66675L13.3333 4.33341M13.3333 4.33341L11.6666 6.00008M13.3333 4.33341H10.6666C9.78216 4.33341 8.93426 4.68469 8.30913 5.30982C7.684 5.93494 7.33331 6.78284 7.33331 7.66675V8.00008M4.33331 13.3334L2.66665 11.6667M2.66665 11.6667L4.33331 10.0001M2.66665 11.6667H5.33331C6.21722 11.6667 7.06512 11.3155 7.69025 10.6903C8.31537 10.0652 8.66665 9.21733 8.66665 8.33341V8.00008M11.6666 11.6667C11.6666 12.0203 11.8071 12.3595 12.0571 12.6095C12.3072 12.8596 12.6463 13.0001 13 13.0001C13.3536 13.0001 13.6928 12.8596 13.9428 12.6095C14.1929 12.3595 14.3333 12.0203 14.3333 11.6667C14.3333 11.3131 14.1929 10.9739 13.9428 10.7239C13.6928 10.4738 13.3536 10.3334 13 10.3334C12.6463 10.3334 12.3072 10.4738 12.0571 10.7239C11.8071 10.9739 11.6666 11.3131 11.6666 11.6667ZM1.66665 4.33341C1.66665 4.68699 1.80712 5.02618 2.05717 5.27622C2.30722 5.52627 2.6464 5.66675 2.99998 5.66675C3.35355 5.66675 3.69274 5.52627 3.94279 5.27622C4.19284 5.02618 4.33331 4.68699 4.33331 4.33341C4.33331 3.97984 4.19284 3.64065 3.94279 3.3906C3.69274 3.14056 3.35355 3.00008 2.99998 3.00008C2.6464 3.00008 2.30722 3.14056 2.05717 3.3906C1.80712 3.64065 1.66665 3.97984 1.66665 4.33341Z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                PIX
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="boleto" />
                              </FormControl>
                              <FormLabel className="font-normal flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Boleto Bancário
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {paymentMethod === "credit_card" && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="card_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número do Cartão</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="0000 0000 0000 0000"
                                {...field}
                                onChange={(e) => field.onChange(formatCardNumber(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="card_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome no Cartão</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome como está no cartão" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="card_expiry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Validade</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="MM/AA"
                                  {...field}
                                  onChange={(e) => field.onChange(formatCardExpiry(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="card_cvv"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CVV</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="123"
                                  maxLength={3}
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value.replace(/\D/g, "").substring(0, 3)
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === "pix" && (
                    <div className="rounded-md border p-4 text-center">
                      <div className="mx-auto mb-2 h-32 w-32 bg-gray-100 flex items-center justify-center">
                        <svg
                          width="100"
                          height="100"
                          viewBox="0 0 100 100"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg">
                          <rect width="100" height="100" fill="white" />
                          <path
                            d="M20 20H30V30H20V20ZM30 30H40V40H30V30ZM40 40H50V50H40V40ZM50 50H60V60H50V50ZM60 60H70V70H60V60ZM70 70H80V80H70V70ZM20 40H30V50H20V40ZM40 20H50V30H40V20ZM50 30H60V40H50V30ZM60 40H70V50H60V40ZM70 50H80V60H70V50ZM20 60H30V70H20V60ZM30 70H40V80H30V70ZM50 70H60V80H50V70ZM20 80H30V90H20V80ZM40 80H50V90H40V80ZM60 80H70V90H60V80ZM80 20H90V30H80V20ZM80 40H90V50H80V40ZM80 80H90V90H80V80Z"
                            fill="black"
                          />
                        </svg>
                      </div>
                      <p className="text-sm font-medium">Escaneie o QR Code para pagar</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        O pagamento será confirmado automaticamente
                      </p>
                      <div className="mt-4">
                        <Button variant="outline" size="sm" className="w-full">
                          Copiar código PIX
                        </Button>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "boleto" && (
                    <div className="rounded-md border p-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Boleto Bancário</p>
                          <p className="text-sm text-muted-foreground">
                            O boleto será gerado após a confirmação
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm">
                          <span className="font-medium">Valor:</span>{" "}
                          {formatCurrency(plan?.price || 0)}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Vencimento:</span> 5 dias úteis
                        </p>
                      </div>
                      <div className="mt-4">
                        <Button variant="outline" size="sm" className="w-full">
                          Gerar Boleto
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        `Assinar por ${formatCurrency(plan?.price || 0)}`
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Plano</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">{plan?.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan?.description}</p>
                </div>

                <Separator />

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm">Valor do plano</span>
                    <span className="font-medium">{formatCurrency(plan?.price || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Ciclo de cobrança</span>
                    <span className="font-medium">{plan?.billing_cycle}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(plan?.price || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
