import { useState } from "react";
import { BracketView } from "../components/FutureMatches/BracketView";
import { BracketDropdown } from "../components/FutureMatches/BracketDropdown";
import { PageRosterSidebar } from "../components/Shared/PageRosterSidebar";
import { useAppDispatch, useAppSelector, restartMatchPlay } from "../store";
import styles from "./FutureMatches.module.scss";
import appLayoutStyles from "../layouts/AppLayout.module.scss";

const RESTART_CONFIRM_MESSAGE =
  "Restart the game from the beginning? This will reset all components of game play including Roster, points, and any other in-game actions and results to this point. Your team name is kept.";

/**
 * Match Play Page
 * Tournament brackets
 * Groups, knockout stages
 */

const FutureMatches = () => {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.matches.isLoading);
  const [restartPending, setRestartPending] = useState(false);

  const handleRestartGame = async () => {
    if (restartPending || isLoading) return;
    const ok = window.confirm(RESTART_CONFIRM_MESSAGE);
    if (!ok) return;
    setRestartPending(true);
    try {
      await dispatch(restartMatchPlay()).unwrap();
    } finally {
      setRestartPending(false);
    }
  };

  return (
    <>
      {/* Mobile Dropdown (visible only on small screens) */}
      <div className={styles.mobileDropdown}>
        <BracketDropdown />
      </div>

      {/* Bracket + Roster */}
      <div className={appLayoutStyles.pageLayout}>
        {/* Bracket View */}
        <div className={styles.bracketSection}>
          <div className={styles.matchPlayToolbar}>
            <button
              type="button"
              className={styles.restartGameButton}
              onClick={handleRestartGame}
              disabled={isLoading || restartPending}
              aria-label="Restart game from the beginning"
            >
              {restartPending ? "Restarting…" : "Restart game"}
            </button>
          </div>
          <BracketView />
        </div>

        {/* Right Sidebar (Roster) */}
        <div className={appLayoutStyles.rightSidebar}>
          {/* Roster Sidebar */}
          <PageRosterSidebar />
        </div>
      </div>
    </>
  );
};

export default FutureMatches;
