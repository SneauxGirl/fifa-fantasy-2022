import type { Match } from "../types/match";

/**
 * For completed fixtures (FT / AET / PEN), returns the losing team's country code,
 * or `null` if the match is a draw after regulation/extra time (no knockout loser).
 * Mirrors knockout loser logic used for elimination detection.
 */
export function getMatchLoserCountryCode(match: Match): string | null {
  if (!["FT", "AET", "PEN"].includes(match.status.short)) return null;
  if (match.homeTeam.countryCode === "TBD" || match.awayTeam.countryCode === "TBD") {
    return null;
  }

  const status = match.status.short;
  const ftH = match.score.fulltime?.home ?? 0;
  const ftA = match.score.fulltime?.away ?? 0;
  const etH =
    status === "AET" || status === "PEN" ? match.score.extratime?.home ?? 0 : 0;
  const etA =
    status === "AET" || status === "PEN" ? match.score.extratime?.away ?? 0 : 0;
  const homeGoals = ftH + etH;
  const awayGoals = ftA + etA;

  if (status === "PEN" && homeGoals === awayGoals) {
    const ph = match.score.penalty?.home ?? 0;
    const pa = match.score.penalty?.away ?? 0;
    if (ph > pa) return match.awayTeam.countryCode;
    if (pa > ph) return match.homeTeam.countryCode;
    return null;
  }

  if (homeGoals > awayGoals) return match.awayTeam.countryCode;
  if (awayGoals > homeGoals) return match.homeTeam.countryCode;
  return null;
}
