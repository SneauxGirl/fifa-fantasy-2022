import mapsData from "../data/APItoFIFAmaps.json";
import squadsData from "../data/squads.json";
import { countryToFifa } from "./formatMapping";

export interface TeamColors {
  primary: string;
  secondary: string;
  alt: string;
  text: string;
}

/**
 * Get team colors by country code
 * Colors are static data from APItoFIFAmaps.json
 * Used for styling player cards, squad cards, and other UI elements
 *
 * @param countryCode - FIFA code (e.g. "ARG", "NED") or legacy API code (e.g. "NET", "SPA")
 * @returns TeamColors object with primary, secondary, alt, and text colors
 */
export const getTeamColors = (countryCode: string): TeamColors => {
  const fifaCode = countryToFifa(countryCode);
  const colors = (mapsData as { teamColors?: Record<string, TeamColors> }).teamColors?.[
    fifaCode
  ];

  if (colors) {
    return colors;
  }

  // Fallback colors if not found
  return {
    primary: "#888888",
    secondary: "#CCCCCC",
    alt: "#888888",
    text: "#000000",
  };
};

/**
 * Get team flag emoji by country code
 * Looks up the flag from squads.json national team data
 *
 * @param countryCode - Team country code (FIFA or legacy API)
 * @returns Flag emoji string, or empty string if not found
 */
export const getTeamFlag = (countryCode: string): string => {
  const team = (squadsData as { teams?: { countryCode: string; flag?: string }[] }).teams?.find(
    (t) => t.countryCode === countryCode
  );
  return team?.flag || "";
};
