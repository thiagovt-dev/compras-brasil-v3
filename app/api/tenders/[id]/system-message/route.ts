import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/supabase/auth-utils"
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const supabase = await createServerClient();

    // Verificar se o usuário é pregoeiro ou membro da equipe
    const { data: teamMember } = await supabase
      .from("tender_team")
      .select("id, role")
      .eq("tender_id", params.id)
      .eq("user_id", session.user.id)
      .single()

    if (!teamMember || teamMember.role !== "pregoeiro") {
      return NextResponse.json({ error: "Apenas o pregoeiro pode enviar mensagens do sistema" }, { status: 403 })
    }

    const { content } = await request.json()

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Conteúdo da mensagem é obrigatório" }, { status: 400 })
    }

    // Inserir mensagem do sistema
    const { data, error } = await supabase
      .from("session_messages")
      .insert({
        tender_id: params.id,
        user_id: session.user.id,
        content,
        type: "system",
      })
      .select()

    if (error) {
      console.error("Erro ao inserir mensagem do sistema:", error)
      return NextResponse.json({ error: "Erro ao enviar mensagem do sistema" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: data[0] })
  } catch (error) {
    console.error("Erro ao processar solicitação:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
