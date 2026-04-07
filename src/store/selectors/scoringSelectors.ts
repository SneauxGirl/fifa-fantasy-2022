// ==============================
// Scoring Selectors
// Points calculation & assignment logic only.
// ==============================
// Architecture rule: scoring functions are NEVER called inside reducers.
// Raw roster state lives in rosterSlice. Computed scores live here, derived on read.
// Roster-related selectors (pool/role/workflow) are in rosterSelectors.ts
//
// Phase 1: lineup + match selectors only (no score computation yet —
//          player data is not in Redux; it comes from mock JSON directly).
// Phase 3: replace TODO stubs below once players are loaded from the API
//          into a playerSlice or passed as arguments.
// ==============================

import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../index";
import type { Match, RosterPlayer, RosterSquad } from "../../types/match";
import { applyLiveScore, transformMatch } from "../../lib/dataTransform";
import { generateLiveScore } from "../slices/liveScoresSlice";
import {
  selectScoringPlayers,
  selectScoringSquads,
  selectActiveSignedPlayers,
  selectActiveSignedSquads,
  selectSubstitutePlayers,
  selectSubstituteSquads,
} from "./rosterSelectors";

// ─── Roster-derived selectors (focus on scoring) ──────────────────────────────────

/** Signed squad team IDs. */
export const selectSignedSquadIds = createSelector(
  selectScoringSquads,
  (squads: RosterSquad[]) => squads.map((s) => s.teamId)
);

/** Signed player team IDs (active members). */
export const selectSignedPlayerTeamIds = createSelector(
  selectActiveSignedPlayers,
  (players: RosterPlayer[]) => players.map((p) => p.teamId)
);

/** Active (non-tournament-eliminated) Squads. */
export const selectActiveSquads = createSelector(
  selectActiveSignedSquads,
  (squads: RosterSquad[]) => squads
);

/** Active (non-tournament-eliminated) Players on the roster. */
export const selectActiveRosterPlayers = createSelector(
  selectActiveSignedPlayers,
  (roster: RosterPlayer[]) => roster
);

/** Active SCORER Player IDs (starters). */
export const selectActiveScorerIds = createSelector(
  selectScoringPlayers,
  selectActiveSignedPlayers,
  (scorers: RosterPlayer[], active: RosterPlayer[]) => {
    const activeIds = new Set(active.map((p) => p.playerId));
    return scorers.map((s) => s.playerId).filter((id) => activeIds.has(id));
  }
);

/** Roster object with signed squads and players for match card modal. */
export const selectMatchRoster = createSelector(
  selectScoringSquads,
  selectScoringPlayers,
  (squads: RosterSquad[], players: RosterPlayer[]) => ({
    squads,
    players,
  })
);

// ─── Lock state selector ──────────────────────────────────────────────────────

/**
 * Roster lock state: true when user clicks "Play" at Quarterfinals or beyond.
 * When locked, no roster additions/removals allowed, but formation adjustments remain enabled.
 */
export const selectIsRosterLocked = (state: RootState) =>
  state.ui.isRosterLocked;

// ─── Match selectors ──────────────────────────────────────────────────────────

export const selectAllMatches = createSelector(
  (state: RootState) => state.matches.allMatches,
  (state: RootState) => state.liveScores.scores,
  (matches: Match[], liveScores): Match[] =>
    matches.map((match) => {
      const isLive = ["1H", "2H", "ET", "HT", "P"].includes(match.status.short);

      // Get stored live score or generate one for live matches
      let liveScore = liveScores[match.id];
      if (!liveScore && isLive) {
        const finalScore = transformMatch(match);
        liveScore = generateLiveScore(finalScore.score.home, finalScore.score.away, match.id);
      }

      if (!liveScore) return match;

      const displayMatch = transformMatch(match);
      const matchWithLiveScore = applyLiveScore(displayMatch, {
        home: liveScore.home,
        away: liveScore.away,
        elapsed: liveScore.elapsed,
      });

      return {
        ...match,
        score: {
          ...match.score,
          fulltime: { home: matchWithLiveScore.score.home, away: matchWithLiveScore.score.away },
        },
        status: {
          ...match.status,
          elapsed: matchWithLiveScore.status.elapsed,
        },
      };
    })
);

export const selectRosterMatches = (state: RootState) =>
  state.matches.rosterMatches;

export const selectUpcomingMatches = createSelector(
  selectAllMatches,
  (matches: Match[]): Match[] =>
    matches.filter((m: Match) => m.status.short === "NS")
);

export const selectFinishedMatches = createSelector(
  selectAllMatches,
  (matches: Match[]): Match[] =>
    matches.filter((m: Match) =>
      ["FT", "AET", "PEN"].includes(m.status.short)
    )
);

/**
 * All matches that contribute to scoring: finished + partial/abandoned.
 * Partial statuses (SUSP/ABD/INT) award goals-based points but no result points.
 * Used by score computation selectors in Phase 3+.
 */
export const selectScoredMatches = createSelector(
  selectAllMatches,
  (matches: Match[]): Match[] =>
    matches.filter((m: Match) =>
      ["FT", "AET", "PEN", "SUSP", "ABD", "INT"].includes(m.status.short)
    )
);

/**
 * All matches with live score overlays applied (same as selectAllMatches)
 * For live matches (1H, 2H, etc), applies randomized current scores and elapsed time
 * For finished/upcoming matches, returns original match data
 */
export const selectAllMatchesWithLiveScores = selectAllMatches;

//Adjust for turn based play #TODO
/** Matches grouped by tournament stage. */
export const selectMatchesByStage = createSelector(
  selectAllMatches,
  (matches: Match[]) => {
    const stages: Record<string, Match[]> = {
      "Group Stage": [],
      "Round of 32": [],
      "Round of 16": [],
      "Quarterfinals": [],
      "Semifinals": [],
      "Final": [],
      "Other": [],
    };

    matches.forEach((match) => {
      const stageName = match.stage?.name || "Other";
      if (stageName.includes("Group")) {
        stages["Group Stage"].push(match);
      } else if (stageName.includes("Round of 32")) {
        stages["Round of 32"].push(match);
      } else if (stageName.includes("Round of 16")) {
        stages["Round of 16"].push(match);
      } else if (stageName.includes("Quarter")) {
        stages["Quarterfinals"].push(match);
      } else if (stageName.includes("Semi")) {
        stages["Semifinals"].push(match);
      } else if (stageName.includes("Final")) {
        stages["Final"].push(match);
      } else {
        stages["Other"].push(match);
      }
    });

    return stages;
  }
);

// ─── Score selectors (Phase 3+) ───────────────────────────────────────────────
// TODO Reevaluate but I think this can stay
//
// Intended shape:
//
//   export const selectPlayerScores = createSelector(
//     selectActiveStarterIds,
//     selectSubstitutePlayerIds,
//     selectScoredMatches,
//     (state: RootState) => state.players.byId,   // ← needs playerSlice
//     (starterIds, substituteIds, matches, playersById) =>
//       starterIds.map((id) => {
//         const player = playersById[id];
//         const stats  = derivePlayerStats(player, matches); // from apiFootball normalizer
//         return calculatePlayerScore(player, stats, substituteIds.has(id));
//       })
//   );
//
//   export const selectSquadScores = createSelector( ... );
//   export const selectWeeklyScore = createSelector( ... );
//   export const selectCumulativeTournamentScore = createSelector( ... );
