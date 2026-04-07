// src/components/SquadCard/SquadCard.tsx
import React from "react";
import type { Squad } from "../../types/squad";
import type { RosterSquad, RosterPlayer } from "../../types/match";
import { useAppSelector } from "../../store";
import { selectAllPlayers } from "../../store/selectors/rosterSelectors";
import { getTeamColors } from "../../lib/teamColors";
import styles from "./SquadCard.module.scss";

interface SquadCardProps {
  team: Squad | RosterSquad;
  fantasyStatus: "active" | "substitute" | "eliminated";
}

export const SquadCard: React.FC<SquadCardProps> = ({ team, fantasyStatus }) => {
  const rosterPlayers = useAppSelector(selectAllPlayers) as RosterPlayer[];

  const isRosterSquad = (t: Squad | RosterSquad): t is RosterSquad =>
    "type" in t && t.type === "squad";

  // Extract data conditionally based on team type
  const name = team.name;
  const countryCode = isRosterSquad(team) ? team.countryCode : (team as Squad).code;
  const flag = team.flag;
  const coaches = isRosterSquad(team) ? team.coaches : undefined;
  const tournamentPerformance = !isRosterSquad(team) ? (team as Squad).tournamentPerformance : undefined;

  // Find conflicts with roster players in upcoming games
  const conflicts = React.useMemo(() => {
    if (!isRosterSquad(team)) return [];

    const rosterTeam = team as RosterSquad;
    if (!rosterTeam.squadGames) return [];

    const upcomingGames = rosterTeam.squadGames.filter((game) => !game.isComplete);
    const conflictPlayers: RosterPlayer[] = [];

    upcomingGames.forEach((game) => {
      // Determine opponent
      const opponent = game.homeTeam === rosterTeam.countryCode ? game.awayTeam : game.homeTeam;

      // Find roster players from opponent team
      const playersFromOpponent = rosterPlayers.filter(
        (player: RosterPlayer) => player.countryCode === opponent && player.pool !== "eliminated"
      );

      conflictPlayers.push(...playersFromOpponent);
    });

    // Remove duplicates
    return Array.from(new Map(conflictPlayers.map((p: RosterPlayer) => [p.playerId, p])).values());
  }, [team, rosterPlayers]);

  // Get team colors from APItoFIFAmaps.json via utility function
  const colors = getTeamColors(countryCode);
  console.log("SquadCard - countryCode:", countryCode, "colors:", colors);
  const countryColorVars = {
    "--team-primary-color": colors.primary,
    "--team-secondary-color": colors.secondary,
    "--team-alt-color": colors.alt,
    "--team-text-color": colors.text,
  } as React.CSSProperties;

  const badgeClass =
    fantasyStatus === "active"     ? styles.squadCardBadgeActive     :
    fantasyStatus === "substitute" ? styles.squadCardBadgeSubstitute :
    styles.squadCardBadgeEliminated;

  return (
    <div
      className={styles.squadCard}
      style={countryColorVars}
    >
      {/* Header */}
      <div className={styles.squadCardHeader}>
        <div className={styles.squadCardHeaderMeta}>
          <div className={styles.squadCardHeaderLeft}>
            <span className={styles.squadCardFlagBadge}>{flag}</span>
            <span className={styles.squadCardName}>{name}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className={styles.squadCardBody}>
        <div className={styles.squadCardMeta}>
          <span className={`${styles.squadCardBadge} ${badgeClass}`}>
            {fantasyStatus}
          </span>
        </div>

        {/* Coaches */}
        {coaches && coaches.length > 0 && (
          <div className={styles.squadCardCoaches}>
            {coaches.map((coach) => (
              <div key={coach.name} className={styles.squadCardCoach}>
                <span className={styles.coachRole}>{coach.role}</span>
                <span className={styles.coachName}>{coach.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tournament stats */}
        {tournamentPerformance ? (
          <div className={styles.squadCardStatsSection}>
            <span className={styles.squadCardStatsLabel}>Tournament Stats</span>
            <div className={styles.squadCardStatsGrid}>
              <div className={styles.squadCardStatBox}>
                <span className={styles.squadCardStatBoxValue}>{tournamentPerformance.goalsFor}</span>
                <span className={styles.squadCardStatBoxLabel}>Goals For</span>
              </div>
              <div className={styles.squadCardStatBox}>
                <span className={styles.squadCardStatBoxValue}>{tournamentPerformance.goalsAgainst}</span>
                <span className={styles.squadCardStatBoxLabel}>Goals Against</span>
              </div>
              <div className={styles.squadCardStatBox}>
                <span className={styles.squadCardStatBoxValue}>{tournamentPerformance.cleanSheets}</span>
                <span className={styles.squadCardStatBoxLabel}>Clean Sheets</span>
              </div>
              <div className={styles.squadCardStatBox}>
                <span className={styles.squadCardStatBoxValue}>🟨 {tournamentPerformance.yellowCards} / 🔴 {tournamentPerformance.redCards}</span>
                <span className={styles.squadCardStatBoxLabel}>Cards</span>
              </div>
              <div className={styles.squadCardStatBox}>
                <span className={styles.squadCardStatBoxValue}>{tournamentPerformance.penaltiesScored}/{tournamentPerformance.penaltiesMissed}</span>
                <span className={styles.squadCardStatBoxLabel}>Penalties</span>
              </div>
              <div className={styles.squadCardStatBox}>
                <span className={styles.squadCardStatBoxValue}>{tournamentPerformance.shootoutGoals}/{tournamentPerformance.shootoutMisses}</span>
                <span className={styles.squadCardStatBoxLabel}>Shootout</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Player Conflicts in Upcoming Games */}
        {isRosterSquad(team) && conflicts.length > 0 && (
          <div className={styles.squadCardConflicts}>
            <span className={styles.conflictsLabel} aria-label="Roster Conflicts">⚠️ Roster Conflicts</span>
            <div className={styles.conflictsList}>
              {conflicts.map((player) => (
                <div key={player.playerId} className={styles.conflictItem}>
                  <span className={styles.playerFlag}>{player.flag}</span>
                  <span className={styles.playerName}>{player.name}</span>
                </div>
              ))}
            </div>
            <p className={styles.conflictsNote}>
              These players face {name} in upcoming matches
            </p>
          </div>
        )}

        {isRosterSquad(team) && conflicts.length === 0 && (
          <div className={styles.squadCardNoConflicts}>
            <span className={styles.noConflictsLabel} aria-label="Roster Conflicts">⚠️ Roster Conflicts</span>
            <p className={styles.noConflictsNote}>This area will show match conflicts with signed Squads and Players</p>
          </div>
        )}
      </div>
    </div>
  );
};
