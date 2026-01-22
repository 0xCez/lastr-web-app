/**
 * API-Sports.io Service
 * Documentation: https://api-sports.io/
 * Pro subscription for NFL and Soccer
 */

const API_KEY = '77fea40da4ce95b70120be298555b660';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

/**
 * Helper function to retry API calls with exponential backoff
 */
async function fetchWithRetry(
  url: string,
  headers: Record<string, string>,
  retries = MAX_RETRIES
): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, { headers });

      // If rate limited (429) or server error (5xx), retry
      if (response.status === 429 || response.status >= 500) {
        if (attempt === retries) {
          throw new Error(`API error after ${retries} attempts: ${response.status}`);
        }

        const delay = RETRY_DELAY * attempt; // Exponential backoff
        console.log(`Attempt ${attempt} failed with status ${response.status}, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // If successful or client error (4xx except 429), return
      return response;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }

      const delay = RETRY_DELAY * attempt;
      console.log(`Attempt ${attempt} failed with error, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Failed after all retry attempts');
}

// League configurations
export const LEAGUES = {
  // Soccer leagues
  EPL: { id: '39', name: 'Premier League', sport: 'Soccer', season: '2025' },
  LaLiga: { id: '140', name: 'La Liga', sport: 'Soccer', season: '2025' },
  Bundesliga: { id: '78', name: 'Bundesliga', sport: 'Soccer', season: '2025' },
  SerieA: { id: '135', name: 'Serie A', sport: 'Soccer', season: '2025' },
  UCL: { id: '2', name: 'Champions League', sport: 'Soccer', season: '2025' },

  // American Football
  NFL: { id: '1', name: 'NFL', sport: 'NFL', season: '2025' },

  // Basketball
  NBA: { name: 'NBA', sport: 'NBA' },
} as const;

// Soccer API response interfaces
interface SoccerFixture {
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    timezone: string;
    venue: {
      name: string | null;
      city: string | null;
    };
    status: {
      short: string;
      long: string;
    };
  };
  league: {
    id: number;
    name: string;
    season: number;
  };
  teams: {
    home: {
      id: number;
      name: string;
    };
    away: {
      id: number;
      name: string;
    };
  };
}

interface SoccerResponse {
  response: SoccerFixture[];
}

// NFL API response interfaces
interface NFLGame {
  game: {
    id: number;
    date: {
      date: string;
      time: string;
      timestamp: number;
    };
    venue: {
      name: string | null;
      city: string | null;
    };
    status: {
      short: string;
      long: string;
    };
  };
  league: {
    id: number;
    name: string;
    season: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
    };
    away: {
      id: number;
      name: string;
    };
  };
}

interface NFLResponse {
  response: NFLGame[];
}

// NBA API response interfaces
interface NBAGame {
  id: number;
  date: {
    start: string;
    end: string | null;
    duration: string | null;
  };
  teams: {
    home: {
      id: number;
      name: string;
    };
    visitors: {
      id: number;
      name: string;
    };
  };
  arena: {
    name: string | null;
    city: string | null;
  };
  status: {
    long: string;
    short: number;
    clock: string | null;
    halftime: boolean;
  };
}

interface NBAResponse {
  response: NBAGame[];
}

/**
 * Fetch soccer fixtures for a league
 */
async function getSoccerFixtures(leagueId: string, season: string, fromDate: string, toDate: string): Promise<SoccerFixture[]> {
  try {
    const url = `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${season}&from=${fromDate}&to=${toDate}`;

    const response = await fetchWithRetry(url, {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': 'v3.football.api-sports.io'
    });

    if (!response.ok) {
      throw new Error(`Soccer API error: ${response.status}`);
    }

    const data: SoccerResponse = await response.json();
    return data.response || [];
  } catch (error) {
    console.error(`Error fetching soccer fixtures for league ${leagueId}:`, error);
    return [];
  }
}

/**
 * Fetch NFL games
 */
async function getNFLGames(season: string, fromDate: string, toDate: string): Promise<NFLGame[]> {
  try {
    // NFL API doesn't support date ranges, so we need to fetch per date
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const allGames: NFLGame[] = [];

    // Iterate through each date in the range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];

      const url = `https://v1.american-football.api-sports.io/games?league=1&season=${season}&date=${dateStr}`;

      try {
        const response = await fetchWithRetry(url, {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': 'v1.american-football.api-sports.io'
        });

        if (!response.ok) {
          console.error(`NFL API error for ${dateStr}: ${response.status}`);
          continue;
        }

        const data: NFLResponse = await response.json();
        if (data.response && data.response.length > 0) {
          allGames.push(...data.response);
        }
      } catch (error) {
        console.error(`Error fetching NFL games for ${dateStr}:`, error);
        // Continue to next date even if this one fails
        continue;
      }

      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return allGames;
  } catch (error) {
    console.error('Error fetching NFL games:', error);
    return [];
  }
}

