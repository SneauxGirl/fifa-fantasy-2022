import type { NationalPlayer, NationalTeam } from "../types/match";
import { fetchSquadRoster } from "./apiFootball";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Replace each national team's player list with API-Football roster data
 * so player IDs match fixture events (required for event-based scoring).
 * On failure for a team, keeps existing JSON players.
 */
export async function hydrateNationalTeamsFromApi(
  teams: NationalTeam[],
  options?: { delayMsBetweenTeams?: number }
): Promise<NationalTeam[]> {
  const gap = options?.delayMsBetweenTeams ?? 75;
  const out: NationalTeam[] = [];

  for (const team of teams) {
    try {
      const apiPlayers = await fetchSquadRoster(team.teamId);
      const players: NationalPlayer[] = apiPlayers.map((p) => ({
        playerId: p.playerId,
        playerName: p.apiDisplayName || `${p.firstName} ${p.lastName}`.trim(),
        firstName: p.firstName,
        lastName: p.lastName,
        type: "player",
        position: p.position,
        number: p.jerseyNumber ?? 0,
        countryCode: team.countryCode,
        born: 0,
        club: p.club,
        captain: false,
        matchPoints: {},
        totalPoints: 0,
        pool: "available",
        role: null,
        isEliminated: team.isEliminated,
        rosterElimination: null,
        substitute: false,
      }));
      out.push({ ...team, players });
    } catch (err) {
      console.warn(
        `[hydrateNationalTeamsFromApi] Keeping JSON roster for ${team.countryCode} (${team.teamId}):`,
        err
      );
      out.push(team);
    }
    if (gap > 0) await delay(gap);
  }

  return out;
}
