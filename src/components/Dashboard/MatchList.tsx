import React, { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { openMatchModal } from "../../store/slices/uiSlice";
import {
  selectAllMatches,
  selectInProgressHalftimeScores,
  selectMatchDisplayStatusById,
  selectSignedSquadIds,
  selectSignedPlayerTeamIds,
} from "../../store/selectors/scoringSelectors";
import type { Match } from "../../types/match";
import { formatMatchDate, transformMatch } from "../../lib/dataTransform";
import { getTeamFlag } from "../../lib/teamColors";
import styles from "./MatchList.module.scss";

type FilterStatus = "all" | "upcoming" | "finished";

/**
 * MatchList Component
 * Displays all matches with filtering by status.
 * Highlights roster matches (where user has selected players).
 * Click to open MatchCardModal.
 */
export const MatchList: React.FC = () => {
  const dispatch = useAppDispatch();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const matches = useAppSelector(selectAllMatches);
  const matchStatusById = useAppSelector(selectMatchDisplayStatusById);
  const inProgressHalftimeScores = useAppSelector(selectInProgressHalftimeScores);
  const nationalTeams = useAppSelector((state) => state.nationTeams.teams);
  const rosterSquads = useAppSelector(selectSignedSquadIds);
  const rosterPlayers = useAppSelector(selectSignedPlayerTeamIds);
  const isLoading = useAppSelector((state) => state.matches.isLoading);
  const error = useAppSelector((state) => state.matches.error);

  const groupByCountryCode = useMemo(() => {
    const map: Record<string, string> = {};
    nationalTeams.forEach((team) => {
      if (team.countryCode) {
        map[team.countryCode] = team.group || "";
      }
    });
    return map;
  }, [nationalTeams]);

  // Filter matches by status
  const filteredMatches = matches.filter((match) => {
    const displayStatus = matchStatusById[match.id] || "Upcoming";
    if (filterStatus === "upcoming") {
      return displayStatus !== "Final";
    }
    if (filterStatus === "finished") {
      return displayStatus === "Final";
    }
    return true; // "all"
  });

  // Check if match is a roster match
  const isRosterMatch = (match: Match) => {
    const hasRosterTeam =
      rosterSquads.includes(match.homeTeam.id) || rosterSquads.includes(match.awayTeam.id);
    const hasRosterPlayer =
      rosterPlayers.includes(match.homeTeam.id) || rosterPlayers.includes(match.awayTeam.id);
    return hasRosterTeam || hasRosterPlayer;
  };

  // Get match status display
  const getStatusDisplay = (match: Match) => {
    return matchStatusById[match.id] || "Upcoming";
  };

  const handleMatchClick = (match: Match) => {
    dispatch(openMatchModal(match));
  };

  return (
    <div className={styles.matchList}>
      {/* Filter Tabs */}
      <div className={styles.filterTabs}>
        <button
          type="button"
          className={`${styles.tab} ${filterStatus === "all" ? styles.active : ""}`}
          onClick={() => setFilterStatus("all")}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setFilterStatus("all"); }}
          aria-label="Filter matches by All"
          aria-current={filterStatus === "all" ? "page" : undefined}
        >
          All
        </button>
        <button
          type="button"
          className={`${styles.tab} ${filterStatus === "upcoming" ? styles.active : ""}`}
          onClick={() => setFilterStatus("upcoming")}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setFilterStatus("upcoming"); }}
          aria-label="Filter matches by Upcoming"
          aria-current={filterStatus === "upcoming" ? "page" : undefined}
        >
          Upcoming
        </button>
        <button
          type="button"
          className={`${styles.tab} ${filterStatus === "finished" ? styles.active : ""}`}
          onClick={() => setFilterStatus("finished")}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setFilterStatus("finished"); }}
          aria-label="Filter matches by Finished"
          aria-current={filterStatus === "finished" ? "page" : undefined}
        >
          Finished
        </button>
      </div>

      {/* Match Items */}
      <div className={styles.matchItems}>
        {isLoading && (
          <div className={styles.loadingState}>
            <p>Loading matches...</p>
          </div>
        )}
        {error && (
          <div className={styles.errorState}>
            <p>Error loading matches</p>
            <p className={styles.errorMessage}>{error}</p>
          </div>
        )}
        {!isLoading && !error && filteredMatches.length === 0 && (
          <div className={styles.emptyState}>
            <p>No matches found for this filter</p>
          </div>
        )}
        {!isLoading && !error && filteredMatches.length > 0 && (() => {
          // Group matches by date
          const groupedByDate = filteredMatches.reduce((acc, match) => {
            const dateKey = new Date(match.date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            });
            if (!acc[dateKey]) {
              acc[dateKey] = [];
            }
            acc[dateKey].push(match);
            return acc;
          }, {} as Record<string, Match[]>);

          return Object.entries(groupedByDate).map(([dateKey, matches]) => (
            <div key={dateKey}>
              <h3 className={styles.dateHeader}>{dateKey}</h3>
              <div className={styles.matchGroup}>
                {matches.map((match) => {
                  const isRoster = isRosterMatch(match);
                  const displayStatus = getStatusDisplay(match);
                  const isInProgress = displayStatus === "IN PROGRESS";
                  const isFinal = displayStatus === "Final";
                  const inProgressScore = inProgressHalftimeScores[match.id];
                  const homeGroup = groupByCountryCode[match.homeTeam.countryCode] || "";
                  const awayGroup = groupByCountryCode[match.awayTeam.countryCode] || "";

                  return (
                    <button
                      key={match.id}
                      type="button"
                      className={`${styles.matchItem} ${isRoster ? styles.rosterMatch : ""} ${
                        isInProgress ? styles.liveMatch : ""
                      }`}
                      onClick={() => handleMatchClick(match)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handleMatchClick(match);
                        }
                      }}
                      aria-label={`${match.homeTeam.name} vs ${match.awayTeam.name}, ${getStatusDisplay(match)}`}
                    >
                      {isRoster && <div className={styles.rosterBadge}>📊</div>}
                      {isInProgress && <div className={styles.liveBadge}>🔴 LIVE</div>}

                      <div className={styles.matchContent}>
                        <div className={styles.matchHeader}>
                          <div className={styles.teams}>
                            <span className={styles.team}>{match.homeTeam.name}</span>
                            <span className={styles.flag}>{getTeamFlag(match.homeTeam.countryCode)}</span>
                            <span className={styles.score}>
                              {(() => {
                                const displayMatch = transformMatch(match);
                                if (isFinal) return displayMatch.score.home;
                                if (isInProgress && inProgressScore)
                                  return inProgressScore.home;
                                return "--";
                              })()}
                            </span>
                            <span className={styles.status}>{displayStatus}</span>
                            <span className={styles.score}>
                              {(() => {
                                const displayMatch = transformMatch(match);
                                if (isFinal) return displayMatch.score.away;
                                if (isInProgress && inProgressScore)
                                  return inProgressScore.away;
                                return "--";
                              })()}
                            </span>
                            <span className={styles.flag}>{getTeamFlag(match.awayTeam.countryCode)}</span>
                            <span className={styles.team}>{match.awayTeam.name}</span>
                          </div>
                        </div>

                        <div className={styles.matchDetails}>
                          <span className={`${styles.groupTag} ${styles.groupTagLeft}`}>({homeGroup || "--"})</span>
                          {match.venue && <span className={styles.venue}>{match.venue.name}</span>}
                          <span className={styles.date}>{formatMatchDate(match.date)}</span>
                          <span className={`${styles.groupTag} ${styles.groupTagRight}`}>({awayGroup || "--"})</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ));
        })()}
      </div>
    </div>
  );
};
