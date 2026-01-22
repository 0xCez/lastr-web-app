/**
 * Send Account Manager recruitment email
 * Run with: npx tsx scripts/send-am-recruitment-email.ts
 */

import { config } from 'dotenv';

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

function getEmailHtml(firstName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; font-size: 16px; line-height: 1.6;">

<p>Hey ${firstName},</p>

<p>Found your profile and thought this might be a good fit.</p>

<p>We're hiring people to post sports betting slideshows on TikTok and Instagram using our automated slideshow generator. You just click a button on our website and it generates everything - images, captions, audio. Then you download and post.</p>

<p><strong>How it works:</strong></p>
<ul>
  <li>1 account pair (1 TikTok + 1 Instagram) = $200-250/month - 1 pair is 10-15 mins work per day!</li>
  <li>2 account pairs = $400-500/month</li>
  <li>2 phones running 2 pairs each = up to $1,000/month</li>
</ul>

<p>No editing, no creativity, no filming - just copy-paste. Do it whenever and wherever you want. No posting requirements either - post as little or as much as you want.</p>

<p>Only requirement: Based in US, UK, Canada, or Germany.</p>

<p>All info on this link: <a href="https://www.betaiapp.com/account-managers">www.betaiapp.com/account-managers</a> (click on View Full Details)</p>

<p>If you are ready to start, please click on Get Started and fill the form!</p>

<table cellpadding="0" cellspacing="0" style="margin-top: 24px;">
  <tr>
    <td style="vertical-align: top; padding-right: 12px;">
      <img src="https://www.betaiapp.com/icons/apple-touch-icon.png" alt="Bet.AI" width="50" height="50" style="border-radius: 10px;">
    </td>
    <td style="vertical-align: middle;">
      <strong style="font-size: 15px;">Emerson</strong><br>
      <span style="color: #666; font-size: 13px;">Ops Manager @ Bet.AI</span><br>
      <a href="https://apps.apple.com/us/app/bet-ai-betting-assistant/id6743808717" style="display: inline-block; margin-top: 6px; text-decoration: none;">
        <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on the App Store" height="28">
      </a>
    </td>
  </tr>
</table>

</body>
</html>
`;
}

async function sendEmail(to: string, firstName: string): Promise<boolean> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-am-recruitment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      to,
      subject: `${firstName}, remote side gig - $250 to $1,000/mo`,
      html: getEmailHtml(firstName)
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Error:', error);
  }
  return response.ok;
}

async function main() {
  const testEmail = process.argv[2] || 'cesar@betaiapp.com';
  const testName = process.argv[3] || 'Cesar';

  console.log(`\n📧 Sending test email to ${testName} <${testEmail}>...\n`);

  const success = await sendEmail(testEmail, testName);

  if (success) {
    console.log(`✅ Email sent to ${testEmail}`);
  } else {
    console.log(`❌ Failed to send email to ${testEmail}`);
  }
}

main().catch(console.error);
