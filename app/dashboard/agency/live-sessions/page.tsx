import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getLiveSessionsForAgency } from "@/lib/supabase/server"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function AgencyLiveSessionsPage() {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role, agency_id").eq("id", session.user.id).single()

  if (profile?.role !== "agency" && profile?.role !== "admin") {
    redirect("/dashboard") // Or a more appropriate redirect for unauthorized roles
  }

  const { data: liveSessions, error } = await getLiveSessionsForAgency(profile?.agency_id)

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-6">
      <DashboardHeader title="Sessões ao Vivo" description="Acompanhe as licitações em andamento do seu órgão." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {error && (
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Erro ao carregar sessões</CardTitle>
              <CardDescription>Ocorreu um erro ao buscar as sessões ao vivo: {error.message}</CardDescription>
            </CardHeader>
          </Card>
        )}
        {liveSessions && liveSessions.length === 0 ? (
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Nenhuma sessão ao vivo encontrada</CardTitle>
              <CardDescription>Não há licitações do seu órgão em andamento no momento.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          liveSessions?.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <CardTitle>{session.title}</CardTitle>
                <CardDescription>Processo: {session.process_number}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Status: {session.status}</p>
                <p>Início: {new Date(session.start_date).toLocaleString()}</p>
                {/* Adicione mais detalhes da sessão conforme necessário */}
                <a href={`/dashboard/session/live/${session.id}`} className="text-blue-600 hover:underline mt-2 block">
                  Acessar Sala de Disputa
                </a>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
