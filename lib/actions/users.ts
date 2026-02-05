"use server"

import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function getAllUsers(filters?: {
  role?: string
  search?: string
  includeInactive?: boolean
}) {
  try {
    // Fetch all users - filtering done in JavaScript
    const users = await sql`
      SELECT
        u.id,
        u.email,
        u.full_name,
        u.role,
        u.avatar_url,
        u.created_at,
        u.updated_at,
        u.is_active,
        COUNT(DISTINCT t.id) as ticket_count,
        COUNT(DISTINCT tm.team_id) as team_count
      FROM users u
      LEFT JOIN tickets t ON u.id = t.assigned_to
      LEFT JOIN team_members tm ON u.id = tm.user_id
      WHERE (u.is_active IS NULL OR u.is_active = TRUE)
      GROUP BY u.id, u.email, u.full_name, u.role, u.avatar_url, u.created_at, u.updated_at, u.is_active
      ORDER BY u.created_at DESC
    `

    // Apply filters in JavaScript
    let filteredUsers = [...users]

    if (filters?.role && filters.role !== "all") {
      filteredUsers = filteredUsers.filter(u => u.role === filters.role)
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      filteredUsers = filteredUsers.filter(u =>
        u.full_name?.toLowerCase().includes(searchLower) ||
        u.email?.toLowerCase().includes(searchLower)
      )
    }

    return { success: true, data: filteredUsers }
  } catch (error) {
    console.error("Error fetching users:", error)
    return { success: false, error: "Failed to fetch users", data: [] }
  }
}

export async function getUserById(id: number) {
  try {
    if (isNaN(id) || !Number.isInteger(id) || id <= 0) {
      return { success: false, error: "Invalid user ID" }
    }

    const result = await sql`
      SELECT
        u.id,
        u.email,
        u.full_name,
        u.role,
        u.avatar_url,
        u.created_at,
        u.updated_at,
        u.is_active
      FROM users u
      WHERE u.id = ${id}
    `

    if (result.length === 0) {
      return { success: false, error: "User not found" }
    }

    // Get user's teams
    const teams = await sql`
      SELECT t.id, t.name, tm.role as team_role
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = ${id}
    `

    // Get user's assigned tickets
    const tickets = await sql`
      SELECT id, ticket_id, title, status
      FROM tickets
      WHERE assigned_to = ${id}
      ORDER BY created_at DESC
      LIMIT 10
    `

    return {
      success: true,
      data: {
        ...result[0],
        teams: teams,
        recent_tickets: tickets,
      },
    }
  } catch (error) {
    console.error("Error fetching user:", error)
    return { success: false, error: "Failed to fetch user" }
  }
}

export async function updateUser(
  id: number,
  data: {
    fullName?: string
    email?: string
    role?: string
    avatarUrl?: string
  }
) {
  try {
    // Update user with all fields using Neon's template literals
    const result = await sql`
      UPDATE users
      SET
        full_name = COALESCE(${data.fullName ?? null}, full_name),
        email = COALESCE(${data.email ?? null}, email),
        role = COALESCE(${data.role ?? null}, role),
        avatar_url = COALESCE(${data.avatarUrl ?? null}, avatar_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, email, full_name, role, avatar_url, created_at, updated_at
    `

    if (!result || result.length === 0) {
      return { success: false, error: "Failed to update user" }
    }

    return { success: true, data: result[0] }
  } catch (error: any) {
    if (error.message?.includes("duplicate key") || error.detail?.includes("already exists")) {
      return { success: false, error: "Email already exists" }
    }
    console.error("Error updating user:", error)
    return { success: false, error: "Failed to update user" }
  }
}

