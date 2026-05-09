import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { openMatchModal } from "../../store/slices/uiSlice";
import {
  selectCompletedTurnIds,
  selectCurrentTurnId,
  selectInProgressHalftimeScores,
  selectMatchDisplayStatusById,
  selectMatchesByStage,
  selectNextTurnId,
} from "../../store/selectors/scoringSelectors";
import { playTurn } from "../../store/thunks/rosterThunks";
import type { Match, RosterPlayer, RosterSquad } from "../../types/match";
import type { PlayerScore, SquadScore } from "../../types/fantasyScore";
import { transformMatch, formatMatchDate } from "../../lib/dataTransform";
import { getTeamFlag } from "../../lib/teamColors";
import styles from "./BracketView.module.scss";
import type { MatchDisplayStatus, TurnId } from "../../lib/turnSimulation";

const TURN_NUMBER_BY_ID: Record<TurnId, number> = {
  Group_Stage_1: 1,
  Group_Stage_2: 2,
  Group_Stage_Final: 3,
  R16: 4,
  Quarterfinals: 5,
  Semifinals: 6,
  Final: 7,
};

function rosterPlayerIdMatchesScore(
  rosterPid: RosterPlayer["playerId"],
  scorePid: number
): boolean {
  if (rosterPid === null || rosterPid === undefined) return false;
  if (typeof rosterPid === "number") return rosterPid === scorePid;
  const n = Number(rosterPid);
  return !Number.isNaN(n) && n === scorePid;
}

/** Uses national team id on match sides (normalized to nationTeams.teamId). */
function matchInvolvesRoster(
  match: Match,
  signedSquads: RosterSquad[],
  signedStarters: RosterPlayer[]
): boolean {
  const hid = match.homeTeam.id;
  const aid = match.awayTeam.id;
  const squadHit = signedSquads.some((s) => s.teamId === hid || s.teamId === aid);
  const starterHit = signedStarters.some((p) => p.teamId === hid || p.teamId === aid);
  return squadHit || starterHit;
}

function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <path
        d="M5 3l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <path
        d="M3 5l4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLock({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <rect x="3" y="6" width="8" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * BracketView Component
 * Desktop tournament bracket view showing groups and knockout stages.
 */
