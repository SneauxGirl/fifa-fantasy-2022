/**
 * Data Source Toggle
 * Allows switching between mock and live API data
 * Visible indicator of current data source
 */

import { Link } from "react-router-dom";
import { useDataSource } from "../../hooks/useDataSource";
import styles from "./DataSourceToggle.module.scss";

export function DataSourceToggle() {
  const { mode, label, apiAvailable, toggle } = useDataSource();

  return (
    <div className={styles.container}>
      <div className={styles.status}>
        <span className={styles.label}>Data Source:</span>
        <span className={`${styles.badge} ${styles[mode]}`}>
          {label}
          {!apiAvailable && mode === "live" && " (API key missing)"}
        </span>
      </div>

      <button
        type="button"
        className={styles.toggleButton}
        onClick={toggle}
        disabled={!apiAvailable}
        aria-label={`Switch data source (currently using ${label})`}
        title={
          apiAvailable
            ? `Click to switch to ${mode === "mock" ? "Live API" : "Mock Data"}`
            : "API key not configured. Set VITE_API_FOOTBALL_KEY in .env to enable live API."
        }
      >
        {apiAvailable ? (
          <>
            <span className={styles.icon}>⚡</span>
            Switch to {mode === "mock" ? "Live API" : "Mock Data"}
          </>
        ) : (
          <>
            <span className={styles.icon}>⚠️</span>
            Configure API Key
          </>
        )}
      </button>

      <Link to="/demo" className={styles.demoLink} title="View color palettes demo">
        Colors Demo
      </Link>
    </div>
  );
}
