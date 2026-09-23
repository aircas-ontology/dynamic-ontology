import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { createMemoryHistory, createRouter } from "vue-router";
import { workspaceRoutes } from "../src/router/modules/workspaceRoutes.ts";

const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("conceptual model page exposes the prototype canvas areas and interactions", () => {
  const source = readSource("../src/views/OntologyConceptualModelCreate/index.vue");
  assert.match(source, /概念模型画布/);
  assert.match(source, /UML 组件/);
  assert.match(source, /对象关系/);
  assert.match(source, /conceptual-model\/type/);
  assert.match(source, /function addObject/);
  assert.match(source, /function addAttribute/);
  assert.match(source, /function addRelation/);
  assert.match(source, /function updateObject/);
  assert.match(source, /function updateAttribute/);
  assert.match(source, /function updateRelation/);
  assert.match(source, /ConceptualModelGraphCanvas/);
  assert.match(source, /function addConnectedRelation/);
  assert.match(source, /sourceId === targetId/);
  assert.doesNotMatch(source, /function startRelationPortDrag/);
  assert.match(source, /function fitCanvas/);
  assert.match(source, /function deleteSelected/);
  assert.match(source, /空间名称/);
  assert.match(source, /createOntologySpaceWithCanvasContentInterface/);
  assert.match(source, /buildCanvasSpaceParams/);
  assert.match(source, /mapCanvasDataType/);
  assert.match(source, /storageGroupOptions/);
  assert.match(source, /allow-create/);
  assert.match(source, /storageGroup: "main"/);
  assert.match(source, /storageGroup: attribute\.storageGroup/);
  assert.match(source, /spaceId/);
  const graphSource = readSource("../src/views/OntologyConceptualModelCreate/utils/conceptualModelGraph.ts");
  const canvasSource = readSource("../src/views/OntologyConceptualModelCreate/components/ConceptualModelGraphCanvas.vue");
  assert.match(graphSource, /from "@antv\/x6"/);
  assert.match(graphSource, /allowMulti:\s*true/);
  assert.match(graphSource, /allowLoop:\s*false/);
  assert.match(canvasSource, /edge:click/);
  assert.match(canvasSource, /edge:connected/);
  assert.match(canvasSource, /dispose\(\)/);
  assert.match(canvasSource, /@drop="onDropPalette"/);
});

test("deleting an object also removes relation lines connected to it", async () => {
  const pageSource = readSource("../src/views/OntologyConceptualModelCreate/index.vue");
  assert.match(pageSource, /removeRelationsConnectedToObject\(relations\.value, item\.id\)/);
  assert.doesNotMatch(pageSource, /relation\.sourceId = null/);
  const helperUrl = new URL("../src/views/OntologyConceptualModelCreate/utils/removeRelationsConnectedToObject.ts", import.meta.url);
  const { removeRelationsConnectedToObject } = await import(helperUrl.href);
  const relations = [
    { id: 1, sourceId: 1, targetId: 2 },
    { id: 2, sourceId: 2, targetId: 3 },
  ];
  assert.deepEqual(
    removeRelationsConnectedToObject(relations, 2).map((relation) => relation.id),
    [],
  );
  assert.deepEqual(
    removeRelationsConnectedToObject(relations, 1).map((relation) => relation.id),
    [2],
  );
  assert.deepEqual(
    removeRelationsConnectedToObject([{ id: 3, sourceId: 1, targetId: null }], 1).map((relation) => relation.id),
    [],
  );
});

test("conceptual model route resolves under the workspace layout", () => {
  const router = createRouter({ history: createMemoryHistory(), routes: workspaceRoutes });
  const route = router.resolve({ name: "OntologyConceptualModelCreate" });
  assert.equal(route.path, "/workspace/ontology-space-management/conceptual-model-create");
  assert.deepEqual(
    route.matched.map((record) => record.name),
    ["Workspace", "OntologyConceptualModelCreate"],
  );
});

test("conceptual model attribute data types match the object attribute form", () => {
  const source = readSource("../src/views/OntologyConceptualModelCreate/index.vue");
  const expectedDataTypes = [
    "Boolean",
    "Integer",
    "Long",
    "Float",
    "Short",
    "Byte",
    "Double",
    "Decimal",
    "String",
    "Date",
    "Array",
    "Map",
    "Vector",
    "Timestamp",
    "MediaReference",
    "TimeSeries",
    "Attachment",
    "Geohash",
    "Geoshape",
    "Cipher",
    "Ontology",
  ];
  const dataTypesSource = source.match(/const dataTypes = \[([\s\S]*?)\];/)?.[1] ?? "";
  const actualDataTypes = [...dataTypesSource.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(actualDataTypes, expectedDataTypes);
  assert.match(source, /dataType: "String"/);
});

test("space creation dialog does not expose the conceptual model entry action", () => {
  const dialogSource = readSource("../src/views/OntologySpaceManagement/components/SpaceFormDialog.vue");
  const pageSource = readSource("../src/views/OntologySpaceManagement/index.vue");
  const actionsSource = readSource("../src/views/OntologySpaceManagement/composables/useSpaceManagementActions.ts");
  assert.doesNotMatch(dialogSource, /基于概念模型创建/);
  assert.doesNotMatch(dialogSource, /进入概念建模画布/);
  assert.doesNotMatch(dialogSource, /open-conceptual/);
  assert.doesNotMatch(pageSource, /@open-conceptual="openConceptualModel"/);
  assert.doesNotMatch(actionsSource, /function openConceptualModel/);
  assert.match(actionsSource, /name: "OntologyConceptualModelCreate"/);
});
