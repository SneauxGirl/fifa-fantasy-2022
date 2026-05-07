/**
 * Data Source Toggle
 * Displays current data source state
 */

import { Link } from "react-router-dom";
import { useDataSource } from "../../hooks/useDataSource";
import styles from "./DataSourceToggle.module.scss";

export function DataSourceToggle() {
  const { mode, label, apiAvailable } = useDataSource();

  return (
    <div className={styles.container}>
      <div className={styles.status}>
        <span className={styles.label}>Data Source:</span>
        <span className={`${styles.badge} ${styles[mode]}`}>
          {label}
          {!apiAvailable && mode === "live" && " (API key missing)"}
        </span>
      </div>

      <Link to="/demo" className={styles.demoLink} title="View color palettes demo">
        Colors Demo
      </Link>
    </div>
  );
}
