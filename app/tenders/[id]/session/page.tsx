"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { SessionChat } from "@/components/session-chat";
import { TenderSessionInfo } from "@/components/tender-session-info";
import { TenderSessionParticipants } from "@/components/tender-session-participants";
import { RegisterParticipationButton } from "@/components/register-participation-button";
import { TenderHeader } from "@/components/tender-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClientSupabaseClient } from "@/lib/supabase/client";

interface Agency {
  name: string;
}

interface Tender {
  id: string;
  title: string;
  tender_number: string;
  status: string;
  opening_date: string;
  agencies: Agency[];
}

export default function TenderSessionPage() {
  const [tender, setTender] = useState<Tender | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientSupabaseClient();
  const router = useRouter();
  const params = useParams(); // Obter params usando useParams()

  useEffect(() => {
    const fetchTenderData = async () => {
      try {
        setLoading(true);

        // Verificar se params está disponível
        if (!params?.id) {
          throw new Error("ID da licitação não encontrado");
        }

        const { data, error } = await supabase
          .from("tenders")
          .select(
            `
            id,
            title,
            tender_number,
            status,
            opening_date,
            agencies!inner (
              name
            )
          `
          )
          .eq("id", params.id.toString()) // Converter para string se necessário
          .single();

        if (error) throw error;
        if (!data) {
          router.push("/404");
          return;
        }

        setTender(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar dados da licitação");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTenderData();
  }, [params?.id, supabase, router]); // Adicionar params.id como dependência

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-red-500 text-center max-w-md p-4 rounded-lg bg-red-50">
          <p className="font-medium">Erro ao carregar sessão</p>
          <p className="mt-2 text-sm">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  const isSessionActive = tender?.status === "active" || tender?.status === "in_progress";

  return (
    <div className="container mx-auto py-6 space-y-6">
      <TenderHeader
        title={tender?.title || "Sessão Pública"}
        number={tender?.tender_number || ""}
        agency={tender?.agencies[0]?.name || ""}
        id={params?.id?.toString() || ""}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sessão Pública</CardTitle>
              <CardDescription>
                {isSessionActive
                  ? "A sessão está em andamento. Acompanhe em tempo real."
                  : "A sessão ainda não foi iniciada ou já foi encerrada."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TenderSessionInfo tenderId={params?.id?.toString() || ""} />

              {!isSessionActive && tender?.opening_date && (
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <p className="text-[1rem] text-muted-foreground">
                    A sessão pública será iniciada em{" "}
                    {new Date(tender.opening_date).toLocaleString("pt-BR")}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="chat">
            <TabsList>
              <TabsTrigger value="chat">Chat da Sessão</TabsTrigger>
              <TabsTrigger value="participants">Participantes</TabsTrigger>
            </TabsList>
            <TabsContent value="chat" className="h-[500px]">
              <SessionChat tenderId={params?.id?.toString() || ""} />
            </TabsContent>
            <TabsContent value="participants">
              <TenderSessionParticipants tenderId={params?.id?.toString() || ""} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RegisterParticipationButton tenderId={params?.id?.toString() || ""} />

              <Separator />

              <div className="space-y-2">
                <h3 className="text-[1rem] font-medium">Links Rápidos</h3>
                <div className="grid gap-2">
                  <Link
                    href={`/tenders/${params?.id}`}
                    className="text-[1rem] text-blue-600 hover:underline">
                    Detalhes da Licitação
                  </Link>
                  <Link
                    href={`/tenders/${params?.id}/documents`}
                    className="text-[1rem] text-blue-600 hover:underline">
                    Documentos
                  </Link>
                  <Link
                    href={`/tenders/${params?.id}/clarifications`}
                    className="text-[1rem] text-blue-600 hover:underline">
                    Esclarecimentos
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
