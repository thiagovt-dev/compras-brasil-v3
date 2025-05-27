import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const source = searchParams.get("source") || "brasil_integration"
    const userId = searchParams.get("userId")
    const read = searchParams.get("read")

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("source", source)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (userId) {
      query = query.eq("user_id", userId)
    }

    if (read !== null) {
      query = query.eq("read", read === "true")
    }

    const { data, error } = await query

    if (error) {
      console.error("Erro ao buscar notificações:", error)
      return NextResponse.json({ error: "Erro ao buscar notificações" }, { status: 500 })
    }

    return NextResponse.json({ notifications: data })
  } catch (error) {
    console.error("Erro ao processar requisição:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, message, type, source, sourceId, userId, roleFilter, metadata } = body

    if (!title || !message || !type || !source) {
      return NextResponse.json({ error: "Campos obrigatórios não fornecidos" }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )

    const notification = {
      title,
      message,
      type,
      source,
      source_id: sourceId,
      user_id: userId,
      role_filter: roleFilter,
      metadata,
      read: false,
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("notifications").insert(notification).select()

    if (error) {
      console.error("Erro ao criar notificação:", error)
      return NextResponse.json({ error: "Erro ao criar notificação" }, { status: 500 })
    }

    return NextResponse.json({ notification: data[0] })
  } catch (error) {
    console.error("Erro ao processar requisição:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
