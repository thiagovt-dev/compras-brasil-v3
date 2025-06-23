export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/utils/notifications";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const tenderId = params.id;

    // Buscar esclarecimentos sem relacionamento primeiro
    const { data: clarifications, error } = await supabase
      .from("clarifications")
      .select("*")
      .eq("tender_id", tenderId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar esclarecimentos:", error);
      return NextResponse.json({ error: "Erro ao buscar esclarecimentos" }, { status: 500 });
    }

    // Se não há esclarecimentos, retornar array vazio
    if (!clarifications || clarifications.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Buscar dados dos usuários na tabela profiles
    const userIds = clarifications.map(clarification => clarification.user_id).filter(Boolean);
    let usersData: any = [];

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email, profile_type")
        .in("id", userIds);
      
      usersData = profiles || [];
    }

    // Combinar dados dos esclarecimentos com dados dos usuários
    const dataWithUsers = clarifications.map(clarification => ({
      ...clarification,
      user: usersData.find((user: any) => user.id === clarification.user_id) || null
    }));

    return NextResponse.json({ data: dataWithUsers });
  } catch (error) {
    console.error("Erro ao buscar esclarecimentos:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const serverClient = createServerClient();
    const tenderId = params.id;

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
        { error: "O conteúdo do esclarecimento é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se a licitação existe
    const { data: tender, error: tenderError } = await supabase
      .from("tenders")
      .select("id, title, agency_id, impugnation_deadline")
      .eq("id", tenderId)
      .single();

    if (tenderError || !tender) {
      return NextResponse.json({ error: "Licitação não encontrada" }, { status: 404 });
    }

    // Verificar se o prazo para esclarecimentos já expirou
    const now = new Date();
    const deadline = new Date(tender.impugnation_deadline);

    if (now > deadline) {
      return NextResponse.json(
        { error: "O prazo para esclarecimentos já expirou" },
        { status: 400 }
      );
    }

    // Inserir o esclarecimento
    const { data: clarification, error } = await supabase
      .from("clarifications")
      .insert({
        tender_id: tenderId,
        user_id: session.user.id,
        content,
        attachment_url: attachmentUrl || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar esclarecimento:", error);
      return NextResponse.json({ error: "Erro ao criar esclarecimento" }, { status: 500 });
    }

    // Buscar informações do pregoeiro e equipe de apoio
    const { data: tenderTeam } = await supabase
      .from("tender_team")
      .select("user_id")
      .eq("tender_id", tenderId);

    // Notificar o pregoeiro e equipe de apoio
    if (tenderTeam && tenderTeam.length > 0) {
      for (const member of tenderTeam) {
        await sendNotification({
          userId: member.user_id,
          title: "Novo pedido de esclarecimento",
          message: `Um novo pedido de esclarecimento foi registrado para a licitação ${tender.title}`,
          type: "tender",
          entityId: tenderId,
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
          title: "Novo pedido de esclarecimento",
          message: `Um novo pedido de esclarecimento foi registrado para a licitação ${tender.title}`,
          type: "tender",
          entityId: tenderId,
          entityType: "tender",
        });
      }
    }

    // Registrar mensagem no chat da sessão
    await serverClient.from("session_messages").insert({
      tender_id: tenderId,
      user_id: null, // Mensagem do sistema
      content: `Um novo pedido de esclarecimento foi registrado. Verifique a aba de esclarecimentos para mais detalhes.`,
      type: "system",
    });

    return NextResponse.json({ success: true, data: clarification });
  } catch (error) {
    console.error("Erro ao processar esclarecimento:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}