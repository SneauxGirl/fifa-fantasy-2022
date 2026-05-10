import React from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { movePlayerToStarter } from "../../store/slices/rosterSlice";
import { openGroupStageReplacePrompt } from "../../store/slices/uiSlice";
import { selectIsRosterLocked } from "../../store/selectors/scoringSelectors";
import {
  selectRosterBenchPlayers,
  selectEliminatedSignedPlayers,
  selectEliminatedSignedSquads,
} from "../../store/selectors/rosterSelectors";
import { positionToFifa } from "../../lib/formatMapping";
import { formatPlayerInitialLastName } from "../../lib/dataTransform";
import { getTeamColors } from "../../lib/teamColors";
import type { RosterPlayer } from "../../types/match";
import type { PositionShort } from "../../types/player";
import { SoccerBallIcon } from "../Shared/SoccerBallIcon";
import styles from "./RosterSidebar.module.scss";

/**
 * RosterSidebar Component
 * Display bench players and eliminated players
 * Located in right sidebar below starters
 * Bench players are draggable to move to starter formation
 */

// Position order for sorting
const POSITION_ORDER: Record<string, number> = {
  "Goalkeeper": 0,
  "Defender": 1,
  "Midfielder": 2,
  "Attacker": 3,
};

const BENCH_POSITION_BADGE_CLASS: Record<PositionShort, string> = {
  GK: styles.posGk,
  DEF: styles.posDef,
  MID: styles.posMid,
  FWD: styles.posFwd,
};

const sortPlayersByPosition = (players: RosterPlayer[]): RosterPlayer[] => {
  return [...players].sort((a, b) => {
    const orderA = POSITION_ORDER[a.position] ?? 999;
    const orderB = POSITION_ORDER[b.position] ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    // If same position, sort alphabetically by full name
    return a.name.localeCompare(b.name);
  });
};

export const RosterSidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const isRosterLocked = useAppSelector(selectIsRosterLocked);
  const benchPlayers = useAppSelector(selectRosterBenchPlayers);
  const eliminatedPlayers = useAppSelector(selectEliminatedSignedPlayers);
  const eliminatedSquads = useAppSelector(selectEliminatedSignedSquads);

  const sortedBenchPlayers = sortPlayersByPosition(benchPlayers);

  const handleDragStart = (e: React.DragEvent, player: RosterPlayer) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/json", JSON.stringify({
      type: "benchPlayer",
      player: player,
    }));
  };

  const handleMoveToStarter = (player: RosterPlayer) => {
    console.log("Moving to starter:", {
      playerId: player.playerId,
      playerName: player.name,
      pool: player.pool,
      role: player.role,
    });
    dispatch(movePlayerToStarter(player));
  };

  return (
    <div className={styles.rosterSidebar}>
      <h3 className={styles.title}>ROSTER</h3>

      {/* Bench Players */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          Bench ({benchPlayers.length})
        </h4>
        {benchPlayers.length === 0 ? (
          <p className={styles.empty}>No players on bench</p>
        ) : (
          <div className={styles.playersList}>
            {sortedBenchPlayers.map((player) => {
              const isStarter = player.role === "starter";
              const teamColors = getTeamColors(player.countryCode);
              const showReplace =
                Boolean(player.groupStageReplaceable) && !isRosterLocked;
              const benchDisplayName = formatPlayerInitialLastName(player.name);
              const fifaPos = positionToFifa(player.position) as PositionShort;
              const positionBadgeClass = BENCH_POSITION_BADGE_CLASS[fifaPos] ?? "";
              return (
                <div
                  key={player.playerId}
                  className={`${styles.playerRow} ${showReplace ? styles.playerRowReplaceable : ""}`}
                >
                  <button
                    type="button"
                    className={styles.playerItem}
                    draggable
                    onDragStart={(e) => handleDragStart(e, player)}
                    onClick={() => handleMoveToStarter(player)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleMoveToStarter(player);
                      }
                    }}
                    title={
                      isStarter
                        ? `${player.name} - In starters formation`
                        : `${player.name} - Click to move to starter, or drag to formation`
                    }
                    aria-label={
                      isStarter
                        ? `${player.name} (${player.position}) - In starters formation`
                        : `${player.name} (${player.position}) - Click to move to starter formation`
                    }
                    style={
                      {
                        "--team-bg": teamColors.primary,
                        "--team-text": teamColors.text,
                      } as React.CSSProperties
                    }
                  >
                    <span className={styles.playerItemLeading}>
                      <span className={styles.benchFlag} aria-hidden>
                        {player.flag}
                      </span>
                      <span className={styles.playerNumber}>{player.number}</span>
                      <span className={styles.playerName}>
                        {benchDisplayName}
                        {isStarter && (
                          <span className={styles.starterIcon} title="In starters formation">
                            <SoccerBallIcon className={styles.starterBallSvg} />
                          </span>
                        )}
                      </span>
                    </span>
                    <span className={`${styles.playerPosition} ${positionBadgeClass}`.trim()}>{fifaPos}</span>
                  </button>
                  {showReplace && (
                    <button
                      type="button"
                      className={styles.benchReplaceBtn}
                      onClick={() =>
                        dispatch(openGroupStageReplacePrompt({ type: "player", player }))
                      }
                      aria-label={`Optional replacement for ${player.name}`}
                    >
                      Replace?
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Eliminated Squads & Players */}
      {(eliminatedSquads.length > 0 || eliminatedPlayers.length > 0) && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>
            Eliminated ({eliminatedSquads.length + eliminatedPlayers.length})
          </h4>
          <div className={styles.playersList}>
            {/* Eliminated Squads */}
            {eliminatedSquads.map((squad) => (
              <div key={`squad-${squad.id}`} className={`${styles.rosterItem} ${styles.eliminated}`}>
                <span className={styles.flag}>{squad.flag}</span>
                <span className={styles.rosterName}>{squad.name}</span>
                <span className={styles.rosterType}>SQUAD</span>
              </div>
            ))}

            {/* Eliminated Players */}
            {eliminatedPlayers.map((player) => (
              <div key={`player-${player.playerId}`} className={`${styles.rosterItem} ${styles.eliminated}`}>
                <span className={styles.playerName}>
                  {formatPlayerInitialLastName(player.name)}
                </span>
                <span className={styles.playerPosition}>{player.position}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
