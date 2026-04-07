import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { openMatchModal } from "../../store/slices/uiSlice";
import {
  selectAllMatches,
  selectSignedSquadIds,
  selectSignedPlayerTeamIds,
} from "../../store/selectors/scoringSelectors";
import type { Match } from "../../types/match";
import { transformMatch } from "../../lib/dataTransform";
import { getTeamFlag } from "../../lib/teamColors";
import styles from "./MatchList.module.scss";

type FilterStatus = "all" | "upcoming" | "live" | "finished";

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
  const rosterSquads = useAppSelector(selectSignedSquadIds);
  const rosterPlayers = useAppSelector(selectSignedPlayerTeamIds);
  const isLoading = useAppSelector((state) => state.matches.isLoading);
  const error = useAppSelector((state) => state.matches.error);

  // Filter matches by status
  const filteredMatches = matches.filter((match) => {
    if (filterStatus === "upcoming") {
      return match.status.short === "NS";
    }
    if (filterStatus === "live") {
      return ["1H", "2H", "ET", "HT", "P"].includes(match.status.short);
    }
    if (filterStatus === "finished") {
      return match.status.short === "FT" || match.status.short === "AET";
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
    switch (match.status.short) {
      case "NS":
        return "Upcoming";
      case "1H":
      case "2H":
      case "ET":
        return `${match.status.elapsed}'`;
      case "HT":
        return "HT";
      case "P":
        return "Penalties";
      case "FT":
      case "AET":
        return "Final";
      default:
        return match.status.short;
    }
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
          className={`${styles.tab} ${filterStatus === "live" ? styles.active : ""}`}
          onClick={() => setFilterStatus("live")}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setFilterStatus("live"); }}
          aria-label="Filter matches by Live"
          aria-current={filterStatus === "live" ? "page" : undefined}
        >
          Live
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
                  const isLive = ["1H", "2H", "ET", "HT", "P"].includes(match.status.short);

                  return (
                    <button
                      key={match.id}
                      type="button"
                      className={`${styles.matchItem} ${isRoster ? styles.rosterMatch : ""} ${
                        isLive ? styles.liveMatch : ""
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
                      {isLive && <div className={styles.liveBadge}>🔴 LIVE</div>}

                      <div className={styles.matchContent}>
                        <div className={styles.matchHeader}>
                          <div className={styles.teams}>
                            <span className={styles.team}>{match.homeTeam.name}</span>
                            <span className={styles.flag}>{getTeamFlag(match.homeTeam.countryCode)}</span>
                            <span className={styles.score}>
                              {(() => {
                                const displayMatch = transformMatch(match);
                                return match.status.short === "FT" || match.status.short === "AET"
                                  ? displayMatch.score.home
                                  : match.status.short === "NS"
                                  ? "--"
                                  : displayMatch.score.home;
                              })()}
                            </span>
                            <span className={styles.status}>{getStatusDisplay(match)}</span>
                            <span className={styles.score}>
                              {(() => {
                                const displayMatch = transformMatch(match);
                                return match.status.short === "FT" || match.status.short === "AET"
                                  ? displayMatch.score.away
                                  : match.status.short === "NS"
                                  ? "--"
                                  : displayMatch.score.away;
                              })()}
                            </span>
                            <span className={styles.flag}>{getTeamFlag(match.awayTeam.countryCode)}</span>
                            <span className={styles.team}>{match.awayTeam.name}</span>
                          </div>
                        </div>

                        <div className={styles.matchDetails}>
                          {match.venue && <span className={styles.venue}>{match.venue.name}</span>}
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
