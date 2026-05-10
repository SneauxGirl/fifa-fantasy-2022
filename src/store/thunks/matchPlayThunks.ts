/**
 * Match Play — full tournament replay reset (bundled WC 2022 data).
 * Mirrors cold-load bootstrap without reading persisted turn simulation.
 */

import { createAsyncThunk } from "@reduxjs/toolkit";
import type { Match, NationalTeam, RosterPlayer, RosterSquad } from "../../types/match";
import { setMatches, setTurnSimulation } from "../slices/matchesSlice";
import { initializeNationTeams } from "../slices/nationTeamsSlice";
import { initializeRoster } from "../slices/rosterSlice";
import { clearTurnScores } from "../slices/turnScoresSlice";
import { clearLiveScores } from "../slices/liveScoresSlice";
import {
  clearEliminationNotification,
  closeModal,
  closeGroupStageReplacePrompt,
  setRosterLocked,
} from "../slices/uiSlice";
import { resetLineup } from "../slices/lineupSlice";
import {
  createInitialTurnSimulation,
  persistTurnSimulationToStorage,
} from "../../lib/turnSimulation";
import mockMatches from "../../data/matches.json";
import mockSquadsData from "../../data/squads.json";
import { normalizeMatchesNationalTeamIds } from "../../lib/normalizeMatchNationalTeamIds";
import { clearPersistedSchedule } from "../../lib/persistSchedule";

function baselineNationalTeams(): NationalTeam[] {
  const raw = mockSquadsData.teams || [];
  return raw.map((team: Record<string, unknown>) => ({
    ...(team as unknown as NationalTeam),
    isEliminated: Boolean(team.isEliminated),
  }));
}

/** Same roster projection as `App.tsx` bootstrap (bundled squads.json). */
function rosterFromNationTeams(allNationalTeams: NationalTeam[]): {
  players: RosterPlayer[];
  squads: RosterSquad[];
} {
  const rosterPlayers: RosterPlayer[] = allNationalTeams.flatMap((nationalTeam: NationalTeam) =>
    (nationalTeam.players || []).map((p: NationalTeam["players"][number]) => ({
      type: "player" as const,
      playerId: p.playerId,
      pool: p.isEliminated ? ("eliminated" as const) : ("available" as const),
      role: p.isEliminated ? ("eliminatedSigned" as const) : null,
      isEliminated: p.isEliminated || false,
      rosterElimination: null,
      name: p.playerName,
      position: p.position,
      number: p.number,
      teamId: nationalTeam.teamId,
      countryCode: nationalTeam.countryCode,
      flag: nationalTeam.flag,
      matchPoints: {},
      totalPoints: 0,
      substitute: false,
      playerGames: [],
      injury: { status: "none" as const, likelyUnavailable: false },
    }))
  );

  const rosterSquads: RosterSquad[] = allNationalTeams.flatMap((nationalTeam: NationalTeam) =>
    (nationalTeam.squads || []).map((s: NationalTeam["squads"][number]) => ({
      type: "squad" as const,
      id: s.teamId,
      teamId: s.teamId,
      pool: "available" as const,
      role: null,
      isEliminated: s.isEliminated || false,
      rosterElimination: s.rosterElimination ?? null,
      name: s.name,
      countryCode: s.countryCode,
      flag: s.flag,
      group: nationalTeam.group,
      matchPoints: {},
      totalPoints: 0,
      substitute: false,
      squadGames: [],
      coaches: s.coaches,
    }))
  );

  return { players: rosterPlayers, squads: rosterSquads };
}

export const restartMatchPlay = createAsyncThunk<void, undefined>(
  "matchPlay/restart",
  async (_, { dispatch }) => {
    const nationalTeams = baselineNationalTeams();
    const matches = normalizeMatchesNationalTeamIds(
      structuredClone(mockMatches) as Match[],
      nationalTeams
    );
    const { players, squads } = rosterFromNationTeams(nationalTeams);

    dispatch(closeModal());
    dispatch(closeGroupStageReplacePrompt());
    dispatch(clearEliminationNotification());
    dispatch(setRosterLocked(false));
    dispatch(clearTurnScores());
    dispatch(clearLiveScores());
    dispatch(resetLineup());

    clearPersistedSchedule();
    dispatch(setMatches(matches));

    const turnSimulation = createInitialTurnSimulation(matches);
    dispatch(setTurnSimulation(turnSimulation));
    persistTurnSimulationToStorage(turnSimulation);

    dispatch(initializeNationTeams(nationalTeams));
    dispatch(initializeRoster({ players, squads }));
  }
);
