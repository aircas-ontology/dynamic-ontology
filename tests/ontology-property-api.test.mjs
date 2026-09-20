import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

function readSource(relativePath) {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
}

test("ontology property contracts expose the documented fields", () => {
  const createSource = readSource("../src/types/apis/createOntologyPropertyType.ts");
  const querySource = readSource("../src/types/apis/getOntologyPropertyByOntologyIdType.ts");
  const categorySource = readSource("../src/types/apis/getOntologyPropertyByCategoryIdType.ts");
  const updateSource = readSource("../src/types/apis/updateOntologyPropertyType.ts");
  const deleteSource = readSource("../src/types/apis/deleteOntologyPropertyType.ts");

  assert.match(createSource, /ontologyIdentifier:\s*string/);
  assert.match(createSource, /displayName:\s*string/);
  assert.match(createSource, /apiName:\s*string/);
  assert.match(createSource, /isPrimaryKey:\s*boolean/);
  assert.match(createSource, /isTitleKey:\s*boolean/);
  assert.match(querySource, /ontologyUniqueIdentifier:\s*string/);
  assert.match(querySource, /export interface OntologyPropertyInfo/);
  assert.match(querySource, /apiName\?:\s*string/);
  assert.match(querySource, /dataType\?:\s*string/);
  assert.match(categorySource, /categoryId\?:\s*number/);
  assert.match(updateSource, /uniqueIdentifier:\s*string/);
  assert.match(deleteSource, /propertyUniqueIdentifier:\s*string/);
});

test("ontology property api maps query and command endpoints", () => {
  const apiSource = readSource("../src/apis/ontologyPropertyApi.ts");
  const barrelSource = readSource("../src/apis/index.ts");

  assert.match(apiSource, /createOntologyPropertyInterface/);
  assert.match(apiSource, /getOntologyPropertyByOntologyIdInterface/);
  assert.match(apiSource, /getOntologyPropertyByCategoryIdInterface/);
  assert.match(apiSource, /updateOntologyPropertyInterface/);
  assert.match(apiSource, /deleteOntologyPropertyInterface/);
  assert.match(apiSource, /\/ontology\/property\/info/);
  assert.match(apiSource, /\/ontology\/property\/by_category/);
  assert.match(apiSource, /method: "post"/);
  assert.match(apiSource, /method: "put"/);
  assert.match(apiSource, /method: "delete"/);
  assert.match(barrelSource, /createOntologyPropertyInterface/);
  assert.match(barrelSource, /getOntologyPropertyByOntologyIdInterface/);
  assert.match(barrelSource, /deleteOntologyPropertyInterface/);
});

test("attribute panel uses ontology property api for list and commands", () => {
  const source = readSource("../src/views/OntologyObjectDetail/components/OntologyObjectAttributePanel.vue");
  assert.match(source, /getOntologyPropertyByOntologyIdInterface/);
  assert.match(source, /getOntologyPropertyByCategoryIdInterface/);
  assert.match(source, /createOntologyPropertyInterface/);
  assert.match(source, /updateOntologyPropertyInterface/);
  assert.match(source, /deleteOntologyPropertyInterface/);
  assert.match(source, /ontologyUniqueIdentifier/);
  assert.match(source, /propertyUniqueIdentifier/);
  assert.match(source, /await loadAttributes/);
  assert.match(source, /buildCreatePropertyParams/);
  assert.match(source, /buildUpdatePropertyParams/);
  assert.match(source, /isPrimaryKey: draft\.isPrimary/);
  assert.match(source, /isTitleKey: draft\.isNameKey/);
  assert.match(source, /apiName: item\.apiName/);
  assert.match(source, /dataType: item\.dataType/);
  assert.match(source, /const storageGroups = \[\{ label: "主存储", value: "main" \}\]/);
  assert.match(source, /storageGroup: "main"/);
  assert.match(source, /:label="group\.label" :value="group\.value"/);
  const createBuilder = source.match(/function buildCreatePropertyParams[\s\S]*?function buildUpdatePropertyParams/)?.[0] ?? "";
  assert.doesNotMatch(createBuilder, /datasource:|metadata:|type:/);
  assert.match(source, /ElMessageBox\.confirm/);
});
