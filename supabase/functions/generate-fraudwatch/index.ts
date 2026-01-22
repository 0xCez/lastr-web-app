import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// API Configuration - loaded from environment variables (same as other edge functions)
const STATPAL_API_KEY = Deno.env.get('STATPAL_API_KEY')!
const STATPAL_BASE_URL = 'https://statpal.io/api/v1'
const API_SPORTS_KEY = Deno.env.get('API_SPORTS_KEY')!

// Dynamic season calculation
function getCurrentSeason(league: string): number {
  const now = new Date()
  const currentYear = now.getUTCFullYear()
  const currentMonth = now.getUTCMonth() // 0-indexed

  if (league === 'NBA') {
    // NBA season runs Oct-June, use year when season started
    // If Jan-June, season started previous year; if Oct-Dec, season started this year
    return currentMonth >= 9 ? currentYear : currentYear - 1
  } else if (league === 'SOCCER') {
    // Soccer season runs Aug-May, use year when season started
    // If Jan-May, season started previous year; if Aug-Dec, season started this year
    return currentMonth >= 7 ? currentYear : currentYear - 1
  }
  // Default fallback
  return currentYear
}

// ============================================
// TEAM DATA
// ============================================

const NFL_TEAMS = [
  { id: 1, name: "Las Vegas Raiders", code: "LV", statpalCode: "oak" },
  { id: 2, name: "Jacksonville Jaguars", code: "JAX", statpalCode: "jac" },
  { id: 3, name: "New England Patriots", code: "NE", statpalCode: "ne" },
  { id: 4, name: "New York Giants", code: "NYG", statpalCode: "nyg" },
  { id: 5, name: "Baltimore Ravens", code: "BAL", statpalCode: "bal" },
  { id: 6, name: "Tennessee Titans", code: "TEN", statpalCode: "ten" },
  { id: 7, name: "Detroit Lions", code: "DET", statpalCode: "det" },
  { id: 8, name: "Atlanta Falcons", code: "ATL", statpalCode: "atl" },
  { id: 9, name: "Cleveland Browns", code: "CLE", statpalCode: "cle" },
  { id: 10, name: "Cincinnati Bengals", code: "CIN", statpalCode: "cin" },
  { id: 11, name: "Arizona Cardinals", code: "ARI", statpalCode: "ari" },
  { id: 12, name: "Philadelphia Eagles", code: "PHI", statpalCode: "phi" },
  { id: 13, name: "New York Jets", code: "NYJ", statpalCode: "nyj" },
  { id: 14, name: "San Francisco 49ers", code: "SF", statpalCode: "sf" },
  { id: 15, name: "Green Bay Packers", code: "GB", statpalCode: "gb" },
  { id: 16, name: "Chicago Bears", code: "CHI", statpalCode: "chi" },
  { id: 17, name: "Kansas City Chiefs", code: "KC", statpalCode: "kc" },
  { id: 18, name: "Washington Commanders", code: "WAS", statpalCode: "wsh" },
  { id: 19, name: "Carolina Panthers", code: "CAR", statpalCode: "car" },
  { id: 20, name: "Buffalo Bills", code: "BUF", statpalCode: "buf" },
  { id: 21, name: "Indianapolis Colts", code: "IND", statpalCode: "ind" },
  { id: 22, name: "Pittsburgh Steelers", code: "PIT", statpalCode: "pit" },
  { id: 23, name: "Seattle Seahawks", code: "SEA", statpalCode: "sea" },
  { id: 24, name: "Tampa Bay Buccaneers", code: "TB", statpalCode: "tb" },
  { id: 25, name: "Miami Dolphins", code: "MIA", statpalCode: "mia" },
  { id: 26, name: "Houston Texans", code: "HOU", statpalCode: "hou" },
  { id: 27, name: "New Orleans Saints", code: "NO", statpalCode: "no" },
  { id: 28, name: "Denver Broncos", code: "DEN", statpalCode: "den" },
  { id: 29, name: "Dallas Cowboys", code: "DAL", statpalCode: "dal" },
  { id: 30, name: "Los Angeles Chargers", code: "LAC", statpalCode: "sd" },
  { id: 31, name: "Los Angeles Rams", code: "LA", statpalCode: "stl" },
  { id: 32, name: "Minnesota Vikings", code: "MIN", statpalCode: "min" },
]

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

// All 20 EPL teams with api-sports.io IDs and folder codes matching image directory
const SOCCER_TEAMS = [
  { id: 42, name: "Arsenal", code: "arsenal" },
  { id: 66, name: "Aston Villa", code: "aston_villa" },
  { id: 35, name: "AFC Bournemouth", code: "bournemouth" },
  { id: 55, name: "Brentford", code: "brentford" },
  { id: 51, name: "Brighton", code: "brighton" },
  { id: 49, name: "Chelsea", code: "chelsea" },
  { id: 52, name: "Crystal Palace", code: "crystal_palace" },
  { id: 45, name: "Everton", code: "everton" },
  { id: 36, name: "Fulham", code: "fulham" },
  { id: 57, name: "Ipswich Town", code: "ipswich" },
  { id: 46, name: "Leicester City", code: "leicester" },
  { id: 40, name: "Liverpool", code: "liverpool" },
  { id: 50, name: "Manchester City", code: "manchester_city" },
  { id: 33, name: "Manchester United", code: "manchester_united" },
  { id: 34, name: "Newcastle", code: "newcastle" },
  { id: 65, name: "Nottingham Forest", code: "nottingham_forest" },
  { id: 41, name: "Southampton", code: "southampton" },
  { id: 47, name: "Tottenham", code: "tottenham" },
  { id: 48, name: "West Ham", code: "west_ham" },
  { id: 39, name: "Wolverhampton", code: "wolves" },
]

// NBA player name corrections: API name -> file name (without extension)
// Used when the API returns abbreviated names but files have full names
const NBA_PLAYER_NAME_MAP: Record<string, string> = {
  // Abbreviated first names
  "V. Edgecombe": "vj_edgecombe",
  "VJ Edgecombe": "vj_edgecombe",
  // Players with initials - API may use periods
  "A.J. Green": "aj_green",
  "A.J. Lawson": "aj_lawson",
  "A.J. Johnson": "aj_johnson",
  "D.J. Carton": "dj_carton",
  "D.J. Steward": "dj_steward",
  "E.J. Liddell": "ej_liddell",
  "E.J. Harkless": "ej_harkless",
  "K.J. Simpson": "kj_simpson",
  "O.G. Anunoby": "og_anunoby",
  "P.J. Dozier": "pj_dozier",
  "P.J. Washington": "pj_washington",
  "P.J. Hall": "pj_hall",
  "T.J. McConnell": "tj_mcconnell",
  "T.J. Warren": "tj_warren",
  "C.J. McCollum": "cj_mccollum",
  "R.J. Barrett": "rj_barrett",
  "G.G. Jackson": "gg_jackson",
  "J.T. Thor": "jt_thor",
  "L.J. Cryer": "lj_cryer",
  "J.D. Davison": "jd_davison",
  // De' names
  "De'Aaron Fox": "de_aaron_fox",
  "De'Andre Hunter": "de_andre_hunter",
  "De'Anthony Melton": "de_anthony_melton",
}

