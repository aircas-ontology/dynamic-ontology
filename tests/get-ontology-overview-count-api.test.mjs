import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("overview count types expose all documented statistic fields", () => {
  const source = readSource("../src/types/apis/getOntologyOverviewCountType.ts");
  const barrel = readSource("../src/types/index.ts");
  assert.match(source, /export interface OverviewCountVO/);
  for (const field of ["spaceCount", "ontologyCount", "groupCount", "actionSchedulingCount", "actionCount", "functionCount", "propertyCount", "linkCount"]) {
    assert.match(source, new RegExp(`${field}\\?:\\s*number`));
  }
  assert.match(barrel, /GetOntologyOverviewCountData, OverviewCountVO/);
});

test("overview count api uses the documented prefixed GET endpoint without params", () => {
  const source = readSource("../src/apis/ontologyManageApi.ts");
  const fn = source.match(/export function getOntologyOverviewCountInterface[\s\S]*?\n\}/);
  assert.ok(fn, "missing overview count interface");
  assert.match(fn[0], /Promise<ApiResponse<GetOntologyOverviewCountData>>/);
  assert.match(fn[0], /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/overview\/count"/);
  assert.match(fn[0], /method:\s*"get"/);
  assert.doesNotMatch(fn[0], /params|data:/);
  assert.match(source, /GetOntologyOverviewCountData/);
});

test("overview count mock mirrors the documented statistic response", () => {
  const source = readSource("../src/mocks/getOntologyOverviewCountMock/getOntologyOverviewCountMock.ts");
  assert.match(source, /export const getOntologyOverviewCountMock: ApiResponse<GetOntologyOverviewCountData>/);
  assert.match(source, /code:\s*0/);
  for (const field of ["spaceCount", "ontologyCount", "groupCount", "actionSchedulingCount", "actionCount", "functionCount", "propertyCount", "linkCount"]) {
    assert.match(source, new RegExp(`${field}:\\s*0`));
  }
});

test("space management loads overview count and maps backend values to stat cards", () => {
  const composable = readSource("../src/views/OntologySpaceManagement/composables/useSpaceManagement.ts");
  const page = readSource("../src/views/OntologySpaceManagement/index.vue");
  assert.match(composable, /getOntologyOverviewCountInterface/);
  assert.match(composable, /spaceCount/);
  assert.match(composable, /ontologyCount/);
  assert.match(composable, /actionCount/);
  assert.match(composable, /linkCount/);
  assert.match(composable, /overviewError/);
  assert.match(composable, /overviewStatus/);
  assert.match(page, /overviewError/);
});
