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
  assert.match(source, /@drop="dropPalette"/);
  assert.match(source, /function addObject/);
  assert.match(source, /function addAttribute/);
  assert.match(source, /function addRelation/);
  assert.match(source, /function updateObject/);
  assert.match(source, /function updateAttribute/);
  assert.match(source, /function updateRelation/);
  assert.match(source, /conceptual-model-create__edge/);
  assert.match(source, /conceptual-model-create__edge-label/);
  assert.match(source, /conceptual-model-create__edge-port/);
  assert.match(source, /function startRelationPortDrag/);
  assert.match(source, /function fitCanvas/);
  assert.match(source, /function deleteSelected/);
  assert.match(source, /空间名称/);
  assert.match(source, /createOntologySpaceWithCanvasContentInterface/);
  assert.match(source, /buildCanvasSpaceParams/);
  assert.match(source, /mapCanvasDataType/);
  assert.match(source, /spaceId/);
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

test("space creation dialog exposes the conceptual model entry action", () => {
  const dialogSource = readSource("../src/views/OntologySpaceManagement/components/SpaceFormDialog.vue");
  const pageSource = readSource("../src/views/OntologySpaceManagement/index.vue");
  const actionsSource = readSource("../src/views/OntologySpaceManagement/composables/useSpaceManagementActions.ts");
  assert.match(dialogSource, /进入概念建模画布/);
  assert.match(dialogSource, /open-conceptual/);
  assert.match(pageSource, /@open-conceptual="openConceptualModel"/);
  assert.match(actionsSource, /name: "OntologyConceptualModelCreate"/);
});
