"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client-singleton";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  entity_id: string;
  entity_type: string;
  is_read: boolean;
  is_email_sent: boolean;
  priority: "low" | "medium" | "high";
  created_at: string;
};

interface NotificationSystemProps {
  count?: number;
}

export function NotificationSystem({ count = 0 }: NotificationSystemProps) {
  const supabase = getSupabaseClient();
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Mock notifications for demo
  const mockNotifications: Notification[] = [
    {
      id: "1",
      user_id: user?.id || "",
      title: "Nova Licitação Disponível",
      message: "Uma nova licitação foi publicada na sua área de interesse.",
      type: "tender",
      entity_id: "123",
      entity_type: "tender",
      is_read: false,
      is_email_sent: false,
      priority: "high",
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    },
    {
      id: "2",
      user_id: user?.id || "",
      title: "Proposta Aceita",
      message: "Sua proposta foi aceita para a licitação #456.",
      type: "proposal",
      entity_id: "456",
      entity_type: "proposal",
      is_read: false,
      is_email_sent: false,
      priority: "medium",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    },
    {
      id: "3",
      user_id: user?.id || "",
      title: "Documento Assinado",
      message: "O documento foi assinado digitalmente com sucesso.",
      type: "document",
      entity_id: "789",
      entity_type: "document",
      is_read: true,
      is_email_sent: true,
      priority: "low",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    },
  ];

  // Initialize with mock data
  useEffect(() => {
    if (user) {
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter((n) => !n.is_read).length);
      setIsLoading(false);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      // Update local state immediately for better UX
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Here you would normally update the database
      // const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      // if (error) throw error;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({
        title: "Erro ao marcar notificação como lida",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.is_read);
      if (unreadNotifications.length === 0) return;

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);

      toast({
        title: "Notificações marcadas como lidas",
        description: `${unreadNotifications.length} notificações foram marcadas como lidas.`,
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { locale: ptBR, addSuffix: true });
    } catch (error) {
      return "";
    }
  };

  // Get notification priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    router.push("/dashboard/notifications");
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    setIsOpen(false);

    // Navigate based on notification type
    switch (notification.entity_type) {
      case "tender":
        router.push(`/dashboard/tenders/${notification.entity_id}`);
        break;
      case "proposal":
        router.push(`/dashboard/supplier/proposals/${notification.entity_id}`);
        break;
      case "document":
        router.push(`/dashboard/documents`);
        break;
      default:
        router.push("/dashboard/notifications");
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="!h-8 !w-8" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 flex items-center justify-center p-0 text-[1rem]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-[1rem] font-normal text-blue-600 hover:text-blue-800"
              onClick={markAllAsRead}>
              Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="p-4 text-center text-[1rem] text-muted-foreground">
            Carregando notificações...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-[1rem] text-muted-foreground">
            Nenhuma notificação encontrada
          </div>
        ) : (
          <DropdownMenuGroup className="max-h-[400px] overflow-y-auto">
            {notifications.slice(0, 5).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start p-3 cursor-pointer hover:bg-muted/50"
                onClick={() => handleNotificationClick(notification)}>
                <div className="flex w-full items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-medium ${
                        !notification.is_read ? "text-foreground" : "text-muted-foreground"
                      }`}>
                      {notification.title}
                    </span>
                    {!notification.is_read && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[1rem] ${getPriorityColor(notification.priority)}`}>
                    {notification.priority}
                  </Badge>
                </div>
                <p className="mt-1 text-[1rem] text-muted-foreground line-clamp-2">
                  {notification.message}
                </p>
                <span className="mt-1 text-[1rem] text-muted-foreground">
                  {formatRelativeTime(notification.created_at)}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center cursor-pointer" onClick={handleViewAll}>
          Ver todas as notificações
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
