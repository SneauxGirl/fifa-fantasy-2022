// ==============================
// Scoring Engine — Internal Types
// ==============================
// These types are INTERNAL to lib/scoring/.
// Do not import them into Redux slices or UI components directly.
//
//  src/types/   → API-mirroring types (Player, Match, Team, etc.)
//  lib/scoring/ → engine-internal types (what scoring functions work with)
// ==============================

// Roster status for a Player or Squad in the game engine.
// IMPORTANT: this is NOT the same as PlayerStatus in src/types/player.ts,
// which is about match-day availability (starting/bench/not_expected).
// RosterStatus is about tournament eligibility.
export type RosterStatus = "ACTIVE" | "ELIMINATED" | "SUBSTITUTE";

// Result of checking whether a new addition is allowed at the current round.
// Returned by getReplacementType() in rosterRules.ts.
export type ReplacementType = "FULL" | "SUBSTITUTE" | "LOCKED";

// Normalized scoring event — derived from API MatchEvent during Phase 3 normalization.
// Simpler than the API type: only the fields the scoring engine needs.
// API MatchEvent → normalizeEvent() → ScoringEvent
export interface ScoringEvent {
  type:
    | "goal"
    | "own_goal"
    | "assist"
    | "yellow_card"
    | "red_card"
    | "yellow_red_card"  // second yellow → counts as yellow (-3) + red (-7) = -10
    | "shootout_goal"    // +1
    | "shootout_miss"    // -2 (all positions)
    | "shootout_save";   // GK only; +2
  playerId: number;
  teamId:   number;
  minute:   number;
}
