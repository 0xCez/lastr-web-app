import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// The Odds API Configuration
const ODDS_API_KEY = Deno.env.get('ODDS_API_KEY') || 'c47264a2786aad2554daec3a87b1ce2a'
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4'

// Sport keys for The Odds API
const SPORT_KEYS: Record<string, string> = {
  NBA: 'basketball_nba',
  NFL: 'americanfootball_nfl',
}

// Player prop markets by league
const PROP_MARKETS: Record<string, string[]> = {
  NBA: ['player_points', 'player_rebounds', 'player_assists', 'player_threes'],
  NFL: ['player_pass_tds', 'player_pass_yds', 'player_rush_yds', 'player_receptions'],
}

// Friendly names for prop types
const PROP_DISPLAY_NAMES: Record<string, string> = {
  player_points: 'Points',
  player_rebounds: 'Rebounds',
  player_assists: 'Assists',
  player_threes: '3-Pointers',
  player_pass_tds: 'Pass TDs',
  player_pass_yds: 'Pass Yards',
  player_rush_yds: 'Rush Yards',
  player_receptions: 'Receptions',
}

// NBA Teams for mapping
const NBA_TEAMS = [
  { id: 1, name: "Atlanta Hawks", code: "ATL" },
  { id: 2, name: "Boston Celtics", code: "BOS" },
  { id: 4, name: "Brooklyn Nets", code: "BKN" },
  { id: 5, name: "Charlotte Hornets", code: "CHA" },
  { id: 6, name: "Chicago Bulls", code: "CHI" },
  { id: 7, name: "Cleveland Cavaliers", code: "CLE" },
  { id: 8, name: "Dallas Mavericks", code: "DAL" },
  { id: 9, name: "Denver Nuggets", code: "DEN" },
  { id: 10, name: "Detroit Pistons", code: "DET" },
  { id: 11, name: "Golden State Warriors", code: "GSW" },
  { id: 14, name: "Houston Rockets", code: "HOU" },
  { id: 15, name: "Indiana Pacers", code: "IND" },
  { id: 16, name: "LA Clippers", code: "LAC" },
  { id: 17, name: "Los Angeles Lakers", code: "LAL" },
  { id: 19, name: "Memphis Grizzlies", code: "MEM" },
  { id: 20, name: "Miami Heat", code: "MIA" },
  { id: 21, name: "Milwaukee Bucks", code: "MIL" },
  { id: 22, name: "Minnesota Timberwolves", code: "MIN" },
  { id: 23, name: "New Orleans Pelicans", code: "NOP" },
  { id: 24, name: "New York Knicks", code: "NYK" },
  { id: 25, name: "Oklahoma City Thunder", code: "OKC" },
  { id: 26, name: "Orlando Magic", code: "ORL" },
  { id: 27, name: "Philadelphia 76ers", code: "PHI" },
  { id: 28, name: "Phoenix Suns", code: "PHX" },
  { id: 29, name: "Portland Trail Blazers", code: "POR" },
  { id: 30, name: "Sacramento Kings", code: "SAC" },
  { id: 31, name: "San Antonio Spurs", code: "SAS" },
  { id: 38, name: "Toronto Raptors", code: "TOR" },
  { id: 40, name: "Utah Jazz", code: "UTA" },
  { id: 41, name: "Washington Wizards", code: "WAS" },
]

// NFL Teams
const NFL_TEAMS = [
  { name: "Las Vegas Raiders", code: "LV" },
  { name: "Jacksonville Jaguars", code: "JAX" },
  { name: "New England Patriots", code: "NE" },
  { name: "New York Giants", code: "NYG" },
  { name: "Baltimore Ravens", code: "BAL" },
  { name: "Tennessee Titans", code: "TEN" },
  { name: "Detroit Lions", code: "DET" },
  { name: "Atlanta Falcons", code: "ATL" },
  { name: "Cleveland Browns", code: "CLE" },
  { name: "Cincinnati Bengals", code: "CIN" },
  { name: "Arizona Cardinals", code: "ARI" },
  { name: "Philadelphia Eagles", code: "PHI" },
  { name: "New York Jets", code: "NYJ" },
  { name: "San Francisco 49ers", code: "SF" },
  { name: "Green Bay Packers", code: "GB" },
  { name: "Chicago Bears", code: "CHI" },
  { name: "Kansas City Chiefs", code: "KC" },
  { name: "Washington Commanders", code: "WAS" },
  { name: "Carolina Panthers", code: "CAR" },
  { name: "Buffalo Bills", code: "BUF" },
  { name: "Indianapolis Colts", code: "IND" },
  { name: "Pittsburgh Steelers", code: "PIT" },
  { name: "Seattle Seahawks", code: "SEA" },
  { name: "Tampa Bay Buccaneers", code: "TB" },
  { name: "Miami Dolphins", code: "MIA" },
  { name: "Houston Texans", code: "HOU" },
  { name: "New Orleans Saints", code: "NO" },
  { name: "Denver Broncos", code: "DEN" },
  { name: "Dallas Cowboys", code: "DAL" },
  { name: "Los Angeles Chargers", code: "LAC" },
  { name: "Los Angeles Rams", code: "LAR" },
  { name: "Minnesota Vikings", code: "MIN" },
]

