import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("ontology object query api follows the category endpoint contract", () => {
  const apiSource = readSource("../src/apis/ontologyObjectManageApi.ts");
  const typeSource = readSource("../src/types/apis/getOntologyObjectByCategoryIdType.ts");
  const barrelSource = readSource("../src/apis/index.ts");
  const typeBarrelSource = readSource("../src/types/index.ts");

  assert.match(apiSource, /export function getOntologyObjectByCategoryIdInterface\(/);
  assert.match(apiSource, /Promise<ApiResponse<GetOntologyObjectByCategoryIdData>>/);
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/meta\/category"/);
  assert.match(apiSource, /method:\s*"get"/);
  assert.match(apiSource, /params,/);
  assert.match(typeSource, /export interface GetOntologyObjectByCategoryIdParams/);
  assert.match(typeSource, /categoryId\?:\s*number/);
  assert.match(typeSource, /export type GetOntologyObjectByCategoryIdData = OntologyObjectQueryItem\[\]/);
  assert.match(barrelSource, /getOntologyObjectByCategoryIdInterface/);
  assert.match(typeBarrelSource, /GetOntologyObjectByCategoryIdData/);
});

test("object workspace maps category tree metadata and anchors selected categories", () => {
  const composableSource = readSource("../src/views/OntologySpaceManagementDetail/composables/useOntologyObjectWorkspace.ts");
  const panelSource = readSource("../src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue");
  const listSource = readSource("../src/views/OntologySpaceManagementDetail/components/OntologyObjectList.vue");
  const mapperSource = readSource("../src/views/OntologySpaceManagementDetail/utils/mapOntologyCategoryTree.ts");

  assert.match(composableSource, /mapOntologyCategorySections/);
  assert.doesNotMatch(composableSource, /getOntologyObjectByCategoryIdInterface/);
  assert.match(panelSource, /locateCategory\(node\.targetCategoryId\)/);
  assert.doesNotMatch(panelSource, /loadObjectsByCategory/);
  assert.match(listSource, /categoryAnchorId/);
  assert.match(listSource, /locateCategory/);
  assert.match(mapperSource, /export function mapOntologyCategorySections/);
});
