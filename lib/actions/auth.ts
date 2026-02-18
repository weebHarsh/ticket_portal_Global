"use server"

import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

// OWASP: Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

function isValidEmail(email: string): boolean {
  // console.log(`==========[isValidEmail] Email: ${email}`);
  // console.log(`==========[isValidEmail] Email length: ${email?.length}`);
  // console.log(`==========[isValidEmail] Email regex test: ${EMAIL_REGEX.test(email.trim())}`);
  if (!email || typeof email !== "string") return false
  if (email.length > 254) return false
  return EMAIL_REGEX.test(email.trim())
}

function isValidPassword(password: string): boolean {
  if (!password || typeof password !== "string") return false
  if (password.length < 8) return false
  if (password.length > 128) return false
  return true
}

function sanitizeString(input: string): string {
  if (!input || typeof input !== "string") return ""
  return input.trim().substring(0, 255)
}

export async function getCurrentUser() {
  try {
    try {
      const { getServerSession } = await import("next-auth")
      const { authOptions } = await import("@/app/api/auth/[...nextauth]/route")
      const session = await getServerSession(authOptions)

      if (session?.user) {
        return {
          id: parseInt(session.user.id),
          email: session.user.email || "",
          full_name: session.user.name || "",
          role: session.user.role || "user",
          business_unit_group_id: session.user.business_unit_group_id,
          group_name: session.user.group_name,
          auth_provider: session.user.auth_provider || "microsoft",
        }
      }
    } catch (nextAuthError) {
      // console.log("==========[getCurrentUser] NextAuth session not available, using cookie auth")
    }

    const cookieStore = await cookies()
    const userCookie = cookieStore.get("user")

    if (!userCookie) return null

    return JSON.parse(userCookie.value)
  } catch (error) {
    // console.error("Error getting current user:", error)
    return null
  }
}

