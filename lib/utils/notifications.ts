import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

interface SendNotificationParams {
  userId: string
  title: string
  message: string
  type: string
  entityId: string
  entityType: string
  priority?: "low" | "medium" | "high"
  sendEmail?: boolean
}

export async function sendNotification({
  userId,
  title,
  message,
  type,
  entityId,
  entityType,
  priority = "low",
  sendEmail = false,
}: SendNotificationParams) {
  const supabase = createServerComponentClient({ cookies })

  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        title,
        message,
        type,
        entity_id: entityId,
        entity_type: entityType,
        is_read: false,
        is_email_sent: false,
        priority,
      })
      .select()

    if (error) throw error

    // If sendEmail is true, we would trigger an email notification here
    // This would typically be handled by a separate service or webhook
    if (sendEmail) {
      // In a real implementation, you would call your email service here
      // For now, we'll just mark the notification as having an email sent
      await supabase.from("notifications").update({ is_email_sent: true }).eq("id", data[0].id)
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error sending notification:", error)
    return { success: false, error }
  }
}

// Function to send notifications to multiple users
export async function sendBulkNotifications(userIds: string[], notification: Omit<SendNotificationParams, "userId">) {
  const supabase = createServerComponentClient({ cookies })
  const results: { success: number; failed: number; errors: unknown[] } = { success: 0, failed: 0, errors: [] }

  try {
    // Create notification objects for each user
    const notifications = userIds.map((userId) => ({
      user_id: userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      entity_id: notification.entityId,
      entity_type: notification.entityType,
      is_read: false,
      is_email_sent: false,
      priority: notification.priority || "low",
    }))

    // Insert all notifications at once
    const { data, error } = await supabase.from("notifications").insert(notifications).select()

    if (error) throw error

    results.success = notifications.length

    // Handle email sending if required
    if (notification.sendEmail) {
      // In a real implementation, you would call your email service here
      // For now, we'll just mark the notifications as having emails sent
      if (data && data.length > 0) {
        const notificationIds = data.map((n) => n.id)
        await supabase.from("notifications").update({ is_email_sent: true }).in("id", notificationIds)
      }
    }

    return { success: true, results }
  } catch (error) {
    console.error("Error sending bulk notifications:", error)
    results.failed = userIds.length - results.success
    results.errors.push(error)
    return { success: false, results, error }
  }
}

// Function to get unread notification count for a user
export async function getUnreadNotificationCount(userId: string) {
  const supabase = createServerComponentClient({ cookies })

  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (error) throw error

    return { success: true, count }
  } catch (error) {
    console.error("Error getting unread notification count:", error)
    return { success: false, count: 0, error }
  }
}

export { sendNotification as createNotification }
