import { useState } from "react";
import { useAppSelector } from "../store";
import { selectRosterCounts } from "../store/selectors/rosterSelectors";
import { AvailableSquadsList } from "../components/Roster/AvailableSquadsList";
import { SquadsSection } from "../components/Roster/SquadsSection";
import { PositionFilter } from "../components/Roster/PositionFilter";
import { SearchPlayers } from "../components/Roster/SearchPlayers";
import { AvailablePlayersList } from "../components/Roster/AvailablePlayersList";
import { RosterDragZone } from "../components/Roster/RosterDragZone";
import { StartersLineup } from "../components/Roster/StartersLineup";
import { RosterSidebar } from "../components/Roster/RosterSidebar";
import { EliminationNotificationModal } from "../components/Modals/EliminationNotificationModal";
import styles from "./Roster.module.scss";
import appLayoutStyles from "../layouts/AppLayout.module.scss";

type PositionType = "GK" | "DEF" | "MID" | "FWD" | "ALL";
type TabType = "roster" | "starters";

/**
 * Roster Page
 * Player/squad selection and management
 * Position filters, drag & drop starters/bench, validation rules
 * Tablet/mobile: tab-based interface for Select Roster vs Select Starters
 * Desktop: no tabs, traditional layout
 */

const Roster = () => {
  const [selectedPosition, setSelectedPosition] = useState<PositionType>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabType>("roster");
  const rosterCounts = useAppSelector(selectRosterCounts);

  return (
    <>
      {/* Tabs (tablet/mobile only) */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "roster" ? styles.active : ""}`}
          onClick={() => setActiveTab("roster")}
        >
          Select Roster
        </button>
        <button
          className={`${styles.tab} ${activeTab === "starters" ? styles.active : ""}`}
          onClick={() => setActiveTab("starters")}
        >
          Select Starters
        </button>
      </div>

      {/* Content + Sidebars */}
      <div className={appLayoutStyles.pageLayout} data-active-tab={activeTab}>
        {/* Main Content - Squad/Player Selection */}
        <div className={styles.mainContent}>
          {/* Select Squads Section */}
          <section className={styles.section} aria-labelledby="select-squads-heading">
            <h2 id="select-squads-heading">Select Squads</h2>
            <div className={styles.selectSquadsStack}>
              <AvailableSquadsList />
              <SquadsSection />
            </div>
          </section>

          {/* Player Selection Section (same outline pattern as Select Squads: h2 + h3 subsections) */}
          <section className={styles.section}>
            <h2>Add Players</h2>
            <div className={styles.filterRow}>
              <PositionFilter
                selectedPosition={selectedPosition}
                onPositionChange={setSelectedPosition}
              />
              <SearchPlayers
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>
            <div className={styles.selectPlayersStack}>
              <AvailablePlayersList selectedPosition={selectedPosition} searchQuery={searchQuery} />
              <div className={styles.playersPendingInner}>
                <div className={styles.playersPendingHeadingBlock}>
                  <h3 className={styles.subsectionHeading} id="pending-players-contracts-heading">
                    Pending Contracts - Players
                  </h3>
                  <p className={styles.pendingContractsPlayersMeta} id="pending-players-contracts-meta">
                    ({rosterCounts.signedPlayers}/{rosterCounts.rosterCapacity} confirmed, including{" "}
                    {rosterCounts.rosterGK}/{rosterCounts.rosterGKCapacity} GK)
                  </p>
                </div>
                <div
                  className={styles.playersPendingBenchRegion}
                  role="region"
                  aria-labelledby="pending-players-contracts-heading"
                  aria-describedby="pending-players-contracts-meta"
                >
                  <RosterDragZone />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Sidebars */}
        <div className={appLayoutStyles.rightSidebar} data-active-tab={activeTab}>
          {/* StartersLineup */}
          <div className={styles.startersColumn}>
            <StartersLineup />
          </div>

          {/* RosterSidebar */}
          <div className={styles.rosterColumn}>
            <RosterSidebar />
          </div>
        </div>
      </div>

      {/* Elimination Notification Modal */}
      <EliminationNotificationModal />
    </>
  );
};

export default Roster;
