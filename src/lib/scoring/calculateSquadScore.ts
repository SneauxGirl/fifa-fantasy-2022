// ==============================
// Squad Match Score
// Rules ref: docs/rules/rules.md §4
// ==============================

import type { Squad } from "../../types/squad";
import type { Match } from "../../types/match";
import type { SquadScore, SquadScoreBreakdown } from "../../types/fantasyScore";
import { applySubstitutionModifier } from "./applySubstitutionModifier";

// Match statuses that produce a terminal scored result (result points awarded).
const TERMINAL_STATUSES = new Set(["FT", "AET", "PEN"]);

// Match statuses that have not yet started or will not be played (zero points).
const ZERO_STATUSES = new Set(["NS", "PST", "CANC", "TBD"]);

/**
 * Calculate a Squad's fantasy score for a single match.
 *
 * --- Goal counting by status (turn-based model) ---
 *
 *   FT:           fulltime goals only
 *   AET / PEN:    fulltime + extra-time goals (shootout goals excluded)
 *   SUSP/ABD/INT: fulltime goals at point of suspension/abandonment
 *   NS/PST/CANC/TBD: 0 points; return early
 *
 * --- Result points ---
 *
 *   FT / AET / PEN: Win +10, Draw +5, Loss +0
 *   SUSP / ABD / INT: no result points — match was not completed
 *
 * --- Win/loss for PEN matches ---
 *   Teams are level on goals after FT+ET; shootout score decides the winner.
 *
 * --- Advancement bonuses ---
 *   NOT calculated here — awarded at end-of-turn by the store/selectors
 *   once round advancement is confirmed.
 *
 * @param isSubstitute   true = Squad added as SUBSTITUTE at R16; score is halved
 * @param advancementBonus  optional bonus points awarded separately at turn end
 */
export function calculateSquadScore(
  team:             Squad,
  match:            Match,
  isSubstitute:     boolean,
  advancementBonus  = 0
): SquadScore {
  const isHome = match.homeTeam.code === team.code;
  const status = match.status.short;

  // No-score statuses: return zeroed breakdown immediately
  if (ZERO_STATUSES.has(status)) {
    const breakdown: SquadScoreBreakdown = {
      matchResultPoints:   0,
      goalsForPoints:      0,
      goalsConcededPoints: 0,
      cleanSheetBonus:     0,
      advancementBonus:    0,
    };
    return { teamId: team.id, matchId: match.id, totalPoints: 0, isSubstitute, breakdown };
  }

  // ── Goals scored ────────────────────────────────────────────────────────────

  let goalsFor: number;
  let goalsAgainst: number;

  if (TERMINAL_STATUSES.has(status)) {
    // Fulltime goals (always present for terminal statuses)
    const ftFor     = (isHome ? match.score.fulltime.home : match.score.fulltime.away) ?? 0;
    const ftAgainst = (isHome ? match.score.fulltime.away : match.score.fulltime.home) ?? 0;

    // Extra-time goals added for AET / PEN only; shootout goals deliberately excluded
    const etFor     = (status === "AET" || status === "PEN")
      ? (isHome ? match.score.extratime.home : match.score.extratime.away) ?? 0
      : 0;
    const etAgainst = (status === "AET" || status === "PEN")
      ? (isHome ? match.score.extratime.away : match.score.extratime.home) ?? 0
      : 0;

    goalsFor     = ftFor     + etFor;
    goalsAgainst = ftAgainst + etAgainst;
  } else {
    // Partial match (SUSP/ABD/INT): use fulltime score at point of suspension
    const ftFor     = (isHome ? match.score.fulltime.home : match.score.fulltime.away) ?? 0;
    const ftAgainst = (isHome ? match.score.fulltime.away : match.score.fulltime.home) ?? 0;

    goalsFor     = ftFor;
    goalsAgainst = ftAgainst;
  }

  // ── Result points (terminal statuses only) ──────────────────────────────────

  let matchResultPoints = 0;

  if (TERMINAL_STATUSES.has(status)) {
    let won: boolean;
    let drew: boolean;

    if (status === "PEN") {
      // Level on goals after FT+ET — shootout score decides the winner
      const penFor     = (isHome ? match.score.penalty.home : match.score.penalty.away) ?? 0;
      const penAgainst = (isHome ? match.score.penalty.away : match.score.penalty.home) ?? 0;
      won  = penFor > penAgainst;
      drew = false; // PEN always produces a winner
    } else {
      won  = goalsFor > goalsAgainst;
      drew = goalsFor === goalsAgainst;
    }

    matchResultPoints = won ? 10 : drew ? 5 : 0;
  }
  // SUSP/ABD/INT and live statuses: matchResultPoints stays 0

  // ── Point calculation ────────────────────────────────────────────────────────

  const goalsForPoints      = goalsFor     *  2;
  const goalsConcededPoints = goalsAgainst * -1;
  const cleanSheetBonus     = goalsAgainst === 0 ? 5 : 0;

  const breakdown: SquadScoreBreakdown = {
    matchResultPoints,
    goalsForPoints,
    goalsConcededPoints,
    cleanSheetBonus,
    advancementBonus,
  };

  const rawTotal =
    matchResultPoints   +
    goalsForPoints      +
    goalsConcededPoints +
    cleanSheetBonus     +
    advancementBonus;

  const totalPoints = applySubstitutionModifier(rawTotal, isSubstitute);

  return { teamId: team.id, matchId: match.id, totalPoints, isSubstitute, breakdown };
}
