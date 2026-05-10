import React from "react";
import { useAppSelector } from "../../store";
import {
  selectSignedSquads,
  selectStarterPlayers,
  selectBenchPlayers,
  selectEliminatedSignedSquads,
  selectEliminatedSignedPlayers,
} from "../../store/selectors/rosterSelectors";
import { formatPlayerInitialLastName } from "../../lib/dataTransform";
import styles from "./RosterSidebar.module.scss";

/**
 * RosterSidebar Component
 * Shows current roster in simple labeled list format
 * Used on Dashboard and Future Matches pages
 */
export const RosterSidebar: React.FC = () => {
  const signedSquads = useAppSelector(selectSignedSquads);
  const starters = useAppSelector(selectStarterPlayers);
  const bench = useAppSelector(selectBenchPlayers);
  const eliminatedSquads = useAppSelector(selectEliminatedSignedSquads);
  const eliminatedPlayers = useAppSelector(selectEliminatedSignedPlayers);

  return (
    <aside className={styles.rosterSidebar} aria-label="Current roster">
      <h3 className={styles.title}>ROSTER</h3>

      {/* Squads */}
      <div className={styles.section}>
        {signedSquads.map((squad) => (
          <div key={squad.teamId} className={styles.item}>
            {squad.flag} {squad.name}
          </div>
        ))}
      </div>

      {/* Starters */}
      {starters.length > 0 && (
        <div className={styles.section}>
          {starters.map((player) => (
            <div key={player.playerId} className={styles.item} title={player.name}>
              {formatPlayerInitialLastName(player.name)}{" "}
              <span className={styles.badge}>(starter)</span>
            </div>
          ))}
        </div>
      )}

      {/* Bench */}
      {bench.length > 0 && (
        <div className={styles.section}>
          {bench.map((player) => (
            <div key={player.playerId} className={styles.item} title={player.name}>
              {formatPlayerInitialLastName(player.name)}{" "}
              <span className={styles.badge}>(bench)</span>
            </div>
          ))}
        </div>
      )}

      {/* Eliminated */}
      {(eliminatedSquads.length > 0 || eliminatedPlayers.length > 0) && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Eliminated</div>
          {eliminatedSquads.map((squad) => (
            <div key={squad.teamId} className={styles.item}>
              {squad.flag} {squad.name} <span className={styles.badge}>(eliminated)</span>
            </div>
          ))}
          {eliminatedPlayers.map((player) => (
            <div key={player.playerId} className={styles.item} title={player.name}>
              {formatPlayerInitialLastName(player.name)}{" "}
              <span className={styles.badge}>(eliminated)</span>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};
