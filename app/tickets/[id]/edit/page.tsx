"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { ArrowLeft, Save, Paperclip, Download, Trash2, FileText, Plus, X, Upload, AlertCircle, MessageSquare } from "lucide-react"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
import { getTicketById, addComment } from "@/lib/actions/tickets"
import { getTargetBusinessGroups, getSpocForTargetBusinessGroup } from "@/lib/actions/master-data"
import { Button } from "@/components/ui/button"
import RedirectModal from "@/components/tickets/redirect-modal"

export default function EditTicketPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const ticketId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [originalTicket, setOriginalTicket] = useState<any>(null)
  const [attachments, setAttachments] = useState<any[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [uploadError, setUploadError] = useState("")
  const [uploading, setUploading] = useState(false)
  const [comment, setComment] = useState("")
  const [addingComment, setAddingComment] = useState(false)
  const [isRedirectModalOpen, setIsRedirectModalOpen] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

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
          setCurrentUser(JSON.parse(userData))
        }
      }
    } catch (error) {
      console.error("Failed to parse user data:", error)
    }
  }, [sessionStatus, session])

  useEffect(() => {
    loadData()
  }, [ticketId])

  const loadData = async () => {
    setLoading(true)
    const ticketResult = await getTicketById(Number(ticketId))

    if (ticketResult.success && ticketResult.data) {
      const ticket = ticketResult.data as any
      setOriginalTicket(ticket)

      // Load existing attachments
      if (ticket.attachments) {
        setAttachments(ticket.attachments)
      }
    }

    setLoading(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles: File[] = []
    const invalidFiles: string[] = []

    files.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(`${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`)
      } else {
        validFiles.push(file)
      }
    })

    if (invalidFiles.length > 0) {
      setUploadError(`Files exceed 5MB limit: ${invalidFiles.join(", ")}`)
    } else {
      setUploadError("")
    }

    if (validFiles.length > 0) {
      setNewFiles((prev) => [...prev, ...validFiles])
    }

    e.target.value = ""
  }

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadNewFiles = async () => {
    if (newFiles.length === 0) return true

    setUploading(true)
    const userId = JSON.parse(localStorage.getItem("user") || "{}").id

    try {
      for (const file of newFiles) {
        const uploadFormData = new FormData()
        uploadFormData.append("file", file)
        uploadFormData.append("ticketId", ticketId)
        uploadFormData.append("uploadedBy", userId?.toString() || "")

        const response = await fetch("/api/attachments", {
          method: "POST",
          body: uploadFormData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }
      }
      return true
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to upload files")
      return false
    } finally {
      setUploading(false)
    }
  }

  const deleteAttachment = async (attachmentId: number) => {
    if (!confirm("Are you sure you want to delete this attachment?")) return

    try {
      const response = await fetch(`/api/attachments?id=${attachmentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setAttachments((prev) => prev.filter((a) => a.id !== attachmentId))
      } else {
        alert("Failed to delete attachment")
      }
    } catch (error) {
      console.error("Error deleting attachment:", error)
      alert("Failed to delete attachment")
    }
  }

  // Permission checks
  const isAdmin = currentUser?.role?.toLowerCase() === "admin"
  const isInitiator = currentUser && originalTicket && currentUser.id === originalTicket.created_by
  const isAssignee = currentUser && originalTicket && currentUser.id === originalTicket.assigned_to
  const isSPOC = currentUser && originalTicket && currentUser.id === originalTicket.spoc_user_id
  
  // Check if SPOC name matches logged-in user
  const isSPOCUser = isSPOC && originalTicket?.spoc_name && 
    currentUser?.full_name?.toLowerCase() === originalTicket.spoc_name.toLowerCase()

  // Attachments: Anyone can add attachments
  const canEditAttachments = true

  const handleAddComment = async () => {
    if (!comment.trim()) return

    setAddingComment(true)
    const result = await addComment(Number(ticketId), comment.trim())
    setAddingComment(false)

    if (result.success) {
      setComment("")
      // Reload ticket to get updated comments
      loadData()
    } else {
      alert("Failed to add comment: " + (result.error || "Unknown error"))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setSaving(true)

    // Upload new files
    const uploadSuccess = await uploadNewFiles()
    if (!uploadSuccess) {
      setSaving(false)
      return
    }

    setSaving(false)
    router.push(`/tickets/${ticketId}`)
  }

  const handleRedirect = async (targetBusinessGroupId: number, spocUserId: number, remarks: string) => {
    setRedirecting(true)
    const { redirectTicket } = await import("@/lib/actions/tickets")
    const result = await redirectTicket(Number(ticketId), targetBusinessGroupId, spocUserId, remarks)
    setRedirecting(false)

    if (result.success) {
      router.push(`/tickets/${ticketId}`)
    } else {
      alert("Failed to redirect ticket: " + (result.error || "Unknown error"))
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-foreground-secondary">Loading...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!originalTicket) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-foreground-secondary">Ticket not found</p>
        </div>
      </DashboardLayout>
    )
  }

  const ticketType = originalTicket.ticket_type || "support"
  const isSupportTicket = ticketType === "support"

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-surface rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-poppins font-bold text-foreground">Edit Ticket</h1>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Ticket details are read-only. You can only add comments and attachments.
            </p>
          </div>
        </div>

        {/* Redirect View for SPOC Users */}
        {isSPOCUser && (
          <div className="bg-white dark:bg-gray-800 border border-border rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-poppins font-semibold text-foreground">Redirect Ticket</h3>
              <Button
                onClick={() => setIsRedirectModalOpen(true)}
                className="bg-gradient-to-r from-primary to-secondary"
                disabled={redirecting}
              >
                {redirecting ? "Redirecting..." : "Redirect Ticket"}
              </Button>
            </div>
            <p className="text-sm text-foreground-secondary">
              As the SPOC for this ticket, you can redirect it to another Target Business Group.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Read-only Ticket Details */}
          <div className="bg-white dark:bg-gray-800 border border-border rounded-xl p-6 space-y-4">
            <h3 className="font-poppins font-semibold text-foreground">Ticket Details (Read-Only)</h3>

            {/* Dynamic Layout based on Ticket Type */}
            {isSupportTicket ? (
              /* Support Ticket Layout */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-1">Title</label>
                  <div className="px-4 py-2.5 bg-surface dark:bg-gray-700 rounded-lg text-sm text-foreground">
                    {originalTicket.title || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-1">Status</label>
                  <div className="px-4 py-2.5 bg-surface dark:bg-gray-700 rounded-lg text-sm text-foreground">
                    {originalTicket.status ? originalTicket.status.charAt(0).toUpperCase() + originalTicket.status.slice(1) : "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-1">Category</label>
                  <div className="px-4 py-2.5 bg-surface dark:bg-gray-700 rounded-lg text-sm text-foreground">
                    {originalTicket.category_name || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-1">Subcategory</label>
                  <div className="px-4 py-2.5 bg-surface dark:bg-gray-700 rounded-lg text-sm text-foreground">
                    {originalTicket.subcategory_name || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-1">SPOC</label>
                  <div className="px-4 py-2.5 bg-surface dark:bg-gray-700 rounded-lg text-sm text-foreground">
                    {originalTicket.spoc_name || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-1">Target Business Group</label>
                  <div className="px-4 py-2.5 bg-surface dark:bg-gray-700 rounded-lg text-sm text-foreground">
                    {originalTicket.target_business_group_name || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-1">Assignee</label>
                  <div className="px-4 py-2.5 bg-surface dark:bg-gray-700 rounded-lg text-sm text-foreground">
                    {originalTicket.assignee_name || "Unassigned"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-1">Estimated Duration</label>
                  <div className="px-4 py-2.5 bg-surface dark:bg-gray-700 rounded-lg text-sm text-foreground">
                    {originalTicket.estimated_duration || "-"}
                  </div>
                </div>
              </div>
            ) : (
              /* Requirement Ticket Layout */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground-secondary mb-1">Title</label>
                  <div className="px-4 py-2.5 bg-surface dark:bg-gray-700 rounded-lg text-sm text-foreground">
                    {originalTicket.title || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-1">Status</label>
                  <div className="px-4 py-2.5 bg-surface dark:bg-gray-700 rounded-lg text-sm text-foreground">
                    {originalTicket.status ? originalTicket.status.charAt(0).toUpperCase() + originalTicket.status.slice(1) : "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-1">Priority</label>
                  <div className="px-4 py-2.5 bg-surface dark:bg-gray-700 rounded-lg text-sm text-foreground">
                    {originalTicket.priority ? originalTicket.priority.charAt(0).toUpperCase() + originalTicket.priority.slice(1) : "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-1">Project</label>
                  <div className="px-4 py-2.5 bg-surface dark:bg-gray-700 rounded-lg text-sm text-foreground">
                    {originalTicket.project_name || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-1">Assignee</label>
                  <div className="px-4 py-2.5 bg-surface dark:bg-gray-700 rounded-lg text-sm text-foreground">
                    {originalTicket.assignee_name || "Unassigned"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-1">Estimated Release Date</label>
                  <div className="px-4 py-2.5 bg-surface dark:bg-gray-700 rounded-lg text-sm text-foreground">
                    {originalTicket.estimated_release_date ? new Date(originalTicket.estimated_release_date).toLocaleDateString() : "-"}
                  </div>
                </div>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground-secondary mb-1">Description</label>
              <div className="px-4 py-2.5 bg-surface dark:bg-gray-700 rounded-lg text-sm text-foreground whitespace-pre-wrap">
                {originalTicket.description || "-"}
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white dark:bg-gray-800 border border-border rounded-xl p-6 space-y-4">
            <h3 className="font-poppins font-semibold text-foreground">Comments</h3>

            {/* Existing Comments */}
            {originalTicket.comments && originalTicket.comments.length > 0 && (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {originalTicket.comments.map((comment: any) => (
                  <div key={comment.id} className="flex gap-3 pb-3 border-b border-border last:border-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                      {comment.user_name?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground text-sm">{comment.user_name}</span>
                        <span className="text-xs text-foreground-secondary">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-foreground-secondary whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Comment */}
            <div className="space-y-3">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                rows={4}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm resize-none"
              />
              <Button
                type="button"
                onClick={handleAddComment}
                disabled={!comment.trim() || addingComment}
                className="bg-gradient-to-r from-primary to-secondary"
              >
                {addingComment ? "Adding..." : "Add Comment"}
              </Button>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="bg-white dark:bg-gray-800 border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-poppins font-semibold text-foreground flex items-center gap-2">
                <Paperclip className="w-5 h-5" />
                Attachments ({attachments.length + newFiles.length})
              </h3>
            </div>

            {uploadError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                {uploadError}
              </div>
            )}

            {/* Existing Attachments */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Existing Files</p>
                {attachments.map((attachment: any) => (
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
                    <div className="flex items-center gap-2">
                      {attachment.file_url && (
                        <a
                          href={attachment.file_url}
                          download={attachment.file_name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteAttachment(attachment.id)}
                        disabled={!canEditAttachments}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* New Files to Upload */}
            {newFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">New Files (will be uploaded on save)</p>
                {newFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Upload className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB • Ready to upload
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeNewFile(idx)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload New Files */}
            <label className={`flex items-center justify-center w-full px-4 py-4 border-2 border-dashed border-border rounded-lg transition-colors ${
              canEditAttachments 
                ? "cursor-pointer hover:border-primary dark:hover:border-primary" 
                : "opacity-50 cursor-not-allowed"
            }`}>
              <div className="text-center">
                <Plus className="w-5 h-5 text-foreground-secondary mx-auto mb-1" />
                <span className="text-sm font-medium text-foreground">Add attachments</span>
                <p className="text-xs text-foreground-secondary">Max 5MB per file</p>
              </div>
              <input 
                type="file" 
                multiple 
                onChange={handleFileChange} 
                disabled={!canEditAttachments}
                className="hidden" 
              />
            </label>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || uploading} className="bg-gradient-to-r from-primary to-secondary">
              <Save className="w-4 h-4 mr-2" />
              {saving || uploading ? "Saving..." : "Save Attachments"}
            </Button>
          </div>
        </form>

        {/* Redirect Modal */}
        <RedirectModal
          isOpen={isRedirectModalOpen}
          onClose={() => setIsRedirectModalOpen(false)}
          onConfirm={handleRedirect}
          currentBusinessUnitGroupId={originalTicket?.target_business_group_id || null}
          currentBusinessUnitGroupName={originalTicket?.target_business_group_name || null}
          ticketTitle={originalTicket?.title || ""}
        />
      </div>
    </DashboardLayout>
  )
}
