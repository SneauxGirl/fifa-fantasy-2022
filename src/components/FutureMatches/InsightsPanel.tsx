import React from "react";
import { useAppSelector } from "../../store";
import { selectSignedSquads } from "../../store/selectors/rosterSelectors";
import type { Match } from "../../types/match";
import { transformMatch } from "../../lib/dataTransform";
import { countryToFifa } from "../../lib/formatMapping";
import styles from "./InsightsPanel.module.scss";

interface InsightsPanelProps {
  match: Match | null;
}
// REEVALUATE LOGIC to compare roster members and point out multi-week ahead conflicts #TODO
/**
 * InsightsPanel Component
 * Displays strategic insights and recommendations for a selected match.
 */
export const InsightsPanel: React.FC<InsightsPanelProps> = ({ match }) => {
  const signedSquads = useAppSelector(selectSignedSquads);
  const rosterSquads = signedSquads.map((s) => ({ id: s.teamId, name: s.name }));

  if (!match) {
    return (
      <div className={styles.insightsPanel}>
        <div className={styles.placeholder}>
          <p>Select a match to view insights and recommendations</p>
        </div>
      </div>
    );
  }

  // Calculate insights based on match and roster
  const homeTeamInRoster = rosterSquads.some((s) => s.id === match.homeTeam.id);
  const awayTeamInRoster = rosterSquads.some((s) => s.id === match.awayTeam.id);
  const bothTeamsInRoster = homeTeamInRoster && awayTeamInRoster;

  const insights: Array<{
    type: "warning" | "info";
    title: string;
    description: string;
  }> = [];

  // Generate insights
  if (bothTeamsInRoster) {
    insights.push({
      type: "warning",
      title: "⚠️ Squad Conflict",
      description: `Both ${match.homeTeam.name} and ${match.awayTeam.name} are in your roster. One squad will lose this match.`,
    });
  }

  if (homeTeamInRoster || awayTeamInRoster) {
    insights.push({
      type: "info",
      title: "ℹ️ Roster Impact",
      description: `This match involves ${
        homeTeamInRoster ? match.homeTeam.name : match.awayTeam.name
      } from your roster. Monitor player performance closely.`,
    });
  }

  if (match.status.short === "NS") {
    const matchDate = new Date(match.date);
    const daysUntil = Math.ceil((matchDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    insights.push({
      type: "info",
      title: "ℹ️ Upcoming Match",
      description: `This match is scheduled in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}. Plan your roster accordingly.`,
    });
  }

  if (
    match.status.short === "FT" ||
    match.status.short === "AET"
  ) {
    const displayMatch = transformMatch(match);
    const winner =
      displayMatch.score.home > displayMatch.score.away
        ? match.homeTeam.name
        : displayMatch.score.away > displayMatch.score.home
        ? match.awayTeam.name
        : "Tie";

    insights.push({
      type: "info",
      title: "📊 Match Result",
      description: `Final Score: ${countryToFifa(match.homeTeam.countryCode)} ${displayMatch.score.home} - ${displayMatch.score.away} ${countryToFifa(match.awayTeam.countryCode)}. Winner: ${winner}`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: "info",
      title: "ℹ️ No Conflicts",
      description: "This match does not involve any of your selected teams.",
    });
  }

  return (
    <div className={styles.insightsPanel}>
      <div className={styles.matchHeader}>
        <h3>
          {match.homeTeam.name} vs {match.awayTeam.name}
        </h3>
        <span className={styles.date}>
          {new Date(match.date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      <div className={styles.insightsList}>
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className={`${styles.insightItem} ${styles[insight.type]}`}
          >
            <div className={styles.insightHeader}>
              <h4 className={styles.insightTitle}>{insight.title}</h4>
            </div>
            <p className={styles.insightDescription}>{insight.description}</p>
          </div>
        ))}
      </div>

      <div className={styles.matchDetails}>
        <h4>Match Details</h4>
        <div className={styles.detailsGrid}>
          <div className={styles.detail}>
            <span className={styles.label}>Venue:</span>
            <span className={styles.value}>{match.venue?.name ?? "TBD"}</span>
          </div>
          <div className={styles.detail}>
            <span className={styles.label}>City:</span>
            <span className={styles.value}>{match.venue?.city ?? "TBD"}</span>
          </div>
          <div className={styles.detail}>
            <span className={styles.label}>Round:</span>
            <span className={styles.value}>{match.stage?.name || "TBD"}</span>
          </div>
          <div className={styles.detail}>
            <span className={styles.label}>Status:</span>
            <span className={styles.value}>{match.status.short}</span>
          </div>
        </div>
      </div>

      <div className={styles.recommendation}>
        <h4>Recommendation</h4>
        <p>
          {bothTeamsInRoster
            ? "Consider removing one squad from your roster to avoid this conflict."
            : homeTeamInRoster || awayTeamInRoster
            ? "Monitor this match closely and be prepared to adjust your roster if needed."
            : "No immediate action required for this match."}
        </p>
      </div>
    </div>
  );
};
