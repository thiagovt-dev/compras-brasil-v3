import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server" // Refactored import
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TenderActions } from "@/components/tender-actions"
import { TenderLots } from "@/components/tender-lots"
import { TenderDocuments } from "@/components/tender-documents"
import { TenderClarifications } from "@/components/tender-clarifications"
import { TenderImpugnations } from "@/components/tender-impugnations"
import { TenderProposals } from "@/components/tender-proposals"
import { Skeleton } from "@/components/ui/skeleton"
import { TenderTeamManagement } from "@/components/tender-team-management"
import { getAgencyUsers } from "@/app/dashboard/tenders/[id]/team-actions"
import type { Profile, Tender } from "@/types/supabase" // Imported Profile and Tender types

interface TenderDetailPageProps {
  params: {
    id: string
  }
}

export default async function TenderDetailPage({ params }: TenderDetailPageProps) {
  const supabase = createServerClient() // Refactored client initialization

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Get tender details
  const { data: tenderData, error } = await supabase
    .from("tenders")
    .select(`
      *,
      agency:agencies(*),
      lots:tender_lots(
        *,
        items:tender_items(*)
      )
    `)
    .eq("id", params.id)
    .single()

  if (error || !tenderData) {
    redirect("/dashboard/tenders")
  }

  const tender: Tender = tenderData // Explicitly type tender

  let profile: Profile | null = null // Explicitly type profile
  if (session) {
    const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

    profile = data
  }

  let agencyUsers: Profile[] = []
  if (profile?.role === "agency" && profile.agency_id) {
    const { users, error: usersFetchError } = await getAgencyUsers(profile.agency_id)
    if (!usersFetchError && users) {
      // Check if users is not null
      agencyUsers = users
    }
  } else if (profile?.role === "admin" && tender.agency_id) {
    // Admins can see all agency users
    const { users, error: usersFetchError } = await getAgencyUsers(tender.agency_id)
    if (!usersFetchError && users) {
      // Check if users is not null
      agencyUsers = users
    }
  }

  const isAgencyUser = profile?.role === "agency"
  const isSupplierUser = profile?.role === "supplier"
  const isAdminUser = profile?.role === "admin"

  // Check if user is the owner of the tender
  const isOwner = session?.user.id === tender.created_by

  // Determine if proposals tab should be shown
  const showProposals = (isAgencyUser && isOwner) || isAdminUser

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold">{tender.title}</h1>
          <p className="text-muted-foreground">Nº {tender.tender_number}</p>
        </div>

        <TenderActions tender={tender} />
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="lots">Lotes e Itens</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="clarifications">Esclarecimentos</TabsTrigger>
          <TabsTrigger value="impugnations">Impugnações</TabsTrigger>
          {showProposals && <TabsTrigger value="proposals">Propostas</TabsTrigger>}
          {isAgencyUser && <TabsTrigger value="team">Equipe</TabsTrigger>}
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          {/* Detalhes da licitação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-medium">Descrição</h2>
                <p className="whitespace-pre-line">{tender.description ?? "N/A"}</p>
              </div>

              <div>
                <h2 className="text-lg font-medium">Órgão</h2>
                <p>{tender.agency?.name}</p>
              </div>

              <div>
                <h2 className="text-lg font-medium">Modalidade</h2>
                <p>{tender.modality}</p>
              </div>

              <div>
                <h2 className="text-lg font-medium">Categoria</h2>
                <p>{tender.category}</p>
              </div>

              <div>
                <h2 className="text-lg font-medium">Critério de Julgamento</h2>
                <p>{tender.judgment_criteria}</p>
              </div>

              <div>
                <h2 className="text-lg font-medium">Modo de Disputa</h2>
                <p>{tender.dispute_mode}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-medium">Data de Abertura</h2>
                <p>{new Date(tender.opening_date).toLocaleString("pt-BR")}</p>
              </div>

              <div>
                <h2 className="text-lg font-medium">Prazo para Propostas</h2>
                <p>{new Date(tender.proposal_deadline).toLocaleString("pt-BR")}</p>
              </div>

              <div>
                <h2 className="text-lg font-medium">Prazo para Impugnações</h2>
                <p>{new Date(tender.impugnation_deadline).toLocaleString("pt-BR")}</p>
              </div>

              <div>
                <h2 className="text-lg font-medium">Valor Estimado</h2>
                <p>
                  {tender.is_value_secret
                    ? "Sigiloso"
                    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(tender.value || 0)}
                </p>
              </div>

              <div>
                <h2 className="text-lg font-medium">Status</h2>
                <p>{tender.status}</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="lots">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <TenderLots tender={tender || []} />
          </Suspense>
        </TabsContent>

        <TabsContent value="documents">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <TenderDocuments tender={tender} />
          </Suspense>
        </TabsContent>

        <TabsContent value="clarifications">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <TenderClarifications tenderId={tender.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="impugnations">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <TenderImpugnations tenderId={tender.id} />
          </Suspense>
        </TabsContent>

        {showProposals && (
          <TabsContent value="proposals">
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              <TenderProposals tenderId={tender.id} lots={tender.lots || []} isAgencyUser={isAgencyUser} />
            </Suspense>
          </TabsContent>
        )}
        {isAgencyUser && (
          <TabsContent value="team">
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              <TenderTeamManagement
                tender={tender}
                agencyUsers={agencyUsers}
                currentProfileId={session?.user.id || ""}
              />
            </Suspense>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
