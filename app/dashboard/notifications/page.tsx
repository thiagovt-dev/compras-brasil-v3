"use client";

import { useEffect, useState } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth-context";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell, CheckIcon as CheckAll, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import type { Notification } from "@/components/notification-system";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsPage() {
  const supabase = createClientSupabaseClient();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setNotifications(data || []);
      setFilteredNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Erro ao carregar notificações",
        description: "Não foi possível carregar suas notificações. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;

    try {
      const unreadNotifications = notifications.filter((n) => !n.is_read);
      if (unreadNotifications.length === 0) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setFilteredNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

      toast({
        title: "Notificações marcadas como lidas",
        description: `${unreadNotifications.length} notificações foram marcadas como lidas.`,
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast({
        title: "Erro ao marcar notificações como lidas",
        description:
          "Não foi possível atualizar o status das notificações. Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);

      if (error) throw error;

      // Update local state
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setFilteredNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({
        title: "Erro ao marcar notificação como lida",
        description:
          "Não foi possível atualizar o status da notificação. Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase.from("notifications").delete().eq("id", id);

      if (error) throw error;

      // Update local state
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setFilteredNotifications((prev) => prev.filter((n) => n.id !== id));

      toast({
        title: "Notificação removida",
        description: "A notificação foi removida com sucesso.",
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast({
        title: "Erro ao remover notificação",
        description: "Não foi possível remover a notificação. Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    if (!user || notifications.length === 0) return;

    try {
      const { error } = await supabase.from("notifications").delete().eq("user_id", user.id);

      if (error) throw error;

      // Update local state
      setNotifications([]);
      setFilteredNotifications([]);

      toast({
        title: "Notificações removidas",
        description: "Todas as notificações foram removidas com sucesso.",
      });
    } catch (error) {
      console.error("Error deleting all notifications:", error);
      toast({
        title: "Erro ao remover notificações",
        description: "Não foi possível remover as notificações. Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  // Format notification date
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch (error) {
      return "";
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return "";
    try {
      return formatDistanceToNow(new Date(dateString), { locale: ptBR, addSuffix: true });
    } catch (error) {
      return "";
    }
  };

  // Get notification link based on type and entity
  const getNotificationLink = (notification: Notification) => {
    const { type, entity_id, entity_type } = notification;

    switch (entity_type) {
      case "tender":
        return `/dashboard/tenders/${entity_id}`;
      case "proposal":
        return `/dashboard/supplier/proposals/${entity_id}`;
      case "impugnation":
        return `/dashboard/tenders/${entity_id}?tab=impugnations`;
      case "clarification":
        return `/dashboard/tenders/${entity_id}?tab=clarifications`;
      case "appeal":
        return `/dashboard/tenders/${entity_id}?tab=appeals`;
      case "session":
        return `/tenders/${entity_id}/session`;
      case "document":
        return `/dashboard/documents/${entity_id}`;
      default:
        return "/dashboard/notifications";
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string, priority: string) => {
    let color = "bg-blue-100 text-blue-600";

    if (priority === "high") {
      color = "bg-red-100 text-red-600";
    } else if (priority === "medium") {
      color = "bg-yellow-100 text-yellow-600";
    }

    return (
      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${color}`}>
        <Bell className="w-5 h-5" />
      </div>
    );
  };

  // Filter notifications
  useEffect(() => {
    if (!notifications.length) return;

    let filtered = [...notifications];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) => n.title.toLowerCase().includes(query) || n.message.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (typeFilter !== "all") {
      if (typeFilter === "unread") {
        filtered = filtered.filter((n) => !n.is_read);
      } else {
        filtered = filtered.filter((n) => n.type === typeFilter);
      }
    }

    // Apply priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((n) => n.priority === priorityFilter);
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      filtered = filtered.filter((n) => {
        const date = new Date(n.created_at);

        if (dateFilter === "today") {
          return date >= today;
        } else if (dateFilter === "yesterday") {
          return date >= yesterday && date < today;
        } else if (dateFilter === "last-week") {
          return date >= lastWeek;
        } else if (dateFilter === "last-month") {
          return date >= lastMonth;
        }

        return true;
      });
    }

    setFilteredNotifications(filtered);
  }, [notifications, searchQuery, typeFilter, priorityFilter, dateFilter]);

  // Subscribe to new notifications
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel("notifications-page")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            // Add new notification to the list
            const newNotification = payload.new as Notification;
            setNotifications((prev) => [newNotification, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            // Update notification in the list
            const updatedNotification = payload.new as Notification;
            setNotifications((prev) =>
              prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
            );
          } else if (payload.eventType === "DELETE") {
            // Remove notification from the list
            const deletedNotification = payload.old as Notification;
            setNotifications((prev) => prev.filter((n) => n.id !== deletedNotification.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  // Get notification counts
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const highPriorityCount = notifications.filter((n) => n.priority === "high").length;
  const mediumPriorityCount = notifications.filter((n) => n.priority === "medium").length;
  const lowPriorityCount = notifications.filter((n) => n.priority === "low").length;

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notificações</h1>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckAll className="h-4 w-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" onClick={deleteAllNotifications}>
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar todas
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total</CardTitle>
            <CardDescription>Todas as notificações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{notifications.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Não lidas</CardTitle>
            <CardDescription>Notificações pendentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{unreadCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Alta prioridade</CardTitle>
            <CardDescription>Notificações importantes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{highPriorityCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Média prioridade</CardTitle>
            <CardDescription>Notificações relevantes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{mediumPriorityCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar notificações..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <div className="w-full md:w-48">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="unread">Não lidas</SelectItem>
                <SelectItem value="tender">Licitações</SelectItem>
                <SelectItem value="proposal">Propostas</SelectItem>
                <SelectItem value="document">Documentos</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-48">
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-48">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as datas</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="yesterday">Ontem</SelectItem>
                <SelectItem value="last-week">Última semana</SelectItem>
                <SelectItem value="last-month">Último mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="all">
            Todas
            {notifications.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {notifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread">
            Não lidas
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="high">
            Alta prioridade
            {highPriorityCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {highPriorityCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="medium">
            Média prioridade
            {mediumPriorityCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {mediumPriorityCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg ${
                    !notification.is_read ? "bg-muted/30" : ""
                  } relative group`}>
                  <Link
                    href={getNotificationLink(notification)}
                    onClick={() => {
                      if (!notification.is_read) {
                        markAsRead(notification.id);
                      }
                    }}
                    className="block">
                    <div className="flex gap-3">
                      {getNotificationIcon(notification.type, notification.priority)}
                      <div className="space-y-1 flex-1">
                        <div className="flex justify-between">
                          <p
                            className={`text-[1rem] font-medium ${
                              !notification.is_read ? "font-semibold" : ""
                            }`}>
                            {notification.title}
                            {!notification.is_read && (
                              <Badge variant="secondary" className="ml-2">
                                Nova
                              </Badge>
                            )}
                            {notification.priority === "high" && (
                              <Badge variant="destructive" className="ml-2">
                                Importante
                              </Badge>
                            )}
                          </p>
                          <span className="text-[1rem] text-muted-foreground">
                            {formatRelativeTime(notification.created_at)}
                          </span>
                        </div>
                        <p className="text-[1rem] text-muted-foreground">{notification.message}</p>
                        <p className="text-[1rem] text-muted-foreground">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => markAsRead(notification.id)}>
                        <CheckAll className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteNotification(notification.id)}>
                      <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground border rounded-lg">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-1">Nenhuma notificação encontrada</h3>
              <p>Não há notificações que correspondam aos filtros selecionados.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="unread" className="mt-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.filter((n) => !n.is_read).length > 0 ? (
            <div className="space-y-4">
              {notifications
                .filter((n) => !n.is_read)
                .map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 border rounded-lg bg-muted/30 relative group">
                    <Link
                      href={getNotificationLink(notification)}
                      onClick={() => markAsRead(notification.id)}
                      className="block">
                      <div className="flex gap-3">
                        {getNotificationIcon(notification.type, notification.priority)}
                        <div className="space-y-1 flex-1">
                          <div className="flex justify-between">
                            <p className="text-[1rem] font-semibold">
                              {notification.title}
                              <Badge variant="secondary" className="ml-2">
                                Nova
                              </Badge>
                              {notification.priority === "high" && (
                                <Badge variant="destructive" className="ml-2">
                                  Importante
                                </Badge>
                              )}
                            </p>
                            <span className="text-[1rem] text-muted-foreground">
                              {formatRelativeTime(notification.created_at)}
                            </span>
                          </div>
                          <p className="text-[1rem] text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="text-[1rem] text-muted-foreground">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </Link>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => markAsRead(notification.id)}>
                        <CheckAll className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => deleteNotification(notification.id)}>
                        <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground border rounded-lg">
              <CheckAll className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-1">Nenhuma notificação não lida</h3>
              <p>Você está em dia com suas notificações!</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="high" className="mt-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.filter((n) => n.priority === "high").length > 0 ? (
            <div className="space-y-4">
              {notifications
                .filter((n) => n.priority === "high")
                .map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border rounded-lg ${
                      !notification.is_read ? "bg-muted/30" : ""
                    } relative group`}>
                    <Link
                      href={getNotificationLink(notification)}
                      onClick={() => {
                        if (!notification.is_read) {
                          markAsRead(notification.id);
                        }
                      }}
                      className="block">
                      <div className="flex gap-3">
                        {getNotificationIcon(notification.type, notification.priority)}
                        <div className="space-y-1 flex-1">
                          <div className="flex justify-between">
                            <p
                              className={`text-[1rem] font-medium ${
                                !notification.is_read ? "font-semibold" : ""
                              }`}>
                              {notification.title}
                              {!notification.is_read && (
                                <Badge variant="secondary" className="ml-2">
                                  Nova
                                </Badge>
                              )}
                              <Badge variant="destructive" className="ml-2">
                                Importante
                              </Badge>
                            </p>
                            <span className="text-[1rem] text-muted-foreground">
                              {formatRelativeTime(notification.created_at)}
                            </span>
                          </div>
                          <p className="text-[1rem] text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="text-[1rem] text-muted-foreground">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </Link>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => markAsRead(notification.id)}>
                          <CheckAll className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => deleteNotification(notification.id)}>
                        <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground border rounded-lg">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-1">Nenhuma notificação de alta prioridade</h3>
              <p>Você não tem notificações importantes no momento.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="medium" className="mt-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.filter((n) => n.priority === "medium").length > 0 ? (
            <div className="space-y-4">
              {notifications
                .filter((n) => n.priority === "medium")
                .map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border rounded-lg ${
                      !notification.is_read ? "bg-muted/30" : ""
                    } relative group`}>
                    <Link
                      href={getNotificationLink(notification)}
                      onClick={() => {
                        if (!notification.is_read) {
                          markAsRead(notification.id);
                        }
                      }}
                      className="block">
                      <div className="flex gap-3">
                        {getNotificationIcon(notification.type, notification.priority)}
                        <div className="space-y-1 flex-1">
                          <div className="flex justify-between">
                            <p
                              className={`text-[1rem] font-medium ${
                                !notification.is_read ? "font-semibold" : ""
                              }`}>
                              {notification.title}
                              {!notification.is_read && (
                                <Badge variant="secondary" className="ml-2">
                                  Nova
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className="ml-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80">
                                Média
                              </Badge>
                            </p>
                            <span className="text-[1rem] text-muted-foreground">
                              {formatRelativeTime(notification.created_at)}
                            </span>
                          </div>
                          <p className="text-[1rem] text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="text-[1rem] text-muted-foreground">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </Link>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => markAsRead(notification.id)}>
                          <CheckAll className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => deleteNotification(notification.id)}>
                        <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground border rounded-lg">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-1">Nenhuma notificação de média prioridade</h3>
              <p>Você não tem notificações de média prioridade no momento.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
