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
  assert.match(source, /conceptual-model-create__space-field/);
  assert.match(source, /conceptual-model-create__space-fields[\s\S]*<span>空间名称<\/span>[\s\S]*<span>API 名称<\/span>/);
  assert.match(source, /createOntologySpaceWithCanvasContentInterface/);
  assert.match(source, /buildCanvasSpaceParams/);
  assert.match(source, /mapCanvasDataType/);
  assert.match(source, /storageGroupOptions/);
  assert.match(source, /allow-create/);
  const inspectorSelects = source.match(/<el-select[\s\S]*?<\/el-select>/g) || [];
  assert.equal(inspectorSelects.length, 4);
  for (const selectBlock of inspectorSelects) {
    assert.match(selectBlock, /class="aircas-select"/);
    assert.match(selectBlock, /popper-class="aircas-select-popper"/);
    assert.doesNotMatch(selectBlock, /class="aircas-input"/);
  }
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

test("conceptual model canvas groups attributes by storage and marks keys", async () => {
  const graphSource = readSource("../src/views/OntologyConceptualModelCreate/utils/conceptualModelGraph.ts");
  const helperSource = readSource("../src/views/OntologyConceptualModelCreate/utils/groupConceptualAttributes.ts");
  const canvasSource = readSource("../src/views/OntologyConceptualModelCreate/components/ConceptualModelGraphCanvas.vue");
  assert.match(helperSource, /function groupConceptualAttributesByStorage/);
  assert.match(helperSource, /function formatConceptualAttributeKeyMarks/);
  assert.match(graphSource, /groupConceptualAttributesByStorage/);
  assert.match(graphSource, /formatConceptualAttributeKeyMarks/);
  assert.match(graphSource, /conceptual-model-node__group/);
  assert.match(canvasSource, /conceptualObjectHeight\(object\.attributes\)/);
  assert.match(canvasSource, /conceptual-model-node__group/);
  const helperUrl = new URL("../src/views/OntologyConceptualModelCreate/utils/groupConceptualAttributes.ts", import.meta.url);
  const { groupConceptualAttributesByStorage, formatConceptualAttributeKeyMarks, conceptualObjectHeight } = await import(helperUrl.href);
  const attribute = (id, storageGroup, isPrimary, isNameKey) => ({
    id,
    displayName: `attr_${id}`,
    apiName: `attr_${id}`,
    dataType: "String",
    storageGroup,
    isPrimary,
    isNameKey,
  });
  const grouped = groupConceptualAttributesByStorage([
    attribute(1, "detail", false, false),
    attribute(2, "main", true, true),
    attribute(3, "  ", false, false),
    attribute(4, "detail", false, true),
  ]);
  assert.deepEqual(
    grouped.map((group) => group.storageGroup),
    ["main", "detail"],
  );
  assert.deepEqual(
    grouped[0].attributes.map((item) => item.id),
    [2, 3],
  );
  assert.deepEqual(
    grouped[1].attributes.map((item) => item.id),
    [1, 4],
  );
  assert.deepEqual(
    groupConceptualAttributesByStorage([]).map((group) => group.storageGroup),
    ["main"],
  );
  assert.equal(groupConceptualAttributesByStorage([])[0].attributes.length, 0);
  assert.equal(formatConceptualAttributeKeyMarks({ isPrimary: true, isNameKey: false }), "（主）");
  assert.equal(formatConceptualAttributeKeyMarks({ isPrimary: false, isNameKey: true }), "（名）");
  assert.equal(formatConceptualAttributeKeyMarks({ isPrimary: true, isNameKey: true }), "（主）（名）");
  assert.equal(formatConceptualAttributeKeyMarks({ isPrimary: false, isNameKey: false }), "");
  assert.ok(conceptualObjectHeight([attribute(1, "main", false, false), attribute(2, "extra", false, false)]) > conceptualObjectHeight([]));
});

test("conceptual canvas rejects a second primary key or name key on the same object", async () => {
  const helperUrl = new URL("../src/views/OntologyConceptualModelCreate/utils/groupConceptualAttributes.ts", import.meta.url);
  const { findConflictingConceptualAttributeKey, formatConceptualAttributeKeyConflictMessage } = await import(helperUrl.href);
  const attributes = [
    { id: 1, displayName: "飞机id", apiName: "planeId", isPrimary: true, isNameKey: false },
    { id: 2, displayName: "飞机名称", apiName: "name", isPrimary: false, isNameKey: true },
    { id: 3, displayName: "重量", apiName: "weight", isPrimary: false, isNameKey: false },
  ];

  assert.equal(findConflictingConceptualAttributeKey(attributes, "primary", 3)?.id, 1);
  assert.equal(findConflictingConceptualAttributeKey(attributes, "name", 3)?.id, 2);
  assert.equal(findConflictingConceptualAttributeKey(attributes, "primary", 1), null);
  assert.equal(findConflictingConceptualAttributeKey(attributes, "name", 2), null);
  assert.equal(formatConceptualAttributeKeyConflictMessage("primary", attributes[0]), "当前对象已存在主键「飞机id」，不能同时设置两个主键");
  assert.equal(formatConceptualAttributeKeyConflictMessage("name", attributes[1]), "当前对象已存在名称键「飞机名称」，不能同时设置两个名称键");

  const pageSource = readSource("../src/views/OntologyConceptualModelCreate/index.vue");
  const updateSource = pageSource.match(/function updateAttribute[\s\S]*?function registerStorageGroup/)?.[0] ?? "";
  assert.match(updateSource, /findConflictingConceptualAttributeKey\(owner\.attributes/);
  assert.match(updateSource, /ElMessage\.warning\(formatConceptualAttributeKeyConflictMessage/);
});
