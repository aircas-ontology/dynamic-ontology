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

test("conceptual model page splits canvas areas into page components and composable", () => {
  const pageSource = readSource("../src/views/OntologyConceptualModelCreate/index.vue");
  const canvasSource = readSource("../src/views/OntologyConceptualModelCreate/composables/useConceptualModelCanvas.ts");
  const geometrySource = readSource("../src/views/OntologyConceptualModelCreate/utils/conceptualModelGeometry.ts");
  const topbarSource = readSource("../src/views/OntologyConceptualModelCreate/components/ConceptualModelTopbar.vue");
  const paletteSource = readSource("../src/views/OntologyConceptualModelCreate/components/ConceptualModelPalette.vue");
  const stageSource = readSource("../src/views/OntologyConceptualModelCreate/components/ConceptualModelCanvas.vue");
  const inspectorSource = readSource("../src/views/OntologyConceptualModelCreate/components/ConceptualModelInspector.vue");

  assert.match(pageSource, /useConceptualModelCanvas/);
  assert.match(pageSource, /ConceptualModelTopbar/);
  assert.match(pageSource, /ConceptualModelPalette/);
  assert.match(pageSource, /ConceptualModelCanvas/);
  assert.match(pageSource, /ConceptualModelInspector/);

  assert.match(topbarSource, /概念模型画布/);
  assert.match(paletteSource, /UML 组件/);
  assert.match(paletteSource, /对象关系/);
  assert.match(stageSource, /@drop="\$emit\('drop-palette', \$event\)"|@drop="onDropPalette"/);
  assert.match(stageSource, /conceptual-model-create__edge/);
  assert.match(stageSource, /conceptual-model-create__edge-label/);
  assert.match(stageSource, /conceptual-model-create__edge-port/);
  assert.match(inspectorSource, /对象检查器/);

  assert.match(canvasSource, /function addObject/);
  assert.match(canvasSource, /function addAttribute/);
  assert.match(canvasSource, /function addRelation/);
  assert.match(canvasSource, /function updateObject/);
  assert.match(canvasSource, /function updateAttribute/);
  assert.match(canvasSource, /function updateRelation/);
  assert.match(canvasSource, /function startRelationPortDrag/);
  assert.match(canvasSource, /function fitCanvas/);
  assert.match(canvasSource, /function deleteSelected/);
  assert.match(geometrySource, /function objectPoint/);
  assert.match(geometrySource, /function pointFor/);
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