// EPL player name corrections: API name -> file name (without extension)
// Used when the API returns names differently than downloaded files
const EPL_PLAYER_NAME_MAP: Record<string, string> = {
  // Arsenal
  "B. Saka": "b__saka",
  "Bukayo Saka": "b__saka",
  "M. Ødegaard": "m___degaard",
  "Martin Ødegaard": "m___degaard",
  "D. Rice": "d__rice",
  "Declan Rice": "d__rice",
  "K. Havertz": "k__havertz",
  "Kai Havertz": "k__havertz",
  "Gabriel Martinelli": "gabriel_martinelli",
  "Gabriel Jesus": "gabriel_jesus",
  "W. Saliba": "w__saliba",
  "L. Trossard": "l__trossard",
  // Liverpool
  "Mohamed Salah": "mohamed_salah",
  "M. Salah": "mohamed_salah",
  "C. Gakpo": "c__gakpo",
  "Cody Gakpo": "c__gakpo",
  "D. Szoboszlai": "d__szoboszlai",
  "V. van Dijk": "v__van_dijk",
  "Virgil van Dijk": "v__van_dijk",
  "A. Mac Allister": "a__mac_allister",
  "R. Gravenberch": "r__gravenberch",
  "Alisson Becker": "alisson_becker",
  "A. Robertson": "a__robertson",
  // Manchester City
  "E. Haaland": "e__haaland",
  "Erling Haaland": "e__haaland",
  "P. Foden": "p__foden",
  "Phil Foden": "p__foden",
  "Bernardo Silva": "bernardo_silva",
  "K. De Bruyne": "k__de_bruyne",
  "J. Doku": "j__doku",
  "J. Stones": "j__stones",
  "J. Gvardiol": "j__gvardiol",
  "Rodri": "rodri",
  "Oscar Bobb": "oscar_bobb",
  // Manchester United
  "Bruno Fernandes": "bruno_fernandes",
  "K. Mainoo": "k__mainoo",
  "Kobbie Mainoo": "k__mainoo",
  "A. Diallo": "a__diallo",
  "Amad Diallo": "a__diallo",
  "Diogo Dalot": "diogo_dalot",
  "H. Maguire": "h__maguire",
  "Lisandro Martínez": "lisandro_mart_nez",
  "Casemiro": "casemiro",
  "M. Mount": "m__mount",
  // Chelsea
  "C. Palmer": "c__palmer",
  "Cole Palmer": "c__palmer",
  "M. Caicedo": "m__caicedo",
  "N. Jackson": "n__jackson",
  "R. James": "r__james",
  "Pedro Neto": "pedro_neto",
  "Marc Cucurella": "marc_cucurella",
  "E. Fernández": "e__fern_ndez",
  // Tottenham
  "D. Solanke": "d__solanke",
  "J. Maddison": "j__maddison",
  "James Maddison": "j__maddison",
  "Pedro Porro": "pedro_porro",
  "C. Romero": "c__romero",
  "Richarlison": "richarlison",
  "Y. Bissouma": "y__bissouma",
  "M. van de Ven": "m__van_de_ven",
  // Newcastle
  "A. Gordon": "a__gordon",
  "Alexander Isak": "a__isak",
  "Bruno Guimarães": "bruno_guimar_es",
  "Joelinton": "joelinton",
  "S. Tonali": "s__tonali",
  "H. Barnes": "h__barnes",
  // Aston Villa
  "O. Watkins": "o__watkins",
  "Ollie Watkins": "o__watkins",
  "J. McGinn": "j___mcginn",
  "E. Buendía": "e__buend_a",
  "Y. Tielemans": "y__tielemans",
  "Pau Torres": "pau_torres",
  // West Ham
  "J. Bowen": "j__bowen",
  "Jarrod Bowen": "j__bowen",
  "Lucas Paquetá": "lucas_paquet_",
  "T. Souček": "t__sou_ek",
  "M. Antonio": "m__antonio",
  "K. Walker-Peters": "k__walker_peters",
  "Kyle Walker-Peters": "k__walker_peters",
  // Nottingham Forest
  "M. Gibbs-White": "m__gibbs_white",
  "Morgan Gibbs-White": "m__gibbs_white",
  "C. Hudson-Odoi": "c__hudson_odoi",
  "Callum Hudson-Odoi": "c__hudson_odoi",
  "I. Sangaré": "i__sangar_",
  "Ibrahim Sangaré": "i__sangar_",
}

