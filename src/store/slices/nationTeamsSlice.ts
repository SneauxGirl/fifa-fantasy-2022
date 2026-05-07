import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { NationalTeam, NationalPlayer } from "../../types/match";

/**
 * National Teams Slice
 *
 * Stores the authoritative data about all 32 national teams in the tournament.
 * This is the source of truth for:
 * - Team metadata (name, confederation, group, coaches)
 * - Team elimination status (tournament-level)
 * - All national team rosters (~25 players per team, ~650 total)
 * - Each team's squad record for fantasy scoring
 *
 * The elimination cascade logic uses this data as the starting point:
 * When a team is eliminated, all its players and squads are marked eliminated.
 *
 * Architecture:
 * - Each NationalTeam contains nested squads and players arrays
 * - Nested structure matches squads.json for consistency
 * - Updateable: isEliminated flag cascades to nested players/squads
 *
 * NOTE: Team colors are NOT stored here. Use lib/teamColors.ts getTeamColors() utility instead.
 * Colors single source of truth: src/data/APItoFIFAmaps.json (teamColors section).
 *
 */

export interface NationTeamsState {
  teams: NationalTeam[];
}

const initialState: NationTeamsState = {
  teams: [],
};

const nationTeamsSlice = createSlice({
  name: "nationTeams",
  initialState,
  reducers: {
    /**
     * Initialize national teams with full tournament data
     * Called on app startup with data from squads.json
     * Input: Array of 32 NationalTeam objects with nested squads & players
     */
    initializeNationTeams: (state, action: PayloadAction<NationalTeam[]>) => {
      state.teams = action.payload;
    },

    /**
     * Mark a national team as eliminated (cascade via elimination logic)
     * Sets isEliminated flag on team. Nested players/squads updated by rosterThunk.
     * Called when tournament announces a team is eliminated (knockout loss).
     */
    updateTeamElimination: (
      state,
      action: PayloadAction<{ teamId: number; isEliminated: boolean }>
    ) => {
      const { teamId, isEliminated } = action.payload;
      const team = state.teams.find((t) => t.teamId === teamId);
      if (team) {
        team.isEliminated = isEliminated;
      }
    },

    /**
     * Update elimination status for nested players in a team
     * Called by elimination cascade logic after team is marked eliminated
     */
    updateTeamPlayersElimination: (
      state,
      action: PayloadAction<{ teamId: number; isEliminated: boolean }>
    ) => {
      const { teamId, isEliminated } = action.payload;
      const team = state.teams.find((t) => t.teamId === teamId);
      if (team) {
        team.players.forEach((player) => {
          player.isEliminated = isEliminated;
        });
      }
    },

    /**
     * Update elimination status for nested squads in a team
     * Called by elimination cascade logic after team is marked eliminated
     */
    updateTeamSquadsElimination: (
      state,
      action: PayloadAction<{ teamId: number; isEliminated: boolean }>
    ) => {
      const { teamId, isEliminated } = action.payload;
      const team = state.teams.find((t) => t.teamId === teamId);
      if (team) {
        team.squads.forEach((squad) => {
          squad.isEliminated = isEliminated;
        });
      }
    },
  },
});

export const {
  initializeNationTeams,
  updateTeamElimination,
  updateTeamPlayersElimination,
  updateTeamSquadsElimination,
} = nationTeamsSlice.actions;

export default nationTeamsSlice.reducer;
