import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { TenderList } from "@/components/tender-list"

export const dynamic = "force-dynamic"

export default async function TendersPage() {
  const supabase = createServerComponentClient({ cookies })

  // Fetch initial tenders for SSR
  const { data: initialTenders } = await supabase
    .from("tenders")
    .select(
      `
      *,
      agency:agencies(name)
    `,
    )
    .eq("status", "active")
    .order("opening_date", { ascending: true })
    .limit(12)

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Licitações</h1>
        <p className="text-muted-foreground">
          Encontre licitações abertas e participe dos processos de compras públicas
        </p>
      </div>

      <TenderList initialTenders={initialTenders || []} />
    </div>
  )
}