// Set of all EPL players with images for validation
const EPL_PLAYERS_WITH_IMAGES = new Set([
  // arsenal
  "a__annous", "alexei_rojas_fedorushchenko", "b__saka", "b__white", "c__n_rgaard", "c__sagoe", "cristhian_mosquera", "d__rice", "david_raya", "e__eze", "e__nwaneri", "gabriel_jesus", "gabriel_magalh_es", "gabriel_martinelli", "j__timber", "joshua_nichols", "k__havertz", "kepa", "l__trossard", "m___degaard", "m__dowman", "m__lewis_skelly", "m__salmon", "mart_n_zubimendi", "mikel_merino", "n__madueke", "p__hincapi_", "r__calafiori", "t__setford", "v__gy_keres", "w__saliba",
  // aston_villa
  "a__onana", "alysson_edward", "andr_s_garc_a", "b__broggio", "b__burrows", "b__kamara", "d__malen", "e__buend_a", "e__guessand", "e__konsa", "e__mart_nez", "george_hemmings", "h__elliott", "i__maatsen", "j___mcginn", "j__jimoh", "j__sancho", "j__wright", "k__young", "l__barry", "l__bogarde", "l__digne", "l__routh", "m__bizot", "m__cash", "m__rogers", "o__watkins", "pau_torres", "r__barkley", "r__oakley", "s__proctor", "t__carroll", "t__mings", "t__patterson", "v__lindel_f", "y__mosquera", "y__tielemans",
  // bournemouth
  "___petrovi_", "_lex_jim_nez", "a__adli", "a__scott", "a__smith", "a__truffert", "b__diakit_", "b__doak", "d__brooks", "e___nal", "e__kroupi", "evanilson", "f__forster", "harold_william", "j__hill", "j__kluivert", "j__soler", "l__cook", "m__senesi", "m__tavernier", "michael_dacosta", "r__christie", "remy_rees_dottin", "t__adams", "veljko_milosavljevi_", "w__dennis", "z__silcott_duberry",
  // brentford
  "a__hickey", "a__milambo", "benjamin_arthur", "c__kelleher", "d__ouattara", "e__balcombe", "e__pinnock", "f__onyeka", "f_bio_carvalho", "gustavo_gomes", "h__valdimarsson", "j__dasilva", "j__eyestone", "j__henderson", "k__ajer", "k__lewis_potter", "k__schade", "kaye_iyowuna_furo", "m__cox", "m__damsgaard", "m__jensen", "m__kayode", "n__collins", "r__donovan", "r__henry", "r__nelson", "s__van_den_berg", "thiago", "v__janelt", "y__konak", "y__yarmolyuk",
  // brighton
  "a__moran", "a__webster", "b__gruda", "b__verbruggen", "c__baleba", "c__kostoulas", "c__tasker", "d__coppola", "d__g_mez", "d__welbeck", "f__kad_o_lu", "f__simmonds", "g__rutter", "h__howell", "j__hinshelwood", "j__milner", "j__steele", "j__van_hecke", "j__veltman", "joe_knight", "k__mitoma", "l__dunk", "m__de_cuyper", "m__wieffer", "n__atom", "n__oriola", "nils_ramming", "o__boscagli", "p__gro_", "s__nti", "s__tzimas", "t__mcgill", "t__watson", "y__ayari", "y__minteh",
  // chelsea
  "a__garnacho", "andrey_santos", "b__badiashile", "c__palmer", "d_rio_essugo", "e__fern_ndez", "est_v_o", "f__buonanotte", "f__j_rgensen", "g__antwi", "g__s_onina", "j__bynoe_gittens", "j__hato", "jo_o_pedro", "joshua_kofi_acheampong", "l__colwill", "l__delap", "m__caicedo", "m__gusto", "marc_cucurella", "marc_guiu", "max_merrick", "o__harrison", "pedro_neto", "r__james", "r__lavia", "r__walsh", "robert_s_nchez", "sam_rak_sakyi", "shumaira_mheuka", "t__adarabioyo", "t__chalobah", "tyrique_george", "w__fofana",
  // crystal_palace
  "a__wharton", "b__casey", "b__johnson", "b__sosa", "c__kporha", "c__richards", "christantus_uche", "d__benamar", "d__henderson", "d__kamada", "d__mu_oz", "e__nketiah", "g__king", "i__sarr", "j__canvot", "j__devenny", "j__drakes_thomas", "j__lerma", "j__mateta", "j__rak_sakyi", "k__rodney", "kai_reece_adams_collman", "m__dashi", "m__gu_hi", "m__jemide", "m__lacroix", "n__clyne", "r__matthews", "rio_cardines", "t__adaramola", "t__mitchell", "w__ben_tez", "w__hughes", "yeremy_pino", "z__marsh",
  // everton
  "a__thomas", "adam_aznou_ben_cheikh", "b__graham", "beto", "c__alcaraz", "c__bates", "d__mcneil", "elijah_xavier_campbell", "h__armstrong", "h__tyrer", "i__gueye", "i__ndiaye", "j__branthwaite", "j__garner", "j__grealish", "j__o_apos_brien", "j__pickford", "j__tarkowski", "justin_clarke", "k__dewsbury_hall", "m__keane", "m__r_hl", "m__travers", "malik_olayiwola", "n__patterson", "o__samuels_smith", "r__welch", "s__coleman", "t__barry", "t__dibling", "t__iroegbunam", "t__king", "v__mykolenko",
  // fulham
  "a__iwobi", "a__loupalo_bi", "a__robinson", "adama_traor_", "alfie_shane_mcnally", "b__lecomte", "b__leno", "c__bassey", "e__smith_rowe", "h__reed", "h__wilson", "i__diop", "j__andersen", "j__esenga", "j__kusi_asare", "jorge_cuenca", "joshua_king", "k__tete", "kevin", "r__jim_nez", "r__sessegnon", "rodrigo_muniz", "s__amissah", "s__berge", "s__chukwueze", "s__luki_", "s__ridgeon", "t__cairney", "t__castagne",
  // ipswich
  "a__matusiwa", "a__palmer", "a__young", "b__johnson", "c__akpom", "c__kipr_", "c__townsend", "c__walton", "d__button", "d__furlong", "d__o_apos_shea", "e__baggott", "finley_frank_barbrook", "g__hirst", "h__clarke", "iv_n_az_n", "j__cajuste", "j__clarke", "j__greaves", "j__philogene", "j__taylor", "k__mcateer", "l__ayinde", "l__davis", "m__n__ez", "s__egeli", "s__szmodics", "w__burns",
  // leicester
  "a__begovi_", "a__fatawu", "a__ramsey", "b__de_cordova_reid", "b__nelson", "b__soumar_", "c__okoli", "fran_vieites", "h__choudhury", "h__winks", "j__ayew", "j__evans", "j__james", "j__monga", "j__stolarczyk", "j__vestergaard", "l__page", "l__thomas", "m__golding", "o__aluko", "o__skipp", "p__daka", "ricardo_pereira", "s__mavididi", "silko_amari_otieno_thomas", "v__kristiansen", "w__faes", "wanya_mar_al",
  // liverpool
  "___p_csi", "a__isak", "a__mac_allister", "a__nallo", "a__robertson", "alisson_becker", "c__bradley", "c__gakpo", "c__jones", "c__pinnington", "c__ramsay", "d__szoboszlai", "f__chiesa", "f__wirtz", "f__woodman", "g__leoni", "g__mamardashvili", "h__ekitike", "i__konat_", "j__danns", "j__frimpong", "j__gomez", "josh_davidson", "k__figueroa", "k__mi_ciur", "k__morrison", "kaide_gordon", "m__kerkez", "m__laffey", "mohamed_salah", "r__gravenberch", "r__ngumoha", "r__williams", "t__nyoni", "tommy_pilling", "trent_toure_kone_doherty", "v__van_dijk", "w__endo", "w__omoruyi",
  // manchester_city
  "a__khusanov", "a__semenyo", "bernardo_silva", "charlie_gray", "d__mukasa", "e__haaland", "g__donnarumma", "j__doku", "j__gvardiol", "j__stones", "j__trafford", "jaden_heskey", "k__braithwaite", "k__phillips", "m__bettinelli", "m__kova_i_", "matheus_nunes", "max_alleyne", "n__ak_", "n__o_apos_reilly", "nico_gonz_lez", "omar_marmoush", "oscar_bobb", "p__foden", "r__a_t_nouri", "r__cherki", "r__lewis", "r__mcaidoo", "r_ben_dias", "reigan_heskey", "rodri", "s__mfuni", "s__ortega", "s_vio", "t__reijnders",
  // manchester_united
  "a__bay_nd_r", "a__diallo", "a__heaven", "b___e_ko", "b__mbeumo", "bendito_mantato", "bruno_fernandes", "casemiro", "d__le_n", "dermot_william_mee", "diogo_dalot", "g__kukonki", "h__maguire", "j__fletcher", "j__zirkzee", "k__mainoo", "l__shaw", "l__yoro", "lisandro_mart_nez", "m__de_ligt", "m__mount", "m__ugarte", "matheus_cunha", "n__mazraoui", "o__martin", "p__dorgu", "r__munro", "s__kon_", "s__lacey", "s__lammens", "t__fletcher", "t__fredricson", "t__heaton", "t__malacia", "tobias_christopher_collyer",
  // newcastle
  "a__elanga", "a__gordon", "a__harrison", "a__munda", "a__murphy", "a__ramsdale", "alfie_harrison", "bruno_guimar_es", "d__burn", "e__krafth", "f__sch_r", "h__ashby", "h__barnes", "j__lascelles", "j__murphy", "j__ramsey", "j__ruddy", "j__white", "j__willock", "joelinton", "k__trippier", "l__hall", "l__miley", "l__shahar", "m__gillespie", "m__thiaw", "max_thompson", "n__pope", "n__woltemade", "park_seung_soo", "s__alabi", "s__botman", "s__neave", "s__tonali", "t__livramento", "w__osula", "y__wissa",
  // nottingham_forest
  "a__berry", "a__gunn", "a__whitehall", "aaron_bott", "b__hammond", "c__hudson_odoi", "c__wood", "d__bakwa", "d__ndoye", "douglas_luiz", "e__anderson", "george_murray_jones", "i__sangar_", "igor_jesus", "j__mcatee", "j__sinclair", "jack_ethan_thompson", "jair", "john", "joshua_alan_powell", "keehan_willows", "m__gibbs_white", "m__sels", "morato", "murillo", "n__dom_nguez", "n__milenkovi_", "n__savona", "n__williams", "o__aina", "o__hutchinson", "o__zinchenko", "r__yates", "t__awoniyi", "w__boly", "z__abbott", "z__blake",
  // southampton
  "a__armstrong", "a__mccarthy", "b__williams", "c__archer", "c__jander", "cameron_bragg", "d__moody", "daniel_peretz", "e__jelert", "f__azaz", "f__downes", "g__long", "j__aribo", "j__bree", "j__quarshie", "j__sanda", "j__stephens", "jay_robinson", "k__matsuki", "l_o_scienza", "m__roerslev", "m__sesay", "n__oyekunle", "n__wood_gordon", "oriol_romeu", "r__akachukwu", "r__fraser", "r__manning", "r__stewart", "s__charles", "s__edozie", "s__tabares", "t__fellows", "t__harwood_bellis", "welington",
  // tottenham
  "a__gray", "a__kinsk_", "b__austin", "b__davies", "c__olusesi", "c__romero", "d__scarlett", "d__solanke", "d__spence", "d__udogie", "dante_jamel_cassanova", "e__lehane", "g__abbott", "g__vicario", "j__byfield", "j__maddison", "j__rowswell", "jo_o_palhinha", "k__danso", "l__bergvall", "l__williams_barnett", "luca_gunter", "m__hardy", "m__kudus", "m__melia", "m__tel", "m__van_de_ven", "o__irow", "p__sarr", "pedro_porro", "r__bentancur", "r__dr_gu_in", "r__kolo_muani", "richarlison", "rio_kyerematen", "t__thompson", "w__odobert", "x__simons", "y__akhamrich", "y__bissouma",
  // west_ham
  "___fabia_ski", "a__areola", "a__golambeckis", "a__irving", "a__wan_bissaka", "c__summerville", "c__wilson", "e__diouf", "e__mayers", "f__herrick", "f__potts", "g__rodr_guez", "igor", "j__bowen", "j__todibo", "j__ward_prowse", "k__mavropanos", "k__walker_peters", "l__orford", "lucas_paquet_", "m__hermansen", "m__kant_", "m__kilman", "mateus_fernandes", "o__scarles", "p__fearon", "pablo", "s__magassa", "t__sou_ek", "v__castellanos",
  // wolves
  "andr_", "d__bentley", "d__m_ller_wolfe", "e__agbadou", "e__gonz_lez", "ethan_sutherland", "fer_l_pez", "hugo_bueno", "hwang_hee_chan", "j__arias", "j__bellegarde", "j__strand_larsen", "j__tchatchoua", "jo_o_gomes", "jos__s_", "l__krej__", "l__lopes", "l__rawlings", "m__doherty", "m__mane", "m__munetsi", "pedro_lima", "rodrigo_gomes", "s__bueno", "s__johnstone", "s__olagunju", "t__arokodare", "t__chirewa", "t__ojinnaka", "toti_gomes", "y__mosquera",
])

