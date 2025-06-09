import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/supabase/auth-utils"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createServerClient()

    // Buscar status da disputa
    const { data: dispute, error } = await supabase
      .from("tender_disputes")
      .select("*")
      .eq("tender_id", params.id)
      .single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return NextResponse.json({ dispute })
  } catch (error) {
    console.error("Erro ao buscar disputa:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action, itemId, status } = await request.json()
    const supabase = await createServerClient()

    // Verificar se o usuário é pregoeiro
    const { data: teamMember } = await supabase
      .from("tender_team")
      .select("role")
      .eq("tender_id", params.id)
      .eq("user_id", session.user.id)
      .single()

    if (!teamMember || teamMember.role !== "pregoeiro") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (action === "start") {
      // Iniciar disputa
      const { data, error } = await supabase
        .from("tender_disputes")
        .upsert({
          tender_id: params.id,
          status: "open",
          active_item_id: itemId,
          created_by: session.user.id,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ dispute: data })
    } else if (action === "update_status") {
      // Atualizar status
      const { data, error } = await supabase
        .from("tender_disputes")
        .update({ status })
        .eq("tender_id", params.id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ dispute: data })
    } else if (action === "select_item") {
      // Selecionar item
      const { data, error } = await supabase
        .from("tender_disputes")
        .update({ active_item_id: itemId })
        .eq("tender_id", params.id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ dispute: data })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Erro ao gerenciar disputa:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
