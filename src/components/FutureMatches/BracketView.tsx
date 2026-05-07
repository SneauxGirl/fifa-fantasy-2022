import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { openMatchModal } from "../../store/slices/uiSlice";
import { selectMatchesByStage, selectSignedSquadIds } from "../../store/selectors/scoringSelectors";
import { playTurn } from "../../store/thunks/rosterThunks";
import type { Match } from "../../types/match";
import { transformMatch, formatMatchDate } from "../../lib/dataTransform";
import { getTeamFlag } from "../../lib/teamColors";
import styles from "./BracketView.module.scss";

/**
 * BracketView Component
 * Desktop tournament bracket view showing groups and knockout stages.
 */
export const BracketView: React.FC = () => {
  const dispatch = useAppDispatch();
  const [expandedStage, setExpandedStage] = useState<string | null>("gs2");

  const matchesByStage = useAppSelector(selectMatchesByStage);
  const rosterSquads = useAppSelector(selectSignedSquadIds);
  const loading = useAppSelector((state) => state.matches.isLoading);

  // Split Group Stage matches into 3 phases
  const groupMatches = matchesByStage["Group Stage"] || [];
  const matchesPerPhase = Math.ceil(groupMatches.length / 3);
  const groupStage1 = groupMatches.slice(0, matchesPerPhase);
  const groupStage2 = groupMatches.slice(matchesPerPhase, matchesPerPhase * 2);
  const groupStage3 = groupMatches.slice(matchesPerPhase * 2);

  const stages = [
    { id: "Group_Stage_1", name: "Group Stage 1", matches: groupStage1, count: groupStage1.length },
    { id: "Group_Stage_2", name: "Group Stage 2", matches: groupStage2, count: groupStage2.length },
    { id: "Group_Stage_Final", name: "Group Stage 3", matches: groupStage3, count: groupStage3.length },
    { id: "R16", name: "Round of 16", matches: matchesByStage["Round of 16"], count: matchesByStage["Round of 16"].length },
    { id: "Quarterfinals", name: "Quarterfinals", matches: matchesByStage["Quarterfinals"], count: matchesByStage["Quarterfinals"].length },
    { id: "Semifinals", name: "Semifinals", matches: matchesByStage["Semifinals"], count: matchesByStage["Semifinals"].length },
    { id: "Final", name: "Final", matches: matchesByStage["Final"], count: matchesByStage["Final"].length },
  ];

  const handleMatchClick = (match: Match) => {
    dispatch(openMatchModal(match));
  };

  const isRosterMatch = (match: Match) => {
    return (
      rosterSquads.includes(match.homeTeam.id) || rosterSquads.includes(match.awayTeam.id)
    );
  };

  return (
    <div className={styles.bracketView}>
      <div className={styles.bracketContainer}>
        {stages.map((stage) => {
          const isCompleted = stage.id === "gs1";
          const isCurrent = stage.id === "gs2" && expandedStage !== stage.id;
          const isUpcoming = stage.id === "gs3";
          const isLocked = ["round16", "quarters", "semis", "final"].includes(stage.id);
          const isExpanded = expandedStage === stage.id;
          return (
            <div key={stage.id} className={`${styles.stage} ${isCompleted ? styles.completed : ""} ${isCurrent ? styles.current : ""} ${isUpcoming ? styles.upcoming : ""} ${isLocked ? styles.locked : ""} ${isExpanded ? styles.expanded : ""}`}>
            <div className={styles.stageHeaderContainer}>
              <button
                type="button"
                className={`${styles.stageHeader} ${
                  expandedStage === stage.id ? styles.expanded : ""
                }`}
                onClick={() => !isLocked && setExpandedStage(expandedStage === stage.id ? null : stage.id)}
                disabled={isLocked}
                aria-label={`${stage.name}, ${stage.count} matches${isLocked ? " (locked)" : ""}`}
                aria-expanded={expandedStage === stage.id}
              >
                <span className={styles.stageName}>{stage.name}</span>
                <span className={styles.stageCount}>{stage.count} matches</span>
                <span className={styles.toggle}>
                  {isLocked ? "🔒" : expandedStage === stage.id ? "▼" : "▶"}
                </span>
              </button>

              {!isLocked && (
                <button
                  type="button"
                  className={styles.playButton}
                  onClick={() => dispatch(playTurn(stage.id) as any)}
                  disabled={loading}
                  aria-label={`Play ${stage.name}`}
                >
                  {loading ? "Playing..." : "Play"}
                </button>
              )}
            </div>

            {expandedStage === stage.id && stage.matches.length > 0 && (
              <div className={styles.stageMatches}>
                {stage.matches.map((match) => (
                  <MatchBracketItem
                    key={match.id}
                    match={match}
                    isRoster={isRosterMatch(match)}
                    onClick={() => handleMatchClick(match)}
                  />
                ))}
              </div>
            )}

            {expandedStage === stage.id && stage.matches.length === 0 && (
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
  isRoster: boolean;
  onClick: () => void;
}

//Remove isLive logic throughout. No longer valid. #TODO
const MatchBracketItem: React.FC<MatchBracketItemProps> = ({
  match,
  isRoster,
  onClick,
}) => {
  const displayMatch = transformMatch(match);
  const isFinished = match.status.short === "FT" || match.status.short === "AET" || match.status.short === "PEN";

  const getStatusDisplay = () => {
    if (isFinished) return "Final";
    if (match.status.short === "NS") return "Upcoming";
    return match.status.short;
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
            {(isFinished || isLive) && (
              <>
                <span className={styles.score}>{displayMatch.score.home}</span>
                <span className={styles.status}>{getStatusDisplay()}</span>
                <span className={styles.score}>{displayMatch.score.away}</span>
              </>
            )}
            {!isFinished && !isLive && (
              <span className={styles.status}>{getStatusDisplay()}</span>
            )}
            <span className={styles.flag}>{getTeamFlag(match.awayTeam.countryCode)}</span>
            <span className={styles.teamName}>{match.awayTeam.name}</span>
          </div>
        </div>

        <div className={styles.matchDetails}>
          {match.venue && <span className={styles.venue}>{match.venue.name}</span>}
          <span className={styles.date}>{formatMatchDate(match.date)}</span>
        </div>
      </div>

      {(isRoster || isLive) && (
        <div className={styles.badges}>
          {isRoster && <span className={styles.rosterBadge}>📊</span>}
          {isLive && <span className={styles.liveBadge}>🔴 LIVE</span>}
        </div>
      )}
    </button>
  );
};
