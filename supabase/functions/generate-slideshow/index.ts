import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// API Configuration - loaded from environment variables (same as other edge functions)
const STATPAL_API_KEY = Deno.env.get('STATPAL_API_KEY')!
const STATPAL_BASE_URL = 'https://statpal.io/api/v1'
const API_SPORTS_KEY = Deno.env.get('API_SPORTS_KEY')!

// Team data
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

// Helper to get NBA team code from team ID string
function getNBATeamCode(teamIdStr: string): string {
  const teamId = parseInt(teamIdStr)
  const team = NBA_TEAMS.find(t => t.id === teamId)
  return team?.code?.toLowerCase() || teamIdStr.toLowerCase()
}

// Helper to get Soccer team code from team ID string
function getSoccerTeamCode(teamIdStr: string): string {
  const teamId = parseInt(teamIdStr)
  const team = SOCCER_TEAMS.find(t => t.id === teamId)
  return team?.code?.toLowerCase() || teamIdStr.toLowerCase()
}

// Hooks
const TARGET_AVOID_HOOKS = [
  // Original hooks
  "Players to target and avoid this week",
  "Who's cooking and who's cooked?",
  "Your lineup is wrong if you have these players...",
  "The data says target these, avoid those",
  "Stats don't lie - here's who to play",
  "Stop losing money on these players",
  "The props the books don't want you to know",
  "Sharps are all over these players",
  "These players are printing money right now",
  "Lock of the week vs trap of the week",
  "Last chance to fix your lineup",
  "Everyone's fading these players for a reason",
  "The market is sleeping on these guys",
  "Book it - these props are hitting",
  "Don't make these mistakes again",
  "Target these players, fade these players",
  "Who's hot and who's not this week",
  "The only props you need to know about",
  "My best bets for this week",
  "Winners and losers - player props edition",

  // Core direct hooks
  "You don't need more picks. You need better ones.",
  "Same slate. Very different outcomes.",
  "If you get these wrong, it doesn't matter what else you do.",
  "Yes, I'm fading these. No, I don't care.",

  // Ego + Status (IYKYK Energy)
  "This is how sharp players think about this slate.",
  "This list isn't for everyone.",
  "Most people won't play it this way.",
  "If you know, you know.",
  "There's levels to this.",
  "This is the edge people ignore.",
  "Same names. Different logic.",
  "Not all 'good plays' are actually good.",
  "This is why context beats hype.",
  "This is what the numbers actually say.",
  "This is how edges are actually created.",
  "Most people are playing names. I'm playing spots.",
  "This is what discipline looks like.",
  "The difference between good and profitable.",
  "This is where sharps separate.",
  "You don't need hot takes. You need restraint.",
  "Same board. Different read.",
  "This isn't vibes. It's process.",
  "This is why consensus is expensive.",
  "You don't win by copying the field.",

  // Contrarian / Rage-bait
  "Everyone's calling him a lock. That's cute.",
  "If he's your sleeper, you're late.",
  "This 'can't miss' spot is very missable.",
  "The field is piling in. I'm stepping out.",
  "This is the square side of the board.",
  "Public money loves this. I don't.",
  "There's a reason this line exists.",
  "This is bait.",
  "If you're heavy on this, you're overconfident.",
  "I've seen this movie before.",

  // Sleepers / Draft / Board talk
  "This is where value actually lives.",
  "Late-round brain, early-round patience.",
  "This is how you steal leverage.",
  "Stop reaching. Start reading.",
  "This is a spot sharps circle.",
  "There's free equity here.",
  "This is why ADP lies.",
  "This is a leverage play, not a hero play.",
  "You don't need a miracle. You need this.",
  "This is how you lap the field.",

  // Ultra-reusable
  "This isn't obvious. That's why it works.",
  "Most people won't have the patience for this.",
  "This is uncomfortable for a reason.",
  "This is where discipline pays.",
  "Not flashy. Very effective.",
  "This is how edges compound.",
  "This is where people get greedy.",

  // FOMO + Fear (CTA-driven, clear what post is about)
  "Who to target — and who to stay away from — this slate.",
  "These are the players you want exposure to… and the ones you don't.",
  "Some of these are must-targets. Others are hard avoids.",
  "Target these spots. Fade these traps.",
  "Where the edge is — and where the risk is — this week.",
  "The right side and the wrong side of this slate.",
  "Who I'm buying into — and who I'm fading.",
  "These are the spots I want. These are the ones I'm avoiding.",
  "Good spots vs bad spots. Simple as that.",
  "Where I'm leaning in… and where I'm stepping out.",
  "If you're targeting the wrong side of these, you're dead.",
  "Target these if you want upside. Avoid these if you want to survive.",
  "These targets have juice. These avoids have teeth.",
  "This is where people overexpose themselves.",
  "Some of these look safe. They're not.",
  "This is where bad exposure sneaks in.",
  "You don't need all of these — just the right ones.",
  "This is how I'm managing exposure this week.",
  "Where I'm pressing — and where I'm protecting.",
  "These decisions matter more than the rest.",

  // Contrarian + Action (comment-bait but obvious)
  "Yes, I'm targeting these. Yes, I'm fading these.",
  "The field is heavy on these. I'm not.",
  "Public targets vs sharp avoids.",
  "Consensus loves these. I'm staying away.",
  "Some popular names didn't make my target list.",
  "I'm higher on these than most — and lower on these than everyone.",
  "This is where I'm disagreeing with the board.",
  "Targets I like. Fades I'm firm on.",
  "This is how I'm playing it — take it or leave it.",
  "If you're on the opposite side of these, good luck.",

  // Ego + Status (explicit)
  "How sharp players decide who to target and who to avoid.",
  "This is how I'm separating targets from traps.",
  "Same names. Very different exposure.",
  "This is how discipline shows up in your picks.",
  "Not every 'good play' is a target.",
  "This is how I'm filtering the slate.",
  "Where the value is — and where it isn't.",
  "This is the difference between action and edge.",
  "Targets with leverage. Avoids with downside.",
  "This is what my card actually looks like.",
]

