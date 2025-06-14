import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/supabase/auth-utils"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content, lotId, type = "chat", isPrivate = false, recipientId } = await request.json()
    const supabase = await createServerClient()

    // Criar mensagem
    const { data: message, error } = await supabase
      .from("dispute_messages")
      .insert({
        tender_id: params.id,
        lot_id: lotId,
        user_id: session.user.id,
        content,
        type,
        is_private: isPrivate,
        recipient_id: recipientId,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ message })
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createServerClient()
    const { data: messages, error } = await supabase.from("dispute_messages").select().eq("tender_id", params.id)

    if (error) throw error

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
