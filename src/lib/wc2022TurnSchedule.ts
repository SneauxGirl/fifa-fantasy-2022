/**
 * WC 2022 turn windows — single source for `getMatchResults` / mock filtering and
 * `buildTurnMatchIds` bracket buckets.
 *
 * Group ranges are **non-overlapping** by calendar day so each group fixture maps to
 * exactly one simulated turn while matching FIFA MD1 / MD2 / MD3 boundaries in the
 * bundled schedule (`matches.json`).
 */
export const WC2022_TURN_DATE_RANGES = {
  Group_Stage_1: ["2022-11-20", "2022-11-24"],
  Group_Stage_2: ["2022-11-25", "2022-11-28"],
  Group_Stage_Final: ["2022-11-29", "2022-12-03"],
  R16: ["2022-12-03", "2022-12-07"],
  Quarterfinals: ["2022-12-09", "2022-12-10"],
  Semifinals: ["2022-12-13", "2022-12-14"],
  Final: ["2022-12-17", "2022-12-18"],
} as const;

export type Wc2022TurnScheduleKey = keyof typeof WC2022_TURN_DATE_RANGES;

/** Same inclusive UTC calendar bounds as `filterMockMatchesForTurn` / API `from`–`to`. */
export function matchDateIsoInTurnRange(
  dateIso: string,
  range: readonly [string, string]
): boolean {
  const t = new Date(dateIso).getTime();
  const from = new Date(`${range[0]}T00:00:00.000Z`).getTime();
  const to = new Date(`${range[1]}T23:59:59.999Z`).getTime();
  return t >= from && t <= to;
}

/**
 * Calendar ranges overlap between MD3 (through Dec 3) and R16 (from Dec 3). Filter mock/API
 * fixtures by stage name as well as date so each simulation turn gets the right subset.
 */
export function matchBelongsToSimulationTurn(
  turnId: string,
  match: { date: string; stage?: { name?: string } }
): boolean {
  const range = WC2022_TURN_DATE_RANGES[turnId as Wc2022TurnScheduleKey];
  if (!range) return false;
  if (!matchDateIsoInTurnRange(match.date, range)) return false;

  const stageName = match.stage?.name ?? "";

  switch (turnId) {
    case "Group_Stage_1":
    case "Group_Stage_2":
    case "Group_Stage_Final":
      return stageName.includes("Group");
    case "R16":
      return stageName.includes("Round of 16");
    case "Quarterfinals":
      return stageName.includes("Quarter");
    case "Semifinals":
      return stageName.includes("Semi");
    case "Final":
      return stageName === "Final" || stageName.includes("Third");
    default:
      return false;
  }
}

const sortGroupByDate = (a: { date: string }, b: { date: string }) =>
  new Date(a.date).getTime() - new Date(b.date).getTime();

/** Split bundled group-stage rows into MD1 / MD2 / MD3 buckets (non-overlapping dates). */
export function partitionBundledGroupMatches<T extends { date: string }>(
  groupMatches: T[]
): { groupStage1: T[]; groupStage2: T[]; groupStageFinal: T[] } {
  const sorted = [...groupMatches].sort(sortGroupByDate);
  return {
    groupStage1: sorted.filter((m) =>
      matchDateIsoInTurnRange(m.date, WC2022_TURN_DATE_RANGES.Group_Stage_1)
    ),
    groupStage2: sorted.filter((m) =>
      matchDateIsoInTurnRange(m.date, WC2022_TURN_DATE_RANGES.Group_Stage_2)
    ),
    groupStageFinal: sorted.filter((m) =>
      matchDateIsoInTurnRange(m.date, WC2022_TURN_DATE_RANGES.Group_Stage_Final)
    ),
  };
}
