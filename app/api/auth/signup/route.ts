import { signupUser } from "@/lib/actions/auth"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, full_name, password, business_unit_group_id } = await request.json()

    if (!email || !full_name || !password || !business_unit_group_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await signupUser(email, full_name, password, business_unit_group_id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ user: result.user }, { status: 201 })
  } catch (error) {
    console.error("Signup route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
