import React, { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { openPlayerModal } from "../../store/slices/uiSlice";
import { movePlayerToUnsigned } from "../../store/slices/rosterSlice";
import {
  selectActiveAvailablePlayers,
  selectEliminatedAvailablePlayers,
} from "../../store/selectors/rosterSelectors";
import { selectIsRosterLocked } from "../../store/selectors/scoringSelectors";
import { positionToFifa } from "../../lib/formatMapping";
import type { RosterPlayer } from "../../types/match";
import styles from "./AvailablePlayersList.module.scss";

type PositionType = "GK" | "DEF" | "MID" | "FWD" | "ALL";

interface AvailablePlayersListProps {
  selectedPosition: PositionType;
  searchQuery?: string;
}

// Helper: Normalize accents for matching (e.g., "André" → "ANDRE")
const normalizeAccents = (str: string): string => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
};

// Helper: Check if letters appear in order in text (e.g., "CS" in "CHRISTIAN SILVA")
const matchesInOrder = (text: string, query: string): boolean => {
  const normalizedText = normalizeAccents(text);
  const normalizedQuery = normalizeAccents(query);

  let queryIndex = 0;
  for (let i = 0; i < normalizedText.length && queryIndex < normalizedQuery.length; i++) {
    if (normalizedText[i] === normalizedQuery[queryIndex]) {
      queryIndex++;
    }
  }
  return queryIndex === normalizedQuery.length;
};

// Helper: Check if player matches search query
// Each space-separated parameter must match within a single field
// e.g., "MJ S" → "MJ" in name, "S" in name/code/number
// e.g., "MJS" → all three in same field (doesn't match Majid + IRN)
const playerMatchesSearch = (player: RosterPlayer, searchQuery: string): boolean => {
  if (!searchQuery) return true;

  const trimmedQuery = searchQuery.trim();
  if (!trimmedQuery) return true;

  // Split query by spaces into individual search parameters
  const searchParams = trimmedQuery.split(/\s+/).filter(p => p.length > 0);

  // Prepare player fields for matching
  const playerName = normalizeAccents(player.name);
  const playerCode = player.countryCode.toUpperCase();
  const playerNumber = String(player.number || "").padStart(2, "0");
  const fields = [playerName, playerCode, playerNumber];

  // Each search parameter must match in at least one field
  return searchParams.every(param => {
    return fields.some(field => matchesInOrder(field, param));
  });
};

/**
 * AvailablePlayersList Component
 * Displays available players (active first, eliminated at bottom), filtered by position and search.
 * Click to view player details or add to roster.
 * Eliminated players are greyed out and disabled.
 *
 * Note: For full display data (firstName, lastName, stats), pass enrichedPlayers.
 * Falls back to RosterPlayer properties if enrichment data not provided.
 */
