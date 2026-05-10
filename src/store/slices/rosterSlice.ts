import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RosterPlayer, RosterSquad, RosterPool, RosterRole, Game } from "../../types/match";

//Review one more time. Should be current to 2022 logic #TODO 

/**
 * New Roster Model (Pool + Role Separation):
 *
 * Pool describes WHERE a member is:
 * - "available": Not selected (in tournament, awaiting selection)
 * - "unsigned": Dragged to staging, awaiting sign confirmation
 * - "signed": Locked to roster for tournament
 * - "eliminated": Was signed, now tournament-eliminated
 *
 * Role describes WHAT FUNCTION the member performs (only meaningful when pool === "signed" or "eliminated"):
 * - null: No role yet (pool: "available" or "unsigned")
 * - "starter": In formation, scoring actively
 * - "bench": In roster, not in formation, no scoring
 * - "eliminatedSigned": Was starter/bench, now tournament-eliminated
 *
 * Additional flags:
 * - isEliminated: Tournament elimination status (independent of pool)
 * - substitute: Signed during R16? Scores at 50% for entire tournament
 * - playerGames/squadGames: Scheduled games with isComplete flag
 */

export interface RosterState {
  players: RosterPlayer[];  // Single array, filtered by pool + role
  squads: RosterSquad[];    // Single array, filtered by pool + role
  validation: {
    roundLocked: boolean;
    isR16Week: boolean;     // Are we in R16 week? (affects substitute flag)
    tournamentRound: string; // "Round16" | "Quarterfinals" | "Semifinals" | "Finals"
  };
}

const initialState: RosterState = {
  players: [],
  squads: [],
  validation: {
    roundLocked: false,
    isR16Week: false,
    tournamentRound: "Round16",
  },
};

