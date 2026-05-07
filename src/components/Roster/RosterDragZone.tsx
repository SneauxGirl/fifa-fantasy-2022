import React, { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  movePlayerToAvailable,
  movePlayerToUnsigned,
} from "../../store/slices/rosterSlice";
import { openPlayerSigningModal, openPlayerModal } from "../../store/slices/uiSlice";
import { selectUnsignedPlayers } from "../../store/selectors/rosterSelectors";
import { selectIsRosterLocked } from "../../store/selectors/scoringSelectors";
import { positionToFifa } from "../../lib/formatMapping";
import { getTeamColors } from "../../lib/teamColors";
import type { RosterPlayer } from "../../types/match";
import type { PositionShort } from "../../types/player";
import styles from "./RosterDragZone.module.scss";

/**
 * RosterDragZone Component
 * Display pending (unsigned) contracts organized by position (GK | DEF | MID | FWD)
 * Unsigned players with Sign/Remove buttons
 */
export const RosterDragZone: React.FC = () => {
  const dispatch = useAppDispatch();
  const isRosterLocked = useAppSelector(selectIsRosterLocked);

  // Get unsigned players (pending contracts)
  const unsignedPlayers = useAppSelector(selectUnsignedPlayers);

  // Organize unsigned players by position, sorted by country then number
  const positionGroups = useMemo(() => {
    const positions: Record<PositionShort, RosterPlayer[]> = {
      GK: [],
      DEF: [],
      MID: [],
      FWD: [],
    };

    unsignedPlayers.forEach((player) => {
      const fifaPosition = positionToFifa(player.position);
      positions[fifaPosition].push(player);
    });

    // Sort each position group by country code, then by number
    Object.keys(positions).forEach((position) => {
      positions[position as PositionShort].sort((a, b) => {
        if (a.countryCode !== b.countryCode) {
          return a.countryCode.localeCompare(b.countryCode);
        }
        return (a.number || 0) - (b.number || 0);
      });
    });

    return positions;
  }, [unsignedPlayers]);

  const handleSignPlayer = (player: RosterPlayer) => {
    if (!isRosterLocked) {
      dispatch(openPlayerSigningModal(player));
    }
  };

  const handleRemovePlayer = (player: RosterPlayer) => {
    if (!isRosterLocked) {
      dispatch(movePlayerToAvailable(player));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragLeave = () => {
    // Drag leave handler
  };

  const handleDrop = () => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (isRosterLocked) return;

    try {
      const data = e.dataTransfer.getData("application/json");
      const payload = JSON.parse(data);

      if (payload.type === "unsigned-player" && payload.player) {
        dispatch(movePlayerToUnsigned(payload.player));
      }
    } catch (err) {
      console.error("Drop handler error:", err);
    }
  };

  return (
    <div className={styles.rosterDragZone}>
      {/* Bench by Position - Four Column Layout */}
      <div className={styles.benchByPosition}>
        {(['GK', 'DEF', 'MID', 'FWD'] as PositionShort[]).map((position) => (
          <div
            key={position}
            className={styles.positionColumn}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop()}
          >
            <h4 className={styles.positionHeader}>
              {position}
              <span className={styles.positionCount}>
                {positionGroups[position].length}
              </span>
            </h4>

            <div className={styles.positionPlayers}>
              {positionGroups[position].length === 0 ? (
                <p className={styles.emptyPosition}>No {position}s</p>
              ) : (
                positionGroups[position].map((player) => (
                  <BenchPlayerCard
                    key={player.playerId}
                    player={player}
                    onSign={() => handleSignPlayer(player)}
                    onRemove={() => handleRemovePlayer(player)}
                    isRosterLocked={isRosterLocked}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * BenchPlayerCard Component
 * Player card in bench showing Sign/Remove for unsigned, or Signed badge for signed
 */
interface BenchPlayerCardProps {
  player: RosterPlayer;
  onSign: () => void;
  onRemove: () => void;
  isRosterLocked: boolean;
}

const BenchPlayerCard: React.FC<BenchPlayerCardProps> = ({ player, onSign, onRemove, isRosterLocked }) => {
  const dispatch = useAppDispatch();
  const firstName = player.name.split(" ")[0];
  const lastName = player.name.split(" ").pop() || player.name;
  const displayName = `${firstName[0]} ${lastName}`;
  const countryCode = player.countryCode;
  const teamColors = getTeamColors(player.countryCode);

  const handlePlayerLabelClick = () => {
    dispatch(openPlayerModal(player));
  };

  const handlePlayerLabelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      dispatch(openPlayerModal(player));
    }
  };

  return (
    <div className={styles.benchPlayerCard}>
      <div
        className={styles.playerInfo}
        onClick={handlePlayerLabelClick}
        onKeyDown={handlePlayerLabelKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`View ${player.name} details`}
      >
        <span className={styles.playerNumber}>{player.number}</span>
        <div className={styles.playerNamebox}>
          <span
            className={styles.countryBadge}
            style={{ "--team-primary-color": teamColors.primary } as React.CSSProperties}
          >
            {countryCode}
          </span>
          <span className={styles.name}>{displayName}</span>
        </div>
      </div>

      <div className={styles.playerActions}>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.signBtn}`}
          onClick={onSign}
          disabled={isRosterLocked}
          aria-label={`Sign ${player.name}${isRosterLocked ? " (roster locked)" : ""}`}
          title={isRosterLocked ? "Roster locked (Quarterfinals+)" : `Sign ${player.name}`}
        >
          Sign
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.removeBtn}`}
          onClick={onRemove}
          disabled={isRosterLocked}
          aria-label={`Remove ${player.name} to available${isRosterLocked ? " (roster locked)" : ""}`}
          title={isRosterLocked ? "Roster locked (Quarterfinals+)" : "Remove to available"}
        >
          ❌
        </button>
      </div>
    </div>
  );
};
