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

test("object attribute route resolves to the prototype attribute panel", () => {
  const router = createRouter({ history: createMemoryHistory(), routes: workspaceRoutes });
  const route = router.resolve({ name: "OntologyObjectDetailAttribute", params: { objectId: "demo" }, query: { spaceId: "11" } });
  assert.equal(route.path, "/workspace/ontology-object/demo/attribute");
  assert.deepEqual(
    route.matched.map((record) => record.name),
    ["Workspace", "OntologyObjectDetail", "OntologyObjectDetailAttribute"],
  );
  assert.match(String(route.matched.at(-1)?.components?.default), /OntologyObjectAttributePanel/);
});

test("object attribute panel exposes category tree, property columns, and local actions", () => {
  const panelSource = readSource("../src/views/OntologyObjectDetail/components/OntologyObjectAttributePanel.vue");
  const treeSource = readSource("../src/views/OntologyObjectDetail/components/AttributeCategoryTree.vue");
  const tableSource = readSource("../src/views/OntologyObjectDetail/components/AttributePropertyTable.vue");
  const formSource = readSource("../src/views/OntologyObjectDetail/components/AttributePropertyFormDialog.vue");
  const categoryApiSource = readSource("../src/views/OntologyObjectDetail/composables/useAttributeCategoryTree.ts");
  const propertyApiSource = readSource("../src/views/OntologyObjectDetail/composables/useAttributePropertyList.ts");
  const helperSource = readSource("../src/views/OntologyObjectDetail/utils/attributePanelHelpers.ts");

  assert.match(panelSource, /<AttributeCategoryTree/);
  assert.match(panelSource, /<AttributePropertyTable/);
  assert.match(panelSource, /<AttributeCategoryCreateDialog/);
  assert.match(panelSource, /<AttributeCategoryEditDialog/);
  assert.match(panelSource, /<AttributePropertyFormDialog/);
  assert.match(panelSource, /<DataSourceAssociateDialog/);
  assert.match(treeSource, /属性分类树/);
  assert.match(treeSource, /搜索属性分类/);
  assert.match(treeSource, /nodeType === "category"/);
  assert.match(treeSource, /ontology-object-attribute-panel__tree-property-node/);
  assert.match(treeSource, /ontology-object-attribute-panel__tree-property-dot/);
  assert.match(treeSource, /添加子分类/);
  assert.match(treeSource, /current-node-key="selectedCategoryId"/);
  assert.match(tableSource, /关联数据源/);
  assert.match(tableSource, /数据类型/);
  assert.match(tableSource, /storageGroup/);
  assert.match(formSource, /属性描述/);
  assert.match(formSource, /prop="displayName"/);
  assert.match(formSource, /placeholder="例如：任务优先级"/);
  assert.match(formSource, /请选择属性分类/);
  assert.match(formSource, /class="aircas-select" popper-class="aircas-select-popper"/);
  assert.match(formSource, /class="aircas-switch"/);
  assert.match(categoryApiSource, /function openCategoryCreate/);
  assert.match(categoryApiSource, /function openCategoryEdit/);
  assert.match(categoryApiSource, /deleteOntologyObjectArrTypeTreeInterface/);
  assert.match(categoryApiSource, /parentId: Number\(categoryParentId\.value\) \|\| 0/);
  assert.match(propertyApiSource, /function openCreateAttribute/);
  assert.match(propertyApiSource, /function openEditAttribute/);
  assert.match(propertyApiSource, /function removeAttribute/);
  assert.match(helperSource, /function collectPropertyItemsFromTree/);
  assert.match(helperSource, /propertyType/);
  assert.match(helperSource, /const propertyChildren = \(node\.propertyInfos \?\? \[\]\)\.map\(mapPropertyTreeNode\)/);
});
