/**
 * API-Football Service
 * Handles all REST API calls to api-football.com
 * Normalizes responses to TypeScript interfaces defined in types/
 */

import axios, { AxiosError } from "axios";
import type { AxiosInstance } from "axios";
import type { Match, MatchEvent } from "../types/match";
import type { Player, PlayerMatchStats, Position } from "../types/player";
import type { Squad } from "../types/squad";
import { config } from "../config";
import { getDataSourcePreference } from "../lib/dataSourcePreference";
import {
  WC2022_TURN_DATE_RANGES,
  matchBelongsToSimulationTurn,
} from "../lib/wc2022TurnSchedule";
import mockMatches from "../data/matches.json";

// ─── Configuration ───────────────────────────────────────────────────────
// Official API-Football documentation: https://www.api-football.com/documentation-v3
const API_BASE_URL = config.api.baseUrl;
const API_KEY = config.api.key;

// ─── Tournament Configuration ───────────────────────────────────────────
// FIFA World Cup 2022 (using historical data for turn-based gameplay)
// League ID and season configured via config/index.ts

const WORLD_CUP = {
  id: config.api.leagueId,
  season: config.api.season,
  name: "FIFA World Cup 2022",
};

// ─── Turn Structure (Round/Stage + Date Range) ───────────────────────────
// Maps turn IDs to API query parameters (shared with `buildTurnMatchIds`).

export const TURNS = {
  Group_Stage_1: {
    round: ["Group A", "Group B", "Group C", "Group D"],
    dateRange: [...WC2022_TURN_DATE_RANGES.Group_Stage_1],
    matchCount: 16,
  },
  Group_Stage_2: {
    round: ["Group A", "Group B", "Group C", "Group D"],
    dateRange: [...WC2022_TURN_DATE_RANGES.Group_Stage_2],
    matchCount: 16,
  },
  Group_Stage_Final: {
    round: ["Group A", "Group B", "Group C", "Group D"],
    dateRange: [...WC2022_TURN_DATE_RANGES.Group_Stage_Final],
    matchCount: 16,
  },
  R16: {
    round: "Round of 16",
    dateRange: [...WC2022_TURN_DATE_RANGES.R16],
    matchCount: 8,
  },
  Quarterfinals: {
    round: "Quarter-finals",
    dateRange: [...WC2022_TURN_DATE_RANGES.Quarterfinals],
    matchCount: 4,
  },
  Semifinals: {
    round: "Semi-finals",
    dateRange: [...WC2022_TURN_DATE_RANGES.Semifinals],
    matchCount: 2,
  },
  Final: {
    round: "Final",
    dateRange: [...WC2022_TURN_DATE_RANGES.Final],
    matchCount: 2,
  },
};

// ─── Axios Instance ───────────────────────────────────────────────────────

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "x-apisports-key": API_KEY,
  },
});

// Error handling interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 429) {
      console.warn("API rate limit exceeded. Consider implementing backoff.");
    }
    return Promise.reject(error);
  }
);

// ─── Type Helpers ───────────────────────────────────────────────────────

/**
 * Convert API position code to standardized Position type
 * API uses: "G" (Goalkeeper), "D" (Defender), "M" (Midfielder), "F" (Attacker), etc.
 */
function normalizePosition(apiPosition: string): Position {
  const pos = apiPosition.toUpperCase()[0];
  switch (pos) {
    case "G":
      return "Goalkeeper";
    case "D":
      return "Defender";
    case "M":
      return "Midfielder";
    case "F":
      return "Attacker";
    default:
      return "Defender"; // Default fallback
  }
}

/**
 * Parse player name into first/last for consistency
 * API often provides: "Firstname Lastname"
 */
