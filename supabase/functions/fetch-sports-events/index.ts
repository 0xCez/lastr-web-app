import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const LEAGUES = {
  EPL: { id: '39', name: 'Premier League', sport: 'Soccer', season: '2025' },
  LaLiga: { id: '140', name: 'La Liga', sport: 'Soccer', season: '2025' },
  Bundesliga: { id: '78', name: 'Bundesliga', sport: 'Soccer', season: '2025' },
  SerieA: { id: '135', name: 'Serie A', sport: 'Soccer', season: '2025' },
  UCL: { id: '2', name: 'Champions League', sport: 'Soccer', season: '2025' },
  NFL: { id: '1', name: 'NFL', sport: 'NFL', season: '2025' },
  NBA: { name: 'NBA', sport: 'NBA' },
}

const MAX_RETRIES = 3
const RETRY_DELAY = 2000

async function fetchWithRetry(url: string, headers: Record<string, string>, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, { headers })

      if (response.status === 429 || response.status >= 500) {
        if (attempt === retries) throw new Error(`API error: ${response.status}`)
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt))
        continue
      }

      return response
    } catch (error) {
      if (attempt === retries) throw error
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt))
    }
  }
  throw new Error('Failed after all retry attempts')
}

serve(async (req) => {
  try {
    const API_KEY = Deno.env.get('API_SPORTS_KEY')!
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    console.log('🏈 Fetching sports events...')
    const allEvents: any[] = []

    // Date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const futureDate = new Date(today)
    futureDate.setDate(today.getDate() + 14)
    const fromDate = today.toISOString().split('T')[0]
    const toDate = futureDate.toISOString().split('T')[0]

    console.log(`Fetching from ${fromDate} to ${toDate}`)

    // Fetch Soccer
    const soccerLeagues = [LEAGUES.EPL, LEAGUES.LaLiga, LEAGUES.Bundesliga, LEAGUES.SerieA, LEAGUES.UCL]

    for (const league of soccerLeagues) {
      console.log(`Fetching ${league.name}...`)
      const url = `https://v3.football.api-sports.io/fixtures?league=${league.id}&season=${league.season}&from=${fromDate}&to=${toDate}`

      const response = await fetchWithRetry(url, {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io'
      })

      if (response.ok) {
        const data = await response.json()
        const fixtures = data.response || []

        const transformed = fixtures.map((fixture: any) => ({
          event_id: `soccer-${fixture.fixture.id}`,
          league_name: league.name,
          league_id: league.id,
          event_name: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
          home_team: fixture.teams.home.name,
          away_team: fixture.teams.away.name,
          sport: league.sport,
          event_date: fixture.fixture.date,
          event_timestamp: fixture.fixture.timestamp,
          venue: fixture.fixture.venue.name,
          venue_city: fixture.fixture.venue.city,
          status: fixture.fixture.status.short.toLowerCase(),
        }))

        allEvents.push(...transformed)
        console.log(`  Found ${transformed.length} fixtures`)
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Fetch NFL
    console.log('Fetching NFL...')
    for (let d = new Date(fromDate); d <= new Date(toDate); d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const url = `https://v1.american-football.api-sports.io/games?league=1&season=2025&date=${dateStr}`

      try {
        const response = await fetchWithRetry(url, {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': 'v1.american-football.api-sports.io'
        })

        if (response.ok) {
          const data = await response.json()
          const games = data.response || []

          const transformed = games.map((game: any) => {
            const eventDateTime = new Date(`${game.game.date.date}T${game.game.date.time || '00:00:00'}`)
            return {
              event_id: `nfl-${game.game.id}`,
              league_name: 'NFL',
              league_id: '1',
              event_name: `${game.teams.home.name} vs ${game.teams.away.name}`,
              home_team: game.teams.home.name,
              away_team: game.teams.away.name,
              sport: 'NFL',
              event_date: eventDateTime.toISOString(),
              event_timestamp: game.game.date.timestamp,
              venue: game.game.venue.name,
              venue_city: game.game.venue.city,
              status: game.game.status.short.toLowerCase(),
            }
          })

          allEvents.push(...transformed)
        }
      } catch (error) {
        console.error(`NFL error for ${dateStr}:`, error)
      }

      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // Fetch NBA
    console.log('Fetching NBA...')
    for (let d = new Date(fromDate); d <= new Date(toDate); d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const url = `https://v2.nba.api-sports.io/games?date=${dateStr}`

      try {
        const response = await fetchWithRetry(url, {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': 'v2.nba.api-sports.io'
        })

        if (response.ok) {
          const data = await response.json()
          const games = data.response || []

          const transformed = games.map((game: any) => {
            const eventDateTime = new Date(game.date.start)
            return {
              event_id: `nba-${game.id}`,
              league_name: 'NBA',
              league_id: 'nba',
              event_name: `${game.teams.home.name} vs ${game.teams.visitors.name}`,
              home_team: game.teams.home.name,
              away_team: game.teams.visitors.name,
              sport: 'NBA',
              event_date: eventDateTime.toISOString(),
              event_timestamp: Math.floor(eventDateTime.getTime() / 1000),
              venue: game.arena.name,
              venue_city: game.arena.city,
              status: game.status.long.toLowerCase(),
            }
          })

          allEvents.push(...transformed)
        }
      } catch (error) {
        console.error(`NBA error for ${dateStr}:`, error)
      }

      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // Deduplicate
    const uniqueEvents = Array.from(
      new Map(allEvents.map(e => [e.event_id, e])).values()
    )

    console.log(`✅ Total unique events: ${uniqueEvents.length}`)

    // Clean up old events
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    await supabase
      .from('sports_events')
      .delete()
      .lt('event_date', yesterday.toISOString())

    // Upsert events
    const { error } = await supabase
      .from('sports_events')
      .upsert(uniqueEvents, {
        onConflict: 'event_id',
        ignoreDuplicates: false,
      })

    if (error) throw error

    // Breakdown by sport
    const breakdown = uniqueEvents.reduce((acc: any, event: any) => {
      acc[event.sport] = (acc[event.sport] || 0) + 1
      return acc
    }, {})

    console.log('📊 Breakdown:', breakdown)

    return new Response(
      JSON.stringify({
        success: true,
        total: uniqueEvents.length,
        breakdown,
        message: 'Sports events updated successfully'
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error: any) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
