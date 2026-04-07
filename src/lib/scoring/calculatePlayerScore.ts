// ==============================
// Player Match Score
// Rules ref: docs/rules/rules.md §5
// ==============================

import type { Player, PlayerMatchStats } from "../../types/player";
import type { PlayerScore, PlayerScoreBreakdown } from "../../types/fantasyScore";
import {
  calcGoalPoints,
  calcCleanSheetPoints,
  calcHatTrickBonus,
} from "./calculateMatchPoints";
import { applySubstitutionModifier } from "./applySubstitutionModifier";

/**
 * Calculate a player's fantasy score for a single match.
 *
 * Data contract (enforced by null semantics in PlayerMatchStats):
 *   - `goals`             includes on-field goals; excludes shootout goals
 *   - `saves`             null for outfield players (not applicable)
 *   - `shootoutSaves`     null for outfield players OR if match had no shootout
 *   - `shootoutGoals/Misses` null if match had no shootout
 *
 * @param isSubstitute  true = player was added as SUBSTITUTE at R16; score is halved
 */
export function calculatePlayerScore(
  player:       Player,
  stats:        PlayerMatchStats,
  isSubstitute  = false,
  matchId?:     number
): PlayerScore {
  const { position } = player;

  const goalPoints       = calcGoalPoints(position, stats.goals);
  const assistPoints     = stats.assists * 2;
  const cleanSheetPoints = calcCleanSheetPoints(position, stats.cleanSheet);

  // GK only — null for outfield players (null → 0)
  const savePoints = (stats.saves ?? 0) * 1;

  // Hat trick: goals includes on-field penalties, excludes shootout
  const hatTrickBonus = calcHatTrickBonus(stats.goals);

  // Cards: -3 yellow, -7 red (direct or second yellow); yellow-red = -3 + -7 = -10 total
  const yellowCardPoints = stats.yellowCards * -3;
  const redCardPoints    = stats.redCards    * -7;

  const ownGoalPoints = stats.ownGoals * -3;

  // Shootout fields are null when no shootout occurred (null → 0)
  const shootoutGoalPoints = (stats.shootoutGoals  ?? 0) *  1;
  const shootoutSavePoints = (stats.shootoutSaves  ?? 0) *  2;
  const shootoutMissPoints = (stats.shootoutMisses ?? 0) * -2;

  const breakdown: PlayerScoreBreakdown = {
    goalPoints,
    assistPoints,
    cleanSheetPoints,
    savePoints,
    hatTrickBonus,
    yellowCardPoints,
    redCardPoints,
    ownGoalPoints,
    shootoutGoalPoints,
    shootoutSavePoints,
    shootoutMissPoints,
  };

  const rawTotal =
    goalPoints        +
    assistPoints      +
    cleanSheetPoints  +
    savePoints        +
    hatTrickBonus     +
    yellowCardPoints  +
    redCardPoints     +
    ownGoalPoints     +
    shootoutGoalPoints +
    shootoutSavePoints +
    shootoutMissPoints;

  const totalPoints = applySubstitutionModifier(rawTotal, isSubstitute);

  return { playerId: player.playerId, matchId, totalPoints, isSubstitute, breakdown };
}
