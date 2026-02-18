import { loginUser } from "@/lib/actions/auth"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // console.log(`[Login API] Attempting login for: ${email}`)
    const result = await loginUser(email, password)

    if (!result.success) {
      // console.error(`==========[Login API] Login failed: ${result.error}`)
      return NextResponse.json({ error: result.error }, { status: 401 })
    }

    // console.log(`[Login API] Login successful for: ${email}`)
    return NextResponse.json({ user: result.user }, { status: 200 })
  } catch (error) {
    // console.error("[Login API] Route error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorStack = error instanceof Error ? error.stack : undefined
    // console.error("[Login API] Error details:", errorMessage)
    if (errorStack) {
      // console.error("[Login API] Error stack:", errorStack)
    }
    
    // Return 500 for server errors, not 401
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}
