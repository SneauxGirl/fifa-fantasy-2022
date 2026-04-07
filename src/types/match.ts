// ==============================
// Matches
// ==============================

// API-Football fixture status short codes (all 16 possible values)
export type MatchStatusShort =
  | "NS"    // Not Started
  | "HT"    // Half Time (live)
  | "SUSP"  // Suspended
  | "INT"   // Interrupted
  | "FT"    // Full Time
  | "AET"   // After Extra Time
  | "PEN"   // After Penalties (decided by shootout)
  | "PST"   // Postponed
  | "CANC"  // Cancelled
  | "ABD"   // Abandoned
  | "TBD";  // Time To Be Defined

// API-Football fixture event type values
export type MatchEventType = "Goal" | "Card" | "subst" | "Var";



// API-Football fixture event detail values
// Using string & {} to allow unknown API passthrough values without losing autocomplete
export type MatchEventDetail =
  | "Normal Goal"
  | "Own Goal"
  | "Penalty"
  | "Header"
  | "Missed Penalty"
  | "Yellow Card"
  | "Red Card"
  | "Yellow Red Card"
  | "Goal cancelled"
  | "Card upgrade"
  | (string & {});

// Mirrors API-Football /fixtures/events response shape
export interface MatchEvent {
  time: {
    elapsed: number;              // match minute
    extra: number | null;         // stoppage time minutes (e.g. 45+2 → elapsed:45, extra:2)
  };
  team: {
    id: number;
    countryCode: string;          // 3-letter country code
  };
  player: {
    id: number;
    name: string;                 // API abbreviated name (e.g. "L. Messi")
  };
  assist: {
    id: number | null;
    name: string | null;          // assisting player for goals; player coming IN for substitutions
  };
  type: MatchEventType;
  detail: MatchEventDetail;
  comments?: string | null;
}

// Full score breakdown — mirrors API-Football fixture score object
export interface MatchScore {
  halftime: { home: number | null; away: number | null; };
  fulltime: { home: number | null; away: number | null; };
  extratime: { home: number | null; away: number | null; };
  penalty: { home: number | null; away: number | null; };
  live?: { home: number | null; away: number | null; };
}

export interface Match {
  id: number;
  homeTeam: { id: number; countryCode: string; name: string; };
  awayTeam: { id: number; countryCode: string; name: string; };
  date: string;                   // ISO 8601 string (e.g. "2026-06-10T15:00:00Z")
  status: {
    short: MatchStatusShort;
    long: string;                 // Human-readable (e.g. "Match Finished", "Second Half")
    elapsed: number | null;       // Current minute — populated during live matches only
  };
  score: MatchScore;
  events: MatchEvent[];
  venue?: {
    id: number;
    name: string;
    city: string;
  };
  stage?: {
    id: number;
    name: string;
  };
}

// ─── Roster & Fantasy ─────────────────────────────────────────────────────

// New semantic model: pool (where) + role (what function)
export type RosterPool = "available" | "unsigned" | "signed" | "eliminated";
export type RosterRole = "starter" | "bench" | "eliminatedSigned" | null;

/**
 * Represents a single game a squad/player participates in
 */
export interface Game {
  matchId: number;
  date: string;                    // ISO 8601 string
  homeTeam: string;               // Team code
  awayTeam: string;               // Team code
  isComplete: boolean;            // Match finished and results final
  points?: number;                // Points earned in this game
}

/**
 * Player injury status
 * "none" - no injury
 * "minor" - day-to-day, may be available
 * "major" - unlikely to play
 */
export interface PlayerInjury {
  status: "none" | "minor" | "major";
  likelyUnavailable: boolean;
  details?: string;
}

/**
 * Reason a player was eliminated from roster
 */
export type PlayerEliminationReason = "ejection" | "injury" | "teamEliminated" | "removed";

/**
 * Coach information for a squad
 */
export interface Coach {
  name: string;
  role: string;
}

/**
 * A Squad selected in the user's roster.
 * Tracks fantasy points per match.
 */
export interface RosterSquad {
  type: "squad";
  id: number;                          // Team ID
  teamId: number;                      // same as id, for clarity

  // Semantic model: pool (where) + role (what function)
  pool: RosterPool;                    // Where: available | unsigned | signed | eliminated
  role: RosterRole;                    // What: starter | eliminatedSigned | null

  // Core data
  name: string;
  countryCode: string;
  flag: string;

  // Points tracking
  matchPoints: Record<string, number>; // matchId → points gained in that match
  totalPoints: number;                 // All points (respects substitute 50% multiplier)

  // Game tracking
  isEliminated: boolean;               // Tournament eliminated status
  rosterElimination: null | "new" | "resolved"; // Elimination state: null=not eliminated, new=just happened, resolved=processed
  substitute: boolean;                 // Signed during R16? Scores at 50% forever
  squadGames?: Game[];                 // Games scheduled for this squad with isComplete flag

  // Squad-specific
  coaches?: Coach[];                   // Head coach(es) info
  group?: string;                      // Tournament group (e.g., "A", "B")
}

/**
 * A Player selected in the user's roster.
 * Tracks fantasy points per match.
 */
export interface RosterPlayer {
  type: "player";
  playerId: number | string | null;    // API-Football player ID (number), "missing" for known missing players, null for unmatched

  // Semantic model: pool (where) + role (what function)
  pool: RosterPool;                    // Where: available | unsigned | signed | eliminated
  role: RosterRole;                    // What: starter | bench | eliminatedSigned | null

  // Core data
  name: string;
  position: "Goalkeeper" | "Defender" | "Midfielder" | "Attacker"; // API format
  number: number;                      // Jersey number
  teamId: number;                      // National team ID
  countryCode: string;                 // Country code (API format, e.g., "ARG", "BRA", "NET", "JAP")
  flag: string;                        // Country flag emoji

  // Points tracking
  matchPoints: Record<string, number>; // matchId → points gained in that match
  totalPoints: number;                 // All points (respects substitute 50% multiplier)

  // Game tracking
  isEliminated: boolean;               // Tournament eliminated status (from national team data)
  rosterElimination: null | "new" | "resolved"; // Elimination state: null=not eliminated, new=just happened, resolved=processed
  substitute: boolean;                 // Signed during R16? Scores at 50% forever
  playerGames?: Game[];                // Games scheduled for this player with isComplete flag

  // Player-specific
  injury?: PlayerInjury;               // Injury status and availability
  eliminatedReason?: PlayerEliminationReason; // Why player was eliminated (if isEliminated === true)
}

export type RosterMember = RosterSquad | RosterPlayer;

/**
 * User's fantasy roster.
 * 4 squads + 18 players (11 starters, 7 inactive).
 * Eliminated members retain historical points but don't count toward active tally.
 *
 * TODO (Phase 4): Add database persistence fields when Auth/Database integration begins
 * - userId: string (Firebase UID or custom)
 * - gameId: string (allows multiple games per user)
 * - createdAt: timestamp
 * - lastSavedAt: timestamp
 */
export interface Roster {
  squads: RosterSquad[];  // 4 squads
  players: RosterPlayer[]; // 18 players
}

/**
 * Summary of fantasy impact for a specific match.
 * Used by MatchCard to display which roster members were involved and their points.
 */
export interface MatchRosterImpact {
  matchId: string;
  activePoints: number;   // sum of starter member points only
  inactivePoints: number; // sum of inactive member points (informational only)
  members: Array<{
    member: RosterMember;
    pointsThisMatch: number;
    events: MatchEvent[]; // events that affected this member
  }>;
}
