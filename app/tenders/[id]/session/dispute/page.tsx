import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/supabase/auth-utils"
import DisputeRoom from "@/components/dispute-room"

export default async function DisputePage({ params }: { params: { id: string } }) {
  const session = await getSession()

  if (!session) {
    redirect(`/login?callbackUrl=/tenders/${params.id}/session/dispute`)
  }

  const supabase = await createServerClient()

  // Buscar informações da licitação
  const { data: tender, error } = await supabase
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

  if (error || !tender) {
    redirect(`/tenders/${params.id}/session`)
  }

  // Buscar perfil do usuário
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  // Verificar se o usuário é pregoeiro
  const { data: teamMember } = await supabase
    .from("tender_team")
    .select("id, role")
    .eq("tender_id", params.id)
    .eq("user_id", session.user.id)
    .single()

  const isAuctioneer = teamMember?.role === "pregoeiro"

  // Verificar se o usuário é fornecedor participante
  const { data: supplierParticipation } = await supabase
    .from("tender_suppliers")
    .select("*")
    .eq("tender_id", params.id)
    .eq("user_id", session.user.id)
    .single()

  const isSupplier = !!supplierParticipation

  // Se não for pregoeiro nem fornecedor participante, redirecionar
  if (!isAuctioneer && !isSupplier) {
    redirect(`/tenders/${params.id}/session`)
  }

  return (
    <DisputeRoom
      tender={tender}
      isAuctioneer={isAuctioneer}
      isSupplier={isSupplier}
      userId={session.user.id}
      profile={profile}
    />
  )
}
