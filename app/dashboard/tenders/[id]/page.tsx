import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import TenderDetails from "@/components/tender-details"


interface TenderDetailPageProps {
  params: {
    id: string
  }
}

export default async function TenderDetailPage({ params }: TenderDetailPageProps) {
  const supabase = createServerComponentClient({ cookies })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Get user profile if authenticated
  let profile = null
  if (session) {
    const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

    profile = data
  }

  // Get tender details
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
    redirect("/dashboard/tenders")
  }

  const { data: tenderTeam } = await supabase
    .from("tender_team")
    .select("user_id, role")
    .eq("tender_id", params.id);

  // Check if current user is auctioneer
  const isAuctioneer = tenderTeam?.some(
    (member) => member.user_id === session?.user.id && member.role === "auctioneer"
  );


  const isAgencyUser = profile?.role === "agency"
  const isSupplierUser = profile?.role === "supplier"
  const isAdminUser = profile?.role === "admin"

  // Check if user is the owner of the tender
  const isOwner = session?.user.id === tender.created_by

  // Determine if proposals tab should be shown
  const showProposals = (isAgencyUser && isOwner) || isAdminUser
  return (
<TenderDetails tender={tender} isAgencyUser={isAgencyUser} showProposals={showProposals} isAuctioneer={isAuctioneer as boolean} isAdmin={isAdminUser}/>
  );
}
