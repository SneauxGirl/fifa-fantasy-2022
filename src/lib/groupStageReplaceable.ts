import type { Match } from "../types/match";
import { getMatchLoserCountryCode } from "./matchOutcome";

/**
 * Country codes that lost twice in Group Stage 1 + Group Stage 2 turns only.
 * Used for optional roster replacement (not full tournament elimination).
 */
export function countryCodesWithTwoLossesInFirstTwoGroupTurns(
  matches: Match[],
  groupStage1MatchIds: readonly number[],
  groupStage2MatchIds: readonly number[]
): string[] {
  const idSet = new Set<number>([...groupStage1MatchIds, ...groupStage2MatchIds]);
  const lossCount = new Map<string, number>();

  for (const match of matches) {
    if (!idSet.has(match.id)) continue;
    const loser = getMatchLoserCountryCode(match);
    if (!loser) continue;
    lossCount.set(loser, (lossCount.get(loser) ?? 0) + 1);
  }

  const out: string[] = [];
  for (const [code, n] of lossCount) {
    if (n >= 2) out.push(code);
  }
  return out;
}
