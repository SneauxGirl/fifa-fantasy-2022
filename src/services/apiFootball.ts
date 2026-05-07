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
// Maps turn IDs to API query parameters
// Handles Dec 3 overlap by including it in Group_Stage_Final

export const TURNS = {
  Group_Stage_1: {
    round: ["Group A", "Group B", "Group C", "Group D"],
    dateRange: ["2022-11-20", "2022-11-26"],
    matchCount: 16,
  },
  Group_Stage_2: {
    round: ["Group A", "Group B", "Group C", "Group D"],
    dateRange: ["2022-11-26", "2022-11-30"],
    matchCount: 16,
  },
  Group_Stage_Final: {
    round: ["Group A", "Group B", "Group C", "Group D"],
    dateRange: ["2022-11-29", "2022-12-03"],
    matchCount: 16,
  },
  R16: {
    round: "Round of 16",
    dateRange: ["2022-12-03", "2022-12-07"],
    matchCount: 8,
  },
  Quarterfinals: {
    round: "Quarter-finals",
    dateRange: ["2022-12-09", "2022-12-11"],
    matchCount: 4,
  },
  Semifinals: {
    round: "Semi-finals",
    dateRange: ["2022-12-14", "2022-12-15"],
    matchCount: 2,
  },
  Final: {
    round: "Final",
    dateRange: ["2022-12-18", "2022-12-18"],
    matchCount: 1,
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
  return {
    id: apiFixture.fixture.id,
    homeTeam: {
      id: apiFixture.teams.home.id,
      countryCode: apiFixture.teams.home.code || "UNK",
      name: apiFixture.teams.home.name,
    },
    awayTeam: {
      id: apiFixture.teams.away.id,
      countryCode: apiFixture.teams.away.code || "UNK",
      name: apiFixture.teams.away.name,
    },
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
    stage: apiFixture.league?.season ? {
      id: apiFixture.league.season,
      name: apiFixture.league.name,
    } : undefined,
    events: normalizeMatchEvents(apiFixture.events || []),
  };
}

/**
 * Normalize match events from API response
 */
function normalizeMatchEvents(apiEvents: any[]): MatchEvent[] {
  return (apiEvents || []).map((event) => ({
    time: {
      elapsed: event.time.elapsed || 0,
      extra: event.time.extra || null,
    },
    team: {
      id: event.team.id,
      countryCode: event.team.code || "",
    },
    player: {
      id: event.player.playerId,
      name: event.player.name,
    },
    assist: {
      id: event.assist?.id || null,
      name: event.assist?.name || null,
    },
    type: event.type || "Goal",
    detail: event.detail || "",
    comments: event.comments || null,
  }));
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

  return {
    playerId: apiPlayer.player.playerId,
    id: apiPlayer.player.playerId,
    firstName,
    lastName,
    apiDisplayName: apiPlayer.player.name,
    position,
    positionFull: position,
    nationality: apiPlayer.team.country || "Unknown",
    countryCode: apiPlayer.team.code || "UNK",
    nationalityLocal: apiPlayer.team.code || "UNK",
    club: apiPlayer.team.name,
    status: "bench",
    photoUrl: apiPlayer.player.photo,
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

  try {
    const params: any = {
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

    return response.data.response.map(normalizeMatch);
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

    return normalizeMatch(response.data.response[0]);
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

