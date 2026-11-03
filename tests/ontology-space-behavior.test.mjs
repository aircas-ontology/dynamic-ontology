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
  collectSpaceBehaviorCategoryIds,
  flattenSpaceBehaviorParameterRows,
  listAvailableSpaceBehaviorStatusOperations,
  omitActionLeavesFromCategoryTree,
} from "../src/views/SpaceBehaviorWorkspace/utils/spaceBehaviorOperations.ts";
import { mapActionCategoryTree } from "../src/views/SpaceBehaviorWorkspace/utils/mapActionCategoryTree.ts";
import {
  mapListOntologyActionRecord,
  mapSpaceBehaviorItemToListStatus,
  mapSpaceBehaviorListStatusToQuery,
} from "../src/views/SpaceBehaviorWorkspace/utils/mapListOntologyActionRecord.ts";
import { flattenPropertyInfosFromCategoryTree } from "../src/views/SpaceBehaviorWorkspace/utils/flattenPropertyInfosFromCategoryTree.ts";
import { isAttributeValueRowSelectable, resolveAttributeValueSelection } from "../src/views/SpaceBehaviorWorkspace/utils/resolveAttributeValueSelection.ts";
import { sortPropertyInfosByStorageGroup } from "../src/views/SpaceBehaviorWorkspace/utils/sortPropertyInfosByStorageGroup.ts";
import {
  buildPropertyValueCreateActionParams,
  isPropertyValueActionCreateDraft,
} from "../src/views/SpaceBehaviorWorkspace/utils/buildPropertyValueCreateActionParams.ts";
import { buildLinkCreateActionParams, isLinkActionCreateDraft } from "../src/views/SpaceBehaviorWorkspace/utils/buildLinkCreateActionParams.ts";
import {
  buildBasicOperatorCreateActionParams,
  isBasicOperatorActionCreateDraft,
} from "../src/views/SpaceBehaviorWorkspace/utils/buildBasicOperatorCreateActionParams.ts";
import { mapOntologyActionInfoToFormState } from "../src/views/SpaceBehaviorWorkspace/utils/mapOntologyActionInfoToFormState.ts";

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
  assert.match(behaviorBlock[0], /SpaceBehaviorWorkspace\/index\.vue/);
  assert.doesNotMatch(behaviorBlock[0], /emptyWorkspacePanel/);
});

test("object behavior route mounts its independent behavior workspace", () => {
  const router = createRouter({ history: createMemoryHistory(), routes: workspaceRoutes });
  const route = router.resolve({ name: "OntologyObjectDetailBehavior", params: { objectId: "carrier-1" }, query: { spaceId: "46" } });
  assert.equal(route.path, "/workspace/ontology-object/carrier-1/behavior");
  assert.match(String(route.matched.at(-1)?.components?.default), /ObjectBehaviorWorkspace/);

  const routeSource = readSource("../src/router/modules/workspaceRoutes.ts");
  const objectBehaviorBlock = routeSource.match(/name:\s*"OntologyObjectDetailBehavior"[\s\S]*?objectDetailTab:\s*"behavior"/)?.[0] ?? "";
  assert.match(objectBehaviorBlock, /ObjectBehaviorWorkspace\/index\.vue/);
  assert.doesNotMatch(objectBehaviorBlock, /SpaceBehaviorWorkspace|emptyWorkspacePanel/);

  const workspaceSource = readSource("../src/views/ObjectBehaviorWorkspace/index.vue");
  const composableSource = readSource("../src/views/ObjectBehaviorWorkspace/composables/useObjectBehaviorWorkspace.ts");
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
  const workspaceSource = readSource("../src/views/SpaceBehaviorWorkspace/index.vue");
  const treeSource = readSource("../src/views/SpaceBehaviorWorkspace/components/BehaviorCategoryPanel.vue");
  const listSource = readSource("../src/views/SpaceBehaviorWorkspace/components/BehaviorListPanel.vue");

  assert.match(workspaceSource, /grid-template-columns:\s*360px minmax\(0, 1fr\)/);
  assert.match(treeSource, /行为分类树/);
  assert.match(treeSource, /<el-tree\b/);
  assert.match(treeSource, /搜索行为分类/);
  assert.match(treeSource, /FolderOpened/);
  assert.match(listSource, /aircas-table--accent-header/);
  assert.match(listSource, /stripe/);
  assert.match(listSource, /label="行为名称"/);
  assert.match(listSource, /label="类别"/);
  assert.match(listSource, /SPACE_BEHAVIOR_KIND_LABELS/);
  assert.doesNotMatch(listSource, /label="函数算子"/);
  assert.doesNotMatch(listSource, /label="行为类型"/);
  assert.match(listSource, /label="描述"/);
  assert.match(listSource, /label="状态"/);
  assert.match(listSource, /label="更新时间"/);
  assert.match(listSource, /新建行为/);
  assert.match(listSource, /placeholder="行为状态"/);
  assert.match(listSource, /SPACE_BEHAVIOR_LIST_STATUS_OPTIONS/);
  assert.match(listSource, /SPACE_BEHAVIOR_LIST_STATUS_LABELS/);
  assert.match(listSource, /<el-pagination\b/);
  assert.match(listSource, /<el-dropdown\b/);
  assert.match(listSource, /状态管理/);
  assert.match(listSource, /command="delete"/);
});