// Normalize player name to match downloaded file names
function normalizePlayerNameForImage(playerName: string, league?: string): string {
  // Check exact match in league-specific mapping first
  if (league === 'SOCCER' && EPL_PLAYER_NAME_MAP[playerName]) {
    return EPL_PLAYER_NAME_MAP[playerName]
  }
  if (NBA_PLAYER_NAME_MAP[playerName]) {
    return NBA_PLAYER_NAME_MAP[playerName]
  }

  // For EPL players, handle the specific file naming convention:
  // - Single letter initial "X. " becomes "x__" (double underscore)
  // - Accented characters like é, á, ø become underscore
  // - Hyphens, spaces, other special chars become underscore
  // - Trailing accent results in trailing underscore (e.g., "Sangaré" -> "sangar_")
  if (league === 'SOCCER') {
    let hasInitial = /^[A-Za-z]\.\s+/.test(playerName)

    // Start with lowercase
    let normalized = playerName.toLowerCase()

    // Handle initial "x. " -> "x__" pattern
    if (hasInitial) {
      normalized = normalized.replace(/^([a-z])\.\s+/, '$1__')
    }

    // Replace accented characters with underscore
    // First normalize to NFD (separate base char from accent), then replace accents with underscore
    normalized = normalized
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '_')  // Replace combining diacritical marks with underscore

    // Replace any remaining non-alphanumeric (except underscore) with underscore
    normalized = normalized.replace(/[^a-z0-9_]/g, '_')

    // Collapse multiple consecutive underscores to single (except preserve double after initial)
    // First, temporarily protect the initial's double underscore
    if (hasInitial) {
      normalized = normalized.replace(/^([a-z])__/, '$1\x00\x00')  // temp marker
    }
    normalized = normalized.replace(/_+/g, '_')
    if (hasInitial) {
      normalized = normalized.replace(/^([a-z])\x00\x00/, '$1__')  // restore double underscore
    }

    // Remove leading underscore (but not trailing - some names end with accents like "Sangaré" -> "sangar_")
    normalized = normalized.replace(/^_/, '')

    return normalized
  }

  // Normalize the name for other leagues:
  // 1. Replace patterns like "A.J." or "A. J." with "AJ" (remove periods/spaces between initials)
  let normalized = playerName
    .replace(/([A-Z])\.?\s*([A-Z])\.\s/g, '$1$2 ') // "A.J. " or "A. J. " -> "AJ "
    .replace(/([A-Z])\.([A-Z])\./g, '$1$2')        // "A.J." at end -> "AJ"
    .replace(/([A-Z])\.\s/g, '$1 ')                // Single initial "V. " -> "V "

  // Standard sanitization
  return normalized.toLowerCase().replace(/[^a-z0-9]/g, '_')
}

// ============================================
// RIVALRY MAPPINGS
// ============================================

const NBA_RIVALRIES: Record<string, string[]> = {
  // Lakers rivalries
  LAL: ['BOS', 'LAC', 'GSW', 'PHX', 'SAC'],
  // Celtics rivalries
  BOS: ['LAL', 'PHI', 'MIA', 'NYK', 'BKN'],
  // Warriors rivalries
  GSW: ['LAL', 'LAC', 'CLE', 'HOU', 'MEM'],
  // Clippers rivalries
  LAC: ['LAL', 'GSW', 'PHX', 'DEN'],
  // Heat rivalries
  MIA: ['BOS', 'NYK', 'CHI', 'IND'],
  // Knicks rivalries
  NYK: ['BOS', 'BKN', 'MIA', 'CHI', 'IND'],
  // Bulls rivalries
  CHI: ['DET', 'CLE', 'MIA', 'NYK'],
  // Mavericks rivalries
  DAL: ['SAS', 'HOU', 'PHX', 'MIA'],
  // Suns rivalries
  PHX: ['LAL', 'LAC', 'GSW', 'DAL', 'SAS'],
  // 76ers rivalries
  PHI: ['BOS', 'NYK', 'MIA', 'TOR'],
  // Nuggets rivalries
  DEN: ['LAL', 'LAC', 'MIN', 'UTA'],
  // Bucks rivalries
  MIL: ['CHI', 'BOS', 'MIA', 'IND'],
  // Cavaliers rivalries
  CLE: ['GSW', 'CHI', 'DET', 'BOS'],
  // Default - use top teams
  DEFAULT: ['LAL', 'BOS', 'GSW', 'MIA', 'PHX'],
}

const NFL_RIVALRIES: Record<string, string[]> = {
  // Cowboys rivalries
  dal: ['phi', 'nyg', 'wsh', 'sf'],
  // Eagles rivalries
  phi: ['dal', 'nyg', 'wsh', 'ne'],
  // Giants rivalries
  nyg: ['dal', 'phi', 'wsh', 'ne'],
  // Patriots rivalries
  ne: ['nyj', 'mia', 'buf', 'ind'],
  // Chiefs rivalries
  kc: ['oak', 'den', 'sd', 'buf'],
  // Raiders rivalries
  oak: ['kc', 'den', 'sd', 'sf'],
  // 49ers rivalries
  sf: ['sea', 'stl', 'ari', 'dal', 'gb'],
  // Packers rivalries
  gb: ['chi', 'min', 'det', 'sf'],
  // Bears rivalries
  chi: ['gb', 'min', 'det'],
  // Steelers rivalries
  pit: ['bal', 'cle', 'cin', 'ne'],
  // Ravens rivalries
  bal: ['pit', 'cle', 'cin'],
  // Bills rivalries
  buf: ['mia', 'ne', 'nyj', 'kc'],
  // Default - use popular teams
  DEFAULT: ['dal', 'ne', 'sf', 'gb', 'kc'],
}

// Soccer rivalries using team codes matching image folders
const SOCCER_RIVALRIES: Record<string, string[]> = {
  // Man United rivalries
  manchester_united: ['liverpool', 'manchester_city', 'arsenal', 'chelsea'],
  // Liverpool rivalries
  liverpool: ['manchester_united', 'manchester_city', 'everton', 'chelsea'],
  // Man City rivalries
  manchester_city: ['manchester_united', 'liverpool', 'arsenal', 'chelsea'],
  // Arsenal rivalries
  arsenal: ['tottenham', 'chelsea', 'manchester_united', 'manchester_city'],
  // Tottenham rivalries
  tottenham: ['arsenal', 'chelsea', 'west_ham', 'manchester_united'],
  // Chelsea rivalries
  chelsea: ['arsenal', 'tottenham', 'manchester_united', 'liverpool'],
  // Newcastle rivalries
  newcastle: ['manchester_united', 'liverpool', 'tottenham', 'arsenal'],
  // Aston Villa rivalries
  aston_villa: ['wolves', 'manchester_united', 'liverpool', 'arsenal'],
  // West Ham rivalries
  west_ham: ['tottenham', 'chelsea', 'arsenal', 'manchester_united'],
  // Default - Big 6
  DEFAULT: ['manchester_united', 'liverpool', 'arsenal', 'chelsea', 'manchester_city', 'tottenham'],
}

