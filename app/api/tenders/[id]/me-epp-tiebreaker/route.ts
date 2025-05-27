import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const { lotId, newPrice } = await request.json()

    if (!lotId || !newPrice) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get user profile to check if ME/EPP
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Check if user is ME/EPP
    const isMeEpp = profile.company_type === "me" || profile.company_type === "epp"

    if (!isMeEpp) {
      return NextResponse.json({ error: "Only ME/EPP companies can use this feature" }, { status: 403 })
    }

    // Get current proposal
    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .select("*")
      .eq("tender_id", params.id)
      .eq("lot_id", lotId)
      .eq("supplier_id", user.id)
      .single()

    if (proposalError || !proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 })
    }

    // Calculate percentage reduction
    const percentageReduction = ((proposal.total_value - newPrice) / proposal.total_value) * 100

    // Update proposal
    const { error: updateError } = await supabase
      .from("proposals")
      .update({
        total_value: newPrice,
        me_epp_tiebreaker: true,
        me_epp_tiebreaker_date: new Date().toISOString(),
        me_epp_tiebreaker_reduction: percentageReduction,
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposal.id)

    if (updateError) {
      return NextResponse.json({ error: "Failed to update proposal" }, { status: 500 })
    }

    // Create notification for agency
    const { data: tender } = await supabase.from("tenders").select("agency_id").eq("id", params.id).single()

    if (tender) {
      await supabase.from("notifications").insert({
        title: "Nova proposta de desempate ME/EPP",
        message: `Uma ME/EPP apresentou nova proposta no desempate ficto para o lote ${lotId}`,
        type: "info",
        user_id: tender.agency_id,
        source: "tenders",
        source_id: params.id,
        metadata: {
          tender_id: params.id,
          lot_id: lotId,
          proposal_id: proposal.id,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in ME/EPP tiebreaker:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
