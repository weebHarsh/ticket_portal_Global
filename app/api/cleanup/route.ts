import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { DeleteObjectCommand } from "@aws-sdk/client-s3"
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from "@/lib/r2"

// Cleanup API - deletes attachments older than 3 months
// Can be triggered via Vercel Cron or external cron service
// Add to vercel.json: { "crons": [{ "path": "/api/cleanup", "schedule": "0 0 * * *" }] }

const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000 // 90 days in milliseconds

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security (optional but recommended)
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    // If CRON_SECRET is set, verify it
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cutoffDate = new Date(Date.now() - THREE_MONTHS_MS)

    // Find attachments older than 3 months
    const oldAttachments = await sql`
      SELECT id, file_url, file_name, ticket_id, created_at
      FROM attachments
      WHERE created_at < ${cutoffDate.toISOString()}
    `

    if (oldAttachments.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No attachments to clean up",
        deleted: 0,
      })
    }

    const deletedFiles: string[] = []
    const failedFiles: string[] = []

    for (const attachment of oldAttachments) {
      try {
        // Extract the key from the file URL
        const fileKey = attachment.file_url?.replace(`${R2_PUBLIC_URL}/`, "")

        if (fileKey) {
          // Delete from R2
          await r2Client.send(
            new DeleteObjectCommand({
              Bucket: R2_BUCKET_NAME,
              Key: fileKey,
            })
          )
        }

        // Delete from database
        await sql`DELETE FROM attachments WHERE id = ${attachment.id}`

        deletedFiles.push(attachment.file_name)
      } catch (error) {
        console.error(`Failed to delete attachment ${attachment.id}:`, error)
        failedFiles.push(attachment.file_name)
      }
    }

    // Update has_attachments flag for affected tickets
    const affectedTicketIds = Array.from(new Set(oldAttachments.map((a: any) => a.ticket_id)))

    for (const ticketId of affectedTicketIds) {
      const remainingCount = await sql`
        SELECT COUNT(*) as count FROM attachments WHERE ticket_id = ${ticketId}
      `

      if (Number(remainingCount[0]?.count) === 0) {
        await sql`UPDATE tickets SET has_attachments = FALSE WHERE id = ${ticketId}`
      }
    }

    // Log cleanup activity
    console.log(`[Cleanup] Deleted ${deletedFiles.length} attachments older than 3 months`)
    if (failedFiles.length > 0) {
      console.log(`[Cleanup] Failed to delete ${failedFiles.length} files:`, failedFiles)
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedFiles.length} attachments older than 3 months`,
      deleted: deletedFiles.length,
      failed: failedFiles.length,
      cutoffDate: cutoffDate.toISOString(),
    })
  } catch (error) {
    console.error("[Cleanup] Error during cleanup:", error)
    return NextResponse.json(
      { error: "Cleanup failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// POST method for manual trigger with authentication
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication for manual cleanup
    const body = await request.json().catch(() => ({}))
    const { adminKey } = body

    if (adminKey !== process.env.ADMIN_CLEANUP_KEY && !process.env.ADMIN_CLEANUP_KEY) {
      // If no admin key is configured, allow cleanup (dev mode)
      console.log("[Cleanup] Running in dev mode without admin key verification")
    } else if (adminKey !== process.env.ADMIN_CLEANUP_KEY) {
      return NextResponse.json({ error: "Invalid admin key" }, { status: 401 })
    }

    // Reuse GET logic
    return GET(request)
  } catch (error) {
    console.error("[Cleanup] Error during manual cleanup:", error)
    return NextResponse.json(
      { error: "Manual cleanup failed" },
      { status: 500 }
    )
  }
}
