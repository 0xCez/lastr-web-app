/**
 * TARGET/AVOID Slideshow Generator
 *
 * Single unified script that outputs ready-to-use slideshow data:
 * - 1 hook slide
 * - 4-7 player slides (TARGET/AVOID with 3 bullet points each)
 * - Caption
 * - Image file paths
 */

import {
  League,
  PlayerInsight,
  NFLReceivingStats,
  NFLRushingStats,
  NFLPassingStats,
  NBAAggregatedStats,
  SoccerPlayerStats,
  GenerateSlideshowRequest,
  SlideshowOutput,
  SlideData,
} from '../types';
import { getNFLPlayerStats } from '../core/statpal';
import { getNBAPlayerStats, getSoccerPlayerStats } from '../core/api-sports';
import { getAllTeams } from '../data/teams';
import { getRandomHook } from '../data/hooks';
import { generateCaption } from '../data/captions';

// ============================================
// NFL ANALYSIS
// ============================================

function analyzeNFLReceiver(player: NFLReceivingStats, teamName: string): PlayerInsight {
  const ypg = player.yardsPerGame;
  const targets = player.targets;
  const ypr = player.yardsPerReception;
  const over20 = player.over20Yards;
  const receptions = player.receptions;

  const isTarget = ypg >= 55 && targets >= 40 && ypr >= 10;

  let reasons: [string, string, string];
  let confidence: 'High' | 'Medium' | 'Low';

  if (isTarget) {
    confidence = ypg >= 70 ? 'High' : 'Medium';
    reasons = [
      `${ypg} receiving yards/game - ${ypg >= 70 ? 'elite' : 'solid'} production`,
      `${(targets / 11).toFixed(1)} targets/game with ${over20} catches over 20 yards`,
      `${ypr} yards/reception - ${ypr >= 13 ? 'explosive playmaker' : 'efficient route runner'}`,
    ];
  } else {
    confidence = ypg < 40 ? 'High' : 'Medium';
    reasons = [
      `Only ${ypg} yards/game - ${ypg < 40 ? 'minimal' : 'limited'} production`,
      `${(targets / 11).toFixed(1)} targets/game - ${targets < 40 ? 'low involvement' : 'inconsistent usage'}`,
      ypr < 10
        ? `Short routes: ${ypr} yards/reception, limited upside`
        : `${receptions} receptions on ${targets} targets - ${((receptions / targets) * 100).toFixed(0)}% catch rate`,
    ];
  }

  return {
    playerName: player.name,
    playerId: player.id,
    team: teamName,
    position: 'WR',
    verdict: isTarget ? 'TARGET' : 'AVOID',
    propType: 'Receiving Yards',
    reasons,
    confidence,
    rawStats: player,
  };
}

function analyzeNFLRusher(player: NFLRushingStats, teamName: string): PlayerInsight {
  const ypg = player.yardsPerGame;
  const attempts = player.rushingAttempts;
  const ypc = player.yardsPerRush;
  const over20 = player.over20Yards;
  const fumbles = player.fumbles;
  const tds = player.rushingTouchdowns;

  const isTarget = ypg >= 50 && attempts >= 100 && ypc >= 4.0;

  let reasons: [string, string, string];
  let confidence: 'High' | 'Medium' | 'Low';

  if (isTarget) {
    confidence = ypg >= 70 ? 'High' : 'Medium';
    reasons = [
      `${ypg} rushing yards/game - ${ypg >= 70 ? 'workhorse' : 'solid'} RB1 volume`,
      `${(attempts / 11).toFixed(1)} carries/game with ${ypc} YPC efficiency`,
      over20 > 0
        ? `${over20} explosive runs (20+ yards) - home run threat`
        : `${tds} rushing TDs - red zone role secured`,
    ];
  } else {
    confidence = ypg < 35 ? 'High' : 'Medium';
    reasons = [
      `Only ${ypg} yards/game - ${ypg < 35 ? 'backup' : 'committee'} role`,
      `${(attempts / 11).toFixed(1)} carries/game - limited workload`,
      fumbles > 0
        ? `${fumbles} fumbles - ball security concerns`
        : `${ypc} YPC - ${ypc < 4.0 ? 'inefficient behind this O-line' : 'decent but low volume'}`,
    ];
  }

  return {
    playerName: player.name,
    playerId: player.id,
    team: teamName,
    position: 'RB',
    verdict: isTarget ? 'TARGET' : 'AVOID',
    propType: 'Rushing Yards',
    reasons,
    confidence,
    rawStats: player,
  };
}

