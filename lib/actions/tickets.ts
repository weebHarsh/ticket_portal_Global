"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "./auth"
import { sendSpocNotificationEmail, sendAssignmentEmail, sendStatusChangeEmail } from "@/lib/email"

// Helper function to add audit log entry
async function addAuditLog(params: {
  ticketId: number
  actionType: string
  oldValue: string | null
  newValue: string | null
  performedBy: number | null
  performedByName: string | null
  notes?: string
}) {
  await sql`
    INSERT INTO ticket_audit_log (ticket_id, action_type, old_value, new_value, performed_by, performed_by_name, notes)
    VALUES (${params.ticketId}, ${params.actionType}, ${params.oldValue}, ${params.newValue}, ${params.performedBy}, ${params.performedByName}, ${params.notes || null})
  `
}

// Get audit log for a ticket
export async function getTicketAuditLog(ticketId: number) {
  try {
    const result = await sql`
      SELECT *
      FROM ticket_audit_log
      WHERE ticket_id = ${ticketId}
      ORDER BY created_at DESC
    `
    return { success: true, data: result }
  } catch (error) {
    console.error("[v0] Error fetching ticket audit log:", error)
    return { success: false, error: "Failed to fetch audit log", data: [] }
  }
}

export async function getTickets(filters?: {
  status?: string
  assignee?: string
  type?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  includeDeleted?: boolean
  myTeam?: boolean
  userId?: number
}) {
  try {
    // Fetch all non-deleted tickets - filtering done client-side for flexibility
    const tickets = await sql`
      SELECT
        t.*,
        u.full_name as creator_name,
        a.full_name as assignee_name,
        spoc.full_name as spoc_name,
        c.name as category_name,
        sc.name as subcategory_name,
        bug.name as group_name,
        p.name as project_name,
        closer.full_name as closed_by_name,
        holder.full_name as hold_by_name,
        (SELECT COUNT(*) FROM attachments att WHERE att.ticket_id = t.id) as attachment_count
      FROM tickets t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN users a ON t.assigned_to = a.id
      LEFT JOIN users spoc ON t.spoc_user_id = spoc.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN subcategories sc ON t.subcategory_id = sc.id
      LEFT JOIN business_unit_groups bug ON t.business_unit_group_id = bug.id
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users closer ON t.closed_by = closer.id
      LEFT JOIN users holder ON t.hold_by = holder.id
      WHERE (t.is_deleted IS NULL OR t.is_deleted = FALSE)
      ORDER BY t.created_at DESC
    `

    // Apply filters in JavaScript
    let filteredTickets = [...tickets]

    if (filters?.status && filters.status !== "all") {
      filteredTickets = filteredTickets.filter(t => t.status === filters.status)
    }

    if (filters?.type && filters.type !== "all") {
      filteredTickets = filteredTickets.filter(t => t.ticket_type === filters.type)
    }

    if (filters?.assignee) {
      const assigneeId = parseInt(filters.assignee)
      filteredTickets = filteredTickets.filter(t => t.assigned_to === assigneeId)
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      filteredTickets = filteredTickets.filter(t =>
        t.title?.toLowerCase().includes(searchLower) ||
        t.ticket_id?.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower) ||
        t.creator_name?.toLowerCase().includes(searchLower) ||
        t.assignee_name?.toLowerCase().includes(searchLower) ||
        t.category_name?.toLowerCase().includes(searchLower)
      )
    }

    if (filters?.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      filteredTickets = filteredTickets.filter(t => new Date(t.created_at) >= fromDate)
    }

    if (filters?.dateTo) {
      const toDate = new Date(filters.dateTo)
      filteredTickets = filteredTickets.filter(t => new Date(t.created_at) <= toDate)
    }

    return { success: true, data: filteredTickets }
  } catch (error) {
    console.error("[v0] Error fetching tickets:", error)
    return { success: false, error: "Failed to fetch tickets" }
  }
}

export async function getTicketById(id: number) {
  try {
    if (isNaN(id) || !Number.isInteger(id) || id <= 0) {
      return { success: false, error: "Invalid ticket ID" }
    }

    const ticketResult = await sql`
      SELECT
        t.*,
        u.full_name as creator_name,
        u.email as creator_email,
        a.full_name as assignee_name,
        a.email as assignee_email,
        c.full_name as closed_by_name
      FROM tickets t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN users a ON t.assigned_to = a.id
      LEFT JOIN users c ON t.closed_by = c.id
      WHERE t.id = ${id}
    `

    if (ticketResult.length === 0) {
      return { success: false, error: "Ticket not found" }
    }

    const ticket = ticketResult[0]

    const commentsResult = await sql`
      SELECT c.*, u.full_name as user_name, u.avatar_url
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = ${id}
      ORDER BY c.created_at ASC
    `

    const attachmentsResult = await sql`
      SELECT a.*, u.full_name as uploader_name
      FROM attachments a
      LEFT JOIN users u ON a.uploaded_by = u.id
      WHERE a.ticket_id = ${id}
      ORDER BY a.created_at DESC
    `

    return {
      success: true,
      data: {
        ...ticket,
        comments: commentsResult,
        attachments: attachmentsResult,
      },
    }
  } catch (error) {
    console.error("[v0] Error fetching ticket:", error)
    return { success: false, error: "Failed to fetch ticket" }
  }
}

