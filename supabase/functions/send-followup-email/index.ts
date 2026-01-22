import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FollowupEmailRequest {
  to: string
  fullName: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    const { to, fullName }: FollowupEmailRequest = await req.json()

    if (!to || !fullName) {
      throw new Error('Missing required fields: to, fullName')
    }

    const firstName = fullName.split(' ')[0]
    const loginUrl = 'https://www.lastr.app/login'

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Still interested in Lastr?</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 16px;">
              <img src="https://www.lastr.app/icons/apple-touch-icon.png" alt="Lastr Logo" width="60" height="60" style="display: block; margin: 0 auto 12px auto; border-radius: 16px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">
                Lastr <span style="color: #3b82f6;">Creator Program</span>
              </h1>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.2); padding: 24px;">

              <!-- Welcome Message -->
              <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #ffffff;">
                Hey ${firstName}! 👋
              </h2>
              <p style="margin: 0 0 12px 0; font-size: 16px; line-height: 1.6; color: #a1a1aa;">
                You signed up for the Lastr Creator Program a few days ago, but we haven't heard from you in a while!
              </p>
              <p style="margin: 0 0 12px 0; font-size: 16px; line-height: 1.6; color: #a1a1aa;">
                We'd love to have you onboard! As a reminder, our viral format takes just <strong style="color: #ffffff;">5 minutes to make</strong>, and you can earn up to <strong style="color: #3b82f6;">$5,000/month</strong> for only a few hours of work.
              </p>

              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 16px 0;">

              <!-- Steps Header -->
              <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #ffffff;">
                If you're still interested:
              </h3>

              <!-- Steps -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">

                <!-- Step 1 -->
                <tr>
                  <td style="padding: 12px 16px; background-color: rgba(59, 130, 246, 0.1); border-radius: 8px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="32" valign="top">
                          <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; background-color: #3b82f6; border-radius: 50%; color: #ffffff; font-size: 12px; font-weight: 600;">1</span>
                        </td>
                        <td>
                          <p style="margin: 0; font-size: 15px; font-weight: 600; color: #ffffff;">Login to your dashboard</p>
                          <p style="margin: 4px 0 0 0; font-size: 13px; color: #a1a1aa;">
                            <a href="${loginUrl}" style="color: #3b82f6; text-decoration: none;">lastr.app/login</a>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr><td style="height: 8px;"></td></tr>

                <!-- Step 2 -->
                <tr>
                  <td style="padding: 12px 16px; background-color: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="32" valign="top">
                          <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; background-color: #3b82f6; border-radius: 50%; color: #ffffff; font-size: 12px; font-weight: 600;">2</span>
                        </td>
                        <td>
                          <p style="margin: 0; font-size: 15px; font-weight: 600; color: #ffffff;">Join our Discord server</p>
                          <p style="margin: 4px 0 0 0; font-size: 13px; color: #a1a1aa;">You'll be invited to join from the platform</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr><td style="height: 8px;"></td></tr>

                <!-- Step 3 -->
                <tr>
                  <td style="padding: 12px 16px; background-color: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="32" valign="top">
                          <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; background-color: #8b5cf6; border-radius: 50%; color: #ffffff; font-size: 12px; font-weight: 600;">3</span>
                        </td>
                        <td>
                          <p style="margin: 0; font-size: 15px; font-weight: 600; color: #ffffff;">Set up your accounts</p>
                          <p style="margin: 4px 0 0 0; font-size: 13px; color: #a1a1aa;">Create your TikTok/Instagram accounts for this partnership</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>

              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 16px 0;">

              <!-- CTA -->
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #a1a1aa;">
                We'll meet you on Discord and help you get properly onboarded from there!
              </p>

              <!-- Login Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 12px 0;">
                    <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; font-size: 18px; font-weight: 700; text-decoration: none; padding: 14px 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);">
                      Login to Dashboard →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Not interested note -->
              <p style="margin: 12px 0 0 0; font-size: 14px; line-height: 1.6; color: #71717a; text-align: center;">
                If you're no longer interested, no worries at all — just ignore this email.
              </p>

              <!-- Help note -->
              <p style="margin: 16px 0 0 0; font-size: 14px; line-height: 1.6; color: #a1a1aa; text-align: center;">
                Got questions? Just reply to this email or ping us on Discord. We're here to help!
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 16px 10px;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #71717a;">
                You're receiving this email because you signed up for the Lastr Creator Program.
              </p>
              <p style="margin: 0; font-size: 13px; color: #52525b;">
                © ${new Date().getFullYear()} Lastr. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Lastr <contact@lastr.app>',
        to: [to],
        subject: `Still interested in earning with Lastr, ${firstName}?`,
        html: emailHtml,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Resend error:', data)
      throw new Error(data.message || 'Failed to send email')
    }

    console.log(`✅ Follow-up email sent to ${to}`)

    return new Response(
      JSON.stringify({ success: true, messageId: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Error sending follow-up email:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
