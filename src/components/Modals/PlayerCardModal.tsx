import React from "react";
import type { RosterPlayer } from "../../types/match";
import { useAppDispatch, useAppSelector } from "../../store";
import { closeModal } from "../../store/slices/uiSlice";
import {
  selectStarterPlayers,
  selectBenchPlayers,
  selectEliminatedSignedPlayers,
  selectActiveAvailablePlayers,
} from "../../store/selectors/rosterSelectors";
import { getTeamColors } from "../../lib/teamColors";
import { Modal } from "./Modal";
import { PlayerCard } from "../PlayerCard";

export const PlayerCardModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const modal = useAppSelector((state) => state.ui.modal);
  const isOpen = modal.type === "player";

  // Get the selected player from the modal state
  const selectedPlayer = modal.selectedCard as RosterPlayer | undefined;

  // Get roster state for determining fantasy status
  const starters = useAppSelector(selectStarterPlayers);
  const bench = useAppSelector(selectBenchPlayers);
  const eliminatedSigned = useAppSelector(selectEliminatedSignedPlayers);
  const availablePlayers = useAppSelector(selectActiveAvailablePlayers);

  // Determine fantasy status of the selected player
  const fantasyStatus: "available" | "starter" | "bench" | "eliminated" = React.useMemo(() => {
    if (!selectedPlayer) return "available";

    if (starters.some((p) => p.playerId === selectedPlayer.playerId)) {
      return "starter";
    }
    if (bench.some((p) => p.playerId === selectedPlayer.playerId)) {
      return "bench";
    }
    if (eliminatedSigned.some((p) => p.playerId === selectedPlayer.playerId)) {
      return "eliminated";
    }
    if (availablePlayers.some((p) => p.playerId === selectedPlayer.playerId)) {
      return "available";
    }
    return "available"; // Default to available
  }, [selectedPlayer, starters, bench, eliminatedSigned, availablePlayers]);

  const handleClose = () => {
    dispatch(closeModal());
  };

  if (!selectedPlayer) {
    return null;
  }

  // Get team colors and pass to modal
  const colors = getTeamColors(selectedPlayer.countryCode);
  const modalStyle = {
    "--team-primary-color": colors.primary,
    "--team-secondary-color": colors.secondary,
    "--team-alt-color": colors.alt,
    "--team-text-color": colors.text,
  } as React.CSSProperties;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} style={modalStyle}>
      <PlayerCard player={selectedPlayer} fantasyStatus={fantasyStatus} />
    </Modal>
  );
};
