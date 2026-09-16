import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryHistory, createRouter } from "vue-router";
import { workspaceRoutes } from "../src/router/modules/workspaceRoutes.ts";
import { ontologySpaceObjectMock } from "../src/mocks/ontologySpaceObjectMock/ontologySpaceObjectMock.ts";
import {
  filterConceptTree,
  findObjectWorkspace,
  makeCategoryLocationTarget,
} from "../src/views/OntologySpaceManagementDetail/utils/objectWorkspace.ts";

test("object workspace route resolves beneath the space detail route", () => {
  const router = createRouter({ history: createMemoryHistory(), routes: workspaceRoutes });
  const route = router.resolve({ name: "OntologySpaceManagementDetailObject", params: { spaceId: "navy" } });
  assert.equal(route.path, "/workspace/ontology-space-management/navy/object");
  assert.match(String(route.matched.at(-1)?.components?.default), /ObjectWorkspacePanel/);
});

test("navy object mock provides 22 objects grouped into matching categories", () => {
  const workspace = findObjectWorkspace(ontologySpaceObjectMock, "navy");
  assert.ok(workspace);
  assert.equal(workspace.sections.reduce((total, section) => total + section.items.length, 0), 22);
  for (const section of workspace.sections) {
    assert.equal(section.items.every(item => item.categoryId === section.categoryId), true);
  }
});

test("concept tree search retains matching ancestors and category anchor requests advance", () => {
  const workspace = findObjectWorkspace(ontologySpaceObjectMock, "navy");
  assert.ok(workspace);
  const filtered = filterConceptTree(workspace.tree, "航空母舰");
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.children[0]?.children[0]?.label, "航空母舰");
  assert.deepEqual(makeCategoryLocationTarget("carrier", 3), { categoryId: "carrier", requestId: 3 });
});

test("unknown spaces return no object workspace", () => {
  assert.equal(findObjectWorkspace(ontologySpaceObjectMock, "missing"), undefined);
});
