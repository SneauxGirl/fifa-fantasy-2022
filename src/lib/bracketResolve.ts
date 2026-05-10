import type { BracketFeed, Match, NationalTeam } from "../types/match";

const TERMINAL = new Set(["FT", "AET", "PEN"]);

export function isMatchTerminal(m: Match): boolean {
  return TERMINAL.has(m.status.short);
}

function teamFromMatch(side: "home" | "away", m: Match): Match["homeTeam"] {
  return side === "home" ? m.homeTeam : m.awayTeam;
}

function regulationPlusEtGoals(m: Match, side: "home" | "away"): number {
  const s = m.status.short;
  const ftH = m.score.fulltime?.home ?? 0;
  const ftA = m.score.fulltime?.away ?? 0;
  const etH =
    s === "AET" || s === "PEN" ? m.score.extratime?.home ?? 0 : 0;
  const etA =
    s === "AET" || s === "PEN" ? m.score.extratime?.away ?? 0 : 0;
  const home = ftH + etH;
  const away = ftA + etA;
  return side === "home" ? home : away;
}

/** Winner after regulation + ET; PEN decided by shootout tallies. */
export function getWinnerSide(m: Match): "home" | "away" | null {
  if (!isMatchTerminal(m)) return null;
  const s = m.status.short;
  const hg = regulationPlusEtGoals(m, "home");
  const ag = regulationPlusEtGoals(m, "away");

  if (s === "PEN" && hg === ag) {
    const ph = m.score.penalty?.home ?? 0;
    const pa = m.score.penalty?.away ?? 0;
    if (ph > pa) return "home";
    if (pa > ph) return "away";
    return null;
  }
  if (hg > ag) return "home";
  if (ag > hg) return "away";
  return null;
}

export function getWinnerTeam(m: Match): Match["homeTeam"] | null {
  const side = getWinnerSide(m);
  if (!side) return null;
  return teamFromMatch(side, m);
}

export function getLoserTeam(m: Match): Match["homeTeam"] | null {
  const side = getWinnerSide(m);
  if (!side) return null;
  return teamFromMatch(side === "home" ? "away" : "home", m);
}

function emptyPlaceholder(seed: string): Match["homeTeam"] {
  return { id: 0, countryCode: "TBD", name: seed };
}

function feedDisplayName(feed: BracketFeed): string {
  switch (feed.kind) {
    case "group_place":
      return feed.place === 1 ? `1${feed.group}` : `2${feed.group}`;
    case "winner":
      return `Winner M${feed.matchId}`;
    case "loser":
      return `Loser M${feed.matchId}`;
    default:
      return "TBD";
  }
}

function buildCountryToGroup(teams: NationalTeam[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const t of teams) {
    m.set(t.countryCode, t.group);
  }
  return m;
}

interface StandingRow {
  code: string;
  pts: number;
  gd: number;
  gf: number;
}

function groupStageMatchesForGroup(
  all: Match[],
  group: string,
  codeToGroup: Map<string, string>
): Match[] {
  return all.filter((m) => {
    if (!m.stage?.name?.includes("Group")) return false;
    const hg = codeToGroup.get(m.homeTeam.countryCode);
    const ag = codeToGroup.get(m.awayTeam.countryCode);
    return hg === group && ag === group && hg != null;
  });
}

function computeGroupStandings(
  groupMatches: Match[],
  memberCodes: string[]
): StandingRow[] | null {
  if (groupMatches.length < 6) return null;
  if (!groupMatches.every(isMatchTerminal)) return null;

  const stats = new Map<string, { gf: number; ga: number; pts: number }>();
  for (const c of memberCodes) {
    stats.set(c, { gf: 0, ga: 0, pts: 0 });
  }

  for (const m of groupMatches) {
    const fh = m.score.fulltime?.home ?? 0;
    const fa = m.score.fulltime?.away ?? 0;
    const hc = m.homeTeam.countryCode;
    const ac = m.awayTeam.countryCode;
    const sh = stats.get(hc);
    const sa = stats.get(ac);
    if (!sh || !sa) continue;
    sh.gf += fh;
    sh.ga += fa;
    sa.gf += fa;
    sa.ga += fh;
    if (fh > fa) sh.pts += 3;
    else if (fa > fh) sa.pts += 3;
    else {
      sh.pts += 1;
      sa.pts += 1;
    }
  }

  const rows: StandingRow[] = memberCodes.map((code) => {
    const s = stats.get(code)!;
    return { code, pts: s.pts, gd: s.gf - s.ga, gf: s.gf };
  });

  rows.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });

  return rows;
}

