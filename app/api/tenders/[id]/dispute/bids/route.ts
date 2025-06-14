import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/supabase/auth-utils"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { lotId, value } = await request.json()
    const supabase = await createServerClient()

    // Verificar se o usuário é fornecedor
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

    if (!profile || profile.role !== "supplier") {
      return NextResponse.json({ error: "Only suppliers can place bids" }, { status: 403 })
    }

    // Verificar se a disputa está aberta
    const { data: dispute } = await supabase
      .from("tender_disputes")
      .select("status, active_lot_id")
      .eq("tender_id", params.id)
      .single()

    if (!dispute || dispute.status !== "open" || dispute.active_lot_id !== lotId) {
      return NextResponse.json({ error: "Bidding not available for this lot" }, { status: 400 })
    }

    // Verificar valor mínimo
    const { data: currentBids } = await supabase
      .from("tender_bids")
      .select("value")
      .eq("tender_id", params.id)
      .eq("lot_id", lotId)
      .eq("status", "active")
      .order("value", { ascending: true })
      .limit(1)

    const { data: lotConfig } = await supabase.from("tender_lots").select("bid_interval").eq("id", lotId).single()

    const bidInterval = lotConfig?.bid_interval || 0.01
    const minValue = currentBids && currentBids.length > 0 ? currentBids[0].value - bidInterval : value

    if (value >= minValue) {
      return NextResponse.json({ error: "Bid value must be lower than current minimum" }, { status: 400 })
    }

    // Criar lance
    const { data: bid, error } = await supabase
      .from("tender_bids")
      .insert({
        tender_id: params.id,
        lot_id: lotId,
        user_id: session.user.id,
        value: Number.parseFloat(value),
        status: "active",
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ bid })
  } catch (error) {
    console.error("Erro ao criar lance:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const lotId = searchParams.get("lotId")

    if (!lotId) {
      return NextResponse.json({ error: "Lot ID is required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const { data: bids, error } = await supabase
      .from("tender_bids")
      .select(`
        *,
        profiles:user_id(name, email)
      `)
      .eq("tender_id", params.id)
      .eq("lot_id", lotId)
      .eq("status", "active")
      .order("value", { ascending: true })

    if (error) throw error

    return NextResponse.json({ bids })
  } catch (error) {
    console.error("Erro ao buscar lances:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
