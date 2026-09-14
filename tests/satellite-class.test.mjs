import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

async function importSatelliteClass() {
  const sourcePath = path.resolve("src/models/SatelliteClass.ts");
  const constantsUrl = pathToFileURL(path.resolve("src/utils/constants.ts")).href;
  const satelliteUrl = import.meta.resolve("satellite.js");
  const dayjsUrl = import.meta.resolve("dayjs");
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "satellite-class-"));
  const temporaryFile = path.join(temporaryDirectory, "SatelliteClass.ts");
  const source = (await readFile(sourcePath, "utf8"))
    .replaceAll('"satellite.js"', JSON.stringify(satelliteUrl))
    .replace('"dayjs"', JSON.stringify(dayjsUrl))
    .replace('"@/utils/constants"', JSON.stringify(constantsUrl));

  await writeFile(temporaryFile, source);

  try {
    return (await import(pathToFileURL(temporaryFile).href)).default;
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

test("satellite rejects empty, malformed, and mismatched TLE input", async () => {
  const SatelliteClass = await importSatelliteClass();
  const tle1 = "1 25544U 98067A   24001.50000000  .00000000  00000-0  00000-0 0  9999";
  const tle2 = "2 25544  51.6400 100.0000 0005000 100.0000 260.0000 15.50000000123456";

  assert.throws(() => new SatelliteClass("", tle2), /TLE/);
  assert.throws(() => new SatelliteClass(`2${tle1.slice(1)}`, tle2), /TLE/);
  assert.throws(() => new SatelliteClass(tle1, tle2.replace("25544", "99999")), /TLE/);
});

test("satellite initializes valid immutable orbital data", async () => {
  const SatelliteClass = await importSatelliteClass();
  const tle1 = "1 25544U 98067A   24001.50000000  .00000000  00000-0  00000-0 0  9999";
  const tle2 = "2 25544  51.6400 100.0000 0005000 100.0000 260.0000 15.50000000123456";
  const satellite = new SatelliteClass(tle1, tle2, " ISS ");

  assert.equal(satellite.name, "ISS");
  assert.equal(satellite.noradID, "25544");
  assert.ok(Number.isFinite(satellite.epochTimeMs));
  assert.ok(Number.isFinite(satellite.apogee));
  assert.ok(Number.isFinite(satellite.perigee));
});

test("satellite source keeps constructor and derived state readonly", async () => {
  const source = await readFile("src/models/SatelliteClass.ts", "utf8");

  assert.match(source, /readonly name: string/);
  assert.match(source, /private readonly satrec: SatRec/);
  assert.match(source, /readonly epochTimeMs: number/);
});
