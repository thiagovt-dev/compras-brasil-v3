// app/dashboard/agency/manage-users/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  fetchAgencyUsers,
  createAgencyUser,
  updateAgencyUser,
  deleteAgencyUser,
  getAgencyInfo,
} from "@/lib/actions/agencyUserAction";

interface AgencyUser {
  id: string;
  name: string;
  email: string;
  profile_type: string;
  created_at?: string;
}

export default function ManageAgencyUsersPage() {
  const [users, setUsers] = useState<AgencyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  // Carregar dados iniciais
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Verificar autenticação e permissões
        const authResult = await getAgencyInfo();
        if (!authResult.success) {
          router.push("/login");
          return;
        }

        if (!authResult.data?.isAgencyUser) {
          router.push("/dashboard");
          return;
        }

        if (!authResult.data?.hasAgency) {
          setUsers([]);
          setError("Usuário não está vinculado a um órgão");
          return;
        }

        // Carregar usuários
        const usersResult = await fetchAgencyUsers();
        if (usersResult.success) {
          setUsers(usersResult.data || []);
        } else {
          setError(usersResult.error || "Erro ao carregar usuários");
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setError("Erro inesperado ao carregar dados");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (creating) return;

    const formData = new FormData(event.currentTarget);
    
    try {
      setCreating(true);

      const result = await createAgencyUser(formData);
      
      if (result.success) {
        if (result.data) {
          setUsers(prev => [result.data as AgencyUser, ...prev]);
        }
        toast({
          title: "Sucesso",
          description: "Usuário criado com sucesso",
        });
        event.currentTarget.reset();
        setDialogOpen(false);
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao criar usuário",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Erro ao criar usuário:", err);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar usuário",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const formData = new FormData(event.currentTarget);
    const userId = formData.get("userId") as string;

    if (!userId || updating === userId) return;

    try {
      setUpdating(userId);

      const result = await updateAgencyUser(userId, formData);
      
      if (result.success) {
        setUsers(prev =>
          prev.map(user =>
            user.id === userId ? { ...user, ...result.data } : user
          )
        );
        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso",
        });
        setEditDialogOpen(null);
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao atualizar usuário",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Erro ao atualizar usuário:", err);
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar usuário",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!userId || deleting === userId) return;

    try {
      setDeleting(userId);

      const result = await deleteAgencyUser(userId);
      
      if (result.success) {
        setUsers(prev => prev.filter(user => user.id !== userId));
        toast({
          title: "Sucesso",
          description: "Usuário removido com sucesso",
        });
        setDeleteDialogOpen(null);
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao remover usuário",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Erro ao remover usuário:", err);
      toast({
        title: "Erro",
        description: "Erro inesperado ao remover usuário",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const getRoleLabel = (profileType: string) => {
    const roleLabels: Record<string, string> = {
      agency: "Agente de Contratação",
      admin: "Administrador (Órgão)",
      support: "Suporte do Órgão",
      auctioneer: "Pregoeiro",
      authority: "Autoridade Superior",
      agency_support: "Equipe de Apoio",
    };
    return roleLabels[profileType] || profileType;
  };

  if (loading) {
    return (
      <div className="space-y-6">
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
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Gerenciar Usuários do Órgão"
        description="Adicione, edite ou remova usuários vinculados ao seu órgão."
      >
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={creating}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados para adicionar um novo usuário ao seu órgão.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nome Completo
                </Label>
                <Input
                  id="name"
                  name="name"
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
                  name="email"
                  type="email"
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Senha
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="profile_type" className="text-right">
                  Função
                </Label>
                <Select name="profile_type" required>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agency">Agente de Contratação</SelectItem>
                    <SelectItem value="auctioneer">Pregoeiro</SelectItem>
                    <SelectItem value="authority">Autoridade Superior</SelectItem>
                    <SelectItem value="agency_support">Equipe de Apoio</SelectItem>
                    <SelectItem value="support">Suporte do Órgão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Adicionar Usuário"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </DashboardHeader>

      <Card>
        <CardHeader>
          <CardTitle>Usuários do Órgão ({users.length})</CardTitle>
          <CardDescription>
            Lista de todos os usuários vinculados ao seu órgão.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-red-500 mb-4">
              Erro ao carregar usuários: {error}
            </div>
          )}
          
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <PlusCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum usuário cadastrado
              </h3>
              <p>Adicione o primeiro usuário ao seu órgão.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleLabel(user.profile_type)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Botão Editar */}
                        <Dialog
                          open={editDialogOpen === user.id}
                          onOpenChange={(open) => setEditDialogOpen(open ? user.id : null)}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={updating === user.id || deleting === user.id}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Editar Usuário</DialogTitle>
                              <DialogDescription>
                                Edite os dados do usuário.
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleUpdateUser} className="grid gap-4 py-4">
                              <input type="hidden" name="userId" value={user.id} />
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="editName" className="text-right">
                                  Nome Completo
                                </Label>
                                <Input
                                  id="editName"
                                  name="name"
                                  defaultValue={user.name}
                                  className="col-span-3"
                                  required
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="editEmail" className="text-right">
                                  E-mail
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
                                <Label htmlFor="editProfileType" className="text-right">
                                  Função
                                </Label>
                                <Select name="profile_type" defaultValue={user.profile_type} required>
                                  <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Selecione a função" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="agency">Agente de Contratação</SelectItem>
                                    <SelectItem value="auctioneer">Pregoeiro</SelectItem>
                                    <SelectItem value="authority">Autoridade Superior</SelectItem>
                                    <SelectItem value="agency_support">Equipe de Apoio</SelectItem>
                                    <SelectItem value="support">Suporte do Órgão</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button type="submit" className="w-full" disabled={updating === user.id}>
                                {updating === user.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                  </>
                                ) : (
                                  "Salvar Alterações"
                                )}
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>

                        {/* Botão Remover */}
                        <Dialog
                          open={deleteDialogOpen === user.id}
                          onOpenChange={(open) => setDeleteDialogOpen(open ? user.id : null)}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={updating === user.id || deleting === user.id}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Remover</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Confirmar Remoção</DialogTitle>
                              <DialogDescription>
                                Tem certeza que deseja remover o usuário {user.name}? Esta ação não pode ser desfeita.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex gap-2 pt-4">
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setDeleteDialogOpen(null)}
                                disabled={deleting === user.id}
                              >
                                Cancelar
                              </Button>
                              <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={deleting === user.id}
                              >
                                {deleting === user.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Removendo...
                                  </>
                                ) : (
                                  "Remover Usuário"
                                )}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}