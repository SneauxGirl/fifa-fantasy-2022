/**
 * Match Service
 * Handles REST API calls for match data.
 * Integrates with API-Football service for live data.
 * Checks Redux/localStorage for data source preference (mock vs live).
 */

import type { Match } from "../types/match";
import mockMatches from "../data/matches.json";
import { getDataSourcePreference } from "../lib/dataSourcePreference";
import {
  fetchMatchDetails as fetchMatchDetailsAPI,
  fetchTournamentScheduleMatches,
} from "./apiFootball";

function getDataSource(): "mock" | "live" {
  return getDataSourcePreference();
}

/**
 * Fetch all matches from mock data
 * Phase 3: API calls now use turn-based getMatchResults(turnId) instead
 */
export const fetchAllMatches = async (): Promise<Match[]> => {
  const source = getDataSource();
  if (source === "live") {
    try {
      return await fetchTournamentScheduleMatches();
    } catch (error) {
      console.error("fetchAllMatches live failed, falling back to mock:", error);
    }
  }
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockMatches as Match[]), 500);
  });
};

/**
 * Fetch matches involving specific roster teams
 * Filters from allMatches by team IDs
 */
export const fetchRosterMatches = async (teamIds: number[]): Promise<Match[]> => {
  try {
    const allMatches = await fetchAllMatches();
    return allMatches.filter((match: Match) =>
        teamIds.includes(match.homeTeam.id) || teamIds.includes(match.awayTeam.id)
    );
  } catch (error) {
    console.error("Error fetching roster matches:", error);
    throw error;
  }
};

/**
 * Fetch match details and events
 * Used for expanded MatchCard view
 */
export const fetchMatchDetails = async (matchId: number): Promise<Match> => {
  const source = getDataSource();

  try {
    if (source === "live") {
      return await fetchMatchDetailsAPI(matchId);
    } else {
      // Mock data
      const match = mockMatches.find((m) => m.id === matchId);
      if (!match) throw new Error(`Match ${matchId} not found`);
      return new Promise((resolve) => {
        setTimeout(() => resolve(match as Match), 300);
      });
    }
  } catch (error) {
    console.error(`Error fetching match ${matchId} from ${source} source:`, error);
    // Fallback to mock if live fails
    if (source === "live") {
      const match = mockMatches.find((m) => m.id === matchId);
      if (match) {
        return new Promise((resolve) => {
          setTimeout(() => resolve(match as Match), 300);
        });
      }
    }
    throw error;
  }
};

/**
 * Normalize API-Football response to Match type
 */
export const normalizeMatches = (apiMatches: any[]): Match[] => {
  return apiMatches.map((m) => ({
    id: m.fixture.id,
    homeTeam: {
      id: m.teams.home.id,
      countryCode: m.teams.home.code || "",
      name: m.teams.home.name,
    },
    awayTeam: {
      id: m.teams.away.id,
      countryCode: m.teams.away.code || "",
      name: m.teams.away.name,
    },
    date: m.fixture.date,
    status: {
      short: m.fixture.status.short,
      long: m.fixture.status.long,
      elapsed: m.fixture.status.elapsed,
    },
    score: {
      halftime: {
        home: m.score.halftime?.home,
        away: m.score.halftime?.away,
      },
      fulltime: {
        home: m.score.fulltime?.home,
        away: m.score.fulltime?.away,
      },
      extratime: {
        home: m.score.extratime?.home,
        away: m.score.extratime?.away,
      },
      penalty: {
        home: m.score.penalty?.home,
        away: m.score.penalty?.away,
      },
    },
    events: m.events || [],
  }));
};
