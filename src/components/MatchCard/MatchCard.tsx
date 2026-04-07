// src/components/MatchCard/MatchCard.tsx
import React from "react";
import type { Match, Roster, RosterMember, RosterPlayer } from "../../types/match";
import { countryToFifa } from "../../lib/formatMapping";
import styles from "./MatchCard.module.scss";

interface MatchCardProps {
  match: Match;
  roster: Roster;
  onMemberClick?: (member: RosterMember) => void; // navigate to PlayerCard/SquadCard
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, roster, onMemberClick }) => {
  // Collect which roster members are involved in this match
  const rosterMembersInMatch: Array<RosterMember & { pointsThisMatch: number }> = [];

  // Check squads
  for (const squad of roster.squads) {
    if (squad.teamId === match.homeTeam.id || squad.teamId === match.awayTeam.id) {
      const pointsThisMatch = squad.matchPoints[match.id.toString()] ?? 0;
      rosterMembersInMatch.push({ ...squad, pointsThisMatch });
    }
  }

  // Check players
  for (const player of roster.players) {
    if (player.teamId === match.homeTeam.id || player.teamId === match.awayTeam.id) {
      const pointsThisMatch = player.matchPoints[match.id.toString()] ?? 0;
      rosterMembersInMatch.push({ ...player, pointsThisMatch });
    }
  }

  // Calculate active points (starters only)
  const activePoints = rosterMembersInMatch
    .filter(m => m.role === "starter")
    .reduce((sum, m) => sum + m.pointsThisMatch, 0);

  // Get match status display
  const getStatusDisplay = (): { text: string; className: string } => {
    switch (match.status.short) {
      case "NS":
        return { text: "Upcoming", className: styles.matchStatusUpcoming };
      case "1H":
      case "2H":
      case "ET":
      case "HT":
      case "P":
        return { text: `⏱ ${match.status.elapsed}'`, className: styles.matchStatusLive };
      case "FT":
      case "AET":
      case "PEN":
        return { text: "Finished", className: styles.matchStatusFinished };
      default:
        return { text: match.status.long, className: styles.matchStatusDefault };
    }
  };

  const statusDisplay = getStatusDisplay();

  // Separate squads and players, and sort players by role
  const squads = rosterMembersInMatch.filter(m => m.type === "squad");
  const starterPlayers = rosterMembersInMatch.filter(m => m.type === "player" && m.role === "starter") as Array<RosterPlayer & { pointsThisMatch: number }>;
  const inactivePlayers = rosterMembersInMatch.filter(m => m.type === "player" && m.role !== "starter") as Array<RosterPlayer & { pointsThisMatch: number }>;

  // Filter events for this match (only relevant ones)
  const matchEvents = match.events
    .filter(event => {
      // Only show events from roster members
      return rosterMembersInMatch.some(m => {
        if (m.type === "player") {
          return m.id === event.player.playerId;
        }
        return false; // squad events not directly tracked yet
      });
    })
    .sort((a, b) => a.time.elapsed - b.time.elapsed);

  const handleMemberClick = (member: RosterMember) => {
    onMemberClick?.(member);
  };

  return (
    <div className={styles.matchCard}>
      {/* Header: Match overview */}
      <div className={styles.matchCardHeader}>
        <div className={styles.matchCardTeams}>
          <div className={styles.matchCardTeam}>
            <span className={styles.matchCardTeamName}>{countryToFifa(match.homeTeam.countryCode)}</span>
          </div>
          <div className={styles.matchCardScore}>
            <span className={styles.matchCardScoreValue}>{match.score.fulltime.home ?? "-"}</span>
            <span className={styles.matchCardScoreSeparator}>:</span>
            <span className={styles.matchCardScoreValue}>{match.score.fulltime.away ?? "-"}</span>
          </div>
          <div className={styles.matchCardTeam}>
            <span className={styles.matchCardTeamName}>{countryToFifa(match.awayTeam.countryCode)}</span>
          </div>
        </div>
        <div className={styles.matchCardStatus}>
          <span className={`${styles.matchCardStatusBadge} ${statusDisplay.className}`}>
            {statusDisplay.text}
          </span>
        </div>
      </div>

      {/* Roster Impact Section */}
      {rosterMembersInMatch.length > 0 && (
        <div className={styles.matchCardImpact}>
          <div className={styles.matchCardImpactHeader}>
            <span className={styles.matchCardImpactLabel}>Your Roster Impact</span>
            <span className={`${styles.matchCardImpactScore} ${activePoints > 0 ? styles.matchCardImpactScorePositive : activePoints < 0 ? styles.matchCardImpactScoreNegative : ""}`}>
              {activePoints > 0 ? "+" : ""}{activePoints}
            </span>
          </div>

          <div className={styles.matchCardImpactTable}>
            {/* Squads Section */}
            {squads.map(member => (
              <div
                key={`${member.type}-${member.id}`}
                className={`${styles.matchCardImpactRow} ${styles.matchCardImpactRowSquad}`}
                onClick={() => handleMemberClick(member)}
                role="button"
                tabIndex={0}
              >
                <div className={styles.matchCardImpactMember}>
                  <span className={styles.matchCardImpactName}>{member.name}</span>
                  <span className={styles.matchCardImpactStatus}>
                    SQUAD
                  </span>
                </div>
                <span className={`${styles.matchCardImpactPoints} ${member.pointsThisMatch > 0 ? styles.matchCardImpactPointsPositive : member.pointsThisMatch < 0 ? styles.matchCardImpactPointsNegative : ""}`}>
                  {member.pointsThisMatch > 0 ? "+" : ""}{member.pointsThisMatch}
                </span>
              </div>
            ))}

            {/* Starter Players Section */}
            {starterPlayers.map(member => (
              <div
                key={`${member.type}-${member.id}`}
                className={`${styles.matchCardImpactRow} ${styles.matchCardImpactRowStarter}`}
                onClick={() => handleMemberClick(member)}
                role="button"
                tabIndex={0}
                style={{
                  "--primary-color": '#fff',
                  "--secondary-color": '#fff',
                } as React.CSSProperties}
              >
                <div className={styles.matchCardImpactMember}>
                  <div className={styles.matchCardImpactPlayerLabel}>
                    <div className={styles.matchCardImpactPlayerName}>
                      <span className={styles.matchCardImpactNumber}>#{member.number}</span>
                      <span className={styles.matchCardImpactName}>{member.name}</span>
                    </div>
                    <div className={styles.matchCardImpactBadgeGroup}>
                      <div className={styles.matchCardImpactFlagBadge}>
                        <span className={styles.matchCardImpactFlag}>{member.flag}</span>
                      </div>
                      <div className={styles.matchCardImpactPositionBadge}>
                        <span className={styles.matchCardImpactPosition}>
                          {member.position}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <span className={`${styles.matchCardImpactPoints} ${member.pointsThisMatch > 0 ? styles.matchCardImpactPointsPositive : member.pointsThisMatch < 0 ? styles.matchCardImpactPointsNegative : ""}`}>
                  {member.pointsThisMatch > 0 ? "+" : ""}{member.pointsThisMatch}
                </span>
              </div>
            ))}

            {/* Inactive Players Section */}
            {inactivePlayers.map(member => (
              <div
                key={`${member.type}-${member.id}`}
                className={`${styles.matchCardImpactRow} ${styles.matchCardImpactRowInactive}`}
                onClick={() => handleMemberClick(member)}
                role="button"
                tabIndex={0}
              >
                <div className={styles.matchCardImpactMember}>
                  <div className={styles.matchCardImpactPlayerLabel}>
                    <div className={styles.matchCardImpactPlayerName}>
                      <span className={styles.matchCardImpactNumber}>#{member.number}</span>
                      <span className={styles.matchCardImpactName}>{member.name}</span>
                    </div>
                    <div className={styles.matchCardImpactBadgeGroup}>
                      <div className={styles.matchCardImpactFlagBadge}>
                        <span className={styles.matchCardImpactFlag}>{member.flag}</span>
                      </div>
                      <div className={styles.matchCardImpactPositionBadge}>
                        <span className={styles.matchCardImpactPosition}>
                          {member.position}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <span className={`${styles.matchCardImpactPoints} ${member.pointsThisMatch > 0 ? styles.matchCardImpactPointsPositive : member.pointsThisMatch < 0 ? styles.matchCardImpactPointsNegative : ""}`}>
                  {member.pointsThisMatch > 0 ? "+" : ""}{member.pointsThisMatch}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Ticker */}
      {matchEvents.length > 0 && (
        <div className={styles.matchCardTicker}>
          <span className={styles.matchCardTickerLabel}>Match Events</span>
          <div className={styles.matchCardTickerEvents}>
            {matchEvents.map((event, idx) => {
              const minute = event.time.extra ? `${event.time.elapsed}+${event.time.extra}` : event.time.elapsed;
              let eventEmoji = "⚽";
              let eventText = "";

              if (event.type === "Goal") {
                eventEmoji = "⚽";
                eventText = `${event.player.name} ${event.detail.includes("Penalty") ? "(P)" : ""}`;
              } else if (event.type === "Card") {
                eventEmoji = event.detail === "Yellow Card" ? "🟨" : "🔴";
                eventText = event.player.name;
              } else if (event.type === "subst") {
                eventEmoji = "🔄";
                eventText = `${event.player.name} → ${event.assist.name}`;
              } else if (event.type === "Var") {
                eventEmoji = "📹";
                eventText = event.detail;
              }

              return (
                <div key={idx} className={styles.matchCardTickerEvent}>
                  <span className={styles.matchCardTickerMinute}>{minute}'</span>
                  <span className={styles.matchCardTickerEmoji}>{eventEmoji}</span>
                  <span className={styles.matchCardTickerText}>{eventText}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};