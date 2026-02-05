import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from "@/lib/r2"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// OWASP: Whitelist of allowed file extensions
const ALLOWED_EXTENSIONS = [
  // Documents
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv", ".rtf",
  // Images
  ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg",
  // Archives
  ".zip", ".rar", ".7z",
  // Other common formats
  ".json", ".xml", ".md",
]

// OWASP: Whitelist of allowed MIME types
const ALLOWED_MIME_TYPES = [
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/rtf",
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/bmp",
  "image/webp",
  "image/svg+xml",
  // Archives
  "application/zip",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
  // Other
  "application/json",
  "application/xml",
  "text/xml",
  "text/markdown",
]

// OWASP: Dangerous file extensions to block (executable, scripts)
const BLOCKED_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".com", ".msi", ".dll", ".scr",
  ".js", ".jsx", ".ts", ".tsx", ".vbs", ".vbe", ".wsf", ".wsh",
  ".ps1", ".psm1", ".psd1",
  ".sh", ".bash", ".zsh",
  ".php", ".phtml", ".php3", ".php4", ".php5", ".phps",
  ".asp", ".aspx", ".cer", ".csr",
  ".jsp", ".jspx",
  ".py", ".pyc", ".pyo",
  ".pl", ".pm", ".cgi",
  ".jar", ".class",
  ".htaccess", ".htpasswd",
]

function getFileExtension(filename: string): string {
  const ext = filename.toLowerCase().match(/\.[^.]*$/)?.[0] || ""
  return ext
}

function isValidFileName(filename: string): boolean {
  // OWASP: Check for path traversal attempts
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return false
  }
  // Check for null bytes
  if (filename.includes("\0")) {
    return false
  }
  // Check length
  if (filename.length > 255) {
    return false
  }
  return true
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const ticketId = formData.get("ticketId") as string
    const uploadedBy = formData.get("uploadedBy") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!ticketId) {
      return NextResponse.json({ error: "No ticket ID provided" }, { status: 400 })
    }

    // OWASP: Validate ticketId is a valid number
    const ticketIdNum = Number(ticketId)
    if (isNaN(ticketIdNum) || !Number.isInteger(ticketIdNum) || ticketIdNum <= 0) {
      return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 })
    }

    // OWASP: Validate uploadedBy is a valid number if provided
    if (uploadedBy) {
      const uploadedByNum = Number(uploadedBy)
      if (isNaN(uploadedByNum) || !Number.isInteger(uploadedByNum) || uploadedByNum <= 0) {
        return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
      }
    }

    // OWASP: Validate filename
    if (!isValidFileName(file.name)) {
      return NextResponse.json(
        { error: "Invalid filename. Path traversal or special characters detected." },
        { status: 400 }
      )
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      )
    }

    // OWASP: Validate file extension
    const fileExtension = getFileExtension(file.name)

    if (BLOCKED_EXTENSIONS.includes(fileExtension)) {
      return NextResponse.json(
        { error: `File type "${fileExtension}" is not allowed for security reasons` },
        { status: 400 }
      )
    }

    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return NextResponse.json(
        { error: `File type "${fileExtension}" is not supported. Allowed: documents, images, archives` },
        { status: 400 }
      )
    }

    // OWASP: Validate MIME type
    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
      console.warn(`[Security] Unknown MIME type: ${file.type} for file: ${file.name}`)
      // Allow if extension is valid but log the warning
    }

    // Generate unique filename with sanitization
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    // OWASP: Strict sanitization - only allow alphanumeric, dots, and underscores
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/\.{2,}/g, "_") // Prevent multiple dots
      .substring(0, 100) // Limit length
    const fileName = `tickets/${ticketIdNum}/${timestamp}-${randomSuffix}-${sanitizedName}`

    // Upload to R2
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
        ContentLength: file.size,
      })
    )

    // Generate public URL
    const fileUrl = `${R2_PUBLIC_URL}/${fileName}`

    // Save to database
    const result = await sql`
      INSERT INTO attachments (ticket_id, file_name, file_url, file_size, uploaded_by)
      VALUES (${ticketIdNum}, ${file.name}, ${fileUrl}, ${file.size}, ${uploadedBy ? Number(uploadedBy) : null})
      RETURNING *
    `

    // Update has_attachments flag on ticket
    await sql`
      UPDATE tickets SET has_attachments = TRUE WHERE id = ${ticketIdNum}
    `

    return NextResponse.json({
      success: true,
      data: result[0],
    })
  } catch (error) {
    console.error("Error uploading attachment:", error)
    return NextResponse.json(
      { error: "Failed to upload attachment" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const attachmentId = searchParams.get("id")

    if (!attachmentId) {
      return NextResponse.json({ error: "No attachment ID provided" }, { status: 400 })
    }

    // OWASP: Validate attachmentId is a valid number
    const attachmentIdNum = Number(attachmentId)
    if (isNaN(attachmentIdNum) || !Number.isInteger(attachmentIdNum) || attachmentIdNum <= 0) {
      return NextResponse.json({ error: "Invalid attachment ID" }, { status: 400 })
    }

    // Get attachment info
    const attachment = await sql`
      SELECT * FROM attachments WHERE id = ${attachmentIdNum}
    `

    if (attachment.length === 0) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 })
    }

    const ticketId = attachment[0].ticket_id
    const fileUrl = attachment[0].file_url

    // Extract filename from URL
    const fileName = fileUrl.replace(`${R2_PUBLIC_URL}/`, "")

    // Delete from R2
    try {
      await r2Client.send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: fileName,
        })
      )
    } catch (r2Error) {
      console.error("Error deleting from R2:", r2Error)
      // Continue even if R2 delete fails
    }

    // Delete from database
    await sql`DELETE FROM attachments WHERE id = ${attachmentIdNum}`

    // Check if ticket has any remaining attachments
    const remainingAttachments = await sql`
      SELECT COUNT(*) as count FROM attachments WHERE ticket_id = ${ticketId}
    `

    if (Number(remainingAttachments[0].count) === 0) {
      await sql`UPDATE tickets SET has_attachments = FALSE WHERE id = ${ticketId}`
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting attachment:", error)
    return NextResponse.json(
      { error: "Failed to delete attachment" },
      { status: 500 }
    )
  }
}
