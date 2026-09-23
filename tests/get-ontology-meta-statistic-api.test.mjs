import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("ontology meta statistic types expose the documented query and response fields", () => {
  const source = readSource("../src/types/apis/getOntologyMetaStatisticType.ts");
  assert.match(source, /export interface OntologyMetaStatisticVO/);
  assert.match(source, /uniqueIdentifier: string/);
  assert.match(source, /entityCount: number/);
  assert.match(source, /propertyCount: number/);
  assert.match(source, /relationCount: number/);
  assert.match(source, /actionCount: number/);
  assert.match(source, /export type GetOntologyMetaStatisticData = OntologyMetaStatisticVO/);
  assert.match(source, /export interface GetOntologyMetaStatisticParams/);
  const barrel = readSource("../src/types/index.ts");
  assert.match(barrel, /GetOntologyMetaStatisticData, GetOntologyMetaStatisticParams, OntologyMetaStatisticVO/);
});

test("ontology meta statistic api gets the prefixed ontology meta statistic endpoint", () => {
  const source = readSource("../src/apis/ontologyObjectManageApi.ts");
  assert.match(source, /export function getOntologyMetaStatisticInterface\(/);
  assert.match(source, /DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/meta\/statistic"/);
  assert.match(source, /method: "get"/);
  assert.match(source, /params,/);
  const barrel = readSource("../src/apis/index.ts");
  assert.match(barrel, /getOntologyMetaStatisticInterface/);
});

test("ontology meta statistic mock mirrors the documented success sample", () => {
  const source = readSource("../src/mocks/getOntologyMetaStatisticMock/getOntologyMetaStatisticMock.ts");
  assert.match(source, /export const getOntologyMetaStatisticMock: ApiResponse<GetOntologyMetaStatisticData>/);
  assert.match(source, /code: 200/);
  assert.match(source, /message: "SUCCESS"/);
  assert.match(source, /success: true/);
  assert.match(source, /uniqueIdentifier: "d3e1b0c27f29452eb7cadd1f51eac535"/);
  assert.match(source, /entityCount: 16/);
  assert.match(source, /propertyCount: 9/);
  assert.match(source, /relationCount: 4/);
  assert.match(source, /actionCount: 2/);
});

test("object detail statistic replaces the hardcoded counts with the meta statistic api", () => {
  const pageSource = readSource("../src/views/OntologyObjectDetail/index.vue");
  const composableSource = readSource("../src/views/OntologyObjectDetail/composables/useObjectResourceStatistic.ts");
  const panelSource = readSource("../src/views/OntologyObjectDetail/components/OntologyObjectOverviewPanel.vue");
  assert.match(pageSource, /useObjectResourceStatistic/);
  assert.match(composableSource, /getOntologyMetaStatisticInterface/);
  assert.match(composableSource, /uniqueIdentifier: objectId/);
  assert.match(composableSource, /entity: statistic\.entityCount/);
  assert.match(composableSource, /property: statistic\.propertyCount/);
  assert.match(composableSource, /relation: statistic\.relationCount/);
  assert.match(composableSource, /behavior: statistic\.actionCount/);
  assert.match(composableSource, /response\.code === 200/);
  assert.doesNotMatch(pageSource, /28_640/);
  assert.match(panelSource, /统计加载中\.\.\./);
  assert.match(panelSource, /重试/);
  assert.match(panelSource, /@click="emit\('retry'\)"/);
});
