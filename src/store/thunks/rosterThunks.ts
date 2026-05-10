/**
 * Roster Thunks
 * Async operations for turn-based gameplay
 * Orchestrates complex multi-step state updates
 */

import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../types";
import {
  markPlayerAsEliminated,
  movePlayerToEliminated,
  moveSquadToEliminated,
  setGroupStageReplaceableFlags,
} from "../slices/rosterSlice";
import {
  updateTeamElimination,
  updateTeamPlayersElimination,
  updateTeamSquadsElimination,
} from "../slices/nationTeamsSlice";
import {
  setMatches,
  setLoading,
  setError,
  setTurnSimulation,
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
import type { PlayerScore, SquadScore } from "../../types/fantasyScore";
import {
  advanceTurnSimulation,
  buildTurnMatchIds,
  persistTurnSimulationToStorage,
  type TurnId,
} from "../../lib/turnSimulation";
import { countryCodesWithTwoLossesInFirstTwoGroupTurns } from "../../lib/groupStageReplaceable";
import { normalizeMatchesNationalTeamIds } from "../../lib/normalizeMatchNationalTeamIds";
import { persistScheduleMatches } from "../../lib/persistSchedule";
import {
  countryCodesEliminatedAfterGroupStage,
  resolveBracketMatches,
} from "../../lib/bracketResolve";
import canonicalKnockout from "../../data/wc2022-canonical-knockout.json";

const WC2022_KO_CANONICAL = canonicalKnockout as Record<
  string,
  { status: Match["status"]; score: Match["score"] }
>;

const KO_MATCH_ID_MIN = 49;
const KO_MATCH_ID_MAX = 64;

/**
 * Apply fetched turn rows + historical WC 2022 KO scores, then resolve winner-of /
 * group-place slots for the full schedule.
 */
function mergePlayedTurnIntoSchedule(
  existingMatches: Match[],
  matchResults: Match[],
  nationalTeams: RootState["nationTeams"]["teams"]
): Match[] {
  const resultById = new Map(matchResults.map((m) => [m.id, m]));
  const turnIdSet = new Set(matchResults.map((m) => m.id));

  const merged = existingMatches.map((match) => {
    if (!turnIdSet.has(match.id)) return match;
    const fetched = resultById.get(match.id);
    if (!fetched) return match;

    if (match.id >= KO_MATCH_ID_MIN && match.id <= KO_MATCH_ID_MAX) {
      const canon = WC2022_KO_CANONICAL[String(match.id)];
      if (!canon) {
        return {
          ...match,
          status: fetched.status,
          score: fetched.score,
          events: fetched.events.length ? fetched.events : match.events,
        };
      }
      return {
        ...match,
        status: canon.status,
        score: {
          halftime: canon.score.halftime,
          fulltime: canon.score.fulltime,
          extratime: canon.score.extratime,
          penalty: canon.score.penalty,
          live: match.score.live,
        },
        events: fetched.events.length ? fetched.events : match.events,
      };
    }

    return {
      ...fetched,
      bracketFeeds: match.bracketFeeds,
    };
  });

  return resolveBracketMatches(merged, nationalTeams);
}

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
 * **Turn ID Mapping** (see `src/lib/wc2022TurnSchedule.ts` — shared with `getMatchResults`):
 * - "Group_Stage_1" → Turn 1 (MD1: Nov 20–24)
 * - "Group_Stage_2" → Turn 2 (MD2: Nov 25–28)
 * - "Group_Stage_Final" → Turn 3 (MD3: Nov 29–Dec 3)
 * - "R16" → Turn 4 (Dec 3-7)
 * - "Quarterfinals" → Turn 5 (Dec 9–10) ← Roster lock activates here
 * - "Semifinals" → Turn 6 (Dec 13–14)
 * - "Final" → Turn 7 (Dec 18)
 *
 * After GS2, optional replacement flags mark nations with **two tournament losses** in GS1+GS2
 * (real fixtures on the schedule), not fantasy starter outcomes nor MD3 math.
 *
 * **Elimination Cascade**:
 * - Group Stage Final (MD3): teams finishing 3rd/4th in each group are eliminated (standings)
 * - Knockout (R16+): losers eliminated per match (FT / AET / PEN)
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
      const turnSimulation = state.matches.turnSimulation;
      if (turnSimulation && turnSimulation.currentTurnId !== turnId) {
        return rejectWithValue({
          message: `Turn ${turnId} is not currently playable.`,
        });
      }
      const { players: rosterPlayers, squads: rosterSquads } = state.roster;
      const nationalTeams = state.nationTeams.teams;
      const mergedSchedule = mergePlayedTurnIntoSchedule(
        state.matches.allMatches,
        matchResults,
        nationalTeams
      );
      const scheduleForStore = normalizeMatchesNationalTeamIds(
        mergedSchedule,
        nationalTeams
      );
      const playedMatchIds = new Set(matchResults.map((m) => m.id));
      const turnMatches = scheduleForStore.filter((m) => playedMatchIds.has(m.id));

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

      // Calculate player scores (signed roster starters only; bench excluded)
      const starterPlayerScores: PlayerScore[] = [];

      rosterPlayers
        .filter((rp) => rp.pool === "signed" && rp.role === "starter")
        .forEach((rosterPlayer) => {
          const rawPid = rosterPlayer.playerId;
          const numericPlayerId =
            typeof rawPid === "number"
              ? rawPid
              : typeof rawPid === "string" && rawPid !== "missing" && !Number.isNaN(Number(rawPid))
                ? Number(rawPid)
                : 0;
          if (!numericPlayerId) return;

          const player: Player = {
            playerId: numericPlayerId,
            id: numericPlayerId,
            firstName: rosterPlayer.name?.split(" ")[0] || "",
            lastName: rosterPlayer.name?.split(" ").slice(1).join(" ") || "",
            apiDisplayName: rosterPlayer.name || "",
            position: rosterPlayer.position,
            nationality: "",
            countryCode: rosterPlayer.countryCode,
            club: "",
            status: "bench",
          };

          // Check each match to see if this player participated
          turnMatches.forEach((match) => {
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

      // Squad fantasy points only for squads on your roster (signed pool)
      const squadScores: SquadScore[] = [];

      rosterSquads.filter((s) => s.pool === "signed").forEach((rosterSquad) => {
        // Find the squad's match in this turn (squads only play once per turn)
        const squadMatch = turnMatches.find(
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

      let eliminatedCountryCodes = detectEliminatedTeams(turnMatches, turnId);
      if (turnId === "Group_Stage_Final" && nationalTeams.length > 0) {
        const fromGroups = countryCodesEliminatedAfterGroupStage(
          scheduleForStore,
          nationalTeams
        );
        eliminatedCountryCodes = [...new Set([...eliminatedCountryCodes, ...fromGroups])];
      }
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
      eliminations.players.forEach((player) => {
        if (player.pool === "signed") {
          dispatch(
            movePlayerToEliminated({
              player,
              reason: "tournament",
            })
          );
        } else if (player.pool === "available" || player.pool === "unsigned") {
          dispatch(
            markPlayerAsEliminated({
              player,
              reason: "tournament",
            })
          );
        }
      });

      // Dispatch for each eliminated squad
      eliminations.squads.forEach((squad) => {
        dispatch(moveSquadToEliminated(squad));
      });

      eliminatedCountryCodes.forEach((code) => {
        const nt = nationalTeams.find((t) => t.countryCode === code);
        if (!nt) return;
        dispatch(updateTeamElimination({ teamId: nt.teamId, isEliminated: true }));
        dispatch(updateTeamPlayersElimination({ teamId: nt.teamId, isEliminated: true }));
        dispatch(updateTeamSquadsElimination({ teamId: nt.teamId, isEliminated: true }));
      });

      console.log("[playTurn] Step 5: Eliminated members moved to pool");

      // ─── Step 5b: Two GS1+GS2 tournament losses → optional replacement flag (not KO elimination)
      if (turnId === "Group_Stage_2") {
        const turnIdsMap = buildTurnMatchIds(scheduleForStore);
        const codes = countryCodesWithTwoLossesInFirstTwoGroupTurns(
          scheduleForStore,
          turnIdsMap.Group_Stage_1,
          turnIdsMap.Group_Stage_2
        );
        dispatch(setGroupStageReplaceableFlags({ countryCodes: codes }));
      }

      // ─── STEP 6: Store match data for future reference ──────────────
      dispatch(setMatches(scheduleForStore));
      persistScheduleMatches(scheduleForStore);

      const currentTurnSimulation = getState().matches.turnSimulation;
      if (currentTurnSimulation) {
        const nextTurnSimulation = advanceTurnSimulation(
          currentTurnSimulation,
          scheduleForStore,
          turnId as TurnId
        );
        dispatch(setTurnSimulation(nextTurnSimulation));
        persistTurnSimulationToStorage(nextTurnSimulation);
      }

      dispatch(setLoading(false));

      console.log("[playTurn] Step 6: Match data stored");

      // ─── STEP 7: Return result ──────────────────────────────────────
      return {
        matches: scheduleForStore,
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
 * Detect eliminated national teams from knockout match results (losers only).
 * Group-stage elimination runs separately via `countryCodesEliminatedAfterGroupStage` when MD3 completes.
 */
function detectEliminatedTeams(matches: Match[], turnId: string): string[] {
  if (turnId.includes("Group") || turnId.includes("group")) {
    return [];
  }

  const eliminated: string[] = [];

  matches
    .filter((m) => ["FT", "AET", "PEN"].includes(m.status.short))
    .forEach((match) => {
      if (match.homeTeam.countryCode === "TBD" || match.awayTeam.countryCode === "TBD") {
        return;
      }
      const status = match.status.short;
      const ftH = match.score.fulltime?.home ?? 0;
      const ftA = match.score.fulltime?.away ?? 0;
      const etH =
        status === "AET" || status === "PEN"
          ? match.score.extratime?.home ?? 0
          : 0;
      const etA =
        status === "AET" || status === "PEN"
          ? match.score.extratime?.away ?? 0
          : 0;
      const homeGoals = ftH + etH;
      const awayGoals = ftA + etA;

      if (status === "PEN" && homeGoals === awayGoals) {
        const ph = match.score.penalty?.home ?? 0;
        const pa = match.score.penalty?.away ?? 0;
        if (ph > pa) eliminated.push(match.awayTeam.countryCode);
        else if (pa > ph) eliminated.push(match.homeTeam.countryCode);
        return;
      }

      if (homeGoals > awayGoals) eliminated.push(match.awayTeam.countryCode);
      else if (awayGoals > homeGoals) eliminated.push(match.homeTeam.countryCode);
    });

  return [...new Set(eliminated)];
}

/**
 * TODO: Additional thunks for Phase 3+
 * - calculateTurnScores() - dedicated scoring calculation thunk
 * - applyEliminationCascade() - dedicated elimination logic thunk
 * - validateRoster() - pre-play roster validation
 */
