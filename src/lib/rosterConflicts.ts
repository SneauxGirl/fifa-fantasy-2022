/**
 * Roster conflict detection for squad/player detail cards.
 * - Same FIFA group: all other nations in that group conflict (group-stage opponents).
 * - Current turn fixtures: any nation that faces the viewed nation this turn (group or knockout).
 */

import type { Match, NationalTeam, RosterPlayer, RosterSquad } from "../types/match";
import type { TurnId } from "./turnSimulation";
import { buildTurnMatchIds } from "./turnSimulation";

export function sameGroupOpponentCountryCodes(
  viewCountryCode: string,
  nationTeams: NationalTeam[]
): Set<string> {
  const self = nationTeams.find((t) => t.countryCode === viewCountryCode);
  const group = self?.group?.trim();
  if (!group) return new Set();

  return new Set(
    nationTeams
      .filter((t) => t.group?.trim() === group && t.countryCode !== viewCountryCode)
      .map((t) => t.countryCode)
  );
}

export function thisTurnOpponentCountryCodes(
  viewCountryCode: string,
  allMatches: Match[],
  currentTurnId: TurnId | null
): Set<string> {
  if (!currentTurnId) return new Set();

  const turnMatchIds = buildTurnMatchIds(allMatches)[currentTurnId];
  const byId = new Map(allMatches.map((m) => [m.id, m]));
  const out = new Set<string>();

  for (const id of turnMatchIds) {
    const m = byId.get(id);
    if (!m) continue;
    const h = m.homeTeam.countryCode;
    const a = m.awayTeam.countryCode;
    if (h === viewCountryCode) out.add(a);
    else if (a === viewCountryCode) out.add(h);
  }

  return out;
}

/** All nation codes that should conflict with the viewed nation (for signed roster picks). */
export function rosterConflictOpponentCodes(
  viewCountryCode: string,
  nationTeams: NationalTeam[],
  allMatches: Match[],
  currentTurnId: TurnId | null
): Set<string> {
  const out = new Set<string>();
  sameGroupOpponentCountryCodes(viewCountryCode, nationTeams).forEach((c) => out.add(c));
  thisTurnOpponentCountryCodes(viewCountryCode, allMatches, currentTurnId).forEach((c) =>
    out.add(c)
  );
  return out;
}

export interface RosterConflictBuckets {
  conflictingSquads: RosterSquad[];
  conflictingPlayers: RosterPlayer[];
  hasSameGroupOverlap: boolean;
  hasThisTurnFixtureOverlap: boolean;
}

/** Conflicting signed squads/players when viewing a squad card (exclude same nation as the squad). */
export function rosterConflictsForSquadView(
  view: RosterSquad,
  signedSquads: RosterSquad[],
  signedPlayers: RosterPlayer[],
  nationTeams: NationalTeam[],
  allMatches: Match[],
  currentTurnId: TurnId | null
): RosterConflictBuckets {
  const viewCode = view.countryCode;
  const sameGroup = sameGroupOpponentCountryCodes(viewCode, nationTeams);
  const thisTurn = thisTurnOpponentCountryCodes(viewCode, allMatches, currentTurnId);
  const opponentCodes = rosterConflictOpponentCodes(
    viewCode,
    nationTeams,
    allMatches,
    currentTurnId
  );

  const conflictingSquads = signedSquads.filter(
    (s) => s.teamId !== view.teamId && opponentCodes.has(s.countryCode)
  );

  const conflictingPlayers = signedPlayers.filter(
    (p) => p.countryCode !== viewCode && opponentCodes.has(p.countryCode)
  );

  const dedupedPlayers = Array.from(
    new Map(conflictingPlayers.map((p) => [p.playerId, p])).values()
  );

  const hasSameGroupOverlap =
    conflictingSquads.some((s) => sameGroup.has(s.countryCode)) ||
    dedupedPlayers.some((p) => sameGroup.has(p.countryCode));

  const hasThisTurnFixtureOverlap =
    conflictingSquads.some((s) => thisTurn.has(s.countryCode)) ||
    dedupedPlayers.some((p) => thisTurn.has(p.countryCode));

  return {
    conflictingSquads,
    conflictingPlayers: dedupedPlayers,
    hasSameGroupOverlap,
    hasThisTurnFixtureOverlap,
  };
}

/** Conflicting signed squads/players when viewing a player card (exclude same player). */
export function rosterConflictsForPlayerView(
  view: RosterPlayer,
  signedSquads: RosterSquad[],
  signedPlayers: RosterPlayer[],
  nationTeams: NationalTeam[],
  allMatches: Match[],
  currentTurnId: TurnId | null
): RosterConflictBuckets {
  const viewCode = view.countryCode;
  const sameGroup = sameGroupOpponentCountryCodes(viewCode, nationTeams);
  const thisTurn = thisTurnOpponentCountryCodes(viewCode, allMatches, currentTurnId);
  const opponentCodes = rosterConflictOpponentCodes(
    viewCode,
    nationTeams,
    allMatches,
    currentTurnId
  );

  const conflictingSquads = signedSquads.filter((s) => opponentCodes.has(s.countryCode));

  const conflictingPlayers = signedPlayers.filter(
    (p) =>
      p.playerId !== view.playerId &&
      p.countryCode !== viewCode &&
      opponentCodes.has(p.countryCode)
  );

  const dedupedPlayers = Array.from(
    new Map(conflictingPlayers.map((p) => [p.playerId, p])).values()
  );

  const hasSameGroupOverlap =
    conflictingSquads.some((s) => sameGroup.has(s.countryCode)) ||
    dedupedPlayers.some((p) => sameGroup.has(p.countryCode));

  const hasThisTurnFixtureOverlap =
    conflictingSquads.some((s) => thisTurn.has(s.countryCode)) ||
    dedupedPlayers.some((p) => thisTurn.has(p.countryCode));

  return {
    conflictingSquads,
    conflictingPlayers: dedupedPlayers,
    hasSameGroupOverlap,
    hasThisTurnFixtureOverlap,
  };
}

export function describeRosterConflictNote(
  squadOrNationName: string,
  hasSameGroup: boolean,
  hasThisTurn: boolean
): string {
  const reasons: string[] = [];
  if (hasSameGroup) reasons.push("share the same World Cup group");
  if (hasThisTurn) reasons.push("are scheduled against them in the current turn");
  if (reasons.length === 0) {
    return `Signed roster selections may reduce scoring ceiling when ${squadOrNationName} faces them.`;
  }
  return `Signed roster selections conflict because they ${reasons.join(" and ")}.`;
}
