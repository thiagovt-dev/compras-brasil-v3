import { type NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { SchedulerService } from "@/lib/services/scheduler";

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Verifica autenticação
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verifica permissões (apenas administradores e agências podem acessar)
    const { data: profile } = await supabase
      .from("profiles")
      .select("profile_type")
      .eq("id", session.user.id)
      .single();

    if (!profile || (profile.profile_type !== "admin" && profile.profile_type !== "agency")) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Obtém tarefas agendadas
    const scheduler = new SchedulerService();
    const tasks = await scheduler.getScheduledTasks("brasil");

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("Erro ao obter tarefas agendadas:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

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

    // Verifica permissões (apenas administradores e agências podem modificar)
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
    if (!body.action) {
      return NextResponse.json({ error: "Ação não especificada" }, { status: 400 });
    }

    const scheduler = new SchedulerService();

    // Executa a ação solicitada
    switch (body.action) {
      case "schedule":
        await scheduler.scheduleSyncTasks();
        return NextResponse.json({
          success: true,
          message: "Tarefas de sincronização agendadas com sucesso",
        });
      case "execute":
        await scheduler.executePendingTasks();
        return NextResponse.json({
          success: true,
          message: "Tarefas pendentes executadas com sucesso",
        });
      default:
        return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Erro ao gerenciar agendamento:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
