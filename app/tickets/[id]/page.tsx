"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { ArrowLeft, Edit, MessageSquare, Paperclip, Clock, User, Calendar, Tag, Download, FileText, ListChecks, CheckCircle2, History, RefreshCw, UserPlus, FolderKanban, PauseCircle, PlayCircle, XCircle, PlusCircle } from "lucide-react"
import { getTicketById, updateTicketStatus, addComment, getTicketAuditLog } from "@/lib/actions/tickets"
import { getSubcategoryDetails } from "@/lib/actions/master-data"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id as string
  const [ticket, setTicket] = useState<any>(null)
  const [closureSteps, setClosureSteps] = useState<string | null>(null)
  const [auditLog, setAuditLog] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [addingComment, setAddingComment] = useState(false)

  useEffect(() => {
    if (ticketId && !isNaN(Number(ticketId))) {
      loadTicket()
    } else {
      setLoading(false)
    }
  }, [ticketId])

  const loadTicket = async () => {
    setLoading(true)
    const result = await getTicketById(Number(ticketId))
    if (result.success) {
      setTicket(result.data)
      // Fetch closure steps if ticket has a subcategory
      if (result.data?.subcategory_id) {
        const subcatResult = await getSubcategoryDetails(result.data.subcategory_id)
        if (subcatResult.success && subcatResult.data?.closure_steps) {
          setClosureSteps(subcatResult.data.closure_steps)
        }
      }
      // Fetch audit log
      const auditResult = await getTicketAuditLog(Number(ticketId))
      if (auditResult.success) {
        setAuditLog(auditResult.data || [])
      }
    }
    setLoading(false)
  }

  const handleStatusChange = async (newStatus: string) => {
    const result = await updateTicketStatus(Number(ticketId), newStatus)
    if (result.success) {
      await loadTicket()
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setAddingComment(true)
    const result = await addComment(Number(ticketId), newComment)
    if (result.success) {
      setNewComment("")
      await loadTicket()
    }
    setAddingComment(false)
  }

  const statusColors: Record<string, string> = {
    open: "bg-blue-100 text-blue-700",
    closed: "bg-green-100 text-green-700",
    hold: "bg-yellow-100 text-yellow-700",
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-foreground-secondary">Loading ticket...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!ticket) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-foreground-secondary">Ticket not found</p>
          <Button onClick={() => router.push("/tickets")} className="mt-4">
            Back to Tickets
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/tickets")} className="p-2 hover:bg-surface rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-poppins font-bold text-foreground">#{ticket.ticket_number}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status]}`}>
                {ticket.status.toUpperCase()}
              </span>
            </div>
            <p className="text-foreground-secondary mt-1">{ticket.title}</p>
          </div>
          <Button
            onClick={() => router.push(`/tickets/${ticketId}/edit`)}
            className="bg-gradient-to-r from-primary to-secondary"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Ticket
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Details Card */}
            <div className="bg-white border border-border rounded-xl p-6">
              <h2 className="font-poppins font-bold text-foreground mb-4">Details</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground-secondary">Description</label>
                  <p className="text-foreground mt-1">{ticket.description || "No description provided"}</p>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white border border-border rounded-xl p-6">
              <h2 className="font-poppins font-bold text-foreground mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Comments ({ticket.comments?.length || 0})
              </h2>

              <div className="space-y-4 mb-6">
                {ticket.comments?.map((comment: any) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-medium text-sm">
                      {comment.user_name?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{comment.user_name}</span>
                        <span className="text-xs text-foreground-secondary">
                          {format(new Date(comment.created_at), "MMM dd, yyyy HH:mm")}
                        </span>
                      </div>
                      <p className="text-foreground-secondary mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm resize-none"
                  rows={3}
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || addingComment}
                  className="bg-gradient-to-r from-primary to-secondary"
                >
                  {addingComment ? "Adding..." : "Add Comment"}
                </Button>
              </div>
            </div>

            {/* Attachments */}
            <div className="bg-white border border-border rounded-xl p-6">
              <h2 className="font-poppins font-bold text-foreground mb-4 flex items-center gap-2">
                <Paperclip className="w-5 h-5" />
                Attachments ({ticket.attachments?.length || 0})
              </h2>
              {ticket.attachments?.length > 0 ? (
                <div className="space-y-2">
                  {ticket.attachments.map((attachment: any) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-surface transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{attachment.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {attachment.file_size ? `${(attachment.file_size / 1024).toFixed(1)} KB` : "Unknown size"}
                            {attachment.uploader_name && ` • Uploaded by ${attachment.uploader_name}`}
                          </p>
                        </div>
                      </div>
                      {attachment.file_url ? (
                        <a
                          href={attachment.file_url}
                          download={attachment.file_name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">No file URL</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No attachments yet. Add attachments when editing this ticket.
                </p>
              )}
            </div>

            {/* Closure Steps */}
            {closureSteps && (
              <div className="bg-white border border-border rounded-xl p-6">
                <h2 className="font-poppins font-bold text-foreground mb-4 flex items-center gap-2">
                  <ListChecks className="w-5 h-5" />
                  Closure Steps
                </h2>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{closureSteps}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Actions */}
            <div className="bg-white border border-border rounded-xl p-6">
              <h3 className="font-poppins font-semibold text-foreground mb-4">Actions</h3>
              <div className="space-y-2">
                <Button
                  onClick={() => handleStatusChange("open")}
                  variant="outline"
                  className="w-full justify-start"
                  disabled={ticket.status === "open"}
                >
                  Open
                </Button>
                <Button
                  onClick={() => handleStatusChange("hold")}
                  variant="outline"
                  className="w-full justify-start"
                  disabled={ticket.status === "hold"}
                >
                  On Hold
                </Button>
                <Button
                  onClick={() => handleStatusChange("closed")}
                  variant="outline"
                  className="w-full justify-start"
                  disabled={ticket.status === "closed"}
                >
                  Close
                </Button>
              </div>
            </div>

            {/* Ticket Info */}
            <div className="bg-white border border-border rounded-xl p-6">
              <h3 className="font-poppins font-semibold text-foreground mb-4">Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-foreground-secondary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-foreground-secondary">Assignee</p>
                    <p className="text-sm font-medium text-foreground">{ticket.assignee_name || "Unassigned"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-foreground-secondary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-foreground-secondary">Creator</p>
                    <p className="text-sm font-medium text-foreground">{ticket.creator_name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-foreground-secondary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-foreground-secondary">Created</p>
                    <p className="text-sm font-medium text-foreground">
                      {format(new Date(ticket.created_at), "MMM dd, yyyy HH:mm")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-foreground-secondary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-foreground-secondary">Estimated Duration</p>
                    <p className="text-sm font-medium text-foreground">{ticket.estimated_duration || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Tag className="w-5 h-5 text-foreground-secondary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-foreground-secondary">Type</p>
                    <p className="text-sm font-medium text-foreground capitalize">{ticket.ticket_type}</p>
                  </div>
                </div>

                {ticket.category && (
                  <div className="flex items-start gap-3">
                    <Tag className="w-5 h-5 text-foreground-secondary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-foreground-secondary">Category</p>
                      <p className="text-sm font-medium text-foreground">{ticket.category}</p>
                    </div>
                  </div>
                )}

                {ticket.subcategory && (
                  <div className="flex items-start gap-3">
                    <Tag className="w-5 h-5 text-foreground-secondary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-foreground-secondary">Subcategory</p>
                      <p className="text-sm font-medium text-foreground">{ticket.subcategory}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Activity History / Audit Trail */}
            {auditLog.length > 0 && (
              <div className="bg-white border border-border rounded-xl p-6">
                <h3 className="font-poppins font-semibold text-foreground mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Activity History
                </h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {auditLog.map((log: any) => {
                    // Determine icon and color based on action type
                    let icon = <RefreshCw className="w-4 h-4" />
                    let iconBg = "bg-gray-100 text-gray-600"
                    let actionText = ""

                    if (log.action_type === 'created') {
                      icon = <PlusCircle className="w-4 h-4" />
                      iconBg = "bg-blue-100 text-blue-600"
                      actionText = "created this ticket"
                    } else if (log.action_type === 'status_change') {
                      if (log.new_value === 'closed') {
                        icon = <CheckCircle2 className="w-4 h-4" />
                        iconBg = "bg-green-100 text-green-600"
                        actionText = `closed the ticket`
                      } else if (log.new_value === 'hold') {
                        icon = <PauseCircle className="w-4 h-4" />
                        iconBg = "bg-yellow-100 text-yellow-600"
                        actionText = `put the ticket on hold`
                      } else if (log.new_value === 'open') {
                        icon = <PlayCircle className="w-4 h-4" />
                        iconBg = "bg-blue-100 text-blue-600"
                        actionText = log.old_value === 'closed' ? `reopened the ticket` : log.old_value === 'hold' ? `removed hold from the ticket` : `opened the ticket`
                      } else {
                        actionText = `changed status from ${log.old_value} to ${log.new_value}`
                      }
                    } else if (log.action_type === 'assignment_change') {
                      icon = <UserPlus className="w-4 h-4" />
                      iconBg = "bg-purple-100 text-purple-600"
                      actionText = `assigned ticket to ${log.new_value}`
                      if (log.old_value && log.old_value !== 'Unassigned') {
                        actionText = `reassigned ticket from ${log.old_value} to ${log.new_value}`
                      }
                    } else if (log.action_type === 'project_change') {
                      icon = <FolderKanban className="w-4 h-4" />
                      iconBg = "bg-indigo-100 text-indigo-600"
                      if (log.new_value === 'None') {
                        actionText = `removed project assignment`
                      } else if (log.old_value === 'None') {
                        actionText = `assigned to project ${log.new_value}`
                      } else {
                        actionText = `moved to project ${log.new_value}`
                      }
                    } else {
                      actionText = `${log.action_type}: ${log.new_value || ''}`
                    }

                    return (
                      <div key={log.id} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconBg}`}>
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">
                            <span className="font-medium">{log.performed_by_name || 'System'}</span>
                            {' '}{actionText}
                          </p>
                          <p className="text-xs text-foreground-secondary mt-0.5">
                            {format(new Date(log.created_at), "MMM dd, yyyy 'at' HH:mm")}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