function analyzeNFLPasser(player: NFLPassingStats, teamName: string): PlayerInsight {
  const ypg = player.yardsPerGame;
  const compPct = player.completionPct;
  const tds = player.passingTouchdowns;
  const ints = player.interceptions;
  const rating = player.qbRating;

  const isTarget = ypg >= 220 && compPct >= 64 && rating >= 90;

  let reasons: [string, string, string];
  let confidence: 'High' | 'Medium' | 'Low';

  if (isTarget) {
    confidence = ypg >= 250 ? 'High' : 'Medium';
    reasons = [
      `${ypg} passing yards/game average`,
      `${compPct}% completion rate - ${compPct >= 67 ? 'elite' : 'solid'} accuracy`,
      `${rating} QB rating with ${tds} TDs vs ${ints} INTs`,
    ];
  } else {
    confidence = ypg < 200 ? 'High' : 'Medium';
    reasons = [
      `Only ${ypg} passing yards/game - ${ypg < 200 ? 'run-first' : 'limited'} scheme`,
      compPct < 64
        ? `${compPct}% completion - accuracy concerns`
        : `Low volume: ${player.attempts} attempts over 11 games`,
      ints > tds / 3
        ? `${ints} INTs on ${tds} TDs - turnover prone`
        : `${rating} QB rating - ${rating < 90 ? 'below average' : 'decent but capped'}`,
    ];
  }

  return {
    playerName: player.name,
    playerId: player.id,
    team: teamName,
    position: 'QB',
    verdict: isTarget ? 'TARGET' : 'AVOID',
    propType: 'Passing Yards',
    reasons,
    confidence,
    rawStats: player,
  };
}

// ============================================
// NBA ANALYSIS
// ============================================

function analyzeNBAPoints(player: NBAAggregatedStats, teamName: string): PlayerInsight {
  const ppg = player.pointsAverage;
  const fgPct = player.fgPercentage;
  const minutes = player.minutesAverage;
  const games = player.gamesPlayed;

  const isTarget = ppg >= 18 && fgPct >= 44 && minutes >= 28;

  let reasons: [string, string, string];
  let confidence: 'High' | 'Medium' | 'Low';

  if (isTarget) {
    confidence = ppg >= 22 ? 'High' : 'Medium';
    reasons = [
      `${ppg} PPG average over ${games} games`,
      `${fgPct}% FG shooting - ${fgPct >= 47 ? 'elite' : 'solid'} efficiency`,
      `${minutes} minutes/game - ${minutes >= 32 ? 'heavy usage, closes games' : 'consistent role'}`,
    ];
  } else {
    confidence = ppg < 14 ? 'High' : 'Medium';
    reasons = [
      `Only ${ppg} PPG - ${ppg < 14 ? 'limited' : 'inconsistent'} scoring role`,
      fgPct < 44
        ? `${fgPct}% FG shooting - efficiency concerns`
        : `Only ${minutes} min/game - reduced opportunity`,
      `${games} games played - ${games < 30 ? 'limited sample size' : 'below expectations'}`,
    ];
  }

  return {
    playerName: player.name,
    playerId: player.playerId,
    team: teamName,
    position: player.position,
    verdict: isTarget ? 'TARGET' : 'AVOID',
    propType: 'Points',
    reasons,
    confidence,
    rawStats: player,
  };
}

