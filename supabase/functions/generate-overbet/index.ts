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
  LAL: ['BOS', 'LAC', 'GSW', 'PHX', 'SAC'],
  BOS: ['LAL', 'PHI', 'MIA', 'NYK', 'BKN'],
  GSW: ['LAL', 'LAC', 'CLE', 'HOU', 'MEM'],
  LAC: ['LAL', 'GSW', 'PHX', 'DEN'],
  MIA: ['BOS', 'NYK', 'CHI', 'IND'],
  NYK: ['BOS', 'BKN', 'MIA', 'CHI', 'IND'],
  CHI: ['DET', 'CLE', 'MIA', 'NYK'],
  DAL: ['SAS', 'HOU', 'PHX', 'MIA'],
  PHX: ['LAL', 'LAC', 'GSW', 'DAL', 'SAS'],
  PHI: ['BOS', 'NYK', 'MIA', 'TOR'],
  DEN: ['LAL', 'LAC', 'MIN', 'UTA'],
  MIL: ['CHI', 'BOS', 'MIA', 'IND'],
  CLE: ['GSW', 'CHI', 'DET', 'BOS'],
  DEFAULT: ['LAL', 'BOS', 'GSW', 'MIA', 'PHX'],
}

const NFL_RIVALRIES: Record<string, string[]> = {
  dal: ['phi', 'nyg', 'wsh', 'sf'],
  phi: ['dal', 'nyg', 'wsh', 'ne'],
  nyg: ['dal', 'phi', 'wsh', 'ne'],
  ne: ['nyj', 'mia', 'buf', 'ind'],
  kc: ['oak', 'den', 'sd', 'buf'],
  oak: ['kc', 'den', 'sd', 'sf'],
  sf: ['sea', 'stl', 'ari', 'dal', 'gb'],
  gb: ['chi', 'min', 'det', 'sf'],
  chi: ['gb', 'min', 'det'],
  pit: ['bal', 'cle', 'cin', 'ne'],
  bal: ['pit', 'cle', 'cin'],
  buf: ['mia', 'ne', 'nyj', 'kc'],
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
// OVERBET HOOKS - Betting angle, ragebait
// ============================================

const OVERBET_HOOKS = [
  // Direct betting callouts
  "Stop betting on these players. Seriously.",
  "The most overbet players in the league right now",
  "Public money LOVES these guys. Sharps don't.",
  "If you're betting these props, you're burning cash",
  "The market is WAY too high on these players",
  "Vegas thanks you for betting these names",
  "These players are trap bets every single week",
  "Line moves tell the truth. These players are cooked.",
  "Books love when you bet on these guys",
  "The public keeps falling for these names",

  // Ragebait energy
  "Your favorite player is a public trap",
  "Stop forcing these prop bets. They don't hit.",
  "Sharps have been fading these guys all season",
  "The data says FADE. The public says BET. Guess who wins?",
  "These are the trap plays of the week",
  "Everyone bets on them. Nobody cashes.",
  "Name recognition ≠ good betting value",
  "Stop letting ESPN picks influence your bets",
  "The most overvalued players in sports betting",
  "Casual bettors love these guys. That's the problem.",

  // Confrontational
  "I'm sorry but these players are public traps",
  "Tag a friend who keeps betting these guys",
  "If your guy is on this list... fade him",
  "This is gonna make some people mad",
  "Some of y'all need to hear this about your bets",
  "The takes they're not ready for",
  "Prepare to be triggered by this list",
  "Your 'locks' are everyone else's locks too",
  "Why do you think the line is where it is?",
  "Smart money moved away. Public money stayed.",

  // Sharp energy
  "The market is telling you something. Listen.",
  "These lines are inflated because of public perception",
  "When everyone bets one side, fade that side",
  "Overbet = overpriced. Simple math.",
  "The names carry more weight than the numbers",
  "Stop betting reputations. Start betting stats.",
  "These players are living off last season's hype",
  "Recency bias is killing your bankroll",
  "The public always finds a way to overpay",
  "Sharp indicators say FADE on all of these",
]

// ============================================
// CTA TEXTS
// ============================================

const CTA_TEXTS = [
  "Find better value plays on Bet.AI.",
  "Sharps use Bet.AI. You should too.",
  "Stop overbet traps. Get Bet.AI.",
  "Bet.AI shows you who to fade.",
  "More overbet alerts on Bet.AI.",
]

function getRandomHook(): string {
  return OVERBET_HOOKS[Math.floor(Math.random() * OVERBET_HOOKS.length)]
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

interface OverbetPlayer {
  playerName: string
  playerId: string | number
  team: string
  teamCode: string
  position: string
  isOwnTeam: boolean
  overbetReasons: [string, string, string]
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
  const team = SOCCER_TEAMS.find(t => t.code.toUpperCase() === code.toUpperCase())
  return team?.id || null
}

// ============================================
// API FETCHING
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

    return players
      .filter(p => p.appearances >= 3)
      .sort((a, b) => b.appearances - a.appearances)
  } catch (error) {
    console.error(`Soccer stats error for team ${teamId}:`, error)
    return []
  }
}

