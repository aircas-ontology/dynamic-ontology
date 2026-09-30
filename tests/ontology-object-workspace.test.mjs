import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createMemoryHistory, createRouter } from "vue-router";
import { workspaceRoutes } from "../src/router/modules/workspaceRoutes.ts";
import { filterConceptTree, findObjectWorkspace, makeCategoryLocationTarget } from "../src/views/OntologySpaceManagementDetail/utils/objectWorkspace.ts";

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

test("missing category tree data opens an add dialog instead of a load error", () => {
  const workspaceSource = readFileSync(
    new URL("../src/views/OntologySpaceManagementDetail/composables/useOntologyObjectWorkspace.ts", import.meta.url),
    "utf8",
  );
  const panelSource = readFileSync(new URL("../src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue", import.meta.url), "utf8");
  const treeSource = readFileSync(new URL("../src/views/OntologySpaceManagementDetail/components/ConceptHierarchyTree.vue", import.meta.url), "utf8");
  const dialogSource = readFileSync(new URL("../src/views/OntologySpaceManagementDetail/components/CategoryTreeCreateDialog.vue", import.meta.url), "utf8");
  assert.match(workspaceSource, /isMissingOntologyCategoryTreeData/);
  assert.match(workspaceSource, /createEmptyObjectWorkspace\(id\)/);
  assert.match(treeSource, /添加分类树/);
  assert.match(dialogSource, /主分类名称/);
  assert.match(dialogSource, /class="aircas-dialog"/);
  assert.doesNotMatch(dialogSource, /getOntology/);
});

test("root concept node opens a child category name dialog", () => {
  const treeSource = readFileSync(new URL("../src/views/OntologySpaceManagementDetail/components/ConceptHierarchyTree.vue", import.meta.url), "utf8");
  const dialogSource = readFileSync(new URL("../src/views/OntologySpaceManagementDetail/components/CategoryTreeChildDialog.vue", import.meta.url), "utf8");
  const panelSource = readFileSync(new URL("../src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue", import.meta.url), "utf8");
  const actionsSource = readFileSync(
    new URL("../src/views/OntologySpaceManagementDetail/composables/useObjectWorkspaceCategoryActions.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(treeSource, /isRootConceptNode/);
  assert.match(treeSource, /openChildCategoryDialog\(data\)/);
  assert.match(treeSource, /aria-label="新建子分类"/);
  assert.match(treeSource, /aria-label="修改分类名称"/);
  assert.match(treeSource, /aria-label="删除分类"/);
  assert.match(treeSource, /\.concept-hierarchy__create-child-wrap\s*\{[^}]*opacity:\s*0/);
  assert.match(treeSource, /el-tree-node__content:hover[\s\S]*concept-hierarchy__create-child-wrap/);
  assert.match(treeSource, /emit\("createChild", categoryId\)/);
  assert.match(dialogSource, /输入子分类名称/);
  assert.match(dialogSource, /emit\("submit", name\)/);
  assert.doesNotMatch(dialogSource, /postCreateOntologyCategoryTreeInterface/);
  assert.match(panelSource, /submitCreateOntologyCategoryChild/);
  assert.match(actionsSource, /parentId: numericParentId/);
});

test("object workspace composable loads the category tree api instead of navy mock data", () => {
  const source = readFileSync(new URL("../src/views/OntologySpaceManagementDetail/composables/useOntologyObjectWorkspace.ts", import.meta.url), "utf8");
  assert.match(source, /getOntologyCategoryTreeInterface/);
  assert.match(source, /mapOntologyCategoryTree/);
  assert.match(source, /mapOntologyCategorySections/);
  assert.doesNotMatch(source, /ontologySpaceObjectMock/);
  assert.match(source, /catch \(cause\)/);
  assert.match(source, /cause instanceof Error && cause\.message\.trim\(\) \? cause\.message/);
});

test("object workspace panel delegates category and object commands to split composables", () => {
  const panelSource = readFileSync(new URL("../src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue", import.meta.url), "utf8");
  const categoryActionsSource = readFileSync(
    new URL("../src/views/OntologySpaceManagementDetail/composables/useObjectWorkspaceCategoryActions.ts", import.meta.url),
    "utf8",
  );
  const objectActionsSource = readFileSync(
    new URL("../src/views/OntologySpaceManagementDetail/composables/useObjectWorkspaceObjectActions.ts", import.meta.url),
    "utf8",
  );
  assert.match(panelSource, /useObjectWorkspaceCategoryActions/);
  assert.match(panelSource, /useObjectWorkspaceObjectActions/);
  assert.match(categoryActionsSource, /postCreateOntologyCategoryTreeInterface/);
  assert.match(objectActionsSource, /createOntologyObjectInterface/);
  assert.match(objectActionsSource, /updateOntologyObjectInterface/);
  assert.match(objectActionsSource, /deleteOntologyObjectInterface/);
});