// CTA texts for final slide
const CTA_TEXTS = [
  "Full target/avoid breakdown on Bet.AI.",
  "See the full slate on Bet.AI.",
  "More stats here: Bet.AI",
  "Bet.AI for full player stats & props",
]

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

// Types
interface PlayerInsight {
  playerName: string
  playerId: string | number
  team: string
  teamCode: string  // lowercase team code for image paths
  position: string
  verdict: 'TARGET' | 'AVOID'
  propType: string
  reasons: [string, string, string]
  confidence: 'High' | 'Medium' | 'Low'
}

interface SlideData {
  screenNumber: number
  // imagePath: Placeholder paths for hook/player slides (not actual files)
  // Frontend shows placeholder UI when paths start with /slides/
  // Only CTA slides have real images at /images/bet-apps/apps/betai/
  imagePath: string
  textOverlay: string[]
  isHook?: boolean
  isCTA?: boolean
}

// Helper functions
function getRandomHook(): string {
  return TARGET_AVOID_HOOKS[Math.floor(Math.random() * TARGET_AVOID_HOOKS.length)]
}

function getTeamName(league: string, teamCode: string): string {
  const teams = league === 'NFL' ? NFL_TEAMS : league === 'NBA' ? NBA_TEAMS : SOCCER_TEAMS
  const team = teams.find(t =>
    t.code?.toLowerCase() === teamCode.toLowerCase() ||
    (t as any).statpalCode === teamCode.toLowerCase() ||
    String(t.id) === teamCode
  )
  return team?.name || teamCode.toUpperCase()
}

function getRandomTeam(league: string, excludeTeam?: string): string {
  const teams = league === 'NFL' ? NFL_TEAMS : league === 'NBA' ? NBA_TEAMS : SOCCER_TEAMS
  const filtered = excludeTeam
    ? teams.filter(t => t.code !== excludeTeam && (t as any).statpalCode !== excludeTeam && String(t.id) !== excludeTeam)
    : teams
  const team = filtered[Math.floor(Math.random() * filtered.length)]
  if (league === 'NFL') return (team as any).statpalCode || team.code.toLowerCase()
  return String(team.id)
}

