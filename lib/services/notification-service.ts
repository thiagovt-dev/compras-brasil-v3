/**
 * Serviço para gerenciar notificações do sistema
 */

import { createClient } from "@supabase/supabase-js"

export interface NotificationData {
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  source: string
  sourceId?: string
  userId?: string
  roleFilter?: string[]
  metadata?: any
}

export class NotificationService {
  private supabase: any

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )
  }

  /**
   * Cria uma nova notificação
   */
  async createNotification(data: NotificationData): Promise<void> {
    try {
      const notification = {
        title: data.title,
        message: data.message,
        type: data.type,
        source: data.source,
        source_id: data.sourceId,
        user_id: data.userId,
        role_filter: data.roleFilter,
        metadata: data.metadata,
        read: false,
        created_at: new Date().toISOString(),
      }

      const { error } = await this.supabase.from("notifications").insert(notification)

      if (error) throw error
    } catch (error) {
      console.error("Erro ao criar notificação:", error)
    }
  }

  /**
   * Cria notificações para alterações em licitações
   */
  async notifyTenderChanges(tenders: any[], changeType: "created" | "updated" | "status_changed"): Promise<void> {
    try {
      // Para cada licitação, cria uma notificação apropriada
      for (const tender of tenders) {
        let title = ""
        let message = ""
        let type: "info" | "success" | "warning" | "error" = "info"

        switch (changeType) {
          case "created":
            title = "Nova Licitação Importada"
            message = `A licitação "${tender.title}" (${tender.number}) foi importada do +Brasil.`
            type = "info"
            break
          case "updated":
            title = "Licitação Atualizada"
            message = `A licitação "${tender.title}" (${tender.number}) foi atualizada com dados do +Brasil.`
            type = "info"
            break
          case "status_changed":
            title = "Status de Licitação Alterado"
            message = `O status da licitação "${tender.title}" (${tender.number}) foi alterado para "${tender.status}".`
            type = "warning"
            break
        }

        await this.createNotification({
          title,
          message,
          type,
          source: "brasil_integration",
          sourceId: tender.id,
          roleFilter: ["admin", "agency", "supplier"],
          metadata: {
            tenderId: tender.id,
            tenderNumber: tender.number,
            tenderTitle: tender.title,
            changeType,
          },
        })
      }
    } catch (error) {
      console.error("Erro ao criar notificações para alterações em licitações:", error)
    }
  }

  /**
   * Cria notificações para erros de sincronização
   */
  async notifySyncError(integration: string, error: any): Promise<void> {
    try {
      await this.createNotification({
        title: "Erro de Sincronização",
        message: `Ocorreu um erro durante a sincronização com ${integration}: ${error.message || "Erro desconhecido"}`,
        type: "error",
        source: `${integration}_integration`,
        roleFilter: ["admin"],
        metadata: {
          error: error.message || "Erro desconhecido",
          details: error.details,
          timestamp: new Date().toISOString(),
        },
      })
    } catch (err) {
      console.error("Erro ao criar notificação de erro de sincronização:", err)
    }
  }

  /**
   * Obtém notificações relacionadas a uma integração específica
   */
  async getIntegrationNotifications(integration: string, limit = 10): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from("notifications")
        .select("*")
        .eq("source", `${integration}_integration`)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error("Erro ao obter notificações da integração:", error)
      return []
    }
  }
}
