// ==============================
// Roster Rules — Round Gating & Validation
// Rules ref: docs/rules/rules.md §2
// ==============================
// Pure functions — no Redux imports, no side effects.
// Structural types are used here (instead of importing from lineupSlice) to
// avoid a circular dependency: lineupSlice imports from rosterRules.ts.
// ==============================

import type { TournamentRound } from "../../types/fantasyScore";
import {
  SUBSTITUTION_OPEN_ROUNDS,
  SUBSTITUTE_PENALTY_ROUNDS,
} from "../../types/fantasyScore";
import type { ReplacementType } from "./types";
import type { Position } from "../../types/player";

// Goalkeeper cap — applies to Player ROSTER and STARTER slots only.
// Squads are their own position type and are not subject to these limits.
export const MAX_GK_IN_ROSTER  = 3;
export const MAX_GK_STARTERS   = 1;

// ─── Structural types (avoids circular dep with lineupSlice) ──────────────────

type RosterPlayerLike = { playerId: number };
type RosterSquadLike  = { teamId:   number };

// ─── Round gating ─────────────────────────────────────────────────────────────

/**
 * Maps the current tournament round to a replacement type.
 *
 *   FULL       — Group Stage1 and 2: addition permitted, scores at 100%
 *   SUBSTITUTE — Round of 16: addition permitted, scores at 50%
 *   LOCKED     — Quarterfinals and beyond: no new additions permitted
 */
export function getReplacementType(round: TournamentRound): ReplacementType {
  if (!SUBSTITUTION_OPEN_ROUNDS.includes(round)) return "LOCKED";
  if (SUBSTITUTE_PENALTY_ROUNDS.includes(round))  return "SUBSTITUTE";
  return "FULL";
}

// ─── Player roster validation ─────────────────────────────────────────────────

export interface RosterValidationResult {
  allowed:      boolean;
  isSubstitute: boolean;
  reason?:      string;
}

/**
 * Validates whether a Player can be added to the ROSTER at the current round.
 *
 * Optional GK-specific params enforce the max-3 GK-in-ROSTER rule.
 * Pass `position` and `currentGkCount` when the calling context knows the
 * player's position; omit them to skip the GK cap check.
 *
 * Returns the `isSubstitute` flag to be stored on the entry if allowed.
 */
export function validateRosterPlayerAdd(
  currentRoster:   RosterPlayerLike[],
  playerId:        number,
  round:           TournamentRound,
  position?:       Position,
  currentGkCount?: number
): RosterValidationResult {
  const replacementType = getReplacementType(round);

  if (replacementType === "LOCKED") {
    return {
      allowed:      false,
      isSubstitute: false,
      reason:       "No ROSTER additions permitted after Round of 16.",
    };
  }
  if (currentRoster.length >= 18) {
    return {
      allowed:      false,
      isSubstitute: false,
      reason:       "ROSTER is full (maximum 18 Players).",
    };
  }
  if (currentRoster.some((p) => p.playerId === playerId)) {
    return {
      allowed:      false,
      isSubstitute: false,
      reason:       "Player is already on the ROSTER.",
    };
  }
  // Only enforce GK cap if position and count data are provided by caller
  if (position === "Goalkeeper" && currentGkCount != null && currentGkCount >= MAX_GK_IN_ROSTER) {
    return {
      allowed:      false,
      isSubstitute: false,
      reason:       `ROSTER may contain at most ${MAX_GK_IN_ROSTER} Goalkeepers.`,
    };
  }

  return { allowed: true, isSubstitute: replacementType === "SUBSTITUTE" };
}

// ─── Squad roster validation ──────────────────────────────────────────────────

/**
 * Validates whether a Squad can be added at the current round.
 * Squads are their own position type — GK limits do not apply.
 */
export function validateSquadAdd(
  currentSquads: RosterSquadLike[],
  teamId:        number,
  round:         TournamentRound
): RosterValidationResult {
  const replacementType = getReplacementType(round);

  if (replacementType === "LOCKED") {
    return {
      allowed:      false,
      isSubstitute: false,
      reason:       "No Squad additions permitted after Round of 16.",
    };
  }
  if (currentSquads.length >= 4) {
    return {
      allowed:      false,
      isSubstitute: false,
      reason:       "Squad ROSTER is full (maximum 4 Squads).",
    };
  }
  if (currentSquads.some((t) => t.teamId === teamId)) {
    return {
      allowed:      false,
      isSubstitute: false,
      reason:       "Squad is already on the ROSTER.",
    };
  }

  return { allowed: true, isSubstitute: replacementType === "SUBSTITUTE" };
}

// ─── Starter validation ───────────────────────────────────────────────────────

/**
 * Validates a proposed set of weekly STARTER IDs against the current ROSTER.
 * Returns filtered valid IDs and any rejected ones with reasons.
 *
 * Optional `positionById` enforces the max-1 GK STARTER rule.
 * Pass it when the calling context can supply position data; omit to skip the check.
 */
export function validateStarterSelection(
  rosterPlayerIds: number[],
  eliminatedIds:   Set<number>,
  proposedIds:     number[],
  positionById?:   Map<number, Position>
): { validIds: number[]; rejected: Array<{ id: number; reason: string }> } {
  const validIds: number[]                            = [];
  const rejected: Array<{ id: number; reason: string }> = [];
  let   gkStarterCount = 0;

  for (const id of proposedIds.slice(0, 11)) {
    if (!rosterPlayerIds.includes(id)) {
      rejected.push({ id, reason: "Player is not on the ROSTER." });
    } else if (eliminatedIds.has(id)) {
      rejected.push({ id, reason: "Player is ELIMINATED and cannot START." });
    } else if (positionById?.get(id) === "Goalkeeper" && gkStarterCount >= MAX_GK_STARTERS) {
      rejected.push({ id, reason: `Only ${MAX_GK_STARTERS} Goalkeeper(s) may START per week.` });
    } else {
      if (positionById?.get(id) === "Goalkeeper") gkStarterCount++;
      validIds.push(id);
    }
  }

  if (proposedIds.length > 11) {
    const extras = proposedIds.slice(11);
    for (const id of extras) {
      rejected.push({ id, reason: "Exceeds maximum of 11 STARTERS." });
    }
  }

  return { validIds, rejected };
}