function analyzeNBARebounds(player: NBAAggregatedStats, teamName: string): PlayerInsight {
  const rpg = player.reboundsAverage;
  const minutes = player.minutesAverage;
  const position = player.position;

  const isBig = ['C', 'PF', 'F-C', 'C-F'].includes(position);
  const threshold = isBig ? 7 : 5;
  const isTarget = rpg >= threshold && minutes >= 25;

  let reasons: [string, string, string];
  let confidence: 'High' | 'Medium' | 'Low';

  if (isTarget) {
    confidence = rpg >= (isBig ? 9 : 6) ? 'High' : 'Medium';
    reasons = [
      `${rpg} RPG average - ${rpg >= 9 ? 'elite' : 'solid'} glass work`,
      `${position} position - ${isBig ? 'primary rebounder role' : 'versatile rebounding guard/wing'}`,
      `${minutes} min/game - ${minutes >= 30 ? 'high volume opportunity' : 'consistent minutes'}`,
    ];
  } else {
    confidence = rpg < 4 ? 'High' : 'Medium';
    reasons = [
      `Only ${rpg} RPG - ${rpg < 4 ? 'minimal' : 'limited'} rebounding production`,
      isBig
        ? `Undersized or perimeter-oriented for ${position}`
        : `${position} - not primary rebounding role`,
      `${minutes} min/game - ${minutes < 25 ? 'limited floor time' : 'not crashing boards'}`,
    ];
  }

  return {
    playerName: player.name,
    playerId: player.playerId,
    team: teamName,
    position: player.position,
    verdict: isTarget ? 'TARGET' : 'AVOID',
    propType: 'Rebounds',
    reasons,
    confidence,
    rawStats: player,
  };
}

// ============================================
// SOCCER ANALYSIS
// ============================================

function analyzeSoccerGoals(player: SoccerPlayerStats, teamName: string): PlayerInsight {
  const gpg = player.goalsPerGame;
  const goals = player.goals;
  const shots = player.shotsTotal;
  const accuracy = player.shotAccuracy;
  const position = player.position;

  const isAttacker = ['Attacker', 'Forward', 'Midfielder'].includes(position);
  const isTarget = gpg >= 0.3 && shots >= 20 && isAttacker;

  let reasons: [string, string, string];
  let confidence: 'High' | 'Medium' | 'Low';

  if (isTarget) {
    confidence = gpg >= 0.5 ? 'High' : 'Medium';
    reasons = [
      `${goals} goals in ${player.appearances} games (${gpg} goals/game)`,
      `${shots} total shots with ${accuracy}% on target`,
      `${position} role - ${gpg >= 0.5 ? 'clinical finisher' : 'consistent goal threat'}`,
    ];
  } else {
    confidence = gpg < 0.15 ? 'High' : 'Medium';
    reasons = [
      `Only ${goals} goals in ${player.appearances} games (${gpg}/game)`,
      shots < 20
        ? `Low volume: only ${shots} shots all season`
        : `${accuracy}% shot accuracy - finishing concerns`,
      isAttacker
        ? `Underperforming in ${position} role`
        : `${position} - not primary goal scorer`,
    ];
  }

  return {
    playerName: player.name,
    playerId: player.playerId,
    team: teamName,
    position: player.position,
    verdict: isTarget ? 'TARGET' : 'AVOID',
    propType: 'Anytime Goal Scorer',
    reasons,
    confidence,
    rawStats: player,
  };
}

