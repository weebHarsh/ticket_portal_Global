"use server"

import { sql } from "@/lib/db"

export async function getDashboardStats() {
  try {
    const openResult = await sql`SELECT COUNT(*) as count FROM tickets WHERE status = 'open'`
    const closedResult = await sql`SELECT COUNT(*) as count FROM tickets WHERE status = 'closed'`
    const holdResult = await sql`SELECT COUNT(*) as count FROM tickets WHERE status = 'hold'`
    const totalResult = await sql`SELECT COUNT(*) as count FROM tickets`

    return {
      success: true,
      data: {
        open: Number(openResult[0]?.count || 0),
        closed: Number(closedResult[0]?.count || 0),
        hold: Number(holdResult[0]?.count || 0),
        total: Number(totalResult[0]?.count || 0),
      },
    }
  } catch (error) {
    console.error("[v0] Error fetching stats:", error)
    return {
      success: false,
      error: "Failed to fetch stats",
      data: { open: 0, closed: 0, hold: 0, total: 0 },
    }
  }
}

export async function getRecentTickets(limit = 5) {
  try {
    const result = await sql`
      SELECT
        t.id,
        t.ticket_id,
        t.title,
        t.description,
        c.name as category_name,
        sc.name as subcategory_name,
        t.status,
        t.created_at,
        a.full_name as assignee_name,
        spoc.full_name as spoc_name,
        closer.full_name as closed_by_name,
        t.closed_at,
        (SELECT COUNT(*) FROM attachments att WHERE att.ticket_id = t.id) as attachment_count
      FROM tickets t
      LEFT JOIN users a ON t.assigned_to = a.id
      LEFT JOIN users spoc ON t.spoc_user_id = spoc.id
      LEFT JOIN users closer ON t.closed_by = closer.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN subcategories sc ON t.subcategory_id = sc.id
      WHERE (t.is_deleted IS NULL OR t.is_deleted = FALSE)
      ORDER BY t.created_at DESC
      LIMIT ${limit}
    `

    return { success: true, data: result }
  } catch (error) {
    console.error("[v0] Error fetching recent tickets:", error)
    return { success: false, error: "Failed to fetch recent tickets", data: [] }
  }
}

export async function getAnalyticsData() {
  try {
    const ticketsByBU = await sql`
      SELECT
        bu.name as business_unit,
        COUNT(t.id) as ticket_count
      FROM tickets t
      LEFT JOIN business_unit_groups bu ON t.business_unit_group_id = bu.id
      WHERE bu.name IS NOT NULL
      GROUP BY bu.name
      ORDER BY ticket_count DESC
    `

    const ticketsByCategory = await sql`
      SELECT
        c.name as category,
        COUNT(t.id) as ticket_count
      FROM tickets t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE c.name IS NOT NULL
      GROUP BY c.name
      ORDER BY ticket_count DESC
    `

    const ticketsBySubcategory = await sql`
      SELECT
        s.name as subcategory,
        c.name as category,
        COUNT(t.id) as ticket_count
      FROM tickets t
      LEFT JOIN subcategories s ON t.subcategory_id = s.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE s.name IS NOT NULL
      GROUP BY s.name, c.name
      ORDER BY ticket_count DESC
      LIMIT 10
    `

    const ticketsByStatus = await sql`
      SELECT
        status,
        COUNT(*) as count
      FROM tickets
      GROUP BY status
      ORDER BY count DESC
    `

    const ticketsByType = await sql`
      SELECT
        ticket_type,
        COUNT(*) as count
      FROM tickets
      GROUP BY ticket_type
      ORDER BY count DESC
    `

    const ticketsByPriority = await sql`
      SELECT
        priority,
        COUNT(*) as count
      FROM tickets
      GROUP BY priority
      ORDER BY count DESC
    `

    const ticketTrend = await sql`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count
      FROM tickets
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    const teamPerformance = await sql`
      SELECT
        u.full_name as assignee,
        COUNT(CASE WHEN t.status = 'closed' THEN 1 END) as closed_count,
        COUNT(CASE WHEN t.status = 'open' THEN 1 END) as open_count,
        COUNT(*) as total_count
      FROM tickets t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE u.full_name IS NOT NULL
      GROUP BY u.full_name
      ORDER BY total_count DESC
      LIMIT 10
    `

    const avgResolutionTime = await sql`
      SELECT
        AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_hours
      FROM tickets
      WHERE resolved_at IS NOT NULL
    `

    const ticketsByMonth = await sql`
      SELECT
        TO_CHAR(created_at, 'Mon YYYY') as month,
        COUNT(*) as count
      FROM tickets
      WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(created_at, 'Mon YYYY'), DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at) ASC
    `

    return {
      success: true,
      data: {
        ticketsByBU: ticketsByBU || [],
        ticketsByCategory: ticketsByCategory || [],
        ticketsBySubcategory: ticketsBySubcategory || [],
        ticketsByStatus: ticketsByStatus || [],
        ticketsByType: ticketsByType || [],
        ticketsByPriority: ticketsByPriority || [],
        ticketTrend: ticketTrend || [],
        teamPerformance: teamPerformance || [],
        avgResolutionTime: Number(avgResolutionTime[0]?.avg_hours || 0).toFixed(1),
        ticketsByMonth: ticketsByMonth || [],
      },
    }
  } catch (error) {
    console.error("[v0] Error fetching analytics data:", error)
    return {
      success: false,
      error: "Failed to fetch analytics data",
      data: {
        ticketsByBU: [],
        ticketsByCategory: [],
        ticketsBySubcategory: [],
        ticketsByStatus: [],
        ticketsByType: [],
        ticketsByPriority: [],
        ticketTrend: [],
        teamPerformance: [],
        avgResolutionTime: "0",
        ticketsByMonth: [],
      },
    }
  }
}
