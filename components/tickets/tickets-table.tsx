"use client"

import React, { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { Eye, Edit, Download, Paperclip, FileDown, UserPlus, FileText, X, ChevronRight, ChevronDown, History } from "lucide-react"
import {
  getTickets,
  getTicketById,
  softDeleteTicket,
  updateTicketAssignee,
  updateTicketStatus,
  updateTicketProject,
  getUsers,
} from "@/lib/actions/tickets"
import { getMyTeamMembers } from "@/lib/actions/my-team"
import * as XLSX from "xlsx"
import AssigneeModal from "./assignee-modal"
import ProjectModal from "./project-modal"
import TicketHistoryTooltip from "./ticket-history-tooltip"
import StatusChangeModal from "./status-change-modal"
import { FolderKanban } from "lucide-react"

interface Ticket {
  id: number
  ticket_id: string
  ticket_number: number
  title: string
  description: string
  category_name: string | null
  subcategory_name: string | null
  ticket_type: "support" | "requirement"
  status: "open" | "on-hold" | "resolved" | "closed" | "returned" | "deleted"
  created_at: string
  created_by: number
  creator_name: string | null
  assignee_name: string | null
  assigned_to: number | null
  spoc_name: string | null
  spoc_user_id: number | null
  estimated_duration: string
  is_deleted: boolean
  attachment_count: number
  business_unit_group_id: number
  group_name: string | null
  target_business_group_name: string | null
  assignee_group_name: string | null
  initiator_group_name: string | null
  project_id: number | null
  project_name: string | null
  estimated_release_date: string | null
  closed_by_name: string | null
  closed_at: string | null
  hold_by_name: string | null
  hold_at: string | null
  // New fields for internal tickets, sub-tickets, and redirection
  is_internal: boolean
  parent_ticket_id: number | null
  redirected_from_business_unit_group_id: number | null
  redirected_from_spoc_user_id: number | null
  redirected_from_group_name: string | null
  redirected_from_spoc_name: string | null
  redirection_remarks: string | null
  redirected_at: string | null
  child_ticket_count: number
}

interface User {
  id: number
  full_name: string
  email: string
}

interface TicketsTableProps {
  filters?: {
    status?: string
    assignee?: string
    type?: string
    search?: string
    dateFrom?: string
    dateTo?: string
    myTeam?: boolean
    userId?: number
    isInternal?: boolean
    targetBusinessGroup?: string
    initiator?: string
    initiatorGroup?: string
    project?: string
    [key: string]: any
  }
  onExportReady?: (exportFn: () => void) => void
  onTicketsChange?: (tickets: Ticket[]) => void
}

export default function TicketsTable({ filters, onExportReady, onTicketsChange }: TicketsTableProps) {
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [expandedTickets, setExpandedTickets] = useState<Set<number>>(new Set())
  const [childTickets, setChildTickets] = useState<Map<number, Ticket[]>>(new Map())

  // Modal state for assignee selection
  const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false)
  const [selectedTicketForAssignment, setSelectedTicketForAssignment] = useState<Ticket | null>(null)

  // Modal state for project selection
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [selectedTicketForProject, setSelectedTicketForProject] = useState<Ticket | null>(null)

  // Activity history is now shown in tooltip, no modal state needed

  // Modal state for status change
  const [isStatusChangeModalOpen, setIsStatusChangeModalOpen] = useState(false)
  const [selectedTicketForStatusChange, setSelectedTicketForStatusChange] = useState<Ticket | null>(null)
  const [selectedNewStatus, setSelectedNewStatus] = useState<string>("")
  const [changingStatus, setChangingStatus] = useState(false)

  // Attachments dropdown state
  const [attachmentsDropdownOpen, setAttachmentsDropdownOpen] = useState<number | null>(null)
  const [attachmentsList, setAttachmentsList] = useState<any[]>([])
  const [loadingAttachments, setLoadingAttachments] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAttachmentsDropdownOpen(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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
    } catch (e) {
      console.error("Failed to parse user data:", e)
    }
  }, [sessionStatus, session])

  useEffect(() => {
    loadTickets()
    loadUsers()
  }, [filters, currentUser])

  // Expose export function to parent
  useEffect(() => {
    if (onExportReady) {
      onExportReady(handleExport)
    }
  }, [tickets])

  // Load child tickets when a parent ticket is expanded
  useEffect(() => {
    const loadChildTickets = async () => {
      const promises: Promise<void>[] = []
      
      expandedTickets.forEach((parentId) => {
        if (!childTickets.has(parentId)) {
          promises.push(
            getTickets({ parentTicketId: parentId })
              .then((result) => {
                if (result.success && result.data) {
                  setChildTickets((prev) => {
                    const newMap = new Map(prev)
                    newMap.set(parentId, result.data as Ticket[])
                    return newMap
                  })
                }
              })
              .catch((error) => {
                console.error(`Error loading child tickets for ${parentId}:`, error)
              })
          )
        }
      })

      await Promise.all(promises)
    }

    if (expandedTickets.size > 0) {
      loadChildTickets()
    }
  }, [expandedTickets])

  const toggleExpand = (ticketId: number) => {
    setExpandedTickets((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId)
      } else {
        newSet.add(ticketId)
      }
      return newSet
    })
  }

  const canEditTicket = (ticket: Ticket) => {
    if (!currentUser) return false
    const isAdmin = currentUser.role?.toLowerCase() === "admin"
    const isInitiator = currentUser.id === ticket.created_by
    const isAssignee = currentUser.id === ticket.assigned_to
    const isSPOC = currentUser.id === ticket.spoc_user_id
    return isAdmin || isInitiator || isAssignee || isSPOC
  }

  const loadTickets = async () => {
    setIsLoading(true)
    const result = await getTickets(filters)
    if (result.success && result.data) {
      let ticketsData = result.data as Ticket[]

      // Filter tickets based on user role and team settings
      if (currentUser && currentUser.role?.toLowerCase() !== "admin") {
        const userId = Number(currentUser.id)

        // If "My Team" filter is active, include team members' tickets
        if (filters?.myTeam) {
          // Fetch team members
          const teamResult = await getMyTeamMembers(userId)
          const teamMemberIds = teamResult.success && teamResult.data
            ? teamResult.data.map((m: any) => Number(m.id))
            : []

          // Include tickets where:
          // - User is SPOC, creator, or assignee
          // - OR team members are creator or assignee
          ticketsData = ticketsData.filter((ticket: Ticket) =>
            ticket.spoc_user_id === userId ||
            ticket.created_by === userId ||
            ticket.assigned_to === userId ||
            teamMemberIds.includes(ticket.created_by) ||
            teamMemberIds.includes(ticket.assigned_to || 0)
          )
        } else {
          // Default: show only user's own tickets
          ticketsData = ticketsData.filter((ticket: Ticket) =>
            ticket.spoc_user_id === userId ||
            ticket.created_by === userId ||
            ticket.assigned_to === userId
          )
        }
      }

      setTickets(ticketsData)
      if (onTicketsChange) {
        onTicketsChange(ticketsData)
      }
    } else {
      setTickets([])
      if (onTicketsChange) {
        onTicketsChange([])
      }
    }
    setIsLoading(false)
  }

  const loadUsers = async () => {
    const result = await getUsers()
    if (result.success && result.data) {
      setUsers(result.data as User[])
    }
  }

  const handleDuplicate = async (ticketId: number) => {
    const result = await getTicketById(ticketId)
    if (result.success && result.data) {
      const ticket = result.data as any
      const params = new URLSearchParams({
        duplicate: "true",
        ticketType: ticket.ticket_type || "support",
        businessUnitGroupId: ticket.business_unit_group_id?.toString() || "",
        projectName: ticket.project_name || "",
        categoryId: ticket.category_id?.toString() || "",
        subcategoryId: ticket.subcategory_id?.toString() || "",
        title: ticket.title || "",
        description: ticket.description || "",
        estimatedDuration: ticket.estimated_duration || "",
        assigneeId: ticket.assigned_to?.toString() || "",
        productReleaseName: ticket.product_release_name || "",
        isInternal: ticket.is_internal ? "true" : "false",
      })
      router.push(`/tickets/create?${params.toString()}`)
    }
  }


  const handleAssigneeChange = async (ticketId: number, newAssigneeId: number | null) => {
    const result = await updateTicketAssignee(ticketId, newAssigneeId || 0)
    if (result.success) {
      loadTickets()
    } else {
      alert("Failed to update assignee")
    }
  }

  const openAssigneeModal = (ticket: Ticket) => {
    setSelectedTicketForAssignment(ticket)
    setIsAssigneeModalOpen(true)
  }

  const handleAssigneeSelect = (userId: number | null) => {
    if (selectedTicketForAssignment) {
      handleAssigneeChange(selectedTicketForAssignment.id, userId)
    }
  }

  const openProjectModal = (ticket: Ticket) => {
    setSelectedTicketForProject(ticket)
    setIsProjectModalOpen(true)
  }

  const handleProjectSelect = async (projectId: number | null) => {
    if (selectedTicketForProject) {
      const result = await updateTicketProject(selectedTicketForProject.id, projectId)
      if (result.success) {
        loadTickets()
      } else {
        alert("Failed to update project")
      }
    }
  }

  const canEditProject = (ticket: Ticket) => {
    // Only allow project selection for requirement tickets, not support tickets
    if (ticket.ticket_type !== "requirement") return false
    if (!currentUser) return false
    const userId = Number(currentUser.id)
    return (
      userId === ticket.spoc_user_id ||
      currentUser.role?.toLowerCase() === "admin"
    )
  }

  const canEditAssignee = (ticket: Ticket) => {
    if (!currentUser) return false
    const userId = Number(currentUser.id) // Ensure ID is a number for comparison
    return (
      userId === ticket.spoc_user_id ||
      currentUser.role?.toLowerCase() === "admin"
    )
  }

  const canEditStatus = (ticket: Ticket) => {
    if (!currentUser) return false
    if (ticket.is_deleted || ticket.status === "deleted") return false
    const userId = Number(currentUser.id)
    const isAdmin = currentUser.role?.toLowerCase() === "admin"
    const isInitiator = userId === ticket.created_by
    const isAssignee = userId === ticket.assigned_to
    const isSPOC = userId === ticket.spoc_user_id
    
    return isAdmin || isInitiator || isAssignee || isSPOC
  }

  // Get available status options based on user role and current status
  const getAvailableStatusOptions = (ticket: Ticket): string[] => {
    if (!currentUser) return []
    if (ticket.is_deleted || ticket.status === "deleted") return []
    
    const userId = Number(currentUser.id)
    const isAdmin = currentUser.role?.toLowerCase() === "admin"
    const isInitiator = userId === ticket.created_by
    const isAssignee = userId === ticket.assigned_to
    const isSPOC = userId === ticket.spoc_user_id
    const currentStatus = ticket.status

    const options: string[] = []

    if (isAdmin) {
      // Admins can set any status
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

    // Remove duplicates and ensure current status is included
    const uniqueOptions = Array.from(new Set(options))
    if (currentStatus && !uniqueOptions.includes(currentStatus)) {
      uniqueOptions.unshift(currentStatus)
    }

    return uniqueOptions
  }

  const openStatusChangeModal = (ticket: Ticket, newStatus: string) => {
    setSelectedTicketForStatusChange(ticket)
    setSelectedNewStatus(newStatus)
    setIsStatusChangeModalOpen(true)
  }

  const handleStatusChangeConfirm = async (reason: string, remarks: string) => {
    if (!selectedTicketForStatusChange) return

    setChangingStatus(true)
    const result = await updateTicketStatus(
      selectedTicketForStatusChange.id,
      selectedNewStatus,
      reason,
      remarks
    )
    setChangingStatus(false)

    if (result.success) {
      setIsStatusChangeModalOpen(false)
      setSelectedTicketForStatusChange(null)
      setSelectedNewStatus("")
      // Reload tickets to get updated status
      loadTickets()
    } else {
      alert("Failed to update status: " + (result.error || "Unknown error"))
    }
  }

  const handleDelete = async (ticket: Ticket) => {
    // Open status change modal for delete
    openStatusChangeModal(ticket, "deleted")
  }

  const toggleAttachmentsDropdown = async (ticketId: number) => {
    if (attachmentsDropdownOpen === ticketId) {
      setAttachmentsDropdownOpen(null)
      return
    }

    setAttachmentsDropdownOpen(ticketId)
    setLoadingAttachments(true)

    const result = await getTicketById(ticketId)
    if (result.success && result.data?.attachments) {
      setAttachmentsList(result.data.attachments)
    } else {
      setAttachmentsList([])
    }
    setLoadingAttachments(false)
  }

  const statusColor = {
    open: "bg-blue-100 text-blue-700",
    "on-hold": "bg-yellow-100 text-yellow-700",
    resolved: "bg-purple-100 text-purple-700",
    closed: "bg-green-100 text-green-700",
    returned: "bg-orange-100 text-orange-700",
    deleted: "bg-gray-100 text-gray-700",
  }

  const handleExport = () => {
    // Prepare data for export
    const exportData = tickets.map((ticket) => ({
      "#": ticket.ticket_number,
      "Initiator": ticket.creator_name || "Unknown",
      "Initiator Group": ticket.initiator_group_name || "No Group",
      "Date": format(new Date(ticket.created_at), "MMM dd, yyyy"),
      "Time": format(new Date(ticket.created_at), "hh:mm a"),
      "Type": ticket.ticket_type,
      "Ticket ID": ticket.ticket_id,
      "Title": ticket.ticket_type === "requirement" ? (ticket.title || "Untitled") : "-",
      "Category": ticket.ticket_type === "support" ? (ticket.category_name || "N/A") : "-",
      "Subcategory": ticket.ticket_type === "support" ? (ticket.subcategory_name || "-") : "-",
      "Project": ticket.project_name || "-",
      "Release Date": ticket.estimated_release_date
        ? format(new Date(ticket.estimated_release_date), "MMM dd, yyyy")
        : "-",
      "Description": ticket.description || "",
      "Assignee": ticket.assignee_name || "Unassigned",
      "SPOC": ticket.spoc_name || "-",
      "Status": ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1),
      "Closed By": ticket.closed_by_name || "-",
      "Closed At": ticket.closed_at ? format(new Date(ticket.closed_at), "MMM dd, yyyy hh:mm a") : "-",
      "Hold By": ticket.hold_by_name || "-",
      "Hold At": ticket.hold_at ? format(new Date(ticket.hold_at), "MMM dd, yyyy hh:mm a") : "-",
    }))

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(exportData)

    // Set column widths
    ws["!cols"] = [
      { wch: 5 },  // #
      { wch: 20 }, // Initiator
      { wch: 15 }, // Group
      { wch: 15 }, // Date
      { wch: 10 }, // Time
      { wch: 12 }, // Type
      { wch: 15 }, // Ticket ID
      { wch: 30 }, // Title
      { wch: 20 }, // Category
      { wch: 20 }, // Subcategory
      { wch: 20 }, // Project
      { wch: 15 }, // Release Date
      { wch: 40 }, // Description
      { wch: 20 }, // Assignee
      { wch: 15 }, // SPOC
      { wch: 12 }, // Status
      { wch: 20 }, // Closed By
      { wch: 20 }, // Closed At
      { wch: 20 }, // Hold By
      { wch: 20 }, // Hold At
    ]

    XLSX.utils.book_append_sheet(wb, ws, "Tickets")

    // Generate filename with timestamp
    const filename = `tickets_${format(new Date(), "yyyy-MM-dd_HHmmss")}.xlsx`

    // Download file
    XLSX.writeFile(wb, filename)
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-border rounded-xl overflow-hidden">
        <div className="p-8 text-center text-foreground-secondary">Loading tickets...</div>
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-border rounded-xl overflow-hidden">
        <div className="p-8 text-center text-foreground-secondary">
          No tickets found. Try adjusting your filters or create a new ticket.
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface dark:bg-gray-700 border-b border-border">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-foreground whitespace-nowrap w-10"></th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-foreground whitespace-nowrap">
                Initiator
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-foreground whitespace-nowrap">
                Date
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-foreground whitespace-nowrap">
                Type
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-foreground whitespace-nowrap">
                Title / Category
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-foreground whitespace-nowrap">
                Project
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-foreground whitespace-nowrap max-w-xs">
                Description
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-foreground whitespace-nowrap">
                SPOC
              </th>
              {filters?.isInternal && (
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-foreground whitespace-nowrap">
                  Target Business Group
                </th>
              )}
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-foreground whitespace-nowrap">
                Assignee
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-foreground whitespace-nowrap">
                Status
              </th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-foreground whitespace-nowrap w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tickets
              .filter((t) => !t.parent_ticket_id) // Only show parent tickets in main list
              .map((ticket, index) => {
                const hasChildren = (ticket.child_ticket_count || 0) > 0
                const isExpanded = expandedTickets.has(ticket.id)
                const children = childTickets.get(ticket.id) || []

                return (
                  <React.Fragment key={ticket.id}>
                    <tr
                      className={`hover:bg-surface dark:hover:bg-gray-700 transition-colors ${
                        ticket.is_deleted ? "opacity-50 bg-gray-50 dark:bg-gray-900/50" : ""
                      }`}
                    >
                      {/* Expand/Collapse Button */}
                      <td className="px-3 py-2.5 whitespace-nowrap w-10">
                        {hasChildren ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleExpand(ticket.id)
                            }}
                            className="p-1 hover:bg-surface dark:hover:bg-gray-700 rounded transition-colors"
                            title={isExpanded ? "Collapse" : "Expand"}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-foreground-secondary" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-foreground-secondary" />
                            )}
                          </button>
                        ) : (
                          <div className="w-4 h-4" />
                        )}
                      </td>

                      {/* Initiator Name and Group */}
                      <td
                        className="px-3 py-2.5 whitespace-nowrap cursor-pointer hover:text-primary"
                        onClick={() => router.push(`/tickets/${ticket.id}`)}
                      >
                        <div className="text-sm font-medium text-foreground">{ticket.creator_name || "Unknown"}</div>
                        <div className="text-xs text-foreground-secondary">{ticket.initiator_group_name || "No Group"}</div>
                      </td>

                {/* Date - Compact format */}
                <td
                  className="px-3 py-2.5 whitespace-nowrap cursor-pointer hover:text-primary"
                  onClick={() => router.push(`/tickets/${ticket.id}`)}
                >
                  <div className="text-sm text-foreground">{format(new Date(ticket.created_at), "dd MMM yyyy")}</div>
                  <div className="text-xs text-foreground-secondary">{format(new Date(ticket.created_at), "hh:mm a")}</div>
                </td>

                {/* Type + Row Number */}
                <td
                  className="px-3 py-2.5 whitespace-nowrap cursor-pointer"
                  onClick={() => router.push(`/tickets/${ticket.id}`)}
                >
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                    ticket.ticket_type === "requirement"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {ticket.ticket_type === "requirement" ? "Requirement" : "Support"}
                  </span>
                  <div className="text-xs text-foreground-secondary mt-0.5">#{ticket.ticket_number}</div>
                </td>

                {/* Title (for Requirements) or Category/Subcategory (for Support) */}
                <td
                  className="px-3 py-2.5 cursor-pointer hover:text-primary"
                  onClick={() => router.push(`/tickets/${ticket.id}`)}
                >
                  {ticket.ticket_type === "requirement" ? (
                    <div className="text-sm font-medium text-foreground">{ticket.title || "Untitled"}</div>
                  ) : (
                    <>
                      <div className="text-sm font-medium text-foreground">{ticket.category_name || "N/A"}</div>
                      {ticket.subcategory_name && (
                        <div
                          className="text-xs text-foreground-secondary max-w-[150px] truncate"
                          title={ticket.subcategory_name}
                        >
                          {ticket.subcategory_name}
                        </div>
                      )}
                    </>
                  )}
                </td>

                {/* Project - Only for requirement tickets */}
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {ticket.ticket_type === "support" ? (
                    <span className="text-sm text-muted-foreground">-</span>
                  ) : ticket.project_name ? (
                    <span
                      className={`${canEditProject(ticket) ? "cursor-pointer hover:text-primary" : ""}`}
                      onClick={() => canEditProject(ticket) && openProjectModal(ticket)}
                    >
                      <div className="text-sm text-foreground">{ticket.project_name}</div>
                      {ticket.estimated_release_date && (
                        <div className="text-xs text-foreground-secondary">
                          {format(new Date(ticket.estimated_release_date), "dd MMM yyyy")}
                        </div>
                      )}
                      {canEditProject(ticket) && <Edit className="w-3 h-3 inline ml-1 opacity-50" />}
                    </span>
                  ) : canEditProject(ticket) ? (
                    <button
                      onClick={() => openProjectModal(ticket)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium hover:bg-purple-200"
                    >
                      <FolderKanban className="w-3 h-3" />
                      Select
                    </button>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </td>

                {/* Description Truncated */}
                <td className="px-3 py-2.5">
                  <p
                    className="text-sm text-foreground max-w-[200px] truncate cursor-pointer hover:text-primary"
                    onClick={() => router.push(`/tickets/${ticket.id}`)}
                    title={ticket.description || ticket.title}
                  >
                    {ticket.description || ticket.title || "-"}
                  </p>
                  {ticket.is_deleted && <span className="text-xs text-red-600">(Deleted)</span>}
                </td>

                {/* SPOC */}
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <div className="text-sm text-foreground">{ticket.spoc_name || "-"}</div>
                  {ticket.target_business_group_name && (
                    <div className="text-xs text-foreground-secondary">{ticket.target_business_group_name}</div>
                  )}
                </td>

                {/* Target Business Group (Internal Tickets Only) */}
                {filters?.isInternal && (
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-sm text-foreground">{ticket.group_name || "-"}</span>
                  </td>
                )}

                {/* Assignee */}
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {ticket.assignee_name ? (
                    <div>
                      <span
                        className={`text-sm font-medium text-foreground ${canEditAssignee(ticket) ? "cursor-pointer hover:text-primary" : ""}`}
                        onClick={() => canEditAssignee(ticket) && openAssigneeModal(ticket)}
                      >
                        {ticket.assignee_name}
                        {canEditAssignee(ticket) && <Edit className="w-3 h-3 inline ml-1 opacity-50" />}
                      </span>
                      {ticket.assignee_group_name && (
                        <div className="text-xs text-foreground-secondary">{ticket.assignee_group_name}</div>
                      )}
                    </div>
                  ) : canEditAssignee(ticket) ? (
                    <button
                      onClick={() => openAssigneeModal(ticket)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium hover:bg-amber-200"
                    >
                      <UserPlus className="w-3 h-3" />
                      Assign
                    </button>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unassigned</span>
                  )}
                </td>

                {/* Status */}
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {canEditStatus(ticket) ? (
                    <select
                      value={ticket.status}
                      onChange={(e) => {
                        const newStatus = e.target.value
                        if (newStatus !== ticket.status) {
                          openStatusChangeModal(ticket, newStatus)
                        }
                      }}
                      className={`px-2 py-1 rounded text-xs font-medium border focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer ${statusColor[ticket.status] || statusColor["open"]}`}
                    >
                      {getAvailableStatusOptions(ticket).map((status) => (
                        <option key={status} value={status}>
                          {status === "on-hold" ? "On-Hold" : status === "deleted" ? "Delete" : status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${statusColor[ticket.status] || statusColor["open"]}`}>
                      {ticket.status === "on-hold" ? "On-Hold" : ticket.status === "deleted" ? "Deleted" : ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-center gap-1">
                    {/* Files/Attachments */}
                    {ticket.attachment_count > 0 ? (
                      <div className="relative inline-block" ref={attachmentsDropdownOpen === ticket.id ? dropdownRef : null}>
                        <button
                          className="p-1.5 hover:bg-primary/10 rounded transition-colors group"
                          onClick={() => toggleAttachmentsDropdown(ticket.id)}
                          title={`${ticket.attachment_count} attachment(s)`}
                        >
                          <Paperclip className="w-4 h-4 text-foreground-secondary group-hover:text-primary" />
                        </button>

                        {/* Attachments Dropdown */}
                        {attachmentsDropdownOpen === ticket.id && (
                          <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-gray-800 border border-border rounded-lg shadow-lg z-50">
                            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface/50 dark:bg-gray-700/50">
                              <span className="text-xs font-semibold text-foreground">Attachments</span>
                              <button
                                onClick={() => setAttachmentsDropdownOpen(null)}
                                className="p-0.5 hover:bg-surface dark:hover:bg-gray-700 rounded"
                              >
                                <X className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              {loadingAttachments ? (
                                <div className="p-3 text-center text-sm text-muted-foreground">
                                  Loading...
                                </div>
                              ) : attachmentsList.length > 0 ? (
                                attachmentsList.map((attachment: any) => (
                                  <a
                                    key={attachment.id}
                                    href={attachment.file_url}
                                    download={attachment.file_name}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 hover:bg-surface dark:hover:bg-gray-700 transition-colors border-b border-border last:border-b-0"
                                  >
                                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-foreground truncate">{attachment.file_name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {attachment.file_size ? `${(attachment.file_size / 1024).toFixed(1)} KB` : ""}
                                      </p>
                                    </div>
                                    <Download className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                  </a>
                                ))
                              ) : (
                                <div className="p-3 text-center text-sm text-muted-foreground">
                                  No attachments found
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}
                    
                    {/* Activity History - Tooltip on Hover */}
                    <TicketHistoryTooltip ticketId={ticket.id} ticketNumber={ticket.ticket_number}>
                      <button
                        className="p-1.5 hover:bg-primary/10 rounded transition-colors group"
                        title="Activity History (Hover to view)"
                      >
                        <History className="w-4 h-4 text-foreground-secondary group-hover:text-primary" />
                      </button>
                    </TicketHistoryTooltip>
                    
                    {/* Edit */}
                    <button
                      className="p-1.5 hover:bg-primary/10 rounded transition-colors group"
                      title="Edit"
                      onClick={() => router.push(`/tickets/${ticket.id}/edit`)}
                    >
                      <Edit className="w-4 h-4 text-foreground-secondary group-hover:text-primary" />
                    </button>
                    
                  </div>
                </td>
              </tr>

              {/* Child Tickets - Rendered when expanded */}
              {isExpanded && children.length > 0 && (
                <>
                  {children.map((childTicket) => (
                    <tr
                      key={childTicket.id}
                      className={`hover:bg-surface transition-colors bg-gray-50/50 dark:bg-gray-800/50 ${
                        childTicket.is_deleted ? "opacity-50" : ""
                      }`}
                    >
                      {/* Empty cell for alignment */}
                      <td className="px-3 py-2.5"></td>

                      {/* Initiator Name and Group - Indented */}
                      <td
                        className="px-3 py-2.5 whitespace-nowrap cursor-pointer hover:text-primary pl-8"
                        onClick={() => router.push(`/tickets/${childTicket.id}`)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-l-2 border-b-2 border-foreground-secondary/30"></div>
                          <div>
                            <div className="text-sm font-medium text-foreground">{childTicket.creator_name || "Unknown"}</div>
                            <div className="text-xs text-foreground-secondary">{childTicket.initiator_group_name || "No Group"}</div>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td
                        className="px-3 py-2.5 whitespace-nowrap cursor-pointer hover:text-primary"
                        onClick={() => router.push(`/tickets/${childTicket.id}`)}
                      >
                        <div className="text-sm text-foreground">{format(new Date(childTicket.created_at), "dd MMM yyyy")}</div>
                        <div className="text-xs text-foreground-secondary">{format(new Date(childTicket.created_at), "hh:mm a")}</div>
                      </td>

                      {/* Type + Row Number */}
                      <td
                        className="px-3 py-2.5 whitespace-nowrap cursor-pointer"
                        onClick={() => router.push(`/tickets/${childTicket.id}`)}
                      >
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          childTicket.ticket_type === "requirement"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {childTicket.ticket_type === "requirement" ? "Requirement" : "Support"}
                        </span>
                        <div className="text-xs text-foreground-secondary mt-0.5">#{childTicket.ticket_number}</div>
                      </td>

                      {/* Title/Category */}
                      <td
                        className="px-3 py-2.5 cursor-pointer hover:text-primary"
                        onClick={() => router.push(`/tickets/${childTicket.id}`)}
                      >
                        {childTicket.ticket_type === "requirement" ? (
                          <div className="text-sm font-medium text-foreground">{childTicket.title || "Untitled"}</div>
                        ) : (
                          <>
                            <div className="text-sm font-medium text-foreground">{childTicket.category_name || "N/A"}</div>
                            {childTicket.subcategory_name && (
                              <div className="text-xs text-foreground-secondary max-w-[150px] truncate" title={childTicket.subcategory_name}>
                                {childTicket.subcategory_name}
                              </div>
                            )}
                          </>
                        )}
                      </td>

                      {/* Project */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {childTicket.ticket_type === "support" ? (
                          <span className="text-sm text-muted-foreground">-</span>
                        ) : childTicket.project_name ? (
                          <div className="text-sm text-foreground">{childTicket.project_name}</div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="px-3 py-2.5">
                        <p className="text-sm text-foreground line-clamp-2 max-w-[200px]" title={childTicket.description}>
                          {childTicket.description || "No description"}
                        </p>
                      </td>

                      {/* SPOC */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="text-sm text-foreground">{childTicket.spoc_name || "-"}</div>
                        {childTicket.target_business_group_name && (
                          <div className="text-xs text-foreground-secondary">{childTicket.target_business_group_name}</div>
                        )}
                      </td>

                      {/* Target Business Group (Internal Tickets Only) */}
                      {filters?.isInternal && (
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="text-sm text-foreground">{childTicket.group_name || "-"}</span>
                        </td>
                      )}

                      {/* Assignee */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {canEditAssignee(childTicket) ? (
                          <div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openAssigneeModal(childTicket)
                              }}
                              className="text-sm text-foreground hover:text-primary flex items-center gap-1"
                            >
                              {childTicket.assignee_name || "Unassigned"}
                              <UserPlus className="w-3 h-3" />
                            </button>
                            {childTicket.assignee_group_name && (
                              <div className="text-xs text-foreground-secondary">{childTicket.assignee_group_name}</div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="text-sm text-foreground">{childTicket.assignee_name || "Unassigned"}</span>
                            {childTicket.assignee_group_name && (
                              <div className="text-xs text-foreground-secondary">{childTicket.assignee_group_name}</div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {canEditStatus(childTicket) ? (
                          <select
                            value={childTicket.status}
                            onChange={(e) => {
                              const newStatus = e.target.value
                              if (newStatus !== childTicket.status) {
                                openStatusChangeModal(childTicket, newStatus)
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className={`text-xs font-medium px-2 py-1 rounded border-0 focus:ring-2 focus:ring-primary ${
                              statusColor[childTicket.status] || "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {getAvailableStatusOptions(childTicket).map((status) => (
                              <option key={status} value={status}>
                                {status === "on-hold" ? "On-Hold" : status === "deleted" ? "Delete" : status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={`text-xs font-medium px-2 py-1 rounded ${statusColor[childTicket.status] || "bg-gray-100 text-gray-700"}`}>
                            {childTicket.status === "on-hold" ? "On-Hold" : childTicket.status === "deleted" ? "Deleted" : childTicket.status.charAt(0).toUpperCase() + childTicket.status.slice(1).replace("-", " ")}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          {/* Files/Attachments */}
                          {childTicket.attachment_count > 0 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleAttachmentsDropdown(childTicket.id)
                              }}
                              className="p-1.5 hover:bg-primary/10 rounded transition-colors group"
                              title={`${childTicket.attachment_count} attachment(s)`}
                            >
                              <Paperclip className="w-4 h-4 text-foreground-secondary group-hover:text-primary" />
                            </button>
                          ) : null}
                          
                          {/* Activity History - Tooltip on Hover */}
                          <TicketHistoryTooltip ticketId={childTicket.id} ticketNumber={childTicket.ticket_number}>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 hover:bg-primary/10 rounded transition-colors group"
                              title="Activity History (Hover to view)"
                            >
                              <History className="w-4 h-4 text-foreground-secondary group-hover:text-primary" />
                            </button>
                          </TicketHistoryTooltip>
                          
                          {/* Edit */}
                          {canEditTicket(childTicket) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/tickets/${childTicket.id}/edit`)
                              }}
                              className="p-1.5 hover:bg-primary/10 rounded transition-colors group"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4 text-foreground-secondary group-hover:text-primary" />
                            </button>
                          )}
                          
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              )}
                  </React.Fragment>
                )
              })}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-surface/50 dark:bg-gray-700/50">
        <p className="text-sm text-foreground-secondary">
          Showing {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Assignee Modal */}
      <AssigneeModal
        isOpen={isAssigneeModalOpen}
        onClose={() => {
          setIsAssigneeModalOpen(false)
          setSelectedTicketForAssignment(null)
        }}
        onSelect={handleAssigneeSelect}
        currentAssigneeId={selectedTicketForAssignment?.assigned_to || null}
        ticketTitle={selectedTicketForAssignment?.title || ""}
        ticketBusinessUnitGroupId={selectedTicketForAssignment?.business_unit_group_id || null}
      />

      {/* Project Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false)
          setSelectedTicketForProject(null)
        }}
        onSelect={handleProjectSelect}
        currentProjectId={selectedTicketForProject?.project_id || null}
        ticketTitle={selectedTicketForProject?.title || ""}
      />

      {/* Activity History is now shown in tooltip, no modal needed */}

      {/* Status Change Modal */}
      <StatusChangeModal
        isOpen={isStatusChangeModalOpen}
        onClose={() => {
          setIsStatusChangeModalOpen(false)
          setSelectedTicketForStatusChange(null)
          setSelectedNewStatus("")
        }}
        onConfirm={handleStatusChangeConfirm}
        oldStatus={selectedTicketForStatusChange?.status || ""}
        newStatus={selectedNewStatus}
        ticketNumber={selectedTicketForStatusChange?.ticket_number || 0}
        loading={changingStatus}
      />
    </div>
  )
}
