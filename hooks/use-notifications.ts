"use client"

import { useState, useEffect, useCallback } from "react"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/supabase/auth-context"
import { toast } from "@/components/ui/use-toast"
import type { Notification } from "@/components/notification-system"

export function useNotifications() {
  const supabase = createClientSupabaseClient()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (limit = 50) => {
      if (!user) return

      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(limit)

        if (error) throw error

        setNotifications(data || [])
        setUnreadCount(data?.filter((n) => !n.is_read).length || 0)
      } catch (error) {
        console.error("Error fetching notifications:", error)
        toast({
          title: "Erro ao carregar notificações",
          description: "Não foi possível carregar suas notificações. Tente novamente mais tarde.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [user, supabase],
  )

  // Mark notification as read
  const markAsRead = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id)

        if (error) throw error

        // Update local state
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch (error) {
        console.error("Error marking notification as read:", error)
        toast({
          title: "Erro ao marcar notificação como lida",
          description: "Não foi possível atualizar o status da notificação. Tente novamente mais tarde.",
          variant: "destructive",
        })
      }
    },
    [supabase],
  )

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user || notifications.length === 0) return

    try {
      const unreadNotifications = notifications.filter((n) => !n.is_read)
      if (unreadNotifications.length === 0) return

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false)

      if (error) throw error

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)

      toast({
        title: "Notificações marcadas como lidas",
        description: `${unreadNotifications.length} notificações foram marcadas como lidas.`,
      })
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      toast({
        title: "Erro ao marcar notificações como lidas",
        description: "Não foi possível atualizar o status das notificações. Tente novamente mais tarde.",
        variant: "destructive",
      })
    }
  }, [user, notifications, supabase])

  // Delete notification
  const deleteNotification = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from("notifications").delete().eq("id", id)

        if (error) throw error

        // Update local state
        const deletedNotification = notifications.find((n) => n.id === id)
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        if (deletedNotification && !deletedNotification.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }

        toast({
          title: "Notificação removida",
          description: "A notificação foi removida com sucesso.",
        })
      } catch (error) {
        console.error("Error deleting notification:", error)
        toast({
          title: "Erro ao remover notificação",
          description: "Não foi possível remover a notificação. Tente novamente mais tarde.",
          variant: "destructive",
        })
      }
    },
    [notifications, supabase],
  )

  // Delete all notifications
  const deleteAllNotifications = useCallback(async () => {
    if (!user || notifications.length === 0) return

    try {
      const { error } = await supabase.from("notifications").delete().eq("user_id", user.id)

      if (error) throw error

      // Update local state
      setNotifications([])
      setUnreadCount(0)

      toast({
        title: "Notificações removidas",
        description: "Todas as notificações foram removidas com sucesso.",
      })
    } catch (error) {
      console.error("Error deleting all notifications:", error)
      toast({
        title: "Erro ao remover notificações",
        description: "Não foi possível remover as notificações. Tente novamente mais tarde.",
        variant: "destructive",
      })
    }
  }, [user, notifications, supabase])

  // Subscribe to new notifications
  useEffect(() => {
    if (!user) return

    fetchNotifications()

    // Subscribe to new notifications
    const channel = supabase
      .channel("notifications-hook")
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
            const newNotification = payload.new as Notification
            setNotifications((prev) => [newNotification, ...prev])
            setUnreadCount((prev) => prev + 1)

            // Show toast for high priority notifications
            if (newNotification.priority === "high") {
              toast({
                title: newNotification.title,
                description: newNotification.message,
              })
            }
          } else if (payload.eventType === "UPDATE") {
            // Update notification in the list
            const updatedNotification = payload.new as Notification
            setNotifications((prev) => prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n)))

            // Update unread count if read status changed
            if (updatedNotification.is_read) {
              const oldNotification = notifications.find((n) => n.id === updatedNotification.id)
              if (oldNotification && !oldNotification.is_read) {
                setUnreadCount((prev) => Math.max(0, prev - 1))
              }
            }
          } else if (payload.eventType === "DELETE") {
            // Remove notification from the list
            const deletedNotification = payload.old as Notification
            setNotifications((prev) => prev.filter((n) => n.id !== deletedNotification.id))

            // Update unread count if deleted notification was unread
            if (!deletedNotification.is_read) {
              setUnreadCount((prev) => Math.max(0, prev - 1))
            }
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase, fetchNotifications])

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  }
}
