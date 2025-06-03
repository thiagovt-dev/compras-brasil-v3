import { redirect } from "next/navigation";
import { TenderHeader } from "@/components/tender-header";
import { SystemMessageForm } from "@/components/system-message-form";
import { TenderSessionControls } from "@/components/tender-session-controls";
import { TenderSessionParticipants } from "@/components/tender-session-participants";
import { SessionChat } from "@/components/session-chat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSession } from "@/lib/supabase/auth-utils";
import { createServerClient } from "@/lib/supabase/server";

export default async function TenderSessionManagePage({ params }: { params: { id: string } }) {
  const session = await getSession();

  if (!session) {
    redirect("/login?callbackUrl=" + encodeURIComponent(`/tenders/${params.id}/session/manage`));
  }

  const supabase = await createServerClient();

  // Verificar se o usuário é pregoeiro ou membro da equipe
  const { data: teamMember } = await supabase
    .from("tender_team")
    .select("id, role")
    .eq("tender_id", params.id)
    .eq("user_id", session.user.id)
    .single();

  if (!teamMember || teamMember.role !== "pregoeiro") {
    redirect(`/tenders/${params.id}/session`);
  }

  // Buscar informações da licitação
  const { data: tender } = await supabase
    .from("tenders")
    .select(
      `
      id,
      title,
      number,
      status,
      agencies!inner (
        name
      )
    `
    )
    .eq("id", params.id)
    .single();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <TenderHeader
        title={tender?.title || "Sessão Pública"}
        number={tender?.number || ""}
        agency={tender?.agencies && tender.agencies.length > 0 ? tender.agencies[0].name : ""}
        id={params.id}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento da Sessão</CardTitle>
            </CardHeader>
            <CardContent>
              <TenderSessionControls tenderId={params.id} />
            </CardContent>
          </Card>

          <Tabs defaultValue="chat">
            <TabsList>
              <TabsTrigger value="chat">Chat da Sessão</TabsTrigger>
              <TabsTrigger value="participants">Participantes</TabsTrigger>
            </TabsList>
            <TabsContent value="chat" className="h-[500px]">
              <SessionChat tenderId={params.id}/>
            </TabsContent>
            <TabsContent value="participants">
              <TenderSessionParticipants tenderId={params.id} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <SystemMessageForm tenderId={params.id} />

          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <a
                  href={`/tenders/${params.id}`}
                  className="text-[1rem] text-blue-600 hover:underline">
                  Detalhes da Licitação
                </a>
                <a
                  href={`/tenders/${params.id}/documents`}
                  className="text-[1rem] text-blue-600 hover:underline">
                  Documentos
                </a>
                <a
                  href={`/tenders/${params.id}/clarifications`}
                  className="text-[1rem] text-blue-600 hover:underline">
                  Esclarecimentos
                </a>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-[1rem] font-medium">Ações do Pregoeiro</h3>
                <div className="grid gap-2">
                  <a
                    href={`/tenders/${params.id}/proposals`}
                    className="text-[1rem] text-blue-600 hover:underline">
                    Gerenciar Propostas
                  </a>
                  <a
                    href={`/tenders/${params.id}/bids`}
                    className="text-[1rem] text-blue-600 hover:underline">
                    Gerenciar Lances
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
