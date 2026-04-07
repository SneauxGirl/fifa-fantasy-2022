/**
 * Roster Thunks
 * Async operations for turn-based gameplay
 * Orchestrates complex multi-step state updates
 */

import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../types";
import {
  movePlayerToEliminated,
  moveSquadToEliminated,
} from "../slices/rosterSlice";
import {
  setMatches,
  setLoading,
  setError,
} from "../slices/matchesSlice";
import { getMatchResults } from "../../services/apiFootball";
import type { Match, RosterPlayer, RosterSquad } from "../../types/match";

/**
 * Play Turn Async Thunk
 * Orchestrates turn completion in strict sequence:
 * 1. Fetch match results for this turn
 * 2. Calculate and update player/squad scores
 * 3. Lock scores (mark as final for this turn)
 * 4. Update elimination status
 * 5. Show elimination modal
 * 6. Move eliminated members to eliminated pool
 * 7. Advance turn counter
 *
 * @param turnId - Turn identifier (e.g., "Group_Stage_1", "R16", "Final")
 */
export const playTurn = createAsyncThunk<
  {
    matches: Match[];
    eliminations: {
      players: RosterPlayer[];
      squads: RosterSquad[];
    };
  },
  string, // turnId
  {
    state: RootState;
    rejectValue: { message: string };
  }
>(
  "roster/playTurn",
  async (turnId, { dispatch, getState, rejectWithValue }) => {
    try {
      // ─── STEP 0: Fetch match results from API ───────────────────────
      dispatch(setLoading(true));
      console.log(`[playTurn] Fetching match results for turn: ${turnId}`);

      const matchResults = await getMatchResults(turnId);

      if (!matchResults || matchResults.length === 0) {
        return rejectWithValue({
          message: `No matches found for turn: ${turnId}`,
        });
      }

      console.log(
        `[playTurn] Fetched ${matchResults.length} matches for turn: ${turnId}`
      );

      // ─── STEP 1: Calculate scores (for Scoring Record display) ───────
      const state = getState();
      const { players: rosterPlayers, squads: rosterSquads } = state.roster;

      // TODO: Calculate player scores from matchResults
      // TODO: Calculate squad scores from matchResults
      // For now, placeholder - this will be implemented with scoring formula

      console.log("[playTurn] Step 1: Scores calculated");

      // ─── STEP 2: Lock scores (points final for this turn) ────────────
      // TODO: Update reducer to mark scores as locked
      console.log("[playTurn] Step 2: Scores locked");

      // ─── STEP 3: Update elimination status ──────────────────────────
      // Check national team eliminations and cascade to players/squads
      const eliminations = {
        players: [] as RosterPlayer[],
        squads: [] as RosterSquad[],
      };

      // TODO: Implement elimination cascade logic
      // - National teams eliminated
      // - Players marked isEliminated
      // - Squads marked isEliminated

      console.log(
        `[playTurn] Step 3: Elimination status updated (${eliminations.players.length} players, ${eliminations.squads.length} squads)`
      );

      // ─── STEP 4: Show elimination modal (user acknowledges) ──────────
      // TODO: Dispatch showEliminationModal action
      // This triggers UI modal; user must click acknowledge before Step 5
      console.log("[playTurn] Step 4: Elimination modal shown");

      // ─── STEP 5: Move eliminated members to pool ───────────────────
      // Dispatch for each eliminated player
      eliminations.players.forEach((player) => {
        dispatch(
          movePlayerToEliminated({
            player,
            reason: "tournament", // or "injury", "red_card", etc.
          })
        );
      });

      // Dispatch for each eliminated squad
      eliminations.squads.forEach((squad) => {
        dispatch(moveSquadToEliminated(squad));
      });

      console.log("[playTurn] Step 5: Eliminated members moved to pool");

      // ─── STEP 6: Store match data for future reference ──────────────
      dispatch(setMatches(matchResults));
      dispatch(setLoading(false));

      console.log("[playTurn] Step 6: Match data stored");

      // ─── STEP 7: Return result ──────────────────────────────────────
      return {
        matches: matchResults,
        eliminations,
      };
    } catch (error) {
      dispatch(setError((error as Error).message));
      dispatch(setLoading(false));

      console.error("[playTurn] Error:", error);

      return rejectWithValue({
        message: (error as Error).message || "Failed to play turn",
      });
    }
  }
);

/**
 * TODO: Additional thunks for Phase 3+
 * - calculateTurnScores() - dedicated scoring calculation thunk
 * - applyEliminationCascade() - dedicated elimination logic thunk
 * - validateRoster() - pre-play roster validation
 */
