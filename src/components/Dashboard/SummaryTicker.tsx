import React from "react";
import { useAppSelector } from "../../store";
import {
  selectFinishedMatches,
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

  const renderTickerItem = (match: Match, uniqueKey: string) => {
    const displayMatch = transformMatch(match);
    const isFinished = finishedMatches.includes(match);
    const isUpcoming = upcomingMatches.includes(match);

    if (isFinished) {
      return (
        <div key={uniqueKey} className={styles.tickerItem}>
          <span className={styles.matchScore}>
            {match.homeTeam.name} {displayMatch.score.home} - {displayMatch.score.away} {match.awayTeam.name}
          </span>
        </div>
      );
    }

    if (isUpcoming) {
      const matchDate = new Date(match.date);
      const timeStr = matchDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      return (
        <div key={uniqueKey} className={styles.tickerItem}>
          <span className={styles.matchScore}>
            {match.homeTeam.name} vs {match.awayTeam.name}
          </span>
          <span className={styles.details}>
            {matchDate.toLocaleDateString()} · {timeStr}
          </span>
        </div>
      );
    }

    return null;
  };

  const tickerItems = [
    ...finishedMatches.map((m) => renderTickerItem(m, `match-${m.id}`)),
    ...upcomingMatches.slice(0, 5).map((m) => renderTickerItem(m, `match-${m.id}`)),
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

  // Filter out null items and duplicate for seamless loop with suffixed keys
  const items = tickerItems.filter(Boolean);
  const loopedItems = [
    ...items,
    ...items.map((item) => {
      // Suffix the key to make duplicates unique for the second loop
      const originalKey = item.key;
      return React.cloneElement(item as React.ReactElement<any>, {
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
