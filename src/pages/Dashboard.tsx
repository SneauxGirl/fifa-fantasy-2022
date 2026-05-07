import { MatchList } from "../components/Dashboard/MatchList";
import { PageRosterSidebar } from "../components/Shared/PageRosterSidebar";
import styles from "./Dashboard.module.scss";
import appLayoutStyles from "../layouts/AppLayout.module.scss";

/**
 * Schedule Page
 * Overview of current/upcoming/past matches
 * Summary stats ticker, match list, roster sidebar
 */

const Dashboard = () => {
  return (
    <>
      {/* Main Content + Right Sidebar */}
      <div className={appLayoutStyles.pageLayout}>
        {/* Match List (left) */}
        <div className={styles.mainColumn}>
          <MatchList />
        </div>

        {/* Right Sidebar - Roster Only */}
        <div className={appLayoutStyles.rightSidebar}>
          <PageRosterSidebar />
        </div>
      </div>
    </>
  );
};

export default Dashboard;
