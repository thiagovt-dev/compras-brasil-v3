"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getSupabaseClient } from "@/lib/supabase/client-singleton"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { PlusCircle, Edit, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner" // Assumindo que você tem sonner instalado

interface UserProfile {
  id: string
  full_name: string
  email: string
  role: string
}

interface Profile {
  role: string
  agency_id: string
}

export default function ManageAgencyUsersPage() {
  const [agencyUsers, setAgencyUsers] = useState<UserProfile[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    async function fetchData() {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push("/login")
          return
        }

        // Get user profile
        const { data: userProfile, error: profileError } = await supabase
          .from("profiles")
          .select("role, agency_id")
          .eq("id", session.user.id)
          .single()

        if (profileError || (userProfile?.role !== "agency" && userProfile?.role !== "admin")) {
          router.push("/dashboard")
          return
        }

        setProfile(userProfile)

        // Get agency users
        const { data: users, error: usersError } = await supabase
          .from("profiles")
          .select("id, full_name, email, role")
          .eq("agency_id", userProfile.agency_id)
          .neq("id", session.user.id) // Exclude the current user from the list
console.log("Fetched users:", users)
        if (usersError) {
          setError(usersError.message)
        } else {
          setAgencyUsers(users || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, router])

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    
    try {
      const fullName = formData.get("fullName") as string
      const email = formData.get("email") as string
      const password = formData.get("password") as string
      const role = formData.get("role") as string

      if (!fullName || !email || !password || !role || !profile) {
        toast.error("Todos os campos são obrigatórios")
        return
      }

      // Create user via Supabase Auth (this would need to be a server action or API route)
      // For now, let's show a toast indicating the limitation
      toast.error("Criação de usuários deve ser implementada via API route para segurança")
      
      // Reset form and close dialog
      event.currentTarget.reset()
      setDialogOpen(false)
      
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar usuário")
    }
  }

  const handleUpdateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    
    try {
      const userId = formData.get("userId") as string
      const fullName = formData.get("fullName") as string
      const email = formData.get("email") as string
      const role = formData.get("role") as string

      if (!userId || !fullName || !email || !role) {
        toast.error("Todos os campos são obrigatórios")
        return
      }

      const { error } = await supabase
        .from("profiles")
        .update({ 
          full_name: fullName,
          email: email,
          role: role 
        })
        .eq("id", userId)

      if (error) {
        toast.error(error.message)
        return
      }

      // Update local state
      setAgencyUsers(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, full_name: fullName, email: email, role: role }
            : user
        )
      )

      toast.success("Usuário atualizado com sucesso")
      setEditDialogOpen(null)
      
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar usuário")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId)

      if (error) {
        toast.error(error.message)
        return
      }

      // Update local state
      setAgencyUsers(prev => prev.filter(user => user.id !== userId))
      toast.success("Usuário removido com sucesso")
      setDeleteDialogOpen(null)
      
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover usuário")
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-6">
        <DashboardHeader
          title="Gerenciar Usuários do Órgão"
          description="Adicione, edite ou remova usuários vinculados ao seu órgão."
        />
        <Card>
          <CardHeader>
            <CardTitle>Carregando...</CardTitle>
            <CardDescription>Buscando usuários do órgão...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-6">
      <DashboardHeader
        title="Gerenciar Usuários do Órgão"
        description="Adicione, edite ou remova usuários vinculados ao seu órgão."
      >
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Usuário</DialogTitle>
              <DialogDescription>Preencha os dados para adicionar um novo usuário ao seu órgão.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fullName" className="text-right">
                  Nome Completo
                </Label>
                <Input id="fullName" name="fullName" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input id="email" name="email" type="email" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Senha
                </Label>
                <Input id="password" name="password" type="password" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Função
                </Label>
                <Select name="role" required>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agency">Agente de Contratação</SelectItem>
                    <SelectItem value="admin">Administrador (Órgão)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Adicionar Usuário
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </DashboardHeader>

      <Card>
        <CardHeader>
          <CardTitle>Usuários do Órgão</CardTitle>
          <CardDescription>Lista de todos os usuários vinculados ao seu órgão.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-500">Erro ao carregar usuários: {error}</p>}
          {agencyUsers.length === 0 ? (
            <p>Nenhum usuário encontrado para este órgão.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agencyUsers.map((user: UserProfile) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell className="text-right">
                      <Dialog open={editDialogOpen === user.id} onOpenChange={(open) => setEditDialogOpen(open ? user.id : null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="mr-2">
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Editar Usuário</DialogTitle>
                            <DialogDescription>Edite os dados do usuário.</DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleUpdateUser} className="grid gap-4 py-4">
                            <input type="hidden" name="userId" value={user.id} />
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="editFullName" className="text-right">
                                Nome Completo
                              </Label>
                              <Input
                                id="editFullName"
                                name="fullName"
                                defaultValue={user.full_name}
                                className="col-span-3"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="editEmail" className="text-right">
                                Email
                              </Label>
                              <Input
                                id="editEmail"
                                name="email"
                                type="email"
                                defaultValue={user.email}
                                className="col-span-3"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="editRole" className="text-right">
                                Função
                              </Label>
                              <Select name="role" defaultValue={user.role} required>
                                <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder="Selecione a função" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="agency">Agente de Contratação</SelectItem>
                                  <SelectItem value="admin">Administrador (Órgão)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button type="submit" className="w-full">
                              Salvar Alterações
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Dialog open={deleteDialogOpen === user.id} onOpenChange={(open) => setDeleteDialogOpen(open ? user.id : null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remover</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Confirmar Remoção</DialogTitle>
                            <DialogDescription>
                              Tem certeza que deseja remover o usuário {user.full_name}? Esta ação não pode ser
                              desfeita.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex gap-2 pt-4">
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => setDeleteDialogOpen(null)}
                            >
                              Cancelar
                            </Button>
                            <Button
                              variant="destructive"
                              className="flex-1"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              Remover Usuário
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}