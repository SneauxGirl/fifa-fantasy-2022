import React from "react";
import type { Match, Roster, RosterSquad, RosterPlayer } from "../../types/match";
import { MatchCard } from "../MatchCard";
import { useAppDispatch, useAppSelector } from "../../store";
import { closeModal, openSquadModal, openPlayerModal } from "../../store/slices/uiSlice";
import { selectMatchRoster } from "../../store/selectors/scoringSelectors";
import { selectStarterSquads, selectStarterPlayers } from "../../store/selectors/rosterSelectors";
import { positionToFifa } from "../../lib/formatMapping";
import { Modal } from "./Modal";
import styles from "./MatchCardModal.module.scss";

export const MatchCardModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const modal = useAppSelector((state) => state.ui.modal);
  const isOpen = modal.type === "match";

  // Get the selected match from the modal state
  const selectedMatch = modal.selectedCard as Match | undefined;

  // Get current roster and starters from Redux
  const roster = useAppSelector(selectMatchRoster);
  const starterSquads = useAppSelector(selectStarterSquads);
  const starterPlayers = useAppSelector(selectStarterPlayers);

  const handleClose = () => {
    dispatch(closeModal());
  };

  const handleSquadClick = (squad: RosterSquad) => {
    dispatch(openSquadModal(squad));
  };

  const handlePlayerClick = (player: RosterPlayer) => {
    dispatch(openPlayerModal(player));
  };

  if (!selectedMatch || !selectedMatch.homeTeam?.countryCode || !selectedMatch.awayTeam?.countryCode) {
    return null;
  }

  // Filter starters involved in this match (by country code)
  const involvedSquads = starterSquads.filter(
    (squad) =>
      squad.countryCode === selectedMatch.homeTeam.countryCode ||
      squad.countryCode === selectedMatch.awayTeam.countryCode
  );

  const involvedPlayers = starterPlayers.filter(
    (player) =>
      player.countryCode === selectedMatch.homeTeam.countryCode ||
      player.countryCode === selectedMatch.awayTeam.countryCode
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className={styles.matchCardModalContent}>
        <div className={styles.matchCardSection}>
          <MatchCard
            match={selectedMatch}
            roster={roster as Roster}
            onMemberClick={(member) => {
              console.log("Member clicked:", member);
            }}
          />
        </div>

        <div className={styles.affectedSection}>
          <h3 className={styles.sectionTitle}>Your Starters in This Match</h3>

          {involvedSquads.length > 0 && (
            <div className={styles.memberGroup}>
              <h4 className={styles.groupTitle}>Squads</h4>
              <div className={styles.memberList}>
                {involvedSquads.map((squad) => (
                  <button
                    key={squad.teamId}
                    className={styles.memberItem}
                    onClick={() => handleSquadClick(squad)}
                    type="button"
                  >
                    <span className={styles.flag}>{squad.flag}</span>
                    <span className={styles.name}>{squad.name}</span>
                    {squad.matchPoints[selectedMatch.id] !== undefined && (
                      <span className={styles.points}>
                        {squad.matchPoints[selectedMatch.id]} pts
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {involvedPlayers.length > 0 && (
            <div className={styles.memberGroup}>
              <h4 className={styles.groupTitle}>Players</h4>
              <div className={styles.memberList}>
                {involvedPlayers.map((player) => (
                  <button
                    key={player.playerId}
                    className={styles.memberItem}
                    onClick={() => handlePlayerClick(player)}
                    type="button"
                  >
                    <span className={styles.flag}>{player.flag}</span>
                    <span className={styles.number}>{player.number}</span>
                    <span className={styles.playerInfo}>
                      <span className={styles.name}>{player.name}</span>
                      <span className={styles.meta}>
                        {positionToFifa(player.position)}
                      </span>
                    </span>
                    {player.matchPoints[selectedMatch.id] !== undefined && (
                      <span className={styles.points}>
                        {player.matchPoints[selectedMatch.id]} pts
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {involvedSquads.length === 0 && involvedPlayers.length === 0 && (
            <p className={styles.emptyState}>
              None of your starters are involved in this match.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};