function parsePlayerName(apiName: string): { firstName: string; lastName: string } {
  const parts = apiName.trim().split(/\s+/);
  if (parts.length === 0) {
    return { firstName: "Unknown", lastName: "Player" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  // Simple heuristic: first word is first name, rest is last name
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

// ─── Match Normalization ───────────────────────────────────────────────────

/**
 * Normalize a single API-Football fixture to Match type
 */
export function normalizeMatch(apiFixture: any): Match {
  const homeTeam = {
    id: apiFixture.teams.home.id,
    countryCode: apiFixture.teams.home.code || "UNK",
    name: apiFixture.teams.home.name,
  };
  const awayTeam = {
    id: apiFixture.teams.away.id,
    countryCode: apiFixture.teams.away.code || "UNK",
    name: apiFixture.teams.away.name,
  };

  return {
    id: apiFixture.fixture.id,
    homeTeam,
    awayTeam,
    date: apiFixture.fixture.date,
    status: {
      short: apiFixture.fixture.status.short,
      long: apiFixture.fixture.status.long,
      elapsed: apiFixture.fixture.status.elapsed,
    },
    score: {
      halftime: {
        home: apiFixture.score.halftime?.home ?? null,
        away: apiFixture.score.halftime?.away ?? null,
      },
      fulltime: {
        home: apiFixture.score.fulltime?.home ?? null,
        away: apiFixture.score.fulltime?.away ?? null,
      },
      extratime: {
        home: apiFixture.score.extratime?.home ?? null,
        away: apiFixture.score.extratime?.away ?? null,
      },
      penalty: {
        home: apiFixture.score.penalty?.home ?? null,
        away: apiFixture.score.penalty?.away ?? null,
      },
    },
    venue: apiFixture.fixture.venue ? {
      id: apiFixture.fixture.venue.id,
      name: apiFixture.fixture.venue.name,
      city: apiFixture.fixture.venue.city,
    } : undefined,
    stage: (() => {
      const roundName = apiFixture.league?.round as string | undefined;
      if (roundName)
        return {
          id: typeof apiFixture.league?.season === "number" ? apiFixture.league.season : 0,
          name: roundName,
        };
      return apiFixture.league?.season
        ? {
            id: apiFixture.league.season,
            name: apiFixture.league.name,
          }
        : undefined;
    })(),
    events: normalizeMatchEventsForFixture(apiFixture.events || [], homeTeam, awayTeam),
  };
}

/**
 * Normalize match events from API response.
 * Fixture events often omit `team.code`; resolve country code from home/away IDs.
 */
function normalizeMatchEventsForFixture(
  apiEvents: any[],
  homeTeam: Match["homeTeam"],
  awayTeam: Match["awayTeam"]
): MatchEvent[] {
  return (apiEvents || []).map((event: any) => {
    const teamId = event.team?.id;
    let countryCode =
      event.team?.code ||
      event.team?.countryCode ||
      "";
    if (!countryCode && teamId === homeTeam.id) countryCode = homeTeam.countryCode;
    if (!countryCode && teamId === awayTeam.id) countryCode = awayTeam.countryCode;

    const playerId = event.player?.id ?? event.player?.playerId ?? 0;

    return {
      time: {
        elapsed: event.time?.elapsed ?? 0,
        extra: event.time?.extra ?? null,
      },
      team: {
        id: teamId ?? 0,
        countryCode,
      },
      player: {
        id: playerId,
        name: event.player?.name ?? "",
      },
      assist: {
        id: event.assist?.id ?? null,
        name: event.assist?.name ?? null,
      },
      type: event.type || "Goal",
      detail: event.detail || "",
      comments: event.comments ?? null,
    };
  });
}

// ─── Player Normalization ───────────────────────────────────────────────────

/**
 * Normalize a single API-Football player to Player type
 * Includes recent match performance stats
 */
export function normalizePlayer(
  apiPlayer: any
): Player {
  const { firstName, lastName } = parsePlayerName(apiPlayer.player.name);
  const position = normalizePosition(apiPlayer.player.position || "D");
  const pid = apiPlayer.player?.id ?? apiPlayer.player?.playerId ?? 0;
  const jerseyNumber =
    apiPlayer.player?.number ??
    apiPlayer.statistics?.[0]?.games?.number ??
    undefined;

  return {
    playerId: pid,
    id: pid,
    firstName,
    lastName,
    apiDisplayName: apiPlayer.player.name,
    position,
    nationality: apiPlayer.team.country || "Unknown",
    countryCode: apiPlayer.team.code || "UNK",
    club: apiPlayer.team.name,
    status: "bench",
    jerseyNumber,
    tournamentPerformance: [],
  };
}

/**
 * Normalize player match statistics
 */
function normalizePlayerStats(stats: any[]): PlayerMatchStats[] {
  return (stats || []).slice(0, 10).map((stat) => ({
    goals: stat.goals?.total || 0,
    assists: stat.goals?.assists || 0,
    saves: stat.goals?.saves ?? null,
    yellowCards: (stat.cards?.yellow || 0) + (stat.cards?.yellowred || 0),
    redCards: stat.cards?.red || 0,
    ownGoals: 0,
    cleanSheet: (stat.goals?.conceded === 0 || null),
    shootoutGoals: null,
    shootoutSaves: null,
    shootoutMisses: null,
  }));
}

// ─── Squad/Team Normalization ───────────────────────────────────────────────

/**
 * Normalize a single API-Football team to Squad type
 */
export function normalizeTeam(apiTeam: any): Squad {
  return {
    id: apiTeam.team.id,
    name: apiTeam.team.country || apiTeam.team.name,
    nameLocal: apiTeam.team.name, // API provides local name
    code: apiTeam.team.code || "UNK",
    flag: apiTeam.team.flag || "🌍",
    logoUrl: apiTeam.team.logo,
  };
}

// ─── Turn-Based Match Fetching ───────────────────────────────────────────

const TOURNAMENT_SCHEDULE_FROM = TURNS.Group_Stage_1.dateRange[0];
const TOURNAMENT_SCHEDULE_TO = TURNS.Final.dateRange[1];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * All World Cup fixtures in one range (schedule / UI). Does not attach per-fixture events
 * (use getMatchResults or fetchMatchDetails for events).
 */
export async function fetchTournamentScheduleMatches(): Promise<Match[]> {
  const response = await apiClient.get("/fixtures", {
    params: {
      league: WORLD_CUP.id,
      season: WORLD_CUP.season,
      from: TOURNAMENT_SCHEDULE_FROM,
      to: TOURNAMENT_SCHEDULE_TO,
    },
  });

  if (!response.data?.response) {
    console.warn("No fixtures returned for tournament schedule range");
    return [];
  }

  return response.data.response.map(normalizeMatch);
}

function filterMockMatchesForTurn(turnId: string): Match[] {
  const turn = TURNS[turnId as keyof typeof TURNS];
  if (!turn) {
    throw new Error(`Invalid turn ID: ${turnId}`);
  }
  return (mockMatches as unknown as Match[]).filter((m) =>
    matchBelongsToSimulationTurn(turnId, m)
  );
}

async function fetchEventsForFixture(match: Match): Promise<MatchEvent[]> {
  const response = await apiClient.get("/fixtures/events", {
    params: { fixture: match.id },
  });
  const raw = response.data?.response || [];
  return normalizeMatchEventsForFixture(raw, match.homeTeam, match.awayTeam);
}

async function enrichMatchesWithFixtureEvents(matches: Match[]): Promise<Match[]> {
  const batchSize = 8;
  const out: Match[] = [];
  for (let i = 0; i < matches.length; i += batchSize) {
    const batch = matches.slice(i, i + batchSize);
    const enriched = await Promise.all(
      batch.map(async (m) => {
        try {
          const events = await fetchEventsForFixture(m);
          return { ...m, events };
        } catch (e) {
          console.warn(`[apiFootball] events fetch failed for fixture ${m.id}`, e);
          return m;
        }
      })
    );
    out.push(...enriched);
    if (i + batchSize < matches.length) await sleep(60);
  }
  return out;
}

/**
 * Fetch match results for a specific turn
 * Maps turn ID to date range and API parameters
 * Called by playTurn() async thunk when user clicks "Play"
 *
 * @param turnId - Turn identifier (e.g., "Group_Stage_1", "R16", "Final")
 * @returns Match data for all fixtures in that turn
 */
export async function getMatchResults(turnId: string): Promise<Match[]> {
  const turn = TURNS[turnId as keyof typeof TURNS];

  if (!turn) {
    throw new Error(`Invalid turn ID: ${turnId}`);
  }

  const source = getDataSourcePreference();

  if (source === "mock") {
    return filterMockMatchesForTurn(turnId);
  }

  try {
    const params: Record<string, string | number> = {
      league: WORLD_CUP.id,
      season: WORLD_CUP.season,
      from: turn.dateRange[0],
      to: turn.dateRange[1],
    };

    const response = await apiClient.get("/fixtures", { params });

    if (!response.data?.response) {
      console.warn(`No fixtures found for turn: ${turnId}`);
      return [];
    }

    const normalized: Match[] = response.data.response
      .map((raw: unknown) => normalizeMatch(raw))
      .filter((m: Match) => matchBelongsToSimulationTurn(turnId, m));
    return enrichMatchesWithFixtureEvents(normalized);
  } catch (error) {
    console.error(`Error fetching match results for turn ${turnId}:`, error);
    throw error;
  }
}

// ─── Public API Methods ───────────────────────────────────────────────────

/**
 * Fetch a specific match with details and events
 */
export async function fetchMatchDetails(matchId: number): Promise<Match> {
  try {
    const response = await apiClient.get("/fixtures", {
      params: { id: matchId },
    });

    if (!response.data?.response?.[0]) {
      throw new Error(`Match ${matchId} not found`);
    }

    let match = normalizeMatch(response.data.response[0]);
    if (match.events.length === 0) {
      try {
        const events = await fetchEventsForFixture(match);
        match = { ...match, events };
      } catch {
        // keep fixture without events
      }
    }
    return match;
  } catch (error) {
    console.error(`Error fetching match ${matchId}:`, error);
    throw error;
  }
}

/**
 * Fetch squads/teams from World Cup
 */
export async function fetchSquads(): Promise<Squad[]> {
  try {
    const response = await apiClient.get("/teams", {
      params: {
        league: WORLD_CUP.id,
        season: WORLD_CUP.season,
      },
    });

    if (!response.data?.response) {
      console.warn(`No teams found for ${WORLD_CUP.name}`);
      return [];
    }

    return response.data.response.map((teamData: any) =>
      normalizeTeam(teamData)
    );
  } catch (error) {
    console.error(`Error fetching ${WORLD_CUP.name} squads:`, error);
    throw error;
  }
}

/**
 * Fetch players for a specific squad/team
 */
export async function fetchSquadRoster(teamId: number): Promise<Player[]> {
  try {
    const response = await apiClient.get("/players", {
      params: {
        team: teamId,
        league: WORLD_CUP.id,
        season: WORLD_CUP.season,
      },
    });

    if (!response.data?.response) {
      console.warn(`No players found for team ${teamId}`);
      return [];
    }

    return response.data.response.map((playerData: any) =>
      normalizePlayer(playerData)
    );
  } catch (error) {
    console.error(`Error fetching squad roster for team ${teamId}:`, error);
    throw error;
  }
}

/**
 * Fetch all players in World Cup
 * Note: This may require pagination due to API limits
 */
export async function fetchAllPlayers(): Promise<Player[]> {
  try {
    const response = await apiClient.get("/players", {
      params: {
        league: WORLD_CUP.id,
        season: WORLD_CUP.season,
      },
    });

    if (!response.data?.response) {
      console.warn(`No players found for ${WORLD_CUP.name}`);
      return [];
    }

    return response.data.response.map((playerData: any) =>
      normalizePlayer(playerData)
    );
  } catch (error) {
    console.error(`Error fetching all players for ${WORLD_CUP.name}:`, error);
    throw error;
  }
}

/**
 * Fetch player statistics/recent performance
 * Used for updating historical cache
 */
export async function fetchPlayerStats(
  playerId: number,
  limit = 10
): Promise<PlayerMatchStats[]> {
  try {
    const response = await apiClient.get("/players", {
      params: {
        id: playerId,
        league: WORLD_CUP.id,
        season: WORLD_CUP.season,
      },
    });

    if (!response.data?.response?.[0]?.statistics) {
      return [];
    }

    return normalizePlayerStats(
      response.data.response[0].statistics.slice(0, limit)
    );
  } catch (error) {
    console.error(`Error fetching stats for player ${playerId}:`, error);
    return [];
  }
}

/**
 * Health check: verify API connectivity
 */
export async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await apiClient.get("/status");
    return response.status === 200;
  } catch (error) {
    console.error("API health check failed:", error);
    return false;
  }
}

