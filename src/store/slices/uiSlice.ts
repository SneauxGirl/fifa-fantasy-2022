import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Match, RosterSquad, RosterPlayer } from "../../types/match";

export type ModalCard = Match | RosterPlayer | RosterSquad;

export interface UIState {
  modal: {
    type: "match" | "player" | "squad" | "squadSigning" | "playerSigning" | null;
    selectedCard: ModalCard | null;
  };
  sidebar: {
    open: boolean;
  };
  eliminationNotification: {
    isOpen: boolean;
    squads: RosterSquad[];
    players: RosterPlayer[];
  };
  isRosterLocked: boolean;
  teamName: string;
}

const initialState: UIState = {
  modal: {
    type: null,
    selectedCard: null,
  },
  sidebar: {
    open: false,
  },
  eliminationNotification: {
    isOpen: false,
    squads: [],
    players: [],
  },
  isRosterLocked: false,
  teamName: "",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openMatchModal: (state, action: PayloadAction<ModalCard>) => {
      state.modal.type = "match";
      state.modal.selectedCard = action.payload;
    },

    openPlayerModal: (state, action: PayloadAction<ModalCard>) => {
      state.modal.type = "player";
      state.modal.selectedCard = action.payload;
    },

    openSquadModal: (state, action: PayloadAction<ModalCard>) => {
      state.modal.type = "squad";
      state.modal.selectedCard = action.payload;
    },

    openSquadSigningModal: (state, action: PayloadAction<ModalCard>) => {
      state.modal.type = "squadSigning";
      state.modal.selectedCard = action.payload;
    },

    openPlayerSigningModal: (state, action: PayloadAction<ModalCard>) => {
      state.modal.type = "playerSigning";
      state.modal.selectedCard = action.payload;
    },

    closeModal: (state) => {
      state.modal.type = null;
      state.modal.selectedCard = null;
    },

    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebar.open = action.payload;
    },

    toggleSidebar: (state) => {
      state.sidebar.open = !state.sidebar.open;
    },

    setEliminationNotification: (
      state,
      action: PayloadAction<{
        isOpen: boolean;
        squads: RosterSquad[];
        players: RosterPlayer[];
      }>
    ) => {
      state.eliminationNotification = action.payload;
    },

    clearEliminationNotification: (state) => {
      state.eliminationNotification = {
        isOpen: false,
        squads: [],
        players: [],
      };
    },

    setRosterLocked: (state, action: PayloadAction<boolean>) => {
      state.isRosterLocked = action.payload;
    },

    setTeamName: (state, action: PayloadAction<string>) => {
      state.teamName = action.payload;
    },
  },
});

export const {
  openMatchModal,
  openPlayerModal,
  openSquadModal,
  openSquadSigningModal,
  openPlayerSigningModal,
  closeModal,
  setSidebarOpen,
  toggleSidebar,
  setEliminationNotification,
  clearEliminationNotification,
  setRosterLocked,
  setTeamName,
} = uiSlice.actions;

export default uiSlice.reducer;
