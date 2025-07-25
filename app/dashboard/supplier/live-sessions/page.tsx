import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLiveSessionsForSupplier } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SupplierLiveSessionsPage() {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_type")
    .eq("id", session.user.id)
    .single();

  if (profile?.profile_type !== "supplier") {
    redirect("/dashboard"); // Or a more appropriate redirect for unauthorized roles
  }

  const { data: liveSessions, error } = await getLiveSessionsForSupplier(session.user.id);

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-6">
      <DashboardHeader
        title="Sessões ao Vivo"
        description="Acompanhe as licitações em andamento que você está participando."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {error && (
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Erro ao carregar sessões</CardTitle>
              <CardDescription>
                Ocorreu um erro ao buscar as sessões ao vivo: {error.message}
              </CardDescription>
            </CardHeader>
          </Card>
        )}
        {liveSessions && liveSessions.length === 0 ? (
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Nenhuma sessão ao vivo encontrada</CardTitle>
              <CardDescription>
                Não há licitações em andamento que você esteja participando no momento.
              </CardDescription>
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
                <a
                  href={`/dashboard/session/live/${session.id}`}
                  className="text-blue-600 hover:underline mt-2 block">
                  Acessar Sala de Disputa
                </a>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