// ============================================
// FRAUDWATCH HOOKS
// ============================================

const FRAUDWATCH_HOOKS = [
  // Direct callouts
  "FraudWatch: These players are NOT who you think they are",
  "Stop calling these guys elite. Please.",
  "The most overrated players in the league right now",
  "These 'stars' are living off reputation alone",
  "FraudWatch is in session",
  "Your favorite player might be on this list...",
  "The fraud alert is going off",
  "These players are fooling everyone",
  "It's time we talked about these guys",
  "The frauds hiding in plain sight",

  // Ragebait energy
  "I'm sorry but these players are WASHED",
  "These guys are stealing paychecks at this point",
  "How are people still hyping these players?",
  "The emperor has no clothes. Neither do these guys.",
  "Someone had to say it. These players are frauds.",
  "Your 'star' player isn't a star anymore",
  "The stats don't lie. These players do.",
  "Living off one good season from 3 years ago",
  "Fantasy owners, stop rostering these frauds",
  "The media won't tell you this. I will.",

  // Confrontational
  "Tag someone who needs to see this",
  "If your guy is on this list, I'm sorry",
  "This is gonna make some people mad",
  "Unfollow me now if you can't handle the truth",
  "The takes they're not ready for",
  "This list is controversial. Deal with it.",
  "Some of y'all aren't gonna like this",
  "Prepare to be triggered",
  "The hard truth about your favorite players",
  "I said what I said. Fight me in the comments.",

  // IYKYK / Sharp energy
  "Sharps have been fading these guys all season",
  "The market knows these players are cooked",
  "Vegas figured this out months ago",
  "If you're still betting on these guys, that's on you",
  "The data is clear. These are certified frauds.",
  "Smart money is off these players completely",
  "The lines tell the real story",
  "These are the trap plays of the week",
  "Books love when you bet on these guys",
  "The public keeps falling for these names",
]

// ============================================
// CTA TEXTS
// ============================================

const CTA_TEXTS = [
  "Full fraud analysis on Bet.AI.",
  "More overrated players exposed on Bet.AI.",
  "See who else made the list: Bet.AI",
  "Bet.AI for the full breakdown",
]

function getRandomHook(): string {
  return FRAUDWATCH_HOOKS[Math.floor(Math.random() * FRAUDWATCH_HOOKS.length)]
}

function getRandomCTA(): string {
  return CTA_TEXTS[Math.floor(Math.random() * CTA_TEXTS.length)]
}

function getRandomBetAIImage(): string {
  const imageIndex = Math.floor(Math.random() * 6) + 1
  return `/images/bet-apps/apps/betai/${imageIndex}.jpg`
}

// Hook images pool - randomly pick one for variety
// Files are in public/images/hooks/ named 1.jpeg through 62.jpeg
const HOOK_IMAGE_COUNT = 62
function getRandomHookImage(): string {
  const imageIndex = Math.floor(Math.random() * HOOK_IMAGE_COUNT) + 1
  return `/images/hooks/${imageIndex}.jpeg`
}

// ============================================
// TYPES
// ============================================

interface FraudPlayer {
  playerName: string
  playerId: string | number
  team: string
  teamCode: string
  position: string
  fraudReasons: [string, string, string]
}

interface SlideData {
  screenNumber: number
  imagePath: string
  textOverlay: string[]
  isHook?: boolean
  isCTA?: boolean
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getTeamName(league: string, teamCode: string): string {
  const teams = league === 'NFL' ? NFL_TEAMS : league === 'NBA' ? NBA_TEAMS : SOCCER_TEAMS
  const team = teams.find(t =>
    t.code?.toLowerCase() === teamCode.toLowerCase() ||
    (t as any).statpalCode === teamCode.toLowerCase() ||
    String(t.id) === teamCode
  )
  return team?.name || teamCode.toUpperCase()
}

function getRivalTeams(league: string, teamCode: string): string[] {
  if (league === 'NBA') {
    const code = teamCode.toUpperCase()
    return NBA_RIVALRIES[code] || NBA_RIVALRIES['DEFAULT']
  } else if (league === 'NFL') {
    const code = teamCode.toLowerCase()
    return NFL_RIVALRIES[code] || NFL_RIVALRIES['DEFAULT']
  } else if (league === 'SOCCER') {
    // SOCCER uses lowercase codes matching image folder names
    const code = teamCode.toLowerCase()
    return SOCCER_RIVALRIES[code] || SOCCER_RIVALRIES['DEFAULT']
  }
  return []
}

function getNBATeamIdFromCode(code: string): number | null {
  const team = NBA_TEAMS.find(t => t.code === code.toUpperCase())
  return team?.id || null
}

function getNFLTeamStatpalCode(code: string): string | null {
  const team = NFL_TEAMS.find(t =>
    t.code.toLowerCase() === code.toLowerCase() ||
    t.statpalCode === code.toLowerCase()
  )
  return team?.statpalCode || null
}

function getSoccerTeamIdFromCode(code: string): number | null {
  const team = SOCCER_TEAMS.find(t => t.code.toLowerCase() === code.toLowerCase())
  return team?.id || null
}

// ============================================
// API FETCHING (reused from generate-slideshow)
// ============================================

async function getNFLPlayerStats(teamCode: string) {
  const url = `${STATPAL_BASE_URL}/nfl/player-stats/${teamCode.toLowerCase()}?access_key=${STATPAL_API_KEY}`

  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json()
    if (!data?.statistics?.category) return null

    const categories = data.statistics.category

    const passingCategory = categories.find((c: any) => c.name === 'Passing')
    let passing = null
    if (passingCategory?.player) {
      const p = Array.isArray(passingCategory.player) ? passingCategory.player[0] : passingCategory.player
      passing = {
        name: p.name,
        id: p.id,
        yardsPerGame: parseFloat(p.yards_per_game) || 0,
        passingTouchdowns: parseInt(p.passing_touchdowns) || 0,
        completionPct: parseFloat(p.completion_pct) || 0,
        interceptions: parseInt(p.interceptions) || 0,
        qbRating: parseFloat(p.quaterback_rating) || 0,
        attempts: parseInt(p.passing_attempts) || 0,
      }
    }

    const rushingCategory = categories.find((c: any) => c.name === 'Rushing')
    const rushing: any[] = []
    if (rushingCategory?.player) {
      const players = Array.isArray(rushingCategory.player) ? rushingCategory.player : [rushingCategory.player]
      for (const p of players) {
        rushing.push({
          name: p.name,
          id: p.id,
          yardsPerGame: parseFloat(p.yards_per_game) || 0,
          rushingTouchdowns: parseInt(p.rushing_touchdowns) || 0,
          rushingAttempts: parseInt(p.rushing_attempts) || 0,
          yardsPerRush: parseFloat(p.yards_per_rush_avg) || 0,
          fumbles: parseInt(p.fumbles) || 0,
          over20Yards: parseInt(p.over_20_yards) || 0,
        })
      }
    }

    const receivingCategory = categories.find((c: any) => c.name === 'Receiving')
    const receiving: any[] = []
    if (receivingCategory?.player) {
      const players = Array.isArray(receivingCategory.player) ? receivingCategory.player : [receivingCategory.player]
      for (const p of players) {
        receiving.push({
          name: p.name,
          id: p.id,
          yardsPerGame: parseFloat(p.yards_per_game) || 0,
          receivingTouchdowns: parseInt(p.receiving_touchdowns) || 0,
          receptions: parseInt(p.receptions) || 0,
          targets: parseInt(p.receiving_targets) || 0,
          yardsPerReception: parseFloat(p.yards_per_reception_avg) || 0,
          over20Yards: parseInt(p.over_20_yards) || 0,
        })
      }
    }

    return { passing, rushing, receiving }
  } catch (error) {
    console.error(`NFL stats error for ${teamCode}:`, error)
    return null
  }
}

