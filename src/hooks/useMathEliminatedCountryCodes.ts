import { useMemo } from "react";
import { useAppSelector } from "../store";
import {
  selectBracketResolvedMatches,
  selectCompletedTurnIds,
} from "../store/selectors/scoringSelectors";
import { partitionBundledGroupMatches } from "../lib/wc2022TurnSchedule";
import { countryCodesWithTwoLossesInFirstTwoGroupTurns } from "../lib/groupStageReplaceable";

/**
 * Nations with two losses in Group Stage turns 1–2 (simulation schedule).
 * UI may warn only after **Group Stage 2** is fully played (`completedTurnIds`).
 */
export function useMathEliminatedCountryCodes(): ReadonlySet<string> {
  const resolved = useAppSelector(selectBracketResolvedMatches);
  const completedTurnIds = useAppSelector(selectCompletedTurnIds);
  const roundTwoComplete = completedTurnIds.includes("Group_Stage_2");

  return useMemo(() => {
    if (!roundTwoComplete) {
      return new Set<string>();
    }
    const groupOnly = resolved.filter((m) => (m.stage?.name ?? "").includes("Group"));
    const { groupStage1, groupStage2 } = partitionBundledGroupMatches(groupOnly);
    const gs1Ids = groupStage1.map((m) => m.id);
    const gs2Ids = groupStage2.map((m) => m.id);
    return new Set(countryCodesWithTwoLossesInFirstTwoGroupTurns(resolved, gs1Ids, gs2Ids));
  }, [resolved, roundTwoComplete]);
}
