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
  assert.match(querySource, /propertyType\?:\s*string/);
  assert.match(categorySource, /categoryId\?:\s*number/);
  assert.match(updateSource, /uniqueIdentifier:\s*string/);
  assert.match(updateSource, /displayName:\s*string/);
  assert.match(updateSource, /apiName:\s*string/);
  assert.doesNotMatch(updateSource, /datasource|schemaName|datasourceId|datasourceColumnName|metadata/);
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

test("ontology property api exposes automatic datasource binding", () => {
  const apiSource = readSource("../src/apis/ontologyPropertyApi.ts");
  const barrelSource = readSource("../src/apis/index.ts");
  const typeSource = readSource("../src/types/apis/autoBindOntologyPropertyDatasourceType.ts");

  assert.match(typeSource, /ontologyIdentifier:\s*string/);
  assert.match(apiSource, /autoBindOntologyPropertyDatasourceInterface/);
  assert.match(apiSource, /\/ontology\/property\/auto_bind_datasource/);
  assert.match(apiSource, /method: "post"/);
  assert.match(apiSource, /data: params/);
  assert.match(barrelSource, /autoBindOntologyPropertyDatasourceInterface/);
});

test("ontology property api exposes documented batch update contract", () => {
  const apiSource = readSource("../src/apis/ontologyPropertyApi.ts");
  const barrelSource = readSource("../src/apis/index.ts");
  const typeSource = readSource("../src/types/apis/batchUpdateOntologyPropertiesType.ts");
  const typeBarrelSource = readSource("../src/types/index.ts");
  const mockSource = readSource("../src/mocks/batchUpdateOntologyPropertiesMock/batchUpdateOntologyPropertiesMock.ts");

  assert.match(typeSource, /schemaName:\s*string/);
  assert.match(typeSource, /datasourceId:\s*string/);
  assert.match(typeSource, /datasourceColumnName:\s*string/);
  assert.match(typeSource, /uniqueIdentifier:\s*string/);
  assert.match(typeSource, /datasource\?:\s*BatchUpdateOntologyPropertyDatasource/);
  assert.match(typeSource, /displayName:\s*string/);
  assert.match(typeSource, /dataType:\s*string/);
  assert.match(typeSource, /isTitleKey:\s*boolean/);
  assert.match(typeSource, /isPrimaryKey:\s*boolean/);
  assert.match(typeSource, /storageGroup:\s*string/);
  assert.match(apiSource, /putBatchUpdateOntologyPropertiesInterface/);
  assert.match(apiSource, /\/ontology\/property\/batch/);
  assert.match(apiSource, /method: "put"/);
  assert.match(apiSource, /data: params/);
  assert.match(barrelSource, /putBatchUpdateOntologyPropertiesInterface/);
  assert.match(typeBarrelSource, /BatchUpdateOntologyPropertiesParams/);
  assert.match(mockSource, /batchUpdateOntologyPropertiesMock/);
  assert.match(mockSource, /message: "SUCCESS"/);
});

test("ontology property api exposes property details with datasource fields", () => {
  const apiSource = readSource("../src/apis/ontologyPropertyApi.ts");
  const barrelSource = readSource("../src/apis/index.ts");
  const typeSource = readSource("../src/types/apis/getOntologyPropertyDetailByOntologyIdType.ts");
  const typeBarrelSource = readSource("../src/types/index.ts");

  assert.match(typeSource, /ontologyUniqueIdentifier:\s*string/);
  assert.match(typeSource, /export interface OntologyPropertyDetail/);
  assert.match(typeSource, /datasourceId\?:\s*string/);
  assert.match(typeSource, /datasourceColumnName\?:\s*string/);
  assert.match(typeSource, /datasourceDescription\?:\s*string/);
  assert.match(apiSource, /getOntologyPropertyDetailByOntologyIdInterface/);
  assert.match(apiSource, /\/ontology\/property\/detail/);
  assert.match(apiSource, /method: "get"/);
  assert.match(apiSource, /params/);
  assert.match(barrelSource, /getOntologyPropertyDetailByOntologyIdInterface/);
  assert.match(typeBarrelSource, /GetOntologyPropertyDetailByOntologyIdData/);
});

test("attribute panel uses ontology property api for list and commands", () => {
  const source = readSource("../src/views/OntologyObjectDetail/composables/useAttributePropertyList.ts");
  const helperSource = readSource("../src/views/OntologyObjectDetail/utils/attributePanelHelpers.ts");
  assert.match(source, /loadAttributesForSelection/);
  assert.match(helperSource, /collectPropertyItemsFromTree/);
  assert.match(source, /createOntologyPropertyInterface/);
  assert.match(source, /updateOntologyPropertyInterface/);
  assert.match(source, /deleteOntologyPropertyInterface/);
  assert.match(source, /ontologyIdentifier/);
  assert.match(source, /propertyUniqueIdentifier/);
  assert.match(source, /onPropertyChanged/);
  assert.match(source, /buildCreatePropertyParams/);
  assert.match(source, /buildUpdatePropertyParams/);
  assert.match(source, /isPrimaryKey: draft\.isPrimary/);
  assert.match(source, /isTitleKey: draft\.isNameKey/);
  const updateBuilder = source.match(/function buildUpdatePropertyParams[\s\S]*?function resetDraft/)?.[0] ?? "";
  assert.doesNotMatch(updateBuilder, /datasource:|schemaName:|datasourceId:|datasourceColumnName:|metadata:/);
  assert.match(helperSource, /apiName: item\.apiName/);
  assert.match(helperSource, /dataType: item\.propertyType/);
  assert.match(source, /const storageGroups = computed<OntologyAttributeStorageGroupOption\[\]>\(getStorageGroupOptions\)/);
  assert.match(source, /storageGroup: "main"/);
  const formSource = readSource("../src/views/OntologyObjectDetail/components/AttributePropertyFormDialog.vue");
  assert.match(formSource, /:label="group\.label" :value="group\.value"/);
  const createBuilder = source.match(/function buildCreatePropertyParams[\s\S]*?function buildUpdatePropertyParams/)?.[0] ?? "";
  assert.doesNotMatch(createBuilder, /datasource:|metadata:|type:/);
  assert.match(source, /ElMessageBox\.confirm/);
});
