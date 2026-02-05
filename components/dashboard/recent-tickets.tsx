"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import Link from "next/link"
import { ArrowUpRight, Paperclip, Eye } from "lucide-react"
import { getRecentTickets } from "@/lib/actions/stats"

interface Ticket {
  id: number
  ticket_id: string
  title: string
  description: string | null
  category_name: string | null
  subcategory_name: string | null
  status: string
  created_at: string
  assignee_name: string | null
  spoc_name: string | null
  attachment_count: number
  closed_by_name: string | null
  closed_at: string | null
}

export default function RecentTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTickets()
    // Refresh tickets every 30 seconds for real-time updates
    const interval = setInterval(loadTickets, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadTickets = async () => {
    const result = await getRecentTickets(5)
    if (result.success) {
      setTickets(Array.isArray(result.data) ? result.data : [])
    }
    setIsLoading(false)
  }

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase().replace(/\s+/g, "-")
    return (
      {
        open: "bg-red-50 text-red-700 border border-red-200",
        "in-progress": "bg-yellow-50 text-yellow-700 border border-yellow-200",
        resolved: "bg-green-50 text-green-700 border border-green-200",
        hold: "bg-gray-50 text-gray-700 border border-gray-200",
        closed: "bg-green-50 text-green-700 border border-green-200",
      }[normalizedStatus] || "bg-gray-50 text-gray-700 border border-gray-200"
    )
  }

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent Tickets</h2>
        </div>
        <div className="p-8 text-center text-muted-foreground">Loading tickets...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Recent Tickets</h2>
        <Link href="/tickets" className="text-primary text-sm font-medium hover:text-secondary flex items-center gap-1">
          View All
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">No tickets yet. Create your first ticket!</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground w-10">#</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Date/Time</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Category</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground max-w-[200px]">Description</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">SPOC</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Assignee</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-foreground w-16">Files</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-foreground w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tickets.map((ticket, index) => (
                <tr key={ticket.id} className="hover:bg-muted transition-colors">
                  <td className="px-4 py-3 text-sm text-muted-foreground">{index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {format(new Date(ticket.created_at), "MMM dd, yyyy")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(ticket.created_at), "hh:mm a")}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {ticket.category_name || "N/A"}
                      </span>
                      {ticket.subcategory_name && (
                        <span className="text-xs text-muted-foreground">
                          {ticket.subcategory_name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <span className="text-sm text-foreground line-clamp-2" title={ticket.description || ticket.title}>
                      {ticket.description || ticket.title || "No description"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{ticket.spoc_name || "-"}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{ticket.assignee_name || "Unassigned"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}
                      >
                        {formatStatus(ticket.status)}
                      </span>
                      {ticket.status.toLowerCase() === "closed" && ticket.closed_by_name && (
                        <span className="text-xs text-muted-foreground" title={ticket.closed_at ? format(new Date(ticket.closed_at), "MMM dd, yyyy hh:mm a") : ""}>
                          by {ticket.closed_by_name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {Number(ticket.attachment_count) > 0 ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Paperclip className="w-4 h-4" />
                        <span className="text-xs">{ticket.attachment_count}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title="View ticket"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