// Convert soccer team code (like "arsenal", "liverpool") to API ID
function getSoccerTeamIdFromCode(code: string): number | null {
  const team = SOCCER_TEAMS.find(t => t.code.toLowerCase() === code.toLowerCase())
  return team?.id || null
}

// Get the current NFL season year (season starts in September)
function getCurrentNFLSeason(): number {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() // 0-indexed (0 = January, 8 = September)
  // If we're before September, we're in the previous year's season
  return month < 8 ? year - 1 : year
}

// Get NFL season start date (Thursday after Labor Day = first Monday of September)
function getNFLSeasonStart(year: number): Date {
  // Find first Monday of September
  const sept1 = new Date(Date.UTC(year, 8, 1)) // September 1st
  const dayOfWeek = sept1.getUTCDay() // 0 = Sunday, 1 = Monday, etc.
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 8 - dayOfWeek)
  const laborDay = new Date(Date.UTC(year, 8, 1 + daysUntilMonday))
  // Thursday after Labor Day (Labor Day + 3 days)
  const seasonStart = new Date(laborDay.getTime() + 3 * 24 * 60 * 60 * 1000)
  return seasonStart
}

// Calculate current NFL week (1-18)
function getCurrentNFLWeek(): number {
  const season = getCurrentNFLSeason()
  const seasonStart = getNFLSeasonStart(season)
  const now = Date.now()
  const weeksSinceStart = Math.floor((now - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
  // Clamp to 1-18 (regular season) or allow up to 22 for playoffs
  return Math.max(1, Math.min(22, weeksSinceStart))
}

// Get current NBA season year (season runs Oct-June, uses starting year)
// e.g., 2024-25 season = 2024
function getCurrentNBASeason(): number {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() // 0-indexed (0 = January, 9 = October)
  // If we're Jan-Sept, we're in the season that started previous year
  // If we're Oct-Dec, we're in the season that started this year
  return month < 9 ? year - 1 : year
}

// Get current Soccer/EPL season year (season runs Aug-May, uses starting year)
// e.g., 2024-25 season = 2024
function getCurrentSoccerSeason(): number {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() // 0-indexed (0 = January, 7 = August)
  // If we're Jan-July, we're in the season that started previous year
  // If we're Aug-Dec, we're in the season that started this year
  return month < 7 ? year - 1 : year
}

function generateCaption(league: string): string {
  const leagueName = league === 'SOCCER' ? 'Premier League' : league
  const week = league === 'NFL' ? `Week ${getCurrentNFLWeek()} ` : ''

  const captions = [
    `${leagueName} player props breakdown - who to target and who to fade`,
    `These ${leagueName} players are must-plays and must-fades right now`,
    `The stats say it all - ${leagueName} targets and avoids`,
  ]
  const caption = captions[Math.floor(Math.random() * captions.length)]

  const hashtags = league === 'NFL'
    ? '#NFL #NFLPicks #FantasyFootball #BetAI #SportsBetting #PlayerProps'
    : league === 'NBA'
    ? '#NBA #NBAPicks #NBABetting #BetAI #SportsBetting #PlayerProps'
    : '#Soccer #PremierLeague #EPL #BetAI #SportsBetting #PlayerProps'

  return `${week}${caption}\n\n${hashtags}`
}

// NFL Stats Fetching
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

// NBA Stats Fetching
async function getNBAPlayerStats(teamId: number) {
  const season = getCurrentNBASeason()
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

    // Aggregate game stats
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
          totalFgm: 0,
          totalFga: 0,
          totalMin: 0,
        })
      }

      const p = playerMap.get(playerId)!
      p.games++
      p.totalPoints += game.points || 0
      p.totalReb += game.totReb || 0
      p.totalFgm += game.fgm || 0
      p.totalFga += game.fga || 0
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
        fgPercentage: p.totalFga > 0 ? parseFloat(((p.totalFgm / p.totalFga) * 100).toFixed(1)) : 0,
        minutesAverage: parseFloat((p.totalMin / p.games).toFixed(1)),
      })
    }

    return aggregated
      .filter(p => p.pointsAverage > 5 && p.gamesPlayed >= 5)
      .sort((a, b) => b.pointsAverage - a.pointsAverage)
  } catch (error) {
    console.error(`NBA stats error for team ${teamId}:`, error)
    return []
  }
}

