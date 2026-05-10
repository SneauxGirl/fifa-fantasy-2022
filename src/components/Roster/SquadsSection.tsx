import React from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  openGroupStageReplacePrompt,
  openSquadSigningModal,
  openSquadModal,
} from "../../store/slices/uiSlice";
import { moveSquadToUnsigned, moveSquadToAvailable } from "../../store/slices/rosterSlice";
import {
  selectUnsignedSquads,
  selectSignedSquads,
} from "../../store/selectors/rosterSelectors";
import { selectIsRosterLocked } from "../../store/selectors/scoringSelectors";
import type { RosterSquad } from "../../types/match";
import styles from "./SquadsSection.module.scss";

/**
 * SquadsSection Component
 * Displays unsigned and signed squads with coaches.
 * Squads and Players are completely separate - no players shown here.
 * Supports HTML5 drag-and-drop of squads from AvailableSquadsList.
 */
export const SquadsSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const unsignedSquads = useAppSelector(selectUnsignedSquads);
  const signedSquads = useAppSelector(selectSignedSquads);
  const isRosterLocked = useAppSelector(selectIsRosterLocked);
  const [dragOver, setDragOver] = React.useState(false);

  // Combine unsigned and signed for display
  const allSquads = [...unsignedSquads, ...signedSquads];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    try {
      const data = e.dataTransfer.getData("application/json");
      const payload = JSON.parse(data);

      if (payload.type === "squad" && payload.squad && signedSquads.length < 4) {
        dispatch(moveSquadToUnsigned(payload.squad));
      }
    } catch (error) {
      // Silently ignore invalid drops
    }
  };

  const handleRemoveSquad = (squad: RosterSquad) => {
    if (!isRosterLocked) {
      dispatch(moveSquadToAvailable(squad));
    }
  };

  const handleSignUnsignedSquad = (squad: RosterSquad) => {
    if (!isRosterLocked) {
      dispatch(openSquadSigningModal(squad));
    }
  };

  const handleShowSquadCard = (squad: RosterSquad) => {
    dispatch(openSquadModal(squad));
  };

  const handleSquadsListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const horizontalKeys = e.key === "ArrowRight" || e.key === "ArrowLeft";
    const verticalKeys = e.key === "ArrowDown" || e.key === "ArrowUp";
    if (!horizontalKeys && !verticalKeys) return;

    e.preventDefault();

    if (horizontalKeys) {
      const direction = e.key === "ArrowRight" ? 1 : -1;
      e.currentTarget.scrollBy({ left: direction * 180, behavior: "smooth" });
      return;
    }

    const direction = e.key === "ArrowDown" ? 1 : -1;
    e.currentTarget.scrollBy({ top: direction * 160, behavior: "smooth" });
  };

  const shellClassName = `${styles.squadsPendingShell}${dragOver ? ` ${styles.squadsPendingShellDragOver}` : ""}`;

  return (
    <div
      className={styles.squadsSection}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <h3>Pending Contracts - Squads ({signedSquads.length}/4 confirmed)</h3>

      <div className={shellClassName}>
        {allSquads.length === 0 ? (
          <div className={styles.emptyState}>
            <p>
              No Squads selected. Click on Squads above or drag them here to shortlist.
              <br />
              View Insights to see potential conflicts with your current roster.
              <br />
              Select Sign to confirm Squad as a Tournament starter.
            </p>
          </div>
        ) : (
          <div
            className={styles.squadsList}
            tabIndex={0}
            role="region"
            aria-label="Squads list"
            onKeyDown={handleSquadsListKeyDown}
          >
            {allSquads.map((squad) => {
          const isUnsigned = squad.pool === "unsigned";
          const isEliminated = squad.isEliminated;
          const isGroupReplaceable =
            squad.pool === "signed" && squad.groupStageReplaceable && !isEliminated;

          return (
            <div
              key={squad.teamId}
              className={`${styles.squadCard} ${isUnsigned ? styles.unsigned : ""} ${isEliminated ? styles.eliminated : ""} ${isGroupReplaceable ? styles.groupStageReplaceable : ""}`}
            >
              {/* Squad Header */}
              <div className={styles.squadHeader}>
                <div className={styles.squadInfo}>
                  <div className={styles.flagGroup}>
                    <span className={styles.flag}>{squad.flag}</span>
                    {squad.group && <span className={styles.group}>{squad.group}</span>}
                  </div>
                  <div className={styles.nameBlock}>
                    <h4 className={styles.squadName}>{squad.name}</h4>
                    {squad.coaches && squad.coaches.length > 0 && (
                      <p className={styles.coach}>
                        {squad.coaches.map((c) => c.name).join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                {isUnsigned && !isEliminated && (
                  <button
                    type="button"
                    className={styles.insightsButton}
                    onClick={() => handleShowSquadCard(squad)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleShowSquadCard(squad);
                      }
                    }}
                    title={`View ${squad.name} squad details`}
                    aria-label={`View ${squad.name} squad details`}
                  >
                    Insights
                  </button>
                )}

                {isEliminated ? (
                  <div className={styles.eliminatedIcon} title="Squad eliminated from tournament">
                    ✕
                  </div>
                ) : isUnsigned ? (
                  <div className={styles.buttonGroup}>
                    <button
                      type="button"
                      className={`${styles.actionButton} ${styles.sign}`}
                      onClick={() => handleSignUnsignedSquad(squad)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          if (!isRosterLocked) {
                            e.preventDefault();
                            handleSignUnsignedSquad(squad);
                          }
                        }
                      }}
                      disabled={isRosterLocked}
                      title={isRosterLocked ? "Roster locked (Quarterfinals+)" : `Sign ${squad.name} to lock in`}
                      aria-label={`Sign ${squad.name} to lock in for tournament${isRosterLocked ? " (roster locked)" : ""}`}
                    >
                      ✓ Sign
                    </button>
                    <button
                      type="button"
                      className={`${styles.actionButton} ${styles.remove}`}
                      onClick={() => handleRemoveSquad(squad)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          if (!isRosterLocked) {
                            e.preventDefault();
                            handleRemoveSquad(squad);
                          }
                        }
                      }}
                      disabled={isRosterLocked}
                      title={isRosterLocked ? "Roster locked (Quarterfinals+)" : `Remove ${squad.name}`}
                      aria-label={`Remove ${squad.name} from selection${isRosterLocked ? " (roster locked)" : ""}`}
                    >
                      ❌
                    </button>
                  </div>
                ) : (
                  <div className={styles.signedActions}>
                    {isGroupReplaceable && !isRosterLocked && (
                      <button
                        type="button"
                        className={styles.replaceOfferBtn}
                        onClick={() => dispatch(openGroupStageReplacePrompt({ type: "squad", squad }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            dispatch(openGroupStageReplacePrompt({ type: "squad", squad }));
                          }
                        }}
                        aria-label={`Optional replacement for ${squad.name}: cannot advance from group`}
                      >
                        Cannot advance — replace?
                      </button>
                    )}
                    <div className={styles.lockedIcon} title="Squad locked for tournament">
                      🔒
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
