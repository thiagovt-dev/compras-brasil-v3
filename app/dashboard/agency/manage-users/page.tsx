"use client";

import type React from "react";

import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSupabaseClient } from "@/lib/supabase/client-singleton";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createAgencyUser } from "@/serverAction/agencyUserAction";
import { useAuth } from "@/lib/supabase/auth-context";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  profile_type: string;
}

interface Profile {
  profile_type: string;
  agency_id: string;
}

export default function ManageAgencyUsersPage() {
  const [agencyUsers, setAgencyUsers] = useState<UserProfile[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { signIn, session, isLoading } = useAuth();

  const router = useRouter();
  const supabase = getSupabaseClient();

  useEffect(() => {
    async function fetchData() {
      try {
        // Get current session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push("/login");
          return;
        }

        // Get user profile
        const { data: userProfile, error: profileError } = await supabase
          .from("profiles")
          .select("profile_type, agency_id")
          .eq("id", session.user.id)
          .single();

        if (
          profileError ||
          (userProfile?.profile_type !== "agency" && userProfile?.profile_type !== "admin")
        ) {
          router.push("/dashboard");
          return;
        }

        setProfile(userProfile);

        // Check if agency_id exists before making the query
        if (!userProfile.agency_id) {
          console.log("User has no agency_id, not fetching users");
          setAgencyUsers([]); // Set empty array if no agency_id
          return;
        }

        // Get agency users only if agency_id is not null
        const { data: users, error: usersError } = await supabase
          .from("profiles")
          .select("id, name, email, profile_type")
          .eq("agency_id", userProfile.agency_id)
          .neq("id", session.user.id); // Exclude the current user from the list

        console.log("Fetched users:", users);

        if (usersError) {
          setError(usersError.message);
        } else {
          setAgencyUsers(users || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase, router]);

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (creating) return;

    try {
      setCreating(true);


      if (!session) {
        toast.error("Usuário não autenticado");
        return;
      }

      // Adicionar token e user_id ao FormData
      formData.append("access_token", session.access_token);
      formData.append("user_id", session.user.id);

      console.log("Enviando dados:", {
        token: session.access_token ? "Presente" : "Ausente",
        user_id: session.user.id,
      });

      const result = await createAgencyUser(formData);

      console.log("Resultado:", result);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      // Add new user to local state
      setAgencyUsers((prev) => [...prev, result.user!]);
      toast.success("Usuário criado com sucesso");

      // Reset form and close dialog
      event.currentTarget.reset();
      setDialogOpen(false);
    } catch (err) {
      console.error("Erro:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao criar usuário");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    console.log("🔄 Estado creating mudou para:", creating);
  }, [creating]);

  const handleUpdateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const userId = formData.get("userId") as string;

    try {
      setUpdating(userId);

      const fullName = formData.get("fullName") as string;
      const email = formData.get("email") as string;
      const profile_type = formData.get("profile_type") as string;

      if (!userId || !fullName || !email || !profile_type) {
        toast.error("Todos os campos são obrigatórios");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          name: fullName,
          email: email,
          profile_type: profile_type,
        })
        .eq("id", userId);

      if (error) {
        toast.error(error.message);
        return;
      }

      // Update local state
      setAgencyUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? { ...user, name: fullName, email: email, profile_type: profile_type }
            : user
        )
      );

      toast.success("Usuário atualizado com sucesso");
      setEditDialogOpen(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar usuário");
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      setDeleting(userId);

      const { error } = await supabase.from("profiles").delete().eq("id", userId);

      if (error) {
        toast.error(error.message);
        return;
      }

      // Update local state
      setAgencyUsers((prev) => prev.filter((user) => user.id !== userId));
      toast.success("Usuário removido com sucesso");
      setDeleteDialogOpen(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover usuário");
    } finally {
      setDeleting(null);
    }
  };

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
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-6">
      <DashboardHeader
        title="Gerenciar Usuários do Órgão"
        description="Adicione, edite ou remova usuários vinculados ao seu órgão.">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={creating}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Usuário
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
                    <SelectItem value="admin">Administrador (Órgão)</SelectItem>
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
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.profile_type === "agency" && "Agente de Contratação"}
                      {user.profile_type === "admin" && "Administrador (Órgão)"}
                      {user.profile_type === "support" && "Suporte do Órgão"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog
                        open={editDialogOpen === user.id}
                        onOpenChange={(open) => setEditDialogOpen(open ? user.id : null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="mr-2"
                            disabled={updating === user.id || deleting === user.id}>
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
                                defaultValue={user.name}
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
                              <Select name="profile_type" defaultValue={user.profile_type} required>
                                <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder="Selecione a função" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="agency">Agente de Contratação</SelectItem>
                                  <SelectItem value="admin">Administrador (Órgão)</SelectItem>
                                  <SelectItem value="support">Suporte do Órgão</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              type="submit"
                              className="w-full"
                              disabled={updating === user.id}>
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
                      <Dialog
                        open={deleteDialogOpen === user.id}
                        onOpenChange={(open) => setDeleteDialogOpen(open ? user.id : null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={updating === user.id || deleting === user.id}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remover</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Confirmar Remoção</DialogTitle>
                            <DialogDescription>
                              Tem certeza que deseja remover o usuário {user.name}? Esta ação não
                              pode ser desfeita.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex gap-2 pt-4">
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => setDeleteDialogOpen(null)}
                              disabled={deleting === user.id}>
                              Cancelar
                            </Button>
                            <Button
                              variant="destructive"
                              className="flex-1"
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={deleting === user.id}>
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
