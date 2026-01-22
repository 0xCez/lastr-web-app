import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PasswordResetRequest {
  email: string
  redirectTo: string
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
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase credentials not configured')
    }

    const { email, redirectTo }: PasswordResetRequest = await req.json()

    if (!email) {
      throw new Error('Email is required')
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Generate the password reset link using Supabase admin API
    const { data, error: generateError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectTo || 'https://www.lastr.app/reset-password'
      }
    })

    if (generateError) {
      console.error('Generate link error:', generateError)
      // Don't reveal if user exists or not for security
      // Still return success to prevent email enumeration
      return new Response(
        JSON.stringify({ success: true, message: 'If an account exists, a reset email will be sent.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!data?.properties?.action_link) {
      throw new Error('Failed to generate reset link')
    }

    const resetLink = data.properties.action_link

    // Get user's name if available
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('full_name')
      .eq('email', email)
      .single()

    const firstName = userData?.full_name?.split(' ')[0] || 'there'

    // Send email via Resend
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Lastr</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <img src="https://www.lastr.app/images/logo.png" alt="Lastr Logo" width="60" height="60" style="display: block; margin: 0 auto 16px auto;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">
                Lastr
              </h1>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; border: 1px solid rgba(34, 197, 94, 0.2); padding: 40px;">

              <!-- Reset Message -->
              <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: #ffffff;">
                Reset Your Password
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #a1a1aa;">
                Hey ${firstName}, we received a request to reset your password. Click the button below to choose a new password.
              </p>

              <!-- Reset Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry Notice -->
              <p style="margin: 24px 0 0 0; font-size: 14px; color: #71717a; text-align: center;">
                This link will expire in 1 hour for security reasons.
              </p>

              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 30px 0;">

              <!-- Security Notice -->
              <p style="margin: 0; font-size: 13px; color: #71717a; line-height: 1.5;">
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 30px 20px;">
              <p style="margin: 0; font-size: 13px; color: #52525b;">
                &copy; ${new Date().getFullYear()} Lastr. All rights reserved.
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

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Lastr <contact@lastr.app>',
        to: [email],
        subject: 'Reset Your Password - Lastr',
        html: emailHtml,
      }),
    })

    const resendData = await res.json()

    if (!res.ok) {
      console.error('Resend error:', resendData)
      throw new Error(resendData.message || 'Failed to send email')
    }

    console.log(`Password reset email sent to ${email}`)

    return new Response(
      JSON.stringify({ success: true, message: 'Password reset email sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Password reset error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
