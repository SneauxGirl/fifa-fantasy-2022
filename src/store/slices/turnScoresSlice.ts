/**
 * Turn Scores Slice — Redux State Management for Calculated Scores
 *
 * **Purpose**: Persists calculated fantasy points by turn for historical reference and UI display.
 * Scores are calculated on-demand when user clicks "Play" (in playTurn thunk), then stored here.
 *
 * **Data Structure**:
 * - `byTurn: Record<number, TurnData>` — Keyed by turn number (1-7)
 *   - `turnScore: TurnScore` — Aggregated total for the turn (player + squad points)
 *   - `playerScores: PlayerScore[]` — Individual scores for each starter player who played
 *   - `squadScores: SquadScore[]` — Individual scores for each squad
 * - `cumulativeTotal: number` — Running sum across all turns (never resets)
 *
 * **Key Behaviors**:
 * - Players/squads who didn't play in a turn are not included (not 0, simply absent)
 * - Bench players never appear (not calculated)
 * - Eliminated players continue to score if they participated before elimination
 * - Substitution multiplier (50%) already baked into individual scores
 * - All points cumulative and historical (full audit trail)
 *
 * **Phase**: Phase 3.6 (Scoring Calculation & Storage)
 *
 * @see `/src/store/thunks/rosterThunks.ts` — playTurn thunk (calculates scores)
 * @see `/src/lib/scoring/` — Scoring functions (calculatePlayerScore, calculateSquadScore, calculateTurnScore)
 * @see `/src/types/fantasyScore.ts` — Type definitions
 */

import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { TurnScore, PlayerScore, SquadScore } from "../../types/fantasyScore";

export interface TurnScoresState {
  byTurn: Record<number, {
    turnScore: TurnScore;
    playerScores: PlayerScore[];
    squadScores: SquadScore[];
  }>;
  cumulativeTotal: number; // Sum of all turn totals
}

const initialState: TurnScoresState = {
  byTurn: {},
  cumulativeTotal: 0,
};

const turnScoresSlice = createSlice({
  name: "turnScores",
  initialState,
  reducers: {
    /**
     * Store calculated scores for a completed turn
     */
    storeTurnScores: (
      state,
      action: PayloadAction<{
        turn: number;
        turnScore: TurnScore;
        playerScores: PlayerScore[];
        squadScores: SquadScore[];
      }>
    ) => {
      const { turn, turnScore, playerScores, squadScores } = action.payload;

      state.byTurn[turn] = {
        turnScore,
        playerScores,
        squadScores,
      };

      // Recalculate cumulative total
      state.cumulativeTotal = Object.values(state.byTurn).reduce(
        (sum, turnData) => sum + turnData.turnScore.totalPoints,
        0
      );
    },

    /**
     * Clear all turn scores (for reset/testing)
     */
    clearTurnScores: (state) => {
      state.byTurn = {};
      state.cumulativeTotal = 0;
    },
  },
});

export const { storeTurnScores, clearTurnScores } = turnScoresSlice.actions;
export default turnScoresSlice.reducer;
