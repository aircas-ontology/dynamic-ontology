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
  readonly name: string;
  readonly tle1: string;
  readonly tle2: string;
  readonly noradID: string;
  readonly inclination: number;
  readonly eccentricity: number;
  readonly raan: number;
  readonly argOfPerigee: number;
  readonly meanAnomaly: number;
  readonly meanMotion: number;
  readonly meanMotionSec: number;
  readonly a: number;
  readonly perigee: number;
  readonly apogee: number;
  readonly jdsatepoch: number;
  readonly epochDate: string;
  readonly epochTimeMs: number;

  private readonly satrec: SatRec;

  constructor(tle1: string, tle2: string, name = "") {
    const normalizedTle1 = tle1.trim();
    const normalizedTle2 = tle2.trim();
    const catalogNumber1 = normalizedTle1.slice(2, 7).trim();
    const catalogNumber2 = normalizedTle2.slice(2, 7).trim();

    if (!normalizedTle1.startsWith("1 ") || !normalizedTle2.startsWith("2 ")) {
      throw new Error("TLE 必须包含以 ‘1 ’ 和 ‘2 ’ 开头的两行数据。");
    }

    if (!catalogNumber1 || catalogNumber1 !== catalogNumber2) {
      throw new Error("TLE 两行的卫星编号必须一致。");
    }

    const satrec = satellite.twoline2satrec(normalizedTle1, normalizedTle2);

    if (satrec.error !== satellite.SatRecError.None || !Number.isFinite(satrec.no) || satrec.no <= 0) {
      throw new Error(`TLE 解析失败，错误代码：${satrec.error}。`);
    }

    const meanMotionSec = satrec.no / 60;
    const semiMajorAxis = Math.pow(mu / Math.pow(meanMotionSec, 2), 1 / 3);

    this.name = name.trim();
    this.tle1 = normalizedTle1;
    this.tle2 = normalizedTle2;
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
    const minutesPerOrbit = (2 * Math.PI) / this.meanMotion;
    const totalMinutes = Math.ceil(minutesPerOrbit) + 1;
    const endTime = dayjs(startTime).add(totalMinutes, "minutes").toDate();

    return this.getLLAs(startTime, endTime, step);
  }
}

export default SatelliteClass;
