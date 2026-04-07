import React from "react";
import { getTeamColors } from "../../lib/teamColors";
import mapsData from "../../data/APItoFIFAmaps.json";
import styles from "./TeamColorDemo.module.scss";

/**
 * Demo Component: Team Color Palette
 * Displays all teams' three colors (primary, secondary, alt) with text colors overlaid
 */
export const TeamColorDemo: React.FC = () => {
  const teamColors = (mapsData as any).teamColors || {};
  const teamCodes = Object.keys(teamColors).sort();

  return (
    <div className={styles.container}>
      <h2>Team Color Palettes</h2>
      <div className={styles.grid}>
        {teamCodes.map((code) => {
          const colors = getTeamColors(code);
          const fifaName = (mapsData as any).countryCodeToFifa?.[code] || code;

          return (
            <div key={code} className={styles.teamCard}>
              <h3>{code}</h3>
              <div className={styles.colorRow}>
                {/* Primary */}
                <div
                  className={styles.colorBox}
                  style={{ backgroundColor: colors.primary }}
                >
                  <span style={{ color: colors.text }}>PRIMARY</span>
                </div>

                {/* Secondary */}
                <div
                  className={styles.colorBox}
                  style={{ backgroundColor: colors.secondary }}
                >
                  <span style={{ color: colors.text }}>SECONDARY</span>
                </div>

                {/* Alt */}
                <div
                  className={styles.colorBox}
                  style={{ backgroundColor: colors.alt }}
                >
                  <span style={{ color: colors.text }}>ALT</span>
                </div>
              </div>
              <div className={styles.textColor}>
                Text: <span style={{ color: colors.text }}>■</span> {colors.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
