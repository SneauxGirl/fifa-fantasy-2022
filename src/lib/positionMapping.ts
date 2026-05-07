import type { Position, PositionShort } from "../types/player";

const POSITION_TO_SHORT: Record<Position, PositionShort> = {
  Goalkeeper: "GK",
  Defender: "DEF",
  Midfielder: "MID",
  Attacker: "FWD",
};

const SHORT_TO_POSITION: Record<PositionShort, Position> = {
  GK: "Goalkeeper",
  DEF: "Defender",
  MID: "Midfielder",
  FWD: "Attacker",
};

export function toPositionShort(position: Position): PositionShort {
  return POSITION_TO_SHORT[position];
}

export function toPositionLong(position: PositionShort): Position {
  return SHORT_TO_POSITION[position];
}