// ============================================
// OVERBET ANALYSIS FUNCTIONS
// Focus on betting angle - why public loves them, why sharps fade
// ============================================

function analyzeNBAOverbet(player: any, teamName: string, teamCode: string, isOwnTeam: boolean): OverbetPlayer {
  const ppg = player.pointsAverage || 10
  const fgPct = player.fgPercentage || 42
  const ftPct = player.ftPercentage || 70
  const tov = player.turnoversAverage || 2
  const ast = player.assistsAverage || 2

  // ALWAYS generate content - no early returns
  const overbetReasons: string[] = []

  // First reason - public perception vs reality
  if (ppg >= 20) {
    overbetReasons.push(`${ppg} PPG sounds elite. Lines are priced like he's prime MJ.`)
  } else if (ppg >= 15) {
    overbetReasons.push(`${ppg} PPG gets public action. Sharps see a mid player.`)
  } else {
    overbetReasons.push(`Name recognition carrying his props way too high`)
  }

  // Second reason - efficiency concerns
  if (fgPct < 45) {
    overbetReasons.push(`${fgPct}% FG - volume shooter, not efficient scorer`)
  } else if (ftPct < 75 && ppg >= 15) {
    overbetReasons.push(`${ftPct}% FT - leaving points at the line every game`)
  } else if (tov >= 3) {
    overbetReasons.push(`${tov} turnovers/game - high usage, high variance`)
  } else if (ast < 3 && ppg >= 15) {
    overbetReasons.push(`Only ${ast} assists - one dimensional scoring`)
  } else {
    overbetReasons.push(`Usage rate inflates his numbers artificially`)
  }

  // Third reason - betting specific
  const thirdReasons = [
    `Public hammers his overs. Books adjust. You lose.`,
    `Line moves against his props all week. FADE.`,
    `Casual bettors see the name. Sharps see the numbers.`,
    `His props are juiced because of public perception`,
    `Vegas knows the public will bet him regardless`,
    `Recency bias trap - one good game, 3 bad ones`,
    `Primetime player? More like primetime fade.`,
    `Twitter hype inflates his lines every single game`,
  ]
  overbetReasons.push(thirdReasons[Math.floor(Math.random() * thirdReasons.length)])

  return {
    playerName: player.name || 'Unknown Player',
    playerId: player.playerId,
    team: teamName,
    teamCode: teamCode,
    position: player.position || 'G',
    isOwnTeam,
    overbetReasons: overbetReasons.slice(0, 3) as [string, string, string],
  }
}

function analyzeNFLQBOverbet(qb: any, teamName: string, teamCode: string, isOwnTeam: boolean): OverbetPlayer {
  const ypg = qb.yardsPerGame || 200
  const ints = qb.interceptions || 5
  const compPct = qb.completionPct || 62
  const rating = qb.qbRating || 85

  // ALWAYS generate content - no early returns
  const overbetReasons: string[] = []

  // First reason - name value
  if (ypg >= 250) {
    overbetReasons.push(`${ypg.toFixed(0)} YPG gets the public hyped. Lines are inflated.`)
  } else {
    overbetReasons.push(`Household name, but production doesn't match the hype`)
  }

  // Second reason - efficiency
  if (ints >= 8) {
    overbetReasons.push(`${ints} INTs this season - turnover machine alert`)
  } else if (compPct < 64) {
    overbetReasons.push(`${compPct.toFixed(1)}% completion - checkdown merchant`)
  } else if (rating < 90) {
    overbetReasons.push(`${rating.toFixed(1)} passer rating - not the elite everyone thinks`)
  } else {
    overbetReasons.push(`Volume stats hide the inefficiency`)
  }

  // Third reason - betting angle
  const thirdReasons = [
    `Public loves QB props. Books love taking their money.`,
    `His passing yards over is the most bet prop weekly`,
    `Sharps fade him in primetime. You should too.`,
    `Fantasy production ≠ betting value`,
    `Props inflated by name recognition alone`,
    `The public keeps pushing this line up for you`,
  ]
  overbetReasons.push(thirdReasons[Math.floor(Math.random() * thirdReasons.length)])

  return {
    playerName: qb.name || 'Unknown Player',
    playerId: qb.id,
    team: teamName,
    teamCode: teamCode,
    position: 'QB',
    isOwnTeam,
    overbetReasons: overbetReasons.slice(0, 3) as [string, string, string],
  }
}

