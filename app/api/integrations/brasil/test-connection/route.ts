import { type NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { BrasilApiService } from "@/lib/services/brasil-api";

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Verifica autenticação
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verifica permissões (apenas administradores e agências podem testar)
    const { data: profile } = await supabase
      .from("profiles")
      .select("profile_type")
      .eq("id", session.user.id)
      .single();

    if (!profile || (profile.profile_type !== "admin" && profile.profile_type !== "agency")) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Obtém dados da requisição
    const body = await request.json();

    // Valida dados
    if (!body.apiKey) {
      return NextResponse.json({ error: "Chave de API não fornecida" }, { status: 400 });
    }

    // Testa conexão
    const brasilApi = new BrasilApiService({ apiKey: body.apiKey });
    const result = await brasilApi.testConnection();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Erro ao testar conexão com +Brasil:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
