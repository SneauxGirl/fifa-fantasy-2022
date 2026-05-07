import { NavLink } from "react-router-dom";
import styles from "./BottomNav.module.scss";

/**
 * Bottom Navigation Bar
 * Footer-style navigation - visible at all widths
 * Provides navigation links at bottom of page
 */
const BottomNav = () => {
  return (
    <nav className={styles.bottomNav} aria-label="Bottom navigation">
      <div className={styles.navLinks}>
        <NavLink
          to="/"
          className={({ isActive }: { isActive: boolean }) =>
            `${styles.navItem} ${isActive ? styles.active : ""}`
          }
        >
          Schedule
        </NavLink>

        <NavLink
          to="/roster"
          className={({ isActive }: { isActive: boolean }) =>
            `${styles.navItem} ${isActive ? styles.active : ""}`
          }
        >
          Roster
        </NavLink>

        <NavLink
          to="/future-matches"
          className={({ isActive }: { isActive: boolean }) =>
            `${styles.navItem} ${isActive ? styles.active : ""}`
          }
        >
          Match Play
        </NavLink>
      </div>

      <div className={styles.copyright}>
        © 2026 Liyu Development. All rights reserved.
      </div>
    </nav>
  );
};

export default BottomNav;
