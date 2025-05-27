import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { BrasilApiService } from "@/lib/services/brasil-api"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verifica autenticação
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verifica permissões (apenas administradores e agências podem sincronizar)
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

    if (!profile || (profile.role !== "admin" && profile.role !== "agency")) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Obtém dados da requisição
    const body = await request.json()

    // Obtém configurações da integração
    const { data: config, error: configError } = await supabase
      .from("integration_configs")
      .select("*")
      .eq("integration", "brasil")
      .single()

    if (configError) throw configError

    if (!config || !config.api_key) {
      return NextResponse.json({ error: "Integração não configurada" }, { status: 400 })
    }

    // Inicializa o serviço de API
    const brasilApi = new BrasilApiService({ apiKey: config.api_key })

    // Executa a sincronização solicitada
    let result

    switch (body.action) {
      case "import":
        result = await brasilApi.importTenders(body.options)
        break
      case "export":
        result = await brasilApi.exportTenders(body.options)
        break
      case "documents":
        result = await brasilApi.syncDocuments()
        break
      default:
        return NextResponse.json({ error: "Ação de sincronização inválida" }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Erro ao sincronizar dados com +Brasil:", error)
    return NextResponse.json({ success: false, message: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}
