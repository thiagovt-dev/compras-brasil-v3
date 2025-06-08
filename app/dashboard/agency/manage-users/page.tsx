import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
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
import { manageAgencyUser } from "./actions" // Server Action for managing users

interface UserProfile {
  id: string
  full_name: string
  email: string
  role: string
}

export default async function ManageAgencyUsersPage() {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, agency_id")
    .eq("id", session.user.id)
    .single()

  if (profileError || (profile?.role !== "agency" && profile?.role !== "admin")) {
    redirect("/dashboard") // Redirect if not agency admin or admin
  }

  const { data: agencyUsers, error: usersError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("agency_id", profile?.agency_id)
    .neq("id", session.user.id) // Exclude the current user from the list

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-6">
      <DashboardHeader
        title="Gerenciar Usuários do Órgão"
        description="Adicione, edite ou remova usuários vinculados ao seu órgão."
      >
        <Dialog>
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
            <form action={manageAgencyUser} className="grid gap-4 py-4">
              <input type="hidden" name="agencyId" value={profile?.agency_id || ""} />
              <input type="hidden" name="actionType" value="create" />
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
                    {/* Adicione outras funções relevantes para o órgão, se houver */}
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
          {usersError && <p className="text-red-500">Erro ao carregar usuários: {usersError.message}</p>}
          {agencyUsers && agencyUsers.length === 0 ? (
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
                {agencyUsers?.map((user: UserProfile) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell className="text-right">
                      <Dialog>
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
                          <form action={manageAgencyUser} className="grid gap-4 py-4">
                            <input type="hidden" name="userId" value={user.id} />
                            <input type="hidden" name="actionType" value="update" />
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
                      <Dialog>
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
                          <form action={manageAgencyUser}>
                            <input type="hidden" name="userId" value={user.id} />
                            <input type="hidden" name="actionType" value="delete" />
                            <Button type="submit" variant="destructive" className="w-full">
                              Remover Usuário
                            </Button>
                          </form>
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
