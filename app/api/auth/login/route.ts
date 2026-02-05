import { loginUser } from "@/lib/actions/auth"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const result = await loginUser(email, password)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 })
    }

    return NextResponse.json({ user: result.user }, { status: 200 })
  } catch (error) {
    console.error("Login route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
