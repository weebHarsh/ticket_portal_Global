import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

export const sql = neon(process.env.DATABASE_URL)

export type User = {
  id: number
  email: string
  password_hash: string
  full_name: string
  role: "admin" | "agent" | "user"
  avatar_url: string | null
  created_at: Date
  updated_at: Date
}

export type Ticket = {
  id: number
  title: string
  description: string
  status: "open" | "in-progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  category: string | null
  assigned_to: number | null
  created_by: number
  created_at: Date
  updated_at: Date
  resolved_at: Date | null
}

export type Comment = {
  id: number
  ticket_id: number
  user_id: number
  content: string
  created_at: Date
}

export type Attachment = {
  id: number
  ticket_id: number
  file_name: string
  file_url: string
  file_size: number | null
  uploaded_by: number
  created_at: Date
}
