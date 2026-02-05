"use server"

import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

const sql = neon(process.env.DATABASE_URL!)

// OWASP: Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

// OWASP: Input validation helpers
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false
  if (email.length > 254) return false // RFC 5321
  return EMAIL_REGEX.test(email.trim())
}

function isValidPassword(password: string): boolean {
  if (!password || typeof password !== "string") return false
  if (password.length < 8) return false // Minimum 8 characters
  if (password.length > 128) return false // Maximum length
  return true
}

function sanitizeString(input: string): string {
  if (!input || typeof input !== "string") return ""
  return input.trim().substring(0, 255)
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("user")

    if (!userCookie) {
      return null
    }

    const user = JSON.parse(userCookie.value)
    return user
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function getBusinessUnitGroups() {
  try {
    const result = await sql`SELECT id, name FROM business_unit_groups ORDER BY name`
    return { success: true, data: result }
  } catch (error) {
    console.error("Error fetching business unit groups:", error)
    return { success: false, error: "Failed to fetch groups" }
  }
}

export async function signupUser(
  email: string,
  fullName: string,
  password: string,
  businessUnitGroupId: number
) {
  try {
    // OWASP: Input validation
    if (!isValidEmail(email)) {
      return { success: false, error: "Invalid email format" }
    }

    if (!isValidPassword(password)) {
      return { success: false, error: "Password must be between 8 and 128 characters" }
    }

    const sanitizedFullName = sanitizeString(fullName)
    if (!sanitizedFullName || sanitizedFullName.length < 2) {
      return { success: false, error: "Full name must be at least 2 characters" }
    }

    // OWASP: Validate businessUnitGroupId
    if (!Number.isInteger(businessUnitGroupId) || businessUnitGroupId <= 0) {
      return { success: false, error: "Invalid business unit group" }
    }

    const sanitizedEmail = email.trim().toLowerCase()

    const existingUser = await sql`SELECT * FROM users WHERE email = ${sanitizedEmail}`

    if (existingUser && existingUser.length > 0) {
      return { success: false, error: "User already exists" }
    }

    const passwordHash = await bcrypt.hash(password, 10)

    // Default role is 'user', business_unit_group_id links to their group
    const result = await sql`
      INSERT INTO users (email, full_name, password_hash, role, business_unit_group_id)
      VALUES (${sanitizedEmail}, ${sanitizedFullName}, ${passwordHash}, 'user', ${businessUnitGroupId})
      RETURNING id, email, full_name, role, business_unit_group_id
    `

    // Get the group name for the response
    const groupResult = await sql`
      SELECT name FROM business_unit_groups WHERE id = ${businessUnitGroupId}
    `
    const groupName = groupResult[0]?.name || ''

    return {
      success: true,
      user: {
        ...result[0],
        group_name: groupName,
      },
    }
  } catch (error) {
    console.error("Signup error:", error)
    return { success: false, error: "Failed to create user" }
  }
}

export async function loginUser(email: string, password: string) {
  try {
    // OWASP: Input validation
    if (!isValidEmail(email)) {
      return { success: false, error: "Invalid email or password" } // Generic error to prevent enumeration
    }

    if (!password || typeof password !== "string" || password.length > 128) {
      return { success: false, error: "Invalid email or password" }
    }

    const sanitizedEmail = email.trim().toLowerCase()

    const result = await sql`
      SELECT u.*, bug.name as group_name
      FROM users u
      LEFT JOIN business_unit_groups bug ON u.business_unit_group_id = bug.id
      WHERE u.email = ${sanitizedEmail}
    `

    if (!result || result.length === 0) {
      // OWASP: Use constant-time comparison to prevent timing attacks
      await bcrypt.compare(password, "$2a$10$invalidhashplaceholder")
      return { success: false, error: "Invalid email or password" }
    }

    const user = result[0]

    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordValid) {
      return { success: false, error: "Invalid email or password" }
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        business_unit_group_id: user.business_unit_group_id,
        group_name: user.group_name,
      },
    }
  } catch (error) {
    console.error("[v0] Login error:", error)
    return { success: false, error: "Failed to login" }
  }
}
