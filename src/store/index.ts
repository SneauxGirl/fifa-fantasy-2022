// ==============================
// Redux Store
// ==============================

import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";

import rosterReducer from "./slices/rosterSlice";
import matchesReducer from "./slices/matchesSlice";
import uiReducer from "./slices/uiSlice";
import nationTeamsReducer from "./slices/nationTeamsSlice";
import lineupReducer from "./slices/lineupSlice";
import dataSourceReducer from "./slices/dataSourceSlice";
import liveScoresReducer from "./slices/liveScoresSlice";
import turnScoresReducer from "./slices/turnScoresSlice";
import type { RootState } from "./types";

// Re-export async thunks for use in components
export { playTurn } from "./thunks/rosterThunks";
export { restartMatchPlay } from "./thunks/matchPlayThunks";

export const store = configureStore({
  reducer: {
    roster: rosterReducer,
    matches: matchesReducer,
    ui: uiReducer,
    nationTeams: nationTeamsReducer,
    lineup: lineupReducer,
    dataSource: dataSourceReducer,
    liveScores: liveScoresReducer,
    turnScores: turnScoresReducer,
  },
});

// ─── Typed helpers ────────────────────────────────────────────────────────────
// Use these throughout the app instead of the plain useDispatch / useSelector hooks.

export type AppDispatch = typeof store.dispatch;

// Re-export RootState and related types from types.ts for convenience
export type { RootState, UseAppSelector } from "./types";

export const useAppDispatch: () => AppDispatch               = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