function firstTeamForCode(all: Match[], code: string): Match["homeTeam"] | null {
  for (const m of all) {
    if (m.homeTeam.countryCode === code) return m.homeTeam;
    if (m.awayTeam.countryCode === code) return m.awayTeam;
  }
  return null;
}

function resolveFeed(
  feed: BracketFeed,
  all: Match[],
  byId: Map<number, Match>,
  codeToGroup: Map<string, string>
): Match["homeTeam"] | null {
  switch (feed.kind) {
    case "winner": {
      const m = byId.get(feed.matchId);
      if (!m || !isMatchTerminal(m)) return null;
      return getWinnerTeam(m);
    }
    case "loser": {
      const m = byId.get(feed.matchId);
      if (!m || !isMatchTerminal(m)) return null;
      return getLoserTeam(m);
    }
    case "group_place": {
      const letter = feed.group;
      const codes = [...codeToGroup.entries()]
        .filter(([, g]) => g === letter)
        .map(([c]) => c);
      if (codes.length !== 4) return null;
      const gms = groupStageMatchesForGroup(all, letter, codeToGroup);
      const table = computeGroupStandings(gms, codes);
      if (!table) return null;
      const row = feed.place === 1 ? table[0] : table[1];
      if (!row) return null;
      return firstTeamForCode(all, row.code);
    }
    default:
      return null;
  }
}

/**
 * Third- and fourth-place nations per group after all six group fixtures are final.
 * Matches `computeGroupStandings` ordering (points, goal difference, goals for).
 */
export function countryCodesEliminatedAfterGroupStage(
  allMatches: Match[],
  nationalTeams: NationalTeam[]
): string[] {
  const codeToGroup = buildCountryToGroup(nationalTeams);
  const out: string[] = [];
  const groupLetters = new Set(
    [...codeToGroup.values()].filter((g): g is string => Boolean(g))
  );

  for (const letter of groupLetters) {
    const memberCodes = [...codeToGroup.entries()]
      .filter(([, g]) => g === letter)
      .map(([c]) => c);
    if (memberCodes.length !== 4) continue;

    const gms = groupStageMatchesForGroup(allMatches, letter, codeToGroup);
    const table = computeGroupStandings(gms, memberCodes);
    if (!table || table.length < 4) continue;

    out.push(table[2].code, table[3].code);
  }

  return [...new Set(out)];
}

/**
 * Clone matches and fill knockout homeTeam/awayTeam from bracketFeeds when
 * feeder groups / matches are final. Keeps bracketFeeds on the object for UI labels if needed.
 */
export function resolveBracketMatches(
  matches: Match[],
  nationalTeams: NationalTeam[]
): Match[] {
  const codeToGroup = buildCountryToGroup(nationalTeams);
  const byId = new Map(matches.map((m) => [m.id, m]));

  return matches.map((m) => {
    const next = { ...m, homeTeam: { ...m.homeTeam }, awayTeam: { ...m.awayTeam } };

    if (!m.bracketFeeds) return next;

    const homeTeam = m.bracketFeeds.home
      ? resolveFeed(m.bracketFeeds.home, matches, byId, codeToGroup)
      : null;
    const awayTeam = m.bracketFeeds.away
      ? resolveFeed(m.bracketFeeds.away, matches, byId, codeToGroup)
      : null;

    if (homeTeam) next.homeTeam = { ...homeTeam };
    else if (m.bracketFeeds.home) {
      next.homeTeam = emptyPlaceholder(feedDisplayName(m.bracketFeeds.home));
    }

    if (awayTeam) next.awayTeam = { ...awayTeam };
    else if (m.bracketFeeds.away) {
      next.awayTeam = emptyPlaceholder(feedDisplayName(m.bracketFeeds.away));
    }

    return next;
  });
}
