// ==============================
// Fantasy Scoring
// All point values defined in docs/rules/rules.md
// ==============================

// Tournament rounds — used to enforce substitution eligibility rules:
//   Group / R32:  SUBSTITUTE additions allowed, score at 100%
//   R16:          SUBSTITUTE additions allowed, score at 50%
//   QF and beyond: no new additions permitted
export type TournamentRound =
  | "group"
  | "round_of_32"
  | "round_of_16"
  | "quarterfinal"
  | "semifinal"
  | "final";

// Rounds in which new Squads / Players may still be added to the ROSTER.
// Used by the lineup slice to gate substitution UI.
export const SUBSTITUTION_OPEN_ROUNDS: TournamentRound[] = [
  "group",
  "round_of_32",
  "round_of_16",
];

// Rounds in which additions are flagged as SUBSTITUTES and score at 50%.
export const SUBSTITUTE_PENALTY_ROUNDS: TournamentRound[] = ["round_of_16"];

// Full per-match player score breakdown.
// All fields are always present; 0 when not applicable for that match/position.
export interface PlayerScoreBreakdown {
  goalPoints: number;             // FWD +3 | MID +4 | DEF +5 | GK +7 per goal
  assistPoints: number;           // +2 per assist (all positions)
  cleanSheetPoints: number;       // GK +7 | DEF +4 | MID +1 | FWD 0
  savePoints: number;             // GK only: +1 per save
  hatTrickBonus: number;          // +21 if player scores ≥ 3 goals in one match (non-shootout goals only)
  yellowCardPoints: number;       // -3 per yellow card
  redCardPoints: number;          // -7 per red card (direct red or second yellow); yellow-red = -10 total
  ownGoalPoints: number;          // -3 per own goal
  shootoutGoalPoints: number;     // +1 per shootout goal scored
  shootoutSavePoints: number;     // GK: +2 per shootout penalty saved
  shootoutMissPoints: number;     // -2 per shootout penalty missed
}

// isSubstitute applies to both Players and Squads equally (see rules §2):
//   false = added at Group Stage or R32 → scores at 100%
//   true  = added at R16 (final permitted round) → scores at 50% for remainder of tournament
export interface PlayerScore {
  playerId: number;
  matchId?: number;               // omit for cumulative totals
  totalPoints: number;
  isSubstitute: boolean;
  breakdown: PlayerScoreBreakdown;
}

// Per-match Squad score breakdown
export interface SquadScoreBreakdown {
  matchResultPoints: number;      // Win +10 | Draw +5 | Loss +0 | Partial/abandoned +0
  goalsForPoints: number;         // +2 per goal scored
  goalsConcededPoints: number;    // -1 per goal conceded
  cleanSheetBonus: number;        // +5 if Squad kept clean sheet
  advancementBonus: number;       // see advancement table in rules.md:
                                  //   Group Winner +40 | Group Advances +20
}

// isSubstitute mirrors PlayerScore — 50% rule is identical for Squads and Players
export interface SquadScore {
  teamId: number;
  matchId?: number;               // omit for cumulative totals
  turnPoints?: number;
  totalPoints: number;
  isSubstitute: boolean;          // true = added at R16; scores at 50% for remainder of tournament
  breakdown: SquadScoreBreakdown;
}

// Turn totals — sum of all 4 Squads + 11 STARTER Players for a single tournament turn
export interface TurnScore {
  turn: number;
  playerPoints: number;           // sum of all STARTER Player points for this turn
  squadPoints: number;            // sum of all 4 Squad points for this turn
  totalPoints: number;            // playerPoints + squadPoints
  mvpPlayerId?: number;           // highest-scoring STARTER Player (trophy icon only, no bonus)
}

// Full tournament cumulative score per user
export interface TournamentScore {
  userId: string;
  turnScores: TurnScore[];
  cumulativeTotal: number;        // sum of all TurnScore.totalPoints
}
