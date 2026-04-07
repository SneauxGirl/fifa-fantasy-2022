import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface LiveScore {
  matchId: number;
  home: number;
  away: number;
  elapsed: number;
  lastUpdated: number;
}

export interface LiveScoresState {
  scores: Record<number, LiveScore>;
}

const initialState: LiveScoresState = {
  scores: {},
};

/**
 * Generate randomized current score and elapsed time for a live match
 * Subtracts 0-3 random points from final score, ensures result >= 0
 * Also randomizes elapsed time between 15-89 minutes
 */
export const generateLiveScore = (finalHome: number, finalAway: number, matchId: number): LiveScore => {
  // Use matchId to seed the randomization for consistency
  const seed = matchId * 73856093 ^ 19349663;
  const homeDeduction = Math.floor(Math.abs((seed / 1000000) % 4));
  const awayDeduction = Math.floor(Math.abs(((seed * 37) / 1000000) % 4));
  const elapsedTime = 15 + Math.floor(Math.abs(((seed * 73) / 1000000) % 75)); // 15-89 minutes

  return {
    matchId,
    home: Math.max(0, finalHome - homeDeduction),
    away: Math.max(0, finalAway - awayDeduction),
    elapsed: Math.round(elapsedTime),
    lastUpdated: Date.now(),
  };
};

const liveScoresSlice = createSlice({
  name: "liveScores",
  initialState,
  reducers: {
    setLiveScore: (state, action: PayloadAction<LiveScore>) => {
      state.scores[action.payload.matchId] = action.payload;
    },

    removeLiveScore: (state, action: PayloadAction<number>) => {
      delete state.scores[action.payload];
    },

    setLiveScores: (state, action: PayloadAction<Record<number, LiveScore>>) => {
      state.scores = action.payload;
    },

    clearLiveScores: (state) => {
      state.scores = {};
    },
  },
});

export const { setLiveScore, removeLiveScore, setLiveScores, clearLiveScores } = liveScoresSlice.actions;
export default liveScoresSlice.reducer;
