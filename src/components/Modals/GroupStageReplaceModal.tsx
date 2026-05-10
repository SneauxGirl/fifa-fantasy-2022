import React, { useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  closeGroupStageReplacePrompt,
} from "../../store/slices/uiSlice";
import { movePlayerToAvailable, moveSquadToAvailable } from "../../store/slices/rosterSlice";
import { selectIsRosterLocked } from "../../store/selectors/scoringSelectors";
import { Modal } from "./Modal";
import styles from "./GroupStageReplaceModal.module.scss";

/**
 * Confirms optional release of a squad/player flagged after GS2 (two group losses).
 */
export const GroupStageReplaceModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const prompt = useAppSelector((s) => s.ui.groupStageReplacePrompt);
  const isRosterLocked = useAppSelector(selectIsRosterLocked);
  const yesRef = useRef<HTMLButtonElement>(null);

  const handleClose = () => {
    dispatch(closeGroupStageReplacePrompt());
  };

  const handleConfirm = () => {
    if (!prompt || isRosterLocked) return;
    if (prompt.type === "squad") {
      dispatch(moveSquadToAvailable(prompt.squad));
    } else {
      dispatch(movePlayerToAvailable(prompt.player));
    }
    dispatch(closeGroupStageReplacePrompt());
  };

  if (!prompt) return null;

  const isSquad = prompt.type === "squad";
  const memberLabel = isSquad ? "Squad" : "Player";
  const flag = isSquad ? prompt.squad.flag : prompt.player.flag;
  const memberName = isSquad ? prompt.squad.name : prompt.player.name;

  return (
    <Modal
      isOpen
      onClose={handleClose}
      initialFocusRef={yesRef}
      dialogLabelId="group-replace-heading"
    >
      <div className={styles.body}>
        <div id="group-replace-heading" className={styles.subject}>
          <span className={styles.subjectFlag} aria-hidden="true">
            {flag}
          </span>
          <p className={styles.subjectText}>
            {memberLabel}: {memberName}
          </p>
        </div>
        <p className={styles.message} id="group-replace-desc">
          This {isSquad ? "squad" : "player"} cannot advance to the Round of 16 (two losses in the
          first two group rounds). Would you like to replace them and free the roster slot?
        </p>
        <div className={styles.actions}>
          <button
            ref={yesRef}
            type="button"
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={isRosterLocked}
            aria-describedby="group-replace-desc"
          >
            Yes, replace
          </button>
          <button type="button" className={styles.cancelBtn} onClick={handleClose}>
            Cancel
          </button>
        </div>
        {isRosterLocked && (
          <p className={styles.lockedNote}>Roster is locked — replacements are disabled.</p>
        )}
      </div>
    </Modal>
  );
};