export const BracketView: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentTurnId = useAppSelector(selectCurrentTurnId);
  const nextTurnId = useAppSelector(selectNextTurnId);
  const completedTurnIds = useAppSelector(selectCompletedTurnIds);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  const matchesByStage = useAppSelector(selectMatchesByStage);
  const nationalTeams = useAppSelector((state) => state.nationTeams.teams);
  const matchDisplayStatusById = useAppSelector(selectMatchDisplayStatusById);
  const inProgressHalftimeScores = useAppSelector(selectInProgressHalftimeScores);
  const rosterPlayers = useAppSelector((state) => state.roster.players);
  const rosterSquads = useAppSelector((state) => state.roster.squads);
  const loading = useAppSelector((state) => state.matches.isLoading);
  const turnScoresByTurn = useAppSelector((state) => state.turnScores.byTurn);
  const [isPlayPending, setIsPlayPending] = useState(false);

  const expansionInitializedRef = useRef(false);
  const completedKey = useMemo(() => completedTurnIds.join(","), [completedTurnIds]);

  const signedSquads = useMemo(
    () => rosterSquads.filter((s) => s.pool === "signed"),
    [rosterSquads]
  );
  const signedStarters = useMemo(
    () => rosterPlayers.filter((p) => p.pool === "signed" && p.role === "starter"),
    [rosterPlayers]
  );

  const groupByCountryCode = useMemo(() => {
    const map: Record<string, string> = {};
    nationalTeams.forEach((team) => {
      if (team.countryCode) {
        map[team.countryCode] = team.group || "";
      }
    });
    return map;
  }, [nationalTeams]);

  useEffect(() => {
    if (!currentTurnId) return;
    if (completedKey === "") {
      setExpandedStage(currentTurnId);
      expansionInitializedRef.current = true;
      return;
    }
    if (!expansionInitializedRef.current) {
      expansionInitializedRef.current = true;
      setExpandedStage(currentTurnId);
    }
  }, [currentTurnId, completedKey]);

  const groupMatches = matchesByStage["Group Stage"] || [];
  const matchesPerPhase = Math.ceil(groupMatches.length / 3);
  const groupStage1 = groupMatches.slice(0, matchesPerPhase);
  const groupStage2 = groupMatches.slice(matchesPerPhase, matchesPerPhase * 2);
  const groupStage3 = groupMatches.slice(matchesPerPhase * 2);

  const thirdPlaceMatches = matchesByStage["Third Place"] || [];
  const finalOnlyMatches = matchesByStage["Final"] || [];
  const finalRoundMatches = useMemo(
    () =>
      [...thirdPlaceMatches, ...finalOnlyMatches].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    [thirdPlaceMatches, finalOnlyMatches]
  );

  const stages: Array<{ id: TurnId; name: string; matches: Match[]; count: number }> = [
    { id: "Group_Stage_1", name: "Group Stage 1", matches: groupStage1, count: groupStage1.length },
    { id: "Group_Stage_2", name: "Group Stage 2", matches: groupStage2, count: groupStage2.length },
    { id: "Group_Stage_Final", name: "Group Stage 3", matches: groupStage3, count: groupStage3.length },
    {
      id: "R16",
      name: "Round of 16",
      matches: matchesByStage["Round of 16"] || [],
      count: (matchesByStage["Round of 16"] || []).length,
    },
    {
      id: "Quarterfinals",
      name: "Quarterfinals",
      matches: matchesByStage["Quarterfinals"] || [],
      count: (matchesByStage["Quarterfinals"] || []).length,
    },
    {
      id: "Semifinals",
      name: "Semifinals",
      matches: matchesByStage["Semifinals"] || [],
      count: (matchesByStage["Semifinals"] || []).length,
    },
    {
      id: "Final",
      name: "Final",
      matches: finalRoundMatches,
      count: finalRoundMatches.length,
    },
  ];

  const handleMatchClick = (match: Match) => {
    dispatch(openMatchModal(match));
  };

  const handlePlayTurn = async (stageId: TurnId) => {
    if (isPlayPending || loading) return;
    setIsPlayPending(true);

    const turnNumber = TURN_NUMBER_BY_ID[stageId];
    const isPreQuarterfinals = turnNumber < 5;

    const signedPlayers = rosterPlayers.filter((p) => p.pool === "signed");
    const starterPlayers = signedPlayers.filter((p) => p.role === "starter");
    const signedSquadsForWarn = rosterSquads.filter((s) => s.pool === "signed");

    const shouldWarn =
      isPreQuarterfinals &&
      (starterPlayers.length < 11 ||
        signedPlayers.length < 11 ||
        signedSquadsForWarn.length < 4);

    if (shouldWarn) {
      const confirmed = window.confirm(
        "Your roster is not at full pre-Quarterfinals setup yet (4 squads, 11 starters, 11+ signed players). Continue anyway?"
      );
      if (!confirmed) {
        setIsPlayPending(false);
        return;
      }
    }

    try {
      await dispatch(playTurn(stageId) as any);
    } finally {
      setIsPlayPending(false);
    }
  };

  return (
    <div className={styles.bracketView}>
      <div className={styles.bracketContainer}>
        {stages.map((stage) => {
          const isCompleted = completedTurnIds.includes(stage.id);
          const isCurrent = currentTurnId === stage.id;
          const isUpcoming = nextTurnId === stage.id;
          const isAccessible = isCompleted || isCurrent || isUpcoming;
          const isLocked = !isAccessible;
          const isExpanded = expandedStage === stage.id;
          const turnNumber = TURN_NUMBER_BY_ID[stage.id];
          const stageScore = turnScoresByTurn[turnNumber]?.turnScore;
          const turnScoreBundle = turnScoresByTurn[turnNumber];

          return (
            <div
              key={stage.id}
              className={`${styles.stage} ${isCompleted ? styles.completed : ""} ${
                isCurrent ? styles.current : ""
              } ${isUpcoming ? styles.upcoming : ""} ${isLocked ? styles.locked : ""} ${
                isExpanded ? styles.expanded : ""
              }`}
            >
              <div className={styles.stageHeaderContainer}>
                <button
                  type="button"
                  className={`${styles.stageHeader} ${isExpanded ? styles.expanded : ""}`}
                  onClick={() =>
                    isAccessible && setExpandedStage(isExpanded ? null : stage.id)
                  }
                  disabled={isLocked}
                  aria-label={`${stage.name}, ${stage.count} matches${
                    isLocked ? " (not playable yet)" : ""
                  }`}
                  aria-expanded={isExpanded}
                >
                  <span className={styles.stageMeta}>
                    <span className={styles.stageName}>{stage.name}</span>
                    <span className={styles.stageCount}>
                      {`Squads: ${stageScore?.squadPoints ?? 0}  Starters: ${
                        stageScore?.playerPoints ?? 0
                      }  Total: ${stageScore?.totalPoints ?? 0}`}
                    </span>
                  </span>
                  <span className={styles.stageHeaderTrailing}>
                    {isCompleted && (
                      <span className={styles.stageFinalLabel}>Final</span>
                    )}
                    <span className={styles.toggle}>
                      {isLocked ? (
                        <IconLock />
                      ) : isExpanded ? (
                        <IconChevronDown />
                      ) : (
                        <IconChevronRight />
                      )}
                    </span>
                  </span>
                </button>

                {isCurrent && (
                  <button
                    type="button"
                    className={styles.playButton}
                    onClick={() => handlePlayTurn(stage.id)}
                    disabled={loading || isPlayPending}
                    aria-label={`Play ${stage.name}`}
                  >
                    {loading || isPlayPending ? "Playing..." : "Play"}
                  </button>
                )}
              </div>

              {isAccessible && isExpanded && stage.matches.length > 0 && (
                <div className={styles.stageMatches}>
                  {stage.matches.map((match) => (
                    <MatchBracketItem
                      key={match.id}
                      match={match}
                      homeGroup={groupByCountryCode[match.homeTeam.countryCode] || ""}
                      awayGroup={groupByCountryCode[match.awayTeam.countryCode] || ""}
                      displayStatus={matchDisplayStatusById[match.id] || "Upcoming"}
                      inProgressHalftimeScore={inProgressHalftimeScores[match.id]}
                      rosterHighlight={matchInvolvesRoster(match, signedSquads, signedStarters)}
                      squadScores={turnScoreBundle?.squadScores}
                      playerScores={turnScoreBundle?.playerScores}
                      signedSquads={signedSquads}
                      signedStarters={signedStarters}
                      onClick={() => handleMatchClick(match)}
                    />
                  ))}
                </div>
              )}

              {isAccessible && isExpanded && stage.matches.length === 0 && (
                <div className={styles.noMatches}>
                  <p>No matches scheduled for this stage</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface MatchBracketItemProps {
  match: Match;
  homeGroup: string;
  awayGroup: string;
  displayStatus: MatchDisplayStatus;
  inProgressHalftimeScore?: { home: number; away: number };
  rosterHighlight: boolean;
  squadScores?: SquadScore[];
  playerScores?: PlayerScore[];
  signedSquads: RosterSquad[];
  signedStarters: RosterPlayer[];
  onClick: () => void;
}

function buildSideFantasyLines(
  side: "home" | "away",
  match: Match,
  squadScores: SquadScore[] | undefined,
  playerScores: PlayerScore[] | undefined,
  signedSquads: RosterSquad[],
  signedStarters: RosterPlayer[]
): React.ReactNode[] {
  const team = side === "home" ? match.homeTeam : match.awayTeam;
  const tid = team.id;
  const lines: React.ReactNode[] = [];

  if (!squadScores?.length && !playerScores?.length) {
    return lines;
  }

  const rosterSquad = signedSquads.find((s) => s.teamId === tid);
  if (rosterSquad) {
    const sc = squadScores?.find((ss) => ss.matchId === match.id && ss.teamId === tid);
    if (sc) {
      lines.push(
        <div key="squad" className={styles.fantasyLine}>
          Squad: {sc.totalPoints}
        </div>
      );
    }
  }

  const startersOnSide = signedStarters.filter((p) => p.teamId === tid);
  for (const p of startersOnSide) {
    const ps = playerScores?.find(
      (row) =>
        row.matchId === match.id && rosterPlayerIdMatchesScore(p.playerId, row.playerId)
    );
    if (ps) {
      lines.push(
        <div key={`p-${String(p.playerId)}`} className={styles.fantasyLine}>
          <span className={styles.fantasyJersey}>#{p.number}</span>{" "}
          <span className={styles.fantasyCountry} title={p.countryCode}>
            {p.countryCode}
          </span>{" "}
          <span className={styles.fantasyPlayerName}>{p.name}</span>: {ps.totalPoints}
        </div>
      );
    }
  }

  return lines;
}

const MatchBracketItem: React.FC<MatchBracketItemProps> = ({
  match,
  homeGroup,
  awayGroup,
  displayStatus,
  inProgressHalftimeScore,
  rosterHighlight,
  squadScores,
  playerScores,
  signedSquads,
  signedStarters,
  onClick,
}) => {
  const displayMatch = transformMatch(match);
  const isFinished = displayStatus === "Final";
  const isInProgress = displayStatus === "IN PROGRESS";

  const homeLines = buildSideFantasyLines(
    "home",
    match,
    squadScores,
    playerScores,
    signedSquads,
    signedStarters
  );
  const awayLines = buildSideFantasyLines(
    "away",
    match,
    squadScores,
    playerScores,
    signedSquads,
    signedStarters
  );
  const showFantasyBand = homeLines.length > 0 || awayLines.length > 0;

  return (
    <button
      type="button"
      className={`${styles.matchItem} ${rosterHighlight ? styles.rosterInvolvedMatch : ""} ${
        isInProgress ? styles.liveMatch : ""
      }`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick();
        }
      }}
      aria-label={`${match.homeTeam.name} vs ${match.awayTeam.name}, ${displayStatus}`}
    >
      {showFantasyBand && (
        <div className={styles.matchFantasyBand}>
          <div className={styles.matchFantasyCol}>{homeLines}</div>
          <div className={`${styles.matchFantasyCol} ${styles.matchFantasyColAway}`}>
            {awayLines}
          </div>
        </div>
      )}

      <div className={styles.matchContent}>
        <div className={styles.matchHeader}>
          <div className={styles.teams}>
            <span className={styles.teamName}>{match.homeTeam.name}</span>
            <span className={styles.flag}>{getTeamFlag(match.homeTeam.countryCode)}</span>
            {(isFinished || isInProgress) && (
              <>
                <span className={styles.score}>
                  {isFinished
                    ? displayMatch.score.home
                    : inProgressHalftimeScore?.home ?? "--"}
                </span>
                <span className={styles.status}>{displayStatus}</span>
                <span className={styles.score}>
                  {isFinished
                    ? displayMatch.score.away
                    : inProgressHalftimeScore?.away ?? "--"}
                </span>
              </>
            )}
            {!isFinished && !isInProgress && (
              <span className={styles.status}>{displayStatus}</span>
            )}
            <span className={styles.flag}>{getTeamFlag(match.awayTeam.countryCode)}</span>
            <span className={styles.teamName}>{match.awayTeam.name}</span>
          </div>
        </div>

        <div className={styles.matchDetails}>
          <span className={`${styles.groupTag} ${styles.groupTagLeft}`}>
            ({homeGroup || "--"})
          </span>
          {match.venue && <span className={styles.venue}>{match.venue.name}</span>}
          <span className={styles.date}>{formatMatchDate(match.date)}</span>
          <span className={`${styles.groupTag} ${styles.groupTagRight}`}>
            ({awayGroup || "--"})
          </span>
        </div>
      </div>

      {isInProgress && (
        <div className={styles.badges}>
          <span className={styles.liveBadge}>Live</span>
        </div>
      )}
    </button>
  );
};
