import React from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../../store";
import {
  selectSignedSquads,
  selectStarterPlayers,
  selectBenchPlayers,
  selectEliminatedSignedSquads,
  selectEliminatedSignedPlayers,
} from "../../store/selectors/rosterSelectors";
import { formatPlayerInitialLastName } from "../../lib/dataTransform";
import styles from "./PageRosterSidebar.module.scss";

/**
 * PageRosterSidebar Component
 * Shows current roster in simple labeled list format
 * Used on Dashboard and Future Matches pages
 */
export const PageRosterSidebar: React.FC = () => {
  const signedSquads = useAppSelector(selectSignedSquads);
  const starters = useAppSelector(selectStarterPlayers);
  const bench = useAppSelector(selectBenchPlayers);
  const eliminatedSquads = useAppSelector(selectEliminatedSignedSquads);
  const eliminatedPlayers = useAppSelector(selectEliminatedSignedPlayers);

  const hasSignedRoster = signedSquads.length > 0 || starters.length > 0 || bench.length > 0;

  return (
    <aside className={styles.rosterSidebar} aria-label="Current roster">
      <h3 className={styles.title}>
        <Link to="/roster" aria-label="Go to Roster">ROSTER</Link>
      </h3>

      {!hasSignedRoster && (
        <div className={styles.emptyState}>
          You have not signed anyone to your roster yet.
        </div>
      )}

      {/* Squads */}
      <div className={styles.section}>
        {signedSquads.map((squad) => (
          <div key={squad.teamId} className={styles.item}>
            <span className={styles.flag}>{squad.flag}</span>
            <span className={styles.squadName}>{squad.name}</span>
          </div>
        ))}
      </div>

      {/* Starters */}
      {starters.length > 0 && (
        <div className={styles.section}>
          {starters.map((player) => (
            <div key={player.playerId} className={styles.playerName} title={player.name}>
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
            <div key={player.playerId} className={styles.playerNameBench} title={player.name}>
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
              <span className={styles.flag}>{squad.flag}</span>
              <span className={styles.name}>{squad.name}</span>
              <span className={styles.badge}>(eliminated)</span>
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