// ============================================
// HOOKS - Engaging, quiz-style hooks
// ============================================
const PLAYER_PROPS_HOOKS = [
  // Quiz/Challenge Style
  "Can you guess these lines?",
  "Think you know these props?",
  "Over or under? Test yourself.",
  "Bet you can't get all 4 right.",
  "How well do you know these players?",
  "Vegas set these lines. Do you agree?",
  "Sharp or square? Prove it.",
  "The books think they know. Do you?",

  // Engagement/Challenge
  "Comment your picks before swiping.",
  "Lock in your answers first.",
  "Don't swipe until you guess.",
  "Screenshot your picks. Let's see who's sharp.",
  "Make your picks. No peeking.",
  "Gut check time. What do you think?",

  // FOMO/Intrigue
  "These lines are moving fast.",
  "The sharps are all over these.",
  "One of these is way off.",
  "Vegas might have messed up here.",
  "These props are generating buzz.",
  "The market is split on these.",

  // Direct/Confident
  "Today's player props. Let's go.",
  "Know your lines. Know your edge.",
  "The props you need to see.",
  "Here's what the books are saying.",
]

// ============================================
// CTA TEXTS - Subtle, engaging, FOMO-inducing
// ============================================
const CTA_TEXTS = [
  // Value-focused
  "Get all player props analyzed on Bet.AI",
  "Bet.AI breaks down every line. Free.",
  "See which props are mispriced → Bet.AI",
  "Sharp analysis on every prop. Bet.AI",

  // FOMO-inducing
  "Sharps use Bet.AI. Now you can too.",
  "Don't bet blind. Use Bet.AI.",
  "The edge you're missing → Bet.AI",
  "Winners research first. Bet.AI",

  // Social proof
  "Join 10,000+ using Bet.AI for props",
  "Top bettors trust Bet.AI. You should too.",
  "Why guess when Bet.AI knows?",

  // Action-oriented
  "Download Bet.AI. Beat the books.",
  "Your props research starts at Bet.AI",
  "Bet.AI - Where sharps get their edge",
]

// ============================================
// TYPES
// ============================================
interface PlayerProp {
  playerName: string
  propType: string
  propDisplayName: string
  line: number
  overOdds: number
  underOdds: number
  team: string
  teamCode: string
  matchup: string // e.g., "vs Lakers" or "@ Celtics"
}

