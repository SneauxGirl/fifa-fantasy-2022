// ==============================
// Players
// ==============================
// Position types: Internal logic uses long-form names.
// Short codes (GK/DEF/MID/FWD) are UI-only display values.
// PlayerStatus: starting | bench | not_expected for match-day availability


export type Position = "Goalkeeper" | "Defender" | "Midfielder" | "Attacker";
export type PositionShort = "GK" | "DEF" | "MID" | "FWD";
export type PlayerStatus = "starting" | "bench" | "not_expected";

// Per-match stats shape — mirrors API-Football /fixtures/players response.
// API refs: statistics[].games, .goals, .cards
//
// null semantics (never omit a field — always be explicit):
//   saves: null          → outfield player; field does not apply
//   cleanSheet: null      → not eligible: FWD always; any position if played < 45 min
//   shootoutGoals: null   → match did not reach a shootout
//   shootoutSaves: null   → outfield player OR match did not reach a shootout
//   shootoutMisses: null  → match did not reach a shootout
export interface PlayerMatchStats {
  goals: number;                  // API: goals.total
  assists: number;                // API: goals.assists
  saves: number | null;           // API: goals.saves — null for outfield players
  yellowCards: number;            // API: cards.yellow (includes yellow-red first booking)
  redCards: number;               // API: cards.red + cards.yellowred (second yellow)
  ownGoals: number;               // derived from fixture events — all positions; 0 if none
  cleanSheet: boolean | null;     // derived: team conceded 0 — null if not eligible
  shootoutGoals: number | null;   // derived from fixture events — null if no shootout this match
  shootoutSaves: number | null;   // derived from fixture events — null if outfield OR no shootout
  shootoutMisses: number | null;  // derived from fixture events — null if no shootout this match
}

//Do these match data? Remove player photo or call player photo?
export interface Player {
  playerId: number;
  id: number;
  firstName: string;              // API: player.firstname
  lastName: string;               // API: player.lastname
  apiDisplayName: string;         // API: player.name — abbreviated (e.g. "L. Messi"); for mapping/logging only
  position: Position;
  nationality: string;            // API: player.nationality — Anglicized (e.g. "Netherlands"); used for API calls
  countryCode: string;             // Country code (API format, e.g. "NET", "JAP")
  club: string;                   // API: statistics[].team.name — professional club name
  status: PlayerStatus;
  isMvp?: boolean;                // tournament MVP designation — toggles trophy badge on card
  jerseyNumber?: number;
  tournamentPerformance?: PlayerMatchStats[]; // tournament match-level stats (populated once tournament begins)
}