export async function createTicket(data: {
  ticketType: string
  businessUnitGroupId: number
  projectName?: string
  projectId?: number | null
  categoryId: number | null
  subcategoryId: number | null
  title: string
  description: string
  estimatedDuration: string
  spocId: number
  productReleaseName?: string
  estimatedReleaseDate?: string | null
}) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, error: "User not authenticated" }
    }

    // Get next sequential ticket number
    const maxResult = await sql`SELECT COALESCE(MAX(ticket_number), 0) as max_num FROM tickets`
    const nextTicketNumber = (maxResult[0]?.max_num || 0) + 1

    const dateStr = new Date().toISOString().slice(0, 7).replace("-", "")
    const randomNum = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0")
    const ticketId = `TKT-${dateStr}-${randomNum}`

    const result = await sql`
      INSERT INTO tickets (
        ticket_id, ticket_number, title, description, ticket_type, priority,
        status, created_by, assigned_to, spoc_user_id,
        business_unit_group_id, project_name, project_id, category_id, subcategory_id,
        estimated_duration, product_release_name, estimated_release_date
      )
      VALUES (
        ${ticketId},
        ${nextTicketNumber},
        ${data.title},
        ${data.description},
        ${data.ticketType},
        ${"medium"},
        ${"open"},
        ${currentUser.id},
        ${null},
        ${data.spocId},
        ${data.businessUnitGroupId},
        ${data.projectName || null},
        ${data.projectId || null},
        ${data.categoryId || null},
        ${data.subcategoryId || null},
        ${data.estimatedDuration || null},
        ${data.productReleaseName || null},
        ${data.estimatedReleaseDate || null}
      )
      RETURNING *
    `

    revalidatePath("/dashboard")
    revalidatePath("/tickets")

    // Log ticket creation to audit trail
    await addAuditLog({
      ticketId: result[0].id,
      actionType: 'created',
      oldValue: null,
      newValue: `Ticket #${result[0].ticket_number} created`,
      performedBy: currentUser.id,
      performedByName: currentUser.full_name || currentUser.email,
    })

    // Send email notification to SPOC
    if (data.spocId) {
      try {
        const spocResult = await sql`
          SELECT u.email, u.full_name, bug.name as group_name
          FROM users u
          LEFT JOIN business_unit_groups bug ON u.business_unit_group_id = bug.id
          WHERE u.id = ${data.spocId}
        `
        if (spocResult.length > 0) {
          const spoc = spocResult[0]
          await sendSpocNotificationEmail({
            spocEmail: spoc.email,
            spocName: spoc.full_name,
            ticketId: `#${result[0].ticket_number}`,
            ticketDbId: result[0].id,
            ticketTitle: data.title,
            description: data.description,
            creatorName: currentUser.full_name || currentUser.email,
            creatorGroup: currentUser.group_name || 'Unknown Group',
          })
        }
      } catch (emailError) {
        console.error("[Email] Failed to send SPOC notification:", emailError)
        // Don't fail ticket creation if email fails
      }
    }

    return { success: true, data: result[0] }
  } catch (error) {
    console.error("[v0] Error creating ticket:", error)
    return { success: false, error: "Failed to create ticket" }
  }
}

