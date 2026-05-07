// ==============================
// Scoring Engine — Public API
// ==============================
// Import from here throughout the app. Do not import individual files directly.
// ==============================

export type { RosterStatus, ReplacementType, ScoringEvent } from "./types";

export { applySubstitutionModifier }           from "./applySubstitutionModifier";

export {
  GOAL_POINTS,
  CLEAN_SHEET_POINTS,
  calcGoalPoints,
  calcCleanSheetPoints,
  calcHatTrickBonus,
}                                              from "./calculateMatchPoints";

export { calculatePlayerScore }                from "./calculatePlayerScore";
export { calculateSquadScore }                 from "./calculateSquadScore";
export { calculateTurnScore }                  from "./calculateTurnScore";
export { calculateTieBreaker }                 from "./calculateTieBreaker";

export {
  MAX_GK_IN_ROSTER,
  MAX_GK_STARTERS,
  getReplacementType,
  validateRosterPlayerAdd,
  validateSquadAdd,
  validateStarterSelection,
}                                              from "./rosterRules";
export type { RosterValidationResult }         from "./rosterRules";
