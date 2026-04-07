// ==============================
// Match-Level Point Helpers
// Rules ref: docs/rules/rules.md §5
// ==============================
// Atomic scoring constants and helper functions.
// These are the building blocks used by calculatePlayerScore
// and calculateSquadScore.
// All functions are pure — no side effects, no Redux imports.
// ==============================

import type { Position } from "../../types/player";

// ─── Scoring constants ────────────────────────────────────────────────────────

/** Goal points by registered position (most forward role applies). */
export const GOAL_POINTS: Record<Position, number> = {
  GK:  7,
  DEF: 5,
  MID: 4,
  FWD: 3,
};

/** Clean sheet bonus points by position. */
export const CLEAN_SHEET_POINTS: Record<Position, number> = {
  GK:  7,
  DEF: 4,
  MID: 1,
  FWD: 0,  // FWD is never eligible for clean sheet bonus
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Goal points based on registered position. Includes on-field penalty goals. */
export function calcGoalPoints(position: Position, goals: number): number {
  return goals * GOAL_POINTS[position];
}

/**
 * Clean sheet points for a player.
 * Returns 0 for false. Defaults to false for null (not eligible or incomplete data).
 */
export function calcCleanSheetPoints(
  position:   Position,
  cleanSheet: boolean | null
): number {
  if (cleanSheet !== true) return 0;
  return CLEAN_SHEET_POINTS[position];
}

/**
 * Hat trick bonus: +21 if the player scored ≥ 3 goals in one match.
 * `goals` in PlayerMatchStats includes on-field penalty goals, excludes shootout goals.
 * Awarded once per match.
 */
export function calcHatTrickBonus(goals: number): number {
  return goals >= 3 ? 21 : 0;
}
