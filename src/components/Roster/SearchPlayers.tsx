import React from "react";
import styles from "./SearchPlayers.module.scss";

interface SearchPlayersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

/**
 * SearchPlayers Component
 * Text input to search players by name, country code, or number.
 * Matches letters in order (e.g., "CS" matches Christian Pulisic).
 */
export const SearchPlayers: React.FC<SearchPlayersProps> = ({
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className={styles.searchPlayers}>
      <div className={styles.inputWrapper}>
        <input
          id="search-input"
          type="text"
          className={styles.input}
          placeholder="Name, Country, #"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value.toUpperCase())}
          aria-label="Search players by name, country code, or number"
        />
        <svg className={styles.icon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>
    </div>
  );
};
