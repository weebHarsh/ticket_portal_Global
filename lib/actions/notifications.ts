"use server"

import { sql } from "@/lib/db"
import { getCurrentUser } from "./auth"

export async function getNotifications() {
  try {
    const user = await getCurrentUser()
    if (!user || !user.id) {
      return { success: false, error: "Not authenticated", data: [] }
    }

    const result = await sql`
      SELECT
        n.id,
        n.title,
        n.message,
        n.type,
        n.is_read,
        n.related_ticket_id,
        n.created_at,
        t.ticket_id as ticket_number
      FROM notifications n
      LEFT JOIN tickets t ON n.related_ticket_id = t.id
      WHERE n.user_id = ${user.id}
      ORDER BY n.created_at DESC
      LIMIT 50
    `

    return { success: true, data: result }
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return { success: false, error: "Failed to fetch notifications", data: [] }
  }
}

export async function getUnreadCount() {
  try {
    const user = await getCurrentUser()
    if (!user || !user.id) {
      return { success: false, error: "Not authenticated", count: 0 }
    }

    const result = await sql`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = ${user.id} AND is_read = FALSE
    `

    return { success: true, count: Number(result[0]?.count || 0) }
  } catch (error) {
    console.error("Error fetching unread count:", error)
    return { success: false, error: "Failed to fetch unread count", count: 0 }
  }
}

export async function markAsRead(notificationId: number) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.id) {
      return { success: false, error: "Not authenticated" }
    }

    await sql`
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = ${notificationId} AND user_id = ${user.id}
    `

    return { success: true }
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return { success: false, error: "Failed to mark notification as read" }
  }
}

export async function markAllAsRead() {
  try {
    const user = await getCurrentUser()
    if (!user || !user.id) {
      return { success: false, error: "Not authenticated" }
    }

    await sql`
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = ${user.id} AND is_read = FALSE
    `

    return { success: true }
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return { success: false, error: "Failed to mark all notifications as read" }
  }
}