export const AvailablePlayersList: React.FC<AvailablePlayersListProps> = ({
  selectedPosition,
  searchQuery = "",
}) => {
  const dispatch = useAppDispatch();
  const activeAvailablePlayers = useAppSelector(selectActiveAvailablePlayers);
  const eliminatedAvailablePlayers = useAppSelector(selectEliminatedAvailablePlayers);
  const isRosterLocked = useAppSelector(selectIsRosterLocked);
  const allAvailablePlayers = [...activeAvailablePlayers, ...eliminatedAvailablePlayers];
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTarget, setActiveTarget] = useState<"card" | "insights">("card");
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const insightRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Filter by position and search
  const filteredPlayers = allAvailablePlayers
    .filter((player) => {
      // Apply position filter
      if (selectedPosition !== "ALL") {
        if (positionToFifa(player.position) !== selectedPosition) return false;
      }

      // Apply search filter
      if (!playerMatchesSearch(player, searchQuery)) return false;

      return true;
    })
    .sort((a, b) => {
      // Sort by country code first
      if (a.countryCode !== b.countryCode) {
        return a.countryCode.localeCompare(b.countryCode);
      }
      // Then sort by jersey number
      return (a.number || 0) - (b.number || 0);
    });

  const handleShowPlayerCard = (player: RosterPlayer) => {
    dispatch(openPlayerModal(player));
  };

  const handleMoveToUnsigned = (player: RosterPlayer) => {
    dispatch(movePlayerToUnsigned(player));
  };

  useEffect(() => {
    if (filteredPlayers.length === 0) return;
    if (activeIndex > filteredPlayers.length - 1) {
      setActiveIndex(filteredPlayers.length - 1);
    }
  }, [activeIndex, filteredPlayers.length]);

  const focusActive = (index: number, target: "card" | "insights") => {
    const hasInsights = !filteredPlayers[index]?.isEliminated;
    const nextTarget = target === "insights" && hasInsights ? "insights" : "card";
    const element = nextTarget === "insights" ? insightRefs.current[index] : cardRefs.current[index];
    element?.focus();
  };

  const handlePlayersListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const indexAttr = target.dataset.playerIndex;
    const targetType = target.dataset.focusTarget as "card" | "insights" | undefined;
    if (indexAttr == null || !targetType) return;

    const index = Number(indexAttr);
    if (Number.isNaN(index)) return;
    const player = filteredPlayers[index];
    if (!player) return;

    if ((e.key === "Enter" || e.key === " ") && targetType === "card") {
      e.preventDefault();
      if (!player.isEliminated && !isRosterLocked) {
        handleMoveToUnsigned(player);
      }
      return;
    }

    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (targetType === "card" && !player.isEliminated) {
        setActiveIndex(index);
        setActiveTarget("insights");
        focusActive(index, "insights");
      }
      return;
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (targetType === "insights") {
        setActiveIndex(index);
        setActiveTarget("card");
        focusActive(index, "card");
      }
      return;
    }

    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End") {
      e.preventDefault();

      let nextIndex = index;
      if (e.key === "ArrowDown") nextIndex = Math.min(filteredPlayers.length - 1, index + 1);
      if (e.key === "ArrowUp") nextIndex = Math.max(0, index - 1);
      if (e.key === "Home") nextIndex = 0;
      if (e.key === "End") nextIndex = filteredPlayers.length - 1;

      setActiveIndex(nextIndex);
      setActiveTarget(targetType);
      focusActive(nextIndex, targetType);
    }
  };

  if (filteredPlayers.length === 0) {
    return (
      <div className={styles.availablePlayersList}>
        <div className={styles.emptyState}>
          <p>
            {allAvailablePlayers.length === 0
              ? "All players have been selected."
              : `No ${selectedPosition} players available.`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.availablePlayersList}>
      <div className={styles.header}>
        <p className={styles.count}>
          {filteredPlayers.length} player{filteredPlayers.length !== 1 ? "s" : ""} available
        </p>
      </div>

      <div
        className={styles.playersList}
        tabIndex={0}
        role="region"
        aria-label="Available players list"
        onFocus={(e) => {
          if (e.target === e.currentTarget) {
            focusActive(activeIndex, activeTarget);
          }
        }}
        onKeyDown={handlePlayersListKeyDown}
      >
        {filteredPlayers.map((player, index) => (
          <PlayerListItem
            key={player.playerId}
            player={player}
            onCardClick={() => handleMoveToUnsigned(player)}
            onShowCard={() => handleShowPlayerCard(player)}
            tabIndex={-1}
            insightsTabIndex={-1}
            cardRef={(el) => {
              cardRefs.current[index] = el;
            }}
            insightsRef={(el) => {
              insightRefs.current[index] = el;
            }}
            onCardFocus={() => {
              setActiveIndex(index);
              setActiveTarget("card");
            }}
            onInsightsFocus={() => {
              setActiveIndex(index);
              setActiveTarget("insights");
            }}
            dataIndex={index}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * PlayerListItem Component
 * Single player row with name, position, national team, club.
 *
 * Accepts both RosterPlayer and DisplayPlayer (enriched with stats).
 * Falls back gracefully if enrichment data not available.
 */
interface PlayerListItemProps {
  player: RosterPlayer;
  onCardClick: () => void;
  onShowCard: () => void;
  tabIndex: number;
  insightsTabIndex: number;
  cardRef: (el: HTMLDivElement | null) => void;
  insightsRef: (el: HTMLButtonElement | null) => void;
  onCardFocus: () => void;
  onInsightsFocus: () => void;
  dataIndex: number;
}

const PlayerListItem: React.FC<PlayerListItemProps> = ({
  player,
  onCardClick,
  onShowCard,
  tabIndex,
  insightsTabIndex,
  cardRef,
  insightsRef,
  onCardFocus,
  onInsightsFocus,
  dataIndex,
}) => {
  const isEliminated = player.isEliminated;
  const isRosterLocked = useAppSelector(selectIsRosterLocked);
  const nameParts = player.name.trim().split(/\s+/);
  const firstName = nameParts[0] || player.name;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

  // Insights button styling
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only move to unsigned if clicking on the card itself, not the button
    if ((e.target as HTMLElement).closest(`.${styles.showPlayerCard}`)) {
      return;
    }
    if (!isEliminated && !isRosterLocked) {
      onCardClick();
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (isEliminated || isRosterLocked) {
      e.preventDefault();
      return;
    }
    const data = JSON.stringify({ type: "unsigned-player", player });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/json", data);
  };

  return (
    <div
      className={`${styles.playerCard} ${isEliminated ? styles.eliminated : ""}`}
      role="button"
      tabIndex={tabIndex}
      ref={cardRef}
      data-player-index={dataIndex}
      data-focus-target="card"
      onClick={handleCardClick}
      onDragStart={handleDragStart}
      onFocus={onCardFocus}
      draggable={!isEliminated && !isRosterLocked}
      aria-label={`${player.name} - ${player.position}. Click to add to roster${!isEliminated ? ", or press + button to view details" : ""}`}
      style={{ cursor: isEliminated ? "not-allowed" : isRosterLocked ? "default" : "grab" }}
    >
      <div className={styles.flag}>{player.flag}</div>

      <div className={styles.cardContent}>
        <div className={styles.playerName}>
          <span className={styles.playerNameFirst}>{firstName}</span>
          {lastName && <span className={styles.playerNameLast}>{lastName}</span>}
        </div>
        <div className={styles.playerMetaRow}>
          <div className={styles.playerCode}>{player.countryCode}</div>
          <div className={styles.number}>{player.number || "—"}</div>
          <div className={styles.playerPosition}>{positionToFifa(player.position)}</div>
        </div>
      </div>

      {!isEliminated && (
        <button
          type="button"
          className={styles.showPlayerCard}
          tabIndex={insightsTabIndex}
          ref={insightsRef}
          data-player-index={dataIndex}
          data-focus-target="insights"
          onFocus={onInsightsFocus}
          disabled={isRosterLocked}
          onClick={(e) => {
            e.stopPropagation();
            onShowCard();
          }}
          title={isRosterLocked ? "Roster locked (Quarterfinals+)" : `View ${player.name} details`}
          aria-label={`View ${player.name} details${isRosterLocked ? " (locked during Quarterfinals+)" : ""}`}
        >
          Insights
        </button>
      )}
    </div>
  );
};
