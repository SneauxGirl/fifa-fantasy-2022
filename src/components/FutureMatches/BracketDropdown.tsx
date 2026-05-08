import React from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { openMatchModal } from "../../store/slices/uiSlice";
import { selectBracketResolvedMatches, selectMatchesByStage } from "../../store/selectors/scoringSelectors";
import { countryToFifa } from "../../lib/formatMapping";
import styles from "./BracketDropdown.module.scss";

/**
 * BracketDropdown Component
 * Mobile dropdown to select and view tournament matches.
 */
export const BracketDropdown: React.FC = () => {
  const dispatch = useAppDispatch();
  const allMatches = useAppSelector(selectBracketResolvedMatches);
  const groupedMatches = useAppSelector(selectMatchesByStage);

  const handleMatchChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const matchId = parseInt(event.target.value);
    const match = allMatches.find((m) => m.id === matchId);
    if (match) {
      dispatch(openMatchModal(match));
    }
  };

//SHOULD be fine? Confirm logic based on dates and figure out how that plays with match.id. Should be the same functionally? #TODO

  return (
    <div className={styles.bracketDropdown}>
      <label htmlFor="match-select" className={styles.label}>
        Select a Match:
      </label>
      <select
        id="match-select"
        className={styles.select}
        defaultValue=""
        onChange={handleMatchChange}
      >
        <option value="">-- Choose a match --</option>

        {Object.entries(groupedMatches).map(([stageName, matches]) => (
          <optgroup key={stageName} label={stageName}>
            {matches.map((match) => (
              <option key={match.id} value={match.id}>
                {countryToFifa(match.homeTeam.countryCode)} vs {countryToFifa(match.awayTeam.countryCode)} •{" "}
                {new Date(match.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
};
