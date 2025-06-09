"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseClient } from "@/lib/supabase/client-singleton"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface LiveSession {
  id: string
  title: string
  process_number: string
  status: string
  start_date: string
}

export default function AgencyLiveSessionsPage() {
  const [liveSessions, setLiveSessions] = useState<LiveSession[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    async function fetchData() {
      try {
        // Get current session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.push("/login")
          return
        }

        console.log("Session:", session)

        // Get user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("profile_type, agency_id")
          .eq("id", session.user.id)
          .single()

        console.log("Profile:", profile)

        if (profile?.profile_type !== "agency" && profile?.profile_type !== "admin") {
          router.push("/dashboard")
          return
        }

        // Get live sessions for agency
        if (profile?.agency_id) {
          const { data, error: sessionError } = await supabase
            .from("tenders")
            .select("*")
            .eq("agency_id", profile.agency_id)
            .in("status", ["active", "in_progress", "live"])
            .order("start_date", { ascending: false })

          if (sessionError) {
            setError(sessionError.message)
          } else {
            setLiveSessions(data || [])
          }
        } else {
          setLiveSessions([])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-6">
        <DashboardHeader title="Sessões ao Vivo" description="Acompanhe as licitações em andamento do seu órgão." />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Carregando...</CardTitle>
              <CardDescription>Buscando as sessões ao vivo...</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-6">
      <DashboardHeader title="Sessões ao Vivo" description="Acompanhe as licitações em andamento do seu órgão." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {error && (
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Erro ao carregar sessões</CardTitle>
              <CardDescription>Ocorreu um erro ao buscar as sessões ao vivo: {error}</CardDescription>
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
