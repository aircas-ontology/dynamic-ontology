import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { createMemoryHistory, createRouter } from "vue-router";
import { workspaceRoutes } from "../src/router/modules/workspaceRoutes.ts";
import { ROOT_SPACE_BEHAVIOR_CATEGORY_ID } from "../src/types/pages/ontologySpaceBehaviorType.ts";
import {
  applySpaceBehaviorStatusChangeMock,
  createSpaceBehaviorMock,
  filterSpaceBehaviorsByCategory,
  querySpaceBehaviorWorkspaceMock,
} from "../src/mocks/ontologySpaceBehaviorMock/ontologySpaceBehaviorMock.ts";
import {
  flattenSpaceBehaviorParameterRows,
  listAvailableSpaceBehaviorStatusOperations,
} from "../src/views/OntologySpaceManagementDetail/utils/spaceBehaviorOperations.ts";

/**
 * @description 读取相对 tests 目录的源文件文本。
 * @param relativePath 相对路径。
 * @returns 文件内容。
 */
const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("space behavior route mounts the behavior workspace instead of the empty panel", () => {
  const router = createRouter({ history: createMemoryHistory(), routes: workspaceRoutes });
  const route = router.resolve({ name: "OntologySpaceManagementDetailBehavior", params: { spaceId: "46" } });
  assert.equal(route.path, "/workspace/ontology-space-management/46/behavior");
  assert.match(String(route.matched.at(-1)?.components?.default), /SpaceBehaviorWorkspace/);

  const routeSource = readSource("../src/router/modules/workspaceRoutes.ts");
  const behaviorBlock = routeSource.match(/path:\s*"behavior"[\s\S]*?workspaceTab:\s*"behavior"/);
  assert.ok(behaviorBlock, "behavior route block missing");
  assert.match(behaviorBlock[0], /SpaceBehaviorWorkspace\.vue/);
  assert.doesNotMatch(behaviorBlock[0], /emptyWorkspacePanel/);
});

test("object behavior route mounts its independent behavior workspace", () => {
  const router = createRouter({ history: createMemoryHistory(), routes: workspaceRoutes });
  const route = router.resolve({ name: "OntologyObjectDetailBehavior", params: { objectId: "carrier-1" }, query: { spaceId: "46" } });
  assert.equal(route.path, "/workspace/ontology-object/carrier-1/behavior");
  assert.match(String(route.matched.at(-1)?.components?.default), /ObjectBehaviorWorkspace/);

  const routeSource = readSource("../src/router/modules/workspaceRoutes.ts");
  const objectBehaviorBlock = routeSource.match(/name:\s*"OntologyObjectDetailBehavior"[\s\S]*?objectDetailTab:\s*"behavior"/)?.[0] ?? "";
  assert.match(objectBehaviorBlock, /OntologyObjectDetail\/behaviorComponents\/ObjectBehaviorWorkspace\.vue/);
  assert.doesNotMatch(objectBehaviorBlock, /SpaceBehaviorWorkspace|emptyWorkspacePanel/);

  const workspaceSource = readSource("../src/views/OntologyObjectDetail/behaviorComponents/ObjectBehaviorWorkspace.vue");
  const composableSource = readSource("../src/views/OntologyObjectDetail/composables/useObjectBehaviorWorkspace.ts");
  assert.match(workspaceSource, /ObjectBehaviorCategoryPanel/);
  assert.match(workspaceSource, /ObjectBehaviorListPanel/);
  assert.match(workspaceSource, /ObjectBehaviorFormDialog/);
  assert.match(workspaceSource, /ObjectBehaviorDetailDrawer/);
  assert.match(workspaceSource, /ObjectBehaviorStatusDialog/);
  assert.match(workspaceSource, /ObjectBehaviorDeleteDialog/);
  assert.match(workspaceSource, /grid-template-columns:\s*360px minmax\(0, 1fr\)/);
  assert.doesNotMatch(workspaceSource, /OntologySpaceManagementDetail\/behaviorComponents/);
  assert.match(composableSource, /route\.query\.spaceId/);
  assert.doesNotMatch(composableSource, /useSpaceBehaviorWorkspace|spaceBehaviorOperations/);
});

