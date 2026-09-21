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
  const source = readSource("../src/views/OntologyObjectDetail/components/OntologyObjectAttributePanel.vue");
  assert.match(source, /属性分类树/);
  assert.match(source, /搜索属性分类/);
  assert.match(source, /nodeType: "property"/);
  assert.match(source, /nodeType: "category"/);
  assert.match(source, /function isCategoryNode/);
  assert.match(source, /function collectPropertyItemsFromTree/);
  assert.match(source, /function refreshAttributesFromTree/);
  assert.match(source, /\.source\b/);
  assert.match(source, /collectPropertyItemsFromTree\(\[selectedCategory\]\)/);
  assert.match(source, /if \(!isCategoryNode\(data\)\) return/);
  assert.doesNotMatch(source, /toggleNodeProperties/);
  assert.match(source, /ontology-object-attribute-panel__tree-property-node/);
  assert.match(source, /ontology-object-attribute-panel__tree-property-dot/);
  assert.match(source, /添加子分类/);
  assert.match(source, /current-node-key="selectedCategoryId"/);
  assert.match(source, /class="aircas-dialog"/);
  assert.match(source, /关联数据源/);
  assert.match(source, /数据类型/);
  assert.match(source, /存储分组/);
  assert.match(source, /属性描述/);
  assert.match(source, /prop="displayName" label="属性名称"/);
  assert.match(source, /placeholder="例如：任务优先级"/);
  assert.match(source, /placeholder="例如：priority"/);
  assert.match(source, /请选择属性分类/);
  assert.match(source, /class="aircas-select" popper-class="aircas-select-popper"/);
  assert.match(source, /class="aircas-switch"/);
  assert.match(source, /主键/);
  assert.match(source, /名称键/);
  assert.match(source, /ontology-object-attribute-panel__form-grid/);
  assert.match(source, /function openCreateAttribute/);
  assert.match(source, /function openEditAttribute/);
  assert.match(source, /function openCategoryCreate/);
  assert.match(source, /function openCategoryEdit/);
  assert.match(source, /function saveCategoryEdit/);
  assert.match(source, /deleteOntologyObjectArrTypeTreeInterface/);
  assert.match(source, /function removeCategory/);
  assert.match(source, /ElMessageBox\.confirm/);
  assert.match(source, /编辑分类/);
  assert.match(source, /父分类/);
  assert.match(source, /编辑分类/);
  assert.match(source, /删除分类/);
  assert.match(source, /function saveCategoryDraft/);
  assert.match(source, /暂无分类树数据/);
  assert.match(source, /创建分类/);
  assert.match(source, /parentId: Number\(categoryParentId\.value\) \|\| 0/);
  assert.match(source, /categoryParentName/);
  assert.match(source, /父分类/);
  assert.match(source, /function removeAttribute/);
  assert.match(source, /function saveAttributeDraft/);
  assert.match(source, /const propertyChildren = \(node\.propertyInfos \?\? \[\]\)\.map\(mapPropertyTreeNode\)/);
});
