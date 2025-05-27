import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const searchParams = request.nextUrl.searchParams
  const limit = Number.parseInt(searchParams.get("limit") || "50")
  const offset = Number.parseInt(searchParams.get("offset") || "0")
  const isRead = searchParams.get("is_read")
  const priority = searchParams.get("priority")
  const type = searchParams.get("type")

  try {
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (isRead !== null) {
      query = query.eq("is_read", isRead === "true")
    }

    if (priority) {
      query = query.eq("priority", priority)
    }

    if (type) {
      query = query.eq("type", type)
    }

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({ data, count })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const { id, action } = await request.json()

  if (!id || !action) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    // Verify the notification belongs to the user
    const { data: notification, error: fetchError } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (fetchError || !notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    if (action === "mark_read") {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id)

      if (error) throw error

      return NextResponse.json({ success: true, message: "Notification marked as read" })
    } else if (action === "mark_unread") {
      const { error } = await supabase.from("notifications").update({ is_read: false }).eq("id", id)

      if (error) throw error

      return NextResponse.json({ success: true, message: "Notification marked as unread" })
    } else if (action === "delete") {
      const { error } = await supabase.from("notifications").delete().eq("id", id)

      if (error) throw error

      return NextResponse.json({ success: true, message: "Notification deleted" })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const searchParams = request.nextUrl.searchParams
  const all = searchParams.get("all") === "true"
  const id = searchParams.get("id")

  try {
    if (all) {
      // Delete all notifications for the user
      const { error } = await supabase.from("notifications").delete().eq("user_id", userId)

      if (error) throw error

      return NextResponse.json({ success: true, message: "All notifications deleted" })
    } else if (id) {
      // Verify the notification belongs to the user
      const { data: notification, error: fetchError } = await supabase
        .from("notifications")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single()

      if (fetchError || !notification) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 })
      }

      // Delete the specific notification
      const { error } = await supabase.from("notifications").delete().eq("id", id)

      if (error) throw error

      return NextResponse.json({ success: true, message: "Notification deleted" })
    } else {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 })
  }
}
