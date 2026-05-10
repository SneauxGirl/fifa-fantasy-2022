import type { Match } from "../types/match";

const STORAGE_KEY = "ff22-schedule-v1";

function idSignature(matches: Match[]): string {
  return [...matches]
    .map((m) => m.id)
    .sort((a, b) => a - b)
    .join(",");
}

/**
 * Persist the merged tournament schedule (same shape as `matchesSlice.allMatches`).
 * Updated after each successful `playTurn` so reload restores played progress.
 */
export function persistScheduleMatches(matches: Match[]): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
  } catch {
    // best-effort only
  }
}

/**
 * Replace bundled/API defaults with the last persisted schedule when fixture ids align.
 */
export function loadPersistedScheduleOrDefault(defaultMatches: Match[]): Match[] {
  if (typeof window === "undefined" || !window.localStorage) return defaultMatches;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultMatches;

    const parsed = JSON.parse(raw) as Match[];
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultMatches;

    if (parsed.length !== defaultMatches.length) return defaultMatches;
    if (idSignature(parsed) !== idSignature(defaultMatches)) return defaultMatches;

    return parsed;
  } catch {
    return defaultMatches;
  }
}

/** Clear persisted schedule (full tournament restart). */
export function clearPersistedSchedule(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