test("space behavior workspace loads the action category tree on entry", () => {
  const source = readSource("../src/views/SpaceBehaviorWorkspace/composables/useSpaceBehaviorWorkspace.ts");
  const panelSource = readSource("../src/views/SpaceBehaviorWorkspace/components/BehaviorCategoryPanel.vue");
  assert.match(source, /getActionCategoryTreeInterface\(\{ spaceId: numericSpaceId \}\)/);
  assert.match(source, /getListOntologyActionInterface/);
  assert.match(source, /mapListOntologyActionRecord/);
  assert.match(source, /response\.code !== 200/);
  assert.match(source, /mapActionCategoryTree/);
  assert.match(source, /resolveListActionCategoryIdQuery/);
  assert.match(source, /categoryId: categoryIdQuery/);
  assert.match(source, /function selectBehaviorCategory\(categoryId: string\): void \{[\s\S]*void loadSpaceBehaviorList\(\);/);
  assert.doesNotMatch(source, /filterSpaceBehaviorsByCategory/);
  assert.match(panelSource, /isActionCategoryNode/);
  assert.match(panelSource, /parentCategoryId/);
  assert.match(panelSource, /behavior-category-panel__action-dot/);
  assert.doesNotMatch(panelSource, /Document/);
});

test("space behavior maps listAction records to table rows with enabled disabled status", () => {
  const enabled = mapListOntologyActionRecord({
    id: 1,
    actionApi: "act.pv.weapon.add",
    displayName: "武器行-新增",
    description: "属性值行为：向 weapon 分组新增一行",
    ontologyUniqIdentifier: "ea512d439cd34c6ebbcde6b692261ab5",
    categoryId: 14,
    status: 1,
    actionKind: "BASE",
    subjectType: "PROPERTY_VALUE",
    operation: "CREATE",
    storageGroup: "weapon",
    functionApi: null,
    functionDescription: null,
    outputMode: null,
  });
  assert.equal(enabled.displayName, "武器行-新增");
  assert.equal(enabled.behaviorApiName, "act.pv.weapon.add");
  assert.equal(enabled.functionOperatorName, "-");
  assert.equal(enabled.status, "published");
  assert.equal(mapSpaceBehaviorItemToListStatus(enabled.status), "enabled");
  assert.equal(enabled.updatedAt, "-");
  assert.equal(enabled.kind, "basic");
  assert.equal(enabled.valueType, "attributeValue");
  assert.equal(enabled.basicAction, "create");

  const disabled = mapListOntologyActionRecord({
    id: 2,
    actionApi: "fn.demo",
    displayName: "失效行为",
    description: "desc",
    ontologyUniqIdentifier: "oid",
    categoryId: 11,
    status: 0,
    actionKind: "APPLICATION",
    subjectType: "BASIC_OPERATOR",
    operation: "UPDATE",
    storageGroup: "",
    functionApi: "op.api",
    functionDescription: "算子说明",
    outputMode: null,
  });
  assert.equal(disabled.status, "disabled");
  assert.equal(mapSpaceBehaviorItemToListStatus(disabled.status), "disabled");
  assert.equal(disabled.functionOperatorName, "op.api");
  assert.equal(disabled.kind, "application");
  assert.equal(disabled.basicAction, "update");
  assert.equal(mapSpaceBehaviorListStatusToQuery("enabled"), 1);
  assert.equal(mapSpaceBehaviorListStatusToQuery("disabled"), 0);
  assert.equal(mapSpaceBehaviorListStatusToQuery(""), undefined);

  const linkAction = mapListOntologyActionRecord({
    id: 3,
    actionApi: "act.link.demo",
    displayName: "关系实例行为",
    description: "link",
    ontologyUniqIdentifier: "oid-link",
    categoryId: 12,
    status: 1,
    actionKind: "BASE",
    subjectType: "LINK",
    operation: "CREATE",
    storageGroup: "",
    functionApi: null,
    functionDescription: null,
    outputMode: null,
  });
  assert.equal(linkAction.valueType, "relationInstance");
});

test("space behavior maps actionInfos into category counts and displayName leaves", () => {
  const tree = mapActionCategoryTree({
    categoryId: 5,
    name: "根节点",
    children: [
      {
        categoryId: 11,
        name: "单独1",
        actionInfos: [
          { actionApi: "cc", displayName: "cc", description: "ccc" },
          { actionApi: "ee", displayName: "eee", description: "eeeeeee" },
          { actionApi: "  ", displayName: "skip" },
          { actionApi: "fallback", displayName: "  " },
        ],
      },
    ],
  });
  assert.equal(tree.length, 1);
  assert.equal(tree[0]?.label, "根节点");
  assert.equal(tree[0]?.kind, "category");
  assert.equal(tree[0]?.count, 3);
  const child = tree[0]?.children[0];
  assert.equal(child?.label, "单独1");
  assert.equal(child?.count, 3);
  assert.equal(child?.children.length, 3);
  assert.equal(child?.children[0]?.kind, "action");
  assert.equal(child?.children[0]?.label, "cc");
  assert.equal(child?.children[1]?.label, "eee");
  assert.equal(child?.children[2]?.label, "fallback");
  assert.equal(child?.children[0]?.parentCategoryId, "11");
  const categoryOnly = omitActionLeavesFromCategoryTree(tree);
  assert.equal(categoryOnly[0]?.children[0]?.children.length, 0);
  assert.deepEqual(collectSpaceBehaviorCategoryIds(tree[0]), ["5", "11"]);

  const fromItems = mapActionCategoryTree({
    items: { id: 7, categoryName: "兼容分类", actionInfos: [{ actionApi: "a1", displayName: "行为A" }] },
  });
  assert.equal(fromItems[0]?.id, "7");
  assert.equal(fromItems[0]?.count, 1);

  const fromArray = mapActionCategoryTree([{ id: 8, name: "数组根", items: [{ id: 9, name: "子项" }] }]);
  assert.equal(fromArray[0]?.children[0]?.id, "9");

  assert.throws(() => mapActionCategoryTree({ name: "缺 id" }), /缺少节点 id 或名称/);
  assert.throws(() => mapActionCategoryTree({ categoryId: 1, name: "  " }), /缺少节点 id 或名称/);
});

test("space behavior crud dialogs follow prototype create view edit and delete surfaces", () => {
  const formSource = readSource("../src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue");
  const drawerSource = readSource("../src/views/SpaceBehaviorWorkspace/components/BehaviorDetailDrawer.vue");
  const deleteSource = readSource("../src/views/SpaceBehaviorWorkspace/components/BehaviorDeleteDialog.vue");
  const workspaceSource = readSource("../src/views/SpaceBehaviorWorkspace/index.vue");
  const typeSource = readSource("../src/types/pages/ontologySpaceBehaviorType.ts");

  assert.match(formSource, /创建行为/);
  assert.match(formSource, /el-alert/);
  assert.match(formSource, /getOntologyActionInfoInterface/);
  assert.match(formSource, /mapOntologyActionInfoToFormState/);
  assert.match(formSource, /loadActionInfoForEdit/);
  assert.match(formSource, /已失效行为为只读/);
  assert.match(formSource, /基本信息/);
  assert.match(formSource, /类别/);
  assert.match(formSource, /SPACE_BEHAVIOR_KIND_OPTIONS/);
  assert.match(formSource, /kind === ['"]basic['"]/);
  assert.match(formSource, /kind === ['"]application['"]/);
  assert.match(formSource, /kind === ['"]behaviorTree['"]/);
  assert.match(formSource, /行为描述/);
  assert.match(formSource, /输入行为名称/);
  assert.match(formSource, /行为api名称/);
  assert.match(formSource, /v-model="behaviorApiName"/);
  assert.match(formSource, /:disabled="mode === ['"]edit['"]"/);
  assert.match(formSource, /例如：act\.pv\.weapon\.add/);
  assert.match(formSource, /请完整填写行为名称、行为api名称和行为分类/);
  assert.match(formSource, /behaviorApiName: behaviorApiName\.value\.trim\(\)/);
  assert.match(formSource, /行为分类/);
  assert.match(formSource, /<el-tree-select\b/);
  assert.match(formSource, /:data="categorySelectTree"/);
  assert.match(formSource, /omitActionLeavesFromCategoryTree/);
  assert.match(typeSource, /kind: SpaceBehaviorCategoryNodeKind/);
  assert.match(formSource, /check-strictly/);
  assert.match(formSource, /default-expand-all/);
  assert.match(formSource, /:props="\{ label: 'label', children: 'children' \}"/);
  assert.doesNotMatch(formSource, /v-for="item in categoryOptions"/);
  assert.match(formSource, /行为类型/);
  assert.match(formSource, /基础操作/);
  assert.match(formSource, /showAttributeValueObjectSection/);
  assert.match(
    formSource,
    /showAttributeValueObjectSection = computed\(\(\) => kind\.value === ['"]basic['"] && valueType\.value === ['"]attributeValue['"]\)/,
  );
  assert.match(formSource, /showRelationInstanceSection/);
  assert.match(formSource, /showRelationInstanceSection = computed\(\(\) => kind\.value === ['"]basic['"] && valueType\.value === ['"]relationInstance['"]\)/);
  assert.match(formSource, /showBasicFunctionOperatorSection/);
  assert.match(formSource, /showRelationLinkMappingSection/);
  assert.match(formSource, /basicAction\.value === ['"]create['"] \|\| basicAction\.value === ['"]update['"]/);
  assert.match(formSource, /对象信息/);
  assert.match(formSource, /属性选择/);
  assert.match(formSource, /关系选择/);
  assert.match(formSource, /从当前空间关系中单选一条/);
  assert.match(formSource, /函数基础算子/);
  assert.match(formSource, /参数配置/);
  assert.match(formSource, /getOntologyFunctionDetailInterface/);
  assert.match(formSource, /buildOntologyFunctionTestBindingKeys/);
  assert.match(formSource, /getOntologyPropertyByOntologyIdInterface/);
  assert.match(formSource, /getOntologyRelationCategoryTreeInterface/);
  assert.match(formSource, /mapOntologyRelationLinks/);
  assert.match(formSource, /请选择一条关系/);
  assert.match(formSource, /请选择状态/);
  assert.match(formSource, /请至少添加一条持续时段/);
  assert.match(formSource, /添加时段/);
  assert.match(formSource, /type="datetimerange"/);
  assert.match(formSource, /SPACE_BEHAVIOR_RELATION_TARGET_STATUS_OPTIONS/);
  assert.match(formSource, /selectedRelationId: selectedRelationId\.value\.trim\(\)/);
  assert.match(formSource, /relationTargetStatus:/);
  assert.match(formSource, /relationVisibilityWindows:/);
  assert.match(formSource, /functionOperatorVersion:/);
  assert.match(formSource, /operatorParamBindings:/);
  assert.match(formSource, /operatorParamIds:/);
  assert.match(formSource, /buildOntologyFunctionTestBindingParamIds/);
  assert.match(formSource, /attributeSelectionHint/);
  assert.match(formSource, /resolveAttributeValueSelection/);
  assert.match(formSource, /getOntologyCategoryTreeInterface/);
  assert.match(formSource, /getOntologyObjectArrTypeTreeInterface/);
  assert.match(formSource, /flattenPropertyInfosFromCategoryTree/);
  assert.match(formSource, /handleAttributeSelectionChange/);
  assert.match(formSource, /请选择对象/);
  assert.match(formSource, /请至少选择一项属性/);
  assert.match(formSource, /ontologyIdentifier: ontologyIdentifier\.value\.trim\(\)/);
  assert.match(formSource, /selectedPropertyIds: \[\.\.\.selectedPropertyIds\.value\]/);
  assert.match(formSource, /selectedPropertyValues: buildSelectedPropertyValuesForDraft\(\)/);
  assert.match(formSource, /selectedPropertyApiNames: buildSelectedPropertyApiNamesForDraft\(\)/);
  assert.match(formSource, /storageGroup: storageGroup\.value/);
  const workspaceComposable = readSource("../src/views/SpaceBehaviorWorkspace/composables/useSpaceBehaviorWorkspace.ts");
  const workspaceIndex = readSource("../src/views/SpaceBehaviorWorkspace/index.vue");
  assert.match(workspaceComposable, /postCreateOntologyActionInterface/);
  assert.match(workspaceComposable, /buildPropertyValueCreateActionParams/);
  assert.match(workspaceComposable, /isPropertyValueActionCreateDraft/);
  assert.match(workspaceComposable, /buildLinkCreateActionParams/);
  assert.match(workspaceComposable, /isLinkActionCreateDraft/);
  assert.match(workspaceComposable, /buildBasicOperatorCreateActionParams/);
  assert.match(workspaceComposable, /isBasicOperatorActionCreateDraft/);
  assert.match(workspaceComposable, /putEditOntologyActionInterface/);
  assert.match(workspaceIndex, /await createBehavior/);
  assert.match(workspaceIndex, /await updateBehavior/);
  assert.match(workspaceIndex, /useRemotePropertyValueAction: false/);
  assert.doesNotMatch(formSource, /另存草稿副本/);
  assert.match(formSource, /sourceOntologyId/);
  assert.match(formSource, /新增值/);
  assert.match(formSource, /修改值/);
  assert.match(formSource, /v-if="selectedPropertyIds\.includes\(readPropertyRowId\(row\)\)"/);
  assert.match(formSource, /basicAction === ['"]create['"] \|\| basicAction === ['"]update['"]/);
  assert.match(formSource, /sortPropertyInfosByStorageGroup/);
  assert.match(formSource, /updatePropertyInputValue/);
  assert.match(formSource, /关联函数算子/);
  assert.match(formSource, /构建行为树/);
  assert.match(formSource, /行为树构建后续接入/);
  assert.match(formSource, /保存行为/);
  assert.match(formSource, /min\(1120px, 94vw\)/);
  assert.doesNotMatch(formSource, /基本信息 \/ 输入参数 \/ 输出参数/);
  assert.doesNotMatch(formSource, /变更信息/);
  assert.doesNotMatch(formSource, /请选择函数算子以加载参数/);
  assert.doesNotMatch(formSource, /behavior-form-dialog__nav/);
  assert.match(workspaceSource, /:category-tree="categoryTree"/);
  assert.match(typeSource, /SpaceBehaviorKind/);
  assert.match(typeSource, /SpaceBehaviorValueType/);
  assert.match(typeSource, /ontologyIdentifier: string/);
  assert.match(typeSource, /selectedPropertyIds: string\[\]/);
  assert.match(typeSource, /selectedPropertyValues: Record<string, string>/);
  assert.match(typeSource, /selectedPropertyApiNames: Record<string, string>/);
  assert.match(typeSource, /storageGroup: string/);
  assert.match(typeSource, /functionOperatorVersion: string/);
  assert.match(typeSource, /operatorParamBindings: Record<string, string>/);
  assert.match(typeSource, /operatorParamIds: Record<string, number>/);
  assert.match(typeSource, /selectedRelationId: string/);
  assert.match(typeSource, /relationTargetStatus: SpaceBehaviorRelationTargetStatus \| ""/);
  assert.match(typeSource, /relationVisibilityWindows: SpaceBehaviorRelationVisibilityWindow\[\]/);
  assert.match(typeSource, /SPACE_BEHAVIOR_RELATION_TARGET_STATUS_OPTIONS/);
  assert.match(typeSource, /value: "ENABLE"/);
  assert.match(typeSource, /value: "DELETE"/);
  assert.match(typeSource, /label: "enable"/);
  assert.match(typeSource, /label: "delete"/);
  assert.match(typeSource, /SPACE_BEHAVIOR_KIND_OPTIONS/);
  assert.match(typeSource, /label: "属性值"/);
  assert.match(typeSource, /label: "关系实例"/);
  assert.match(typeSource, /value: "relationInstance"/);
  assert.match(typeSource, /label: "基础函数算子"/);
  assert.match(typeSource, /SPACE_BEHAVIOR_BASIC_ACTION_OPTIONS[\s\S]*label: "新增"[\s\S]*label: "修改"[\s\S]*label: "删除"/);
  assert.doesNotMatch(typeSource, /SPACE_BEHAVIOR_BASIC_ACTION_OPTIONS[\s\S]*label: "查询"/);

  assert.match(drawerSource, /<el-drawer\b/);
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

test("space behavior category form validates the required name before submit", () => {
  const source = readSource("../src/views/SpaceBehaviorWorkspace/components/BehaviorCategoryFormDialog.vue");
  assert.match(source, /:error="nameError"/);
  assert.match(source, /nameError\.value = "请输入分类名称"/);
  assert.match(source, /if \(!trimmed\) \{[\s\S]*return;/);
});

test("space behavior status dialog follows the prototype two-step form", () => {
  const dialogSource = readSource("../src/views/SpaceBehaviorWorkspace/components/BehaviorStatusDialog.vue");
  assert.match(dialogSource, /对象行为状态管理/);
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
  const formSource = readSource("../src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue");
  const statusSource = readSource("../src/views/SpaceBehaviorWorkspace/components/BehaviorStatusDialog.vue");
  const deleteSource = readSource("../src/views/SpaceBehaviorWorkspace/components/BehaviorDeleteDialog.vue");
  const listSource = readSource("../src/views/SpaceBehaviorWorkspace/components/BehaviorListPanel.vue");

  assert.doesNotMatch(formSource, /structuredClone\(props\.behavior/);
  assert.match(formSource, /@update:model-value="emit\('update:modelValue', \$event\)"/);
  assert.match(statusSource, /:close-on-click-modal="false"/);
  assert.match(statusSource, /@update:model-value="emit\('update:modelValue', \$event\)"/);
  assert.match(deleteSource, /:close-on-click-modal="false"/);
  assert.match(listSource, /nextTick/);
  assert.match(listSource, /void nextTick/);
});

test("space behavior operator selection writes operator id and name without structuredClone", () => {
  const formSource = readSource("../src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue");
  const applyBlock = formSource.match(/function applySelectedOperator\(operatorId: string\): void \{[\s\S]*?\n\}/)?.[0] ?? "";

  assert.match(applyBlock, /functionOperatorId\.value = operator\.id/);
  assert.match(applyBlock, /functionOperatorName\.value = operator\.name/);
  assert.doesNotMatch(applyBlock, /inputParameters/);
  assert.doesNotMatch(formSource, /structuredClone\(/);
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
  assert.equal(data.categoryTree[0]?.label, "基础操作");
  assert.equal(data.behaviors[0]?.displayName, "新增对象行为");
  assert.equal(data.behaviors[0]?.executionPeriod, "—");
  assert.doesNotMatch(JSON.stringify(data), /æ|å|ç|Â|â/);
  const childId = data.categoryTree[0]?.children[0]?.id ?? "";
  assert.ok(childId);
  const filtered = filterSpaceBehaviorsByCategory(data.behaviors, data.categoryTree, childId);
  assert.ok(filtered.length > 0);
  assert.ok(filtered.every((item) => item.categoryId === childId || data.categoryTree[0]?.children.some((node) => node.id === item.categoryId)));

  const created = createSpaceBehaviorMock("behavior-test-space", {
    displayName: "单元测试行为",
    behaviorApiName: "act.test.create",
    kind: "basic",
    valueType: "attributeValue",
    functionOperatorId: "operator-create-cvn",
    functionOperatorName: "新增福特级航空母舰(CVN)基础操作",
    functionOperatorVersion: "",
    description: "测试创建",
    categoryId: childId || ROOT_SPACE_BEHAVIOR_CATEGORY_ID,
    status: "draft",
    basicAction: "create",
    ontologyIdentifier: "ontology-test-1",
    operatorParamBindings: {},
    operatorParamIds: {},
    selectedPropertyIds: ["prop-1"],
    selectedPropertyValues: { "prop-1": "demo" },
    selectedPropertyApiNames: { "prop-1": "hull" },
    storageGroup: "test",
    selectedRelationId: "",
    relationTargetStatus: "",
    relationVisibilityWindows: [],
  });
  assert.equal(created.displayName, "单元测试行为");
  assert.equal(created.objectName.length > 0, true);
  const afterCreate = querySpaceBehaviorWorkspaceMock("behavior-test-space");
  assert.ok(afterCreate.behaviors.some((item) => item.id === created.id));
});

test("space behavior flattens propertyInfos from the attribute category tree", () => {
  const rows = flattenPropertyInfosFromCategoryTree({
    categoryId: 1,
    name: "全部属性",
    children: [
      {
        categoryId: 3,
        name: "标识信息",
        propertyInfos: [
          { uniqueIdentifier: "p1", displayName: "舷号", propertyType: "string", storageGroup: "test" },
          { uniqueIdentifier: "p2", displayName: "舰名", propertyType: "string", storageGroup: "test" },
        ],
      },
      {
        categoryId: 2,
        name: "物理特征",
        propertyInfos: [
          { uniqueIdentifier: "p2", displayName: "舰名-重复", propertyType: "string", storageGroup: "test" },
          { uniqueIdentifier: "p3", displayName: "全长", propertyType: "number", storageGroup: "main" },
        ],
        children: [{ categoryId: 4, name: "尺度" }],
      },
    ],
  });
  assert.equal(rows.length, 3);
  assert.deepEqual(
    rows.map((item) => item.uniqueIdentifier),
    ["p1", "p2", "p3"],
  );
  assert.equal(flattenPropertyInfosFromCategoryTree(null).length, 0);
});

test("space behavior builds property-value createAction params for create update and delete", () => {
  const baseDraft = {
    displayName: "武器行-新增",
    behaviorApiName: "act.pv.weapon.add",
    kind: "basic",
    valueType: "attributeValue",
    functionOperatorId: "",
    functionOperatorName: "",
    functionOperatorVersion: "",
    description: "desc",
    categoryId: "14",
    status: "draft",
    basicAction: "create",
    ontologyIdentifier: "onto-1",
    operatorParamBindings: {},
    operatorParamIds: {},
    selectedPropertyIds: ["p1", "p2"],
    selectedPropertyValues: { p1: "120.5", p2: "" },
    selectedPropertyApiNames: { p1: "w_range", p2: "w_name" },
    storageGroup: "weapon",
    selectedRelationId: "",
    relationTargetStatus: "",
    relationVisibilityWindows: [],
  };
  assert.equal(isPropertyValueActionCreateDraft(baseDraft), true);
  const created = buildPropertyValueCreateActionParams(baseDraft);
  assert.equal("error" in created, false);
  if (!("error" in created)) {
    assert.equal(created.actionKind, "BASE");
    assert.equal(created.subjectType, "PROPERTY_VALUE");
    assert.equal(created.operation, "CREATE");
    assert.equal(created.categoryId, 14);
    assert.equal(created.mappingIns.length, 2);
    assert.equal(created.mappingIns[0]?.sourceType, "FIXED");
    assert.equal(created.mappingIns[0]?.sourceConfig, "120.5");
    assert.equal(created.mappingIns[0]?.parameterName, "w_range");
    assert.equal(created.mappingIns[1]?.sourceConfig, "");
  }

  const updated = buildPropertyValueCreateActionParams({ ...baseDraft, basicAction: "update", description: "  " });
  assert.equal("error" in updated, false);
  if (!("error" in updated)) {
    assert.equal(updated.operation, "UPDATE");
    assert.equal("description" in updated, false);
  }

  const deleted = buildPropertyValueCreateActionParams({ ...baseDraft, basicAction: "delete", behaviorApiName: "act.pv.weapon.del" });
  assert.equal("error" in deleted, false);
  if (!("error" in deleted)) {
    assert.equal(deleted.operation, "DELETE");
    assert.deepEqual(Object.keys(deleted.mappingIns[0] ?? {}).sort(), ["ontologyUniqueIdentifier", "propertyUniqueIdentifier"]);
  }

  assert.equal(isPropertyValueActionCreateDraft({ ...baseDraft, kind: "application" }), false);
  assert.equal(isPropertyValueActionCreateDraft({ ...baseDraft, valueType: "relationInstance" }), false);
  assert.equal(isPropertyValueActionCreateDraft({ ...baseDraft, basicAction: "query" }), false);

  assert.equal("error" in buildPropertyValueCreateActionParams({ ...baseDraft, categoryId: "behavior-root" }), true);
  assert.equal("error" in buildPropertyValueCreateActionParams({ ...baseDraft, ontologyIdentifier: "  " }), true);
  assert.equal("error" in buildPropertyValueCreateActionParams({ ...baseDraft, behaviorApiName: "" }), true);
  assert.equal("error" in buildPropertyValueCreateActionParams({ ...baseDraft, displayName: " " }), true);
  assert.equal("error" in buildPropertyValueCreateActionParams({ ...baseDraft, storageGroup: "" }), true);
  assert.equal("error" in buildPropertyValueCreateActionParams({ ...baseDraft, selectedPropertyIds: [] }), true);
  assert.equal("error" in buildPropertyValueCreateActionParams({ ...baseDraft, basicAction: "query" }), true);

  const withoutApiName = buildPropertyValueCreateActionParams({
    ...baseDraft,
    selectedPropertyApiNames: { p1: "  ", p2: "" },
  });
  assert.equal("error" in withoutApiName, false);
  if (!("error" in withoutApiName)) {
    assert.equal("parameterName" in (withoutApiName.mappingIns[0] ?? {}), false);
  }
});

test("space behavior builds link createAction params for create update and delete", () => {
  const baseDraft = {
    displayName: "搭载关系-新增",
    behaviorApiName: "act.lk.carry.create",
    kind: "basic",
    valueType: "relationInstance",
    functionOperatorId: "",
    functionOperatorName: "",
    functionOperatorVersion: "",
    description: "desc",
    categoryId: "14",
    status: "draft",
    basicAction: "create",
    ontologyIdentifier: "onto-from",
    operatorParamBindings: {},
    operatorParamIds: {},
    selectedPropertyIds: [],
    selectedPropertyValues: {},
    selectedPropertyApiNames: {},
    storageGroup: "",
    selectedRelationId: "link-1",
    relationTargetStatus: "ENABLE",
    relationVisibilityWindows: [{ startTime: 1767225600000, endTime: 1798761599000 }],
  };
  assert.equal(isLinkActionCreateDraft(baseDraft), true);
  assert.equal(isPropertyValueActionCreateDraft(baseDraft), false);

  const created = buildLinkCreateActionParams(baseDraft);
  assert.equal("error" in created, false);
  if (!("error" in created)) {
    assert.equal(created.subjectType, "LINK");
    assert.equal(created.operation, "CREATE");
    assert.equal(created.ontologyIdentifier, "onto-from");
    assert.equal("storageGroup" in created, false);
    assert.equal("mappingIns" in created, false);
    assert.deepEqual(created.linkMapping, {
      ontologyLinkUniqIdentifier: "link-1",
      targetStatus: "ENABLE",
      visibilityWindows: [{ startTime: 1767225600000, endTime: 1798761599000 }],
    });
  }

  const updated = buildLinkCreateActionParams({
    ...baseDraft,
    basicAction: "update",
    relationTargetStatus: "DELETE",
    relationVisibilityWindows: [],
    description: "  ",
  });
  assert.equal("error" in updated, false);
  if (!("error" in updated)) {
    assert.equal(updated.operation, "UPDATE");
    assert.deepEqual(updated.linkMapping, {
      ontologyLinkUniqIdentifier: "link-1",
      targetStatus: "DELETE",
    });
    assert.equal("visibilityWindows" in (updated.linkMapping ?? {}), false);
  }

  const updatedWithWindows = buildLinkCreateActionParams({
    ...baseDraft,
    basicAction: "update",
    relationTargetStatus: "ENABLE",
  });
  assert.equal("error" in updatedWithWindows, false);
  if (!("error" in updatedWithWindows)) {
    assert.equal(updatedWithWindows.linkMapping?.visibilityWindows?.length, 1);
  }

  const deleted = buildLinkCreateActionParams({
    ...baseDraft,
    basicAction: "delete",
    behaviorApiName: "act.lk.carry.delete",
    relationTargetStatus: "",
    relationVisibilityWindows: [{ startTime: 1, endTime: 2 }],
  });
  assert.equal("error" in deleted, false);
  if (!("error" in deleted)) {
    assert.equal(deleted.operation, "DELETE");
    assert.deepEqual(deleted.linkMapping, { ontologyLinkUniqIdentifier: "link-1" });
  }

  assert.equal(isLinkActionCreateDraft({ ...baseDraft, valueType: "attributeValue" }), false);
  assert.equal("error" in buildLinkCreateActionParams({ ...baseDraft, selectedRelationId: " " }), true);
  assert.equal("error" in buildLinkCreateActionParams({ ...baseDraft, ontologyIdentifier: "" }), true);
  assert.equal("error" in buildLinkCreateActionParams({ ...baseDraft, relationTargetStatus: "" }), true);
  assert.equal("error" in buildLinkCreateActionParams({ ...baseDraft, relationVisibilityWindows: [] }), true);
  assert.equal("error" in buildLinkCreateActionParams({ ...baseDraft, basicAction: "update", relationTargetStatus: "" }), true);
});

test("space behavior maps action info detail into edit form state", () => {
  const propertyState = mapOntologyActionInfoToFormState({
    id: 1,
    actionApi: "act.pv.weapon.add",
    displayName: "武器行-新增",
    description: "desc",
    ontologyUniqIdentifier: "onto-1",
    categoryId: 14,
    status: 1,
    actionKind: "BASE",
    subjectType: "PROPERTY_VALUE",
    operation: "CREATE",
    storageGroup: "weapon",
    functionApi: null,
    functionDescription: null,
    outputMode: null,
    linkMapping: null,
    mappingIns: [
      {
        propertyUniqueIdentifier: "p1",
        ontologyUniqueIdentifier: "onto-1",
        parameterName: "w_range",
        sourceType: "FIXED",
        sourceConfig: "120.5",
      },
    ],
    functionParams: [],
  });
  assert.equal(propertyState.valueType, "attributeValue");
  assert.equal(propertyState.basicAction, "create");
  assert.equal(propertyState.ontologyIdentifier, "onto-1");
  assert.deepEqual(propertyState.selectedPropertyIds, ["p1"]);
  assert.equal(propertyState.selectedPropertyValues.p1, "120.5");
  assert.equal(propertyState.selectedPropertyApiNames.p1, "w_range");
  assert.equal(propertyState.unsupportedEditReason, "");

  const linkState = mapOntologyActionInfoToFormState({
    id: 2,
    actionApi: "act.lk.carry.create",
    displayName: "搭载关系",
    description: "",
    ontologyUniqIdentifier: "onto-from",
    categoryId: 14,
    status: 1,
    actionKind: "BASE",
    subjectType: "LINK",
    operation: "UPDATE",
    storageGroup: null,
    functionApi: null,
    functionDescription: null,
    outputMode: null,
    linkMapping: {
      ontologyLinkUniqIdentifier: "link-1",
      targetStatus: "ENABLE",
      visibilityWindows: [{ startTime: 10, endTime: 20 }],
    },
    mappingIns: [],
    functionParams: [],
  });
  assert.equal(linkState.valueType, "relationInstance");
  assert.equal(linkState.basicAction, "update");
  assert.equal(linkState.selectedRelationId, "link-1");
  assert.equal(linkState.relationTargetStatus, "ENABLE");
  assert.deepEqual(linkState.relationVisibilityWindows, [{ startTime: 10, endTime: 20 }]);

  const operatorState = mapOntologyActionInfoToFormState({
    id: 3,
    actionApi: "act.bo.aircraft",
    displayName: "基础算子",
    description: "",
    ontologyUniqIdentifier: "onto-1",
    categoryId: 14,
    status: 0,
    actionKind: "BASE",
    subjectType: "BASIC_OPERATOR",
    operation: null,
    storageGroup: null,
    functionApi: "act.bq.aircraft",
    functionDescription: "查飞机",
    outputMode: "RESULT_ONLY",
    linkMapping: null,
    mappingIns: [
      {
        functionParamId: 2292,
        parameterName: "nm",
        sourceType: "FIXED",
        sourceConfig: "name",
      },
    ],
    functionParams: [],
  });
  assert.equal(operatorState.valueType, "basicFunctionOperator");
  assert.equal(operatorState.status, "disabled");
  assert.equal(operatorState.functionOperatorId, "act.bq.aircraft");
  assert.equal(operatorState.operatorParamBindings.nm, "name");
  assert.equal(operatorState.operatorParamIds.nm, 2292);

  const applicationState = mapOntologyActionInfoToFormState({
    id: 8,
    actionApi: "act.ap.obj.nested",
    displayName: "应用行为",
    description: "",
    ontologyUniqIdentifier: "onto-1",
    categoryId: 14,
    status: 1,
    actionKind: "APPLICATION",
    subjectType: null,
    operation: null,
    storageGroup: null,
    functionApi: "act.fn.obj",
    functionDescription: "OBJECT",
    outputMode: "RESULT_ONLY",
    linkMapping: null,
    mappingIns: [],
    functionParams: [],
  });
  assert.equal(applicationState.kind, "application");
  assert.match(applicationState.unsupportedEditReason, /应用行为/);
});

test("space behavior builds basic-operator createAction params with FIXED apiName bindings", () => {
  const baseDraft = {
    displayName: "基础算子-查飞机",
    behaviorApiName: "act.bo.aircraft",
    kind: "basic",
    valueType: "basicFunctionOperator",
    functionOperatorId: "act.bq.aircraft",
    functionOperatorName: "查飞机",
    functionOperatorVersion: "1.0.0",
    description: "基础算子行为：绑定 BASIC_QUERY",
    categoryId: "14",
    status: "draft",
    basicAction: "create",
    ontologyIdentifier: "ea512d439cd34c6ebbcde6b692261ab5",
    operatorParamBindings: { nm: "name" },
    operatorParamIds: { nm: 2292 },
    selectedPropertyIds: [],
    selectedPropertyValues: {},
    selectedPropertyApiNames: {},
    storageGroup: "",
    selectedRelationId: "",
    relationTargetStatus: "",
    relationVisibilityWindows: [],
  };
  assert.equal(isBasicOperatorActionCreateDraft(baseDraft), true);
  assert.equal(isPropertyValueActionCreateDraft(baseDraft), false);
  assert.equal(isLinkActionCreateDraft(baseDraft), false);

  const created = buildBasicOperatorCreateActionParams(baseDraft);
  assert.equal("error" in created, false);
  if (!("error" in created)) {
    assert.equal(created.actionKind, "BASE");
    assert.equal(created.subjectType, "BASIC_OPERATOR");
    assert.equal(created.functionApi, "act.bq.aircraft");
    assert.equal(created.outputMode, "RESULT_ONLY");
    assert.equal(created.categoryId, 14);
    assert.equal(created.ontologyIdentifier, "ea512d439cd34c6ebbcde6b692261ab5");
    assert.equal("operation" in created, false);
    assert.equal("storageGroup" in created, false);
    assert.equal("linkMapping" in created, false);
    assert.deepEqual(created.mappingIns, [
      {
        functionParamId: 2292,
        parameterName: "nm",
        sourceType: "FIXED",
        sourceConfig: "name",
      },
    ]);
  }

  const withoutBindings = buildBasicOperatorCreateActionParams({
    ...baseDraft,
    operatorParamBindings: {},
    operatorParamIds: {},
    description: "  ",
  });
  assert.equal("error" in withoutBindings, false);
  if (!("error" in withoutBindings)) {
    assert.equal("mappingIns" in withoutBindings, false);
    assert.equal("description" in withoutBindings, false);
  }

  assert.equal(isBasicOperatorActionCreateDraft({ ...baseDraft, kind: "application" }), false);
  assert.equal(isBasicOperatorActionCreateDraft({ ...baseDraft, valueType: "attributeValue" }), false);
  assert.equal("error" in buildBasicOperatorCreateActionParams({ ...baseDraft, categoryId: "behavior-root" }), true);
  assert.equal("error" in buildBasicOperatorCreateActionParams({ ...baseDraft, ontologyIdentifier: "  " }), true);
  assert.equal("error" in buildBasicOperatorCreateActionParams({ ...baseDraft, behaviorApiName: "" }), true);
  assert.equal("error" in buildBasicOperatorCreateActionParams({ ...baseDraft, displayName: " " }), true);
  assert.equal("error" in buildBasicOperatorCreateActionParams({ ...baseDraft, functionOperatorId: "" }), true);
  assert.equal("error" in buildBasicOperatorCreateActionParams({ ...baseDraft, operatorParamBindings: { nm: "  " } }), true);
  assert.equal("error" in buildBasicOperatorCreateActionParams({ ...baseDraft, operatorParamIds: {} }), true);
});

test("space behavior sorts attribute rows by storage group while keeping relative order", () => {
  const sorted = sortPropertyInfosByStorageGroup([
    { uniqueIdentifier: "a1", displayName: "a1", storageGroup: "type" },
    { uniqueIdentifier: "m1", displayName: "m1", storageGroup: "main" },
    { uniqueIdentifier: "a2", displayName: "a2", storageGroup: "type" },
    { uniqueIdentifier: "m2", displayName: "m2", storageGroup: "main" },
    { uniqueIdentifier: "z1", displayName: "z1", storageGroup: "weapon" },
  ]);
  assert.deepEqual(
    sorted.map((item) => item.uniqueIdentifier),
    ["m1", "m2", "a1", "a2", "z1"],
  );
});

test("space behavior attribute value selection follows create update and delete rules", () => {
  const rows = [
    { uniqueIdentifier: "p1", displayName: "舷号", propertyType: "string", storageGroup: "test" },
    { uniqueIdentifier: "p2", displayName: "舰名", propertyType: "string", storageGroup: "test" },
    { uniqueIdentifier: "p3", displayName: "全长", propertyType: "number", storageGroup: "main" },
    { uniqueIdentifier: "p4", displayName: "服役时间", propertyType: "string", storageGroup: "main" },
  ];

  assert.equal(isAttributeValueRowSelectable("create", rows[2], false), false);
  assert.equal(isAttributeValueRowSelectable("delete", rows[2], false), false);
  assert.equal(isAttributeValueRowSelectable("update", rows[2], false), true);

  const created = resolveAttributeValueSelection({
    basicAction: "create",
    previousIds: [],
    selection: [rows[0]],
    allRows: rows,
  });
  assert.deepEqual(
    created.selectedRows.map((item) => item.uniqueIdentifier),
    ["p1", "p2"],
  );
  assert.equal(created.storageGroup, "test");

  const createMain = resolveAttributeValueSelection({
    basicAction: "create",
    previousIds: [],
    selection: [rows[2]],
    allRows: rows,
  });
  assert.equal(createMain.selectedRows.length, 0);
  assert.match(createMain.warning, /main/);

  const updated = resolveAttributeValueSelection({
    basicAction: "update",
    previousIds: [],
    selection: [rows[0]],
    allRows: rows,
  });
  assert.deepEqual(
    updated.selectedRows.map((item) => item.uniqueIdentifier),
    ["p1"],
  );

  const updateCrossGroup = resolveAttributeValueSelection({
    basicAction: "update",
    previousIds: ["p1"],
    selection: [rows[0], rows[2]],
    allRows: rows,
  });
  assert.deepEqual(
    updateCrossGroup.selectedRows.map((item) => item.uniqueIdentifier),
    ["p3"],
  );
  assert.match(updateCrossGroup.warning, /同一存储分组/);

  const deleted = resolveAttributeValueSelection({
    basicAction: "delete",
    previousIds: [],
    selection: [rows[1]],
    allRows: rows,
  });
  assert.deepEqual(
    deleted.selectedRows.map((item) => item.uniqueIdentifier),
    ["p1", "p2"],
  );

  const deletePartial = resolveAttributeValueSelection({
    basicAction: "delete",
    previousIds: ["p1", "p2"],
    selection: [rows[0]],
    allRows: rows,
  });
  assert.equal(deletePartial.selectedRows.length, 0);
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
