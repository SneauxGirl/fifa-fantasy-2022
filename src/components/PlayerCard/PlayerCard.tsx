// src/components/PlayerCard/PlayerCard.tsx
import React from "react";
import type { Player } from "../../types/player";
import type { RosterPlayer, RosterSquad } from "../../types/match";
import { useAppSelector } from "../../store";
import { selectSignedSquads } from "../../store/selectors/rosterSelectors";
import { positionToFifa } from "../../lib/formatMapping";
import { getTeamColors } from "../../lib/teamColors";
import styles from "./PlayerCard.module.scss";

//ADD Name, number, and style. Photos??? Replace with Insight?? Go through this whole thing top to bottom. #TODO

interface PlayerCardProps {
  player: Player | RosterPlayer;
  fantasyStatus: "available" | "starter" | "bench" | "eliminated";
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, fantasyStatus }) => {
  const signedSquads = useAppSelector(selectSignedSquads);

  const isRosterPlayer = (p: Player | RosterPlayer): p is RosterPlayer => "type" in p && p.type === "player";

  const playerName = !isRosterPlayer(player) ? `${player.firstName} ${player.lastName}` : player.name;
  const position = player.position;
  const fifaPosition = positionToFifa(position);
  const countryCode = !isRosterPlayer(player) ? player.countryCode : player.countryCode;
  const club = !isRosterPlayer(player) ? player.club : "—";
  const tournamentPerformance = !isRosterPlayer(player) ? player.tournamentPerformance : undefined;
  const isMvp = !isRosterPlayer(player) ? player.isMvp : false;

  // Find conflicts with signed squads in opponent teams
  const squadConflicts = React.useMemo(() => {
    if (!isRosterPlayer(player)) return [];

    const rosterPlayer = player as RosterPlayer;
    if (!rosterPlayer.playerGames) return [];

    const upcomingGames = rosterPlayer.playerGames.filter((game) => !game.isComplete);
    const conflictSquads: RosterSquad[] = [];

    upcomingGames.forEach((game) => {
      // Determine opponent
      const opponent = game.homeTeam === rosterPlayer.countryCode ? game.awayTeam : game.homeTeam;

      // Find signed squads from opponent team
      const squadsFromOpponent = signedSquads.filter(
        (squad: RosterSquad) => squad.countryCode === opponent && squad.pool !== "eliminated"
      );

      conflictSquads.push(...squadsFromOpponent);
    });

    // Remove duplicates
    return Array.from(new Map(conflictSquads.map((s: RosterSquad) => [s.teamId, s])).values());
  }, [player, signedSquads]);

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
        {isRosterPlayer(player) && squadConflicts.length > 0 && (
          <div className={styles.playerCardSideSection}>
            <div className={styles.squadConflicts}>
              <span className={styles.conflictsLabel} aria-label="Squad Conflicts">⚠️ Squad Conflicts</span>
              <div className={styles.conflictsList}>
                {squadConflicts.map((squad) => (
                  <div key={squad.teamId} className={styles.conflictItem}>
                    <span className={styles.squadFlag}>{squad.flag}</span>
                    <span className={styles.squadName}>{squad.name}</span>
                  </div>
                ))}
              </div>
              <p className={styles.conflictsNote}>
                These squads face {countryCode} in upcoming matches
              </p>
            </div>
          </div>
        )}

        {isRosterPlayer(player) && squadConflicts.length === 0 && (
          <div className={styles.playerCardSideSection}>
            <div className={styles.noConflicts}>
              <span className={styles.noConflictsLabel} aria-label="Roster Conflicts">⚠️ Roster Conflicts</span>
              <p className={styles.noConflictsNote}>None of your signed squads oppose this player's team</p>
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