export async function getBusinessUnitGroups() {
  try {
    const result = await sql`SELECT id, name FROM business_unit_groups ORDER BY name`
    return { success: true, data: result }
  } catch (error) {
    //  console.error("Error fetching business unit groups:", error)
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
    if (!Number.isInteger(businessUnitGroupId) || businessUnitGroupId <= 0) {
      return { success: false, error: "Invalid business unit group" }
    }

    const sanitizedEmail = email.trim().toLowerCase()
    const existingUser = await sql`SELECT * FROM users WHERE email = ${sanitizedEmail}`

    if (existingUser && existingUser.length > 0) {
      return { success: false, error: "User already exists" }
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const result = await sql`
      INSERT INTO users (email, full_name, password_hash, role, business_unit_group_id)
      VALUES (${sanitizedEmail}, ${sanitizedFullName}, ${passwordHash}, 'user', ${businessUnitGroupId})
      RETURNING id, email, full_name, role, business_unit_group_id
    `

    const groupResult = await sql`
      SELECT name FROM business_unit_groups WHERE id = ${businessUnitGroupId}
    `

    return {
      success: true,
      user: { ...result[0], group_name: groupResult[0]?.name || "" },
    }
  } catch (error) {
    // console.error("Signup error:", error)
    return { success: false, error: "Failed to create user" }
  }
}

export async function loginUser(email: string, password: string) {
  try {
    // console.log( `==========[LoginUser] Starting login for: ${email}`)
    // console.log(`==========[LoginUser] isValidEmail(email): ${isValidEmail(email)}`)
    
    if (isValidEmail(email) === false) {
      return { success: false, error: "Invalid email or password" }
    }
    if (!password || typeof password !== "string" || password.length > 128) {
      return { success: false, error: "Invalid email or password" }
    }

    const sanitizedEmail = email.trim().toLowerCase()
    // console.log(`==========[LoginUser] Querying database for: ${sanitizedEmail}`)

    const result = await sql`
      SELECT u.*, bug.name as group_name
      FROM users u
      LEFT JOIN business_unit_groups bug ON u.business_unit_group_id = bug.id
      WHERE u.email = ${sanitizedEmail}
    `

    // console.log(`==========[LoginUser] Query result: user(s) found`, result)

    if (!result || result.length === 0) {
      console.log(`==========[LoginUser] No user found for email: ${sanitizedEmail}`)
      await bcrypt.compare(password, "$2a$10$invalidhashplaceholder")
      return { success: false, error: "Invalid email or password" }
    }

    const user = result[0]

    if (!user.password_hash) {
      return { success: false, error: "This account uses Microsoft SSO. Please sign in with Microsoft." }
    }

    if (user.auth_provider === "microsoft" && !user.password_hash) {
      return { success: false, error: "This account uses Microsoft SSO. Please sign in with Microsoft." }
    }
    // console.log(`==========[LoginUser] Comparing password: ${password} with hash: ${user.password_hash}`)
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    // console.log(`==========[LoginUser] isPasswordValid: ${isPasswordValid}`)
    if (!isPasswordValid) {
      // console.log(`==========[LoginUser] Password is invalid`)
      return { success: false, error: "Invalid email or password" }
    }

    // console.log(`========== [LoginUser] Login successful for: ${user.email}`)
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
    // console.error("[LoginUser] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return { success: false, error: `Failed to login: ${errorMessage}` }
  }
}

export async function getUserByEmail(email: string) {
  try {
    const sanitizedEmail = email.trim().toLowerCase()
    const result = await sql`
      SELECT u.*, bug.name as group_name
      FROM users u
      LEFT JOIN business_unit_groups bug ON u.business_unit_group_id = bug.id
      WHERE u.email = ${sanitizedEmail}
    `
    return result[0] || null
  } catch (error) {
    console.error("Error fetching user by email:", error)
    return null
  }
}

export async function getUserByMicrosoftId(microsoftId: string) {
  try {
    const result = await sql`
      SELECT u.*, bug.name as group_name
      FROM users u
      LEFT JOIN business_unit_groups bug ON u.business_unit_group_id = bug.id
      WHERE u.microsoft_id = ${microsoftId}
    `
    return result[0] || null
  } catch (error) {
    console.error("Error fetching user by Microsoft ID:", error)
    return null
  }
}

interface FindOrCreateSSOUserParams {
  email: string
  name: string
  microsoftId: string
  image?: string | null
}

export async function findOrCreateSSOUser({
  email,
  name,
  microsoftId,
  image,
}: FindOrCreateSSOUserParams) {
  try {
    const sanitizedEmail = email.trim().toLowerCase()
    const sanitizedName = sanitizeString(name)

    let user = await getUserByMicrosoftId(microsoftId)
    if (!user) user = await getUserByEmail(sanitizedEmail)

    if (user) {
      if (!user.microsoft_id) {
        await sql`
          UPDATE users
          SET microsoft_id = ${microsoftId},
              auth_provider = 'microsoft',
              email_verified = TRUE,
              avatar_url = COALESCE(${image}, avatar_url),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${user.id}
        `
      }

      const updatedUser = await getUserByEmail(sanitizedEmail)
      const groupResult = await sql`
        SELECT name FROM business_unit_groups WHERE id = ${updatedUser?.business_unit_group_id}
      `

      return {
        success: true,
        user: {
          id: updatedUser!.id,
          email: updatedUser!.email,
          full_name: updatedUser!.full_name,
          role: updatedUser!.role,
          business_unit_group_id: updatedUser!.business_unit_group_id,
          group_name: groupResult[0]?.name || "",
          auth_provider: updatedUser!.auth_provider || "microsoft",
        },
      }
    }

    const result = await sql`
      INSERT INTO users (email, full_name, microsoft_id, auth_provider, email_verified, avatar_url, role)
      VALUES (${sanitizedEmail}, ${sanitizedName}, ${microsoftId}, 'microsoft', TRUE, ${image || null}, 'user')
      RETURNING id, email, full_name, role, business_unit_group_id
    `

    const newUser = result[0]
    return {
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        business_unit_group_id: newUser.business_unit_group_id,
        group_name: "",
        auth_provider: "microsoft",
      },
    }
  } catch (error) {
    console.error("Error finding or creating SSO user:", error)
    return { success: false, error: "Failed to create user account" }
  }
}