"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Filter, MessageSquare, Clock, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

// Sample data for support tickets
const tickets = [
  {
    id: "TICKET-1234",
    title: "Problema ao enviar proposta",
    description: "Estou tentando enviar uma proposta para a licitação #12345, mas recebo um erro.",
    status: "open",
    priority: "high",
    createdAt: "2023-05-10T14:30:00",
    updatedAt: "2023-05-10T15:45:00",
    user: {
      name: "João Silva",
      email: "joao.silva@empresa.com",
      avatar: "/placeholder.svg?height=32&width=32",
      role: "supplier",
    },
    messages: 3,
  },
  {
    id: "TICKET-1235",
    title: "Dúvida sobre documentação necessária",
    description: "Gostaria de saber quais documentos são necessários para participar da licitação #12346.",
    status: "in_progress",
    priority: "medium",
    createdAt: "2023-05-09T10:15:00",
    updatedAt: "2023-05-10T11:20:00",
    user: {
      name: "Maria Souza",
      email: "maria.souza@gmail.com",
      avatar: "/placeholder.svg?height=32&width=32",
      role: "citizen",
    },
    messages: 5,
  },
  {
    id: "TICKET-1236",
    title: "Erro ao acessar sistema",
    description: "Não consigo acessar o sistema desde ontem. Aparece uma mensagem de erro.",
    status: "open",
    priority: "high",
    createdAt: "2023-05-10T08:45:00",
    updatedAt: "2023-05-10T09:30:00",
    user: {
      name: "Carlos Oliveira",
      email: "carlos.oliveira@orgao.gov.br",
      avatar: "/placeholder.svg?height=32&width=32",
      role: "agency",
    },
    messages: 2,
  },
  {
    id: "TICKET-1237",
    title: "Solicitação de prorrogação de prazo",
    description: "Precisamos solicitar uma prorrogação de prazo para a licitação #12347.",
    status: "resolved",
    priority: "low",
    createdAt: "2023-05-08T16:20:00",
    updatedAt: "2023-05-09T14:10:00",
    user: {
      name: "Ana Pereira",
      email: "ana.pereira@fornecedor.com",
      avatar: "/placeholder.svg?height=32&width=32",
      role: "supplier",
    },
    messages: 8,
  },
  {
    id: "TICKET-1238",
    title: "Problema com upload de arquivos",
    description: "Não consigo fazer upload de arquivos grandes no sistema.",
    status: "in_progress",
    priority: "medium",
    createdAt: "2023-05-09T13:40:00",
    updatedAt: "2023-05-10T10:15:00",
    user: {
      name: "Roberto Santos",
      email: "roberto.santos@empresa.com",
      avatar: "/placeholder.svg?height=32&width=32",
      role: "supplier",
    },
    messages: 4,
  },
]

export default function SupportManagePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // Filter tickets based on search query and active tab
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user.email.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === "all") return matchesSearch
    if (activeTab === "open") return matchesSearch && ticket.status === "open"
    if (activeTab === "in_progress") return matchesSearch && ticket.status === "in_progress"
    if (activeTab === "resolved") return matchesSearch && ticket.status === "resolved"

    return matchesSearch
  })

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "in_progress":
        return "bg-blue-500 hover:bg-blue-600"
      case "resolved":
        return "bg-green-500 hover:bg-green-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  // Get priority badge color
  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500 hover:bg-red-600"
      case "medium":
        return "bg-orange-500 hover:bg-orange-600"
      case "low":
        return "bg-green-500 hover:bg-green-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Get role label
  const getRoleLabel = (role: string) => {
    switch (role) {
      case "citizen":
        return "Cidadão"
      case "supplier":
        return "Fornecedor"
      case "agency":
        return "Órgão Público"
      default:
        return role
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gerenciamento de Suporte</h2>
        <div className="flex items-center gap-2">
          <Button>Relatórios</Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tickets..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon">
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="open">Abertos</TabsTrigger>
          <TabsTrigger value="in_progress">Em Andamento</TabsTrigger>
          <TabsTrigger value="resolved">Resolvidos</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader className="px-6 py-4">
              <div className="flex items-center justify-between">
                <CardTitle>Tickets de Suporte</CardTitle>
                <CardDescription>{filteredTickets.length} tickets encontrados</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-6">
              <div className="space-y-4">
                {filteredTickets.length > 0 ? (
                  filteredTickets.map((ticket) => (
                    <div key={ticket.id} className="flex flex-col space-y-2 rounded-lg border p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{ticket.title}</h3>
                          <Badge variant="outline">{ticket.id}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={cn(getPriorityBadgeColor(ticket.priority))}>
                            {ticket.priority === "high" && "Alta"}
                            {ticket.priority === "medium" && "Média"}
                            {ticket.priority === "low" && "Baixa"}
                          </Badge>
                          <Badge className={cn(getStatusBadgeColor(ticket.status))}>
                            {ticket.status === "open" && "Aberto"}
                            {ticket.status === "in_progress" && "Em Andamento"}
                            {ticket.status === "resolved" && "Resolvido"}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">{ticket.description}</p>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={ticket.user.avatar || "/placeholder.svg"} alt={ticket.user.name} />
                            <AvatarFallback>{ticket.user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="text-sm">
                            <span className="font-medium">{ticket.user.name}</span>
                            <span className="ml-2 text-muted-foreground">({getRoleLabel(ticket.user.role)})</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <MessageSquare className="mr-1 h-4 w-4" />
                            {ticket.messages}
                          </div>
                          <div className="flex items-center">
                            <Clock className="mr-1 h-4 w-4" />
                            {formatDate(ticket.updatedAt)}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                        <Button size="sm">Responder</Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                    <h3 className="mt-4 text-lg font-medium">Nenhum ticket encontrado</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Tente ajustar os filtros ou a busca.</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <div className="flex items-center justify-between w-full">
                <div className="text-sm text-muted-foreground">
                  Mostrando {filteredTickets.length} de {tickets.length} tickets
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Anterior
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Próximo
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="open" className="space-y-4">
          {/* Similar content as "all" tab but filtered for open tickets */}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4">
          {/* Similar content as "all" tab but filtered for in_progress tickets */}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {/* Similar content as "all" tab but filtered for resolved tickets */}
        </TabsContent>
      </Tabs>
    </div>
  )
}
