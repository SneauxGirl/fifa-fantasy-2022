import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RosterSquad } from "../../types/match";

/**
 * National Teams Slice
 *
 * Stores the authoritative data about national teams in the tournament
 * (as it comes from the API or mock data).
 *
 * This is the source of truth for:
 * - Which teams are in the tournament
 * - Which teams are eliminated
 * - Team rosters (available players)
 *
 * The roster system compares against this data to determine what
 * needs to be updated when a team's tournament status changes.
 *
 * NOTE: Team colors are NOT stored in Redux. Use lib/teamColors.ts getTeamColors() utility instead.
 * Colors are single source of truth in src/data/APItoFIFAmaps.json (teamColors section).
 *
 * TODO: INCOMPLETE REFACTOR (Phase 3.4 - to be completed)
 * Currently only stores squads array. Should expand to include:
 * - Full team metadata (teamId, teamName, countryCode, flag, confederation, group, coaches)
 * - All ~650 players from all 32 teams (national rosters, not user selections)
 * - This is the 32-team tournament source of truth (distinct from rosterSlice user selections)
 * See: docs/logic-notes.md Section 6 (App.tsx Initialization) for architecture details
 *
 */

export interface NationTeamsState {
  squads: RosterSquad[];
}

const initialState: NationTeamsState = {
  squads: [],
};

const nationTeamsSlice = createSlice({
  name: "nationTeams",
  initialState,
  reducers: {
    /**
     * Initialize national teams data from tournament data
     * Called on app startup with data from API or mock JSON
     */
    initializeNationTeams: (state, action: PayloadAction<RosterSquad[]>) => {
      state.squads = action.payload;
    },

    /**
     * Update a team's elimination status (simulates API update)
     * Called when the tournament announces a team is eliminated
     */
    updateTeamElimination: (
      state,
      action: PayloadAction<{ teamId: number; isEliminated: boolean }>
    ) => {
      const { teamId, isEliminated } = action.payload;
      const squad = state.squads.find((s) => s.teamId === teamId);
      if (squad) {
        squad.isEliminated = isEliminated;
      }
    },
  },
});

export const { initializeNationTeams, updateTeamElimination } =
  nationTeamsSlice.actions;

export default nationTeamsSlice.reducer;
