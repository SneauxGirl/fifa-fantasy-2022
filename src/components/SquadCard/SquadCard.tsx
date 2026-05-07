// src/components/SquadCard/SquadCard.tsx
import React from "react";
import type { Squad } from "../../types/squad";
import type { RosterSquad, RosterPlayer } from "../../types/match";
import { useAppSelector } from "../../store";
import { selectSignedPlayers, selectSignedSquads } from "../../store/selectors/rosterSelectors";
import { getTeamColors } from "../../lib/teamColors";
import {
  describeRosterConflictNote,
  rosterConflictsForSquadView,
} from "../../lib/rosterConflicts";
import type { TurnId } from "../../lib/turnSimulation";
import styles from "./SquadCard.module.scss";

interface SquadCardProps {
  team: Squad | RosterSquad;
  fantasyStatus: "active" | "substitute" | "eliminated";
}

export const SquadCard: React.FC<SquadCardProps> = ({ team, fantasyStatus }) => {
  const signedPlayers = useAppSelector(selectSignedPlayers);
  const signedSquads = useAppSelector(selectSignedSquads);
  const nationTeams = useAppSelector((state) => state.nationTeams.teams);
  const allMatches = useAppSelector((state) => state.matches.allMatches);
  const currentTurnId = useAppSelector(
    (state) => (state.matches.turnSimulation?.currentTurnId ?? null) as TurnId | null
  );

  const isRosterSquad = (t: Squad | RosterSquad): t is RosterSquad =>
    "type" in t && t.type === "squad";

  // Extract data conditionally based on team type
  const name = team.name;
  const countryCode = isRosterSquad(team) ? team.countryCode : (team as Squad).code;
  const flag = team.flag;
  const coaches = isRosterSquad(team) ? team.coaches : undefined;
  const tournamentPerformance = !isRosterSquad(team) ? (team as Squad).tournamentPerformance : undefined;

  const conflictBuckets = React.useMemo(() => {
    if (!isRosterSquad(team)) {
      return {
        conflictingSquads: [] as RosterSquad[],
        conflictingPlayers: [] as RosterPlayer[],
        hasSameGroupOverlap: false,
        hasThisTurnFixtureOverlap: false,
      };
    }
    return rosterConflictsForSquadView(
      team,
      signedSquads,
      signedPlayers,
      nationTeams,
      allMatches,
      currentTurnId
    );
  }, [team, signedSquads, signedPlayers, nationTeams, allMatches, currentTurnId]);

  const hasConflicts =
    conflictBuckets.conflictingSquads.length > 0 || conflictBuckets.conflictingPlayers.length > 0;

  const conflictsNote = describeRosterConflictNote(
    name,
    conflictBuckets.hasSameGroupOverlap,
    conflictBuckets.hasThisTurnFixtureOverlap
  );

  // Get team colors from APItoFIFAmaps.json via utility function
  const colors = getTeamColors(countryCode);
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

        {isRosterSquad(team) && hasConflicts && (
          <div className={styles.squadCardConflicts}>
            <span className={styles.conflictsLabel} aria-label="Roster Conflicts">
              ⚠️ Roster Conflicts
            </span>
            {conflictBuckets.conflictingSquads.length > 0 && (
              <>
                <span className={styles.conflictsSubheading}>Signed squads</span>
                <div className={styles.conflictsList}>
                  {conflictBuckets.conflictingSquads.map((squad) => (
                    <div key={squad.teamId} className={styles.conflictItem}>
                      <span className={styles.playerFlag}>{squad.flag}</span>
                      <span className={styles.playerName}>{squad.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {conflictBuckets.conflictingPlayers.length > 0 && (
              <>
                <span className={styles.conflictsSubheading}>Signed players</span>
                <div className={styles.conflictsList}>
                  {conflictBuckets.conflictingPlayers.map((player) => (
                    <div key={String(player.playerId)} className={styles.conflictItem}>
                      <span className={styles.playerFlag}>{player.flag}</span>
                      <span className={styles.playerName}>{player.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            <p className={styles.conflictsNote}>{conflictsNote}</p>
          </div>
        )}

        {isRosterSquad(team) && !hasConflicts && (
          <div className={styles.squadCardNoConflicts}>
            <span className={styles.noConflictsLabel} aria-label="Roster Conflicts">
              ⚠️ Roster Conflicts
            </span>
            <p className={styles.noConflictsNote}>
              No overlap with your signed squads and players (same World Cup group or current-turn
              fixture).
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
