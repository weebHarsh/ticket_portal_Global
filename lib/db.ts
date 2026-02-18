import { neon } from "@neondatabase/serverless"
import { getDatabaseUrl } from "./utils/db-config"

// Get the appropriate database URL based on environment
const databaseUrl = getDatabaseUrl()

export const sql = neon(databaseUrl)

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
  ticket_id: string
  ticket_number: number
  title: string
  description: string
  ticket_type: "support" | "requirement"
  status: "open" | "on-hold" | "resolved" | "closed" | "returned" | "deleted"
  priority: "low" | "medium" | "high" | "urgent"
  category: string | null
  subcategory: string | null
  category_id: number | null
  subcategory_id: number | null
  business_unit_group_id: number | null
  initiator_group: string | null
  estimated_duration: string | null
  assigned_to: number | null
  created_by: number
  spoc_user_id: number | null
  project_id: number | null
  project_name: string | null
  product_release_name: string | null
  estimated_release_date: string | null
  is_deleted: boolean
  deleted_at: Date | null
  has_attachments: boolean
  hold_by: number | null
  hold_at: Date | null
  closed_by: number | null
  closed_at: Date | null
  resolved_at: Date | null
  created_at: Date
  updated_at: Date
  // New fields for internal tickets, sub-tickets, and redirection
  is_internal: boolean
  parent_ticket_id: number | null
  redirected_from_business_unit_group_id: number | null
  redirected_from_spoc_user_id: number | null
  redirection_remarks: string | null
  redirected_at: Date | null
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