export async function deactivateUser(id: number) {
  try {
    // Add is_active column if it doesn't exist
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`

    const result = await sql`
      UPDATE users
      SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, email, full_name
    `

    if (result.length === 0) {
      return { success: false, error: "User not found" }
    }

    return { success: true, data: result[0] }
  } catch (error) {
    console.error("Error deactivating user:", error)
    return { success: false, error: "Failed to deactivate user" }
  }
}

export async function activateUser(id: number) {
  try {
    const result = await sql`
      UPDATE users
      SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, email, full_name
    `

    if (result.length === 0) {
      return { success: false, error: "User not found" }
    }

    return { success: true, data: result[0] }
  } catch (error) {
    console.error("Error activating user:", error)
    return { success: false, error: "Failed to activate user" }
  }
}

export async function resetUserPassword(id: number) {
  try {
    // Generate temporary password
    const randomPart = Math.random().toString(36).substring(2, 10)
    const tempPassword = `${randomPart}Temp1!`

    const passwordHash = await bcrypt.hash(tempPassword, 10)

    const result = await sql`
      UPDATE users
      SET password_hash = ${passwordHash}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, email, full_name
    `

    if (result.length === 0) {
      return { success: false, error: "User not found" }
    }

    return {
      success: true,
      data: {
        ...result[0],
        temporary_password: tempPassword,
      },
    }
  } catch (error) {
    console.error("Error resetting password:", error)
    return { success: false, error: "Failed to reset password" }
  }
}

export async function deleteUser(id: number) {
  try {
    // Check if user has assigned tickets
    const ticketCheck = await sql`
      SELECT COUNT(*) as count FROM tickets WHERE assigned_to = ${id}
    `

    const ticketCount = ticketCheck[0]?.count || 0

    if (ticketCount > 0) {
      return {
        success: false,
        error: `Cannot delete user: ${ticketCount} ticket(s) are assigned to this user. Please reassign tickets first or deactivate the user instead.`,
      }
    }

    // Check if user created tickets
    const createdTicketCheck = await sql`
      SELECT COUNT(*) as count FROM tickets WHERE created_by = ${id}
    `

    const createdCount = createdTicketCheck[0]?.count || 0

    if (createdCount > 0) {
      return {
        success: false,
        error: `Cannot delete user: ${createdCount} ticket(s) were created by this user. Deactivate the user instead.`,
      }
    }

    // Delete user (cascade will handle team_members)
    await sql`DELETE FROM users WHERE id = ${id}`

    return { success: true }
  } catch (error) {
    console.error("Error deleting user:", error)
    return { success: false, error: "Failed to delete user" }
  }
}

export async function getUserRoles() {
  return {
    success: true,
    data: [
      { value: "admin", label: "Admin" },
      { value: "manager", label: "Manager" },
      { value: "team_lead", label: "Team Lead" },
      { value: "support_agent", label: "Support Agent" },
      { value: "developer", label: "Developer" },
      { value: "qa_engineer", label: "QA Engineer" },
      { value: "designer", label: "Designer" },
      { value: "analyst", label: "Analyst" },
    ],
  }
}

// Settings page functions
export async function updateUserBusinessGroup(userId: number, businessGroupId: number) {
  try {
    const result = await sql`
      UPDATE users
      SET business_unit_group_id = ${businessGroupId}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
      RETURNING id, email, full_name, role, business_unit_group_id
    `

    if (result.length === 0) {
      return { success: false, error: "User not found" }
    }

    return { success: true, data: result[0] }
  } catch (error) {
    console.error("Error updating user business group:", error)
    return { success: false, error: "Failed to update business group" }
  }
}

export async function updateUserProfile(
  userId: number,
  data: { fullName: string; businessGroupId: number }
) {
  try {
    const result = await sql`
      UPDATE users
      SET
        full_name = ${data.fullName},
        business_unit_group_id = ${data.businessGroupId},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
      RETURNING id, email, full_name, role, business_unit_group_id
    `

    if (result.length === 0) {
      return { success: false, error: "User not found" }
    }

    return { success: true, data: result[0] }
  } catch (error) {
    console.error("Error updating user profile:", error)
    return { success: false, error: "Failed to update profile" }
  }
}

export async function changeUserPassword(
  userId: number,
  currentPassword: string,
  newPassword: string
) {
  try {
    // Get current password hash
    const userResult = await sql`
      SELECT password_hash FROM users WHERE id = ${userId}
    `

    if (userResult.length === 0) {
      return { success: false, error: "User not found" }
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, userResult[0].password_hash)
    if (!isValid) {
      return { success: false, error: "Current password is incorrect" }
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    // Update password
    await sql`
      UPDATE users
      SET password_hash = ${newPasswordHash}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `

    return { success: true }
  } catch (error) {
    console.error("Error changing password:", error)
    return { success: false, error: "Failed to change password" }
  }
}
