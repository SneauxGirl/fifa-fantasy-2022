import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { TopNav, MidNav, BottomNav, DataSourceToggle } from "../components/Navigation";
import { Header } from "../components/Shared/Header";
import { SummaryTicker } from "../components/Dashboard/SummaryTicker";
import { MatchCardModal, PlayerCardModal, SquadCardModal, SquadSigningModal, PlayerSigningModal } from "../components/Modals";
import { useAppDispatch, useAppSelector } from "../store";
import { setTeamName } from "../store/slices/uiSlice";
import styles from "./AppLayout.module.scss";

/**
 * Main application layout wrapper
 * TopNav (FIFA links, always) + MidNav (app nav, all pages) + Page Content + Bottom Nav
 */
const AppLayout = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const teamName = useAppSelector((state) => state.ui.teamName);

  const isDashboard = location.pathname === "/" || location.pathname === "/dashboard";
  const isRoster = location.pathname === "/roster";

  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(teamName);

  const handleSaveTeamName = () => {
    if (inputValue.trim()) {
      dispatch(setTeamName(inputValue.trim()));
      setIsEditing(false);
    }
  };

  const handleEditClick = () => {
    setInputValue(teamName);
    setIsEditing(true);
  };

  const getHeaderTitle = () => {
    
    if (isRoster) {
      return undefined; // Roster uses getRosterHeaderContent instead
    }
    return undefined;
  };

  const getRosterHeaderContent = () => {
    if (!isRoster) return undefined;

    if (isEditing || !teamName) {
      return (
        <div className={styles.teamNameForm}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveTeamName();
              if (e.key === "Escape") setIsEditing(false);
            }}
            type="text"
            placeholder="Name Your Team"
            aria-label="Team name input"
            className={styles.teamNameInput}
            autoFocus={isEditing}
          />
          <button
            type="button"
            onClick={handleSaveTeamName}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                handleSaveTeamName();
              }
            }}
            aria-label="Confirm team name"
            className={styles.teamNameConfirmBtn}
          >
            Confirm
          </button>
        </div>
      );
    }

    // Team name is set, show clickable title
    return (
      <button
        type="button"
        onClick={handleEditClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleEditClick();
          }
        }}
        style={{
          background: "none",
          border: "none",
          margin: 0,
          padding: "8px",
          cursor: "pointer",
          fontSize: "1.5rem",
          fontWeight: 400,
          color: "inherit",
          fontFamily: "inherit",
          outline: "2px solid transparent",
          outlineOffset: "2px",
          transition: "outline-color 0.2s",
        }}
        onFocus={(e) => {
          e.currentTarget.style.outlineColor = "#000000";
        }}
        onBlur={(e) => {
          e.currentTarget.style.outlineColor = "transparent";
        }}
      >
        {teamName}
      </button>
    );
  };

  return (
    <div className={styles.appLayout}>
      {/* Data Source Indicator (Phase 3) */}
      <div style={{ padding: "8px 16px", borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
        <DataSourceToggle />
      </div>

      {/* FIFA Links Navigation (always visible) */}
      <TopNav />

      {/* App Navigation (all pages) */}
      <MidNav />

      {/* Page Header (with optional ticker on Schedule page) */}
      <Header
        title={getHeaderTitle()}
        ticker={isDashboard ? <SummaryTicker /> : undefined}
      >
        {getRosterHeaderContent()}
      </Header>

      {/* Main Content Area */}
      <main>
        <Outlet />
      </main>

      {/* Bottom Navigation (mobile only) */}
      <BottomNav />

      {/* Modal Dialogs */}
      <MatchCardModal />
      <PlayerCardModal />
      <SquadCardModal />
      <SquadSigningModal />
      <PlayerSigningModal />
    </div>
  );
};

export default AppLayout;