interface SlideData {
  screenNumber: number
  imagePath: string
  textOverlay: string[]
  isHook?: boolean
  isCTA?: boolean
  isProp?: boolean
  propData?: {
    playerName: string
    propType: string
    line: number
    matchup: string
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function getRandomHook(): string {
  return PLAYER_PROPS_HOOKS[Math.floor(Math.random() * PLAYER_PROPS_HOOKS.length)]
}

function getRandomCTA(): string {
  return CTA_TEXTS[Math.floor(Math.random() * CTA_TEXTS.length)]
}

function getRandomBetAIImage(): string {
  const imageIndex = Math.floor(Math.random() * 6) + 1
  return `/images/bet-apps/apps/betai/${imageIndex}.jpg`
}

// Hook images pool - randomly pick one for variety
const HOOK_IMAGE_COUNT = 62
function getRandomHookImage(): string {
  const imageIndex = Math.floor(Math.random() * HOOK_IMAGE_COUNT) + 1
  return `/images/hooks/${imageIndex}.jpeg`
}

// Get team code from full team name
function getTeamCodeFromName(teamName: string, league: string): string {
  const teams = league === 'NBA' ? NBA_TEAMS : NFL_TEAMS

  // Try exact match first
  const exactMatch = teams.find(t => t.name === teamName)
  if (exactMatch) return exactMatch.code

  // Try partial match (team name contains the search or vice versa)
  const partialMatch = teams.find(t =>
    teamName.includes(t.name) || t.name.includes(teamName) ||
    teamName.toLowerCase().includes(t.code.toLowerCase())
  )
  if (partialMatch) return partialMatch.code

  // Extract city/name and try matching
  const words = teamName.split(' ')
  for (const word of words) {
    const match = teams.find(t =>
      t.name.toLowerCase().includes(word.toLowerCase()) ||
      t.code.toLowerCase() === word.toLowerCase()
    )
    if (match) return match.code
  }

  return teamName.substring(0, 3).toUpperCase()
}

// Convert American odds to implied probability display
function formatOdds(americanOdds: number): string {
  if (americanOdds >= 0) {
    return `+${americanOdds}`
  }
  return `${americanOdds}`
}

// Convert decimal odds to American odds
function decimalToAmerican(decimal: number): number {
  if (decimal >= 2) {
    return Math.round((decimal - 1) * 100)
  } else {
    return Math.round(-100 / (decimal - 1))
  }
}

// NBA player name corrections for image paths
const NBA_PLAYER_NAME_MAP: Record<string, string> = {
  "A.J. Green": "aj_green",
  "C.J. McCollum": "cj_mccollum",
  "D.J. Carton": "dj_carton",
  "De'Aaron Fox": "de_aaron_fox",
  "De'Andre Hunter": "de_andre_hunter",
  "O.G. Anunoby": "og_anunoby",
  "P.J. Washington": "pj_washington",
  "R.J. Barrett": "rj_barrett",
  "T.J. McConnell": "tj_mcconnell",
}

// Set of all players who have images (for validation)
const NBA_PLAYERS_WITH_IMAGES = new Set([
  // BKN
  "amari_bailey", "ben_saraf", "ben_simmons", "cam_thomas", "cameron_johnson", "chaney_johnson", "danny_wolf", "dariq_whitehead", "day_ron_sharpe", "dayron_sharpe", "dennis_schroder", "dorian_finney_smith", "drake_powell", "egor_demin", "ej_liddell", "haywood_highsmith", "jalen_wilson", "jaylen_martin", "keon_johnson", "maxwell_lewis", "michael_porter_jr", "nic_claxton", "noah_clowney", "nolan_traore", "reece_beekman", "shake_milton", "terance_mann", "trendon_watford", "tyrese_martin", "tyson_etienne", "yongxi_cui", "ziaire_williams",
  // BOS
  "al_horford", "amari_williams", "anfernee_simons", "anton_watson", "baylor_scheierman", "chris_boucher", "derrick_white", "drew_peterson", "jaden_springer", "jaylen_brown", "jayson_tatum", "jd_davison", "jordan_walsh", "josh_minott", "jrue_holiday", "kristaps_porzingis", "lonnie_walker_iv", "luka_garza", "luke_kornet", "max_shulga", "neemias_queta", "payton_pritchard", "ron_harper_jr", "sam_hauser", "xavier_tillman",
  // CHA
  "antonio_reeves", "brandon_miller", "cody_martin", "collin_sexton", "grant_williams", "josh_green", "kj_simpson", "keyontae_johnson", "kon_knueppel", "lamelo_ball", "liam_mcneeley", "mason_plumlee", "miles_bridges", "moussa_diabate", "nick_richards", "pat_connaughton", "pj_hall", "ryan_kalkbrenner", "seth_curry", "taj_gibson", "tidjane_salaun", "tre_mann", "vasilije_micic",
  // CHI
  "adama_sanogo", "ayo_dosunmu", "chris_duarte", "coby_white", "dalen_terry", "dj_steward", "emanuel_miller", "isaac_okoro", "jalen_smith", "jevon_carter", "josh_giddey", "julian_phillips", "kevin_huerter", "lonzo_ball", "matas_buzelis", "nikola_vucevic", "patrick_williams", "talen_horton_tucker", "torrey_craig", "tre_jones", "yuki_kawamura", "zach_collins", "zach_lavine",
  // CLE
  "caris_levert", "chris_livingston", "craig_porter_jr", "darius_garland", "dean_wade", "deandre_hunter", "donovan_mitchell", "evan_mobley", "georges_niang", "jarrett_allen", "jaylon_tyson", "jt_thor", "larry_nance_jr", "luke_travers", "max_strus", "pete_nance", "sam_merrill", "thomas_bryant", "tristan_thompson", "ty_jerome", "tyrese_proctor",
  // DAL
  "brandon_williams", "caleb_martin", "cooper_flagg", "daniel_gafford", "dante_exum", "dereck_lively_ii", "dwight_powell", "jaden_hardy", "kessler_edwards", "klay_thompson", "kyrie_irving", "luka_doncic", "maxi_kleber", "naji_marshall", "pj_washington", "quentin_grimes", "spencer_dinwiddie",
  // DEN
  "aaron_gordon", "bruce_brown", "charles_bediako", "christian_braun", "dario_saric", "daron_holmes_ii", "hunter_tyson", "jalen_pickett", "jamal_murray", "jonas_valanciunas", "julian_strawther", "michael_porter_jr", "nikola_jokic", "peyton_watson", "russell_westbrook", "tim_hardaway_jr", "trey_alexander", "zeke_nnaji",
  // DET
  "ausar_thompson", "cade_cunningham", "cole_swider", "duncan_robinson", "isaiah_stewart", "jaden_ivey", "jalen_duren", "javonte_green", "lamar_stevens", "malik_beasley", "marcus_sasser", "paul_reed", "ronald_holland_ii", "simone_fontecchio", "tobias_harris",
  // GSW
  "andrew_wiggins", "brandin_podziemski", "buddy_hield", "draymond_green", "gary_payton_ii", "gui_santos", "jimmy_butler", "jonathan_kuminga", "kevon_looney", "kyle_anderson", "moses_moody", "quinten_post", "seth_curry", "stephen_curry", "trayce_jackson_davis",
  // HOU
  "aaron_holiday", "alperen_sengun", "amen_thompson", "cam_whitmore", "clint_capela", "dillon_brooks", "fred_vanvleet", "jabari_smith_jr", "jalen_green", "jeff_green", "jock_landale", "josh_okogie", "kevin_durant", "reed_sheppard", "steven_adams", "tari_eason",
  // IND
  "aaron_nesmith", "andrew_nembhard", "ben_sheppard", "bennedict_mathurin", "isaiah_jackson", "james_wiseman", "jarace_walker", "johnny_furphy", "kendall_brown", "moses_brown", "myles_turner", "obi_toppin", "pascal_siakam", "tj_mcconnell", "tyrese_haliburton",
  // LAC
  "amir_coffey", "bones_hyland", "bradley_beal", "brook_lopez", "chris_paul", "derrick_jones_jr", "ivica_zubac", "james_harden", "john_collins", "jordan_miller", "kai_jones", "kawhi_leonard", "kris_dunn", "nicolas_batum", "norman_powell", "terance_mann",
  // LAL
  "anthony_davis", "austin_reaves", "bronny_james", "cam_reddish", "christian_koloko", "dalton_knecht", "deandre_ayton", "dorian_finney_smith", "drew_timme", "gabe_vincent", "jalen_hood_schifino", "jarred_vanderbilt", "jaxson_hayes", "lebron_james", "max_christie", "rui_hachimura",
  // MEM
  "brandon_clarke", "desmond_bane", "gg_jackson", "ja_morant", "jake_laravia", "jaren_jackson_jr", "jaylen_wells", "john_konchar", "kentavious_caldwell_pope", "luke_kennard", "marcus_smart", "santi_aldama", "scotty_pippen_jr", "vince_williams_jr", "zach_edey",
  // MIA
  "bam_adebayo", "duncan_robinson", "haywood_highsmith", "jaime_jaquez_jr", "jimmy_butler", "kelel_ware", "kevin_love", "nikola_jovic", "terry_rozier", "tyler_herro",
  // MIL
  "aj_green", "bobby_portis", "brook_lopez", "damian_lillard", "gary_trent_jr", "giannis_antetokounmpo", "kyle_kuzma", "marjon_beauchamp", "myles_turner", "pat_connaughton", "taurean_prince",
  // MIN
  "anthony_edwards", "donte_divincenzo", "jaden_mcdaniels", "joe_ingles", "josh_minott", "julius_randle", "mike_conley", "naz_reid", "rob_dillingham", "rudy_gobert", "terrence_shannon_jr",
  // NOP
  "brandon_ingram", "cj_mccollum", "dejounte_murray", "herbert_jones", "jordan_hawkins", "jose_alvarado", "trey_murphy_iii", "yves_missi", "zion_williamson",
  // NYK
  "cameron_payne", "jalen_brunson", "josh_hart", "karl_anthony_towns", "mikal_bridges", "miles_mcbride", "mitchell_robinson", "og_anunoby", "precious_achiuwa", "tyler_kolek",
  // OKC
  "aaron_wiggins", "alex_caruso", "cason_wallace", "chet_holmgren", "isaiah_hartenstein", "isaiah_joe", "jalen_williams", "jaylin_williams", "luguentz_dort", "shai_gilgeous_alexander",
  // ORL
  "anthony_black", "cole_anthony", "franz_wagner", "goga_bitadze", "jalen_suggs", "jett_howard", "jonathan_isaac", "kentavious_caldwell_pope", "moritz_wagner", "paolo_banchero", "tristan_da_silva", "wendell_carter_jr",
  // PHI
  "andre_drummond", "caleb_martin", "eric_gordon", "jared_mccain", "joel_embiid", "kelly_oubre_jr", "kyle_lowry", "paul_george", "quentin_grimes", "tyrese_maxey",
  // PHX
  "bol_bol", "bradley_beal", "devin_booker", "grayson_allen", "josh_okogie", "jusuf_nurkic", "kevin_durant", "monte_morris", "royce_oneale", "ryan_dunn",
  // POR
  "anfernee_simons", "deni_avdija", "donovan_clingan", "jerami_grant", "kris_murray", "matisse_thybulle", "rayan_rupert", "scoot_henderson", "shaedon_sharpe", "toumani_camara",
  // SAC
  "de_aaron_fox", "demar_derozan", "devin_carter", "domantas_sabonis", "keegan_murray", "keon_ellis", "kevin_huerter", "malik_monk", "trey_lyles",
  // SAS
  "chris_paul", "devin_vassell", "harrison_barnes", "jeremy_sochan", "julian_champagnie", "keldon_johnson", "stephon_castle", "tre_jones", "victor_wembanyama", "zach_collins",
  // TOR
  "chris_boucher", "gradey_dick", "immanuel_quickley", "jakob_poeltl", "jamal_shead", "ochai_agbaji", "rj_barrett", "scottie_barnes",
  // UTA
  "brice_sensabaugh", "cody_williams", "collin_sexton", "isaiah_collier", "john_collins", "jordan_clarkson", "keyonte_george", "kyle_filipowski", "lauri_markkanen", "taylor_hendricks", "walker_kessler",
  // WAS
  "alex_sarr", "bilal_coulibaly", "bub_carrington", "corey_kispert", "jordan_poole", "kyle_kuzma", "malcolm_brogdon", "trae_young",
])

// Check if we have an image for this player
function hasPlayerImage(playerName: string): boolean {
  const normalized = normalizePlayerNameForImage(playerName)
  return NBA_PLAYERS_WITH_IMAGES.has(normalized)
}

// Current team for each player (normalized name -> team code)
// This maps players to their CURRENT team for correct image paths
const CURRENT_TEAM_MAP: Record<string, string> = {
  // ATL Hawks
  "trae_young": "ATL", "dejounte_murray": "ATL", "jalen_johnson": "ATL", "de_andre_hunter": "ATL", "clint_capela": "ATL", "bogdan_bogdanovic": "ATL", "onyeka_okongwu": "ATL", "dylan_windler": "ATL", "garrison_mathews": "ATL", "vit_krejci": "ATL", "mouhamed_gueye": "ATL", "seth_lundy": "ATL", "david_roddy": "ATL",
  // BOS Celtics
  "jayson_tatum": "BOS", "jaylen_brown": "BOS", "derrick_white": "BOS", "jrue_holiday": "BOS", "kristaps_porzingis": "BOS", "al_horford": "BOS", "payton_pritchard": "BOS", "sam_hauser": "BOS", "luke_kornet": "BOS", "xavier_tillman": "BOS", "neemias_queta": "BOS", "jd_davison": "BOS", "jordan_walsh": "BOS", "baylor_scheierman": "BOS",
  // BKN Nets
  "cam_thomas": "BKN", "ben_simmons": "BKN", "nic_claxton": "BKN", "cameron_johnson": "BKN", "dennis_schroder": "BKN", "dorian_finney_smith": "BKN", "day_ron_sharpe": "BKN", "noah_clowney": "BKN", "trendon_watford": "BKN", "ziaire_williams": "BKN", "dariq_whitehead": "BKN", "jalen_wilson": "BKN",
  // CHA Hornets
  "lamelo_ball": "CHA", "brandon_miller": "CHA", "miles_bridges": "CHA", "mark_williams": "CHA", "nick_richards": "CHA", "tre_mann": "CHA", "seth_curry": "CHA", "cody_martin": "CHA", "grant_williams": "CHA", "josh_green": "CHA", "vasilije_micic": "CHA", "tidjane_salaun": "CHA", "kj_simpson": "CHA",
  // CHI Bulls
  "zach_lavine": "CHI", "coby_white": "CHI", "nikola_vucevic": "CHI", "josh_giddey": "CHI", "patrick_williams": "CHI", "ayo_dosunmu": "CHI", "torrey_craig": "CHI", "lonzo_ball": "CHI", "jalen_smith": "CHI", "jevon_carter": "CHI", "dalen_terry": "CHI", "julian_phillips": "CHI", "matas_buzelis": "CHI",
  // CLE Cavaliers
  "donovan_mitchell": "CLE", "darius_garland": "CLE", "evan_mobley": "CLE", "jarrett_allen": "CLE", "max_strus": "CLE", "caris_levert": "CLE", "dean_wade": "CLE", "georges_niang": "CLE", "isaac_okoro": "CLE", "ty_jerome": "CLE", "sam_merrill": "CLE", "craig_porter_jr": "CLE",
  // DAL Mavericks
  "luka_doncic": "DAL", "kyrie_irving": "DAL", "pj_washington": "DAL", "daniel_gafford": "DAL", "klay_thompson": "DAL", "dereck_lively_ii": "DAL", "naji_marshall": "DAL", "quentin_grimes": "DAL", "maxi_kleber": "DAL", "jaden_hardy": "DAL", "dwight_powell": "DAL", "dante_exum": "DAL", "spencer_dinwiddie": "DAL", "caleb_martin": "DAL",
  // DEN Nuggets
  "nikola_jokic": "DEN", "jamal_murray": "DEN", "michael_porter_jr": "DEN", "aaron_gordon": "DEN", "christian_braun": "DEN", "russell_westbrook": "DEN", "peyton_watson": "DEN", "julian_strawther": "DEN", "zeke_nnaji": "DEN", "dario_saric": "DEN", "hunter_tyson": "DEN", "daron_holmes_ii": "DEN",
  // DET Pistons
  "cade_cunningham": "DET", "jaden_ivey": "DET", "ausar_thompson": "DET", "jalen_duren": "DET", "tobias_harris": "DET", "malik_beasley": "DET", "simone_fontecchio": "DET", "isaiah_stewart": "DET", "marcus_sasser": "DET", "ronald_holland_ii": "DET", "tim_hardaway_jr": "DET",
  // GSW Warriors
  "stephen_curry": "GSW", "draymond_green": "GSW", "andrew_wiggins": "GSW", "jonathan_kuminga": "GSW", "brandin_podziemski": "GSW", "kevon_looney": "GSW", "moses_moody": "GSW", "buddy_hield": "GSW", "gary_payton_ii": "GSW", "trayce_jackson_davis": "GSW", "gui_santos": "GSW", "kyle_anderson": "GSW", "quinten_post": "GSW", "jimmy_butler": "GSW",
  // HOU Rockets
  "jalen_green": "HOU", "alperen_sengun": "HOU", "fred_vanvleet": "HOU", "jabari_smith_jr": "HOU", "dillon_brooks": "HOU", "amen_thompson": "HOU", "tari_eason": "HOU", "cam_whitmore": "HOU", "jeff_green": "HOU", "steven_adams": "HOU", "reed_sheppard": "HOU", "jock_landale": "HOU",
  // IND Pacers
  "tyrese_haliburton": "IND", "pascal_siakam": "IND", "myles_turner": "IND", "bennedict_mathurin": "IND", "andrew_nembhard": "IND", "aaron_nesmith": "IND", "obi_toppin": "IND", "tj_mcconnell": "IND", "isaiah_jackson": "IND", "ben_sheppard": "IND", "jarace_walker": "IND", "james_wiseman": "IND",
  // LAC Clippers
  "james_harden": "LAC", "kawhi_leonard": "LAC", "norman_powell": "LAC", "ivica_zubac": "LAC", "terance_mann": "LAC", "amir_coffey": "LAC", "bones_hyland": "LAC", "derrick_jones_jr": "LAC", "nicolas_batum": "LAC", "kris_dunn": "LAC", "jordan_miller": "LAC",
  // LAL Lakers
  "lebron_james": "LAL", "anthony_davis": "LAL", "austin_reaves": "LAL", "rui_hachimura": "LAL", "d_angelo_russell": "LAL", "gabe_vincent": "LAL", "max_christie": "LAL", "jarred_vanderbilt": "LAL", "dalton_knecht": "LAL", "jaxson_hayes": "LAL", "bronny_james": "LAL", "cam_reddish": "LAL", "christian_koloko": "LAL",
  // MEM Grizzlies
  "ja_morant": "MEM", "desmond_bane": "MEM", "jaren_jackson_jr": "MEM", "marcus_smart": "MEM", "santi_aldama": "MEM", "luke_kennard": "MEM", "brandon_clarke": "MEM", "vince_williams_jr": "MEM", "gg_jackson": "MEM", "jake_laravia": "MEM", "scotty_pippen_jr": "MEM", "zach_edey": "MEM", "jaylen_wells": "MEM",
  // MIA Heat
  "jimmy_butler": "MIA", "bam_adebayo": "MIA", "tyler_herro": "MIA", "terry_rozier": "MIA", "jaime_jaquez_jr": "MIA", "duncan_robinson": "MIA", "nikola_jovic": "MIA", "haywood_highsmith": "MIA", "kevin_love": "MIA", "kelel_ware": "MIA",
  // MIL Bucks
  "giannis_antetokounmpo": "MIL", "damian_lillard": "MIL", "brook_lopez": "MIL", "bobby_portis": "MIL", "gary_trent_jr": "MIL", "pat_connaughton": "MIL", "aj_green": "MIL", "marjon_beauchamp": "MIL", "taurean_prince": "MIL", "andre_jackson_jr": "MIL",
  // MIN Timberwolves
  "anthony_edwards": "MIN", "julius_randle": "MIN", "rudy_gobert": "MIN", "jaden_mcdaniels": "MIN", "mike_conley": "MIN", "naz_reid": "MIN", "donte_divincenzo": "MIN", "nickeil_alexander_walker": "MIN", "rob_dillingham": "MIN", "joe_ingles": "MIN", "terrence_shannon_jr": "MIN",
  // NOP Pelicans
  "zion_williamson": "NOP", "brandon_ingram": "NOP", "cj_mccollum": "NOP", "herbert_jones": "NOP", "trey_murphy_iii": "NOP", "jose_alvarado": "NOP", "jordan_hawkins": "NOP", "yves_missi": "NOP", "daniel_theis": "NOP",
  // NYK Knicks
  "jalen_brunson": "NYK", "mikal_bridges": "NYK", "karl_anthony_towns": "NYK", "og_anunoby": "NYK", "josh_hart": "NYK", "miles_mcbride": "NYK", "mitchell_robinson": "NYK", "precious_achiuwa": "NYK", "cameron_payne": "NYK", "tyler_kolek": "NYK",
  // OKC Thunder
  "shai_gilgeous_alexander": "OKC", "chet_holmgren": "OKC", "jalen_williams": "OKC", "luguentz_dort": "OKC", "alex_caruso": "OKC", "isaiah_hartenstein": "OKC", "cason_wallace": "OKC", "isaiah_joe": "OKC", "aaron_wiggins": "OKC", "jaylin_williams": "OKC",
  // ORL Magic
  "paolo_banchero": "ORL", "franz_wagner": "ORL", "jalen_suggs": "ORL", "wendell_carter_jr": "ORL", "kentavious_caldwell_pope": "ORL", "moritz_wagner": "ORL", "cole_anthony": "ORL", "jonathan_isaac": "ORL", "goga_bitadze": "ORL", "anthony_black": "ORL", "jett_howard": "ORL", "tristan_da_silva": "ORL",
  // PHI 76ers
  "joel_embiid": "PHI", "tyrese_maxey": "PHI", "paul_george": "PHI", "kelly_oubre_jr": "PHI", "kyle_lowry": "PHI", "andre_drummond": "PHI", "eric_gordon": "PHI", "jared_mccain": "PHI", "caleb_martin": "PHI",
  // PHX Suns
  "kevin_durant": "PHX", "devin_booker": "PHX", "bradley_beal": "PHX", "jusuf_nurkic": "PHX", "grayson_allen": "PHX", "royce_oneale": "PHX", "josh_okogie": "PHX", "bol_bol": "PHX", "monte_morris": "PHX", "ryan_dunn": "PHX",
  // POR Trail Blazers
  "anfernee_simons": "POR", "scoot_henderson": "POR", "shaedon_sharpe": "POR", "jerami_grant": "POR", "deni_avdija": "POR", "donovan_clingan": "POR", "toumani_camara": "POR", "matisse_thybulle": "POR", "rayan_rupert": "POR", "kris_murray": "POR",
  // SAC Kings
  "de_aaron_fox": "SAC", "domantas_sabonis": "SAC", "demar_derozan": "SAC", "keegan_murray": "SAC", "malik_monk": "SAC", "kevin_huerter": "SAC", "keon_ellis": "SAC", "trey_lyles": "SAC", "devin_carter": "SAC",
  // SAS Spurs
  "victor_wembanyama": "SAS", "devin_vassell": "SAS", "keldon_johnson": "SAS", "jeremy_sochan": "SAS", "tre_jones": "SAS", "zach_collins": "SAS", "harrison_barnes": "SAS", "chris_paul": "SAS", "julian_champagnie": "SAS", "stephon_castle": "SAS",
  // TOR Raptors
  "scottie_barnes": "TOR", "rj_barrett": "TOR", "immanuel_quickley": "TOR", "jakob_poeltl": "TOR", "gradey_dick": "TOR", "ochai_agbaji": "TOR", "chris_boucher": "TOR", "kelly_olynyk": "TOR", "jamal_shead": "TOR",
  // UTA Jazz
  "lauri_markkanen": "UTA", "jordan_clarkson": "UTA", "john_collins": "UTA", "collin_sexton": "UTA", "walker_kessler": "UTA", "keyonte_george": "UTA", "taylor_hendricks": "UTA", "brice_sensabaugh": "UTA", "cody_williams": "UTA", "isaiah_collier": "UTA", "kyle_filipowski": "UTA",
  // WAS Wizards
  "jordan_poole": "WAS", "kyle_kuzma": "WAS", "bilal_coulibaly": "WAS", "alex_sarr": "WAS", "corey_kispert": "WAS", "malcolm_brogdon": "WAS", "bub_carrington": "WAS", "jonas_valanciunas": "WAS",
}

function normalizePlayerNameForImage(playerName: string): string {
  if (NBA_PLAYER_NAME_MAP[playerName]) {
    return NBA_PLAYER_NAME_MAP[playerName]
  }
  let normalized = playerName
    .replace(/([A-Z])\.?\s*([A-Z])\.\s/g, '$1$2 ')
    .replace(/([A-Z])\.([A-Z])\./g, '$1$2')
    .replace(/([A-Z])\.\s/g, '$1 ')
  return normalized.toLowerCase().replace(/[^a-z0-9]/g, '_')
}

// Generate caption for the slideshow
function generateCaption(league: string): string {
  const captions = [
    `${league} Player Props Quiz - Can you beat the books?`,
    `Today's ${league} props - Over or Under?`,
    `${league} lines that have the sharps talking`,
    `Test your ${league} knowledge - Guess these props`,
  ]
  const caption = captions[Math.floor(Math.random() * captions.length)]

  const hashtags = league === 'NBA'
    ? '#NBA #NBAPicks #PlayerProps #BetAI #SportsBetting #NBABetting'
    : '#NFL #NFLPicks #PlayerProps #BetAI #SportsBetting #NFLBetting'

  return `${caption}\n\n${hashtags}`
}

// ============================================
// API FUNCTIONS
// ============================================
async function getUpcomingEvents(sportKey: string): Promise<any[]> {
  try {
    const url = `${ODDS_API_BASE}/sports/${sportKey}/events?apiKey=${ODDS_API_KEY}`
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Events API error: ${response.status}`)
      return []
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching events:', error)
    return []
  }
}

async function getPlayerProps(sportKey: string, eventId: string, markets: string[]): Promise<any> {
  try {
    const marketsParam = markets.join(',')
    const url = `${ODDS_API_BASE}/sports/${sportKey}/events/${eventId}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=${marketsParam}&bookmakers=draftkings,fanduel`
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Props API error: ${response.status}`)
      return null
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching props:', error)
    return null
  }
}

// ============================================
// MAIN LOGIC
// ============================================
async function fetchAndProcessProps(league: string, teamCode?: string): Promise<PlayerProp[]> {
  const sportKey = SPORT_KEYS[league]
  const markets = PROP_MARKETS[league]

  if (!sportKey || !markets) {
    throw new Error(`Unsupported league: ${league}`)
  }

  // Get upcoming events
  const events = await getUpcomingEvents(sportKey)
  if (!events.length) {
    throw new Error(`No upcoming ${league} games found`)
  }

  console.log(`Found ${events.length} upcoming ${league} events`)

  // Filter by team if specified
  let targetEvents = events
  if (teamCode) {
    const teamName = (league === 'NBA' ? NBA_TEAMS : NFL_TEAMS)
      .find(t => t.code.toLowerCase() === teamCode.toLowerCase())?.name || teamCode

    targetEvents = events.filter((e: any) =>
      e.home_team.toLowerCase().includes(teamCode.toLowerCase()) ||
      e.away_team.toLowerCase().includes(teamCode.toLowerCase()) ||
      e.home_team.includes(teamName) ||
      e.away_team.includes(teamName)
    )

    if (!targetEvents.length) {
      // Fall back to all events if team not found
      console.log(`Team ${teamCode} not found in events, using all events`)
      targetEvents = events
    }
  }

  // Get props for first few events (limit API calls)
  const allProps: PlayerProp[] = []
  const eventsToFetch = targetEvents.slice(0, 3)

  for (const event of eventsToFetch) {
    console.log(`Fetching props for: ${event.away_team} @ ${event.home_team}`)

    const propsData = await getPlayerProps(sportKey, event.id, markets)
    if (!propsData?.bookmakers?.length) continue

    // Process bookmaker data (prefer DraftKings, fallback to FanDuel)
    const bookmaker = propsData.bookmakers.find((b: any) => b.key === 'draftkings')
      || propsData.bookmakers[0]

    if (!bookmaker?.markets?.length) continue

    for (const market of bookmaker.markets) {
      const propType = market.key
      const propDisplayName = PROP_DISPLAY_NAMES[propType] || propType

      // Group outcomes by player (Over/Under pairs)
      const playerOutcomes: Record<string, { over?: any; under?: any }> = {}

      for (const outcome of market.outcomes) {
        const playerName = outcome.description
        if (!playerOutcomes[playerName]) {
          playerOutcomes[playerName] = {}
        }
        if (outcome.name === 'Over') {
          playerOutcomes[playerName].over = outcome
        } else if (outcome.name === 'Under') {
          playerOutcomes[playerName].under = outcome
        }
      }

      // Create props for players with both over and under
      for (const [playerName, outcomes] of Object.entries(playerOutcomes)) {
        if (outcomes.over && outcomes.under) {
          // Get team codes for both teams in the matchup
          const homeTeamCode = getTeamCodeFromName(event.home_team, league)
          const awayTeamCode = getTeamCodeFromName(event.away_team, league)
          const normalizedName = normalizePlayerNameForImage(playerName)

          // Check if player has an image (validation)
          if (!hasPlayerImage(playerName)) {
            console.log(`Skipping ${playerName} - no image found`)
            continue
          }

          // Try to find which team this player is on by checking our known roster
          // We'll use the CURRENT_TEAM_MAP which maps normalized names to their current team
          const knownTeam = CURRENT_TEAM_MAP[normalizedName]

          let playerTeamCode: string
          let playerTeam: string
          let opponent: string
          let matchup: string

          if (knownTeam) {
            // We know this player's team
            playerTeamCode = knownTeam
            if (homeTeamCode === knownTeam) {
              playerTeam = event.home_team
              opponent = event.away_team
              matchup = `vs ${opponent}`
            } else {
              playerTeam = event.away_team
              opponent = event.home_team
              matchup = `@ ${opponent}`
            }
          } else {
            // Fallback - skip unknown players
            console.log(`Skipping ${playerName} - team unknown`)
            continue
          }

          allProps.push({
            playerName,
            propType,
            propDisplayName,
            line: outcomes.over.point,
            overOdds: decimalToAmerican(outcomes.over.price),
            underOdds: decimalToAmerican(outcomes.under.price),
            team: playerTeam,
            teamCode: playerTeamCode,
            matchup,
          })
        }
      }
    }
  }

  console.log(`Processed ${allProps.length} total props (with images)`)
  return allProps
}

// Select diverse props for slides (different players, different prop types)
function selectPropsForSlides(allProps: PlayerProp[], count: number = 4): PlayerProp[] {
  if (allProps.length <= count) return allProps

  const selected: PlayerProp[] = []
  const usedPlayers = new Set<string>()
  const usedPropTypes = new Set<string>()

  // Shuffle props
  const shuffled = [...allProps].sort(() => Math.random() - 0.5)

  // First pass: try to get diverse prop types
  for (const prop of shuffled) {
    if (selected.length >= count) break
    if (usedPlayers.has(prop.playerName)) continue
    if (usedPropTypes.has(prop.propType) && selected.length < count - 1) continue

    selected.push(prop)
    usedPlayers.add(prop.playerName)
    usedPropTypes.add(prop.propType)
  }

  // Second pass: fill remaining slots
  for (const prop of shuffled) {
    if (selected.length >= count) break
    if (usedPlayers.has(prop.playerName)) continue

    selected.push(prop)
    usedPlayers.add(prop.playerName)
  }

  return selected
}

// ============================================
// MAIN SERVER
// ============================================
serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  try {
    const { league = 'NBA', teamCode } = await req.json()

    console.log(`Generating Player Props slideshow for ${league}${teamCode ? ` (team: ${teamCode})` : ''}`)

    // Validate league
    if (!['NBA', 'NFL'].includes(league)) {
      return new Response(JSON.stringify({ error: 'Unsupported league. Use NBA or NFL.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // Fetch and process props
    const allProps = await fetchAndProcessProps(league, teamCode)

    if (allProps.length === 0) {
      return new Response(JSON.stringify({ error: 'No player props available for upcoming games.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // Select 4 diverse props for slides
    const selectedProps = selectPropsForSlides(allProps, 4)

    console.log(`Selected ${selectedProps.length} props for slides`)

    // Build slides
    const slides: SlideData[] = [
      // Slide 1: Hook
      {
        screenNumber: 1,
        isHook: true,
        textOverlay: [getRandomHook()],
        imagePath: getRandomHookImage(),
      },
    ]

    // Slides 2-5: Player props
    for (let i = 0; i < selectedProps.length; i++) {
      const prop = selectedProps[i]

      // Build image path for player
      const playerImagePath = league === 'NBA'
        ? `/images/nba-players/${prop.teamCode.toLowerCase()}/${normalizePlayerNameForImage(prop.playerName)}.png`
        : `/images/nfl-players/${prop.teamCode.toLowerCase()}/${normalizePlayerNameForImage(prop.playerName)}.png`

      slides.push({
        screenNumber: i + 2,
        isProp: true,
        imagePath: playerImagePath,
        textOverlay: [
          prop.playerName,
          `${prop.propDisplayName}: O/U ${prop.line}`,
          prop.matchup,
        ],
        propData: {
          playerName: prop.playerName,
          propType: prop.propDisplayName,
          line: prop.line,
          matchup: prop.matchup,
        },
      })
    }

    // Final slide: CTA
    slides.push({
      screenNumber: slides.length + 1,
      isCTA: true,
      textOverlay: [getRandomCTA()],
      imagePath: getRandomBetAIImage(),
    })

    // Generate response
    const result = {
      format: 'player-props',
      league,
      teamCode: teamCode || null,
      slides,
      caption: generateCaption(league),
      propsCount: selectedProps.length,
      generatedAt: new Date().toISOString(),
    }

    console.log(`Generated ${slides.length} slides for Player Props`)

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })

  } catch (error: any) {
    console.error('Generation error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
