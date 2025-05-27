"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Search,
  MoreHorizontal,
  UserPlus,
  Edit,
  Lock,
  Trash2,
  Mail,
  User,
  Building2,
  Landmark,
  Shield,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react"

export default function ManageUsersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTab, setSelectedTab] = useState("all")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    cpf: "",
    profile_type: "",
    status: "active",
  })

  // Filter users based on search term and selected tab
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.cpf.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTab =
      selectedTab === "all" ||
      (selectedTab === "citizen" && user.profile_type === "citizen") ||
      (selectedTab === "supplier" && user.profile_type === "supplier") ||
      (selectedTab === "agency" && user.profile_type === "agency") ||
      (selectedTab === "admin" && user.profile_type === "admin") ||
      (selectedTab === "support" && user.profile_type === "support") ||
      (selectedTab === "registration" && user.profile_type === "registration") ||
      (selectedTab === "pending" && user.status === "pending") ||
      (selectedTab === "blocked" && user.status === "blocked")

    return matchesSearch && matchesTab
  })

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, we would send the data to an API
    console.log("New user:", newUser)
    setIsAddUserOpen(false)
    setNewUser({
      name: "",
      email: "",
      cpf: "",
      profile_type: "",
      status: "active",
    })
  }

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1")
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewUser({ ...newUser, cpf: formatCPF(value) })
  }

  const getProfileTypeIcon = (profileType: string) => {
    switch (profileType) {
      case "citizen":
        return <User className="h-4 w-4" />
      case "supplier":
        return <Building2 className="h-4 w-4" />
      case "agency":
        return <Landmark className="h-4 w-4" />
      case "admin":
        return <Shield className="h-4 w-4" />
      case "support":
        return <Users className="h-4 w-4" />
      case "registration":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getProfileTypeLabel = (profileType: string) => {
    switch (profileType) {
      case "citizen":
        return "Cidadão"
      case "supplier":
        return "Fornecedor"
      case "agency":
        return "Órgão Público"
      case "admin":
        return "Administrador"
      case "support":
        return "Suporte"
      case "registration":
        return "Cadastro"
      default:
        return profileType
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "success"
      case "pending":
        return "warning"
      case "blocked":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Ativo"
      case "pending":
        return "Pendente"
      case "blocked":
        return "Bloqueado"
      default:
        return status
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gerenciar Usuários</h1>
        <p className="text-muted-foreground">Gerencie os usuários do sistema</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome, e-mail ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Adicionar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Usuário</DialogTitle>
              <DialogDescription>Preencha os dados para adicionar um novo usuário ao sistema.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddUser}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cpf" className="text-right">
                    CPF
                  </Label>
                  <Input
                    id="cpf"
                    value={newUser.cpf}
                    onChange={handleCPFChange}
                    className="col-span-3"
                    maxLength={14}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="profile_type" className="text-right">
                    Perfil
                  </Label>
                  <Select
                    value={newUser.profile_type}
                    onValueChange={(value) => setNewUser({ ...newUser, profile_type: value })}
                  >
                    <SelectTrigger id="profile_type" className="col-span-3">
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="citizen">Cidadão</SelectItem>
                      <SelectItem value="supplier">Fornecedor</SelectItem>
                      <SelectItem value="agency">Órgão Público</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="support">Suporte</SelectItem>
                      <SelectItem value="registration">Cadastro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select value={newUser.status} onValueChange={(value) => setNewUser({ ...newUser, status: value })}>
                    <SelectTrigger id="status" className="col-span-3">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="blocked">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="col-span-4 flex items-center space-x-2">
                    <Checkbox id="send_email" />
                    <Label htmlFor="send_email">Enviar e-mail de boas-vindas</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Adicionar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-9">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="citizen">Cidadãos</TabsTrigger>
          <TabsTrigger value="supplier">Fornecedores</TabsTrigger>
          <TabsTrigger value="agency">Órgãos</TabsTrigger>
          <TabsTrigger value="admin">Administradores</TabsTrigger>
          <TabsTrigger value="support">Suporte</TabsTrigger>
          <TabsTrigger value="registration">Cadastro</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="blocked">Bloqueados</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Usuários</CardTitle>
              <CardDescription>
                {filteredUsers.length} usuário{filteredUsers.length !== 1 ? "s" : ""} encontrado
                {filteredUsers.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-12 border-b bg-gray-50 px-4 py-3 text-sm font-medium">
                  <div className="col-span-4">Nome / E-mail</div>
                  <div className="col-span-2">CPF</div>
                  <div className="col-span-2">Perfil</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2 text-right">Ações</div>
                </div>
                <div className="divide-y">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <div key={user.id} className="grid grid-cols-12 items-center px-4 py-3">
                        <div className="col-span-4">
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                        <div className="col-span-2 text-sm">{user.cpf}</div>
                        <div className="col-span-2">
                          <div className="flex items-center gap-1">
                            {getProfileTypeIcon(user.profile_type)}
                            <span className="text-sm">{getProfileTypeLabel(user.profile_type)}</span>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <Badge variant={getStatusBadgeVariant(user.status)}>{getStatusLabel(user.status)}</Badge>
                        </div>
                        <div className="col-span-2 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Abrir menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem className="flex items-center gap-2">
                                <Edit className="h-4 w-4" />
                                <span>Editar</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <span>Enviar e-mail</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status === "active" ? (
                                <DropdownMenuItem className="flex items-center gap-2 text-destructive">
                                  <Lock className="h-4 w-4" />
                                  <span>Bloquear</span>
                                </DropdownMenuItem>
                              ) : user.status === "blocked" ? (
                                <DropdownMenuItem className="flex items-center gap-2 text-green-600">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Ativar</span>
                                </DropdownMenuItem>
                              ) : (
                                <>
                                  <DropdownMenuItem className="flex items-center gap-2 text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Aprovar</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="flex items-center gap-2 text-destructive">
                                    <XCircle className="h-4 w-4" />
                                    <span>Rejeitar</span>
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="flex items-center gap-2 text-destructive">
                                <Trash2 className="h-4 w-4" />
                                <span>Excluir</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      Nenhum usuário encontrado com os filtros selecionados.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Mock data for users
const users = [
  {
    id: "1",
    name: "João Silva",
    email: "joao.silva@example.com",
    cpf: "123.456.789-00",
    profile_type: "admin",
    status: "active",
  },
  {
    id: "2",
    name: "Maria Santos",
    email: "maria.santos@example.com",
    cpf: "987.654.321-00",
    profile_type: "support",
    status: "active",
  },
  {
    id: "3",
    name: "Pedro Oliveira",
    email: "pedro.oliveira@example.com",
    cpf: "456.789.123-00",
    profile_type: "registration",
    status: "active",
  },
  {
    id: "4",
    name: "Ana Costa",
    email: "ana.costa@example.com",
    cpf: "789.123.456-00",
    profile_type: "citizen",
    status: "active",
  },
  {
    id: "5",
    name: "Carlos Ferreira",
    email: "carlos.ferreira@example.com",
    cpf: "321.654.987-00",
    profile_type: "agency",
    status: "active",
  },
  {
    id: "6",
    name: "Empresa ABC Informática",
    email: "contato@abcinformatica.com",
    cpf: "111.222.333-44",
    profile_type: "supplier",
    status: "active",
  },
  {
    id: "7",
    name: "Empresa XYZ Tecnologia",
    email: "contato@xyztecnologia.com",
    cpf: "555.666.777-88",
    profile_type: "supplier",
    status: "active",
  },
  {
    id: "8",
    name: "Prefeitura Municipal de São Paulo",
    email: "licitacoes@prefeiturasp.gov.br",
    cpf: "999.888.777-66",
    profile_type: "agency",
    status: "active",
  },
  {
    id: "9",
    name: "Empresa DEF Comércio",
    email: "contato@defcomercio.com",
    cpf: "444.333.222-11",
    profile_type: "supplier",
    status: "pending",
  },
  {
    id: "10",
    name: "Roberto Almeida",
    email: "roberto.almeida@example.com",
    cpf: "222.333.444-55",
    profile_type: "citizen",
    status: "blocked",
  },
]
