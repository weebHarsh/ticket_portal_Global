"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { ArrowLeft, Edit, MessageSquare, Paperclip, Clock, User, Calendar, Tag, Download, FileText, ListChecks, CheckCircle2, History, RefreshCw, UserPlus, FolderKanban, PauseCircle, PlayCircle, XCircle, PlusCircle, ArrowRightLeft, Building2, GitBranch, Trash2 } from "lucide-react"
import { getTicketById, updateTicketStatus, addComment, getTicketAuditLog, redirectTicket } from "@/lib/actions/tickets"
import { getSubcategoryDetails } from "@/lib/actions/master-data"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import RedirectModal from "@/components/tickets/redirect-modal"
import StatusChangeModal from "@/components/tickets/status-change-modal"

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const ticketId = params.id as string
  const [ticket, setTicket] = useState<any>(null)
  const [closureSteps, setClosureSteps] = useState<string | null>(null)
  const [auditLog, setAuditLog] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [addingComment, setAddingComment] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isRedirectModalOpen, setIsRedirectModalOpen] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [isStatusChangeModalOpen, setIsStatusChangeModalOpen] = useState(false)
  const [selectedNewStatus, setSelectedNewStatus] = useState<string>("")
  const [changingStatus, setChangingStatus] = useState(false)

  // Load current user from session or localStorage
  useEffect(() => {
    try {
      // Prioritize NextAuth session data (for SSO users)
      if (status === "authenticated" && session?.user) {
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
          setCurrentUser(JSON.parse(userData))
        }
      }
    } catch (error) {
      console.error("Failed to parse user data:", error)
    }
  }, [status, session])

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
    if (result.success && result.data) {
      const ticketData = result.data as any
      setTicket(ticketData)
      // Fetch closure steps if ticket has a subcategory
      if (ticketData?.subcategory_id) {
        const subcatResult = await getSubcategoryDetails(ticketData.subcategory_id)
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

  const openStatusChangeModal = (newStatus: string) => {
    setSelectedNewStatus(newStatus)
    setIsStatusChangeModalOpen(true)
  }

  const handleStatusChangeConfirm = async (reason: string, remarks: string) => {
    setChangingStatus(true)
    const result = await updateTicketStatus(Number(ticketId), selectedNewStatus, reason, remarks)
    setChangingStatus(false)

    if (result.success) {
      setIsStatusChangeModalOpen(false)
      setSelectedNewStatus("")
      await loadTicket()
    } else {
      alert("Failed to update status: " + (result.error || "Unknown error"))
    }
  }

  // Get available status options based on user role
  const getAvailableStatusOptions = (): string[] => {
    if (!currentUser || !ticket) return []
    if (ticket.is_deleted || ticket.status === "deleted") return []

    const userId = Number(currentUser.id)
    const isAdmin = currentUser.role?.toLowerCase() === "admin"
    const isInitiator = userId === ticket.created_by
    const isAssignee = userId === ticket.assigned_to
    const isSPOC = userId === ticket.spoc_user_id
    const currentStatus = ticket.status

    const options: string[] = []

    if (isAdmin) {
      return ["open", "on-hold", "resolved", "closed", "returned", "deleted"]
    }

    // SPOC: Can change to On-hold, Resolved, or Open (if currently On-hold/Resolved)
    if (isSPOC) {
      options.push("on-hold", "resolved")
      if (currentStatus === "on-hold" || currentStatus === "resolved") {
        options.push("open")
      }
    }

    // Assignee: Can change to Resolved or Open (if currently Resolved)
    if (isAssignee) {
      options.push("resolved")
      if (currentStatus === "resolved") {
        options.push("open")
      }
    }

    // Initiator: Can change to Closed, Delete, or Open (if currently Resolved)
    if (isInitiator) {
      options.push("closed", "deleted")
      if (currentStatus === "resolved") {
        options.push("open")
      }
    }

    return Array.from(new Set(options))
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

  const handleRedirect = async (businessUnitGroupId: number, spocUserId: number, remarks: string) => {
    setRedirecting(true)
    const result = await redirectTicket(Number(ticketId), businessUnitGroupId, spocUserId, remarks)
    if (result.success) {
      await loadTicket()
      setIsRedirectModalOpen(false)
    } else {
      alert(result.error || "Failed to redirect ticket")
    }
    setRedirecting(false)
  }

  // Check if user can redirect per permissions matrix:
  // 5. Redirect to another SPOC: Initiator ❌ | SPOC ✅ (with remarks) | Assignee ❌
  const canRedirect = currentUser && ticket && (
    currentUser.role?.toLowerCase() === "admin" ||
    currentUser.id === ticket.spoc_user_id
  )

  // Check if user can create sub-ticket (SPOC of the parent ticket)
  const canCreateSubTicket = currentUser && ticket && (
    currentUser.id === ticket.spoc_user_id ||
    currentUser.role?.toLowerCase() === "admin"
  )

  const handleCreateSubTicket = () => {
    if (!ticket) return
    const params = new URLSearchParams({
      parentTicketId: ticketId,
      businessUnitGroupId: ticket.business_unit_group_id?.toString() || "",
      spocId: currentUser?.id?.toString() || "",
      isInternal: ticket.is_internal ? "true" : "false",
    })
    router.push(`/tickets/create?${params.toString()}`)
  }

  const statusColors: Record<string, string> = {
    open: "bg-blue-100 text-blue-700",
    closed: "bg-green-100 text-green-700",
    "on-hold": "bg-yellow-100 text-yellow-700",
    hold: "bg-yellow-100 text-yellow-700",
    resolved: "bg-purple-100 text-purple-700",
    deleted: "bg-red-100 text-red-700",
    returned: "bg-orange-100 text-orange-700",
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
      <div className="space-y-6 bg-card p-4 rounded-xl border border-border dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/tickets")} className="p-2 hover:bg-surface dark:hover:bg-gray-700 rounded-lg transition-colors">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 ">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Details Card */}
            <div className="bg-white dark:bg-gray-800 border border-border rounded-xl p-6">
              <h2 className="font-poppins font-bold text-foreground mb-4">Details</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground-secondary">Description</label>
                  <p className="text-foreground mt-1">{ticket.description || "No description provided"}</p>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white dark:bg-gray-800 border border-border rounded-xl p-6">
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

              <div className="space-y-3 ">
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
            <div className="bg-white dark:bg-gray-800 border border-border rounded-xl p-6">
              <h2 className="font-poppins font-bold text-foreground mb-4 flex items-center gap-2">
                <Paperclip className="w-5 h-5" />
                Attachments ({ticket.attachments?.length || 0})
              </h2>
              {ticket.attachments?.length > 0 ? (
                <div className="space-y-2">
                  {ticket.attachments.map((attachment: any) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-surface dark:hover:bg-gray-700 transition-colors"
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
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors"
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
              <div className="bg-white dark:bg-gray-800 border border-border rounded-xl p-6">
                <h2 className="font-poppins font-bold text-foreground mb-4 flex items-center gap-2">
                  <ListChecks className="w-5 h-5" />
                  Closure Steps
                </h2>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{closureSteps}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Actions */}
            <div className="bg-white dark:bg-gray-800 border border-border rounded-xl p-6">
              <h3 className="font-poppins font-semibold text-foreground mb-4">Status Actions</h3>
              <div className="space-y-2">
                {getAvailableStatusOptions().map((status) => {
                  const statusLabels: Record<string, { label: string; icon: any }> = {
                    open: { label: "Open", icon: PlayCircle },
                    "on-hold": { label: "On Hold", icon: PauseCircle },
                    resolved: { label: "Resolved", icon: CheckCircle2 },
                    closed: { label: "Close", icon: XCircle },
                    deleted: { label: "Delete", icon: Trash2 },
                    returned: { label: "Returned", icon: RefreshCw },
                  }
                  const statusInfo = statusLabels[status] || { label: status, icon: null }
                  const Icon = statusInfo.icon
                  const isCurrentStatus = ticket.status === status

                  return (
                    <Button
                      key={status}
                      onClick={() => openStatusChangeModal(status)}
                      variant="outline"
                      className={`w-full justify-start ${
                        status === "deleted" 
                          ? "border-red-500 hover:border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" 
                          : "dark:hover:bg-primary/20"
                      }`}
                      disabled={isCurrentStatus || changingStatus}
                    >
                      {Icon && <Icon className="w-4 h-4 mr-2" />}
                      {statusInfo.label}
                    </Button>
                  )
                })}
                {canRedirect && (
                  <Button
                    onClick={() => setIsRedirectModalOpen(true)}
                    variant="outline"
                    className="w-full justify-start border-green-500 hover:border-black text-green-600 hover:bg-primary dark:hover:bg-primary/20 dark:hover:text-black"
                  >
                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                    Redirect
                  </Button>
                )}
                {canCreateSubTicket && (
                  <Button
                    onClick={handleCreateSubTicket}
                    variant="outline"
                    className="w-full justify-start border-green-500 hover:border-black text-green-600 hover:bg-primary dark:hover:bg-primary/20 dark:hover:text-black"
                  >
                    <GitBranch className="w-4 h-4 mr-2" />
                    Create Sub-ticket
                  </Button>
                )}
              </div>
            </div>

            {/* Ticket Info */}
            <div className="bg-white dark:bg-gray-800 border border-border rounded-xl p-6">
              <h3 className="font-poppins font-semibold text-foreground mb-4">Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-foreground-secondary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-foreground-secondary">SPOC</p>
                    <p className="text-sm font-medium text-foreground">{ticket.spoc_name || "Unassigned"}</p>
                    {ticket.group_name && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {ticket.group_name}
                      </p>
                    )}
                  </div>
                </div>

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
              <div className="bg-white dark:bg-gray-800 border border-border rounded-xl p-6">
                <h3 className="font-poppins font-semibold text-foreground mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Activity History
                </h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {auditLog.map((log: any) => {
                    // Determine icon and color based on action type
                    let icon = <RefreshCw className="w-4 h-4" />
                    let iconBg = "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    let actionText = ""

                    if (log.action_type === 'created') {
                      icon = <PlusCircle className="w-4 h-4" />
                      iconBg = "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      actionText = "created this ticket"
                    } else if (log.action_type === 'status_change') {
                      if (log.new_value === 'closed') {
                        icon = <CheckCircle2 className="w-4 h-4" />
                        iconBg = "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                        actionText = `closed the ticket`
                      } else if (log.new_value === 'hold') {
                        icon = <PauseCircle className="w-4 h-4" />
                        iconBg = "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
                        actionText = `put the ticket on hold`
                      } else if (log.new_value === 'open') {
                        icon = <PlayCircle className="w-4 h-4" />
                        iconBg = "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        actionText = log.old_value === 'closed' ? `reopened the ticket` : log.old_value === 'hold' ? `removed hold from the ticket` : `opened the ticket`
                      } else {
                        actionText = `changed status from ${log.old_value} to ${log.new_value}`
                      }
                    } else if (log.action_type === 'assignment_change') {
                      icon = <UserPlus className="w-4 h-4" />
                      iconBg = "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                      actionText = `assigned ticket to ${log.new_value}`
                      if (log.old_value && log.old_value !== 'Unassigned') {
                        actionText = `reassigned ticket from ${log.old_value} to ${log.new_value}`
                      }
                    } else if (log.action_type === 'project_change') {
                      icon = <FolderKanban className="w-4 h-4" />
                      iconBg = "bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                      if (log.new_value === 'None') {
                        actionText = `removed project assignment`
                      } else if (log.old_value === 'None') {
                        actionText = `assigned to project ${log.new_value}`
                      } else {
                        actionText = `moved to project ${log.new_value}`
                      }
                    } else if (log.action_type === 'redirection') {
                      icon = <ArrowRightLeft className="w-4 h-4" />
                      iconBg = "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                      actionText = `redirected ticket from ${log.old_value} to ${log.new_value}`
                      if (log.notes) {
                        actionText += ` - ${log.notes}`
                      }
                    } else {
                      actionText = `${log.action_type}: ${log.new_value || ''}`
                    }

                    return (
                      <div key={log.id} className="flex items-start gap-3 py-2 border-b border-border/50 dark:border-gray-700/50 last:border-0">
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

      {/* Redirect Modal */}
      <RedirectModal
        isOpen={isRedirectModalOpen}
        onClose={() => setIsRedirectModalOpen(false)}
        onConfirm={handleRedirect}
        currentBusinessUnitGroupId={ticket?.target_business_group_id || null}
        currentBusinessUnitGroupName={ticket?.target_business_group_name || null}
        ticketTitle={ticket?.title || ""}
      />

      {/* Status Change Modal */}
      <StatusChangeModal
        isOpen={isStatusChangeModalOpen}
        onClose={() => {
          setIsStatusChangeModalOpen(false)
          setSelectedNewStatus("")
        }}
        onConfirm={handleStatusChangeConfirm}
        oldStatus={ticket?.status || ""}
        newStatus={selectedNewStatus}
        ticketNumber={ticket?.ticket_number || 0}
        loading={changingStatus}
      />
    </DashboardLayout>
  )
}
