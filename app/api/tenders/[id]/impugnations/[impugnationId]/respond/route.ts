import { type NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/utils/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; impugnationId: string } }
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
        { error: "Apenas pregoeiros e autoridades superiores podem responder impugnações" },
        { status: 403 }
      );
    }

    const { response } = await request.json();

    if (!response || response.trim() === "") {
      return NextResponse.json({ error: "A resposta é obrigatória" }, { status: 400 });
    }

    // Verificar se a impugnação existe
    const { data: impugnation, error: impugnationError } = await supabase
      .from("impugnations")
      .select("id, user_id, tender_id")
      .eq("id", params.impugnationId)
      .eq("tender_id", params.id)
      .single();

    if (impugnationError || !impugnation) {
      return NextResponse.json({ error: "Impugnação não encontrada" }, { status: 404 });
    }

    // Atualizar a impugnação com a resposta
    const { data, error } = await supabase
      .from("impugnations")
      .update({
        response,
        response_date: new Date().toISOString(),
        status: "answered",
        responded_by: session.user.id,
      })
      .eq("id", params.impugnationId)
      .select()
      .single();

    if (error) {
      console.error("Erro ao responder impugnação:", error);
      return NextResponse.json({ error: "Erro ao responder impugnação" }, { status: 500 });
    }

    // Buscar informações da licitação
    const { data: tender } = await supabase
      .from("tenders")
      .select("title")
      .eq("id", params.id)
      .single();

    // Notificar o usuário que fez a impugnação
    await createNotification({
      userId: impugnation.user_id,
      title: "Resposta à impugnação",
      message: `Sua impugnação para a licitação ${tender?.title || "N/A"} foi respondida`,
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
        if (supplierId !== impugnation.user_id) {
          // Não notificar o autor da impugnação novamente
          await createNotification({
            userId: supplierId,
            title: "Resposta à impugnação",
            message: `Uma impugnação para a licitação ${tender?.title || "N/A"} foi respondida`,
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
      content: `Uma impugnação foi respondida. Verifique a aba de impugnações para mais detalhes.`,
      type: "system",
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Erro ao responder impugnação:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