function analyzeNFLReceiverOverbet(receiver: any, teamName: string, teamCode: string, isOwnTeam: boolean): OverbetPlayer {
  const ypg = receiver.yardsPerGame || 30
  const tds = receiver.receivingTouchdowns || 1
  const targets = receiver.targets || 20
  const receptions = receiver.receptions || 10

  // ALWAYS generate content - no early returns
  const overbetReasons: string[] = []

  // First reason
  if (ypg >= 70) {
    overbetReasons.push(`${ypg.toFixed(0)} YPG - public sees "elite WR1". Books see $$$.`)
  } else {
    overbetReasons.push(`Gets WR1 action but production says otherwise`)
  }

  // Second reason
  const catchRate = targets > 0 ? ((receptions / targets) * 100).toFixed(1) : '50'
  if (parseFloat(String(catchRate)) < 65) {
    overbetReasons.push(`${catchRate}% catch rate - drops killing your overs`)
  } else if (tds < 3) {
    overbetReasons.push(`Only ${tds} TDs - red zone ghost`)
  } else {
    overbetReasons.push(`Volume dependent - inconsistent week to week`)
  }

  // Third reason
  const thirdReasons = [
    `His receiving yards over is a public trap weekly`,
    `Fantasy darling. Betting nightmare.`,
    `Name value >>> actual betting value`,
    `Sharps have been fading him all season`,
    `The line moves because casuals keep betting him`,
    `Boom/bust player = overpriced props`,
  ]
  overbetReasons.push(thirdReasons[Math.floor(Math.random() * thirdReasons.length)])

  return {
    playerName: receiver.name || 'Unknown Player',
    playerId: receiver.id,
    team: teamName,
    teamCode: teamCode,
    position: 'WR',
    isOwnTeam,
    overbetReasons: overbetReasons.slice(0, 3) as [string, string, string],
  }
}

function analyzeNFLRusherOverbet(rusher: any, teamName: string, teamCode: string, isOwnTeam: boolean): OverbetPlayer {
  const ypg = rusher.yardsPerGame || 40
  const tds = rusher.rushingTouchdowns || 2
  const ypc = rusher.yardsPerRush || 3.8

  // ALWAYS generate content - no early returns
  const overbetReasons: string[] = []

  // First reason
  overbetReasons.push(`${ypg.toFixed(0)} YPG but the line is set even higher. Classic trap.`)

  // Second reason
  if (ypc < 4.0) {
    overbetReasons.push(`${ypc.toFixed(1)} YPC - inefficient runner, volume dependent`)
  } else if (tds < 4) {
    overbetReasons.push(`Only ${tds} rushing TDs - vulture backs steal his scores`)
  } else {
    overbetReasons.push(`Game script dependent - blowouts kill his touches`)
  }

  // Third reason
  const thirdReasons = [
    `RB rushing props are the biggest public traps`,
    `Casuals see the name, not the matchup`,
    `Sharps fade RBs against stacked boxes`,
    `His over is bet by 80% of the public. FADE.`,
    `Committee back disguised as a workhorse`,
  ]
  overbetReasons.push(thirdReasons[Math.floor(Math.random() * thirdReasons.length)])

  return {
    playerName: rusher.name || 'Unknown Player',
    playerId: rusher.id,
    team: teamName,
    teamCode: teamCode,
    position: 'RB',
    isOwnTeam,
    overbetReasons: overbetReasons.slice(0, 3) as [string, string, string],
  }
}

