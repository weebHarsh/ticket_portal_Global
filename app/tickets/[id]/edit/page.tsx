"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { ArrowLeft, Save, Paperclip, Download, Trash2, FileText, Plus, X, Upload, AlertCircle } from "lucide-react"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
import { getTicketById } from "@/lib/actions/tickets"
import { getBusinessUnitGroups, getCategories, getSubcategories } from "@/lib/actions/master-data"
import { getUsers } from "@/lib/actions/tickets"
import { Button } from "@/components/ui/button"
import { updateTicket } from "@/lib/actions/tickets"

export default function EditTicketPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const ticketId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [originalTicket, setOriginalTicket] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "",
    priority: "",
    businessUnitGroupId: "",
    categoryId: "",
    subcategoryId: "",
    assigneeId: "",
    estimatedDuration: "",
  })

  const [businessUnitGroups, setBusinessUnitGroups] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [attachments, setAttachments] = useState<any[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [uploadError, setUploadError] = useState("")
  const [uploading, setUploading] = useState(false)

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
    const [ticketResult, buResult, catResult, usersResult] = await Promise.all([
      getTicketById(Number(ticketId)),
      getBusinessUnitGroups(),
      getCategories(),
      getUsers(),
    ])

    if (ticketResult.success && ticketResult.data) {
      const ticket = ticketResult.data as any
      setOriginalTicket(ticket) // Store original ticket for permission checks
      setFormData({
        title: ticket.title || "",
        description: ticket.description || "",
        status: ticket.status || "",
        priority: ticket.priority || "",
        businessUnitGroupId: ticket.business_unit_group_id?.toString() || "",
        categoryId: ticket.category_id?.toString() || "",
        subcategoryId: ticket.subcategory_id?.toString() || "",
        assigneeId: ticket.assigned_to?.toString() || "",
        estimatedDuration: ticket.estimated_duration || "",
      })

      // Load existing attachments
      if (ticket.attachments) {
        setAttachments(ticket.attachments)
      }

      if (ticket.category_id) {
        const subcatResult = await getSubcategories(ticket.category_id)
        if (subcatResult.success) setSubcategories(subcatResult.data)
      }
    }

    if (buResult.success) setBusinessUnitGroups(buResult.data)
    if (catResult.success) setCategories(catResult.data)
    if (usersResult.success) setUsers(usersResult.data)

    setLoading(false)
  }

  useEffect(() => {
    if (formData.categoryId) {
      loadSubcategories(Number(formData.categoryId))
    }
  }, [formData.categoryId])

  const loadSubcategories = async (categoryId: number) => {
    const result = await getSubcategories(categoryId)
    if (result.success) {
      setSubcategories(result.data)
    }
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
  const isResolvedOrClosed = originalTicket && (originalTicket.status === "resolved" || originalTicket.status === "closed")
  const isResolved = originalTicket && originalTicket.status === "resolved"

  // If ticket is resolved or closed, only admin can edit (except for reopening)
  const canEditAtAll = isAdmin || !isResolvedOrClosed || (isResolved && (isInitiator || isAssignee))

  // Field-level permissions per permissions matrix:
  // 1. Edit All Fields: Initiator ✅ | SPOC ❌ | Assignee ❌
  const canEditTitle = canEditAtAll && (isAdmin || isInitiator)
  const canEditDescription = canEditAtAll && (isAdmin || isInitiator) // Removed assignee - only initiator can edit
  const canEditPriority = canEditAtAll && isAdmin
  const canEditBusinessUnitGroup = canEditAtAll && isAdmin
  const canEditCategory = canEditAtAll && isAdmin
  const canEditSubcategory = canEditAtAll && isAdmin
  const canEditEstimatedDuration = canEditAtAll && isAdmin
  
  // 4. Assign / Reselect Assignee: Initiator ❌ | SPOC ✅ | Assignee ❌
  const canEditAssignee = canEditAtAll && (isAdmin || isSPOC)
  
  // Status edit permissions:
  // 6. Change Status to On-Hold: Initiator ❌ | SPOC ✅ | Assignee ❌
  // 7. Update Status to Resolved: Initiator ❌ | SPOC ❌ | Assignee ✅
  // 3. Reopen Resolved Ticket: Initiator ✅ | SPOC ❌ | Assignee ✅
  // Note: Status changes are handled in updateTicketStatus() function, but we need to restrict the dropdown
  const canEditStatus = canEditAtAll && (isAdmin || isSPOC || isAssignee)
  
  // Attachments: Initiator, Assignee, and SPOC can manage (keeping current logic)
  const canEditAttachments = canEditAtAll && (isAdmin || isInitiator || isAssignee || isSPOC)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Double-check permissions before submitting
    if (!canEditAtAll) {
      alert("You do not have permission to edit this ticket.")
      return
    }

    setSaving(true)

    // Upload new files first
    const uploadSuccess = await uploadNewFiles()
    if (!uploadSuccess) {
      setSaving(false)
      return
    }

    const result = await updateTicket(Number(ticketId), {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      priority: formData.priority,
      businessUnitGroupId: Number(formData.businessUnitGroupId),
      categoryId: Number(formData.categoryId),
      subcategoryId: Number(formData.subcategoryId),
      assigneeId: Number(formData.assigneeId),
      estimatedDuration: formData.estimatedDuration,
    })

    setSaving(false)

    if (result.success) {
      router.push(`/tickets/${ticketId}`)
    } else {
      alert("Failed to update ticket")
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

  // Show access denied message if user can't edit at all
  if (!canEditAtAll) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => router.back()} className="p-2 hover:bg-surface dark:hover:bg-gray-700 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-poppins font-bold text-foreground">Edit Ticket</h1>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Access Restricted</h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  This ticket is {originalTicket?.status} and can only be edited by administrators.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-surface rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-poppins font-bold text-foreground">Edit Ticket</h1>
        </div>

        {/* Permission Info Banner */}
        {!isAdmin && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {isInitiator && "As the initiator, you can only edit the Title and Description."}
                {isAssignee && !isInitiator && "As the assignee, you can only edit the Status and Description."}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 border border-border rounded-xl p-6 space-y-4">
            <h3 className="font-poppins font-semibold text-foreground">Basic Information</h3>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                disabled={!canEditTitle}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                disabled={!canEditDescription}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                  disabled={!canEditStatus}
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="open">Open</option>
                  <option value="on-hold">On Hold</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                  <option value="returned">Returned</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Priority *</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  required
                  disabled={!canEditPriority}
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-border rounded-xl p-6 space-y-4">
            <h3 className="font-poppins font-semibold text-foreground">Classification</h3>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Business Unit Group *</label>
              <select
                value={formData.businessUnitGroupId}
                onChange={(e) => setFormData({ ...formData, businessUnitGroupId: e.target.value })}
                required
                disabled={!canEditBusinessUnitGroup}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select...</option>
                {businessUnitGroups.map((bu) => (
                  <option key={bu.id} value={bu.id}>
                    {bu.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                required
                disabled={!canEditCategory}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Subcategory *</label>
              <select
                value={formData.subcategoryId}
                onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })}
                required
                disabled={!canEditSubcategory || !formData.categoryId}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select...</option>
                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-border rounded-xl p-6 space-y-4">
            <h3 className="font-poppins font-semibold text-foreground">Assignment</h3>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Assignee *</label>
              <select
                value={formData.assigneeId}
                onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                required
                disabled={!canEditAssignee}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Estimated Duration</label>
              <input
                type="text"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                disabled={!canEditEstimatedDuration}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
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
            <Button type="submit" disabled={saving} className="bg-gradient-to-r from-primary to-secondary">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
