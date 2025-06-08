import { Suspense } from "react"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { SessionChat } from "@/components/session-chat"
import { TenderSessionInfo } from "@/components/tender-session-info"
import { TenderSessionParticipants } from "@/components/tender-session-participants"
import { RegisterParticipationButton } from "@/components/register-participation-button"
import { TenderHeader } from "@/components/tender-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function TenderSessionPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies })

  // Buscar informações da licitação
  const { data: tender } = await supabase
    .from("tenders")
    .select(
      `
      id,
      title,
      number,
      status,
      opening_date,
      agencies!inner (
        name
      )
    `,
    )
    .eq("id", params.id)
    .single()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  let profile = null
  if (session) {
    const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()
    profile = data
  }

  // Buscar informações do pregoeiro da licitação
  const { data: tenderWithPregoeiro } = await supabase
    .from("tenders")
    .select(`
          id,
          title,
          number,
          status,
          opening_date,
          pregoeiro_id,
          agencies!inner (
            name
          )
        `)
    .eq("id", params.id)
    .single()

  const isPregoeiro = session?.user.id === tenderWithPregoeiro?.pregoeiro_id
  const isSupplier = profile?.role === "supplier"
  const isCitizen = profile?.role === "citizen"

  // Apenas pregoeiro e fornecedor podem interagir no chat
  const canInteractInChat = isPregoeiro || isSupplier

  // Verificar se a sessão está ativa
  const isSessionActive = tender?.status === "active" || tender?.status === "in_progress"

  return (
    <div className="container mx-auto py-6 space-y-6">
      <TenderHeader
        title={tenderWithPregoeiro?.title || "Sessão Pública"}
        number={tenderWithPregoeiro?.number || ""}
        agency={tenderWithPregoeiro?.agencies?.name || ""}
        id={params.id}
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
              <Suspense fallback={<div>Carregando informações da sessão...</div>}>
                <TenderSessionInfo tenderId={params.id} />
              </Suspense>

              {!isSessionActive && (
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <p className="text-[1rem] text-muted-foreground">
                    A sessão pública será iniciada em{" "}
                    {tender?.opening_date
                      ? new Date(tender.opening_date).toLocaleString("pt-BR")
                      : "data a ser definida"}
                    .
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
              <SessionChat canInteract={canInteractInChat} />
            </TabsContent>
            <TabsContent value="participants">
              <Suspense fallback={<div>Carregando participantes...</div>}>
                <TenderSessionParticipants tenderId={params.id} />
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isSupplier && <RegisterParticipationButton tenderId={params.id} />}

              <Separator />

              <div className="space-y-2">
                <h3 className="text-[1rem] font-medium">Links Rápidos</h3>
                <div className="grid gap-2">
                  <a href={`/tenders/${params.id}`} className="text-[1rem] text-blue-600 hover:underline">
                    Detalhes da Licitação
                  </a>
                  <a href={`/tenders/${params.id}/documents`} className="text-[1rem] text-blue-600 hover:underline">
                    Documentos
                  </a>
                  <a
                    href={`/tenders/${params.id}/clarifications`}
                    className="text-[1rem] text-blue-600 hover:underline"
                  >
                    Esclarecimentos
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
