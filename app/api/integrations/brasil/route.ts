import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { BrasilApiService } from "@/lib/services/brasil-api"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verifica autenticação
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verifica permissões (apenas administradores e agências podem acessar)
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

    if (!profile || (profile.role !== "admin" && profile.role !== "agency")) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Obtém configurações da integração
    const { data: config, error: configError } = await supabase
      .from("integration_configs")
      .select("*")
      .eq("integration", "brasil")
      .single()

    if (configError && configError.code !== "PGRST116") {
      throw configError
    }

    // Obtém histórico de sincronização
    const brasilApi = new BrasilApiService({
      apiKey: config?.api_key || "",
    })

    const syncHistory = await brasilApi.getSyncHistory()

    return NextResponse.json({
      config: config || { integration: "brasil", enabled: false },
      syncHistory,
    })
  } catch (error: any) {
    console.error("Erro ao obter configurações da integração +Brasil:", error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}

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

    // Verifica permissões (apenas administradores e agências podem modificar)
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

    if (!profile || (profile.role !== "admin" && profile.role !== "agency")) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Obtém dados da requisição
    const body = await request.json()

    // Valida dados
    if (!body.config) {
      return NextResponse.json({ error: "Configuração inválida" }, { status: 400 })
    }

    // Salva configurações
    const { error: upsertError } = await supabase.from("integration_configs").upsert({
      integration: "brasil",
      api_key: body.config.api_key,
      enabled: body.config.enabled,
      auto_sync: body.config.auto_sync,
      sync_interval: body.config.sync_interval,
      import_tenders: body.config.import_tenders,
      export_tenders: body.config.export_tenders,
      import_documents: body.config.import_documents,
      notify_changes: body.config.notify_changes,
      updated_at: new Date().toISOString(),
      updated_by: session.user.id,
    })

    if (upsertError) throw upsertError

    return NextResponse.json({
      success: true,
      message: "Configurações salvas com sucesso",
    })
  } catch (error: any) {
    console.error("Erro ao salvar configurações da integração +Brasil:", error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}
