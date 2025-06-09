import { type NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/utils/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; clarificationId: string } }
) {
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

    // Verificar se o usuário é pregoeiro ou autoridade superior
    const { data: profile } = await supabase
      .from("profiles")
      .select("profile_type")
      .eq("id", session.user.id)
      .single();

    if (!profile || (profile.profile_type !== "agency" && profile.profile_type !== "admin")) {
      return NextResponse.json(
        { error: "Apenas pregoeiros e autoridades superiores podem responder esclarecimentos" },
        { status: 403 }
      );
    }

    const { response } = await request.json();

    if (!response || response.trim() === "") {
      return NextResponse.json({ error: "A resposta é obrigatória" }, { status: 400 });
    }

    // Verificar se o esclarecimento existe
    const { data: clarification, error: clarificationError } = await supabase
      .from("clarifications")
      .select("id, user_id, tender_id")
      .eq("id", params.clarificationId)
      .eq("tender_id", params.id)
      .single();

    if (clarificationError || !clarification) {
      return NextResponse.json({ error: "Esclarecimento não encontrado" }, { status: 404 });
    }

    // Atualizar o esclarecimento com a resposta
    const { data, error } = await supabase
      .from("clarifications")
      .update({
        response,
        response_date: new Date().toISOString(),
        status: "answered",
        responded_by: session.user.id,
      })
      .eq("id", params.clarificationId)
      .select()
      .single();

    if (error) {
      console.error("Erro ao responder esclarecimento:", error);
      return NextResponse.json({ error: "Erro ao responder esclarecimento" }, { status: 500 });
    }

    // Buscar informações da licitação
    const { data: tender } = await supabase
      .from("tenders")
      .select("title")
      .eq("id", params.id)
      .single();

    // Notificar o usuário que fez o esclarecimento
    await createNotification({
      userId: clarification.user_id,
      title: "Resposta ao esclarecimento",
      message: `Seu pedido de esclarecimento para a licitação ${
        tender?.title || "N/A"
      } foi respondido`,
      type: "tender",
      entityId: params.id,
      entityType: "tender",
    });

    // Buscar fornecedores que cadastraram proposta
    const { data: suppliers } = await supabase
      .from("proposals")
      .select("supplier_id")
      .eq("tender_id", params.id)
      .is("deleted_at", null);

    // Notificar fornecedores que cadastraram proposta
    if (suppliers && suppliers.length > 0) {
      const uniqueSuppliers = [...new Set(suppliers.map((s) => s.supplier_id))];

      for (const supplierId of uniqueSuppliers) {
        if (supplierId !== clarification.user_id) {
          // Não notificar o autor do esclarecimento novamente
          await createNotification({
            userId: supplierId,
            title: "Resposta a esclarecimento",
            message: `Um esclarecimento para a licitação ${tender?.title || "N/A"} foi respondido`,
            type: "tender",
            entityId: params.id,
            entityType: "tender",
          });
        }
      }
    }

    // Registrar mensagem no chat da sessão
    await serverClient.from("session_messages").insert({
      tender_id: params.id,
      user_id: null, // Mensagem do sistema
      content: `Um esclarecimento foi respondido. Verifique a aba de esclarecimentos para mais detalhes.`,
      type: "system",
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Erro ao responder esclarecimento:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
