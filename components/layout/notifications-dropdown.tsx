"use client"

import { useEffect, useState } from "react"
import { Bell, Check, CheckCheck } from "lucide-react"
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from "@/lib/actions/notifications"
import Link from "next/link"

interface Notification {
  id: number
  title: string
  message: string
  type: string
  is_read: boolean
  related_ticket_id: number | null
  ticket_number: string | null
  created_at: string
}

export default function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadUnreadCount = async () => {
    const result = await getUnreadCount()
    if (result.success) {
      setUnreadCount(result.count)
    }
  }

  const loadNotifications = async () => {
    setLoading(true)
    const result = await getNotifications()
    if (result.success) {
      setNotifications(result.data)
    }
    setLoading(false)
  }

  const handleToggle = () => {
    if (!isOpen) {
      loadNotifications()
    }
    setIsOpen(!isOpen)
  }

  const handleMarkAsRead = async (id: number) => {
    await markAsRead(id)
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, is_read: true } : n
    ))
    setUnreadCount(Math.max(0, unreadCount - 1))
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
    setNotifications(notifications.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const getTypeColor = (type: string) => {
    const colors = {
      info: "bg-blue-50 border-blue-200 text-blue-700",
      success: "bg-green-50 border-green-200 text-green-700",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-700",
      error: "bg-red-50 border-red-200 text-red-700",
    }
    return colors[type as keyof typeof colors] || colors.info
  }

  const formatTime = (date: string) => {
    const now = new Date()
    const created = new Date(date)
    const diffMs = now.getTime() - created.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return created.toLocaleDateString()
  }

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
      >
        <Bell className="w-5 h-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-border z-50 max-h-[500px] flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-primary hover:text-secondary flex items-center gap-1"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-muted transition-colors ${
                        !notification.is_read ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-sm font-medium text-foreground">
                              {notification.title}
                            </h4>
                            {!notification.is_read && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="text-primary hover:text-secondary"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded border ${getTypeColor(notification.type)}`}>
                              {notification.type}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(notification.created_at)}
                            </span>
                            {notification.ticket_number && (
                              <Link
                                href={`/tickets/${notification.related_ticket_id}`}
                                className="text-xs text-primary hover:underline"
                                onClick={() => setIsOpen(false)}
                              >
                                View Ticket
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
