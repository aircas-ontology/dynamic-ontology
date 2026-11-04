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

test("canvas content query contract and conceptual model mapping are exposed", async () => {
  const typeSource = readSource("../src/types/apis/getOntologySpaceCanvasContentType.ts");
  const apiSource = readSource("../src/apis/ontologyManageApi.ts");
  const barrelSource = readSource("../src/apis/index.ts");
  const pageSource = readSource("../src/views/OntologyConceptualModelCreate/index.vue");
  const mapperUrl = new URL("../src/views/OntologyConceptualModelCreate/utils/mapCanvasContentToConceptualModel.ts", import.meta.url);
  assert.equal(existsSync(mapperUrl), true, "missing canvas response mapper");
  assert.match(typeSource, /GetOntologySpaceCanvasContentParams/);
  assert.match(typeSource, /GetOntologySpaceCanvasContentData/);
  assert.match(apiSource, /getOntologySpaceCanvasContentInterface/);
  assert.match(apiSource, /method: "get"/);
  assert.match(barrelSource, /getOntologySpaceCanvasContentInterface/);
  assert.match(pageSource, /getOntologySpaceCanvasContentInterface/);
  assert.match(pageSource, /mapCanvasContentToConceptualModel/);
});

test("canvas mapper handles empty responses and missing endpoints", async () => {
  const { mapCanvasContentToConceptualModel } = await import("../src/views/OntologyConceptualModelCreate/utils/mapCanvasContentToConceptualModel.ts");
  assert.deepEqual(mapCanvasContentToConceptualModel(undefined), { objects: [], relations: [], nextSequence: 0 });
  assert.deepEqual(mapCanvasContentToConceptualModel(null), { objects: [], relations: [], nextSequence: 0 });
  const mapped = mapCanvasContentToConceptualModel({
    ontologies: [{ apiName: "ship", displayName: "舰船", properties: [{ apiName: "name", displayName: "名称" }] }],
    links: [{ name: "关系", fromOntologyApiName: "missing", toOntologyApiName: "ship" }],
  });
  assert.equal(mapped.objects[0].attributes[0].dataType, "String");
  assert.equal(mapped.objects[0].attributes[0].storageGroup, "main");
  assert.equal(mapped.objects[0].attributes[0].isPrimary, false);
  assert.equal(mapped.relations[0].sourceId, null);
  assert.equal(mapped.relations[0].sourcePort, null);
  assert.equal(mapped.nextSequence, 3);
});

test("canvas response mapper links relations by ontology api names", async () => {
  const mapperUrl = new URL("../src/views/OntologyConceptualModelCreate/utils/mapCanvasContentToConceptualModel.ts", import.meta.url);
  const { mapCanvasContentToConceptualModel } = await import(mapperUrl.href);
  const mapped = mapCanvasContentToConceptualModel({
    spaceId: 8,
    ontologies: [
      { displayName: "舰船", apiName: "ship", properties: [{ displayName: "名称", apiName: "name", dataType: "String" }] },
      { displayName: "国家", apiName: "country", properties: [] },
    ],
    links: [{ name: "隶属于", apiName: "belongsTo", fromOntologyApiName: "ship", toOntologyApiName: "country" }],
  });
  assert.equal(mapped.objects.length, 2);
  assert.equal(mapped.objects[0].attributes[0].displayName, "名称");
  assert.equal(mapped.relations[0].sourceId, mapped.objects[0].id);
  assert.equal(mapped.relations[0].targetId, mapped.objects[1].id);
});
