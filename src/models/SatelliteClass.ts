import * as satellite from "satellite.js";
import type {
  EcfVec3,
  GeodeticLocation,
  SatRec,
} from "satellite.js";
import dayjs from "dayjs";
import { earthRadiusKm, jdUnixEpoch, msPerDay, mu } from "@/utils/constants";
import type { EcefState, EciState, SatelliteState } from "@/types";

class SatelliteClass {
  name: string;
  tle1: string;
  tle2: string;
  satrec: SatRec | null = null;
  noradID: string | null = null;
  inclination: number | null = null;
  eccentricity: number | null = null;
  raan: number | null = null;
  argOfPerigee: number | null = null;
  meanAnomaly: number | null = null;
  meanMotion: number | null = null;
  meanMotionSec: number | null = null;
  a: number | null = null;
  perigee: number | null = null;
  apogee: number | null = null;
  jdsatepoch: number | null = null;
  epochDate: string | null = null;
  epochTimeMs: number | null = null;

  constructor(tle1: string, tle2: string, name = "") {
    this.name = name;
    this.tle1 = tle1;
    this.tle2 = tle2;
    this.initSatellite();
  }

  private initSatellite(): void {
    const satrec = satellite.twoline2satrec(this.tle1, this.tle2);
    const meanMotionSec = satrec.no / 60;
    const semiMajorAxis = Math.pow(mu / Math.pow(meanMotionSec, 2), 1 / 3);

    this.satrec = satrec;
    this.noradID = satrec.satnum;
    this.inclination = satrec.inclo;
    this.eccentricity = satrec.ecco;
    this.raan = satrec.nodeo;
    this.argOfPerigee = satrec.argpo;
    this.meanAnomaly = satrec.mo;
    this.meanMotion = satrec.no;
    this.meanMotionSec = meanMotionSec;
    this.a = semiMajorAxis;
    this.perigee = Number.parseFloat((semiMajorAxis * (1 - satrec.ecco) - earthRadiusKm).toFixed(2));
    this.apogee = Number.parseFloat((semiMajorAxis * (1 + satrec.ecco) - earthRadiusKm).toFixed(2));
    this.jdsatepoch = satrec.jdsatepoch;
    this.epochTimeMs = (satrec.jdsatepoch - jdUnixEpoch) * msPerDay;
    this.epochDate = dayjs(this.epochTimeMs).format("YYYY-MM-DD HH:mm:ss");
  }

  getEciState(date: Date): EciState | null {
    if (!this.satrec) {
      return null;
    }

    const positionAndVelocity = satellite.propagate(this.satrec, date);

    if (!positionAndVelocity) {
      return null;
    }

    return {
      posEci: positionAndVelocity.position,
      velEci: positionAndVelocity.velocity,
    };
  }

  getEcefState(date: Date): EcefState | null {
    if (!this.satrec) {
      return null;
    }

    const positionAndVelocity = satellite.propagate(this.satrec, date);

    if (!positionAndVelocity) {
      return null;
    }

    const gmst = satellite.gstime(date);

    return {
      posEcf: satellite.eciToEcf(positionAndVelocity.position, gmst),
      velEcf: satellite.eciToEcf(positionAndVelocity.velocity, gmst),
    };
  }

  getState(date: Date): SatelliteState | null {
    if (!this.satrec) {
      return null;
    }

    const positionAndVelocity = satellite.propagate(this.satrec, date);

    if (!positionAndVelocity) {
      return null;
    }

    const gmst = satellite.gstime(date);
    const posEci = positionAndVelocity.position;
    const velEci = positionAndVelocity.velocity;
    const posEcf = satellite.eciToEcf(posEci, gmst);
    const velEcf = satellite.eciToEcf(velEci, gmst);
    const geodeticLocation = satellite.eciToGeodetic(posEci, gmst);
    const currentTime = dayjs(date);

    return {
      time: currentTime.format("YYYY-MM-DD HH:mm:ss"),
      timeMs: currentTime.valueOf(),
      noradID: this.noradID,
      name: this.name,
      posEci,
      velEci,
      posEcf,
      velEcf,
      lon: satellite.degreesLong(geodeticLocation.longitude),
      lat: satellite.degreesLat(geodeticLocation.latitude),
      altm: geodeticLocation.height * 1000,
      altKm: geodeticLocation.height,
      headingDeg: this.computeHeading(velEcf, geodeticLocation),
    };
  }

  private computeHeading(velocity: EcfVec3<number>, location: GeodeticLocation): number {
    const sinLatitude = Math.sin(location.latitude);
    const cosLatitude = Math.cos(location.latitude);
    const sinLongitude = Math.sin(location.longitude);
    const cosLongitude = Math.cos(location.longitude);
    const velocityEast = -sinLongitude * velocity.x + cosLongitude * velocity.y;
    const velocityNorth =
      -sinLatitude * cosLongitude * velocity.x -
      sinLatitude * sinLongitude * velocity.y +
      cosLatitude * velocity.z;
    const headingDegrees = (Math.atan2(velocityEast, velocityNorth) * 180) / Math.PI;

    return headingDegrees < 0 ? headingDegrees + 360 : headingDegrees;
  }

  getLLAs(startTime: Date, endTime: Date, step = 60_000): SatelliteState[] {
    const states: SatelliteState[] = [];
    const startTimestamp = dayjs(startTime).valueOf();
    const endTimestamp = dayjs(endTime).valueOf();

    for (let timestamp = startTimestamp; timestamp <= endTimestamp; timestamp += step) {
      const state = this.getState(new Date(timestamp));

      if (state) {
        states.push(state);
      }
    }

    return states;
  }

  getLLAsByPeriod(startTime: Date, step = 60_000): SatelliteState[] {
    if (!this.meanMotion) {
      return [];
    }

    const minutesPerOrbit = (2 * Math.PI) / this.meanMotion;
    const totalMinutes = Math.ceil(minutesPerOrbit) + 1;
    const endTime = dayjs(startTime).add(totalMinutes, "minutes").toDate();

    return this.getLLAs(startTime, endTime, step);
  }
}

export default SatelliteClass;
