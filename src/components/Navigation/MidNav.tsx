import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./MidNav.module.scss";

/**
 * Middle Navigation Bar (App Navigation)
 * - Logo/branding (left)
 * - Navigation links (center, desktop only)
 * - Hamburger menu (mobile only)
 * - Black background, white text (always)
 */
const MidNav = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className={styles.midNav} aria-label="Main navigation">
      <div className={styles.navContainer}>
        {/* Left side: Hamburger + Logo */}
        <div className={styles.midNavLeft}>
          {/* Hamburger Menu (mobile only) */}
          <button
            type="button"
            className={`${styles.hamburger} ${mobileMenuOpen ? styles.active : ""}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setMobileMenuOpen(!mobileMenuOpen);
              }
            }}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
          </button>

          {/* Logo / Branding -Consider linking 2022 to main icon that currently takes you "Home" #TODO */} 
          <Link to="/" className={styles.logo} aria-label="Home">
            <img src="/fifa2026-wht.svg" alt="FIFA 2026" className={styles.logoImg} />
          </Link>
        </div>

        {/* Right side: Navigation Links + Tournament Selector (hidden on mobile) */}
        <div className={styles.midNavRight}>
          <div className={styles.navLinks}>
            <Link
              to="/roster"
              className={`${styles.navLink} ${isActive("/roster") ? styles.active : ""}`}
            >
              Roster
            </Link>
            <Link
              to="/future-matches"
              className={`${styles.navLink} ${isActive("/future-matches") ? styles.active : ""}`}
            >
              Match Play
            </Link>
            <Link
              to="/schedule"
              className={`${styles.navLink} ${isActive("/schedule") ? styles.active : ""}`}
            >
              Schedule
            </Link>
            <Link
              to="/rules"
              className={`${styles.navLink} ${isActive("/rules") ? styles.active : ""}`}
            >
              Rules
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu Sidebar */}
      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <div className={styles.mobileMenuHeader}>
            <img src="/fifa2026-wht.svg" alt="FIFA 2022" className={styles.mobileLogoImg} />
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setMobileMenuOpen(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                }
              }}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
          <nav className={styles.mobileLinks}>
            <Link
              to="/roster"
              className={`${styles.mobileLink} ${isActive("/roster") ? styles.active : ""}`}
              onClick={handleNavClick}
            >
              Roster
            </Link>
            <Link
              to="/future-matches"
              className={`${styles.mobileLink} ${isActive("/future-matches") ? styles.active : ""}`}
              onClick={handleNavClick}
            >
              Match Play
            </Link>
            <Link
              to="/schedule"
              className={`${styles.mobileLink} ${isActive("/schedule") ? styles.active : ""}`}
              onClick={handleNavClick}
            >
              Schedule
            </Link>
            <Link
              to="/rules"
              className={`${styles.mobileLink} ${isActive("/rules") ? styles.active : ""}`}
              onClick={handleNavClick}
            >
              Rules
            </Link>
          </nav>
        </div>
      )}
    </nav>
  );
};

export default MidNav;
