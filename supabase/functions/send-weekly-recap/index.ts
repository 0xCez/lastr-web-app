import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const ADMIN_EMAIL = 'cesar@lastr.app'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WeeklyRecapData {
  weekStart: string
  weekEnd: string
  totalPosts: number
  totalViews: number
  postsGrowth: number
  viewsGrowth: number
  viralPosts: {
    url: string
    views: number
    platform: string
    creator_name: string
  }[]
  topCreators: {
    name: string
    posts_count: number
    total_views: number
  }[]
  platformBreakdown: {
    platform: string
    posts: number
    views: number
  }[]
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toLocaleString()
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getGrowthColor = (growth: number): string => {
  return growth >= 0 ? '#22c55e' : '#ef4444'
}

const getGrowthArrow = (growth: number): string => {
  return growth >= 0 ? '↑' : '↓'
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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Calculate week ranges (Friday to Thursday)
    const now = new Date()
    const currentDay = now.getDay()
    const daysSinceLastFriday = (currentDay + 2) % 7

    // Last week (weeksAgo = 1)
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - daysSinceLastFriday - 7)
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    // Previous week for comparison (weeksAgo = 2)
    const prevWeekStart = new Date(weekStart)
    prevWeekStart.setDate(prevWeekStart.getDate() - 7)

    const prevWeekEnd = new Date(prevWeekStart)
    prevWeekEnd.setDate(prevWeekStart.getDate() + 6)
    prevWeekEnd.setHours(23, 59, 59, 999)

    console.log(`Fetching recap for week: ${weekStart.toISOString()} to ${weekEnd.toISOString()}`)

    // Fetch posts from last week with latest analytics
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select(`
        id,
        url,
        platform,
        created_at,
        submitted_by,
        users!posts_submitted_by_fkey (full_name),
        latest_analytics (views)
      `)
      .gte('created_at', weekStart.toISOString())
      .lte('created_at', weekEnd.toISOString())
      .eq('status', 'approved')

    if (postsError) throw postsError

    // Fetch posts from previous week for comparison
    const { data: prevWeekPosts, error: prevError } = await supabase
      .from('posts')
      .select(`
        id,
        latest_analytics (views)
      `)
      .gte('created_at', prevWeekStart.toISOString())
      .lte('created_at', prevWeekEnd.toISOString())
      .eq('status', 'approved')

    if (prevError) throw prevError

    const posts = (postsData || []) as any[]
    const prevPosts = (prevWeekPosts || []) as any[]

    // Helper to get views from latest_analytics
    const getViews = (post: any): number => {
      const analytics = post.latest_analytics
      if (Array.isArray(analytics) && analytics.length > 0) {
        return analytics[0]?.views || 0
      }
      return analytics?.views || 0
    }

    // Calculate totals
    const totalPosts = posts.length
    const totalViews = posts.reduce((sum, p) => sum + getViews(p), 0)
    const prevTotalPosts = prevPosts.length
    const prevTotalViews = prevPosts.reduce((sum, p) => sum + getViews(p), 0)

    // Calculate growth percentages
    const postsGrowth = prevTotalPosts > 0
      ? ((totalPosts - prevTotalPosts) / prevTotalPosts) * 100
      : totalPosts > 0 ? 100 : 0
    const viewsGrowth = prevTotalViews > 0
      ? ((totalViews - prevTotalViews) / prevTotalViews) * 100
      : totalViews > 0 ? 100 : 0

    // Get viral posts (top 10 by views, minimum 10k views)
    const viralPosts = posts
      .map(p => ({ ...p, views: getViews(p) }))
      .filter(p => p.views >= 10000)
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)
      .map(p => ({
        url: p.url,
        views: p.views,
        platform: p.platform,
        creator_name: p.users?.full_name || 'Unknown',
      }))

    // Aggregate by creator
    const creatorStats = new Map<string, {
      name: string
      posts_count: number
      total_views: number
    }>()

    posts.forEach(p => {
      const creatorId = p.submitted_by
      const existing = creatorStats.get(creatorId)
      const views = getViews(p)

      if (existing) {
        existing.posts_count += 1
        existing.total_views += views
      } else {
        creatorStats.set(creatorId, {
          name: p.users?.full_name || 'Unknown',
          posts_count: 1,
          total_views: views,
        })
      }
    })

    // Top 5 creators by views
    const topCreators = Array.from(creatorStats.values())
      .sort((a, b) => b.total_views - a.total_views)
      .slice(0, 5)

    // Platform breakdown
    const platformMap = new Map<string, { posts: number; views: number }>()
    posts.forEach(p => {
      const platform = p.platform || 'unknown'
      const views = getViews(p)
      const existing = platformMap.get(platform)
      if (existing) {
        existing.posts += 1
        existing.views += views
      } else {
        platformMap.set(platform, { posts: 1, views })
      }
    })

    const platformBreakdown = Array.from(platformMap.entries())
      .map(([platform, stats]) => ({ platform, ...stats }))
      .sort((a, b) => b.views - a.views)

    const recapData: WeeklyRecapData = {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      totalPosts,
      totalViews,
      postsGrowth,
      viewsGrowth,
      viralPosts,
      topCreators,
      platformBreakdown,
    }

    // Generate email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Recap - Lastr Creator Program</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">
                Lastr <span style="color: #22c55e;">Weekly Recap</span>
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #a1a1aa;">
                ${formatDate(recapData.weekStart)} - ${formatDate(recapData.weekEnd)}, ${new Date(recapData.weekEnd).getFullYear()}
              </p>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; border: 1px solid rgba(34, 197, 94, 0.2); padding: 32px;">

              <!-- Key Stats -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td width="50%" style="padding: 16px; background-color: rgba(255, 255, 255, 0.05); border-radius: 12px;">
                    <p style="margin: 0 0 4px 0; font-size: 13px; color: #a1a1aa;">Total Posts</p>
                    <p style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">${recapData.totalPosts}</p>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: ${getGrowthColor(recapData.postsGrowth)};">
                      ${getGrowthArrow(recapData.postsGrowth)} ${Math.abs(recapData.postsGrowth).toFixed(0)}% vs last week
                    </p>
                  </td>
                  <td width="8"></td>
                  <td width="50%" style="padding: 16px; background-color: rgba(255, 255, 255, 0.05); border-radius: 12px;">
                    <p style="margin: 0 0 4px 0; font-size: 13px; color: #a1a1aa;">Total Views</p>
                    <p style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">${formatNumber(recapData.totalViews)}</p>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: ${getGrowthColor(recapData.viewsGrowth)};">
                      ${getGrowthArrow(recapData.viewsGrowth)} ${Math.abs(recapData.viewsGrowth).toFixed(0)}% vs last week
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Top Creators -->
              ${topCreators.length > 0 ? `
              <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #ffffff;">
                🏆 Top Creators This Week
              </h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                ${topCreators.map((creator, index) => `
                <tr>
                  <td style="padding: 10px 12px; background-color: ${index === 0 ? 'rgba(234, 179, 8, 0.1)' : 'rgba(255, 255, 255, 0.03)'}; border-radius: 8px; ${index > 0 ? 'margin-top: 4px;' : ''}">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="28">
                          <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; background-color: ${index === 0 ? '#eab308' : index === 1 ? '#9ca3af' : index === 2 ? '#f97316' : '#374151'}; border-radius: 50%; color: ${index < 3 ? '#000000' : '#ffffff'}; font-size: 11px; font-weight: 700;">${index + 1}</span>
                        </td>
                        <td>
                          <span style="font-size: 14px; font-weight: 500; color: #ffffff;">${creator.name}</span>
                          <span style="font-size: 12px; color: #71717a; margin-left: 8px;">${creator.posts_count} posts</span>
                        </td>
                        <td align="right">
                          <span style="font-size: 14px; font-weight: 600; color: #22c55e;">${formatNumber(creator.total_views)}</span>
                          <span style="font-size: 11px; color: #71717a;"> views</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${index < topCreators.length - 1 ? '<tr><td style="height: 4px;"></td></tr>' : ''}
                `).join('')}
              </table>
              ` : ''}

              <!-- Viral Posts -->
              ${viralPosts.length > 0 ? `
              <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #ffffff;">
                🔥 Viral Posts (10K+ views)
              </h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                ${viralPosts.slice(0, 5).map((post, index) => `
                <tr>
                  <td style="padding: 10px 12px; background-color: rgba(34, 197, 94, 0.05); border-radius: 8px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="28">
                          <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; background-color: rgba(34, 197, 94, 0.2); border-radius: 50%; color: #22c55e; font-size: 11px; font-weight: 700;">${index + 1}</span>
                        </td>
                        <td>
                          <span style="font-size: 14px; font-weight: 500; color: #ffffff;">${post.creator_name}</span>
                          <span style="font-size: 12px; color: #71717a; margin-left: 8px; text-transform: capitalize;">${post.platform}</span>
                        </td>
                        <td align="right">
                          <span style="font-size: 14px; font-weight: 600; color: #22c55e;">${formatNumber(post.views)}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${index < Math.min(viralPosts.length, 5) - 1 ? '<tr><td style="height: 4px;"></td></tr>' : ''}
                `).join('')}
              </table>
              ` : ''}

              <!-- Platform Breakdown -->
              ${platformBreakdown.length > 0 ? `
              <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #ffffff;">
                📊 Platform Breakdown
              </h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  ${platformBreakdown.map(platform => `
                  <td style="padding: 12px; background-color: rgba(255, 255, 255, 0.05); border-radius: 8px; text-align: center;">
                    <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #ffffff; text-transform: capitalize;">${platform.platform}</p>
                    <p style="margin: 0; font-size: 12px; color: #a1a1aa;">${platform.posts} posts</p>
                    <p style="margin: 2px 0 0 0; font-size: 12px; color: #22c55e;">${formatNumber(platform.views)} views</p>
                  </td>
                  `).join('<td width="8"></td>')}
                </tr>
              </table>
              ` : ''}

              <!-- CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="https://www.lastr.app/dashboard" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px;">
                      View Full Dashboard →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 30px 20px;">
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
        to: [ADMIN_EMAIL],
        subject: `Weekly Recap: ${formatNumber(totalViews)} views, ${totalPosts} posts (${formatDate(recapData.weekStart)} - ${formatDate(recapData.weekEnd)})`,
        html: emailHtml,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Resend error:', data)
      throw new Error(data.message || 'Failed to send email')
    }

    console.log(`✅ Weekly recap email sent to ${ADMIN_EMAIL}`)

    return new Response(
      JSON.stringify({ success: true, messageId: data.id, recap: recapData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Error sending weekly recap email:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