test("space behavior workspace uses shared tree and relation table surfaces", () => {
  const workspaceSource = readSource("../src/views/OntologySpaceManagementDetail/behaviorComponents/SpaceBehaviorWorkspace.vue");
  const treeSource = readSource("../src/views/OntologySpaceManagementDetail/behaviorComponents/BehaviorCategoryPanel.vue");
  const listSource = readSource("../src/views/OntologySpaceManagementDetail/behaviorComponents/BehaviorListPanel.vue");

  assert.match(workspaceSource, /grid-template-columns:\s*360px minmax\(0, 1fr\)/);
  assert.match(treeSource, /行为分类树/);
  assert.match(treeSource, /class="aircas-tree/);
  assert.match(treeSource, /搜索行为分类/);
  assert.match(treeSource, /FolderOpened/);
  assert.match(listSource, /aircas-table aircas-table--flat/);
  assert.match(listSource, /stripe/);
  assert.match(listSource, /label="行为名称"/);
  assert.match(listSource, /label="函数算子"/);
  assert.match(listSource, /label="描述"/);
  assert.match(listSource, /label="状态"/);
  assert.match(listSource, /label="更新时间"/);
  assert.match(listSource, /新建行为/);
  assert.match(listSource, /placeholder="行为状态"/);
  assert.match(listSource, /aircas-pagination/);
  assert.match(listSource, /aircas-dropdown/);
  assert.match(listSource, /状态管理/);
  assert.match(listSource, /command="delete"/);
});

test("space behavior crud dialogs follow prototype create view edit and delete surfaces", () => {
  const formSource = readSource("../src/views/OntologySpaceManagementDetail/behaviorComponents/BehaviorFormDialog.vue");
  const drawerSource = readSource("../src/views/OntologySpaceManagementDetail/behaviorComponents/BehaviorDetailDrawer.vue");
  const deleteSource = readSource("../src/views/OntologySpaceManagementDetail/behaviorComponents/BehaviorDeleteDialog.vue");
  const workspaceSource = readSource("../src/views/OntologySpaceManagementDetail/behaviorComponents/SpaceBehaviorWorkspace.vue");

  assert.match(formSource, /创建行为/);
  assert.match(formSource, /草稿配置/);
  assert.match(formSource, /基本信息 \/ 输入参数 \/ 输出参数/);
  assert.match(formSource, /el-alert/);
  assert.match(formSource, /另存为独立草稿副本/);
  assert.match(formSource, /已停用行为为只读/);
  assert.match(formSource, /行为描述/);
  assert.match(formSource, /输入行为名称/);
  assert.match(formSource, /行为分类/);
  assert.match(formSource, /基础操作/);
  assert.match(formSource, /关联基础函数算子/);
  assert.match(formSource, /el-empty/);
  assert.match(formSource, /请选择函数算子以加载参数/);
  assert.match(formSource, /参数 \/ 描述/);
  assert.match(formSource, /输入来源/);
  assert.match(formSource, /返回结果字段/);
  assert.match(formSource, /配置状态/);
  assert.match(formSource, /变更信息/);
  assert.match(formSource, /变更说明/);
  assert.match(formSource, /保存行为/);
  assert.match(formSource, /另存草稿副本/);
  assert.match(formSource, /min\(1120px, 94vw\)/);
  assert.doesNotMatch(formSource, /behavior-form-dialog__nav/);

  assert.match(drawerSource, /aircas-drawer/);
  assert.match(drawerSource, /size="680px"/);
  assert.match(drawerSource, /行为 ID/);
  assert.match(drawerSource, /执行范围/);
  assert.match(drawerSource, /输入参数/);
  assert.match(drawerSource, /输出参数/);
  assert.match(drawerSource, /变更说明/);
  assert.match(drawerSource, /状态操作记录/);

  assert.match(deleteSource, /删除行为/);
  assert.match(deleteSource, /影响范围/);
  assert.match(deleteSource, /请输入行为名称确认删除/);
  assert.match(deleteSource, /确认删除/);
  assert.match(deleteSource, /width="520px"/);

  assert.match(workspaceSource, /BehaviorDetailDrawer/);
  assert.doesNotMatch(workspaceSource, /behaviorFormMode\.value = "view"/);
});

test("space behavior status dialog follows the prototype two-step form", () => {
  const dialogSource = readSource("../src/views/OntologySpaceManagementDetail/behaviorComponents/BehaviorStatusDialog.vue");
  assert.match(dialogSource, /本体行为状态管理/);
  assert.match(dialogSource, /目标操作/);
  assert.match(dialogSource, /操作原因/);
  assert.match(dialogSource, /说明发布、停用或转草稿的原因/);
  assert.match(dialogSource, /maxlength="2400"/);
  assert.match(dialogSource, /检查通过/);
  assert.match(dialogSource, /引用检查/);
  assert.match(dialogSource, /重新检查/);
  assert.match(dialogSource, /下一步：确认变更/);
});

test("space behavior edit and status dialogs stay open despite reactive clone and dropdown click-through", () => {
  const formSource = readSource("../src/views/OntologySpaceManagementDetail/behaviorComponents/BehaviorFormDialog.vue");
  const statusSource = readSource("../src/views/OntologySpaceManagementDetail/behaviorComponents/BehaviorStatusDialog.vue");
  const deleteSource = readSource("../src/views/OntologySpaceManagementDetail/behaviorComponents/BehaviorDeleteDialog.vue");
  const listSource = readSource("../src/views/OntologySpaceManagementDetail/behaviorComponents/BehaviorListPanel.vue");

  assert.match(formSource, /cloneSpaceBehaviorParameters/);
  assert.doesNotMatch(formSource, /structuredClone\(props\.behavior/);
  assert.match(formSource, /@update:model-value="emit\('update:modelValue', \$event\)"/);
  assert.match(statusSource, /:close-on-click-modal="false"/);
  assert.match(statusSource, /@update:model-value="emit\('update:modelValue', \$event\)"/);
  assert.match(deleteSource, /:close-on-click-modal="false"/);
  assert.match(listSource, /nextTick/);
  assert.match(listSource, /void nextTick/);
});

test("space behavior parameter flatten treats missing children as leaf rows", () => {
  const rows = flattenSpaceBehaviorParameterRows([
    {
      id: "attributes",
      name: "attributes",
      path: "attributes",
      type: "object",
      required: true,
      description: "对象属性",
      sourceLabel: "对象属性",
      bindLabel: "对象 / 属性",
      configured: true,
    },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.isGroup, false);
});

test("space behavior mock filters by category and supports local create", () => {
  const data = querySpaceBehaviorWorkspaceMock("behavior-test-space");
  assert.ok(data.categoryTree.length > 0);
  assert.ok(data.behaviors.length > 0);
  const childId = data.categoryTree[0]?.children[0]?.id ?? "";
  assert.ok(childId);
  const filtered = filterSpaceBehaviorsByCategory(data.behaviors, data.categoryTree, childId);
  assert.ok(filtered.length > 0);
  assert.ok(filtered.every((item) => item.categoryId === childId || data.categoryTree[0]?.children.some((node) => node.id === item.categoryId)));

  const created = createSpaceBehaviorMock("behavior-test-space", {
    displayName: "单元测试行为",
    functionOperatorId: "operator-create-cvn",
    functionOperatorName: "新增福特级航空母舰(CVN)基础操作",
    description: "测试创建",
    categoryId: childId || ROOT_SPACE_BEHAVIOR_CATEGORY_ID,
    status: "draft",
    basicAction: "create",
  });
  assert.equal(created.displayName, "单元测试行为");
  const afterCreate = querySpaceBehaviorWorkspaceMock("behavior-test-space");
  assert.ok(afterCreate.behaviors.some((item) => item.id === created.id));
});

test("space behavior status operations filter by current status and persist disable", () => {
  const publishedOps = listAvailableSpaceBehaviorStatusOperations("published");
  assert.deepEqual(publishedOps, ["disable", "draft"]);
  const draftOps = listAvailableSpaceBehaviorStatusOperations("draft");
  assert.deepEqual(draftOps, ["publish", "disable"]);
  const disabledOps = listAvailableSpaceBehaviorStatusOperations("disabled");
  assert.deepEqual(disabledOps, ["publish", "draft"]);

  const data = querySpaceBehaviorWorkspaceMock("behavior-status-space");
  const published = data.behaviors.find((item) => item.status === "published");
  assert.ok(published);
  const updated = applySpaceBehaviorStatusChangeMock("behavior-status-space", published.id, {
    operation: "disable",
    reason: "停用验证",
  });
  assert.equal(updated?.status, "disabled");
  const afterChange = querySpaceBehaviorWorkspaceMock("behavior-status-space");
  assert.equal(afterChange.behaviors.find((item) => item.id === published.id)?.status, "disabled");
});
