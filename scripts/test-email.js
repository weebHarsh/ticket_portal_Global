require('dotenv').config({ path: '.env.local' })
const nodemailer = require('nodemailer')

const GMAIL_USER = process.env.GMAIL_USER
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD
const FROM_EMAIL = process.env.FROM_EMAIL || `Ticket Portal <${GMAIL_USER}>`
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000'

async function sendTestEmail(toEmail) {
  console.log('🚀 Testing Gmail SMTP Email Configuration...')
  console.log('📧 From:', FROM_EMAIL)
  console.log('📧 To:', toEmail)
  console.log('🔑 Gmail User:', GMAIL_USER ? '✅ Configured' : '❌ Missing')
  console.log('🔑 Gmail App Password:', GMAIL_APP_PASSWORD ? '✅ Configured' : '❌ Missing')
  console.log('')

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.error('❌ Gmail credentials not configured in .env.local')
    console.log('Please add GMAIL_USER and GMAIL_APP_PASSWORD to your .env.local file')
    return
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    })

    console.log('🔌 Connecting to Gmail SMTP...')

    // Send email
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: toEmail,
      subject: '🎉 Ticket Portal Email Test - Gmail SMTP Configuration Successful!',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Test</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Gmail SMTP Configuration Successful!</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="margin-top: 0;">Great news!</p>

    <p>Your Ticket Portal email notifications are now configured and working correctly with <strong>Gmail SMTP</strong>.</p>

    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #10b981;">✅ What's Working:</h3>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li><strong>Ticket assignment notifications</strong> - Assignees get notified when tickets are assigned to them</li>
        <li><strong>SPOC notifications</strong> - SPOCs get notified when new tickets are created</li>
        <li><strong>Status change notifications</strong> - Creators and assignees get notified when ticket status changes</li>
      </ul>

      <h3 style="margin-top: 20px; color: #3b82f6;">📧 Email Provider:</h3>
      <p style="margin: 5px 0;">Gmail SMTP via <code>${GMAIL_USER}</code></p>
    </div>

    <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #92400e;"><strong>📝 Note:</strong> You can now send emails to <strong>any email address</strong> (not just your verified account). This test was sent to <code>${toEmail}</code></p>
    </div>

    <a href="${APP_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 10px;">Open Dashboard</a>

    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
      This is a test email from Ticket Portal Email System.
    </p>
  </div>
</body>
</html>
      `,
    })

    console.log('✅ Email sent successfully!')
    console.log('📬 Message ID:', info.messageId)
    console.log('📨 Response:', info.response)
    console.log('')
    console.log('🎯 Next Steps:')
    console.log('   1. Check inbox at', toEmail)
    console.log('   2. Check spam folder if not in inbox')
    console.log('   3. Emails will now be sent automatically for:')
    console.log('      - New ticket assignments (to assignee)')
    console.log('      - SPOC notifications (when tickets are created)')
    console.log('      - Status changes (to creator and assignee)')
    console.log('')
    console.log('✅ You can now send to ANY email address, not just your verified account!')
  } catch (err) {
    console.error('❌ Error:', err.message)
    if (err.code === 'EAUTH') {
      console.log('')
      console.log('Authentication failed. Please check:')
      console.log('  1. Gmail account email is correct')
      console.log('  2. App password is correct (16 characters without spaces)')
      console.log('  3. 2-Step Verification is enabled on your Gmail account')
    }
  }
}

// Get email from command line or use default
const testEmail = process.argv[2] || 'harsh.thapliyal@mfilterit.com'
sendTestEmail(testEmail)