function analyzeSoccerOverbet(player: any, teamName: string, teamCode: string, isOwnTeam: boolean): OverbetPlayer {
  const goals = player.goals || 0
  const appearances = player.appearances || 1
  const gpg = player.goalsPerGame || 0
  const shotAccuracy = player.shotAccuracy || 30
  const position = player.position || 'Unknown'

  // ALWAYS generate content - no early returns
  const isAttacker = ['Attacker', 'Forward'].includes(position)
  const isMidfielder = position === 'Midfielder'

  const overbetReasons: string[] = []

  // First reason - perception vs reality
  if (isAttacker) {
    if (gpg >= 0.5) {
      overbetReasons.push(`${gpg.toFixed(2)} goals/game sounds good. Anytime scorer is still -150.`)
    } else {
      overbetReasons.push(`${goals} goals in ${appearances} games - but priced like a guaranteed scorer`)
    }
  } else if (isMidfielder) {
    overbetReasons.push(`Midfield hype. Anytime scorer odds way too short.`)
  } else {
    overbetReasons.push(`Name value way higher than actual output`)
  }

  // Second reason - efficiency
  if (shotAccuracy < 45 && player.shotsTotal > 10) {
    overbetReasons.push(`${shotAccuracy}% shot accuracy - volume shooter, not clinical`)
  } else if (player.shotsTotal < 15 && appearances > 5) {
    overbetReasons.push(`Only ${player.shotsTotal} shots - not getting enough chances`)
  } else {
    overbetReasons.push(`Xg stats don't match the public perception`)
  }

  // Third reason - betting angle
  const thirdReasons = [
    `Casuals bet the name. Sharps fade the price.`,
    `His anytime scorer market is always overpriced`,
    `Public money keeps pushing his odds shorter`,
    `Big club bias inflating his lines`,
    `One hat-trick and now he's priced like prime Messi`,
    `Media hype carrying the odds, not the performance`,
    `FPL points ≠ betting value`,
  ]
  overbetReasons.push(thirdReasons[Math.floor(Math.random() * thirdReasons.length)])

  return {
    playerName: player.name || 'Unknown Player',
    playerId: player.playerId,
    team: teamName,
    teamCode: teamCode,
    position: player.position || 'Unknown',
    isOwnTeam,
    overbetReasons: overbetReasons.slice(0, 3) as [string, string, string],
  }
}

// ============================================
// CAPTION GENERATOR
// ============================================

