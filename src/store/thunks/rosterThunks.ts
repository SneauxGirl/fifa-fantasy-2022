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
import { storeTurnScores } from "../slices/turnScoresSlice";
import { getMatchResults } from "../../services/apiFootball";
import type { Match, RosterPlayer, RosterSquad } from "../../types/match";
import type { Squad } from "../../types/squad";
import { extractPlayerMatchStats } from "../../lib/scoring/matchStatsExtractor";
import {
  calculatePlayerScore,
  calculateSquadScore,
  calculateTurnScore,
} from "../../lib/scoring";
import type { Player } from "../../types/player";

/**
 * Play Turn Async Thunk — Turn Completion Orchestrator
 *
 * **Purpose**: Executes complete turn in strict sequence when user clicks "Play" button.
 * Handles match fetching, score calculation, elimination cascade, and state persistence.
 *
 * **Sequence** (order critical):
 * 1. Fetch match results for turn via API/mock data
 * 2. Extract player stats from match events
 * 3. Calculate fantasy scores (player + squad) using position-based formulas
 * 4. Aggregate into turn totals with MVP tracking
 * 5. Store scores in turnScoresSlice Redux
 * 6. Detect eliminated national teams from knockout results
 * 7. Cascade eliminations to roster squads and players
 * 8. Dispatch elimination move actions
 * 9. Persist match data
 *
 * **Turn ID Mapping**:
 * - "Group_Stage_1" → Turn 1 (Nov 20-26)
 * - "Group_Stage_2" → Turn 2 (Nov 26-30)
 * - "Group_Stage_Final" → Turn 3 (Nov 29-Dec 3)
 * - "R16" → Turn 4 (Dec 3-7)
 * - "Quarterfinals" → Turn 5 (Dec 9-11) ← Roster lock activates here
 * - "Semifinals" → Turn 6 (Dec 14-15)
 * - "Final" → Turn 7 (Dec 18)
 *
 * **Elimination Cascade**:
 * - Only knockout stages (R16+) produce eliminations
 * - Losers are eliminated; winners/draws both advance (except PEN winner determined)
 * - Eliminated team → All its roster squads marked eliminated
 * - Eliminated team → All its roster players marked eliminated
 *
 * **Scoring Rules** (see calculatePlayerScore, calculateSquadScore):
 * - Only STARTER players score (bench excluded)
 * - All squads score (always starters)
 * - Substitute flag (R16+ signups) applies 50% multiplier
 * - Non-playing members produce no score entry (not zero)
 *
 * **Error Handling**:
 * - Rejects if no matches found for turn
 * - Logs all steps for debugging
 * - Dispatches setError on failure
 *
 * **Dispatch Actions**:
 * - setLoading(true/false) — Loading state
 * - storeTurnScores() — Persist calculated scores
 * - movePlayerToEliminated() — Per eliminated player
 * - moveSquadToEliminated() — Per eliminated squad
 * - setMatches() — Store match data
 * - setError() — On failure
 *
 * **Return Value**:
 * - matches: Match[] — All matches for the turn
 * - eliminations: { players, squads } — Who got eliminated
 *
 * @param turnId - Turn identifier string (e.g., "Group_Stage_1", "R16", "Final")
 * @returns Promise resolving to match results and elimination data
 *
 * @see `/src/store/slices/turnScoresSlice.ts` — Score storage
 * @see `/src/lib/scoring/` — Scoring calculation functions
 * @see `/src/lib/scoring/matchStatsExtractor.ts` — Stats extraction from events
 *
 * **Phase**: Phase 3.5-3.6 (Turn Completion & Scoring)
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

      // Calculate player scores (STARTERS ONLY)
      const starterPlayerScores = [];

      rosterPlayers
        .filter((rp) => rp.role === "starter") // Only starters score
        .forEach((rosterPlayer) => {
          const player: Player = {
            playerId: typeof rosterPlayer.playerId === "number" ? rosterPlayer.playerId : 0,
            id: typeof rosterPlayer.playerId === "number" ? rosterPlayer.playerId : 0,
            firstName: rosterPlayer.name?.split(" ")[0] || "",
            lastName: rosterPlayer.name?.split(" ").slice(1).join(" ") || "",
            apiDisplayName: rosterPlayer.name || "",
            position: rosterPlayer.position,
            positionFull: rosterPlayer.position,
            nationality: "",
            countryCode: rosterPlayer.countryCode,
            nationalityLocal: "",
            club: "",
            status: "bench",
          };

          // Check each match to see if this player participated
          matchResults.forEach((match) => {
            const stats = extractPlayerMatchStats(player, match);
            if (!stats) return; // Player didn't play in this match

            // Calculate player score for this match
            const score = calculatePlayerScore(
              player,
              stats,
              rosterPlayer.substitute || false, // Apply 50% multiplier if substitute
              match.id
            );

            starterPlayerScores.push(score);
          });
        });

      console.log(
        `[playTurn] Calculated ${starterPlayerScores.length} player match scores`
      );

      // Calculate squad scores
      const squadScores = [];

      rosterSquads.forEach((rosterSquad) => {
        // Find the squad's match in this turn (squads only play once per turn)
        const squadMatch = matchResults.find(
          (m) =>
            m.homeTeam.countryCode === rosterSquad.countryCode ||
            m.awayTeam.countryCode === rosterSquad.countryCode
        );

        // Determine if squad played and get squad object for scoring
        if (!squadMatch) {
          console.warn(
            `[playTurn] No match found for squad ${rosterSquad.countryCode}`
          );
          return;
        }

        // Create a Squad object for the scoring function
        // Squad.code should match the API format team code
        const squadObject: Squad = {
          id: rosterSquad.teamId || 0,
          code: rosterSquad.countryCode,
          name: rosterSquad.name,
          nameLocal: rosterSquad.name,
          flag: rosterSquad.flag,
        };

        const score = calculateSquadScore(
          squadObject,
          squadMatch,
          rosterSquad.substitute || false,
          0 // No advancement bonus at this stage
        );

        squadScores.push(score);
      });

      console.log(`[playTurn] Calculated ${squadScores.length} squad scores`);

      // Aggregate into turn total
      // Turn ID mapping: Group_Stage_1=1, Group_Stage_2=2, Group_Stage_Final=3, etc.
      const turnNumberMap: Record<string, number> = {
        Group_Stage_1: 1,
        Group_Stage_2: 2,
        Group_Stage_Final: 3,
        R16: 4,
        Quarterfinals: 5,
        Semifinals: 6,
        Final: 7,
      };

      const turnNumber = turnNumberMap[turnId] || 0;
      const turnScore = calculateTurnScore(turnNumber, starterPlayerScores, squadScores);

      console.log(
        `[playTurn] Step 1: Turn ${turnNumber} scores calculated - Total: ${turnScore.totalPoints}`
      );

      // Dispatch action to store turn scores
      dispatch(
        storeTurnScores({
          turn: turnNumber,
          turnScore,
          playerScores: starterPlayerScores,
          squadScores,
        })
      );

      // ─── STEP 2: Lock scores (points final for this turn) ────────────
      // TODO: Update reducer to mark scores as locked in current turn
      console.log("[playTurn] Step 2: Scores locked");

      // ─── STEP 3: Update elimination status ──────────────────────────
      // Check national team eliminations and cascade to players/squads
      const eliminations = {
        players: [] as RosterPlayer[],
        squads: [] as RosterSquad[],
      };

      // Detect eliminated national teams from knockout match results
      const eliminatedCountryCodes = detectEliminatedTeams(matchResults, turnId);
      console.log(`[playTurn] Detected ${eliminatedCountryCodes.length} eliminated teams:`, eliminatedCountryCodes);

      // Find roster squads from eliminated teams
      eliminations.squads = rosterSquads.filter((squad) =>
        eliminatedCountryCodes.includes(squad.countryCode)
      );

      // Find roster players from eliminated teams
      eliminations.players = rosterPlayers.filter((player) =>
        eliminatedCountryCodes.includes(player.countryCode)
      );

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
 * Detect eliminated national teams from match results
 * Only knockout stages have eliminations (teams are eliminated on loss)
 */
function detectEliminatedTeams(matches: Match[], turnId: string): string[] {
  // Group stage matches don't eliminate teams
  if (turnId.includes("Group") || turnId.includes("group")) {
    return [];
  }

  const eliminated: string[] = [];

  // For knockout matches: losers are eliminated
  matches
    .filter((m) => ["FT", "AET", "PEN"].includes(m.status.short))
    .forEach((match) => {
      const score = match.score.fulltime;
      if (!score) return;

      // Determine loser (eliminated)
      if (score.home > score.away) {
        eliminated.push(match.awayTeam.countryCode);
      } else if (score.away > score.home) {
        eliminated.push(match.homeTeam.countryCode);
      }
      // Draws: both teams advance (no elimination in knockout)
    });

  return [...new Set(eliminated)]; // Remove duplicates
}

/**
 * TODO: Additional thunks for Phase 3+
 * - calculateTurnScores() - dedicated scoring calculation thunk
 * - applyEliminationCascade() - dedicated elimination logic thunk
 * - validateRoster() - pre-play roster validation
 */
