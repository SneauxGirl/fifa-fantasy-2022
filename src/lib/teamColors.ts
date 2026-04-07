import mapsData from '../data/APItoFIFAmaps.json';
import squadsData from '../data/squads.json';

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
 * @param countryCode - Team country code (standardized FIFA code, e.g., "ARG", "BRA", "ENG", "NET", "JAP", "SER")
 * @returns TeamColors object with primary, secondary, alt, and text colors
 */
export const getTeamColors = (countryCode: string): TeamColors => {
  const colors = (mapsData as any).teamColors?.[countryCode];
  console.log("getTeamColors - looking up:", countryCode, "found:", colors, "allTeamColors keys:", Object.keys((mapsData as any).teamColors || {}));

  if (colors) {
    return colors as TeamColors;
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
 * @param countryCode - Team country code (e.g., "ARG", "BRA", "NET", "JAP", "SER")
 * @returns Flag emoji string, or empty string if not found
 */
export const getTeamFlag = (countryCode: string): string => {
  const team = (squadsData as any).teams?.find(
    (t: any) => t.countryCode === countryCode
  );
  return team?.flag || "";
};