// Soccer Stats Fetching
async function getSoccerPlayerStats(teamId: number) {
  const season = getCurrentSoccerSeason()
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
      })
    }

    return players
      .filter(p => p.appearances >= 5)
      .sort((a, b) => b.goals - a.goals)
  } catch (error) {
    console.error(`Soccer stats error for team ${teamId}:`, error)
    return []
  }
}

// Analysis functions
function analyzeNFLReceiver(player: any, teamName: string, teamCode: string): PlayerInsight {
  const ypg = player.yardsPerGame
  const targets = player.targets
  const ypr = player.yardsPerReception
  const over20 = player.over20Yards
  const receptions = player.receptions

  const isTarget = ypg >= 55 && targets >= 40 && ypr >= 10
  const confidence = isTarget ? (ypg >= 70 ? 'High' : 'Medium') : (ypg < 40 ? 'High' : 'Medium')

  const reasons: [string, string, string] = isTarget
    ? [
        `${ypg} receiving yards/game - ${ypg >= 70 ? 'elite' : 'solid'} production`,
        `${(targets / 11).toFixed(1)} targets/game with ${over20} catches over 20 yards`,
        `${ypr} yards/reception - ${ypr >= 13 ? 'explosive playmaker' : 'efficient route runner'}`,
      ]
    : [
        `Only ${ypg} yards/game - ${ypg < 40 ? 'minimal' : 'limited'} production`,
        `${(targets / 11).toFixed(1)} targets/game - ${targets < 40 ? 'low involvement' : 'inconsistent usage'}`,
        ypr < 10 ? `Short routes: ${ypr} yards/reception, limited upside` : `${receptions} receptions on ${targets} targets`,
      ]

  return {
    playerName: player.name,
    playerId: player.id,
    team: teamName,
    teamCode,
    position: 'WR',
    verdict: isTarget ? 'TARGET' : 'AVOID',
    propType: 'Receiving Yards',
    reasons,
    confidence,
  }
}

function analyzeNFLRusher(player: any, teamName: string, teamCode: string): PlayerInsight {
  const ypg = player.yardsPerGame
  const attempts = player.rushingAttempts
  const ypc = player.yardsPerRush
  const over20 = player.over20Yards
  const fumbles = player.fumbles
  const tds = player.rushingTouchdowns

  const isTarget = ypg >= 50 && attempts >= 100 && ypc >= 4.0
  const confidence = isTarget ? (ypg >= 70 ? 'High' : 'Medium') : (ypg < 35 ? 'High' : 'Medium')

  const reasons: [string, string, string] = isTarget
    ? [
        `${ypg} rushing yards/game - ${ypg >= 70 ? 'workhorse' : 'solid'} RB1 volume`,
        `${(attempts / 11).toFixed(1)} carries/game with ${ypc} YPC efficiency`,
        over20 > 0 ? `${over20} explosive runs (20+ yards) - home run threat` : `${tds} rushing TDs - red zone role secured`,
      ]
    : [
        `Only ${ypg} yards/game - ${ypg < 35 ? 'backup' : 'committee'} role`,
        `${(attempts / 11).toFixed(1)} carries/game - limited workload`,
        fumbles > 0 ? `${fumbles} fumbles - ball security concerns` : `${ypc} YPC - ${ypc < 4.0 ? 'inefficient' : 'decent but low volume'}`,
      ]

  return {
    playerName: player.name,
    playerId: player.id,
    team: teamName,
    teamCode,
    position: 'RB',
    verdict: isTarget ? 'TARGET' : 'AVOID',
    propType: 'Rushing Yards',
    reasons,
    confidence,
  }
}