/**
 * Fetch NBA games
 */
async function getNBAGames(fromDate: string, toDate: string): Promise<NBAGame[]> {
  try {
    // NBA API doesn't support date ranges, fetch per date
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const allGames: NBAGame[] = [];

    // Iterate through each date in the range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];

      const url = `https://v2.nba.api-sports.io/games?date=${dateStr}`;

      try {
        const response = await fetchWithRetry(url, {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': 'v2.nba.api-sports.io'
        });

        if (!response.ok) {
          console.error(`NBA API error for ${dateStr}: ${response.status}`);
          continue;
        }

        const data: NBAResponse = await response.json();
        if (data.response && data.response.length > 0) {
          allGames.push(...data.response);
        }
      } catch (error) {
        console.error(`Error fetching NBA games for ${dateStr}:`, error);
        // Continue to next date even if this one fails
        continue;
      }

      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return allGames;
  } catch (error) {
    console.error('Error fetching NBA games:', error);
    return [];
  }
}

/**
 * Fetch all upcoming games across all leagues
 */
export async function getAllUpcomingGames(daysAhead = 14): Promise<any[]> {
  const allEvents: any[] = [];

  // Calculate date range
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today

  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + daysAhead);

  const fromDate = today.toISOString().split('T')[0];
  const toDate = futureDate.toISOString().split('T')[0];

  console.log(`Fetching events from ${fromDate} to ${toDate}...`);

  // Fetch Soccer fixtures
  const soccerLeagues = [
    LEAGUES.EPL,
    LEAGUES.LaLiga,
    LEAGUES.Bundesliga,
    LEAGUES.SerieA,
    LEAGUES.UCL,
  ];

  for (const league of soccerLeagues) {
    console.log(`Fetching ${league.name}...`);
    const fixtures = await getSoccerFixtures(league.id, league.season, fromDate, toDate);

    // Transform soccer fixtures to common format
    const transformedFixtures = fixtures.map(fixture => ({
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
    }));

    allEvents.push(...transformedFixtures);
    console.log(`  Found ${transformedFixtures.length} fixtures`);

    // Rate limit delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Fetch NFL games
  console.log(`Fetching ${LEAGUES.NFL.name}...`);
  const nflGames = await getNFLGames(LEAGUES.NFL.season, fromDate, toDate);

  // Transform NFL games to common format
  const transformedNFL = nflGames.map(game => {
    // Combine date and time for event_date
    const eventDateTime = new Date(`${game.game.date.date}T${game.game.date.time || '00:00:00'}`);

    return {
      event_id: `nfl-${game.game.id}`,
      league_name: LEAGUES.NFL.name,
      league_id: LEAGUES.NFL.id,
      event_name: `${game.teams.home.name} vs ${game.teams.away.name}`,
      home_team: game.teams.home.name,
      away_team: game.teams.away.name,
      sport: LEAGUES.NFL.sport,
      event_date: eventDateTime.toISOString(),
      event_timestamp: game.game.date.timestamp,
      venue: game.game.venue.name,
      venue_city: game.game.venue.city,
      status: game.game.status.short.toLowerCase(),
    };
  });

  allEvents.push(...transformedNFL);
  console.log(`  Found ${transformedNFL.length} games`);

  // Fetch NBA games
  console.log(`Fetching ${LEAGUES.NBA.name}...`);
  const nbaGames = await getNBAGames(fromDate, toDate);

  // Transform NBA games to common format
  const transformedNBA = nbaGames.map(game => {
    const eventDateTime = new Date(game.date.start);

    return {
      event_id: `nba-${game.id}`,
      league_name: LEAGUES.NBA.name,
      league_id: 'nba',
      event_name: `${game.teams.home.name} vs ${game.teams.visitors.name}`,
      home_team: game.teams.home.name,
      away_team: game.teams.visitors.name,
      sport: LEAGUES.NBA.sport,
      event_date: eventDateTime.toISOString(),
      event_timestamp: Math.floor(eventDateTime.getTime() / 1000),
      venue: game.arena.name,
      venue_city: game.arena.city,
      status: game.status.long.toLowerCase(),
    };
  });

  allEvents.push(...transformedNBA);
  console.log(`  Found ${transformedNBA.length} games`);

  return allEvents;
}

/**
 * Transform event (already transformed in getAllUpcomingGames)
 */
export function transformEvent(event: any) {
  return event;
}