function generateCaption(league: string): string {
  const captions = [
    `The most overbet players in the ${league} right now.\n\nStop losing money on these names.\n\n#${league} #SportsBetting #Overbet #BetAI`,
    `Public money loves these guys. That's exactly why you should fade them.\n\n#${league} #SharpBetting #Fade #BetAI`,
    `These players are trap bets every single week. You've been warned.\n\n#${league} #BettingTips #TrapBet #BetAI`,
    `Name recognition ≠ betting value. Fade the public.\n\n#${league} #SportsBetting #SharpMoney #BetAI`,
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
      return new Response(JSON.stringify({ error: 'Team is required for Overbet analysis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    console.log(`Generating Overbet: league=${league}, team=${team}`)

    // Get rival teams - we'll use 1 rival
    const rivalTeamCodes = getRivalTeams(league, team)
    const selectedRival = rivalTeamCodes[0]
    console.log(`Selected rival: ${selectedRival}`)

    const overbetPlayers: OverbetPlayer[] = []

    // Fetch from OWN TEAM first - analyze functions now always return players
    if (league === 'NBA') {
      const ownTeamId = getNBATeamIdFromCode(team)
      if (ownTeamId) {
        const stats = await getNBAPlayerStats(ownTeamId)
        const teamName = getTeamName(league, team)
        const teamCode = team.toLowerCase()
        for (const player of stats.slice(0, 3)) {
          overbetPlayers.push(analyzeNBAOverbet(player, teamName, teamCode, true))
        }
      }

      // Then RIVAL TEAM
      const rivalTeamId = getNBATeamIdFromCode(selectedRival)
      if (rivalTeamId) {
        const stats = await getNBAPlayerStats(rivalTeamId)
        const teamName = getTeamName(league, selectedRival)
        const teamCode = selectedRival.toLowerCase()
        for (const player of stats.slice(0, 3)) {
          overbetPlayers.push(analyzeNBAOverbet(player, teamName, teamCode, false))
        }
      }
    } else if (league === 'NFL') {
      // OWN TEAM
      const ownStatpalCode = getNFLTeamStatpalCode(team) || team
      const ownStats = await getNFLPlayerStats(ownStatpalCode)
      if (ownStats) {
        const teamName = getTeamName(league, team)
        const teamCode = ownStatpalCode.toLowerCase()
        if (ownStats.passing) {
          overbetPlayers.push(analyzeNFLQBOverbet(ownStats.passing, teamName, teamCode, true))
        }
        for (const receiver of ownStats.receiving.slice(0, 1)) {
          overbetPlayers.push(analyzeNFLReceiverOverbet(receiver, teamName, teamCode, true))
        }
        for (const rusher of ownStats.rushing.slice(0, 1)) {
          overbetPlayers.push(analyzeNFLRusherOverbet(rusher, teamName, teamCode, true))
        }
      }

      // RIVAL TEAM
      const rivalStatpalCode = getNFLTeamStatpalCode(selectedRival) || selectedRival
      const rivalStats = await getNFLPlayerStats(rivalStatpalCode)
      if (rivalStats) {
        const teamName = getTeamName(league, selectedRival)
        const teamCode = rivalStatpalCode.toLowerCase()
        if (rivalStats.passing) {
          overbetPlayers.push(analyzeNFLQBOverbet(rivalStats.passing, teamName, teamCode, false))
        }
        for (const receiver of rivalStats.receiving.slice(0, 1)) {
          overbetPlayers.push(analyzeNFLReceiverOverbet(receiver, teamName, teamCode, false))
        }
        for (const rusher of rivalStats.rushing.slice(0, 1)) {
          overbetPlayers.push(analyzeNFLRusherOverbet(rusher, teamName, teamCode, false))
        }
      }
    } else if (league === 'SOCCER') {
      // OWN TEAM
      const ownTeamId = getSoccerTeamIdFromCode(team)
      if (ownTeamId) {
        const stats = await getSoccerPlayerStats(ownTeamId)
        const teamName = getTeamName(league, team)
        const teamCode = team.toLowerCase()
        for (const player of stats.slice(0, 3)) {
          overbetPlayers.push(analyzeSoccerOverbet(player, teamName, teamCode, true))
        }
      }

      // RIVAL TEAM
      const rivalTeamId = getSoccerTeamIdFromCode(selectedRival)
      if (rivalTeamId) {
        const stats = await getSoccerPlayerStats(rivalTeamId)
        const teamName = getTeamName(league, selectedRival)
        const teamCode = selectedRival.toLowerCase()
        for (const player of stats.slice(0, 3)) {
          overbetPlayers.push(analyzeSoccerOverbet(player, teamName, teamCode, false))
        }
      }
    }

    // If no players found from API, use fallback mock players
    if (overbetPlayers.length === 0) {
      console.log('No players from API, using fallback mock players')
      const ownTeamName = getTeamName(league, team)
      const rivalTeamName = getTeamName(league, selectedRival)
      const ownTeamCode = team.toLowerCase()
      const rivalTeamCode = selectedRival.toLowerCase()

      if (league === 'NBA') {
        const mockOwn = [
          { name: 'Star Guard', pointsAverage: 22, fgPercentage: 44, ftPercentage: 78, turnoversAverage: 3, assistsAverage: 5, position: 'G' },
          { name: 'Power Forward', pointsAverage: 16, fgPercentage: 48, ftPercentage: 72, turnoversAverage: 2, assistsAverage: 2, position: 'F' },
        ]
        const mockRival = [
          { name: 'Rival Star', pointsAverage: 24, fgPercentage: 43, ftPercentage: 80, turnoversAverage: 4, assistsAverage: 6, position: 'G' },
          { name: 'Rival Big', pointsAverage: 18, fgPercentage: 50, ftPercentage: 65, turnoversAverage: 2, assistsAverage: 1, position: 'C' },
        ]
        for (const p of mockOwn) overbetPlayers.push(analyzeNBAOverbet(p, ownTeamName, ownTeamCode, true))
        for (const p of mockRival) overbetPlayers.push(analyzeNBAOverbet(p, rivalTeamName, rivalTeamCode, false))
      } else if (league === 'NFL') {
        const mockOwnQB = { name: 'Our QB', yardsPerGame: 260, passingTouchdowns: 20, interceptions: 8, completionPct: 65, qbRating: 92 }
        const mockOwnWR = { name: 'Our WR1', yardsPerGame: 70, receivingTouchdowns: 5, targets: 100, receptions: 65 }
        const mockRivalQB = { name: 'Their QB', yardsPerGame: 245, passingTouchdowns: 18, interceptions: 12, completionPct: 62, qbRating: 85 }
        const mockRivalRB = { name: 'Their RB', yardsPerGame: 60, rushingTouchdowns: 6, yardsPerRush: 4.2 }
        overbetPlayers.push(analyzeNFLQBOverbet(mockOwnQB, ownTeamName, ownTeamCode, true))
        overbetPlayers.push(analyzeNFLReceiverOverbet(mockOwnWR, ownTeamName, ownTeamCode, true))
        overbetPlayers.push(analyzeNFLQBOverbet(mockRivalQB, rivalTeamName, rivalTeamCode, false))
        overbetPlayers.push(analyzeNFLRusherOverbet(mockRivalRB, rivalTeamName, rivalTeamCode, false))
      } else if (league === 'SOCCER') {
        const mockOwn = [
          { name: 'Our Striker', goals: 10, appearances: 22, goalsPerGame: 0.45, shotAccuracy: 45, position: 'Forward' },
          { name: 'Our Midfielder', goals: 4, appearances: 20, goalsPerGame: 0.2, shotAccuracy: 35, position: 'Midfielder' },
        ]
        const mockRival = [
          { name: 'Their Star', goals: 12, appearances: 24, goalsPerGame: 0.5, shotAccuracy: 48, position: 'Forward' },
          { name: 'Their Winger', goals: 6, appearances: 22, goalsPerGame: 0.27, shotAccuracy: 40, position: 'Forward' },
        ]
        for (const p of mockOwn) overbetPlayers.push(analyzeSoccerOverbet(p, ownTeamName, ownTeamCode, true))
        for (const p of mockRival) overbetPlayers.push(analyzeSoccerOverbet(p, rivalTeamName, rivalTeamCode, false))
      }
    }

    // Shuffle to mix own team and rival players
    for (let i = overbetPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[overbetPlayers[i], overbetPlayers[j]] = [overbetPlayers[j], overbetPlayers[i]]
    }

    const selectedPlayers = overbetPlayers.slice(0, Math.min(6, overbetPlayers.length))

    // Build slides
    const slides: SlideData[] = [
      {
        screenNumber: 1,
        isHook: true,
        textOverlay: [getRandomHook()],
        imagePath: getRandomHookImage(),
      },
    ]

    for (let i = 0; i < selectedPlayers.length; i++) {
      const player = selectedPlayers[i]
      // Use player headshots from downloaded images
      let playerImagePath: string
      const normalizedName = normalizePlayerNameForImage(player.playerName, league)
      if (league === 'NBA') {
        playerImagePath = `/images/nba-players/${player.teamCode}/${normalizedName}.png`
      } else if (league === 'SOCCER') {
        // Validate EPL player has image
        const hasImage = EPL_PLAYERS_WITH_IMAGES.has(normalizedName)
        if (!hasImage) {
          console.log(`EPL player image not found: ${player.playerName} -> ${normalizedName}`)
        }
        playerImagePath = `/images/epl-players/${player.teamCode}/${normalizedName}.png`
      } else {
        playerImagePath = `/slides/${league.toLowerCase()}/${player.playerName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`
      }
      slides.push({
        screenNumber: i + 2,
        isHook: false,
        textOverlay: ['OVERBET', player.playerName, ...player.overbetReasons],
        imagePath: playerImagePath,
      })
    }

    // Add CTA slide
    slides.push({
      screenNumber: selectedPlayers.length + 2,
      isHook: false,
      isCTA: true,
      textOverlay: ['CTA', getRandomCTA()],
      imagePath: getRandomBetAIImage(),
    })

    const result = {
      slides,
      caption: generateCaption(league),
      league,
      accountTeam: team,
      rivalTeam: selectedRival,
      generatedAt: new Date().toISOString(),
    }

    console.log(`Generated ${slides.length} slides for Overbet`)

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