export async function updateTicketStatus(ticketId: number, status: string) {
  try {
    const currentUser = await getCurrentUser()

    // Get ticket info before update
    const ticketBefore = await sql`
      SELECT t.*, u.full_name as creator_name, u.email as creator_email,
             a.full_name as assignee_name, a.email as assignee_email,
             s.full_name as spoc_name, s.email as spoc_email
      FROM tickets t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN users a ON t.assigned_to = a.id
      LEFT JOIN users s ON t.spoc_user_id = s.id
      WHERE t.id = ${ticketId}
    `
    const oldStatus = ticketBefore[0]?.status

    await sql`
      UPDATE tickets
      SET status = ${status},
          updated_at = CURRENT_TIMESTAMP,
          resolved_at = CASE WHEN ${status} = 'closed' THEN CURRENT_TIMESTAMP ELSE resolved_at END,
          closed_by = CASE WHEN ${status} = 'closed' THEN ${currentUser?.id || null} ELSE closed_by END,
          closed_at = CASE WHEN ${status} = 'closed' THEN CURRENT_TIMESTAMP ELSE closed_at END,
          hold_by = CASE WHEN ${status} = 'hold' THEN ${currentUser?.id || null} ELSE hold_by END,
          hold_at = CASE WHEN ${status} = 'hold' THEN CURRENT_TIMESTAMP ELSE hold_at END
      WHERE id = ${ticketId}
    `

    revalidatePath("/dashboard")
    revalidatePath("/tickets")

    // Log the status change to audit trail
    if (oldStatus !== status) {
      await addAuditLog({
        ticketId,
        actionType: 'status_change',
        oldValue: oldStatus,
        newValue: status,
        performedBy: currentUser?.id || null,
        performedByName: currentUser?.full_name || 'System',
      })
    }

    // Send email notifications for status change
    if (ticketBefore.length > 0 && oldStatus !== status) {
      const ticket = ticketBefore[0]
      const changedByName = currentUser?.full_name || 'System'

      // Notify creator if they didn't make the change
      if (ticket.creator_email && ticket.created_by !== currentUser?.id) {
        sendStatusChangeEmail({
          recipientEmail: ticket.creator_email,
          recipientName: ticket.creator_name,
          ticketId: `#${ticket.ticket_number}`,
          ticketDbId: ticketId,
          ticketTitle: ticket.title,
          oldStatus,
          newStatus: status,
          changedByName,
        }).catch(err => console.error('[Email] Status change email failed:', err))
      }

      // Notify assignee if different from creator and they didn't make the change
      if (ticket.assignee_email && ticket.assigned_to !== ticket.created_by && ticket.assigned_to !== currentUser?.id) {
        sendStatusChangeEmail({
          recipientEmail: ticket.assignee_email,
          recipientName: ticket.assignee_name,
          ticketId: `#${ticket.ticket_number}`,
          ticketDbId: ticketId,
          ticketTitle: ticket.title,
          oldStatus,
          newStatus: status,
          changedByName,
        }).catch(err => console.error('[Email] Status change email failed:', err))
      }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error updating ticket status:", error)
    return { success: false, error: "Failed to update ticket status" }
  }
}

export async function addComment(ticketId: number, content: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, error: "User not authenticated" }
    }

    const result = await sql`
      INSERT INTO comments (ticket_id, user_id, content)
      VALUES (${ticketId}, ${currentUser.id}, ${content})
      RETURNING *
    `

    await sql`
      UPDATE tickets
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ${ticketId}
    `

    revalidatePath("/tickets")

    return { success: true, data: result[0] }
  } catch (error) {
    console.error("[v0] Error adding comment:", error)
    return { success: false, error: "Failed to add comment" }
  }
}

export async function updateTicket(
  ticketId: number,
  data: {
    title: string
    description: string
    status: string
    priority: string
    businessUnitGroupId: number
    categoryId: number
    subcategoryId: number | null
    assigneeId: number
    estimatedDuration: string
  },
) {
  try {
    const result = await sql`
      UPDATE tickets 
      SET 
        title = ${data.title},
        description = ${data.description},
        status = ${data.status},
        priority = ${data.priority},
        business_unit_group_id = ${data.businessUnitGroupId},
        category_id = ${data.categoryId},
        subcategory_id = ${data.subcategoryId},
        assigned_to = ${data.assigneeId},
        estimated_duration = ${data.estimatedDuration},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${ticketId}
      RETURNING *
    `

    revalidatePath("/tickets")
    revalidatePath(`/tickets/${ticketId}`)

    return { success: true, data: result[0] }
  } catch (error) {
    console.error("[v0] Error updating ticket:", error)
    return { success: false, error: "Failed to update ticket" }
  }
}

export async function softDeleteTicket(ticketId: number) {
  try {
    await sql`
      UPDATE tickets
      SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP
      WHERE id = ${ticketId}
    `

    revalidatePath("/tickets")
    revalidatePath("/dashboard")

    return { success: true }
  } catch (error) {
    console.error("[v0] Error soft deleting ticket:", error)
    return { success: false, error: "Failed to delete ticket" }
  }
}

export async function restoreTicket(ticketId: number) {
  try {
    await sql`
      UPDATE tickets
      SET is_deleted = FALSE, deleted_at = NULL
      WHERE id = ${ticketId}
    `

    revalidatePath("/tickets")
    revalidatePath("/dashboard")

    return { success: true }
  } catch (error) {
    console.error("[v0] Error restoring ticket:", error)
    return { success: false, error: "Failed to restore ticket" }
  }
}

