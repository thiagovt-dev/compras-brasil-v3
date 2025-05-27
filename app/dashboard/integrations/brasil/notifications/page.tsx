"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Bell,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
  RefreshCw,
  Calendar,
  CheckCheck,
} from "lucide-react"

export default function BrasilNotificationsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState("all") // all, unread, read

  // Fetch notifications
  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      // Em um ambiente real, faria uma chamada à API para buscar as notificações
      // Aqui estamos simulando os dados

      // Simula o tempo de carregamento
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Dados simulados para as notificações
      const mockNotifications = [
        {
          id: "1",
          title: "Nova Licitação Importada",
          message: 'A licitação "Aquisição de Equipamentos de Informática" (PE-001/2025) foi importada do +Brasil.',
          type: "info",
          source: "brasil_integration",
          source_id: "tender-1",
          read: false,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            tenderId: "tender-1",
            tenderNumber: "PE-001/2025",
            tenderTitle: "Aquisição de Equipamentos de Informática",
            changeType: "created",
          },
        },
        {
          id: "2",
          title: "Licitação Atualizada",
          message:
            'A licitação "Contratação de Serviços de Limpeza" (PE-002/2025) foi atualizada com dados do +Brasil.',
          type: "info",
          source: "brasil_integration",
          source_id: "tender-2",
          read: true,
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            tenderId: "tender-2",
            tenderNumber: "PE-002/2025",
            tenderTitle: "Contratação de Serviços de Limpeza",
            changeType: "updated",
          },
        },
        {
          id: "3",
          title: "Status de Licitação Alterado",
          message: 'O status da licitação "Construção de Escola Municipal" (CO-001/2025) foi alterado para "Suspenso".',
          type: "warning",
          source: "brasil_integration",
          source_id: "tender-3",
          read: false,
          created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          metadata: {
            tenderId: "tender-3",
            tenderNumber: "CO-001/2025",
            tenderTitle: "Construção de Escola Municipal",
            changeType: "status_changed",
            oldStatus: "Ativo",
            newStatus: "Suspenso",
          },
        },
        {
          id: "4",
          title: "Erro de Sincronização",
          message: "Ocorreu um erro durante a sincronização com +Brasil: Falha na conexão com a API",
          type: "error",
          source: "brasil_integration",
          read: false,
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          metadata: {
            error: "Falha na conexão com a API",
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          },
        },
        {
          id: "5",
          title: "Sincronização Concluída",
          message: "A sincronização com +Brasil foi concluída com sucesso. 15 licitações foram importadas.",
          type: "success",
          source: "brasil_integration",
          read: true,
          created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          metadata: {
            items_processed: 15,
            items_created: 10,
            items_updated: 5,
          },
        },
      ]

      setNotifications(mockNotifications)
    } catch (error) {
      console.error("Erro ao carregar notificações:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as notificações.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchNotifications()
    setIsRefreshing(false)
  }

  const handleMarkAllRead = async () => {
    try {
      // Em um ambiente real, faria uma chamada à API para marcar todas as notificações como lidas
      // Aqui estamos apenas atualizando o estado local

      setNotifications((prev) => prev.map((notification: any) => ({ ...notification, read: true })))

      toast({
        title: "Sucesso",
        description: "Todas as notificações foram marcadas como lidas.",
      })
    } catch (error) {
      console.error("Erro ao marcar notificações como lidas:", error)
      toast({
        title: "Erro",
        description: "Não foi possível marcar as notificações como lidas.",
        variant: "destructive",
      })
    }
  }

  const handleMarkRead = async (id: string) => {
    try {
      // Em um ambiente real, faria uma chamada à API para marcar a notificação como lida
      // Aqui estamos apenas atualizando o estado local

      setNotifications((prev) =>
        prev.map((notification: any) => (notification.id === id ? { ...notification, read: true } : notification)),
      )

      toast({
        title: "Sucesso",
        description: "Notificação marcada como lida.",
      })
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error)
      toast({
        title: "Erro",
        description: "Não foi possível marcar a notificação como lida.",
        variant: "destructive",
      })
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  // Filter notifications
  const filteredNotifications = notifications.filter((notification: any) => {
    if (filter === "all") return true
    if (filter === "unread") return !notification.read
    if (filter === "read") return notification.read
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notificações da Integração</h1>
          <p className="text-muted-foreground">Visualize notificações relacionadas à integração com o +Brasil</p>
        </div>
        <div className="mt-4 flex items-center gap-2 md:mt-0">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilter("all")}
              className={`${filter === "all" ? "bg-muted" : ""}`}
            >
              Todas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilter("unread")}
              className={`${filter === "unread" ? "bg-muted" : ""}`}
            >
              Não Lidas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilter("read")}
              className={`${filter === "read" ? "bg-muted" : ""}`}
            >
              Lidas
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={handleMarkAllRead}
            className="flex items-center gap-1"
            disabled={!notifications.some((n: any) => !n.read)}
          >
            <CheckCheck className="h-4 w-4" />
            <span>Marcar Todas como Lidas</span>
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-1">
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
          <CardDescription>
            {filter === "all"
              ? "Todas as notificações da integração com o +Brasil"
              : filter === "unread"
                ? "Notificações não lidas da integração com o +Brasil"
                : "Notificações lidas da integração com o +Brasil"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="space-y-4">
              {filteredNotifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 rounded-lg border p-4 ${!notification.read ? "bg-muted/30" : ""}`}
                >
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="font-medium">{notification.title}</h3>
                      <div className="mt-1 sm:mt-0">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(notification.created_at)}
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                    {notification.metadata && notification.metadata.tenderId && (
                      <div className="mt-2">
                        <Button variant="link" className="h-auto p-0 text-sm">
                          Ver Licitação
                        </Button>
                      </div>
                    )}
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkRead(notification.id)}
                      className="flex items-center gap-1"
                    >
                      <CheckCheck className="h-4 w-4" />
                      <span>Marcar como Lida</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <Bell className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Nenhuma notificação</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {filter === "all"
                  ? "Não há notificações da integração com o +Brasil."
                  : filter === "unread"
                    ? "Não há notificações não lidas da integração com o +Brasil."
                    : "Não há notificações lidas da integração com o +Brasil."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
