/**
 * Roster Selectors — Pool + Role Model
 *
 * Selectors bridge Redux state (raw pool + role data) and UI components.
 * All selectors are memoized with createSelector to prevent unnecessary re-renders.
 *
 * Naming convention:
 * - select[Pool][Role]* → filtered by pool AND role
 * - select[Pool]* → filtered by pool only
 * - select*WithCompleteGames → game completion status
 * - select*Count → counts and stats
 */

import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../index";
import type { RosterPlayer, RosterSquad } from "../../types/match";

// ─── BASE SELECTORS ──────────────────────────────────────────────────────────────
// Raw state access (not memoized)

export const selectAllPlayers = (state: RootState) => state.roster.players;

export const selectAllSquads = (state: RootState) => state.roster.squads;

// ─── POOL-BASED SELECTORS ──────────────────────────────────────────────────────────

export const selectAvailablePlayers = createSelector(
  selectAllPlayers,
  (players: RosterPlayer[]) => players.filter(p => p.pool === "available")
);

export const selectUnsignedPlayers = createSelector(
  selectAllPlayers,
  (players: RosterPlayer[]) => players.filter(p => p.pool === "unsigned")
);

export const selectSignedPlayers = createSelector(
  selectAllPlayers,
  (players: RosterPlayer[]) => players.filter(p => p.pool === "signed")
);

export const selectEliminatedPlayers = createSelector(
  selectAllPlayers,
  (players: RosterPlayer[]) => players.filter(p => p.pool === "eliminated")
);

export const selectAvailableSquads = createSelector(
  selectAllSquads,
  (squads: RosterSquad[]) => squads.filter(s => s.pool === "available")
);

export const selectUnsignedSquads = createSelector(
  selectAllSquads,
  (squads: RosterSquad[]) => squads.filter(s => s.pool === "unsigned")
);

export const selectSignedSquads = createSelector(
  selectAllSquads,
  (squads: RosterSquad[]) => squads.filter(s => s.pool === "signed")
);

export const selectEliminatedSquads = createSelector(
  selectAllSquads,
  (squads: RosterSquad[]) => squads.filter(s => s.pool === "eliminated")
);

// ─── ROLE-BASED SELECTORS (within signed pool) ──────────────────────────────────────

/**
 * Players with role: "starter" (in formation, actively scoring)
 */
export const selectStarterPlayers = createSelector(
  selectSignedPlayers,
  (players: RosterPlayer[]) => players.filter(p => p.role === "starter")
);

/**
 * Players with role: "bench" (in roster, not in formation, no scoring)
 */
export const selectBenchPlayers = createSelector(
  selectSignedPlayers,
  (players: RosterPlayer[]) => players.filter(p => p.role === "bench")
);


/**
 * Squads with role: "starter" (all signed squads are starters by default)
 */
export const selectStarterSquads = createSelector(
  selectSignedSquads,
  (squads: RosterSquad[]) => squads.filter(s => s.role === "starter")
);

/**
 * Eliminated players (pool: "eliminated", role: "eliminatedSigned")
 */
export const selectEliminatedSignedPlayers = createSelector(
  selectEliminatedPlayers,
  (players: RosterPlayer[]) => players.filter(p => p.role === "eliminatedSigned")
);

/**
 * Eliminated squads (pool: "eliminated", role: "eliminatedSigned")
 */
export const selectEliminatedSignedSquads = createSelector(
  selectEliminatedSquads,
  (squads: RosterSquad[]) => squads.filter(s => s.role === "eliminatedSigned")
);

// ─── ACTIVE/SCORING SELECTORS ──────────────────────────────────────────────────────

/**
 * Active signed players (not tournament-eliminated)
 */
export const selectActiveSignedPlayers = createSelector(
  selectSignedPlayers,
  (players: RosterPlayer[]) => players.filter(p => !p.isEliminated)
);

/**
 * Active signed squads (not tournament-eliminated)
 */
export const selectActiveSignedSquads = createSelector(
  selectSignedSquads,
  (squads: RosterSquad[]) => squads.filter(s => !s.isEliminated)
);