export async function getUsers() {
  try {
    const result = await sql`
      SELECT id, full_name, email, role
      FROM users
      ORDER BY full_name
    `
    return { success: true, data: result }
  } catch (error) {
    console.error("[v0] Error fetching users:", error)
    return { success: false, error: "Failed to fetch users", data: [] }
  }
}

export async function updateTicketAssignee(ticketId: number, assigneeId: number) {
  try {
    const currentUser = await getCurrentUser()

    // Get ticket info before update including old assignee name
    const ticketBefore = await sql`
      SELECT t.ticket_id, t.ticket_number, t.title, t.description, t.priority, t.assigned_to,
             a.full_name as old_assignee_name
      FROM tickets t
      LEFT JOIN users a ON t.assigned_to = a.id
      WHERE t.id = ${ticketId}
    `

    await sql`
      UPDATE tickets
      SET assigned_to = ${assigneeId}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${ticketId}
    `

    revalidatePath("/tickets")
    revalidatePath(`/tickets/${ticketId}`)

    // Send email notification to new assignee and log audit
    if (ticketBefore.length > 0) {
      const ticket = ticketBefore[0]
      const oldAssigneeId = ticket.assigned_to

      // Only process if assignee actually changed
      if (oldAssigneeId !== assigneeId) {
        // Get new assignee name for audit log
        const newAssigneeResult = await sql`
          SELECT email, full_name FROM users WHERE id = ${assigneeId}
        `
        const newAssigneeName = newAssigneeResult.length > 0 ? newAssigneeResult[0].full_name : null

        // Log to audit trail
        await addAuditLog({
          ticketId,
          actionType: 'assignment_change',
          oldValue: ticket.old_assignee_name || 'Unassigned',
          newValue: newAssigneeName || 'Unassigned',
          performedBy: currentUser?.id || null,
          performedByName: currentUser?.full_name || 'System',
        })

        // Send email notification
        if (newAssigneeResult.length > 0) {
          const assignee = newAssigneeResult[0]
          try {
            await sendAssignmentEmail({
              assigneeEmail: assignee.email,
              assigneeName: assignee.full_name,
              ticketId: `#${ticket.ticket_number}`,
              ticketDbId: ticketId,
              ticketTitle: ticket.title,
              description: ticket.description || '',
              priority: ticket.priority,
              assignedByName: currentUser?.full_name || 'System',
            })
          } catch (emailError) {
            console.error("[Email] Failed to send assignment email:", emailError)
            // Don't fail the update if email fails
          }
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error updating ticket assignee:", error)
    return { success: false, error: "Failed to update assignee" }
  }
}

export async function updateTicketProject(ticketId: number, projectId: number | null) {
  try {
    const currentUser = await getCurrentUser()

    // Get old project name
    const ticketBefore = await sql`
      SELECT t.project_id, p.name as old_project_name
      FROM tickets t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = ${ticketId}
    `

    await sql`
      UPDATE tickets
      SET project_id = ${projectId}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${ticketId}
    `

    // Get new project name and log to audit
    if (ticketBefore.length > 0) {
      const oldProjectId = ticketBefore[0].project_id
      if (oldProjectId !== projectId) {
        let newProjectName = null
        if (projectId) {
          const projectResult = await sql`SELECT name FROM projects WHERE id = ${projectId}`
          newProjectName = projectResult.length > 0 ? projectResult[0].name : null
        }

        await addAuditLog({
          ticketId,
          actionType: 'project_change',
          oldValue: ticketBefore[0].old_project_name || 'None',
          newValue: newProjectName || 'None',
          performedBy: currentUser?.id || null,
          performedByName: currentUser?.full_name || 'System',
        })
      }
    }

    revalidatePath("/tickets")
    revalidatePath(`/tickets/${ticketId}`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Error updating ticket project:", error)
    return { success: false, error: "Failed to update project" }
  }
}

export async function getTeamMembers(userId: number) {
  try {
    const result = await sql`
      SELECT DISTINCT u.id, u.full_name, u.email
      FROM users u
      JOIN team_members tm ON u.id = tm.user_id
      WHERE tm.team_id IN (
        SELECT team_id FROM team_members WHERE user_id = ${userId}
      )
      ORDER BY u.full_name
    `
    return { success: true, data: result }
  } catch (error) {
    console.error("[v0] Error fetching team members:", error)
    return { success: false, error: "Failed to fetch team members", data: [] }
  }
}
