import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { ProposalForm } from "@/components/proposal-form"

interface CreateProposalPageProps {
  searchParams: {
    tender?: string
  }
}

export default async function CreateProposalPage({ searchParams }: CreateProposalPageProps) {
  const supabase = createServerComponentClient({ cookies })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    redirect("/login")
  }

  // Check if tender ID is provided
  const tenderId = searchParams.tender
  if (!tenderId) {
    redirect("/dashboard/supplier/tenders")
  }

  // Check if tender exists and is active
  const { data: tender, error } = await supabase
    .from("tenders")
    .select("*")
    .eq("id", tenderId)
    .eq("status", "active")
    .single()

  if (error || !tender) {
    redirect("/dashboard/supplier/tenders")
  }

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Enviar Proposta</h1>
        <p className="text-muted-foreground">Preencha os dados da sua proposta para esta licitação</p>
      </div>

      <Suspense fallback={<div>Carregando...</div>}>
        <ProposalForm tenderId={tenderId} />
      </Suspense>
    </div>
  )
}