async function getNBAPlayerStats(teamId: number) {
  const season = getCurrentSeason('NBA')
  const url = `https://v2.nba.api-sports.io/players/statistics?season=${season}&team=${teamId}`

  try {
    const response = await fetch(url, {
      headers: {
        'x-rapidapi-key': API_SPORTS_KEY,
        'x-rapidapi-host': 'v2.nba.api-sports.io',
      },
    })

    if (!response.ok) return []
    const data = await response.json()
    if (!data?.response?.length) return []

    const playerMap = new Map<number, any>()

    for (const game of data.response) {
      if (!game.player) continue
      const playerId = game.player.id

      if (!playerMap.has(playerId)) {
        playerMap.set(playerId, {
          player: game.player,
          position: game.pos || 'Unknown',
          games: 0,
          totalPoints: 0,
          totalReb: 0,
          totalAst: 0,
          totalFgm: 0,
          totalFga: 0,
          totalFtm: 0,
          totalFta: 0,
          totalTov: 0,
          totalMin: 0,
        })
      }

      const p = playerMap.get(playerId)!
      p.games++
      p.totalPoints += game.points || 0
      p.totalReb += game.totReb || 0
      p.totalAst += game.assists || 0
      p.totalFgm += game.fgm || 0
      p.totalFga += game.fga || 0
      p.totalFtm += game.ftm || 0
      p.totalFta += game.fta || 0
      p.totalTov += game.turnovers || 0
      p.totalMin += parseInt(game.min) || 0
    }

    const aggregated: any[] = []
    for (const [playerId, p] of playerMap) {
      if (p.games === 0) continue
      aggregated.push({
        playerId,
        name: `${p.player.firstname} ${p.player.lastname}`,
        position: p.position,
        gamesPlayed: p.games,
        pointsAverage: parseFloat((p.totalPoints / p.games).toFixed(1)),
        reboundsAverage: parseFloat((p.totalReb / p.games).toFixed(1)),
        assistsAverage: parseFloat((p.totalAst / p.games).toFixed(1)),
        fgPercentage: p.totalFga > 0 ? parseFloat(((p.totalFgm / p.totalFga) * 100).toFixed(1)) : 0,
        ftPercentage: p.totalFta > 0 ? parseFloat(((p.totalFtm / p.totalFta) * 100).toFixed(1)) : 0,
        turnoversAverage: parseFloat((p.totalTov / p.games).toFixed(1)),
        minutesAverage: parseFloat((p.totalMin / p.games).toFixed(1)),
      })
    }

    return aggregated
      .filter(p => p.pointsAverage > 8 && p.gamesPlayed >= 5)
      .sort((a, b) => b.pointsAverage - a.pointsAverage)
  } catch (error) {
    console.error(`NBA stats error for team ${teamId}:`, error)
    return []
  }
}

