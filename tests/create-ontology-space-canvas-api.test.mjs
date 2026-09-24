import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

function readSource(relativePath) {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
}

test("canvas space creation contract exposes nested canvas content", () => {
  const typeSource = readSource("../src/types/apis/createOntologySpaceWithCanvasContentType.ts");
  const apiSource = readSource("../src/apis/ontologyManageApi.ts");
  const barrelSource = readSource("../src/apis/index.ts");
  assert.match(typeSource, /CreateOntologySpaceWithCanvasContentParams/);
  assert.match(typeSource, /ontologies\?: CanvasOntology\[\]/);
  assert.match(typeSource, /properties\?: CanvasProperty\[\]/);
  assert.match(typeSource, /storageGroup\?: string/);
  assert.match(typeSource, /links\?: CanvasLink\[\]/);
  assert.match(typeSource, /spaceId\?: number/);
  assert.match(apiSource, /createOntologySpaceWithCanvasContentInterface/);
  assert.match(apiSource, /"\/ontology\/space\/canvas"/);
  assert.match(apiSource, /method: "post"/);
  assert.match(barrelSource, /createOntologySpaceWithCanvasContentInterface/);
});

test("conceptual model page maps canvas data and handles save states", () => {
  const source = readSource("../src/views/OntologyConceptualModelCreate/index.vue");
  assert.match(source, /spaceDisplayName/);
  assert.match(source, /objects\.value\.map/);
  assert.match(source, /relations\.value\.filter/);
  assert.match(source, /fromOntologyApiName/);
  assert.match(source, /toOntologyApiName/);
  assert.match(source, /ElMessage\.error/);
  assert.match(source, /router\.push/);
});

test("conceptual model save uses the current space id and save label", () => {
  const source = readSource("../src/views/OntologyConceptualModelCreate/index.vue");
  const actionSource = readSource("../src/views/OntologySpaceManagement/composables/useSpaceManagementActions.ts");
  assert.match(actionSource, /spaceId: space\.id/);
  assert.match(source, /route\.query\.spaceId/);
  assert.match(source, /params\.spaceId = routeSpaceId\.value/);
  assert.match(source, />保存<\/el-button>/);
  assert.doesNotMatch(source, /保存并创建空间/);
});
