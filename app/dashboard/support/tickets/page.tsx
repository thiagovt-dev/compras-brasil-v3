"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, CheckCircle, Clock, Filter, MessageSquare, Plus, Search } from "lucide-react"

// Sample data - in a real app, this would come from an API
const tickets = [
  {
    id: "TKT-1001",
    subject: "Não consigo acessar minha conta",
    status: "open",
    priority: "high",
    category: "Acesso",
    user: { name: "João Silva", email: "joao.silva@example.com", avatar: "/placeholder.svg?height=32&width=32" },
    createdAt: "2023-05-15T10:30:00Z",
    updatedAt: "2023-05-15T14:45:00Z",
    assignedTo: { name: "Ana Souza", email: "ana.souza@example.com", avatar: "/placeholder.svg?height=32&width=32" },
    messages: 3,
  },
  {
    id: "TKT-1002",
    subject: "Erro ao enviar proposta para licitação",
    status: "in_progress",
    priority: "medium",
    category: "Licitações",
    user: {
      name: "Maria Oliveira",
      email: "maria.oliveira@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    createdAt: "2023-05-14T09:15:00Z",
    updatedAt: "2023-05-15T11:20:00Z",
    assignedTo: {
      name: "Carlos Mendes",
      email: "carlos.mendes@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    messages: 5,
  },
  {
    id: "TKT-1003",
    subject: "Dúvida sobre documentação necessária",
    status: "waiting",
    priority: "low",
    category: "Documentação",
    user: { name: "Pedro Santos", email: "pedro.santos@example.com", avatar: "/placeholder.svg?height=32&width=32" },
    createdAt: "2023-05-13T14:20:00Z",
    updatedAt: "2023-05-14T10:30:00Z",
    assignedTo: { name: "Ana Souza", email: "ana.souza@example.com", avatar: "/placeholder.svg?height=32&width=32" },
    messages: 2,
  },
  {
    id: "TKT-1004",
    subject: "Problema com upload de documentos",
    status: "open",
    priority: "high",
    category: "Documentação",
    user: {
      name: "Carla Ferreira",
      email: "carla.ferreira@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    createdAt: "2023-05-15T08:45:00Z",
    updatedAt: "2023-05-15T09:30:00Z",
    assignedTo: null,
    messages: 1,
  },
  {
    id: "TKT-1005",
    subject: "Solicitação de relatório personalizado",
    status: "closed",
    priority: "medium",
    category: "Relatórios",
    user: {
      name: "Roberto Almeida",
      email: "roberto.almeida@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    createdAt: "2023-05-10T11:30:00Z",
    updatedAt: "2023-05-12T16:45:00Z",
    assignedTo: {
      name: "Carlos Mendes",
      email: "carlos.mendes@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    messages: 8,
  },
  {
    id: "TKT-1006",
    subject: "Erro ao gerar certificado",
    status: "closed",
    priority: "high",
    category: "Certificados",
    user: { name: "Fernanda Lima", email: "fernanda.lima@example.com", avatar: "/placeholder.svg?height=32&width=32" },
    createdAt: "2023-05-09T13:20:00Z",
    updatedAt: "2023-05-11T10:15:00Z",
    assignedTo: { name: "Ana Souza", email: "ana.souza@example.com", avatar: "/placeholder.svg?height=32&width=32" },
    messages: 6,
  },
  {
    id: "TKT-1007",
    subject: "Dúvida sobre processo de impugnação",
    status: "in_progress",
    priority: "medium",
    category: "Licitações",
    user: {
      name: "Gustavo Martins",
      email: "gustavo.martins@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    createdAt: "2023-05-14T15:40:00Z",
    updatedAt: "2023-05-15T09:10:00Z",
    assignedTo: {
      name: "Carlos Mendes",
      email: "carlos.mendes@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    messages: 4,
  },
  {
    id: "TKT-1008",
    subject: "Solicitação de cancelamento de cadastro",
    status: "waiting",
    priority: "low",
    category: "Cadastro",
    user: { name: "Luciana Costa", email: "luciana.costa@example.com", avatar: "/placeholder.svg?height=32&width=32" },
    createdAt: "2023-05-13T09:50:00Z",
    updatedAt: "2023-05-14T14:25:00Z",
    assignedTo: { name: "Ana Souza", email: "ana.souza@example.com", avatar: "/placeholder.svg?height=32&width=32" },
    messages: 3,
  },
]

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "open":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <AlertCircle className="mr-1 h-3 w-3" />
          Aberto
        </Badge>
      )
    case "in_progress":
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="mr-1 h-3 w-3" />
          Em Andamento
        </Badge>
      )
    case "waiting":
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          <Clock className="mr-1 h-3 w-3" />
          Aguardando
        </Badge>
      )
    case "closed":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="mr-1 h-3 w-3" />
          Resolvido
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "high":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Alta
        </Badge>
      )
    case "medium":
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          Média
        </Badge>
      )
    case "low":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Baixa
        </Badge>
      )
    default:
      return <Badge variant="outline">{priority}</Badge>
  }
}

export default function SupportTicketsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const openTickets = tickets.filter(
    (ticket) => ticket.status === "open" || ticket.status === "in_progress" || ticket.status === "waiting",
  )
  const closedTickets = tickets.filter((ticket) => ticket.status === "closed")

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Tickets de Suporte</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Ticket
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
            <p className="text-xs text-muted-foreground">+3 nas últimas 24 horas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Abertos</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTickets.length}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((openTickets.length / tickets.length) * 100)}% do total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Resolvidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{closedTickets.length}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((closedTickets.length / tickets.length) * 100)}% do total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio de Resolução</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.5 dias</div>
            <p className="text-xs text-muted-foreground">-0.5 dias em relação ao mês anterior</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="open">Abertos</TabsTrigger>
          <TabsTrigger value="in_progress">Em Andamento</TabsTrigger>
          <TabsTrigger value="waiting">Aguardando</TabsTrigger>
          <TabsTrigger value="closed">Resolvidos</TabsTrigger>
        </TabsList>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar tickets..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="open">Aberto</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="waiting">Aguardando</SelectItem>
                <SelectItem value="closed">Resolvido</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Prioridades</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Todos os Tickets</CardTitle>
              <CardDescription>Lista de todos os tickets de suporte</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Atribuído</TableHead>
                    <TableHead>Atualizado</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">{ticket.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {ticket.subject}
                          {ticket.messages > 0 && (
                            <Badge variant="secondary" className="ml-2">
                              {ticket.messages}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={ticket.user.avatar || "/placeholder.svg"} alt={ticket.user.name} />
                            <AvatarFallback>{ticket.user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{ticket.user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {ticket.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={ticket.assignedTo.avatar || "/placeholder.svg"}
                                alt={ticket.assignedTo.name}
                              />
                              <AvatarFallback>{ticket.assignedTo.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{ticket.assignedTo.name}</span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                            Não atribuído
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(ticket.updatedAt)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tab contents would follow the same pattern */}
      </Tabs>
    </div>
  )
}
