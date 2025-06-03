import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TenderList } from "@/components/tender-list"
import { Plus } from "lucide-react"
import { createServerClientWithAuth } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function AgencyActiveTendersPage() {
  const supabase = await createServerClientWithAuth();

  // // Get current user
  // const {
  //   data: { user },
  // } = await supabase.auth.getUser()

  // // Fetch user profile to get agency_id
  // const { data: profile } = await supabase.from("profiles").select("*").eq("id", user?.id).single()

  // Fetch initial tenders for SSR
  const { data: initialTenders } = await supabase
    .from("tenders")
    .select(
      `
      *,
      agency:agencies(name)
    `
    )
    .eq("status", "published")
    .order("opening_date", { ascending: true })
    .limit(12);

    console.log("Initial tenders:", initialTenders)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Licitações Ativas</h1>
          <p className="text-muted-foreground">Gerencie suas licitações em andamento</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/agency/create-tender">
            <Plus className="mr-2 h-4 w-4" />
            Nova Licitação
          </Link>
        </Button>
      </div>

      <TenderList initialTenders={initialTenders || []} showAgency={false} />
    </div>
  )
}
