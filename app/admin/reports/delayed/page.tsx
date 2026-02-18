"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { ArrowLeft, Clock, AlertTriangle, Download } from "lucide-react"
import { getDelayedTickets } from "@/lib/actions/stats"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import * as XLSX from "xlsx"

interface DelayedTicket {
  id: number
  ticket_id: string
  ticket_number: number
  title: string
  created_at: string
  ticket_estimated_duration: string | null
  mapping_estimated_duration_minutes: number
  assignee_name: string | null
  assignee_email: string | null
  target_group_name: string | null
  category_name: string | null
  subcategory_name: string | null
  status: string
  actual_duration_minutes: number
  days_delayed: number
}

export default function DelayedTicketsReportPage() {
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [delayedTickets, setDelayedTickets] = useState<DelayedTicket[]>([])
  const [loading, setLoading] = useState(true)

  // Load current user from session or localStorage
  useEffect(() => {
    try {
      // Prioritize NextAuth session data (for SSO users)
      if (sessionStatus === "authenticated" && session?.user) {
        setCurrentUser({
          id: parseInt(session.user.id || "0"),
          email: session.user.email || "",
          full_name: session.user.name || "",
          role: session.user.role || "user",
        })
      } else {
        // Fallback to localStorage for email/password users
        const userData = localStorage.getItem("user")
        if (userData) {
          const parsedUser = JSON.parse(userData)
          setCurrentUser(parsedUser)
          
          // Check if user is admin
          if (parsedUser.role?.toLowerCase() !== "admin") {
            router.push("/dashboard")
            return
          }
        } else {
          router.push("/login")
          return
        }
      }

      // Check admin access
      const userRole = session?.user?.role?.toLowerCase() || currentUser?.role?.toLowerCase()
      if (userRole !== "admin") {
        router.push("/dashboard")
        return
      }
    } catch (error) {
      console.error("Failed to parse user data:", error)
      router.push("/login")
    }
  }, [sessionStatus, session, router])

  useEffect(() => {
    if (currentUser?.role?.toLowerCase() === "admin") {
      loadDelayedTickets()
    }
  }, [currentUser])

  const loadDelayedTickets = async () => {
    setLoading(true)
    const result = await getDelayedTickets()
    if (result.success && result.data) {
      setDelayedTickets(result.data as DelayedTicket[])
    } else {
      setDelayedTickets([])
    }
    setLoading(false)
  }

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`
    }
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    if (hours < 24) {
      return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`
    }
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    if (remainingHours > 0) {
      return `${days} day${days !== 1 ? "s" : ""} ${remainingHours} hr`
    }
    return `${days} day${days !== 1 ? "s" : ""}`
  }

  const handleExport = () => {
    const exportData = delayedTickets.map((ticket) => ({
      "Ticket ID": ticket.ticket_id,
      "Ticket Number": ticket.ticket_number,
      "Title": ticket.title,
      "Assignee": ticket.assignee_name || "Unassigned",
      "Target Group": ticket.target_group_name || "N/A",
      "Category": ticket.category_name || "N/A",
      "Subcategory": ticket.subcategory_name || "N/A",
      "Status": ticket.status,
      "Created Date": format(new Date(ticket.created_at), "yyyy-MM-dd HH:mm"),
      "Estimated Duration": formatDuration(ticket.mapping_estimated_duration_minutes),
      "Actual Duration": formatDuration(ticket.actual_duration_minutes),
      "Days Delayed": ticket.days_delayed.toFixed(2),
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(exportData)
    XLSX.utils.book_append_sheet(wb, ws, "Delayed Tickets")
    XLSX.writeFile(wb, `delayed-tickets-${format(new Date(), "yyyy-MM-dd")}.xlsx`)
  }

  // Show loading or nothing while checking permissions
  if (loading || !currentUser || currentUser.role?.toLowerCase() !== "admin") {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-foreground-secondary">Loading...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-surface dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-poppins font-bold text-foreground flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
                Delayed Tickets Report
              </h1>
              <p className="text-foreground-secondary mt-2">
                Tickets that have exceeded their estimated duration
              </p>
            </div>
          </div>
          {delayedTickets.length > 0 && (
            <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export to Excel
            </Button>
          )}
        </div>

        {/* Summary Card */}
        <div className="bg-white dark:bg-gray-800 border border-border rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
              <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Total Delayed Tickets</p>
              <p className="text-3xl font-bold text-foreground">{delayedTickets.length}</p>
            </div>
            {delayedTickets.length > 0 && (
              <div className="ml-auto">
                <p className="text-sm text-foreground-secondary">Average Delay</p>
                <p className="text-2xl font-bold text-foreground">
                  {(
                    delayedTickets.reduce((sum, t) => sum + t.days_delayed, 0) / delayedTickets.length
                  ).toFixed(1)}{" "}
                  days
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tickets Table */}
        {delayedTickets.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-border rounded-xl p-12 text-center">
            <Clock className="w-16 h-16 text-foreground-secondary mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium text-foreground mb-2">No Delayed Tickets</p>
            <p className="text-sm text-foreground-secondary">
              All tickets are within their estimated duration.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface/50 dark:bg-gray-700/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Ticket ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Assignee
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Target Group
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Estimated Duration
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Actual Duration
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Days Delayed
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {delayedTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="hover:bg-surface dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => router.push(`/tickets/${ticket.id}`)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">
                          #{ticket.ticket_number}
                        </div>
                        <div className="text-xs text-foreground-secondary">{ticket.ticket_id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-foreground max-w-xs truncate" title={ticket.title}>
                          {ticket.title}
                        </div>
                        {(ticket.category_name || ticket.subcategory_name) && (
                          <div className="text-xs text-foreground-secondary mt-0.5">
                            {ticket.category_name}
                            {ticket.subcategory_name && ` - ${ticket.subcategory_name}`}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-foreground">
                          {ticket.assignee_name || "Unassigned"}
                        </div>
                        {ticket.assignee_email && (
                          <div className="text-xs text-foreground-secondary">{ticket.assignee_email}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-foreground">
                          {ticket.target_group_name || "N/A"}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-foreground">
                          {formatDuration(ticket.mapping_estimated_duration_minutes)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-foreground">
                          {formatDuration(ticket.actual_duration_minutes)}
                        </div>
                        <div className="text-xs text-foreground-secondary">
                          {format(new Date(ticket.created_at), "MMM dd, yyyy")}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div
                          className={`text-sm font-semibold ${
                            ticket.days_delayed > 7
                              ? "text-red-600 dark:text-red-400"
                              : ticket.days_delayed > 3
                              ? "text-orange-600 dark:text-orange-400"
                              : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {ticket.days_delayed.toFixed(1)} days
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                            ticket.status === "open"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                              : ticket.status === "on-hold"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300"
                              : ticket.status === "resolved"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300"
                          }`}
                        >
                          {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace("-", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
