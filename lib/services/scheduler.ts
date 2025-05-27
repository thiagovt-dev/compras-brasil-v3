/**
 * Serviço para agendamento de tarefas
 */

import { createClient } from "@supabase/supabase-js"
import { BrasilApiService } from "./brasil-api"

export interface ScheduledTask {
  id: string
  integration: string
  task: string
  scheduled_for: Date
  status: "pending" | "running" | "completed" | "failed"
  created_at: Date
  updated_at: Date
  result?: any
}

export class SchedulerService {
  private supabase: any

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )
  }

  /**
   * Agenda tarefas de sincronização com base nas configurações
   */
  async scheduleSyncTasks(): Promise<void> {
    try {
      // Busca todas as integrações ativas com sincronização automática
      const { data: configs, error: configError } = await this.supabase
        .from("integration_configs")
        .select("*")
        .eq("enabled", true)
        .eq("auto_sync", true)

      if (configError) throw configError

      // Para cada integração, agenda tarefas de sincronização
      for (const config of configs || []) {
        await this.scheduleIntegrationTasks(config)
      }
    } catch (error) {
      console.error("Erro ao agendar tarefas de sincronização:", error)
    }
  }

  /**
   * Agenda tarefas para uma integração específica
   */
  private async scheduleIntegrationTasks(config: any): Promise<void> {
    try {
      // Determina o próximo horário de sincronização com base no intervalo
      const nextSyncTime = this.calculateNextSyncTime(config.sync_interval)

      // Verifica se já existe uma tarefa agendada para este horário
      const { data: existingTasks, error: taskError } = await this.supabase
        .from("scheduled_tasks")
        .select("*")
        .eq("integration", config.integration)
        .eq("status", "pending")
        .gte("scheduled_for", new Date().toISOString())

      if (taskError) throw taskError

      // Se não houver tarefas pendentes, agenda novas tarefas
      if (!existingTasks || existingTasks.length === 0) {
        // Agenda tarefas com base nas configurações
        const tasks = []

        if (config.import_tenders) {
          tasks.push({
            integration: config.integration,
            task: "import_tenders",
            scheduled_for: nextSyncTime.toISOString(),
            status: "pending",
          })
        }

        if (config.export_tenders) {
          tasks.push({
            integration: config.integration,
            task: "export_tenders",
            scheduled_for: new Date(nextSyncTime.getTime() + 10 * 60000).toISOString(), // 10 minutos depois
            status: "pending",
          })
        }

        if (config.import_documents) {
          tasks.push({
            integration: config.integration,
            task: "sync_documents",
            scheduled_for: new Date(nextSyncTime.getTime() + 20 * 60000).toISOString(), // 20 minutos depois
            status: "pending",
          })
        }

        // Insere as tarefas no banco de dados
        if (tasks.length > 0) {
          const { error: insertError } = await this.supabase.from("scheduled_tasks").insert(tasks)

          if (insertError) throw insertError
        }
      }
    } catch (error) {
      console.error(`Erro ao agendar tarefas para integração ${config.integration}:`, error)
    }
  }

  /**
   * Calcula o próximo horário de sincronização com base no intervalo
   */
  private calculateNextSyncTime(interval: string): Date {
    const now = new Date()
    const nextSync = new Date(now)

    switch (interval) {
      case "hourly":
        // Próxima hora cheia
        nextSync.setHours(nextSync.getHours() + 1)
        nextSync.setMinutes(0)
        nextSync.setSeconds(0)
        nextSync.setMilliseconds(0)
        break
      case "daily":
        // Próximo dia às 3:00 da manhã (horário de baixo tráfego)
        nextSync.setDate(nextSync.getDate() + 1)
        nextSync.setHours(3)
        nextSync.setMinutes(0)
        nextSync.setSeconds(0)
        nextSync.setMilliseconds(0)
        break
      case "weekly":
        // Próximo domingo às 3:00 da manhã
        const daysUntilSunday = 7 - now.getDay()
        nextSync.setDate(nextSync.getDate() + daysUntilSunday)
        nextSync.setHours(3)
        nextSync.setMinutes(0)
        nextSync.setSeconds(0)
        nextSync.setMilliseconds(0)
        break
      default:
        // Padrão: próximo dia às 3:00 da manhã
        nextSync.setDate(nextSync.getDate() + 1)
        nextSync.setHours(3)
        nextSync.setMinutes(0)
        nextSync.setSeconds(0)
        nextSync.setMilliseconds(0)
    }

    return nextSync
  }

  /**
   * Executa tarefas agendadas que estão pendentes
   */
  async executePendingTasks(): Promise<void> {
    try {
      // Busca tarefas pendentes que já passaram do horário agendado
      const { data: pendingTasks, error: taskError } = await this.supabase
        .from("scheduled_tasks")
        .select("*")
        .eq("status", "pending")
        .lte("scheduled_for", new Date().toISOString())
        .order("scheduled_for", { ascending: true })
        .limit(10) // Processa no máximo 10 tarefas por vez

      if (taskError) throw taskError

      // Executa cada tarefa pendente
      for (const task of pendingTasks || []) {
        await this.executeTask(task)
      }
    } catch (error) {
      console.error("Erro ao executar tarefas pendentes:", error)
    }
  }

  /**
   * Executa uma tarefa específica
   */
  private async executeTask(task: any): Promise<void> {
    try {
      // Atualiza o status da tarefa para "running"
      const { error: updateError } = await this.supabase
        .from("scheduled_tasks")
        .update({ status: "running", updated_at: new Date().toISOString() })
        .eq("id", task.id)

      if (updateError) throw updateError

      // Obtém configurações da integração
      const { data: config, error: configError } = await this.supabase
        .from("integration_configs")
        .select("*")
        .eq("integration", task.integration)
        .single()

      if (configError) throw configError

      // Executa a tarefa com base no tipo
      let result
      if (task.integration === "brasil") {
        const brasilApi = new BrasilApiService({ apiKey: config.api_key })

        switch (task.task) {
          case "import_tenders":
            result = await brasilApi.importTenders()
            break
          case "export_tenders":
            result = await brasilApi.exportTenders()
            break
          case "sync_documents":
            result = await brasilApi.syncDocuments()
            break
          default:
            throw new Error(`Tipo de tarefa desconhecido: ${task.task}`)
        }
      } else {
        throw new Error(`Integração desconhecida: ${task.integration}`)
      }

      // Atualiza o status da tarefa para "completed"
      const { error: completeError } = await this.supabase
        .from("scheduled_tasks")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
          result,
        })
        .eq("id", task.id)

      if (completeError) throw completeError

      // Se a tarefa foi concluída com sucesso, agenda a próxima execução
      if (config.auto_sync) {
        await this.scheduleIntegrationTasks(config)
      }
    } catch (error: any) {
      console.error(`Erro ao executar tarefa ${task.id}:`, error)

      // Atualiza o status da tarefa para "failed"
      try {
        await this.supabase
          .from("scheduled_tasks")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
            result: { error: error.message || "Erro desconhecido" },
          })
          .eq("id", task.id)
      } catch (updateError) {
        console.error(`Erro ao atualizar status da tarefa ${task.id}:`, updateError)
      }
    }
  }

  /**
   * Obtém tarefas agendadas para uma integração específica
   */
  async getScheduledTasks(integration: string, limit = 10): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from("scheduled_tasks")
        .select("*")
        .eq("integration", integration)
        .order("scheduled_for", { ascending: false })
        .limit(limit)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error("Erro ao obter tarefas agendadas:", error)
      return []
    }
  }
}
