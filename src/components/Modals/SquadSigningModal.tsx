import React from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { moveSquadToSigned } from "../../store/slices/rosterSlice";
import { closeModal } from "../../store/slices/uiSlice";
import { selectSignedSquads } from "../../store/selectors/rosterSelectors";
import { countryToFifa } from "../../lib/formatMapping";
import { getTeamColors } from "../../lib/teamColors";
import type { RosterSquad } from "../../types/match";
import { Modal } from "./Modal";
import styles from "./SquadSigningModal.module.scss";

//MAKE IT LESS COMPLICATED, ADD INSIGHTS FOR POINTS OF CONFLICT #TODO
/**
 * SquadSigningModal Component
 * Confirmation dialog for signing a squad to the roster
 * Shows tournament duration reminder and requires user confirmation
 * Max 4 signed squads allowed
 */
export const SquadSigningModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const modal = useAppSelector((state) => state.ui.modal);
  const signedSquads = useAppSelector(selectSignedSquads);
  const isOpen = modal.type === "squadSigning";
  const selectedSquad = modal.selectedCard as RosterSquad | undefined;

  const canSign = signedSquads.length < 4;

  const handleConfirm = () => {
    if (selectedSquad && canSign) {
      // Squads are always signed with role: "starter" (handled in reducer)
      dispatch(moveSquadToSigned(selectedSquad));
      dispatch(closeModal());
    }
  };

  const handleCancel = () => {
    dispatch(closeModal());
  };

  if (!selectedSquad) {
    return null;
  }

  // Get team colors and pass to modal
  const colors = getTeamColors(selectedSquad.countryCode);
  const modalStyle = {
    "--team-primary-color": colors.primary,
    "--team-secondary-color": colors.secondary,
    "--team-alt-color": colors.alt,
    "--team-text-color": colors.text,
  } as React.CSSProperties;

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Confirm Squad Signing" style={modalStyle}>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.flag}>{selectedSquad.flag}</span>
          <h2 className={styles.title}>Confirm Squad Signing</h2>
        </div>

        <div className={styles.content}>
          <p className={styles.squadName}>{selectedSquad.name}</p>

          <div className={styles.reminder}>
            <p className={styles.reminderTitle}>⚠️ Important:</p>
            {!canSign ? (
              <p className={styles.reminderText} style={{ color: "#d32f2f" }}>
                Your roster is full. You already have 4 signed squads. Remove one to sign a new squad.
              </p>
            ) : (
              <p className={styles.reminderText}>
                By signing this squad, you commit to this team for the duration of the tournament.
                You cannot change this selection until the tournament ends.
              </p>
            )}
          </div>

          <div className={styles.details}>
            <div className={styles.detailItem}>
              <span className={styles.label}>Squad Code:</span>
              <span className={styles.value}>{countryToFifa(selectedSquad.countryCode)}</span>
            </div>
            {selectedSquad.coaches && selectedSquad.coaches.length > 0 && (
              <div className={styles.detailItem}>
                <span className={styles.label}>Coach:</span>
                <span className={styles.value}>
                  {selectedSquad.coaches.map((c) => c.name).join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.button} ${styles.cancel}`}
            onClick={handleCancel}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCancel();
              }
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.confirm}`}
            onClick={handleConfirm}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (canSign) {
                  handleConfirm();
                }
              }
            }}
            disabled={!canSign}
          >
            Confirm Signing
          </button>
        </div>
      </div>
    </Modal>
  );
};
