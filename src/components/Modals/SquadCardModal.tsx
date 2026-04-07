import React from "react";
import type { RosterSquad } from "../../types/match";
import { useAppDispatch, useAppSelector } from "../../store";
import { closeModal } from "../../store/slices/uiSlice";
import { getTeamColors } from "../../lib/teamColors";
import { SquadCard } from "../SquadCard/SquadCard";
import { Modal } from "./Modal";

export const SquadCardModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const modal = useAppSelector((state) => state.ui.modal);
  const isOpen = modal.type === "squad";

  // Get the selected squad from the modal state
  const selectedSquad = modal.selectedCard as RosterSquad | undefined;

  const handleClose = () => {
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
    <Modal isOpen={isOpen} onClose={handleClose} style={modalStyle}>
      <SquadCard
        team={selectedSquad as any}
        fantasyStatus={selectedSquad.isEliminated ? "eliminated" : "active"}
      />
    </Modal>
  );
};
