import React from "react";
import { useAppSelector } from "../../store";
import {
  selectFinishedMatches,
  selectInProgressHalftimeScores,
  selectMatchDisplayStatusById,
  selectUpcomingMatches,
} from "../../store/selectors/scoringSelectors";
import type { Match } from "../../types/match";
import { transformMatch } from "../../lib/dataTransform";
import styles from "./SummaryTicker.module.scss";

/**
 * SummaryTicker Component
 * Marquee-style ticker showing:
 * - Tournament-to-date match scores
 * - Coming matches with dates/times
 * - Links to StubHub and FIFA Store
 */
export const SummaryTicker: React.FC = () => {
  const finishedMatches = useAppSelector(selectFinishedMatches);
  const upcomingMatches = useAppSelector(selectUpcomingMatches);
  const matchStatusById = useAppSelector(selectMatchDisplayStatusById);
  const inProgressHalftimeScores = useAppSelector(selectInProgressHalftimeScores);

  const renderFinishedTickerItem = (match: Match, uniqueKey: string): React.ReactElement => {
    const displayMatch = transformMatch(match);
    return (
      <div key={uniqueKey} className={styles.tickerItem}>
        <span className={styles.matchScore}>
          {match.homeTeam.name} {displayMatch.score.home} - {displayMatch.score.away} {match.awayTeam.name}
        </span>
      </div>
    );
  };

  const renderUpcomingTickerItem = (match: Match, uniqueKey: string): React.ReactElement => {
    const displayStatus = matchStatusById[match.id] || "Upcoming";
    const isInProgress = displayStatus === "IN PROGRESS";
    const inProgressScore = inProgressHalftimeScores[match.id];
    const displayMatch = transformMatch(match);
    const scoreText = isInProgress
      ? `${inProgressScore?.home ?? displayMatch.score.home} - ${
          inProgressScore?.away ?? displayMatch.score.away
        }`
      : "vs";

    return (
      <div key={uniqueKey} className={styles.tickerItem}>
        <span className={styles.matchScore}>
          {match.homeTeam.name} {scoreText} {match.awayTeam.name}
        </span>
        {isInProgress ? (
          <span className={styles.inProgressBadge}>🔴 LIVE</span>
        ) : (
          <span className={styles.details}>Upcoming</span>
        )}
      </div>
    );
  };

  const tickerItems: React.ReactElement[] = [
    ...finishedMatches.map((m) => renderFinishedTickerItem(m, `match-${m.id}`)),
    ...upcomingMatches.slice(0, 5).map((m) => renderUpcomingTickerItem(m, `match-${m.id}`)),
    <div key="stubhub" className={styles.tickerItem}>
      <a
        href="https://www.stubhub.com/fifa-world-cup-tickets/event/149854291"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.externalLink}
      >
        🎟️ Find Match Day Tickets →
      </a>
    </div>,
    <div key="merch" className={styles.tickerItem}>
      <a
        href="https://store.fifa.com/en-us/2026-world-cup"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.externalLink}
      >
        👕 Find Merch →
      </a>
    </div>,
  ];

  // Duplicate for seamless loop with suffixed keys
  const items = tickerItems;
  const loopedItems = [
    ...items,
    ...items.map((item) => {
      // Suffix the key to make duplicates unique for the second loop
      const originalKey = item.key;
      return React.cloneElement(item, {
        key: `${originalKey}-dup`,
      });
    }),
  ];

  return (
    <div className={styles.summaryTicker}>
      <div className={styles.tickerContent}>
        {loopedItems}
      </div>
    </div>
  );
};
