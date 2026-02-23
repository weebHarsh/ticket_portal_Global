/**
 * Ticket Type Definitions
 * 
 * This file contains comprehensive TypeScript type definitions for tickets,
 * including support for internal tickets, sub-tickets, and redirection.
 */

/**
 * Base Ticket Type - matches database schema
 */
export interface Ticket {
  // Primary identifiers
  id: number
  ticket_id: string
  ticket_number: number

  // Basic information
  title: string
  description: string
  ticket_type: "support" | "requirement"
  status: "open" | "on-hold" | "resolved" | "closed" | "returned" | "deleted"
  priority: "low" | "medium" | "high" | "urgent"

  // Classification
  category: string | null
  subcategory: string | null
  category_id: number | null
  subcategory_id: number | null
  business_unit_group_id: number | null
  initiator_group: string | null
  target_business_group_id: number | null
  assignee_group_id: number | null

  // Assignment and ownership
  assigned_to: number | null
  created_by: number
  spoc_user_id: number | null

  // Project and release information
  project_id: number | null
  project_name: string | null
  product_release_name: string | null
  estimated_release_date: string | null

  // Duration and timing
  estimated_duration: string | null
  created_at: Date | string
  updated_at: Date | string
  resolved_at: Date | string | null
  closed_at: Date | string | null
  hold_at: Date | string | null
  deleted_at: Date | string | null

  // Status tracking
  is_deleted: boolean
  has_attachments: boolean
  hold_by: number | null
  closed_by: number | null

  // NEW: Internal tickets support
  is_internal: boolean

  // NEW: Sub-tickets (child tickets) support
  parent_ticket_id: number | null

  // NEW: Redirection support
  redirected_from_business_unit_group_id: number | null
  redirected_from_spoc_user_id: number | null
  redirection_remarks: string | null
  redirected_at: Date | string | null
}

/**
 * Ticket with joined data (from SQL queries)
 * Includes names from related tables
 */
export interface TicketWithDetails extends Ticket {
  // User names
  creator_name: string | null
  creator_email?: string | null
  assignee_name: string | null
  assignee_email?: string | null
  spoc_name: string | null
  closed_by_name: string | null
  hold_by_name: string | null

  // Classification names
  category_name: string | null
  subcategory_name: string | null
  group_name: string | null
  target_business_group_name: string | null
  assignee_group_name: string | null
  project_name: string | null

  // Redirection names (from joins)
  redirected_from_group_name?: string | null
  redirected_from_spoc_name?: string | null

  // Counts
  attachment_count: number

  // Sub-tickets (children)
  child_tickets?: TicketWithDetails[]
  parent_ticket?: TicketWithDetails | null
}

/**
 * Ticket creation input type
 */
export interface CreateTicketInput {
  ticketType: "support" | "requirement"
  targetBusinessGroupId: number
  projectName?: string
  projectId?: number | null
  categoryId: number | null
  subcategoryId: number | null
  title: string
  description: string
  estimatedDuration: string
  spocId: number
  productReleaseName?: string
  estimatedReleaseDate?: string | null
  // NEW fields
  isInternal?: boolean
  parentTicketId?: number | null
}

/**
 * Ticket redirection input type
 */
export interface RedirectTicketInput {
  ticketId: number
  newBusinessUnitGroupId: number
  newSpocUserId: number
  remarks: string
}

/**
 * Sub-ticket creation input type
 */
export interface CreateSubTicketInput extends CreateTicketInput {
  parentTicketId: number
  // For sub-tickets, initiator is SPOC of parent
  // SPOC group name is parent's target business group
}

/**
 * Ticket filter options
 */
export interface TicketFilters {
  status?: string
  assignee?: string
  type?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  includeDeleted?: boolean
  myTeam?: boolean
  userId?: number
  // NEW filters
  isInternal?: boolean
  parentTicketId?: number | null // null = only parent tickets, number = specific parent's children
  hasChildren?: boolean
}
