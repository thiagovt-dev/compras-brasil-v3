"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Bell, CheckCircle, AlertTriangle, Info, CheckCheck } from "lucide-react"

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      title: "Nova licitação disponível",
      message:
        "Uma nova licitação compatível com seu perfil foi publicada: Pregão Eletrônico nº 001/2025 - Aquisição de equipamentos de informática",
      date: "12/05/2025",
      time: "14:30",
      read: false,
      type: "info" as const,
      link: "/dashboard/supplier/search",
    },
    {
      id: "2",
      title: "Proposta aceita",
      message:
        "Sua proposta para a licitação Pregão Eletrônico nº 002/2025 - Contratação de serviços de limpeza foi aceita. Você foi declarado vencedor do certame.",
      date: "11/05/2025",
      time: "10:15",
      read: false,
      type: "success" as const,
      link: "/dashboard/supplier/my-tenders/2",
    },
    {
      id: "3",
      title: "Prazo de envio de documentos",
      message:
        "O prazo para envio de documentos da licitação Pregão Eletrônico nº 003/2025 - Fornecimento de material de escritório está acabando. Você tem até 13/05/2025 às 18:00 para enviar os documentos.",
      date: "10/05/2025",
      time: "09:45",
      read: true,
      type: "warning" as const,
      link: "/dashboard/supplier/my-tenders/3",
    },
    {
      id: "4",
      title: "Sessão pública iniciada",
      message:
        "A sessão pública da licitação Pregão Eletrônico nº 004/2025 - Aquisição de veículos foi iniciada. Acesse a sessão para participar.",
      date: "09/05/2025",
      time: "10:00",
      read: true,
      type: "info" as const,
      link: "/dashboard/session/4",
    },
    {
      id: "5",
      title: "Recurso indeferido",
      message:
        "O recurso apresentado para a licitação Pregão Eletrônico nº 005/2024 - Serviços de consultoria foi indeferido. Confira os detalhes na página da licitação.",
      date: "08/05/2025",
      time: "16:20",
      read: true,
      type: "error" as const,
      link: "/dashboard/supplier/my-tenders/5",
    },
  ])

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !notification.read
    return notification.type === activeTab
  })

  const handleMarkAsRead = (id: string) => {
    setNotifications(
      notifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({
        ...notification,
        read: true,
      })),
    )
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <Bell className="h-5 w-5 text-red-500" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
          <p className="text-muted-foreground">Gerencie suas notificações</p>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="unread">Não lidas</TabsTrigger>
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="success">Sucesso</TabsTrigger>
            <TabsTrigger value="warning">Alertas</TabsTrigger>
            <TabsTrigger value="error">Erros</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="ml-4">
          <CheckCheck className="mr-2 h-4 w-4" />
          Marcar todas como lidas
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Notificações</CardTitle>
          <CardDescription>
            {filteredNotifications.length} notificação{filteredNotifications.length !== 1 ? "es" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length > 0 ? (
            <div className="divide-y">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex cursor-pointer gap-4 py-4 ${!notification.read ? "bg-blue-50/50" : ""}`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{notification.title}</h3>
                      {!notification.read && <div className="h-2 w-2 rounded-full bg-blue-500"></div>}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {notification.date} às {notification.time}
                      </p>
                      <Link href={notification.link}>
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                          Ver detalhes
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
              <p className="mt-4 text-muted-foreground">Nenhuma notificação encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
