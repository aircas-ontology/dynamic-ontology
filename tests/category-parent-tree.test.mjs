import test from "node:test";
import assert from "node:assert/strict";
import { buildCategoryParentTree } from "../src/utils/categoryParentTree.ts";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { computed, ref } from "vue";

test("preserves category hierarchy while excluding the edited subtree and non-category data", () => {
  const nodes = [
    {
      id: "0",
      label: "全部",
      objects: [{ id: "object" }],
      children: [
        {
          id: "1",
          label: "A",
          children: [
            { id: "2", label: "B", children: [{ id: "3", label: "C", children: [] }] },
            { id: "4", label: "D", children: [] },
          ],
        },
      ],
    },
  ];
  assert.deepEqual(buildCategoryParentTree(nodes, "2"), [
    { id: "0", label: "全部", children: [{ id: "1", label: "A", children: [{ id: "4", label: "D", children: [] }] }] },
  ]);
  assert.equal(nodes[0].children[0].children.length, 2);
});

test("object category editor presents remaining nested parents and preserves the current parent", () => {
  const source = readFileSync(new URL("../src/views/ObjectWorkspacePanel/composables/useObjectWorkspaceCategoryActions.ts", import.meta.url), "utf8");
  const code = ts.transpile(source, { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 });
  const exports = {};
  new Function("exports", "require", code)(exports, (name) =>
    name === "vue" ? { ref } : name === "@/utils/categoryParentTree" ? { buildCategoryParentTree } : {},
  );
  const tree = ref([
    {
      id: "0",
      label: "全部",
      children: [
        {
          id: "1",
          label: "平台",
          children: [
            { id: "2", label: "舰船", children: [{ id: "3", label: "子分类", children: [] }] },
            { id: "4", label: "飞机", children: [] },
          ],
        },
      ],
    },
  ]);
  const actions = exports.useObjectWorkspaceCategoryActions({ spaceId: ref("42"), tree, load: async () => {} });
  actions.openCategoryRenameDialog("2", "舰船");
  assert.equal(actions.categoryRenameParentId.value, "1");
  assert.deepEqual(actions.categoryParentOptions.value, [
    { id: "0", label: "全部", children: [{ id: "1", label: "平台", children: [{ id: "4", label: "飞机", children: [] }] }] },
  ]);
});

test("handles empty input, removing a root, and a missing edited node", () => {
  assert.deepEqual(buildCategoryParentTree([], "1"), []);
  const nodes = [{ id: "0", label: "全部", children: [{ id: "1", label: "A", children: [] }] }];
  assert.deepEqual(buildCategoryParentTree(nodes, "0"), []);
  assert.deepEqual(buildCategoryParentTree(nodes, "missing"), nodes);
});

test("object category editor keeps a nonzero server root without adding a synthetic root", () => {
  const source = readFileSync(new URL("../src/views/ObjectWorkspacePanel/composables/useObjectWorkspaceCategoryActions.ts", import.meta.url), "utf8");
  const code = ts.transpile(source, { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 });
  const exports = {};
  new Function("exports", "require", code)(exports, (name) =>
    name === "vue" ? { ref } : name === "@/utils/categoryParentTree" ? { buildCategoryParentTree } : {},
  );
  const tree = ref([{ id: "100", label: "全部", children: [{ id: "101", label: "平台", children: [{ id: "102", label: "舰船", children: [] }] }] }]);
  const actions = exports.useObjectWorkspaceCategoryActions({ spaceId: ref("42"), tree, load: async () => {} });
  actions.openCategoryRenameDialog("102", "舰船");
  assert.equal(actions.categoryRenameParentId.value, "101");
  assert.deepEqual(actions.categoryParentOptions.value, [{ id: "100", label: "全部", children: [{ id: "101", label: "平台", children: [] }] }]);
});

test("relation category parent selector keeps the server root and excludes the edited subtree", () => {
  const source = readFileSync(new URL("../src/views/SpaceRelationWorkspace/index.vue", import.meta.url), "utf8");
  const expression = source.match(/const relationCategoryParentOptions = computed\(\(\) => \{[\s\S]*?\n\}\);/);
  assert.ok(expression);
  const makeOptions = new Function(
    "computed",
    "buildCategoryParentTree",
    "relationCategoryTree",
    "categoryFormMode",
    "categoryActionId",
    "ROOT_RELATION_CATEGORY_ID",
    `${expression[0]} return relationCategoryParentOptions;`,
  );
  const tree = ref([
    {
      id: "27",
      label: "全部",
      children: [{ id: "28", label: "父分类", children: [{ id: "29", label: "编辑分类", children: [{ id: "30", label: "子分类", children: [] }] }] }],
    },
  ]);
  const mode = ref("edit");
  const options = makeOptions(computed, buildCategoryParentTree, tree, mode, ref("29"), "relation-all");
  assert.deepEqual(options.value, [{ id: "27", label: "全部", children: [{ id: "28", label: "父分类", children: [] }] }]);
  mode.value = "create";
  tree.value = [];
  assert.deepEqual(options.value, [{ id: "relation-all", label: "根分类", children: [] }]);
});

test("attribute category editor keeps the server root without adding a synthetic root", () => {
  const source = readFileSync(new URL("../src/views/OntologyObjectAttributePanel/composables/useAttributeCategoryTree.ts", import.meta.url), "utf8");
  assert.match(source, /categoryEditParentOptions\.value = tree\.length \? tree : \[\{ id: "0", label: "根分类", children: \[\] \}\]/);
});
