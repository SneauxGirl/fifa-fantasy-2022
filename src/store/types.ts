// ==============================
// Redux Store Types
// ==============================
// Centralized type definitions to avoid circular dependencies
// Combines state types from all slices without importing from index.ts

import type { TypedUseSelectorHook } from "react-redux";
import type { RosterState } from "./slices/rosterSlice";
import type { MatchesState } from "./slices/matchesSlice";
import type { UIState } from "./slices/uiSlice";
import type { NationTeamsState } from "./slices/nationTeamsSlice";
import type { LineupState } from "./slices/lineupSlice";
import type { DataSourceState } from "./slices/dataSourceSlice";
import type { TurnScoresState } from "./slices/turnScoresSlice";

/**
 * Complete Redux state shape
 * Combines all slice states in one place
 */
export interface RootState {
  roster: RosterState;
  matches: MatchesState;
  ui: UIState;
  nationTeams: NationTeamsState;
  lineup: LineupState;
  dataSource: DataSourceState;
  turnScores: TurnScoresState;
}

// These will be properly typed in store/index.ts after store creation
export type AppDispatch = any;
export type UseAppSelector = TypedUseSelectorHook<RootState>;
