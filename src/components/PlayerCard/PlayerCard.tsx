// src/components/PlayerCard/PlayerCard.tsx
import React from "react";
import type { Player } from "../../types/player";
import type { RosterPlayer, RosterSquad } from "../../types/match";
import { useAppSelector } from "../../store";
import { selectSignedSquads, selectSignedPlayers } from "../../store/selectors/rosterSelectors";
import { selectBracketResolvedMatches } from "../../store/selectors/scoringSelectors";
import { positionToFifa } from "../../lib/formatMapping";
import { getTeamColors } from "../../lib/teamColors";
import {
  describeRosterConflictNote,
  rosterConflictsForPlayerView,
} from "../../lib/rosterConflicts";
import type { TurnId } from "../../lib/turnSimulation";
import styles from "./PlayerCard.module.scss";

//ADD Name, number, and style. Photos??? Replace with Insight?? Go through this whole thing top to bottom. #TODO

interface PlayerCardProps {
  player: Player | RosterPlayer;
  fantasyStatus: "available" | "starter" | "bench" | "eliminated";
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, fantasyStatus }) => {
  const signedSquads = useAppSelector(selectSignedSquads);
  const signedPlayers = useAppSelector(selectSignedPlayers);
  const nationTeams = useAppSelector((state) => state.nationTeams.teams);
  const allMatches = useAppSelector(selectBracketResolvedMatches);
  const currentTurnId = useAppSelector(
    (state) => (state.matches.turnSimulation?.currentTurnId ?? null) as TurnId | null
  );

  const isRosterPlayer = (p: Player | RosterPlayer): p is RosterPlayer => "type" in p && p.type === "player";

  const playerName = !isRosterPlayer(player) ? `${player.firstName} ${player.lastName}` : player.name;
  const position = player.position;
  const fifaPosition = positionToFifa(position);
  const countryCode = !isRosterPlayer(player) ? player.countryCode : player.countryCode;
  const club = !isRosterPlayer(player) ? player.club : "—";
  const tournamentPerformance = !isRosterPlayer(player) ? player.tournamentPerformance : undefined;
  const isMvp = !isRosterPlayer(player) ? player.isMvp : false;

  // Conflicts with signed squads/players (same group + current-turn H2H)
  const conflictBuckets = React.useMemo(() => {
    if (!isRosterPlayer(player)) {
      return {
        conflictingSquads: [] as RosterSquad[],
        conflictingPlayers: [] as RosterPlayer[],
        hasSameGroupOverlap: false,
        hasThisTurnFixtureOverlap: false,
      };
    }
    return rosterConflictsForPlayerView(
      player,
      signedSquads,
      signedPlayers,
      nationTeams,
      allMatches,
      currentTurnId
    );
  }, [player, signedSquads, signedPlayers, nationTeams, allMatches, currentTurnId]);

  const hasConflicts =
    conflictBuckets.conflictingSquads.length > 0 || conflictBuckets.conflictingPlayers.length > 0;

  const conflictsNote = describeRosterConflictNote(
    countryCode,
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

  // Tournament performance data (empty array before tournament starts)
  const performanceData = tournamentPerformance ?? [];
  const matchCount = performanceData.length;

  // Aggregate stats
  const totalGoals         = performanceData.reduce((sum, s) => sum + s.goals, 0);
  const totalAssists       = performanceData.reduce((sum, s) => sum + s.assists, 0);
  const totalYellowCards   = performanceData.reduce((sum, s) => sum + s.yellowCards, 0);
  const totalRedCards      = performanceData.reduce((sum, s) => sum + s.redCards, 0);
  const totalShootoutGoals = performanceData.reduce((sum, s) => sum + (s.shootoutGoals ?? 0), 0);
  const totalShootoutMisses = performanceData.reduce((sum, s) => sum + (s.shootoutMisses ?? 0), 0);
  const totalShootoutSaves = performanceData.reduce((sum, s) => sum + (s.shootoutSaves ?? 0), 0);
  const totalSaves         = performanceData.reduce((sum, s) => sum + (s.saves ?? 0), 0);
  const totalCleanSheets   = performanceData.filter(s => s.cleanSheet === true).length;

  // Shootout display (made/opportunities)
  const shootoutOpportunities = totalShootoutGoals + totalShootoutMisses;
  const isGk = fifaPosition === "GK";
  const isDefensive = fifaPosition === "GK" || fifaPosition === "DEF";

  const badgeClass =
    fantasyStatus === "starter"   ? styles.playerCardBadgeStarter   :
    fantasyStatus === "eliminated" ? styles.playerCardBadgeEliminated :
    fantasyStatus === "available"  ? styles.playerCardBadgeAvailable  :
    styles.playerCardBadge;

  return (
    <div
      className={styles.playerCard}
      style={countryColorVars}
    >
      {/* Header */}
      <div className={styles.playerCardHeader}>
        <h1 className={styles.playerCardPlayerName}>{isRosterPlayer(player) ? (player as RosterPlayer).number : ""} {playerName}</h1>
        <div className={styles.playerCardHeaderMeta}>
            <span className={styles.playerCardFlag}>{isRosterPlayer(player) ? (player as RosterPlayer).flag : ""}</span>
            <span className={styles.playerCardPositionLabel}>{fifaPosition}</span>
            <span className={styles.playerCardDivider}>|</span>
            <span className={styles.playerCardCountryCode}>{countryCode}</span>
        </div>
        {isMvp && (
          <span className={styles.playerCardMvpTrophy} aria-label="MVP">🏆</span>
        )}
      </div>

      {/* Roster Conflicts + Body — stacked on mobile, side-by-side at tablet+ */}
      <div className={styles.playerCardLayout}>
        {/* Squad Conflicts Section (replaces photo) */}
        {isRosterPlayer(player) && hasConflicts && (
          <div className={styles.playerCardSideSection}>
            <div className={styles.squadConflicts}>
              <span className={styles.conflictsLabel} aria-label="Roster Conflicts">
                ⚠️ Roster Conflicts
              </span>
              {conflictBuckets.conflictingSquads.length > 0 && (
                <>
                  <span className={styles.conflictsSubheading}>Signed squads</span>
                  <div className={styles.conflictsList}>
                    {conflictBuckets.conflictingSquads.map((squad) => (
                      <div key={squad.teamId} className={styles.conflictItem}>
                        <span className={styles.squadFlag}>{squad.flag}</span>
                        <span className={styles.squadName}>{squad.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {conflictBuckets.conflictingPlayers.length > 0 && (
                <>
                  <span className={styles.conflictsSubheading}>Signed players</span>
                  <div className={styles.conflictsList}>
                    {conflictBuckets.conflictingPlayers.map((p) => (
                      <div key={String(p.playerId)} className={styles.conflictItem}>
                        <span className={styles.squadFlag}>{p.flag}</span>
                        <span className={styles.squadName}>{p.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <p className={styles.conflictsNote}>{conflictsNote}</p>
            </div>
          </div>
        )}

        {isRosterPlayer(player) && !hasConflicts && (
          <div className={styles.playerCardSideSection}>
            <div className={styles.noConflicts}>
              <span className={styles.noConflictsLabel} aria-label="Roster Conflicts">
                ⚠️ Roster Conflicts
              </span>
              <p className={styles.noConflictsNote}>
                No overlap with your signed squads and players (same World Cup group or current-turn
                fixture).
              </p>
            </div>
          </div>
        )}

        <div className={styles.playerCardBody}>
          <div className={styles.playerCardMeta}>
            <span className={`${styles.playerCardBadge} ${badgeClass}`}>
              {fantasyStatus}
            </span>
          </div>

          {/* Club info */}
          <div className={styles.playerCardClub}>{club}</div>

          <span className={styles.playerCardStatsLabel}>
            Last {matchCount} Matches
          </span>

          {/* Primary stats row */}
          <div className={styles.playerCardStatsRow}>
            <div className={styles.playerCardStatItem}>
              <span className={styles.playerCardStatValue}>{totalGoals}</span>
              <span className={styles.playerCardStatUnit}>g</span>
            </div>
            <div className={styles.playerCardStatItem}>
              <span className={styles.playerCardStatValue}>{totalAssists}</span>
              <span className={styles.playerCardStatUnit}>a</span>
            </div>
          </div>

          {/* Secondary stats row: cards, shootout, position-specific */}
          <div className={styles.playerCardStatsRow}>
            <div className={styles.playerCardStatItem}>
              <span className={styles.playerCardStatValue}>🟨 {totalYellowCards}</span>
              <span className={styles.playerCardStatUnit}>yc</span>
            </div>
            <div className={styles.playerCardStatItem}>
              <span className={styles.playerCardStatValue}>🔴 {totalRedCards}</span>
              <span className={styles.playerCardStatUnit}>rc</span>
            </div>
            <div className={styles.playerCardStatItem}>
              <span className={styles.playerCardStatValue}>{isGk ? totalShootoutSaves : totalShootoutGoals}/{shootoutOpportunities || "-"}</span>
              <span className={styles.playerCardStatUnit}>{isGk ? "so" : "so"}</span>
            </div>
            {isDefensive && (
              <div className={styles.playerCardStatItem}>
                <span className={styles.playerCardStatValue}>{isGk ? totalSaves : totalCleanSheets}</span>
                <span className={styles.playerCardStatUnit}>{isGk ? "sv" : "cs"}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