function analyzeNFLPasser(player: any, teamName: string, teamCode: string): PlayerInsight {
  const ypg = player.yardsPerGame
  const compPct = player.completionPct
  const tds = player.passingTouchdowns
  const ints = player.interceptions
  const rating = player.qbRating

  const isTarget = ypg >= 220 && compPct >= 64 && rating >= 90
  const confidence = isTarget ? (ypg >= 250 ? 'High' : 'Medium') : (ypg < 200 ? 'High' : 'Medium')

  const reasons: [string, string, string] = isTarget
    ? [
        `${ypg} passing yards/game average`,
        `${compPct}% completion rate - ${compPct >= 67 ? 'elite' : 'solid'} accuracy`,
        `${rating} QB rating with ${tds} TDs vs ${ints} INTs`,
      ]
    : [
        `Only ${ypg} passing yards/game - ${ypg < 200 ? 'run-first' : 'limited'} scheme`,
        compPct < 64 ? `${compPct}% completion - accuracy concerns` : `Low volume passing attempts`,
        ints > tds / 3 ? `${ints} INTs on ${tds} TDs - turnover prone` : `${rating} QB rating - below average`,
      ]

  return {
    playerName: player.name,
    playerId: player.id,
    team: teamName,
    teamCode,
    position: 'QB',
    verdict: isTarget ? 'TARGET' : 'AVOID',
    propType: 'Passing Yards',
    reasons,
    confidence,
  }
}

function analyzeNBAPoints(player: any, teamName: string, teamCode: string): PlayerInsight {
  const ppg = player.pointsAverage
  const fgPct = player.fgPercentage
  const minutes = player.minutesAverage
  const games = player.gamesPlayed

  const isTarget = ppg >= 18 && fgPct >= 44 && minutes >= 28
  const confidence = isTarget ? (ppg >= 22 ? 'High' : 'Medium') : (ppg < 14 ? 'High' : 'Medium')

  const reasons: [string, string, string] = isTarget
    ? [
        `${ppg} PPG average over ${games} games`,
        `${fgPct}% FG shooting - ${fgPct >= 47 ? 'elite' : 'solid'} efficiency`,
        `${minutes} minutes/game - ${minutes >= 32 ? 'heavy usage, closes games' : 'consistent role'}`,
      ]
    : [
        `Only ${ppg} PPG - ${ppg < 14 ? 'limited' : 'inconsistent'} scoring role`,
        fgPct < 44 ? `${fgPct}% FG shooting - efficiency concerns` : `Only ${minutes} min/game - reduced opportunity`,
        `${games} games played - ${games < 30 ? 'limited sample size' : 'below expectations'}`,
      ]

  return {
    playerName: player.name,
    playerId: player.playerId,
    team: teamName,
    teamCode,
    position: player.position,
    verdict: isTarget ? 'TARGET' : 'AVOID',
    propType: 'Points',
    reasons,
    confidence,
  }
}

function analyzeSoccerGoals(player: any, teamName: string, teamCode: string): PlayerInsight {
  const gpg = player.goalsPerGame
  const goals = player.goals
  const shots = player.shotsTotal
  const accuracy = player.shotAccuracy
  const position = player.position

  const isAttacker = ['Attacker', 'Forward', 'Midfielder'].includes(position)

  // More balanced targeting: 0.15 gpg = 1 goal every ~7 games, or 3+ goals with decent shots
  const isTarget = (gpg >= 0.15 && isAttacker) || (goals >= 3 && shots >= 10) || (gpg >= 0.25)
  const confidence = isTarget ? (gpg >= 0.4 ? 'High' : 'Medium') : (gpg < 0.1 ? 'High' : 'Medium')

  const reasons: [string, string, string] = isTarget
    ? [
        `${goals} goals in ${player.appearances} games (${gpg} goals/game)`,
        `${shots} total shots with ${accuracy}% on target`,
        `${position} role - ${gpg >= 0.4 ? 'clinical finisher' : 'consistent goal threat'}`,
      ]
    : [
        `Only ${goals} goals in ${player.appearances} games (${gpg}/game)`,
        shots < 10 ? `Low volume: only ${shots} shots all season` : `${accuracy}% shot accuracy - finishing concerns`,
        isAttacker ? `Underperforming in ${position} role` : `${position} - not primary goal scorer`,
      ]

  return {
    playerName: player.name,
    playerId: player.playerId,
    team: teamName,
    teamCode,
    position: player.position,
    verdict: isTarget ? 'TARGET' : 'AVOID',
    propType: 'Anytime Goal Scorer',
    reasons,
    confidence,
  }
}

