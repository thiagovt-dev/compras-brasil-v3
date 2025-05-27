import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TenderList } from "@/components/tender-list"
import { Plus } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AgencyDraftTendersPage() {
  const supabase = createServerComponentClient({ cookies })

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch initial tenders for SSR
  const { data: initialTenders } = await supabase
    .from("tenders")
    .select(
      `
      *,
      agency:agencies(name)
    `,
    )
    .eq("status", "draft")
    .eq("created_by", user?.id)
    .order("created_at", { ascending: false })
    .limit(12)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rascunhos</h1>
          <p className="text-muted-foreground">Licitações em rascunho que ainda não foram publicadas</p>
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
