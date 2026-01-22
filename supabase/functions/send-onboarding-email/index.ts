import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OnboardingEmailRequest {
  to: string
  fullName: string
  loginUrl: string
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

    const { to, fullName, loginUrl }: OnboardingEmailRequest = await req.json()

    if (!to || !fullName || !loginUrl) {
      throw new Error('Missing required fields: to, fullName, loginUrl')
    }

    const firstName = fullName.split(' ')[0]

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Lastr Creator Program</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <img src="https://www.lastr.app/images/logo.png" alt="Lastr Logo" width="80" height="80" style="display: block; margin: 0 auto 16px auto;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">
                Lastr <span style="color: #22c55e;">Creator Program</span>
              </h1>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; border: 1px solid rgba(34, 197, 94, 0.2); padding: 40px;">

              <!-- Welcome Message -->
              <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #ffffff;">
                Welcome aboard, ${firstName}! 🎉
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #a1a1aa;">
                Great news - your application has been <span style="color: #22c55e; font-weight: 600;">approved</span>!
                You're now officially part of the Lastr Creator Program.
              </p>

              <!-- Login Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                      Login to Your Dashboard →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 30px 0;">

              <!-- Checklist Header -->
              <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #ffffff;">
                📋 Your First Week Checklist
              </h3>

              <!-- Checklist Items -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">

                <!-- Item 1: Connect Discord -->
                <tr>
                  <td style="padding: 12px 16px; background-color: rgba(34, 197, 94, 0.1); border-radius: 8px; margin-bottom: 8px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="32" valign="top">
                          <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; background-color: #22c55e; border-radius: 50%; color: #ffffff; font-size: 12px; font-weight: 600;">1</span>
                        </td>
                        <td>
                          <p style="margin: 0; font-size: 15px; font-weight: 600; color: #ffffff;">Connect Discord from your Dashboard</p>
                          <p style="margin: 4px 0 0 0; font-size: 13px; color: #a1a1aa;">Click "Connect Discord" in your checklist to join our community and get your private support channel</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr><td style="height: 8px;"></td></tr>

                <!-- Item 2: Warm Up -->
                <tr>
                  <td style="padding: 12px 16px; background-color: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="32" valign="top">
                          <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; background-color: #3b82f6; border-radius: 50%; color: #ffffff; font-size: 12px; font-weight: 600;">2</span>
                        </td>
                        <td>
                          <p style="margin: 0; font-size: 15px; font-weight: 600; color: #ffffff;">Warm up your account (5 days)</p>
                          <p style="margin: 4px 0 0 0; font-size: 13px; color: #a1a1aa;">Post regular regular content to establish your account before posting promotional content</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr><td style="height: 8px;"></td></tr>

                <!-- Item 3: Content Guide -->
                <tr>
                  <td style="padding: 12px 16px; background-color: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="32" valign="top">
                          <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; background-color: #8b5cf6; border-radius: 50%; color: #ffffff; font-size: 12px; font-weight: 600;">3</span>
                        </td>
                        <td>
                          <p style="margin: 0; font-size: 15px; font-weight: 600; color: #ffffff;">Read the Content Guide</p>
                          <p style="margin: 4px 0 0 0; font-size: 13px; color: #a1a1aa;">Learn the proven format that's working for our top creators</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr><td style="height: 8px;"></td></tr>

                <!-- Item 4: Post Video -->
                <tr>
                  <td style="padding: 12px 16px; background-color: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="32" valign="top">
                          <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; background-color: #f59e0b; border-radius: 50%; color: #ffffff; font-size: 12px; font-weight: 600;">4</span>
                        </td>
                        <td>
                          <p style="margin: 0; font-size: 15px; font-weight: 600; color: #ffffff;">Post your first Lastr video</p>
                          <p style="margin: 4px 0 0 0; font-size: 13px; color: #a1a1aa;">Create and publish your first promotional video following our guide</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr><td style="height: 8px;"></td></tr>

                <!-- Item 5: Submit Link -->
                <tr>
                  <td style="padding: 12px 16px; background-color: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="32" valign="top">
                          <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; background-color: #ec4899; border-radius: 50%; color: #ffffff; font-size: 12px; font-weight: 600;">5</span>
                        </td>
                        <td>
                          <p style="margin: 0; font-size: 15px; font-weight: 600; color: #ffffff;">Submit your video link</p>
                          <p style="margin: 4px 0 0 0; font-size: 13px; color: #a1a1aa;">Submit the link through your dashboard so we can track your analytics and pay you</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>

              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 30px 0;">

              <!-- Earnings Reminder -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%); border-radius: 12px; padding: 20px; border: 1px solid rgba(34, 197, 94, 0.2);">
                    <p style="margin: 0; font-size: 15px; color: #ffffff; text-align: center;">
                      💰 <strong>Get your first $1k this month!</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Quick Links -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    <p style="margin: 0; font-size: 14px; color: #a1a1aa;">
                      <a href="${loginUrl}" style="color: #22c55e; text-decoration: none; font-weight: 500;">Go to Dashboard →</a>
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 30px 20px;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #71717a;">
                You're receiving this email because you applied to the Lastr Creator Program.
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
        subject: `Welcome to Lastr, ${firstName}! Your application is approved 🎉`,
        html: emailHtml,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Resend error:', data)
      throw new Error(data.message || 'Failed to send email')
    }

    console.log(`✅ Onboarding email sent to ${to}`)

    return new Response(
      JSON.stringify({ success: true, messageId: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Error sending onboarding email:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