// Main handler
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

    console.log(`Generating slideshow: league=${league}, team=${team || 'random'}`)

    const selectedTeamInsights: PlayerInsight[] = []
    const otherTeamInsights: PlayerInsight[] = []

    // When team is selected: max 3 from that team, rest from random teams
    // When no team selected: pick from 2-3 random teams
    const selectedTeamCode = team
    const otherTeamCodes: string[] = []

    // Get 2-3 other random teams
    let lastTeam = selectedTeamCode
    for (let i = 0; i < 3; i++) {
      const randomTeam = getRandomTeam(league, lastTeam)
      if (!otherTeamCodes.includes(randomTeam)) {
        otherTeamCodes.push(randomTeam)
      }
      lastTeam = randomTeam
    }

    // Helper to get NBA team code from team ID
    const getNBATeamCode = (teamIdStr: string): string => {
      const teamId = parseInt(teamIdStr)
      const team = NBA_TEAMS.find(t => t.id === teamId)
      return team?.code?.toLowerCase() || teamIdStr.toLowerCase()
    }

    // Helper to get Soccer team code from team ID
    const getSoccerTeamCode = (teamIdStr: string): string => {
      const teamId = parseInt(teamIdStr)
      const team = SOCCER_TEAMS.find(t => t.id === teamId)
      return team?.code?.toLowerCase() || teamIdStr.toLowerCase()
    }

    // Fetch and analyze based on league
    if (league === 'NFL') {
      // Selected team (max 3 players)
      if (selectedTeamCode) {
        const stats = await getNFLPlayerStats(selectedTeamCode)
        if (stats) {
          const teamName = getTeamName(league, selectedTeamCode)
          const tCode = selectedTeamCode.toLowerCase()
          for (const receiver of stats.receiving.slice(0, 2)) {
            selectedTeamInsights.push(analyzeNFLReceiver(receiver, teamName, tCode))
          }
          for (const rusher of stats.rushing.slice(0, 1)) {
            selectedTeamInsights.push(analyzeNFLRusher(rusher, teamName, tCode))
          }
        }
      }

      // Other teams
      for (const teamCode of otherTeamCodes) {
        const stats = await getNFLPlayerStats(teamCode)
        if (stats) {
          const teamName = getTeamName(league, teamCode)
          const tCode = teamCode.toLowerCase()
          for (const receiver of stats.receiving.slice(0, 2)) {
            otherTeamInsights.push(analyzeNFLReceiver(receiver, teamName, tCode))
          }
          for (const rusher of stats.rushing.slice(0, 1)) {
            otherTeamInsights.push(analyzeNFLRusher(rusher, teamName, tCode))
          }
          if (stats.passing) {
            otherTeamInsights.push(analyzeNFLPasser(stats.passing, teamName, tCode))
          }
        }
      }
    } else if (league === 'NBA') {
      // Selected team (max 3 players)
      if (selectedTeamCode) {
        const teamId = parseInt(selectedTeamCode)
        const stats = await getNBAPlayerStats(teamId)
        if (stats.length) {
          const teamName = getTeamName(league, selectedTeamCode)
          const tCode = getNBATeamCode(selectedTeamCode)
          for (const player of stats.slice(0, 3)) {
            selectedTeamInsights.push(analyzeNBAPoints(player, teamName, tCode))
          }
        }
      }

      // Other teams
      for (const teamCode of otherTeamCodes) {
        const teamId = parseInt(teamCode)
        const stats = await getNBAPlayerStats(teamId)
        if (stats.length) {
          const teamName = getTeamName(league, teamCode)
          const tCode = getNBATeamCode(teamCode)
          for (const player of stats.slice(0, 3)) {
            otherTeamInsights.push(analyzeNBAPoints(player, teamName, tCode))
          }
        }
      }
    } else if (league === 'SOCCER') {
      // Selected team (max 3 players)
      // Frontend sends team code like "arsenal", need to convert to API ID
      if (selectedTeamCode) {
        const teamId = getSoccerTeamIdFromCode(selectedTeamCode) || parseInt(selectedTeamCode)
        if (teamId) {
          const stats = await getSoccerPlayerStats(teamId)
          if (stats.length) {
            const teamName = getTeamName(league, selectedTeamCode)
            const tCode = selectedTeamCode.toLowerCase()
            for (const player of stats.slice(0, 3)) {
              selectedTeamInsights.push(analyzeSoccerGoals(player, teamName, tCode))
            }
          }
        }
      }

      // Other teams (getRandomTeam returns string IDs for SOCCER)
      for (const teamCode of otherTeamCodes) {
        const teamId = parseInt(teamCode)
        const stats = await getSoccerPlayerStats(teamId)
        if (stats.length) {
          const teamName = getTeamName(league, teamCode)
          const tCode = getSoccerTeamCode(teamCode)
          for (const player of stats.slice(0, 3)) {
            otherTeamInsights.push(analyzeSoccerGoals(player, teamName, tCode))
          }
        }
      }
    }

    // Combine insights: max 3 from selected team + rest from others
    const allInsights = [...selectedTeamInsights.slice(0, 3), ...otherTeamInsights]

    // Sort and select players - MINIMUM 3 targets + 3 avoids
    const targets = allInsights
      .filter(i => i.verdict === 'TARGET')
      .sort((a, b) => (b.confidence === 'High' ? 1 : 0) - (a.confidence === 'High' ? 1 : 0))

    const avoids = allInsights
      .filter(i => i.verdict === 'AVOID')
      .sort((a, b) => (b.confidence === 'High' ? 1 : 0) - (a.confidence === 'High' ? 1 : 0))

    // Ensure minimum 3 of each
    const minTargets = 3
    const minAvoids = 3

    let selectedTargets = targets.slice(0, minTargets)
    let selectedAvoids = avoids.slice(0, minAvoids)

    // If we don't have enough of either, fill from the other pool
    if (selectedTargets.length < minTargets && avoids.length > minAvoids) {
      const extra = avoids.slice(minAvoids, minAvoids + (minTargets - selectedTargets.length))
      selectedTargets = [...selectedTargets, ...extra]
    }
    if (selectedAvoids.length < minAvoids && targets.length > minTargets) {
      const extra = targets.slice(minTargets, minTargets + (minAvoids - selectedAvoids.length))
      selectedAvoids = [...selectedAvoids, ...extra]
    }

    const selectedPlayers = [...selectedTargets, ...selectedAvoids]

    // Shuffle
    for (let i = selectedPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[selectedPlayers[i], selectedPlayers[j]] = [selectedPlayers[j], selectedPlayers[i]]
    }

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
      if (league === 'NBA' && player.teamCode) {
        playerImagePath = `/images/nba-players/${player.teamCode}/${normalizedName}.png`
      } else if (league === 'SOCCER' && player.teamCode) {
        // Validate EPL player has image, otherwise use fallback
        const hasImage = EPL_PLAYERS_WITH_IMAGES.has(normalizedName)
        if (hasImage) {
          playerImagePath = `/images/epl-players/${player.teamCode}/${normalizedName}.png`
        } else {
          console.log(`EPL player image not found: ${player.playerName} -> ${normalizedName}`)
          playerImagePath = `/images/epl-players/${player.teamCode}/${normalizedName}.png`
        }
      } else {
        playerImagePath = `/slides/${league.toLowerCase()}/${player.playerName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`
      }
      slides.push({
        screenNumber: i + 2,
        isHook: false,
        textOverlay: [player.verdict, player.playerName, ...player.reasons],
        imagePath: playerImagePath,
      })
    }

    // Add CTA slide at the end
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
      // Audio URLs: intentionally empty - feature not yet implemented
      // When implemented, these should point to hosted audio files for TikTok/Instagram
      tiktokAudioUrl: '',
      instagramAudioUrl: '',
      league,
      generatedAt: new Date().toISOString(),
    }

    console.log(`Generated ${slides.length} slides`)

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