const rosterSlice = createSlice({
  name: "roster",
  initialState,
  reducers: {
    // ────────────────────────────────────────────────────────────────
    // PLAYER OPERATIONS
    // ────────────────────────────────────────────────────────────────

    /**
     * Move player from available → unsigned (staging)
     * Prerequisites: pool: "available", !isEliminated
     */
    movePlayerToUnsigned: (state, action: PayloadAction<RosterPlayer>) => {
      const player = action.payload;
      const index = state.players.findIndex(p => p.playerId === player.playerId);
      if (index !== -1) {
        state.players[index] = {
          ...state.players[index],
          pool: "unsigned",
          role: null,
        };
      }
    },

    /**
     * Move player from unsigned → available (cancel staging)
     */
    movePlayerToAvailable: (state, action: PayloadAction<RosterPlayer>) => {
      const player = action.payload;
      const index = state.players.findIndex(p => p.playerId === player.playerId);
      if (index !== -1) {
        state.players[index] = {
          ...state.players[index],
          pool: "available",
          role: null,
          groupStageReplaceable: false,
        };
      }
    },

    /**
     * Move player from unsigned → signed with role "bench"
     * Validates: <18 roster players, <3 goalkeepers
     */
    movePlayerToSigned: (
      state,
      action: PayloadAction<{ player: RosterPlayer; role?: RosterRole }>
    ) => {
      const { player, role } = action.payload;
      const index = state.players.findIndex(p => p.playerId === player.playerId);

      if (index !== -1) {
        const statePlayer = state.players[index]; // Use current state, not payload
        const signedPlayers = state.players.filter(
          p => p.pool === "signed" && !p.isEliminated
        );
        const gkCount = signedPlayers.filter(p => p.position === "Goalkeeper").length;

        // Validate roster capacity using current state
        if (signedPlayers.length < 18 && (statePlayer.position !== "Goalkeeper" || gkCount < 3)) {
          state.players[index] = {
            ...state.players[index],
            pool: "signed",
            role: role || "bench",
            substitute: state.validation.isR16Week, // Mark as substitute if R16 week
          };
        }
      }
    },

    /**
     * Move player from bench → starter (or promote from bench)
     * Validates: <11 starters, (<1 GK if player is GK)
     */
    movePlayerToStarter: (state, action: PayloadAction<RosterPlayer>) => {
      const player = action.payload;
      const index = state.players.findIndex(p => p.playerId === player.playerId);

      if (index !== -1) {
        const statePlayer = state.players[index]; // Use current state, not payload
        // Check pool from current state
        if (statePlayer.pool === "signed") {
          const starters = state.players.filter(
            p => p.role === "starter" && p.pool === "signed"
          );
          const gkStarters = starters.filter(p => p.position === "Goalkeeper").length;

          // Validate starter capacity using current state
          if (starters.length < 11 && (statePlayer.position !== "Goalkeeper" || gkStarters < 1)) {
            state.players[index] = {
              ...state.players[index],
              pool: "signed",
              role: "starter",
            };
          }
        }
      }
    },

    /**
     * Move player from starter → bench
     * Removes starter icon, keeps in roster
     */
    movePlayerToBench: (state, action: PayloadAction<RosterPlayer>) => {
      const player = action.payload;
      const index = state.players.findIndex(p => p.playerId === player.playerId);

      if (index !== -1) {
        const statePlayer = state.players[index]; // Use current state, not payload
        if (statePlayer.role === "starter") {
          state.players[index] = {
            ...state.players[index],
            pool: "signed",
            role: "bench",
          };
        }
      }
    },

    /**
     * Move player from signed → eliminated
     * Prerequisites: pool: "signed", isEliminated: true
     * Updates role to "eliminatedSigned"
     * Triggered when player's national team is eliminated
     */
    movePlayerToEliminated: (
      state,
      action: PayloadAction<{ player: RosterPlayer; reason: string }>
    ) => {
      const { player, reason } = action.payload;
      const index = state.players.findIndex(p => p.playerId === player.playerId);

      if (index !== -1) {
        const statePlayer = state.players[index]; // Use current state, not payload
        if (statePlayer.pool === "signed") {
          state.players[index] = {
            ...state.players[index],
            pool: "eliminated",
            role: "eliminatedSigned",
            isEliminated: true,
            rosterElimination: "new", // Mark as newly eliminated (triggers notification)
            eliminatedReason: reason as any,
            groupStageReplaceable: false,
          };
        }
      }
    },

    /**
     * Mark unsigned/available player as eliminated
     * Unsigned players move to available pool
     * Available players stay in available pool
     * Both get isEliminated: true (displayed greyed out in UI)
     * DOES NOT move to eliminated pool (no role assignment)
     * rosterElimination set to "resolved" (no notification)
     */
    markPlayerAsEliminated: (
      state,
      action: PayloadAction<{ player: RosterPlayer; newPool?: "available"; reason: string }>
    ) => {
      const { player, newPool = "available", reason } = action.payload;
      const index = state.players.findIndex(p => p.playerId === player.playerId);

      if (index !== -1) {
        const statePlayer = state.players[index]; // Use current state, not payload
        if (statePlayer.pool === "unsigned" || statePlayer.pool === "available") {
          state.players[index] = {
            ...state.players[index],
            pool: newPool,
            role: null, // Reset role when moving to available
            isEliminated: true,
            rosterElimination: "resolved", // Mark as resolved (no notification)
            eliminatedReason: reason as any,
          };
        }
      }
    },

    // ────────────────────────────────────────────────────────────────
    // SQUAD OPERATIONS
    // ────────────────────────────────────────────────────────────────

    /**
     * Move squad from available → unsigned (staging)
     * Prerequisites: pool: "available", !isEliminated
     */
    moveSquadToUnsigned: (state, action: PayloadAction<RosterSquad>) => {
      const squad = action.payload;
      const index = state.squads.findIndex(s => s.id === squad.id);
      if (index !== -1) {
        state.squads[index] = {
          ...state.squads[index],
          pool: "unsigned",
          role: null,
        };
      }
    },

    /**
     * Move squad from unsigned → available (cancel staging)
     */
    moveSquadToAvailable: (state, action: PayloadAction<RosterSquad>) => {
      const squad = action.payload;
      const index = state.squads.findIndex(s => s.id === squad.id);
      if (index !== -1) {
        state.squads[index] = {
          ...state.squads[index],
          pool: "available",
          role: null,
          groupStageReplaceable: false,
        };
      }
    },

    /**
     * Move squad from unsigned → signed with role "starter"
     * Squads are ALWAYS starters (all signed squads are active)
     * Validates: <4 signed squads
     * Shows confirmation dialog (popup enforcement handled in components)
     */
    moveSquadToSigned: (state, action: PayloadAction<RosterSquad>) => {
      const squad = action.payload;
      const index = state.squads.findIndex(s => s.id === squad.id);

      if (index !== -1) {
        // Check current state for validation
        const signedSquads = state.squads.filter(
          s => s.pool === "signed" && !s.isEliminated
        );

        // Validate squad cap
        if (signedSquads.length < 4) {
          state.squads[index] = {
            ...state.squads[index],
            pool: "signed",
            role: "starter", // Squads are always starters
            substitute: state.validation.isR16Week, // Mark as substitute if R16 week
          };
        }
      }
    },

    /**
     * Move squad to eliminated state
     * Handles all pools:
     * - SIGNED: Move to eliminated pool, role: eliminatedSigned, rosterElimination: "new"
     * - AVAILABLE/UNSIGNED: Move to eliminated pool, role: null, rosterElimination: "resolved"
     * Updates isEliminated: true
     */
    moveSquadToEliminated: (state, action: PayloadAction<RosterSquad>) => {
      const squad = action.payload;
      const index = state.squads.findIndex(s => s.id === squad.id);

      if (index !== -1) {
        const stateSquad = state.squads[index]; // Use current state, not payload

        if (stateSquad.pool === "signed") {
          // Signed squads: move to eliminated with role, mark as "new" (shows in notification)
          state.squads[index] = {
            ...state.squads[index],
            pool: "eliminated",
            role: "eliminatedSigned",
            isEliminated: true,
            rosterElimination: "new",
            groupStageReplaceable: false,
          };
        } else if (stateSquad.pool === "available" || stateSquad.pool === "unsigned") {
          // Available/Unsigned squads: move to eliminated, mark as "resolved" (no notification)
          state.squads[index] = {
            ...state.squads[index],
            pool: "eliminated",
            role: null,
            isEliminated: true,
            rosterElimination: "resolved",
            groupStageReplaceable: false,
          };
        }
      }
    },

    /**
     * Mark all newly eliminated members as resolved
     * Called after notification is dismissed
     * Transitions rosterElimination from "new" → "resolved"
     */
    resolveNewEliminations: (state) => {
      state.players.forEach((player, index) => {
        if (player.rosterElimination === "new") {
          state.players[index].rosterElimination = "resolved";
        }
      });
      state.squads.forEach((squad, index) => {
        if (squad.rosterElimination === "new") {
          state.squads[index].rosterElimination = "resolved";
        }
      });
    },

    // ────────────────────────────────────────────────────────────────
    // SCORING & POINTS CALCULATION
    // ────────────────────────────────────────────────────────────────

    /**
     * Apply substitute multiplier (50%) to all points
     * Called when points are calculated, respects substitute flag
     */
    updateMemberPoints: (
      state,
      action: PayloadAction<{
        memberId: number;
        memberType: "player" | "squad";
        basePoints: number;
      }>
    ) => {
      const { memberId, memberType, basePoints } = action.payload;

      if (memberType === "player") {
        const index = state.players.findIndex(p => p.playerId === memberId);
        if (index !== -1) {
          const multiplier = state.players[index].substitute ? 0.5 : 1;
          state.players[index].totalPoints =
            (state.players[index].totalPoints || 0) + basePoints * multiplier;
        }
      } else {
        const index = state.squads.findIndex(s => s.id === memberId);
        if (index !== -1) {
          const multiplier = state.squads[index].substitute ? 0.5 : 1;
          state.squads[index].totalPoints =
            (state.squads[index].totalPoints || 0) + basePoints * multiplier;
        }
      }
    },

    // ────────────────────────────────────────────────────────────────
    // INITIALIZATION & VALIDATION
    // ────────────────────────────────────────────────────────────────

    /**
     * Initialize roster from tournament data
     * All squads/players start in "available" pool with role: null
     * Respects isEliminated flag for visual display
     * Game schedules loaded from API per squad/player
     */
    initializeRoster: (
      state,
      action: PayloadAction<{
        players: RosterPlayer[];
        squads: RosterSquad[];
      }>
    ) => {
      state.players = action.payload.players.map(p => ({
        ...p,
        pool: "available" as RosterPool,
        role: null,
        totalPoints: 0,
        substitute: false,
      }));

      state.squads = action.payload.squads.map(s => ({
        ...s,
        pool: "available" as RosterPool,
        role: null,
        totalPoints: 0,
        substitute: false,
      }));
    },

    /**
     * Set tournament round and R16 week status
     * Used to determine if new signings are substitutes (R16 only)
     */
    setTournamentRound: (
      state,
      action: PayloadAction<{
        round: string;
        isR16Week: boolean;
      }>
    ) => {
      state.validation.tournamentRound = action.payload.round;
      state.validation.isR16Week = action.payload.isR16Week;
    },

    /**
     * Lock/unlock roster for round
     */
    setRoundLocked: (state, action: PayloadAction<boolean>) => {
      state.validation.roundLocked = action.payload;
    },

    /**
     * Load game schedules for a player
     * Called when fetching player game data from API
     */
    loadPlayerGames: (
      state,
      action: PayloadAction<{ playerId: number; games: Game[] }>
    ) => {
      const index = state.players.findIndex(p => p.playerId === action.payload.playerId);
      if (index !== -1) {
        state.players[index].playerGames = action.payload.games;
      }
    },

    /**
     * Load game schedules for a squad
     * Called when fetching squad game data from API
     */
    loadSquadGames: (
      state,
      action: PayloadAction<{ squadId: number; games: Game[] }>
    ) => {
      const index = state.squads.findIndex(s => s.id === action.payload.squadId);
      if (index !== -1) {
        state.squads[index].squadGames = action.payload.games;
      }
    },

    /**
     * After Group Stage 2 play: mark roster members whose nation lost twice in GS1+GS2 tournament
     * fixtures (see `countryCodesWithTwoLossesInFirstTwoGroupTurns`). Applies to signed, available,
     * and unsigned pools so replacements signed after GS2 still see the flag.
     */
    setGroupStageReplaceableFlags: (
      state,
      action: PayloadAction<{ countryCodes: readonly string[] }>
    ) => {
      const eligible = new Set(action.payload.countryCodes);
      const pools: RosterPool[] = ["signed", "available", "unsigned"];
      state.players.forEach((player, index) => {
        if (!player.isEliminated && pools.includes(player.pool)) {
          state.players[index].groupStageReplaceable = eligible.has(player.countryCode);
        }
      });
      state.squads.forEach((squad, index) => {
        if (!squad.isEliminated && pools.includes(squad.pool)) {
          state.squads[index].groupStageReplaceable = eligible.has(squad.countryCode);
        }
      });
    },
  },
});

export const {
  movePlayerToUnsigned,
  movePlayerToAvailable,
  movePlayerToSigned,
  movePlayerToStarter,
  movePlayerToBench,
  movePlayerToEliminated,
  markPlayerAsEliminated,
  moveSquadToUnsigned,
  moveSquadToAvailable,
  moveSquadToSigned,
  moveSquadToEliminated,
  resolveNewEliminations,
  updateMemberPoints,
  initializeRoster,
  setTournamentRound,
  setRoundLocked,
  loadPlayerGames,
  loadSquadGames,
  setGroupStageReplaceableFlags,
} = rosterSlice.actions;

export default rosterSlice.reducer;
