import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("list ontology action API follows the documented GET contract", () => {
  const source = readSource("../src/apis/ontologyActionApi.ts");
  assert.match(source, /export function getListOntologyActionInterface\(params: ListOntologyActionParams\): Promise<ApiResponse<ListOntologyActionData>>/);
  assert.match(source, /DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/action\/list"/);
  assert.match(source, /method: "get"/);
  assert.match(source, /params,/);
});

test("ontology action info and edit APIs follow GET and PUT contracts", () => {
  const source = readSource("../src/apis/ontologyActionApi.ts");
  const infoTypeSource = readSource("../src/types/apis/getOntologyActionInfoType.ts");
  const apiBarrel = readSource("../src/apis/index.ts");
  const typeBarrel = readSource("../src/types/index.ts");
  assert.match(source, /export function getOntologyActionInfoInterface\(params: GetOntologyActionInfoParams\)/);
  assert.match(source, /DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/action"/);
  assert.match(source, /actionApi、ontologySpaceId/);
  assert.match(infoTypeSource, /interface GetOntologyActionInfoParams[\s\S]*actionApi: string[\s\S]*ontologySpaceId: string/);
  assert.match(source, /export function putEditOntologyActionInterface\(params: EditOntologyActionParams\)/);
  assert.match(source, /method: "put"/);
  assert.match(apiBarrel, /getOntologyActionInfoInterface/);
  assert.match(apiBarrel, /putEditOntologyActionInterface/);
  assert.match(typeBarrel, /GetOntologyActionInfoData/);
  assert.match(typeBarrel, /EditOntologyActionParams/);
});

test("list ontology action types and exports use the documented sample fields", () => {
  const typeSource = readSource("../src/types/apis/listOntologyActionType.ts");
  const barrelSource = readSource("../src/types/index.ts");
  const apiBarrel = readSource("../src/apis/index.ts");
  assert.match(typeSource, /interface ListOntologyActionParams[\s\S]*ontologySpaceId: number/);
  assert.match(typeSource, /categoryId\?: number/);
  assert.match(typeSource, /keyword\?: string/);
  assert.match(typeSource, /status\?: number/);
  assert.match(typeSource, /pageNum\?: number/);
  assert.match(typeSource, /pageSize\?: number/);
  assert.match(typeSource, /interface ListOntologyActionRecord[\s\S]*actionApi: string[\s\S]*displayName: string/);
  assert.match(typeSource, /updateTime\?: string \| null/);
  assert.match(typeSource, /interface ListOntologyActionData[\s\S]*records: ListOntologyActionRecord\[]/);
  assert.match(barrelSource, /ListOntologyActionData, ListOntologyActionParams, ListOntologyActionRecord[\s\S]*listOntologyActionType/);
  assert.match(apiBarrel, /getListOntologyActionInterface/);
});

test("list ontology action mock route and fixture are registered", () => {
  const routes = readSource("../src/mockData/routes.json");
  const fixture = readSource("../src/mockData/fixtures/ontology/action.list.get.json");
  assert.match(routes, /"path": "\/ontology\/action\/list"/);
  assert.match(routes, /action\.list\.get\.json/);
  assert.match(fixture, /"actionApi": "act\.pv\.weapon\.add"/);
  assert.match(fixture, /"updateTime": "2026-11-06 15:23:36"/);
  assert.match(fixture, /"total": 2/);
});

test("ontology action info and edit mock routes are registered", () => {
  const routes = readSource("../src/mockData/routes.json");
  const infoFixture = readSource("../src/mockData/fixtures/ontology/action.info.get.json");
  const editFixture = readSource("../src/mockData/fixtures/ontology/action.edit.put.json");
  assert.match(routes, /"method": "GET"[\s\S]*"path": "\/ontology\/action"[\s\S]*action\.info\.get\.json/);
  assert.match(routes, /"method": "PUT"[\s\S]*"path": "\/ontology\/action"[\s\S]*action\.edit\.put\.json/);
  assert.match(infoFixture, /"subjectType": "PROPERTY_VALUE"/);
  assert.match(editFixture, /"data": null/);
});
