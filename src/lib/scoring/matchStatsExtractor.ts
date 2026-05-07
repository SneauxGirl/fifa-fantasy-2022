/**
 * Match Stats Extractor — Reconstructs Player Performance from Match Events
 *
 * **Purpose**: Analyzes match event logs to determine which players participated and what
 * stats they accumulated. Essential for turn-based gameplay with historical 2022 World Cup data.
 *
 * **Data Sources**:
 * - Match events (goals, assists, cards, substitutions)
 * - Match scores (for clean sheet/shutout determination)
 * - Team country codes (to verify player's team participation)
 *
 * **Extraction Rules**:
 * - Only counts events where player's team participated in the match
 * - Returns null if player didn't play (no events recorded)
 * - Derives clean sheet: true if match finished AND opponent scored 0 goals
 * - Shootout stats: null (not available in event logs; future enhancement)
 * - Saves: Estimated as 0 (not in event logs; future enhancement)
 *
 * **Event Type Mappings**:
 * - "Goal" detail "Own Goal" → ownGoals++
 * - "Goal" (not own goal) → goals++
 * - Assist field on goal events → assist player's assists++
 * - "Card" detail "Yellow Card" → yellowCards++
 * - "Card" detail "Red Card" or "Yellow Red Card" → redCards++
 * - "subst" event → marks player as played
 *
 * **Phase**: Phase 3.6 (Scoring Calculation — Stats Extraction)
 *
 * @see `/src/store/thunks/rosterThunks.ts` — playTurn thunk (calls extractPlayerMatchStats)
 * @see `/src/types/player.ts` — PlayerMatchStats interface
 * @see `/src/types/match.ts` — Match and MatchEvent interfaces
 */

import type { Match } from "../../types/match";
import type { Player, PlayerMatchStats } from "../../types/player";

/**
 * Build a map of all players who participated in a match
 * Groups events by player ID to track goals, assists, cards, etc.
 */
interface PlayerEventLog {
  playerId: number;
  teamCode: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  ownGoals: number;
  played: boolean;
}

/**
 * Extract match stats for a specific player
 * Analyzes match events to reconstruct what happened to that player
 *
 * @param player - The player to calculate stats for
 * @param match - The match to analyze
 * @returns PlayerMatchStats for this player in this match, or null if they didn't play
 */
export function extractPlayerMatchStats(
  player: Player,
  match: Match
): PlayerMatchStats | null {
  // Determine which team the player is on
  const isHomeTeam = match.homeTeam.countryCode === player.countryCode;
  const isAwayTeam = match.awayTeam.countryCode === player.countryCode;

  if (!isHomeTeam && !isAwayTeam) {
    return null; // Player's team didn't play
  }

  const playerTeamCode = isHomeTeam ? match.homeTeam.countryCode : match.awayTeam.countryCode;

  // Initialize counters
  let goals = 0;
  let assists = 0;
  let yellowCards = 0;
  let redCards = 0;
  let ownGoals = 0;
  let played = false;

  // Analyze events
  match.events.forEach((event) => {
    const isPlayerEvent = event.player.id === player.playerId;
    const isPlayerTeam = event.team.countryCode === playerTeamCode;

    if (!isPlayerEvent || !isPlayerTeam) {
      return; // Not relevant to this player
    }

    played = true; // Player participated in an event

    switch (event.type) {
      case "Goal":
        if (event.detail === "Own Goal") {
          ownGoals += 1;
        } else {
          goals += 1;
        }
        break;

      case "Card":
        if (event.detail === "Yellow Card") {
          yellowCards += 1;
        } else if (event.detail === "Red Card" || event.detail === "Yellow Red Card") {
          redCards += 1;
        }
        break;

      case "subst":
        // Player was substituted (off or on) — counts as participation
        played = true;
        break;
    }

    // Assists: check if player assisted another teammate's goal
    if (event.assist?.id === player.playerId && event.type === "Goal") {
      assists += 1;
    }
  });

  // If no events recorded, player didn't participate
  if (!played) {
    return null;
  }

  // Calculate clean sheet (only if player played and team conceded 0)
  const isComplete = ["FT", "AET", "PEN"].includes(match.status.short);
  const goalsAgainst = isHomeTeam
    ? match.score.fulltime.away ?? 0
    : match.score.fulltime.home ?? 0;

  // Clean sheet eligibility: only count if match is finished
  // For a quick version, mark as ineligible (null) if we can't determine playtime
  const cleanSheet = isComplete && goalsAgainst === 0 ? true : null;

  // Build stats object
  const stats: PlayerMatchStats = {
    goals,
    assists,
    saves: player.position === "Goalkeeper" ? 0 : null, // Only GK can have saves; estimate 0 for now
    yellowCards,
    redCards,
    ownGoals,
    cleanSheet,
    shootoutGoals: null,    // Not tracked in event logs
    shootoutSaves: null,    // Not tracked in event logs
    shootoutMisses: null,   // Not tracked in event logs
  };

  return stats;
}

/**
 * Extract stats for all players in a roster who played in a match
 * Returns a map of playerId -> PlayerMatchStats (only includes players who played)
 */
export function extractMatchStatsForRoster(
  rosterPlayers: Player[],
  match: Match
): Map<number, PlayerMatchStats> {
  const statsMap = new Map<number, PlayerMatchStats>();

  rosterPlayers.forEach((player) => {
    const stats = extractPlayerMatchStats(player, match);
    if (stats) {
      statsMap.set(player.playerId, stats);
    }
  });

  return statsMap;
}

/**
 * Build complete event log for a match (all teams, all players)
 * Useful for debugging or detailed analysis
 */
export function buildMatchEventLog(match: Match): Map<number, PlayerEventLog> {
  const eventLog = new Map<number, PlayerEventLog>();

  // Initialize all players who appear in events
  match.events.forEach((event) => {
    const playerId = event.player.id;
    if (!eventLog.has(playerId)) {
      eventLog.set(playerId, {
        playerId,
        teamCode: event.team.countryCode,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        ownGoals: 0,
        played: false,
      });
    }
  });

  // Process events
  match.events.forEach((event) => {
    const log = eventLog.get(event.player.id);
    if (!log) return;

    log.played = true;

    switch (event.type) {
      case "Goal":
        if (event.detail === "Own Goal") {
          log.ownGoals += 1;
        } else {
          log.goals += 1;
        }
        break;

      case "Card":
        if (event.detail === "Yellow Card") {
          log.yellowCards += 1;
        } else if (event.detail === "Red Card" || event.detail === "Yellow Red Card") {
          log.redCards += 1;
        }
        break;
    }

    // Record assists
    if (event.assist?.id) {
      const assistLog = eventLog.get(event.assist.id);
      if (assistLog) {
        assistLog.assists += 1;
      }
    }
  });

  return eventLog;
}
