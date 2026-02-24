import { neon, NeonQueryFunction } from "@neondatabase/serverless"
import { getDatabaseUrl } from "./utils/db-config"

// ✅ Simple, direct initialization - no Proxy, no lazy tricks
const databaseUrl = getDatabaseUrl()

// Initialize Neon client
// Note: Neon serverless uses fetch under the hood
// For timeout issues, we'll add retry logic via a wrapper
const neonClient = neon(databaseUrl)

// Helper function to check if an error is retryable
function isRetryableError(error: unknown): boolean {
  if (!error) return false
  
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorCode = (error as any)?.code
  const cause = (error as any)?.cause
  
  // Check direct error properties
  if (
    errorCode === 'ETIMEDOUT' ||
    errorMessage.includes('ETIMEDOUT') ||
    errorMessage.includes('fetch failed') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('ENOTFOUND') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('network') ||
    errorMessage.includes('connection')
  ) {
    return true
  }
  
  // Check nested cause
  if (cause) {
    const causeCode = cause?.code
    const causeMessage = cause instanceof Error ? cause.message : String(cause)
    if (
      causeCode === 'ETIMEDOUT' ||
      causeMessage?.includes('ETIMEDOUT') ||
      causeMessage?.includes('fetch failed') ||
      causeMessage?.includes('timeout')
    ) {
      return true
    }
    
    // Check for AggregateError with ETIMEDOUT
    if (cause?.errors && Array.isArray(cause.errors)) {
      for (const err of cause.errors) {
        if (err?.code === 'ETIMEDOUT' || err?.message?.includes('ETIMEDOUT')) {
          return true
        }
      }
    }
  }
  
  return false
}

// Wrapper function to add retry logic for transient failures
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 5,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | unknown
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      // Check if it's a retryable error
      const isRetryable = isRetryableError(error)
      
      if (!isRetryable || attempt === maxRetries) {
        // Log final error with more details
        if (attempt === maxRetries && isRetryable) {
          console.error(`[DB Retry] All ${maxRetries} attempts failed. Final error:`, error)
        }
        throw error
      }
      
      // Exponential backoff with jitter: 1s, 2s, 4s, 8s, 16s
      const baseWaitTime = delayMs * Math.pow(2, attempt - 1)
      const jitter = Math.random() * 500 // Add up to 500ms jitter
      const waitTime = baseWaitTime + jitter
      
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.warn(`[DB Retry] Attempt ${attempt}/${maxRetries} failed (${errorMessage}). Retrying in ${Math.round(waitTime)}ms...`)
      
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
  
  throw lastError
}

// Create a wrapped SQL function that includes retry logic
// The Neon client returns a function that accepts template strings
export const sql = ((strings: TemplateStringsArray, ...values: any[]) => {
  return withRetry(() => neonClient(strings, ...values))
}) as NeonQueryFunction<false, false>

// ─── Types ────────────────────────────────────────────────────────────────────

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

export type TargetBusinessGroup = {
  id: number
  name: string
  description: string | null
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
  target_business_group_id: number | null
  assignee_group_id: number | null
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