async function getSoccerPlayerStats(teamId: number) {
  const season = getCurrentSeason('SOCCER')
  const url = `https://v3.football.api-sports.io/players?team=${teamId}&season=${season}`

  try {
    const response = await fetch(url, {
      headers: {
        'x-rapidapi-key': API_SPORTS_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
    })

    if (!response.ok) return []
    const data = await response.json()
    if (!data?.response?.length) return []

    const players: any[] = []

    for (const playerData of data.response) {
      if (!playerData.statistics?.length) continue

      const stats = playerData.statistics.reduce((best: any, current: any) => {
        const currentApps = current.games?.appearences || 0
        const bestApps = best?.games?.appearences || 0
        return currentApps > bestApps ? current : best
      }, playerData.statistics[0])

      const appearances = stats.games?.appearences || 0
      if (appearances === 0) continue

      const goals = stats.goals?.total || 0
      const shotsTotal = stats.shots?.total || 0
      const shotsOn = stats.shots?.on || 0
      const dribbles = stats.dribbles?.attempts || 0
      const dribblesSuccess = stats.dribbles?.success || 0

      players.push({
        playerId: playerData.player.id,
        name: playerData.player.name,
        position: stats.games?.position || 'Unknown',
        appearances,
        goals,
        goalsPerGame: parseFloat((goals / appearances).toFixed(2)),
        shotsTotal,
        shotAccuracy: shotsTotal > 0 ? parseFloat(((shotsOn / shotsTotal) * 100).toFixed(1)) : 0,
        yellowCards: stats.cards?.yellow || 0,
        dribbles,
        dribblesSuccess,
        dribbleSuccessRate: dribbles > 0 ? parseFloat(((dribblesSuccess / dribbles) * 100).toFixed(1)) : 0,
      })
    }

    // Sort by appearances (most visible players) rather than just goals
    // This ensures we get defenders, midfielders, and keepers too
    return players
      .filter(p => p.appearances >= 3)
      .sort((a, b) => b.appearances - a.appearances)
  } catch (error) {
    console.error(`Soccer stats error for team ${teamId}:`, error)
    return []
  }
}

// ============================================
// FRAUD ANALYSIS FUNCTIONS
// Find good players, spin them negatively
// ============================================

function analyzeNBAFraud(player: any, teamName: string, teamCode: string): FraudPlayer {
  const ppg = player.pointsAverage || 0
  const fgPct = player.fgPercentage || 40
  const ftPct = player.ftPercentage || 70
  const tov = player.turnoversAverage || 1
  const minutes = player.minutesAverage || 20
  const ast = player.assistsAverage || 2
  const reb = player.reboundsAverage || 3

  // ALWAYS generate content - no early returns
  const fraudReasons: string[] = []

  // FG% critique
  if (fgPct < 45) {
    fraudReasons.push(`${fgPct}% FG shooting - chucking bricks all season`)
  } else if (fgPct < 48) {
    fraudReasons.push(`Only ${fgPct}% from the field - inefficient volume scorer`)
  } else {
    fraudReasons.push(`${ppg} PPG on ${minutes} minutes - needs heavy usage to produce`)
  }

  // Turnover critique
  if (tov >= 3) {
    fraudReasons.push(`${tov} turnovers per game - giving away possessions nightly`)
  } else if (tov >= 2) {
    fraudReasons.push(`${tov} turnovers with only ${ast} assists - questionable decision making`)
  } else {
    fraudReasons.push(`Low assist numbers (${ast} APG) - doesn't make teammates better`)
  }

  // Third reason - always have a fallback
  if (ftPct < 75) {
    fraudReasons.push(`${ftPct}% FT shooting - can't be trusted in crunch time`)
  } else if (reb < 4 && !player.position?.includes('G')) {
    fraudReasons.push(`Only ${reb} rebounds - disappears on the glass`)
  } else if (ppg >= 20) {
    fraudReasons.push(`Empty stats merchant - ${ppg} PPG means nothing without wins`)
  } else {
    fraudReasons.push(`Overhyped and underdelivering all season`)
  }

  return {
    playerName: player.name || 'Unknown Player',
    playerId: player.playerId,
    team: teamName,
    teamCode: teamCode,
    position: player.position || 'G',
    fraudReasons: fraudReasons.slice(0, 3) as [string, string, string],
  }
}

function analyzeNFLReceiverFraud(player: any, teamName: string, teamCode: string): FraudPlayer {
  const ypg = player.yardsPerGame || 0
  const targets = player.targets || 1
  const ypr = player.yardsPerReception || 10
  const receptions = player.receptions || 0
  const tds = player.receivingTouchdowns || 0

  // ALWAYS generate content - no early returns
  const fraudReasons: string[] = []

  // Volume vs efficiency
  if (targets > 50 && receptions / targets < 0.6) {
    fraudReasons.push(`${receptions}/${targets} catches - can't separate from coverage`)
  } else if (ypg < 60) {
    fraudReasons.push(`Only ${ypg.toFixed(0)} yards/game - WR2 production at best`)
  } else {
    fraudReasons.push(`${ypg.toFixed(0)} yards on ${targets} targets - force-fed the ball`)
  }

  // YPR critique
  if (ypr < 11) {
    fraudReasons.push(`${ypr.toFixed(1)} yards/catch - short route merchant, no big play ability`)
  } else if (ypr > 15 && receptions < 30) {
    fraudReasons.push(`${receptions} catches - one-trick deep threat, disappears most games`)
  } else {
    fraudReasons.push(`Living off ${player.over20Yards || 'a few'} chunk plays - inconsistent weekly`)
  }

  // TD critique
  if (tds < 3) {
    fraudReasons.push(`Only ${tds} TDs - invisible in the red zone`)
  } else {
    fraudReasons.push(`${tds} TDs but TD-dependent for fantasy value`)
  }

  return {
    playerName: player.name || 'Unknown Player',
    playerId: player.id,
    team: teamName,
    teamCode: teamCode,
    position: 'WR',
    fraudReasons: fraudReasons.slice(0, 3) as [string, string, string],
  }
}

function analyzeNFLRusherFraud(player: any, teamName: string, teamCode: string): FraudPlayer {
  const ypg = player.yardsPerGame || 0
  const ypc = player.yardsPerRush || 3.5
  const attempts = player.rushingAttempts || 10
  const fumbles = player.fumbles || 0
  const tds = player.rushingTouchdowns || 0

  // ALWAYS generate content - no early returns
  const fraudReasons: string[] = []

  // Efficiency critique
  if (ypc < 4.0) {
    fraudReasons.push(`${ypc.toFixed(1)} yards/carry - running into brick walls all season`)
  } else if (ypc < 4.5) {
    fraudReasons.push(`${ypc.toFixed(1)} YPC - mediocre efficiency despite heavy workload`)
  } else {
    fraudReasons.push(`${ypg.toFixed(0)} yards/game - system RB, any back could do this`)
  }

  // Volume/opportunity critique
  if (attempts > 150) {
    fraudReasons.push(`${attempts} carries - only producing because of volume`)
  } else {
    fraudReasons.push(`Splitting carries - not trusted as a true bellcow`)
  }

  // Third reason
  if (fumbles >= 2) {
    fraudReasons.push(`${fumbles} fumbles - ball security is a major concern`)
  } else if (tds < 4) {
    fraudReasons.push(`Only ${tds} TDs - getting vultured at the goal line`)
  } else {
    fraudReasons.push(`TD-dependent - underwhelming when he doesn't score`)
  }

  return {
    playerName: player.name || 'Unknown Player',
    playerId: player.id,
    team: teamName,
    teamCode: teamCode,
    position: 'RB',
    fraudReasons: fraudReasons.slice(0, 3) as [string, string, string],
  }
}

function analyzeNFLQBFraud(player: any, teamName: string, teamCode: string): FraudPlayer {
  const ypg = player.yardsPerGame || 150
  const compPct = player.completionPct || 60
  const tds = player.passingTouchdowns || 5
  const ints = player.interceptions || 3
  const rating = player.qbRating || 80

  // ALWAYS generate content - no early returns
  const fraudReasons: string[] = []

  // Accuracy/rating critique
  if (compPct < 64) {
    fraudReasons.push(`${compPct.toFixed(1)}% completion - can't hit open receivers`)
  } else if (rating < 90) {
    fraudReasons.push(`${rating.toFixed(1)} QB rating - below average despite the hype`)
  } else {
    fraudReasons.push(`${ypg.toFixed(0)} yards/game - checkdown king, avoiding risky throws`)
  }

  // INT critique
  if (ints >= tds / 2) {
    fraudReasons.push(`${tds} TDs vs ${ints} INTs - turnover machine`)
  } else if (ints >= 6) {
    fraudReasons.push(`${ints} interceptions - forcing throws into coverage`)
  } else {
    fraudReasons.push(`Playing it safe - won't take shots when it matters`)
  }

  // Third reason
  if (tds < 15) {
    fraudReasons.push(`Only ${tds} passing TDs - not carrying the offense`)
  } else {
    fraudReasons.push(`Stat-padding against weak defenses`)
  }

  return {
    playerName: player.name || 'Unknown Player',
    playerId: player.id,
    team: teamName,
    teamCode: teamCode,
    position: 'QB',
    fraudReasons: fraudReasons.slice(0, 3) as [string, string, string],
  }
}

function analyzeSoccerFraud(player: any, teamName: string, teamCode: string): FraudPlayer {
  const goals = player.goals || 0
  const appearances = player.appearances || 1
  const gpg = player.goalsPerGame || 0
  const shotAccuracy = player.shotAccuracy || 30
  const position = player.position || 'Unknown'
  const yellowCards = player.yellowCards || 0
  const shotsTotal = player.shotsTotal || 0
  const dribbleSuccessRate = player.dribbleSuccessRate || 0

  // ALWAYS generate content - no early returns

  const isAttacker = ['Attacker', 'Forward'].includes(position)
  const isMidfielder = position === 'Midfielder'
  const isDefender = position === 'Defender'
  const isGoalkeeper = position === 'Goalkeeper'

  const fraudReasons: string[] = []

  // First reason based on position
  if (isAttacker) {
    if (gpg < 0.4) {
      fraudReasons.push(`${goals} goals in ${appearances} games - where's the output?`)
    } else {
      fraudReasons.push(`${gpg.toFixed(2)} goals/game - living off reputation alone`)
    }
  } else if (isMidfielder) {
    if (goals < 3) {
      fraudReasons.push(`Only ${goals} goal contributions - invisible in attack`)
    } else {
      fraudReasons.push(`${goals} goals but no creativity - just a stat padder`)
    }
  } else if (isDefender) {
    fraudReasons.push(`Gets rinsed every week - defensive liability`)
  } else if (isGoalkeeper) {
    fraudReasons.push(`Letting in goals left and right this season`)
  } else {
    fraudReasons.push(`${appearances} appearances with nothing to show for it`)
  }

  // Second reason - shot/discipline based
  if (shotsTotal > 10 && shotAccuracy < 45) {
    fraudReasons.push(`${shotAccuracy}% shot accuracy - can't hit a barn door`)
  } else if (shotsTotal > 15 && goals < 4) {
    fraudReasons.push(`${shotsTotal} shots, ${goals} goals - wasteful finishing`)
  } else if (yellowCards >= 4) {
    fraudReasons.push(`${yellowCards} yellow cards - undisciplined liability`)
  } else if (dribbleSuccessRate > 0 && dribbleSuccessRate < 50) {
    fraudReasons.push(`${dribbleSuccessRate}% dribble success - keeps losing the ball`)
  } else {
    fraudReasons.push(`Not creating enough chances on goal`)
  }

  // Third reason - make sure we always have 3 varied reasons
  const thirdReasons = [
    `Overhyped by media - actual impact is minimal`,
    `Living off one good season from years ago`,
    `Fans still think he's world class. He's not.`,
    `Stats don't lie - this is a fraud`,
    `Getting paid like a star, playing like a benchwarmer`,
    `Would struggle in the Championship`,
    `Disappears in big games consistently`,
    `Twitter hype merchant - nothing more`,
  ]
  fraudReasons.push(thirdReasons[Math.floor(Math.random() * thirdReasons.length)])

  return {
    playerName: player.name || 'Unknown Player',
    playerId: player.playerId,
    team: teamName,
    teamCode: teamCode,
    position: player.position || 'Unknown',
    fraudReasons: fraudReasons.slice(0, 3) as [string, string, string],
  }
}

// ============================================
// CAPTION GENERATOR
// ============================================

function generateCaption(league: string, accountTeam: string): string {
  const teamName = getTeamName(league, accountTeam)

  const captions = [
    `FraudWatch is in session. These players from rival teams are living off hype.\n\n#${league} #FraudWatch #Overrated #BetAI`,
    `The media won't tell you this. I will. These "stars" are certified frauds.\n\n#${league} #FraudAlert #Exposed #BetAI`,
    `Sorry not sorry. These players are NOT it.\n\n#${league} #FraudWatch #Facts #BetAI`,
    `Time to expose the most overrated players. FraudWatch activated.\n\n#${league} #Overrated #FraudWatch #BetAI`,
  ]

  return captions[Math.floor(Math.random() * captions.length)]
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req) => {
  // Handle CORS
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
    const { league, team } = await req.json()

    if (!league || !['NFL', 'NBA', 'SOCCER'].includes(league)) {
      return new Response(JSON.stringify({ error: 'Invalid league' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    if (!team) {
      return new Response(JSON.stringify({ error: 'Team is required for FraudWatch' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    console.log(`Generating FraudWatch: league=${league}, team=${team}`)

    // Get rival teams
    const rivalTeamCodes = getRivalTeams(league, team)
    console.log(`Rival teams: ${rivalTeamCodes.join(', ')}`)

    // Limit to 2 rival teams for variety
    const selectedRivals = rivalTeamCodes.slice(0, 2)

    const fraudPlayers: FraudPlayer[] = []

    // Fetch and analyze players from rival teams
    if (league === 'NBA') {
      for (const rivalCode of selectedRivals) {
        const teamId = getNBATeamIdFromCode(rivalCode)
        if (!teamId) continue

        const stats = await getNBAPlayerStats(teamId)
        const teamName = getTeamName(league, rivalCode)
        const teamCode = rivalCode.toLowerCase()

        // Analyze top players from this team - always returns a player now
        for (const player of stats.slice(0, 4)) {
          fraudPlayers.push(analyzeNBAFraud(player, teamName, teamCode))
        }
      }
    } else if (league === 'NFL') {
      for (const rivalCode of selectedRivals) {
        const statpalCode = getNFLTeamStatpalCode(rivalCode) || rivalCode
        const stats = await getNFLPlayerStats(statpalCode)
        if (!stats) continue

        const teamName = getTeamName(league, rivalCode)
        const teamCode = statpalCode.toLowerCase()

        // Analyze QB - always returns a player now
        if (stats.passing) {
          fraudPlayers.push(analyzeNFLQBFraud(stats.passing, teamName, teamCode))
        }

        // Analyze top receivers
        for (const receiver of stats.receiving.slice(0, 2)) {
          fraudPlayers.push(analyzeNFLReceiverFraud(receiver, teamName, teamCode))
        }

        // Analyze top rusher
        for (const rusher of stats.rushing.slice(0, 1)) {
          fraudPlayers.push(analyzeNFLRusherFraud(rusher, teamName, teamCode))
        }
      }
    } else if (league === 'SOCCER') {
      for (const rivalCode of selectedRivals) {
        const teamId = getSoccerTeamIdFromCode(rivalCode)
        if (!teamId) {
          console.log(`Soccer team ID not found for code: ${rivalCode}`)
          continue
        }
        const stats = await getSoccerPlayerStats(teamId)
        const teamName = getTeamName(league, rivalCode)
        const teamCode = rivalCode.toLowerCase()

        // Analyze top players - always returns a player now
        for (const player of stats.slice(0, 4)) {
          fraudPlayers.push(analyzeSoccerFraud(player, teamName, teamCode))
        }
      }
    }

    // If no players found from API, use fallback mock players
    if (fraudPlayers.length === 0) {
      console.log('No players from API, using fallback mock players')
      const fallbackRival = selectedRivals[0] || team
      const teamName = getTeamName(league, fallbackRival)
      const teamCode = fallbackRival.toLowerCase()

      if (league === 'NBA') {
        const mockPlayers = [
          { name: 'Star Guard', pointsAverage: 18, fgPercentage: 43, ftPercentage: 72, turnoversAverage: 3, minutesAverage: 32, assistsAverage: 4, reboundsAverage: 3, position: 'G' },
          { name: 'Big Forward', pointsAverage: 14, fgPercentage: 46, ftPercentage: 68, turnoversAverage: 2, minutesAverage: 28, assistsAverage: 2, reboundsAverage: 6, position: 'F' },
          { name: 'Young Center', pointsAverage: 12, fgPercentage: 52, ftPercentage: 60, turnoversAverage: 2, minutesAverage: 24, assistsAverage: 1, reboundsAverage: 8, position: 'C' },
          { name: 'Sixth Man', pointsAverage: 10, fgPercentage: 41, ftPercentage: 80, turnoversAverage: 1, minutesAverage: 20, assistsAverage: 3, reboundsAverage: 2, position: 'G' },
        ]
        for (const player of mockPlayers) {
          fraudPlayers.push(analyzeNBAFraud(player, teamName, teamCode))
        }
      } else if (league === 'NFL') {
        const mockQB = { name: 'Franchise QB', yardsPerGame: 240, completionPct: 63, passingTouchdowns: 18, interceptions: 10, qbRating: 88 }
        const mockWR = { name: 'WR1', yardsPerGame: 65, targets: 90, yardsPerReception: 12, receptions: 55, receivingTouchdowns: 4 }
        const mockRB = { name: 'Lead Back', yardsPerGame: 55, yardsPerRush: 4.1, rushingAttempts: 180, fumbles: 2, rushingTouchdowns: 5 }
        fraudPlayers.push(analyzeNFLQBFraud(mockQB, teamName, teamCode))
        fraudPlayers.push(analyzeNFLReceiverFraud(mockWR, teamName, teamCode))
        fraudPlayers.push(analyzeNFLRusherFraud(mockRB, teamName, teamCode))
      } else if (league === 'SOCCER') {
        const mockPlayers = [
          { name: 'Star Striker', goals: 8, appearances: 20, goalsPerGame: 0.4, shotAccuracy: 42, position: 'Forward', yellowCards: 3, shotsTotal: 45 },
          { name: 'Playmaker', goals: 3, appearances: 22, goalsPerGame: 0.14, shotAccuracy: 35, position: 'Midfielder', yellowCards: 5, shotsTotal: 20 },
          { name: 'Center Back', goals: 1, appearances: 18, goalsPerGame: 0.05, shotAccuracy: 25, position: 'Defender', yellowCards: 6, shotsTotal: 8 },
          { name: 'Winger', goals: 5, appearances: 19, goalsPerGame: 0.26, shotAccuracy: 38, position: 'Forward', yellowCards: 2, shotsTotal: 35 },
        ]
        for (const player of mockPlayers) {
          fraudPlayers.push(analyzeSoccerFraud(player, teamName, teamCode))
        }
      }
    }

    // Shuffle and pick 5-7 frauds
    for (let i = fraudPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[fraudPlayers[i], fraudPlayers[j]] = [fraudPlayers[j], fraudPlayers[i]]
    }

    const selectedFrauds = fraudPlayers.slice(0, Math.min(6, fraudPlayers.length))

    // Build slides
    const slides: SlideData[] = [
      {
        screenNumber: 1,
        isHook: true,
        textOverlay: [getRandomHook()],
        imagePath: getRandomHookImage(),
      },
    ]

    for (let i = 0; i < selectedFrauds.length; i++) {
      const fraud = selectedFrauds[i]
      // Use player headshots from downloaded images
      let playerImagePath: string
      const normalizedName = normalizePlayerNameForImage(fraud.playerName, league)
      if (league === 'NBA') {
        playerImagePath = `/images/nba-players/${fraud.teamCode}/${normalizedName}.png`
      } else if (league === 'SOCCER') {
        // Validate EPL player has image
        const hasImage = EPL_PLAYERS_WITH_IMAGES.has(normalizedName)
        if (!hasImage) {
          console.log(`EPL player image not found: ${fraud.playerName} -> ${normalizedName}`)
        }
        playerImagePath = `/images/epl-players/${fraud.teamCode}/${normalizedName}.png`
      } else {
        playerImagePath = `/slides/${league.toLowerCase()}/${fraud.playerName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`
      }
      slides.push({
        screenNumber: i + 2,
        isHook: false,
        textOverlay: ['FRAUD', fraud.playerName, ...fraud.fraudReasons],
        imagePath: playerImagePath,
      })
    }

    // Add CTA slide
    slides.push({
      screenNumber: selectedFrauds.length + 2,
      isHook: false,
      isCTA: true,
      textOverlay: ['CTA', getRandomCTA()],
      imagePath: getRandomBetAIImage(),
    })

    const result = {
      slides,
      caption: generateCaption(league, team),
      league,
      accountTeam: team,
      rivalTeams: selectedRivals,
      generatedAt: new Date().toISOString(),
    }

    console.log(`Generated ${slides.length} slides for FraudWatch`)

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
