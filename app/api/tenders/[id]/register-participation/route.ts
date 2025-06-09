import { type NextRequest, NextResponse } from "next/server";
import { sendNotification } from "@/lib/utils/notifications";
import { getSession } from "@/lib/supabase/auth-utils";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const supabase = await createServerClient();

    // Verificar se o usuário é um fornecedor
    const { data: profile } = await supabase
      .from("profiles")
      .select("profile_type")
      .eq("id", session.user.id)
      .single();

    if (!profile || profile.profile_type !== "supplier") {
      return NextResponse.json(
        { error: "Apenas fornecedores podem participar de licitações" },
        { status: 403 }
      );
    }

    // Verificar se o fornecedor já está registrado
    const { data: existingParticipation } = await supabase
      .from("tender_suppliers")
      .select("id")
      .eq("tender_id", params.id)
      .eq("supplier_id", session.user.id)
      .single();

    if (existingParticipation) {
      return NextResponse.json(
        { error: "Fornecedor já está registrado como participante" },
        { status: 400 }
      );
    }

    // Registrar participação
    const { data, error } = await supabase
      .from("tender_suppliers")
      .insert({
        tender_id: params.id,
        supplier_id: session.user.id,
      })
      .select();

    if (error) {
      console.error("Erro ao registrar participação:", error);
      return NextResponse.json({ error: "Erro ao registrar participação" }, { status: 500 });
    }

    // Buscar informações da licitação para a notificação
    const { data: tender } = await supabase
      .from("tenders")
      .select("title, number")
      .eq("id", params.id)
      .single();

    // Enviar notificação para a equipe da licitação
    if (tender) {
      const { data: teamMembers } = await supabase
        .from("tender_team")
        .select("user_id")
        .eq("tender_id", params.id);

      if (teamMembers && teamMembers.length > 0) {
        for (const member of teamMembers) {
          await sendNotification({
            userId: member.user_id,
            title: "Novo Participante",
            message: `Um novo fornecedor registrou participação na licitação ${tender.number} - ${tender.title}`,
            type: "tender",
            entityId: params.id,
            entityType: "tender",
          });
        }
      }
    }

    // Enviar mensagem do sistema no chat da sessão
    await supabase.from("session_messages").insert({
      tender_id: params.id,
      user_id: session.user.id,
      content: "Um novo fornecedor registrou participação na licitação.",
      type: "system",
    });

    return NextResponse.json({ success: true, participation: data[0] });
  } catch (error) {
    console.error("Erro ao processar solicitação:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
