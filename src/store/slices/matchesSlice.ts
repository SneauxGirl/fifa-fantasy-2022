import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Match } from "../../types/match";

export interface MatchesState {
  allMatches: Match[];
  rosterMatches: Match[];
  lastUpdated: number | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: MatchesState = {
  allMatches: [],
  rosterMatches: [],
  lastUpdated: null,
  isLoading: false,
  error: null,
};

const matchesSlice = createSlice({
  name: "matches",
  initialState,
  reducers: {
    setMatches: (state, action: PayloadAction<Match[]>) => {
      state.allMatches = action.payload;
      state.lastUpdated = Date.now();
    },

    setRosterMatches: (state, action: PayloadAction<Match[]>) => {
      state.rosterMatches = action.payload;
    },

    updateMatch: (state, action: PayloadAction<Match>) => {
      const matchIndex = state.allMatches.findIndex(m => m.id === action.payload.id);
      if (matchIndex !== -1) {
        state.allMatches[matchIndex] = action.payload;
      }

      const rosterMatchIndex = state.rosterMatches.findIndex(m => m.id === action.payload.id);
      if (rosterMatchIndex !== -1) {
        state.rosterMatches[rosterMatchIndex] = action.payload;
      }

      state.lastUpdated = Date.now();
    },

    updateScore: (
      state,
      action: PayloadAction<{
        matchId: number;
        halftime?: { home: number; away: number };
        fulltime?: { home: number; away: number };
        extratime?: { home: number; away: number };
        penalty?: { home: number; away: number };
      }>
    ) => {
      const match = state.allMatches.find(m => m.id === action.payload.matchId);
      if (match) {
        if (action.payload.halftime) {
          match.score.halftime = action.payload.halftime;
        }
        if (action.payload.fulltime) {
          match.score.fulltime = action.payload.fulltime;
        }
        if (action.payload.extratime) {
          match.score.extratime = action.payload.extratime;
        }
        if (action.payload.penalty) {
          match.score.penalty = action.payload.penalty;
        }
        state.lastUpdated = Date.now();
      }
    },

    updateMatchStatus: (
      state,
      action: PayloadAction<{
        matchId: number;
        status: { short: string; long: string; elapsed: number | null };
      }>
    ) => {
      const match = state.allMatches.find(m => m.id === action.payload.matchId);
      if (match) {
        match.status = action.payload.status as any;
        state.lastUpdated = Date.now();
      }
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setMatches,
  setRosterMatches,
  updateMatch,
  updateScore,
  updateMatchStatus,
  setLoading,
  setError,
} = matchesSlice.actions;

export default matchesSlice.reducer;
