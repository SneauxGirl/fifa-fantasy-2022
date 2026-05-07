// ==============================
// National Team Selectors
// ==============================
// Queries on national teams, players, and squads from tournament source of truth.
// All 32 teams with ~650 players total.

import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../index";
import type { NationalTeam, NationalPlayer } from "../../types/match";

// ─── Base Selectors ──────────────────────────────────────────────────────

/** All 32 national teams with nested squads and players */
export const selectAllNationalTeams = (state: RootState) =>
  state.nationTeams.teams;

/** All national teams that are still active (not eliminated) */
export const selectActiveNationalTeams = createSelector(
  selectAllNationalTeams,
  (teams: NationalTeam[]): NationalTeam[] =>
    teams.filter((team) => !team.isEliminated)
);

/** All eliminated national teams */
export const selectEliminatedNationalTeams = createSelector(
  selectAllNationalTeams,
  (teams: NationalTeam[]): NationalTeam[] =>
    teams.filter((team) => team.isEliminated)
);

// ─── Single Team Selectors ───────────────────────────────────────────────

/**
 * Get a single national team by country code
 * @param countryCode - 3-letter FIFA country code (e.g., "ARG", "BRA", "NET")
 */
export const selectNationalTeamByCountryCode = (countryCode: string) =>
  createSelector(
    selectAllNationalTeams,
    (teams: NationalTeam[]): NationalTeam | undefined =>
      teams.find((team) => team.countryCode === countryCode)
  );

/**
 * Get a single national team by team ID
 * @param teamId - Numeric team ID
 */
export const selectNationalTeamByTeamId = (teamId: number) =>
  createSelector(
    selectAllNationalTeams,
    (teams: NationalTeam[]): NationalTeam | undefined =>
      teams.find((team) => team.teamId === teamId)
  );

// ─── Team Players Selectors ──────────────────────────────────────────────

/**
 * Get all players for a specific national team
 * @param countryCode - 3-letter FIFA country code
 */
export const selectTeamPlayers = (countryCode: string) =>
  createSelector(
    selectNationalTeamByCountryCode(countryCode),
    (team: NationalTeam | undefined): NationalPlayer[] =>
      team?.players || []
  );

/**
 * Get active (non-eliminated) players for a team
 * @param countryCode - 3-letter FIFA country code
 */
export const selectTeamActivePlayers = (countryCode: string) =>
  createSelector(
    selectTeamPlayers(countryCode),
    (players: NationalPlayer[]): NationalPlayer[] =>
      players.filter((p) => !p.isEliminated)
  );

/**
 * Get all players from all national teams (flat array)
 */
export const selectAllNationalPlayers = createSelector(
  selectAllNationalTeams,
  (teams: NationalTeam[]): NationalPlayer[] =>
    teams.flatMap((team) => team.players)
);

/**
 * Get all active (non-eliminated) players from all teams
 */
export const selectAllActivePlayers = createSelector(
  selectAllNationalPlayers,
  (players: NationalPlayer[]): NationalPlayer[] =>
    players.filter((p) => !p.isEliminated)
);

// ─── Team Squads Selectors ──────────────────────────────────────────────

/**
 * Get squad records for a specific national team
 * @param countryCode - 3-letter FIFA country code
 */
export const selectTeamSquads = (countryCode: string) =>
  createSelector(
    selectNationalTeamByCountryCode(countryCode),
    (team: NationalTeam | undefined) => team?.squads || []
  );

// ─── Team Group/Confederation Selectors ──────────────────────────────────

/**
 * Get all teams in a specific group (A, B, C, etc.)
 * @param group - Group letter (e.g., "A", "B")
 */
export const selectTeamsByGroup = (group: string) =>
  createSelector(
    selectAllNationalTeams,
    (teams: NationalTeam[]): NationalTeam[] =>
      teams.filter((team) => team.group === group)
  );

/**
 * Get all teams from a specific confederation (CONMEBOL, UEFA, etc.)
 * @param confederation - Confederation name
 */
export const selectTeamsByConfederation = (confederation: string) =>
  createSelector(
    selectAllNationalTeams,
    (teams: NationalTeam[]): NationalTeam[] =>
      teams.filter((team) => team.confederation === confederation)
  );

// ─── Utility Selectors ──────────────────────────────────────────────────

/**
 * Count of active teams remaining
 */
export const selectActiveTeamCount = createSelector(
  selectActiveNationalTeams,
  (teams: NationalTeam[]): number => teams.length
);

/**
 * Count of eliminated teams
 */
export const selectEliminatedTeamCount = createSelector(
  selectEliminatedNationalTeams,
  (teams: NationalTeam[]): number => teams.length
);

/**
 * Get all country codes for active teams
 */
export const selectActiveTeamCountryCodes = createSelector(
  selectActiveNationalTeams,
  (teams: NationalTeam[]): string[] =>
    teams.map((team) => team.countryCode)
);

/**
 * Get all country codes for eliminated teams
 */
export const selectEliminatedTeamCountryCodes = createSelector(
  selectEliminatedNationalTeams,
  (teams: NationalTeam[]): string[] =>
    teams.map((team) => team.countryCode)
);
