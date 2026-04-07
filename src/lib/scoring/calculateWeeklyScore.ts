// ==============================
// Turn Score Aggregation
// Rules ref: docs/rules/rules.md §4 (Turn Scoring Rules)
// ==============================

import type { PlayerScore, SquadScore, TurnScore } from "../../types/fantasyScore";

/**
 * Aggregate STARTER Player scores and Squad scores into a turn total.
 *
 * Caller must pre-filter to STARTERS only — bench Players must not be passed in.
 * The 50% SUBSTITUTE multiplier is already baked into each individual score
 * by calculatePlayerScore / calculateSquadScore.
 *
 * MVP = highest-scoring STARTER Player (trophy icon only, no bonus points).
 * Squads are excluded from MVP consideration.
 */
export function calculateTurnScore(
  turn:               number,
  starterPlayerScores: PlayerScore[],
  squadScores:         SquadScore[]
): TurnScore {
  const playerPoints = starterPlayerScores.reduce((sum, s) => sum + s.totalPoints, 0);
  const squadPoints  = squadScores.reduce((sum, s) => sum + s.totalPoints, 0);

  const mvp = starterPlayerScores.reduce<PlayerScore | null>(
    (best, s) => (!best || s.totalPoints > best.totalPoints ? s : best),
    null
  );

  return {
    turn,
    playerPoints,
    squadPoints,
    totalPoints:  playerPoints + squadPoints,
    mvpPlayerId:  mvp?.playerId,
  };
}
