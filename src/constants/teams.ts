// Team data for Account Manager assignments and Slideshow Generator

export interface Team {
  code: string;
  name: string;
}

export const NFL_TEAMS: Team[] = [
  { code: "ari", name: "Arizona Cardinals" },
  { code: "atl", name: "Atlanta Falcons" },
  { code: "bal", name: "Baltimore Ravens" },
  { code: "buf", name: "Buffalo Bills" },
  { code: "car", name: "Carolina Panthers" },
  { code: "chi", name: "Chicago Bears" },
  { code: "cin", name: "Cincinnati Bengals" },
  { code: "cle", name: "Cleveland Browns" },
  { code: "dal", name: "Dallas Cowboys" },
  { code: "den", name: "Denver Broncos" },
  { code: "det", name: "Detroit Lions" },
  { code: "gb", name: "Green Bay Packers" },
  { code: "hou", name: "Houston Texans" },
  { code: "ind", name: "Indianapolis Colts" },
  { code: "jac", name: "Jacksonville Jaguars" },
  { code: "kc", name: "Kansas City Chiefs" },
  { code: "oak", name: "Las Vegas Raiders" },
  { code: "sd", name: "Los Angeles Chargers" },
  { code: "stl", name: "Los Angeles Rams" },
  { code: "mia", name: "Miami Dolphins" },
  { code: "min", name: "Minnesota Vikings" },
  { code: "ne", name: "New England Patriots" },
  { code: "no", name: "New Orleans Saints" },
  { code: "nyg", name: "New York Giants" },
  { code: "nyj", name: "New York Jets" },
  { code: "phi", name: "Philadelphia Eagles" },
  { code: "pit", name: "Pittsburgh Steelers" },
  { code: "sf", name: "San Francisco 49ers" },
  { code: "sea", name: "Seattle Seahawks" },
  { code: "tb", name: "Tampa Bay Buccaneers" },
  { code: "ten", name: "Tennessee Titans" },
  { code: "wsh", name: "Washington Commanders" },
];

export const NBA_TEAMS: Team[] = [
  { code: "ATL", name: "Atlanta Hawks" },
  { code: "BOS", name: "Boston Celtics" },
  { code: "BKN", name: "Brooklyn Nets" },
  { code: "CHA", name: "Charlotte Hornets" },
  { code: "CHI", name: "Chicago Bulls" },
  { code: "CLE", name: "Cleveland Cavaliers" },
  { code: "DAL", name: "Dallas Mavericks" },
  { code: "DEN", name: "Denver Nuggets" },
  { code: "DET", name: "Detroit Pistons" },
  { code: "GSW", name: "Golden State Warriors" },
  { code: "HOU", name: "Houston Rockets" },
  { code: "IND", name: "Indiana Pacers" },
  { code: "LAC", name: "LA Clippers" },
  { code: "LAL", name: "Los Angeles Lakers" },
  { code: "MEM", name: "Memphis Grizzlies" },
  { code: "MIA", name: "Miami Heat" },
  { code: "MIL", name: "Milwaukee Bucks" },
  { code: "MIN", name: "Minnesota Timberwolves" },
  { code: "NOP", name: "New Orleans Pelicans" },
  { code: "NYK", name: "New York Knicks" },
  { code: "OKC", name: "Oklahoma City Thunder" },
  { code: "ORL", name: "Orlando Magic" },
  { code: "PHI", name: "Philadelphia 76ers" },
  { code: "PHX", name: "Phoenix Suns" },
  { code: "POR", name: "Portland Trail Blazers" },
  { code: "SAC", name: "Sacramento Kings" },
  { code: "SAS", name: "San Antonio Spurs" },
  { code: "TOR", name: "Toronto Raptors" },
  { code: "UTA", name: "Utah Jazz" },
  { code: "WAS", name: "Washington Wizards" },
];

export const SOCCER_TEAMS: Team[] = [
  { code: "arsenal", name: "Arsenal" },
  { code: "aston_villa", name: "Aston Villa" },
  { code: "bournemouth", name: "AFC Bournemouth" },
  { code: "brentford", name: "Brentford" },
  { code: "brighton", name: "Brighton" },
  { code: "chelsea", name: "Chelsea" },
  { code: "crystal_palace", name: "Crystal Palace" },
  { code: "everton", name: "Everton" },
  { code: "fulham", name: "Fulham" },
  { code: "ipswich", name: "Ipswich Town" },
  { code: "leicester", name: "Leicester City" },
  { code: "liverpool", name: "Liverpool" },
  { code: "manchester_city", name: "Manchester City" },
  { code: "manchester_united", name: "Manchester United" },
  { code: "newcastle", name: "Newcastle" },
  { code: "nottingham_forest", name: "Nottingham Forest" },
  { code: "southampton", name: "Southampton" },
  { code: "tottenham", name: "Tottenham" },
  { code: "west_ham", name: "West Ham" },
  { code: "wolves", name: "Wolverhampton" },
];

export const LEAGUES = ["NBA", "NFL", "SOCCER"] as const;
export type League = (typeof LEAGUES)[number];

export const TEAMS_BY_LEAGUE: Record<League, Team[]> = {
  NBA: NBA_TEAMS,
  NFL: NFL_TEAMS,
  SOCCER: SOCCER_TEAMS,
};

export function getTeamByCode(league: League, code: string): Team | undefined {
  return TEAMS_BY_LEAGUE[league]?.find((t) => t.code === code);
}

export function getTeamsByLeague(league: string): Team[] {
  return TEAMS_BY_LEAGUE[league as League] || [];
}