function analyzeSoccerCards(player: SoccerPlayerStats, teamName: string): PlayerInsight {
  const yellows = player.yellowCards;
  const apps = player.appearances;
  const cardsPerGame = apps > 0 ? yellows / apps : 0;
  const position = player.position;

  const isPhysicalPosition = ['Defender', 'Midfielder'].includes(position);
  const isTarget = cardsPerGame >= 0.25 && yellows >= 3;

  let reasons: [string, string, string];
  let confidence: 'High' | 'Medium' | 'Low';

  if (isTarget) {
    confidence = cardsPerGame >= 0.35 ? 'High' : 'Medium';
    reasons = [
      `${yellows} yellow cards in ${apps} games (${cardsPerGame.toFixed(2)}/game)`,
      `${position} - ${isPhysicalPosition ? 'physical, tackles often' : 'aggressive style'}`,
      `Card magnet - ${cardsPerGame >= 0.35 ? 'bookings expected' : 'high card rate'}`,
    ];
  } else {
    confidence = cardsPerGame < 0.1 ? 'High' : 'Medium';
    reasons = [
      `Only ${yellows} yellows in ${apps} games (${cardsPerGame.toFixed(2)}/game)`,
      isPhysicalPosition
        ? `Disciplined for a ${position}`
        : `${position} - minimal defensive contact`,
      `Clean player - ${yellows < 3 ? 'rarely booked' : 'avoids cards'}`,
    ];
  }

  return {
    playerName: player.name,
    playerId: player.playerId,
    team: teamName,
    position: player.position,
    verdict: isTarget ? 'TARGET' : 'AVOID',
    propType: 'To Be Booked',
    reasons,
    confidence,
    rawStats: player,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get a random team from the league (excluding the primary team)
 */
function getRandomTeam(league: League, excludeTeam?: string): string {
  const teams = getAllTeams(league);
  const filteredTeams = excludeTeam
    ? teams.filter((t) => t.code !== excludeTeam && t.statpalCode !== excludeTeam && String(t.id) !== excludeTeam)
    : teams;

  const randomIndex = Math.floor(Math.random() * filteredTeams.length);
  const team = filteredTeams[randomIndex];

  // Return appropriate identifier based on league
  if (league === 'NFL') return team.statpalCode || team.code.toLowerCase();
  return String(team.id);
}

/**
 * Get team name from code/id
 */
function getTeamName(league: League, teamCode: string): string {
  const teams = getAllTeams(league);
  const team = teams.find(
    (t) =>
      t.code.toLowerCase() === teamCode.toLowerCase() ||
      t.statpalCode === teamCode.toLowerCase() ||
      String(t.id) === teamCode
  );
  return team?.name || teamCode.toUpperCase();
}

/**
 * Generate image file path for a slide
 * Format: /slides/{league}/{team}_{player_id}.png
 * For now returns placeholder path - images will be added later
 */
function getImagePath(league: League, playerId: string | number, playerName: string): string {
  // Clean player name for file path
  const cleanName = playerName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `/slides/${league.toLowerCase()}/${cleanName}_${playerId}.png`;
}

// ============================================
// MAIN GENERATOR
// ============================================

/**
 * Generate a complete slideshow with all data ready for frontend
 */
export async function generateSlideshow(request: GenerateSlideshowRequest): Promise<SlideshowOutput> {
  const { league, team, playerCount = 6 } = request;

  // Validate player count (4-7 range)
  const count = Math.min(Math.max(playerCount, 4), 7);

  // Determine teams to fetch
  let primaryTeamCode = team;
  let secondaryTeamCode: string;

  if (team) {
    // User selected a team - get 3 from this team, 3 from random
    secondaryTeamCode = getRandomTeam(league, team);
  } else {
    // No team selected - pick 2 random teams
    primaryTeamCode = getRandomTeam(league);
    secondaryTeamCode = getRandomTeam(league, primaryTeamCode);
  }

  // Fetch player insights
  const insights: PlayerInsight[] = [];

  if (league === 'NFL') {
    // Fetch primary team
    if (primaryTeamCode) {
      const stats = await getNFLPlayerStats(primaryTeamCode);
      if (stats) {
        const teamName = getTeamName(league, primaryTeamCode);
        for (const receiver of stats.receiving.slice(0, 3)) {
          insights.push(analyzeNFLReceiver(receiver, teamName));
        }
        for (const rusher of stats.rushing.slice(0, 2)) {
          insights.push(analyzeNFLRusher(rusher, teamName));
        }
        if (stats.passing) {
          insights.push(analyzeNFLPasser(stats.passing, teamName));
        }
      }
    }

    // Fetch secondary team
    const secondaryStats = await getNFLPlayerStats(secondaryTeamCode);
    if (secondaryStats) {
      const teamName = getTeamName(league, secondaryTeamCode);
      for (const receiver of secondaryStats.receiving.slice(0, 3)) {
        insights.push(analyzeNFLReceiver(receiver, teamName));
      }
      for (const rusher of secondaryStats.rushing.slice(0, 2)) {
        insights.push(analyzeNFLRusher(rusher, teamName));
      }
      if (secondaryStats.passing) {
        insights.push(analyzeNFLPasser(secondaryStats.passing, teamName));
      }
    }
  } else if (league === 'NBA') {
    const primaryId = parseInt(primaryTeamCode || '1');
    const secondaryId = parseInt(secondaryTeamCode);

    // Fetch primary team
    const primaryStats = await getNBAPlayerStats(primaryId);
    if (primaryStats.length) {
      const teamName = getTeamName(league, primaryTeamCode || '1');
      for (const player of primaryStats.slice(0, 5)) {
        insights.push(analyzeNBAPoints(player, teamName));
        insights.push(analyzeNBARebounds(player, teamName));
      }
    }

    // Fetch secondary team
    const secondaryStats = await getNBAPlayerStats(secondaryId);
    if (secondaryStats.length) {
      const teamName = getTeamName(league, secondaryTeamCode);
      for (const player of secondaryStats.slice(0, 5)) {
        insights.push(analyzeNBAPoints(player, teamName));
        insights.push(analyzeNBARebounds(player, teamName));
      }
    }
  } else if (league === 'SOCCER') {
    const primaryId = parseInt(primaryTeamCode || '33');
    const secondaryId = parseInt(secondaryTeamCode);

    // Fetch primary team
    const primaryStats = await getSoccerPlayerStats(primaryId);
    if (primaryStats.length) {
      const teamName = getTeamName(league, primaryTeamCode || '33');
      for (const player of primaryStats.slice(0, 5)) {
        insights.push(analyzeSoccerGoals(player, teamName));
        insights.push(analyzeSoccerCards(player, teamName));
      }
    }

    // Fetch secondary team
    const secondaryStats = await getSoccerPlayerStats(secondaryId);
    if (secondaryStats.length) {
      const teamName = getTeamName(league, secondaryTeamCode);
      for (const player of secondaryStats.slice(0, 5)) {
        insights.push(analyzeSoccerGoals(player, teamName));
        insights.push(analyzeSoccerCards(player, teamName));
      }
    }
  }

  // Sort by confidence and split into TARGETs and AVOIDs
  const targets = insights
    .filter((i) => i.verdict === 'TARGET')
    .sort((a, b) => (b.confidence === 'High' ? 1 : 0) - (a.confidence === 'High' ? 1 : 0));

  const avoids = insights
    .filter((i) => i.verdict === 'AVOID')
    .sort((a, b) => (b.confidence === 'High' ? 1 : 0) - (a.confidence === 'High' ? 1 : 0));

  // Select players: roughly half targets, half avoids
  const targetCount = Math.ceil(count / 2);
  const avoidCount = Math.floor(count / 2);

  const selectedPlayers = [
    ...targets.slice(0, targetCount),
    ...avoids.slice(0, avoidCount),
  ];

  // Shuffle to mix targets and avoids
  for (let i = selectedPlayers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selectedPlayers[i], selectedPlayers[j]] = [selectedPlayers[j], selectedPlayers[i]];
  }

  // Build slides
  const slides: SlideData[] = [];

  // Slide 1: Hook
  const hookText = getRandomHook('target-avoid');
  slides.push({
    screenNumber: 1,
    isHook: true,
    textOverlay: [hookText],
    imagePath: `/slides/hooks/${league.toLowerCase()}_hook.png`,
  });

  // Slides 2+: Player cards
  for (let i = 0; i < selectedPlayers.length; i++) {
    const player = selectedPlayers[i];
    slides.push({
      screenNumber: i + 2,
      isHook: false,
      textOverlay: [
        player.verdict, // "Target" or "Avoid"
        player.playerName,
        player.reasons[0],
        player.reasons[1],
        player.reasons[2],
      ],
      imagePath: getImagePath(league, player.playerId, player.playerName),
    });
  }

  // Generate caption
  const caption = generateCaption(league, 'target-avoid');

  return {
    slides,
    caption,
    tiktokAudioUrl: '', // To be added later
    instagramAudioUrl: '', // To be added later
    league,
    generatedAt: new Date().toISOString(),
  };
}

// ============================================
// LEGACY EXPORTS (for backwards compatibility)
// ============================================

export { generateSlideshow as generateTargetAvoid };

export function formatForDisplay(insight: PlayerInsight): string {
  const emoji = insight.verdict === 'TARGET' ? '🎯' : '🚫';
  return `${emoji} ${insight.verdict}: ${insight.playerName}\n\n• ${insight.reasons[0]}\n• ${insight.reasons[1]}\n• ${insight.reasons[2]}`;
}

export function formatSlideshowPost(output: SlideshowOutput): string {
  return output.slides
    .filter((s) => !s.isHook)
    .map((s) => `${s.textOverlay[0]}: ${s.textOverlay[1]}\n• ${s.textOverlay[2]}\n• ${s.textOverlay[3]}\n• ${s.textOverlay[4]}`)
    .join('\n\n---\n\n');
}
