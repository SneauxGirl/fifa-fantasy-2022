import React, { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { openMatchModal } from "../../store/slices/uiSlice";
import {
  selectCompletedTurnIds,
  selectCurrentTurnId,
  selectInProgressHalftimeScores,
  selectMatchDisplayStatusById,
  selectMatchesByStage,
  selectNextTurnId,
  selectSignedSquadIds,
} from "../../store/selectors/scoringSelectors";
import { playTurn } from "../../store/thunks/rosterThunks";
import type { Match } from "../../types/match";
import { transformMatch, formatMatchDate } from "../../lib/dataTransform";
import { getTeamFlag } from "../../lib/teamColors";
import styles from "./BracketView.module.scss";
import type { MatchDisplayStatus, TurnId } from "../../lib/turnSimulation";

/**
 * BracketView Component
 * Desktop tournament bracket view showing groups and knockout stages.
 */
export const BracketView: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentTurnId = useAppSelector(selectCurrentTurnId);
  const nextTurnId = useAppSelector(selectNextTurnId);
  const completedTurnIds = useAppSelector(selectCompletedTurnIds);
  const [expandedStage, setExpandedStage] = useState<string | null>(currentTurnId);

  const matchesByStage = useAppSelector(selectMatchesByStage);
  const signedSquadIds = useAppSelector(selectSignedSquadIds);
  const nationalTeams = useAppSelector((state) => state.nationTeams.teams);
  const matchDisplayStatusById = useAppSelector(selectMatchDisplayStatusById);
  const inProgressHalftimeScores = useAppSelector(selectInProgressHalftimeScores);
  const rosterPlayers = useAppSelector((state) => state.roster.players);
  const rosterSquads = useAppSelector((state) => state.roster.squads);
  const loading = useAppSelector((state) => state.matches.isLoading);

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
    if (currentTurnId) {
      setExpandedStage(currentTurnId);
    }
  }, [currentTurnId]);

  // Split Group Stage matches into 3 phases
  const groupMatches = matchesByStage["Group Stage"] || [];
  const matchesPerPhase = Math.ceil(groupMatches.length / 3);
  const groupStage1 = groupMatches.slice(0, matchesPerPhase);
  const groupStage2 = groupMatches.slice(matchesPerPhase, matchesPerPhase * 2);
  const groupStage3 = groupMatches.slice(matchesPerPhase * 2);

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
      matches: matchesByStage["Final"] || [],
      count: (matchesByStage["Final"] || []).length,
    },
  ];

  const handleMatchClick = (match: Match) => {
    dispatch(openMatchModal(match));
  };

  const isRosterMatch = (match: Match) => {
    return (
      signedSquadIds.includes(match.homeTeam.id) || signedSquadIds.includes(match.awayTeam.id)
    );
  };

  const handlePlayTurn = (stageId: TurnId) => {
    const turnNumberMap: Record<TurnId, number> = {
      Group_Stage_1: 1,
      Group_Stage_2: 2,
      Group_Stage_Final: 3,
      R16: 4,
      Quarterfinals: 5,
      Semifinals: 6,
      Final: 7,
    };
    const turnNumber = turnNumberMap[stageId];
    const isPreQuarterfinals = turnNumber < 5;

    const signedPlayers = rosterPlayers.filter((p) => p.pool === "signed");
    const starterPlayers = signedPlayers.filter((p) => p.role === "starter");
    const signedSquads = rosterSquads.filter((s) => s.pool === "signed");

    const shouldWarn =
      isPreQuarterfinals &&
      (starterPlayers.length < 11 || signedPlayers.length < 11 || signedSquads.length < 4);

    if (shouldWarn) {
      const confirmed = window.confirm(
        "Your roster is not at full pre-Quarterfinals setup yet (4 squads, 11 starters, 11+ signed players). Continue anyway?"
      );
      if (!confirmed) return;
    }

    dispatch(playTurn(stageId) as any);
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
          return (
            <div key={stage.id} className={`${styles.stage} ${isCompleted ? styles.completed : ""} ${isCurrent ? styles.current : ""} ${isUpcoming ? styles.upcoming : ""} ${isLocked ? styles.locked : ""} ${isExpanded ? styles.expanded : ""}`}>
            <div className={styles.stageHeaderContainer}>
              <button
                type="button"
                className={`${styles.stageHeader} ${
                  expandedStage === stage.id ? styles.expanded : ""
                }`}
                onClick={() =>
                  isAccessible && setExpandedStage(expandedStage === stage.id ? null : stage.id)
                }
                disabled={isLocked}
                aria-label={`${stage.name}, ${stage.count} matches${isLocked ? " (not playable yet)" : ""}`}
                aria-expanded={expandedStage === stage.id}
              >
                <span className={styles.stageName}>{stage.name}</span>
                <span className={styles.stageCount}>{stage.count} matches</span>
                <span className={styles.toggle}>
                  {isLocked ? "🔒" : expandedStage === stage.id ? "▼" : "▶"}
                </span>
              </button>

              {isCurrent && (
                <button
                  type="button"
                  className={styles.playButton}
                  onClick={() => handlePlayTurn(stage.id)}
                  disabled={loading}
                  aria-label={`Play ${stage.name}`}
                >
                  {loading ? "Playing..." : "Play"}
                </button>
              )}
            </div>

            {isAccessible && expandedStage === stage.id && stage.matches.length > 0 && (
              <div className={styles.stageMatches}>
                {stage.matches.map((match) => (
                  <MatchBracketItem
                    key={match.id}
                    match={match}
                    homeGroup={groupByCountryCode[match.homeTeam.countryCode] || ""}
                    awayGroup={groupByCountryCode[match.awayTeam.countryCode] || ""}
                    displayStatus={matchDisplayStatusById[match.id] || "Upcoming"}
                    inProgressHalftimeScore={inProgressHalftimeScores[match.id]}
                    isRoster={isRosterMatch(match)}
                    onClick={() => handleMatchClick(match)}
                  />
                ))}
              </div>
            )}

            {isAccessible && expandedStage === stage.id && stage.matches.length === 0 && (
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

//REMOVE expandedStage logic - AND lock stages to play in order. #TODO

/**
 * MatchBracketItem Component
 * Single match display in bracket.
 */
interface MatchBracketItemProps {
  match: Match;
  homeGroup: string;
  awayGroup: string;
  displayStatus: MatchDisplayStatus;
  inProgressHalftimeScore?: { home: number; away: number };
  isRoster: boolean;
  onClick: () => void;
}

const MatchBracketItem: React.FC<MatchBracketItemProps> = ({
  match,
  homeGroup,
  awayGroup,
  displayStatus,
  inProgressHalftimeScore,
  isRoster,
  onClick,
}) => {
  const displayMatch = transformMatch(match);
  const isFinished = displayStatus === "Final";
  const isInProgress = displayStatus === "IN PROGRESS";

  const getStatusDisplay = () => {
    return displayStatus;
  };

  return (
    <button
      type="button"
      className={`${styles.matchItem} ${isRoster ? styles.rosterMatch : ""}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick();
        }
      }}
      aria-label={`${match.homeTeam.name} vs ${match.awayTeam.name}, ${getStatusDisplay()}`}
    >
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
                <span className={styles.status}>{getStatusDisplay()}</span>
                <span className={styles.score}>
                  {isFinished
                    ? displayMatch.score.away
                    : inProgressHalftimeScore?.away ?? "--"}
                </span>
              </>
            )}
            {!isFinished && !isInProgress && (
              <span className={styles.status}>{getStatusDisplay()}</span>
            )}
            <span className={styles.flag}>{getTeamFlag(match.awayTeam.countryCode)}</span>
            <span className={styles.teamName}>{match.awayTeam.name}</span>
          </div>
        </div>

        <div className={styles.matchDetails}>
          <span className={`${styles.groupTag} ${styles.groupTagLeft}`}>({homeGroup || "--"})</span>
          {match.venue && <span className={styles.venue}>{match.venue.name}</span>}
          <span className={styles.date}>{formatMatchDate(match.date)}</span>
          <span className={`${styles.groupTag} ${styles.groupTagRight}`}>({awayGroup || "--"})</span>
        </div>
      </div>

      {(isRoster || isInProgress) && (
        <div className={styles.badges}>
          {isRoster && <span className={styles.rosterBadge}>📊</span>}
          {isInProgress && <span className={styles.liveBadge}>🔴 LIVE</span>}
        </div>
      )}
    </button>
  );
};
