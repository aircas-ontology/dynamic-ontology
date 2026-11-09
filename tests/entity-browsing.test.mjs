import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createMemoryHistory, createRouter } from "vue-router";
import { workspaceRoutes } from "../src/router/modules/workspaceRoutes.ts";
import { ENTITY_BROWSING_DEFAULT_SPACE_ID } from "../src/utils/entityBrowseConstants.ts";
import { mapEntityBrowseOverview } from "../src/views/EntityBrowsing/utils/mapEntityBrowseOverview.ts";
import { entityBrowseOverviewMock } from "../src/views/EntityBrowsing/mocks/entityBrowseOverviewMock.ts";

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("entity browsing menu targets fixed space id 23 object route", () => {
  const menu = readSource("../src/layout/components/NavigationMenu.vue");
  assert.match(menu, /实体浏览/);
  assert.match(menu, /EntityBrowsingObject/);
  assert.match(menu, /entity-browsing/);
  assert.equal(ENTITY_BROWSING_DEFAULT_SPACE_ID, "23");
});

test("entity browsing object route mounts ObjectWorkspacePanel with browseOnly meta", async () => {
  const router = createRouter({ history: createMemoryHistory(), routes: workspaceRoutes });
  const route = router.resolve({
    name: "EntityBrowsingObject",
    params: { spaceId: ENTITY_BROWSING_DEFAULT_SPACE_ID },
  });
  assert.equal(route.path, `/workspace/entity-browsing/${ENTITY_BROWSING_DEFAULT_SPACE_ID}/object`);
  assert.equal(route.meta.browseOnly, true);
  assert.equal(route.meta.workspaceTab, "object");
  assert.match(String(route.matched.at(-1)?.components?.default), /ObjectWorkspacePanel/);
  assert.match(String(route.matched[1]?.components?.default), /EntityBrowsing/);
});

test("entity browsing overview mock maps statistics and quality cards", () => {
  const overview = mapEntityBrowseOverview(entityBrowseOverviewMock);
  assert.deepEqual(
    overview.statistics.map((item) => item.id),
    ["ontology", "relation", "entity"],
  );
  assert.deepEqual(
    overview.quality.map((item) => item.id),
    ["resilience", "attributeFill"],
  );
  assert.equal(overview.statistics.find((item) => item.id === "ontology")?.value, 312);
  assert.equal(overview.quality.find((item) => item.id === "attributeFill")?.displayValue, "63%");
});

test("entity browsing overview uses compact meter cards without icons", () => {
  const source = readSource("../src/views/EntityBrowsing/components/EntityBrowseOverview.vue");
  assert.match(source, /entity-browse-meter/);
  assert.match(source, /entity-browse-meter::before/);
  assert.doesNotMatch(source, /el-icon|entity-browse-stat__icon/);
  assert.match(source, /font-family:\s*Consolas/);
});

test("object workspace browseOnly mode keeps only view and export actions", () => {
  const list = readSource("../src/views/ObjectWorkspacePanel/components/OntologyObjectList.vue");
  const panel = readSource("../src/views/ObjectWorkspacePanel/index.vue");
  const tree = readSource("../src/views/ObjectWorkspacePanel/components/ConceptHierarchyTree.vue");
  assert.match(panel, /browseOnly/);
  assert.match(list, /browseOnly/);
  assert.match(list, /查看/);
  assert.match(list, /v-if="!browseOnly"/);
  assert.match(tree, /browseOnly/);
  assert.match(tree, /v-if="!browseOnly"/);
});
