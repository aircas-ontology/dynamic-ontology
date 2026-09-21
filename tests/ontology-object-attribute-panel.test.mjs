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

test("object attribute panel splits tree, table, dialogs, and composables", () => {
  const panelSource = readSource("../src/views/OntologyObjectDetail/components/OntologyObjectAttributePanel.vue");
  const treeSource = readSource("../src/views/OntologyObjectDetail/components/AttributeCategoryTree.vue");
  const tableSource = readSource("../src/views/OntologyObjectDetail/components/AttributePropertyTable.vue");
  const createDialogSource = readSource("../src/views/OntologyObjectDetail/components/AttributeCategoryCreateDialog.vue");
  const editDialogSource = readSource("../src/views/OntologyObjectDetail/components/AttributeCategoryEditDialog.vue");
  const formDialogSource = readSource("../src/views/OntologyObjectDetail/components/AttributePropertyFormDialog.vue");
  const categoryComposable = readSource("../src/views/OntologyObjectDetail/composables/useAttributeCategoryTree.ts");
  const propertyComposable = readSource("../src/views/OntologyObjectDetail/composables/useAttributePropertyList.ts");

  assert.match(panelSource, /AttributeCategoryTree/);
  assert.match(panelSource, /AttributePropertyTable/);
  assert.match(panelSource, /AttributeCategoryCreateDialog/);
  assert.match(panelSource, /AttributeCategoryEditDialog/);
  assert.match(panelSource, /AttributePropertyFormDialog/);
  assert.match(panelSource, /useAttributeCategoryTree/);
  assert.match(panelSource, /useAttributePropertyList/);

  assert.match(treeSource, /属性分类树/);
  assert.match(treeSource, /搜索属性分类/);
  assert.match(treeSource, /添加子分类/);
  assert.match(treeSource, /current-node-key=/);
  assert.match(treeSource, /编辑分类/);
  assert.match(treeSource, /删除分类/);
  assert.match(treeSource, /暂无分类树数据/);
  assert.match(treeSource, /创建分类/);

  assert.match(tableSource, /关联数据源/);
  assert.match(tableSource, /prop="displayName" label="属性名称"/);
  assert.match(tableSource, /数据类型/);
  assert.match(tableSource, /存储分组/);
  assert.match(tableSource, /属性描述/);
  assert.match(tableSource, /主键/);
  assert.match(tableSource, /名称键/);

  assert.match(createDialogSource, /class="aircas-dialog"/);
  assert.match(createDialogSource, /父分类/);
  assert.match(editDialogSource, /编辑分类/);
  assert.match(editDialogSource, /父分类/);
  assert.match(formDialogSource, /placeholder="例如：任务优先级"/);
  assert.match(formDialogSource, /placeholder="例如：priority"/);
  assert.match(formDialogSource, /请选择属性分类/);
  assert.match(formDialogSource, /class="aircas-select" popper-class="aircas-select-popper"/);
  assert.match(formDialogSource, /class="aircas-switch"/);
  assert.match(formDialogSource, /ontology-object-attribute-panel__form-grid/);

  assert.match(categoryComposable, /function openCategoryCreate/);
  assert.match(categoryComposable, /function openCategoryEdit/);
  assert.match(categoryComposable, /function saveCategoryEdit/);
  assert.match(categoryComposable, /function saveCategoryDraft/);
  assert.match(categoryComposable, /function removeCategory/);
  assert.match(categoryComposable, /deleteOntologyObjectArrTypeTreeInterface/);
  assert.match(categoryComposable, /ElMessageBox\.confirm/);
  assert.match(categoryComposable, /parentId: Number\(categoryParentId\.value\) \|\| 0/);
  assert.match(categoryComposable, /categoryParentName/);

  assert.match(propertyComposable, /function openCreateAttribute/);
  assert.match(propertyComposable, /function openEditAttribute/);
  assert.match(propertyComposable, /function removeAttribute/);
  assert.match(propertyComposable, /function saveAttributeDraft/);
});