/**
 * Players currently scoring (starters only)
 */
export const selectScoringPlayers = selectStarterPlayers;

/**
 * Squads currently scoring (all signed squads are starters)
 */
export const selectScoringSquads = createSelector(
  selectStarterSquads,
  (starters: RosterSquad[]) => starters.filter(s => !s.isEliminated)
);

// ─── POSITION-BASED SELECTORS ──────────────────────────────────────────────────────

/**
 * All scoring players grouped by position, sorted by country then number
 * Used by formation display to show active players
 */
export const selectScoringPlayersGroupedByPosition = createSelector(
  selectScoringPlayers,
  (scoringPlayers: RosterPlayer[]) => {
    const sortByCountryThenNumber = (players: RosterPlayer[]) =>
      [...players].sort((a, b) => {
        if (a.countryCode !== b.countryCode) {
          return a.countryCode.localeCompare(b.countryCode);
        }
        return (a.number || 0) - (b.number || 0);
      });

    return {
      gk: sortByCountryThenNumber(scoringPlayers.filter(p => p.position === "Goalkeeper")),
      def: sortByCountryThenNumber(scoringPlayers.filter(p => p.position === "Defender")),
      mid: sortByCountryThenNumber(scoringPlayers.filter(p => p.position === "Midfielder")),
      fwd: sortByCountryThenNumber(scoringPlayers.filter(p => p.position === "Attacker")),
    };
  }
);

/**
 * Count of goalkeepers in starters
 */
export const selectStarterGKCount = createSelector(
  selectStarterPlayers,
  (starters: RosterPlayer[]) => starters.filter(p => p.position === "Goalkeeper").length
);

/**
 * Count of goalkeepers in signed roster
 */
export const selectRosterGKCount = createSelector(
  selectSignedPlayers,
  (players: RosterPlayer[]) => players.filter(p => p.position === "Goalkeeper").length
);

/**
 * All signed players for roster bench display (bench + starter)
 * Used by RosterSidebar to show all roster members
 * Players with role: "starter" remain visible with a ⭐ icon
 */
export const selectRosterBenchPlayers = createSelector(
  selectSignedPlayers,
  (players: RosterPlayer[]) =>
    players.filter(p => p.role === "bench" || p.role === "starter")
);

/**
 * Signed players grouped by position
 */
export const selectSignedPlayersGroupedByPosition = createSelector(
  selectSignedPlayers,
  (signed: RosterPlayer[]) => ({
    gk: signed.filter(p => p.position === "Goalkeeper"),
    def: signed.filter(p => p.position === "Defender"),
    mid: signed.filter(p => p.position === "Midfielder"),
    fwd: signed.filter(p => p.position === "Attacker"),
  })
);

// ─── SUBSTITUTE SELECTORS ──────────────────────────────────────────────────────────

/**
 * Players signed during R16 (scores at 50% forever)
 */
export const selectSubstitutePlayers = createSelector(
  selectAllPlayers,
  (players: RosterPlayer[]) => players.filter(p => p.substitute)
);

/**
 * Squads signed during R16 (scores at 50% forever)
 */
export const selectSubstituteSquads = createSelector(
  selectAllSquads,
  (squads: RosterSquad[]) => squads.filter(s => s.substitute)
);

// ─── ROSTER COUNT & VALIDATION SELECTORS ──────────────────────────────────────────────

/**
 * Roster summary: counts and capacity info
 */
export const selectRosterCounts = createSelector(
  selectSignedPlayers,
  selectStarterPlayers,
  selectSignedSquads,
  selectRosterGKCount,
  selectStarterGKCount,
  (
    signedPlayers: RosterPlayer[],
    starters: RosterPlayer[],
    squads: RosterSquad[],
    rosterGK: number,
    starterGK: number
  ) => ({
    signedPlayers: signedPlayers.length,
    starters: starters.length,
    signedSquads: squads.length,
    rosterGK,
    rosterGKCapacity: 3,
    starterGK,
    starterGKCapacity: 1,
    starterCapacity: 11,
    rosterCapacity: 18,
    squadCapacity: 4,
  })
);

