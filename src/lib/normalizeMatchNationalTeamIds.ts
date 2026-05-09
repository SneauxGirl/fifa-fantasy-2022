/**
 * Align fixture team IDs with nationTeams `teamId` (single national team ID everywhere).
 * API/mock fixtures often use a different numeric team id than squads.json `teamId`.
 */

import type { Match, MatchEvent, NationalTeam } from "../types/match";

export function buildCountryCodeToNationalTeamIdMap(
  nationalTeams: NationalTeam[]
): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of nationalTeams) {
    m.set(t.countryCode.toUpperCase(), t.teamId);
  }
  return m;
}

function normalizeSideTeam(
  team: Match["homeTeam"],
  codeToNationalId: Map<string, number>
): Match["homeTeam"] {
  const code = team.countryCode.toUpperCase();
  const nationalId = codeToNationalId.get(code);
  if (nationalId == null) return team;
  return { ...team, id: nationalId };
}

function remapEventTeam(
  ev: MatchEvent,
  match: Match,
  home: Match["homeTeam"],
  away: Match["homeTeam"],
  codeToNationalId: Map<string, number>
): MatchEvent {
  const evCode = (ev.team.countryCode || "").toUpperCase();
  const homeCode = home.countryCode.toUpperCase();
  const awayCode = away.countryCode.toUpperCase();

  if (ev.team.id === match.homeTeam.id || evCode === homeCode) {
    return {
      ...ev,
      team: { ...ev.team, id: home.id, countryCode: home.countryCode },
    };
  }
  if (ev.team.id === match.awayTeam.id || evCode === awayCode) {
    return {
      ...ev,
      team: { ...ev.team, id: away.id, countryCode: away.countryCode },
    };
  }

  const mapped = evCode ? codeToNationalId.get(evCode) : undefined;
  if (mapped != null) {
    return {
      ...ev,
      team: { ...ev.team, id: mapped, countryCode: ev.team.countryCode || evCode },
    };
  }

  return ev;
}

/**
 * Rewrite `homeTeam.id` / `awayTeam.id` (and event team ids where possible)
 * to each nation's canonical `teamId` from `nationalTeams`.
 */
export function normalizeMatchNationalTeamIds(
  match: Match,
  nationalTeams: NationalTeam[]
): Match {
  const codeToNationalId = buildCountryCodeToNationalTeamIdMap(nationalTeams);
  const home = normalizeSideTeam(match.homeTeam, codeToNationalId);
  const away = normalizeSideTeam(match.awayTeam, codeToNationalId);
  const events = match.events.map((ev) =>
    remapEventTeam(ev, match, home, away, codeToNationalId)
  );
  return { ...match, homeTeam: home, awayTeam: away, events };
}

export function normalizeMatchesNationalTeamIds(
  matches: Match[],
  nationalTeams: NationalTeam[]
): Match[] {
  if (!nationalTeams.length) return matches;
  return matches.map((m) => normalizeMatchNationalTeamIds(m, nationalTeams));
}
