import type { EcfVec3, EciVec3 } from "satellite.js";

export interface EciState {
  posEci: EciVec3<number>;
  velEci: EciVec3<number>;
}

export interface EcefState {
  posEcf: EcfVec3<number>;
  velEcf: EcfVec3<number>;
}

export interface SatelliteState extends EciState, EcefState {
  time: string;
  timeMs: number;
  noradID: string | null;
  name: string;
  lon: number;
  lat: number;
  altm: number;
  altKm: number;
  headingDeg: number;
}