/**
 * Can promote another player to starter? (validates capacity and position)
 */
export const selectCanPromoteToStarter = createSelector(
  selectStarterPlayers,
  selectStarterGKCount,
  (starters: RosterPlayer[], gkCount: number) => (player: RosterPlayer) => {
    const canFitPosition = player.position === "Goalkeeper" ? gkCount < 1 : true;
    return starters.length < 11 && canFitPosition;
  }
);

/**
 * Can add another player to signed roster? (validates capacity and position)
 */
export const selectCanAddToSignedRoster = createSelector(
  selectSignedPlayers,
  selectRosterGKCount,
  (signed: RosterPlayer[], gkCount: number) => (player: RosterPlayer) => {
    const canFitPosition = player.position === "Goalkeeper" ? gkCount < 3 : true;
    return signed.length < 18 && canFitPosition;
  }
);

/**
 * Can sign another squad? (validates 4-squad cap)
 */
export const selectCanSignAnotherSquad = createSelector(
  selectSignedSquads,
  (squads: RosterSquad[]) => squads.length < 4
);

// ─── AVAILABLE POOL (with active/eliminated split) ──────────────────────────────────

/**
 * Active available players (not tournament-eliminated)
 */
export const selectActiveAvailablePlayers = createSelector(
  selectAvailablePlayers,
  (players: RosterPlayer[]) => players.filter(p => !p.isEliminated)
);

/**
 * Eliminated available players (tournament-eliminated but not signed)
 */
export const selectEliminatedAvailablePlayers = createSelector(
  selectAvailablePlayers,
  (players: RosterPlayer[]) => players.filter(p => p.isEliminated)
);

/**
 * Active available squads (not tournament-eliminated)
 */
export const selectActiveAvailableSquads = createSelector(
  selectAvailableSquads,
  (squads: RosterSquad[]) => squads.filter(s => !s.isEliminated)
);


//REVIEW THIS. Why so dramatic? what was I solving for differently than Players? Make better notes #TODO
/**
 * Eliminated available squads (tournament-eliminated available/unsigned squads)
 * Includes:
 * 1. Available squads marked as eliminated (initial data or before moved to eliminated pool)
 * 2. Available/Unsigned squads that moved to eliminated pool (not signed rosters)
 */
export const selectEliminatedAvailableSquads = createSelector(
  selectAllSquads,
  (squads: RosterSquad[]) => squads.filter(
    s => (s.pool === "available" && s.isEliminated) || (s.pool === "eliminated" && s.role !== "eliminatedSigned")
  )
);

// ─── TEAM-BASED SELECTORS ──────────────────────────────────────────────────────────

//REVIEW - where do I use this in current logic? Is this leftover Claude spam? Or do I use it for more efficient elimination logic? #TODO

/**
 * Get all signed players from a specific team
 */
export const selectSignedPlayersFromTeam = (teamId: number) =>
  createSelector(selectSignedPlayers, (players: RosterPlayer[]) =>
    players.filter(p => p.teamId === teamId)
  );

/**
 * Get starter players from a specific team
 */
export const selectStarterPlayersFromTeam = (teamId: number) =>
  createSelector(selectStarterPlayers, (starters: RosterPlayer[]) =>
    starters.filter(p => p.teamId === teamId)
  );

// ─── VALIDATION HELPERS ──────────────────────────────────────────────────────────────

/**
 * Players that can be moved from bench to starter
 * (starter capacity + position constraints)
 */
export const selectPromotableBenchPlayers = createSelector(
  selectBenchPlayers,
  selectStarterGKCount,
  selectStarterPlayers,
  (bench: RosterPlayer[], gkCount: number, starters: RosterPlayer[]) => {
    const canAddMore = starters.length < 11;
    return bench.filter(p => {
      const canFitPosition = p.position === "Goalkeeper" ? gkCount < 1 : true;
      return canAddMore && canFitPosition;
    });
  }
);
