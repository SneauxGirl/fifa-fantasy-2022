import { BracketView } from "../components/FutureMatches/BracketView";
import { BracketDropdown } from "../components/FutureMatches/BracketDropdown";
import { PageRosterSidebar } from "../components/Shared/PageRosterSidebar";
import styles from "./FutureMatches.module.scss";
import appLayoutStyles from "../layouts/AppLayout.module.scss";

/**
 * Match Play Page
 * Tournament brackets
 * Groups, knockout stages
 */

const FutureMatches = () => {

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
