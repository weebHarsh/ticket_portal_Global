"use server"

import { sql } from "@/lib/db"

// Teams
export async function getTeams() {
  try {
    const result = await sql`
      SELECT 
        t.*,
        COUNT(tm.id) as member_count
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      GROUP BY t.id
      ORDER BY t.name ASC
    `
    return { success: true, data: result }
  } catch (error) {
    console.error("Error fetching teams:", error)
    return { success: false, error: "Failed to fetch teams" }
  }
}

export async function createTeam(name: string, description?: string) {
  try {
    const trimmedName = name.trim()
    const result = await sql`
      INSERT INTO teams (name, description)
      VALUES (${trimmedName}, ${description || null})
      RETURNING *
    `
    if (!result || result.length === 0) {
      return { success: false, error: "Failed to create team - no data returned" }
    }
    return { success: true, data: result[0] }
  } catch (error: any) {
    if (error.message?.includes("duplicate key") || error.detail?.includes("already exists")) {
      return { success: false, error: `Team with this name already exists`, isDuplicate: true }
    }
    console.error("Error creating team:", error)
    return { success: false, error: "Failed to create team" }
  }
}

export async function updateTeam(id: number, name: string, description?: string) {
  try {
    const trimmedName = name.trim()
    const result = await sql`
      UPDATE teams 
      SET name = ${trimmedName}, description = ${description || null}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `
    if (!result || result.length === 0) {
      return { success: false, error: "Failed to update team - no data returned" }
    }
    return { success: true, data: result[0] }
  } catch (error: any) {
    if (error.message?.includes("duplicate key") || error.detail?.includes("already exists")) {
      return { success: false, error: `Team with this name already exists`, isDuplicate: true }
    }
    console.error("Error updating team:", error)
    return { success: false, error: "Failed to update team" }
  }
}

export async function deleteTeam(id: number) {
  try {
    await sql`DELETE FROM teams WHERE id = ${id}`
    return { success: true }
  } catch (error) {
    console.error("Error deleting team:", error)
    return { success: false, error: "Failed to delete team" }
  }
}

// Team Members
export async function getTeamMembers(teamId?: number) {
  try {
    const result = teamId
      ? await sql`
          SELECT 
            tm.*,
            u.full_name as user_name,
            u.email as user_email,
            t.name as team_name
          FROM team_members tm
          JOIN users u ON tm.user_id = u.id
          JOIN teams t ON tm.team_id = t.id
          WHERE tm.team_id = ${teamId}
          ORDER BY u.full_name ASC
        `
      : await sql`
          SELECT 
            tm.*,
            u.full_name as user_name,
            u.email as user_email,
            t.name as team_name
          FROM team_members tm
          JOIN users u ON tm.user_id = u.id
          JOIN teams t ON tm.team_id = t.id
          ORDER BY t.name, u.full_name ASC
        `
    return { success: true, data: result }
  } catch (error) {
    console.error("Error fetching team members:", error)
    return { success: false, error: "Failed to fetch team members" }
  }
}

export async function addTeamMember(userId: number, teamId: number, role = "member") {
  try {
    const result = await sql`
      INSERT INTO team_members (user_id, team_id, role)
      VALUES (${userId}, ${teamId}, ${role})
      RETURNING *
    `
    if (!result || result.length === 0) {
      return { success: false, error: "Failed to add team member - no data returned" }
    }
    return { success: true, data: result[0] }
  } catch (error) {
    console.error("Error adding team member:", error)
    return { success: false, error: "Failed to add team member" }
  }
}

export async function updateTeamMember(id: number, role: string) {
  try {
    const result = await sql`
      UPDATE team_members 
      SET role = ${role}
      WHERE id = ${id}
      RETURNING *
    `
    if (!result || result.length === 0) {
      return { success: false, error: "Failed to update team member - no data returned" }
    }
    return { success: true, data: result[0] }
  } catch (error) {
    console.error("Error updating team member:", error)
    return { success: false, error: "Failed to update team member" }
  }
}

export async function removeTeamMember(id: number) {
  try {
    await sql`DELETE FROM team_members WHERE id = ${id}`
    return { success: true }
  } catch (error) {
    console.error("Error removing team member:", error)
    return { success: false, error: "Failed to remove team member" }
  }
}

export async function leaveTeam(userId: number, teamId: number) {
  try {
    await sql`DELETE FROM team_members WHERE user_id = ${userId} AND team_id = ${teamId}`
    return { success: true }
  } catch (error) {
    console.error("Error leaving team:", error)
    return { success: false, error: "Failed to leave team" }
  }
}

export async function getUserTeams(userId: number) {
  try {
    const result = await sql`
      SELECT 
        t.*,
        tm.role
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = ${userId}
      ORDER BY t.name ASC
    `
    return { success: true, data: result }
  } catch (error) {
    console.error("Error fetching user teams:", error)
    return { success: false, error: "Failed to fetch user teams" }
  }
}
