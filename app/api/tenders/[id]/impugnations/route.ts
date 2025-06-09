import { type NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/utils/notifications";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const serverClient = createServerClient();

    // Verificar autenticação
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { content, attachmentUrl } = await request.json();

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { error: "O conteúdo da impugnação é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se a licitação existe
    const { data: tender, error: tenderError } = await supabase
      .from("tenders")
      .select("id, title, agency_id, impugnation_deadline")
      .eq("id", params.id)
      .single();

    if (tenderError || !tender) {
      return NextResponse.json({ error: "Licitação não encontrada" }, { status: 404 });
    }

    // Verificar se o prazo para impugnações já expirou
    const now = new Date();
    const deadline = new Date(tender.impugnation_deadline);

    if (now > deadline) {
      return NextResponse.json({ error: "O prazo para impugnações já expirou" }, { status: 400 });
    }

    // Inserir a impugnação
    const { data: impugnation, error } = await supabase
      .from("impugnations")
      .insert({
        tender_id: params.id,
        user_id: session.user.id,
        content,
        attachment_url: attachmentUrl || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar impugnação:", error);
      return NextResponse.json({ error: "Erro ao criar impugnação" }, { status: 500 });
    }

    // Buscar informações do pregoeiro e equipe de apoio
    const { data: tenderTeam } = await supabase
      .from("tender_team")
      .select("user_id")
      .eq("tender_id", params.id);

    // Notificar o pregoeiro e equipe de apoio
    if (tenderTeam && tenderTeam.length > 0) {
      for (const member of tenderTeam) {
        await sendNotification({
          userId: member.user_id,
          title: "Nova impugnação",
          message: `Uma nova impugnação foi registrada para a licitação ${tender.title}`,
          type: "tender",
          entityId: params.id,
          entityType: "tender",
        });
      }
    }

    // Notificar o administrador da agência
    const { data: agencyAdmins } = await supabase
      .from("profiles")
      .select("id")
      .eq("agency_id", tender.agency_id)
      .eq("profile_type", "agency")
      .eq("is_admin", true);

    if (agencyAdmins && agencyAdmins.length > 0) {
      for (const admin of agencyAdmins) {
        await sendNotification({
          userId: admin.id,
          title: "Nova impugnação",
          message: `Uma nova impugnação foi registrada para a licitação ${tender.title}`,
          type: "tender",
          entityId: params.id,
          entityType: "tender",
        });
      }
    }

    // Registrar mensagem no chat da sessão
    await serverClient.from("session_messages").insert({
      tender_id: params.id,
      user_id: null, // Mensagem do sistema
      content: `Uma nova impugnação foi registrada. Verifique a aba de impugnações para mais detalhes.`,
      type: "system",
    });

    return NextResponse.json({ success: true, data: impugnation });
  } catch (error) {
    console.error("Erro ao processar impugnação:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Buscar todas as impugnações da licitação
    const { data, error } = await supabase
      .from("impugnations")
      .select(
        `
        *,
        user:profiles(id, name, role)
      `
      )
      .eq("tender_id", params.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar impugnações:", error);
      return NextResponse.json({ error: "Erro ao buscar impugnações" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Erro ao buscar impugnações:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
