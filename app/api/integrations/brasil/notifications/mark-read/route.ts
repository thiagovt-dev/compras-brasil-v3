import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, all = false, source } = body

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )

    if (all) {
      // Marcar todas as notificações como lidas
      const query = supabase.from("notifications").update({ read: true })

      if (source) {
        query.eq("source", source)
      }

      const { error } = await query

      if (error) {
        console.error("Erro ao marcar todas as notificações como lidas:", error)
        return NextResponse.json({ error: "Erro ao marcar notificações como lidas" }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "Todas as notificações foram marcadas como lidas" })
    } else if (id) {
      // Marcar uma notificação específica como lida
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id)

      if (error) {
        console.error("Erro ao marcar notificação como lida:", error)
        return NextResponse.json({ error: "Erro ao marcar notificação como lida" }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "Notificação marcada como lida" })
    } else {
      return NextResponse.json({ error: "ID da notificação não fornecido" }, { status: 400 })
    }
  } catch (error) {
    console.error("Erro ao processar requisição:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
