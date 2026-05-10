import type { Match } from "../types/match";
import type { MatchDisplayStatus } from "./turnSimulation";

/**
 * UI-facing fixture states driven by turn simulation (BracketView / MatchList).
 * Until a match reaches one of these, we hide final scorelines from presentation
 * even when the bundled schedule JSON already contains FT rows (spoiler-safe UX).
 */
export function matchDisplayStatusIsRevealed(status: MatchDisplayStatus): boolean {
  return status === "Final" || status === "IN PROGRESS";
}

const NS_STATUS: Match["status"] = {
  short: "NS",
  long: "Not Started",
  elapsed: null,
};

function obscuredScore(): Match["score"] {
  return {
    halftime: { home: null, away: null },
    fulltime: { home: null, away: null },
    extratime: { home: null, away: null },
    penalty: { home: null, away: null },
  };
}

/**
 * Shallow clone with result fields stripped when the schedule considers this row unrevealed.
 * Canonical match rows in Redux stay untouched; use this at presentation boundaries only.
 */
export function maskMatchForScheduleReveal(
  match: Match,
  displayStatus: MatchDisplayStatus
): Match {
  if (matchDisplayStatusIsRevealed(displayStatus)) {
    return match;
  }

  return {
    ...match,
    status: NS_STATUS,
    score: obscuredScore(),
    events: [],
  };
}
