import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

function readSource(relativePath) {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
}

test("ontology datasource contracts expose table and column query fields", () => {
  const tableSource = readSource("../src/types/apis/getOntologyDatasourceTablesType.ts");
  const columnSource = readSource("../src/types/apis/getOntologyDatasourceColumnsType.ts");
  assert.match(tableSource, /spaceId: number/);
  assert.match(tableSource, /records: OntologyDatasourceTableVO\[\]/);
  assert.match(tableSource, /schemaName: string/);
  assert.match(columnSource, /dataSourceId: string/);
  assert.match(columnSource, /columnName: string/);
  assert.match(columnSource, /isPrimaryKey: boolean/);
});

test("ontology datasource api uses documented GET endpoints and query params", () => {
  const apiSource = readSource("../src/apis/ontologyDatasourceApi.ts");
  const barrelSource = readSource("../src/apis/index.ts");
  assert.match(apiSource, /\/ontology\/datasource\/table/);
  assert.match(apiSource, /\/ontology\/datasource\/column/);
  assert.match(apiSource, /method: "get"/g);
  assert.match(apiSource, /params/);
  assert.match(barrelSource, /getOntologyDatasourceTablesInterface/);
  assert.match(barrelSource, /getOntologyDatasourceColumnsInterface/);
});
