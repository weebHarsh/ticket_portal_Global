import { neon } from "@neondatabase/serverless"
import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { full_name, email, role } = await request.json()

    if (!full_name || !email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const existingUser = await sql`SELECT id FROM users WHERE email = ${email}`

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    const tempPassword = Math.random().toString(36).slice(-12) + "Temp1!"
    const passwordHash = await bcrypt.hash(tempPassword, 10)

    const result = await sql`
      INSERT INTO users (full_name, email, role, password_hash) VALUES (${full_name}, ${email}, ${role}, ${passwordHash})
      RETURNING id, full_name, email, role
    `

    return NextResponse.json(
      {
        user: result[0],
        message: "User created successfully",
        tempPassword: tempPassword,
        note: "Share this temporary password with the user. They should change it on first login.",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
