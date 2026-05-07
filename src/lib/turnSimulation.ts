import type { Match } from "../types/match";
import { generateLiveScore } from "../store/slices/liveScoresSlice";

export const TURN_ORDER = [
  "Group_Stage_1",
  "Group_Stage_2",
  "Group_Stage_Final",
  "R16",
  "Quarterfinals",
  "Semifinals",
  "Final",
] as const;

export type TurnId = (typeof TURN_ORDER)[number];
export type MatchDisplayStatus = "Final" | "IN PROGRESS" | "Upcoming";

export interface TurnSimulationState {
  currentTurnId: TurnId;
  nextTurnId: TurnId | null;
  completedTurnIds: TurnId[];
  inProgressMatchIds: number[];
  inProgressHalftimeScores: Record<number, { home: number; away: number }>;
}

const STORAGE_KEY = "ff22-turn-simulation-v1";

export function getNextTurnId(turnId: TurnId): TurnId | null {
  const idx = TURN_ORDER.indexOf(turnId);
  if (idx === -1 || idx >= TURN_ORDER.length - 1) return null;
  return TURN_ORDER[idx + 1];
}

export function buildTurnMatchIds(matches: Match[]): Record<TurnId, number[]> {
  const sortByDate = (a: Match, b: Match) =>
    new Date(a.date).getTime() - new Date(b.date).getTime();

  const groupMatches = matches
    .filter((m) => m.stage?.name?.includes("Group"))
    .sort(sortByDate);

  const chunkSize = Math.ceil(groupMatches.length / 3);
  const groupStage1 = groupMatches.slice(0, chunkSize);
  const groupStage2 = groupMatches.slice(chunkSize, chunkSize * 2);
  const groupStageFinal = groupMatches.slice(chunkSize * 2);

  const round16 = matches
    .filter((m) => m.stage?.name?.includes("Round of 16"))
    .sort(sortByDate);
  const quarterfinals = matches
    .filter((m) => m.stage?.name?.includes("Quarter"))
    .sort(sortByDate);
  const semifinals = matches
    .filter((m) => m.stage?.name?.includes("Semi"))
    .sort(sortByDate);
  const final = matches
    .filter((m) => m.stage?.name?.includes("Final"))
    .sort(sortByDate);

  return {
    Group_Stage_1: groupStage1.map((m) => m.id),
    Group_Stage_2: groupStage2.map((m) => m.id),
    Group_Stage_Final: groupStageFinal.map((m) => m.id),
    R16: round16.map((m) => m.id),
    Quarterfinals: quarterfinals.map((m) => m.id),
    Semifinals: semifinals.map((m) => m.id),
    Final: final.map((m) => m.id),
  };
}

