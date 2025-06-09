import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/supabase/auth-utils"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get("itemId")

    const supabase = await createServerClient()

    let query = supabase
      .from("tender_proposals")
      .select(`
        *,
        profiles:user_id (name, email)
      `)
      .eq("tender_id", params.id)
      .order("value", { ascending: true })

    if (itemId) {
      query = query.eq("tender_item_id", itemId)
    }

    const { data: proposals, error } = await query

    if (error) throw error

    return NextResponse.json({ proposals })
  } catch (error) {
    console.error("Erro ao buscar propostas:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { itemId, value } = await request.json()
    const supabase = await createServerClient()

    // Verificar se o usuário é fornecedor participante
    const { data: participation } = await supabase
      .from("tender_suppliers")
      .select("id")
      .eq("tender_id", params.id)
      .eq("user_id", session.user.id)
      .single()

    if (!participation) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Criar ou atualizar proposta
    const { data, error } = await supabase
      .from("tender_proposals")
      .upsert({
        tender_id: params.id,
        tender_item_id: itemId,
        user_id: session.user.id,
        value: Number.parseFloat(value),
        status: "active",
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ proposal: data })
  } catch (error) {
    console.error("Erro ao enviar proposta:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
