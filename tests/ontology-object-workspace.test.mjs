import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createMemoryHistory, createRouter } from "vue-router";
import { workspaceRoutes } from "../src/router/modules/workspaceRoutes.ts";
import {
  filterConceptTree,
  findObjectWorkspace,
  makeCategoryLocationTarget,
} from "../src/views/OntologySpaceManagementDetail/utils/objectWorkspace.ts";

const sampleWorkspaces = [
  {
    spaceId: "demo",
    tree: [
      {
        id: "ship",
        label: "舰船",
        count: 1,
        children: [
          {
            id: "carrier-group",
            label: "航母",
            count: 1,
            children: [{ id: "carrier", label: "航空母舰", count: 1, targetCategoryId: "carrier", children: [] }],
          },
        ],
      },
    ],
    sections: [
      {
        categoryId: "carrier",
        name: "航空母舰",
        items: [
          {
            id: "carrier-1",
            categoryId: "carrier",
            displayName: "福特级航空母舰(CVN)",
            apiName: "carrier_1",
            parentDisplayName: "舰船",
            createdAt: "2025-01-01 00:00",
            iconUrl: "",
            metrics: { attribute: 1, relation: 1, behavior: 1 },
          },
        ],
      },
    ],
  },
];

test("object workspace route resolves beneath the space detail route", () => {
  const router = createRouter({ history: createMemoryHistory(), routes: workspaceRoutes });
  const route = router.resolve({ name: "OntologySpaceManagementDetailObject", params: { spaceId: "demo" } });
  assert.equal(route.path, "/workspace/ontology-space-management/demo/object");
  assert.match(String(route.matched.at(-1)?.components?.default), /ObjectWorkspacePanel/);
});

test("findObjectWorkspace matches by space id and returns undefined when missing", () => {
  assert.equal(findObjectWorkspace(sampleWorkspaces, "demo")?.sections[0]?.categoryId, "carrier");
  assert.equal(findObjectWorkspace(sampleWorkspaces, "missing"), undefined);
});

test("concept tree search retains matching ancestors and category anchor requests advance", () => {
  const workspace = findObjectWorkspace(sampleWorkspaces, "demo");
  assert.ok(workspace);
  const filtered = filterConceptTree(workspace.tree, "航空母舰");
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.children[0]?.children[0]?.label, "航空母舰");
  assert.deepEqual(makeCategoryLocationTarget("carrier", 3), { categoryId: "carrier", requestId: 3 });
});

test("object workspace composable loads the category tree api instead of navy mock data", () => {
  const source = readFileSync(
    new URL("../src/views/OntologySpaceManagementDetail/composables/useOntologyObjectWorkspace.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /getOntologyCategoryTreeInterface/);
  assert.match(source, /mapOntologyCategoryTree/);
  assert.match(source, /sections:\s*\[\]/);
  assert.doesNotMatch(source, /ontologySpaceObjectMock/);
});
