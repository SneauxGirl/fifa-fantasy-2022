import mappings from '../data/APItoFIFAmaps.json';
import type { Position } from "../types/player";
import { toPositionShort } from "./positionMapping";

export function positionToFifa(position: Position) {
  return toPositionShort(position);
}

export function countryToFifa(apiCode: string): string {
  return mappings.countryCodes.apiToFifa[apiCode as keyof typeof mappings.countryCodes.apiToFifa] || apiCode;
}
