import nodemailer from 'nodemailer'

// Initialize nodemailer transporter with Gmail SMTP
const transporter = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  : null

// Default sender email
const FROM_EMAIL = process.env.FROM_EMAIL || process.env.GMAIL_USER || 'Ticket Portal <noreply@example.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000'

interface EmailResult {
  success: boolean
  error?: string
}

// Email template for ticket assignment
function getAssignmentEmailHtml(data: {
  assigneeName: string
  ticketId: string
  ticketTitle: string
  description: string
  priority?: string
  assignedBy: string
  ticketUrl: string
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Assigned</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Ticket Assigned to You</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="margin-top: 0;">Hi <strong>${data.assigneeName}</strong>,</p>

    <p>A ticket has been assigned to you by <strong>${data.assignedBy}</strong>.</p>

    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; width: 120px;">Ticket ID:</td>
          <td style="padding: 8px 0; font-weight: 600;">${data.ticketId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Title:</td>
          <td style="padding: 8px 0; font-weight: 600;">${data.ticketTitle}</td>
        </tr>
        ${data.priority ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Priority:</td>
          <td style="padding: 8px 0;"><span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${data.priority}</span></td>
        </tr>
        ` : ''}
      </table>

      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; margin: 0 0 5px 0; font-size: 14px;">Description:</p>
        <p style="margin: 0; white-space: pre-wrap;">${data.description?.substring(0, 300) || 'No description provided'}${data.description?.length > 300 ? '...' : ''}</p>
      </div>
    </div>

    <a href="${data.ticketUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">View Ticket</a>

    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
      This is an automated notification from Ticket Portal.
    </p>
  </div>
</body>
</html>
`
}

// Email template for SPOC notification (new ticket created)
function getSpocNotificationHtml(data: {
  spocName: string
  ticketId: string
  ticketTitle: string
  description: string
  creatorName: string
  creatorGroup: string
  ticketUrl: string
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Ticket Created</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">New Ticket Requires Your Attention</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="margin-top: 0;">Hi <strong>${data.spocName}</strong>,</p>

    <p>A new ticket has been created and you have been assigned as the SPOC.</p>

    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; width: 120px;">Ticket ID:</td>
          <td style="padding: 8px 0; font-weight: 600;">${data.ticketId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Title:</td>
          <td style="padding: 8px 0; font-weight: 600;">${data.ticketTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Created By:</td>
          <td style="padding: 8px 0;">${data.creatorName} (${data.creatorGroup})</td>
        </tr>
      </table>

      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; margin: 0 0 5px 0; font-size: 14px;">Description:</p>
        <p style="margin: 0; white-space: pre-wrap;">${data.description?.substring(0, 300) || 'No description provided'}${data.description?.length > 300 ? '...' : ''}</p>
      </div>
    </div>

    <a href="${data.ticketUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">View & Assign Ticket</a>

    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
      This is an automated notification from Ticket Portal.
    </p>
  </div>
</body>
</html>
`
}

// Email template for status change
function getStatusChangeHtml(data: {
  recipientName: string
  ticketId: string
  ticketTitle: string
  oldStatus: string
  newStatus: string
  changedBy: string
  ticketUrl: string
}) {
  const statusColors: Record<string, string> = {
    open: '#3b82f6',
    closed: '#10b981',
    hold: '#f59e0b',
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Status Updated</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: ${statusColors[data.newStatus] || '#6b7280'}; padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Ticket Status Updated</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="margin-top: 0;">Hi <strong>${data.recipientName}</strong>,</p>

    <p>The status of ticket <strong>${data.ticketId}</strong> has been updated by <strong>${data.changedBy}</strong>.</p>

    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; width: 120px;">Ticket:</td>
          <td style="padding: 8px 0; font-weight: 600;">${data.ticketTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Status Change:</td>
          <td style="padding: 8px 0;">
            <span style="text-decoration: line-through; color: #9ca3af;">${data.oldStatus}</span>
            &rarr;
            <span style="background: ${statusColors[data.newStatus] || '#6b7280'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase;">${data.newStatus}</span>
          </td>
        </tr>
      </table>
    </div>

    <a href="${data.ticketUrl}" style="display: inline-block; background: ${statusColors[data.newStatus] || '#6b7280'}; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">View Ticket</a>

    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
      This is an automated notification from Ticket Portal.
    </p>
  </div>
</body>
</html>
`
}

// Send email when ticket is assigned to someone
export async function sendAssignmentEmail(data: {
  assigneeEmail: string
  assigneeName: string
  ticketId: string
  ticketDbId: number
  ticketTitle: string
  description: string
  priority?: string
  assignedByName: string
}): Promise<EmailResult> {
  if (!transporter) {
    console.log('[Email] Gmail SMTP not configured - skipping assignment email')
    return { success: true } // Don't fail if email not configured
  }

  try {
    const ticketUrl = `${APP_URL}/tickets/${data.ticketDbId}`

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: data.assigneeEmail,
      subject: `[${data.ticketId}] Ticket Assigned: ${data.ticketTitle}`,
      html: getAssignmentEmailHtml({
        assigneeName: data.assigneeName,
        ticketId: data.ticketId,
        ticketTitle: data.ticketTitle,
        description: data.description,
        priority: data.priority,
        assignedBy: data.assignedByName,
        ticketUrl,
      }),
    })

    console.log(`[Email] Assignment email sent to ${data.assigneeEmail}`)
    return { success: true }
  } catch (error: any) {
    console.error('[Email] Error sending assignment email:', error)
    return { success: false, error: error.message || 'Failed to send email' }
  }
}

// Send email to SPOC when new ticket is created
export async function sendSpocNotificationEmail(data: {
  spocEmail: string
  spocName: string
  ticketId: string
  ticketDbId: number
  ticketTitle: string
  description: string
  creatorName: string
  creatorGroup: string
}): Promise<EmailResult> {
  if (!transporter) {
    console.log('[Email] Gmail SMTP not configured - skipping SPOC notification email')
    return { success: true }
  }

  try {
    const ticketUrl = `${APP_URL}/tickets/${data.ticketDbId}`

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: data.spocEmail,
      subject: `[${data.ticketId}] New Ticket: ${data.ticketTitle}`,
      html: getSpocNotificationHtml({
        spocName: data.spocName,
        ticketId: data.ticketId,
        ticketTitle: data.ticketTitle,
        description: data.description,
        creatorName: data.creatorName,
        creatorGroup: data.creatorGroup,
        ticketUrl,
      }),
    })

    console.log(`[Email] SPOC notification email sent to ${data.spocEmail}`)
    return { success: true }
  } catch (error: any) {
    console.error('[Email] Error sending SPOC notification email:', error)
    return { success: false, error: error.message || 'Failed to send email' }
  }
}

// Send email when ticket status changes
export async function sendStatusChangeEmail(data: {
  recipientEmail: string
  recipientName: string
  ticketId: string
  ticketDbId: number
  ticketTitle: string
  oldStatus: string
  newStatus: string
  changedByName: string
}): Promise<EmailResult> {
  if (!transporter) {
    console.log('[Email] Gmail SMTP not configured - skipping status change email')
    return { success: true }
  }

  try {
    const ticketUrl = `${APP_URL}/tickets/${data.ticketDbId}`

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: data.recipientEmail,
      subject: `[${data.ticketId}] Status Changed to ${data.newStatus.toUpperCase()}`,
      html: getStatusChangeHtml({
        recipientName: data.recipientName,
        ticketId: data.ticketId,
        ticketTitle: data.ticketTitle,
        oldStatus: data.oldStatus,
        newStatus: data.newStatus,
        changedBy: data.changedByName,
        ticketUrl,
      }),
    })

    console.log(`[Email] Status change email sent to ${data.recipientEmail}`)
    return { success: true }
  } catch (error: any) {
    console.error('[Email] Error sending status change email:', error)
    return { success: false, error: error.message || 'Failed to send email' }
  }
}