function getRandomIntInclusive(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleIds(ids: number[]): number[] {
  const out = [...ids];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function randomizeInProgressForTurn(
  turnMatchIds: number[],
  matchesById: Map<number, Match>
): Pick<TurnSimulationState, "inProgressMatchIds" | "inProgressHalftimeScores"> {
  if (turnMatchIds.length === 0) {
    return { inProgressMatchIds: [], inProgressHalftimeScores: {} };
  }

  const minCount = Math.max(1, Math.ceil(turnMatchIds.length * 0.3));
  const maxCount = Math.max(minCount, Math.floor(turnMatchIds.length * 0.5));
  const count = getRandomIntInclusive(minCount, maxCount);
  const selected = shuffleIds(turnMatchIds).slice(0, count);

  const halftimeScores: Record<number, { home: number; away: number }> = {};
  selected.forEach((matchId) => {
    const match = matchesById.get(matchId);
    const home = match?.score?.halftime?.home;
    const away = match?.score?.halftime?.away;
    if (home != null && away != null) {
      halftimeScores[matchId] = { home, away };
      return;
    }

    // Fallback: if halftime score is missing, derive a deterministic simulated
    // in-progress score from fulltime so the "LIVE" preview still has context.
    const finalHome = match?.score?.fulltime?.home;
    const finalAway = match?.score?.fulltime?.away;
    if (finalHome != null && finalAway != null) {
      const simulated = generateLiveScore(finalHome, finalAway, matchId);
      halftimeScores[matchId] = {
        home: simulated.home,
        away: simulated.away,
      };
    }
  });

  return {
    inProgressMatchIds: selected,
    inProgressHalftimeScores: halftimeScores,
  };
}

export function createInitialTurnSimulation(matches: Match[]): TurnSimulationState {
  const currentTurnId: TurnId = TURN_ORDER[0];
  const nextTurnId = getNextTurnId(currentTurnId);
  const turnMatchIds = buildTurnMatchIds(matches);
  const matchesById = new Map(matches.map((m) => [m.id, m]));
  const randomized = randomizeInProgressForTurn(turnMatchIds[currentTurnId], matchesById);

  return {
    currentTurnId,
    nextTurnId,
    completedTurnIds: [],
    inProgressMatchIds: randomized.inProgressMatchIds,
    inProgressHalftimeScores: randomized.inProgressHalftimeScores,
  };
}

export function advanceTurnSimulation(
  prev: TurnSimulationState,
  allMatches: Match[],
  completedTurnId: TurnId
): TurnSimulationState {
  const normalizedCompleted = Array.from(
    new Set<TurnId>([...prev.completedTurnIds, completedTurnId])
  );

  const currentTurnId = getNextTurnId(completedTurnId);
  if (!currentTurnId) {
    return {
      ...prev,
      completedTurnIds: normalizedCompleted,
      currentTurnId: completedTurnId,
      nextTurnId: null,
      inProgressMatchIds: [],
      inProgressHalftimeScores: {},
    };
  }

  const nextTurnId = getNextTurnId(currentTurnId);
  const turnMatchIds = buildTurnMatchIds(allMatches);
  const matchesById = new Map(allMatches.map((m) => [m.id, m]));
  const randomized = randomizeInProgressForTurn(turnMatchIds[currentTurnId], matchesById);

  return {
    currentTurnId,
    nextTurnId,
    completedTurnIds: normalizedCompleted,
    inProgressMatchIds: randomized.inProgressMatchIds,
    inProgressHalftimeScores: randomized.inProgressHalftimeScores,
  };
}

export function loadTurnSimulationFromStorage(
  matches: Match[]
): TurnSimulationState | null {
  if (typeof window === "undefined" || !window.localStorage) return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as TurnSimulationState;
    if (!parsed || !TURN_ORDER.includes(parsed.currentTurnId)) return null;

    // Validate against current match set (stale local state should be discarded).
    const matchesById = new Map(matches.map((m) => [m.id, m]));
    const validMatchIds = new Set(matches.map((m) => m.id));
    const inProgressMatchIds = parsed.inProgressMatchIds.filter((id) =>
      validMatchIds.has(id)
    );
    const inProgressHalftimeScores: Record<number, { home: number; away: number }> = {};
    Object.entries(parsed.inProgressHalftimeScores || {}).forEach(([id, score]) => {
      const numericId = Number(id);
      if (validMatchIds.has(numericId) && score?.home != null && score?.away != null) {
        inProgressHalftimeScores[numericId] = score;
      }
    });

    // Backfill missing persisted scores (for older localStorage entries)
    // using halftime first, then deterministic FT-based simulation fallback.
    inProgressMatchIds.forEach((matchId) => {
      if (inProgressHalftimeScores[matchId]) return;
      const match = matchesById.get(matchId);
      if (!match) return;

      const htHome = match.score?.halftime?.home;
      const htAway = match.score?.halftime?.away;
      if (htHome != null && htAway != null) {
        inProgressHalftimeScores[matchId] = { home: htHome, away: htAway };
        return;
      }

      const ftHome = match.score?.fulltime?.home;
      const ftAway = match.score?.fulltime?.away;
      if (ftHome != null && ftAway != null) {
        const simulated = generateLiveScore(ftHome, ftAway, matchId);
        inProgressHalftimeScores[matchId] = {
          home: simulated.home,
          away: simulated.away,
        };
      }
    });

    return {
      ...parsed,
      inProgressMatchIds,
      inProgressHalftimeScores,
    };
  } catch {
    return null;
  }
}

export function persistTurnSimulationToStorage(state: TurnSimulationState): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Silent: local persistence is best-effort.
  }
}

