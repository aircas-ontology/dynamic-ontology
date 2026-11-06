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
import {
  buildApplicationCreateActionParams,
  buildApplicationOutputFunctionParamExpression,
  isApplicationActionCreateDraft,
} from "../src/views/SpaceBehaviorWorkspace/utils/buildApplicationCreateActionParams.ts";
import {
  applyApplicationActionInfoBindings,
  findApplicationParamRowForBindingSeed,
} from "../src/views/SpaceBehaviorWorkspace/utils/applyApplicationActionInfoBindings.ts";
import { mapOntologyActionInfoToFormState } from "../src/views/SpaceBehaviorWorkspace/utils/mapOntologyActionInfoToFormState.ts";
import { mapOntologyActionInfoToViewState } from "../src/views/SpaceBehaviorWorkspace/utils/mapOntologyActionInfoToViewState.ts";
import { coerceBehaviorTestParamValue } from "../src/views/SpaceBehaviorWorkspace/utils/coerceBehaviorTestParamValue.ts";
import { mapOntologyEntityRowDetailToDataRows } from "../src/views/SpaceBehaviorWorkspace/utils/mapOntologyEntityRowDetailToDataRows.ts";

const EMPTY_APPLICATION_DRAFT_FIELDS = {
  applicationInputRows: [],
  applicationOutputRows: [],
  applicationInputBindings: {},
  applicationOutputBindings: {},
};
import {
  flattenApplicationFunctionInputRows,
  flattenApplicationFunctionOutputRows,
  mapFunctionParamTypeLabel,
} from "../src/views/SpaceBehaviorWorkspace/utils/flattenApplicationFunctionParamRows.ts";

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
  assert.match(listSource, /label="行为类别"/);
  assert.match(listSource, /formatBehaviorCategoryLabel/);
  assert.match(listSource, /SPACE_BEHAVIOR_VALUE_TYPE_LABELS/);
  assert.match(listSource, /\$\{kindLabel\}-\$\{valueTypeLabel\}/);
  assert.match(listSource, /label="描述"/);
  assert.match(listSource, /label="函数算子"/);
  assert.match(listSource, /functionOperatorName/);
  assert.match(listSource, /label="apiName"/);
  assert.match(listSource, /behaviorApiName/);
  assert.match(listSource, /label="状态"/);
  assert.match(listSource, /label="更新时间"/);
  assert.doesNotMatch(listSource, /label="类别"/);
  assert.doesNotMatch(listSource, /label="行为类型"/);
  assert.match(listSource, /SPACE_BEHAVIOR_KIND_LABELS/);
  assert.match(listSource, /新建行为/);
  assert.match(listSource, />测试</);
  assert.match(listSource, /emit\('test'/);
  assert.match(workspaceSource, /@test="openBehaviorTest"/);
  assert.match(workspaceSource, /BehaviorTestDialog/);
  assert.match(workspaceSource, /:space-id="spaceId"/);
  assert.match(workspaceSource, /behaviorTestVisible/);
  assert.match(workspaceSource, /当前仅支持基础行为-属性值\/基础函数算子\/关系实例测试/);
  assert.match(workspaceSource, /basicFunctionOperator/);
  assert.match(workspaceSource, /relationInstance/);
  assert.match(workspaceSource, /valueType !== "basicFunctionOperator"/);
  assert.match(workspaceSource, /当前行为缺少对象标识，无法加载实体列表/);
  const testDialogSource = readSource("../src/views/SpaceBehaviorWorkspace/components/BehaviorTestDialog.vue");
  assert.match(testDialogSource, /getOntologyEntitiesInterface/);
  assert.match(testDialogSource, /getOntologyActionInfoInterface/);
  assert.match(testDialogSource, /getOntologyLinkByUniqueIdentifierInterface/);
  assert.match(testDialogSource, /postTestOntologyActionInterface/);
  assert.match(testDialogSource, /ontologyUniqueIdentifier/);
  assert.match(testDialogSource, /ontologyUniqIdentifier/);
  assert.match(testDialogSource, /选择实体实例/);
  assert.match(testDialogSource, /测试参数/);
  assert.match(testDialogSource, /isBasicFunctionOperatorTest/);
  assert.match(testDialogSource, /isAttributeValueTest/);
  assert.match(testDialogSource, /isRelationInstanceTest/);
  assert.match(testDialogSource, /确认后直接执行基础函数算子测试/);
  assert.match(testDialogSource, /basicOperatorTestResultText/);
  assert.match(testDialogSource, /formatBasicOperatorTestResultData/);
  assert.match(testDialogSource, /type="textarea"/);
  assert.match(testDialogSource, /readonly/);
  assert.match(testDialogSource, /v-else-if="!isBasicFunctionOperatorTest"/);
  assert.match(testDialogSource, /选择关系两端对象实例后执行关系实例测试/);
  assert.match(testDialogSource, /关系两端对象/);
  assert.match(testDialogSource, /ontologyNameFrom/);
  assert.match(testDialogSource, /ontologyNameTo/);
  assert.match(testDialogSource, /ontologyLinkUniqIdentifier/);
  assert.match(testDialogSource, /linkEntityPrimaryKey/);
  assert.match(testDialogSource, /loadRelationTestContext/);
  assert.match(testDialogSource, /v-if="isAttributeValueTest && !isDeleteTest"/);
  assert.match(testDialogSource, /isAttributeValueTest\.value/);
  assert.match(testDialogSource, /sourceType === "EXTERNAL"/);
  assert.match(testDialogSource, /label="属性名称"/);
  assert.match(testDialogSource, /propertyDisplayName/);
  assert.match(testDialogSource, /propertyType/);
  assert.match(testDialogSource, /coerceBehaviorTestParamValue/);
  assert.match(testDialogSource, /查看实例数据/);
  assert.match(testDialogSource, /查看实例关系数据/);
  assert.match(testDialogSource, /openEntityLinkData/);
  assert.match(testDialogSource, /BehaviorEntityLinkDataDialog/);
  assert.match(testDialogSource, /entityLinkDataQueryParams/);
  assert.match(testDialogSource, /ontologyUniqueIdentifierFrom:/);
  assert.match(testDialogSource, /entityPrimaryKeyFrom:/);
  assert.match(testDialogSource, /ontologyUniqueIdentifierTo:/);
  assert.match(testDialogSource, /entityPrimaryKeyTo:/);
  assert.match(testDialogSource, /link_between/);
  assert.match(testDialogSource, /BehaviorEntityRowDetailDialog/);
  assert.match(testDialogSource, /openEntityRowDetail/);
  const linkDataDialogSource = readSource("../src/views/SpaceBehaviorWorkspace/components/BehaviorEntityLinkDataDialog.vue");
  assert.match(linkDataDialogSource, /postOntologyEntityAllLinkInterface/);
  assert.match(linkDataDialogSource, /link_between/);
  assert.match(linkDataDialogSource, /关系名称/);
  assert.match(linkDataDialogSource, /状态/);
  assert.match(linkDataDialogSource, /持续时间/);
  assert.match(linkDataDialogSource, /listVisibilityWindows/);
  assert.match(linkDataDialogSource, /formatLinkStatus/);
  assert.match(linkDataDialogSource, /暂无实例关系数据/);
  assert.match(linkDataDialogSource, /实例关系数据/);
  assert.match(testDialogSource, /entityPrimaryKey/);
  assert.match(testDialogSource, /isUpdateTest/);
  assert.match(testDialogSource, /isDeleteTest/);
  assert.match(testDialogSource, /needsDataRowSelection/);
  assert.match(testDialogSource, /选择数据行/);
  assert.match(testDialogSource, /postGetOntologyEntityRowDetailInterface/);
  assert.match(testDialogSource, /mapOntologyEntityRowDetailToDataRows/);
  assert.match(testDialogSource, /dataPrimaryKey/);
  assert.match(testDialogSource, /当前仅支持属性值-新增\/编辑\/删除、基础函数算子或关系实例测试/);
  assert.match(testDialogSource, /属性值-删除测试/);
  assert.match(testDialogSource, /!isDeleteTest\.value/);
  assert.match(testDialogSource, /behaviorApiName/);
  assert.match(testDialogSource, /props\.behavior\?\.valueType/);
  assert.match(testDialogSource, /开始测试/);
  assert.match(testDialogSource, /<el-pagination\b/);
  const entityRowDetailSource = readSource("../src/views/SpaceBehaviorWorkspace/components/BehaviorEntityRowDetailDialog.vue");
  assert.match(entityRowDetailSource, /postGetOntologyEntityRowDetailInterface/);
  assert.match(entityRowDetailSource, /sort: "DESC"/);
  assert.match(entityRowDetailSource, /propertyGroups/);
  assert.match(entityRowDetailSource, /dataPrimaryKey/);
  assert.match(entityRowDetailSource, /propertyDisplayName/);
  const mapDataRowsSource = readSource("../src/views/SpaceBehaviorWorkspace/utils/mapOntologyEntityRowDetailToDataRows.ts");
  assert.match(mapDataRowsSource, /export function mapOntologyEntityRowDetailToDataRows/);
  assert.match(mapDataRowsSource, /dataPrimaryKey/);
  assert.match(mapDataRowsSource, /storageGroup/);
  assert.match(mapDataRowsSource, /normalizeStorageGroupName/);
  assert.match(mapDataRowsSource, /storageGroupFilter/);
  assert.match(testDialogSource, /resolvedStorageGroup/);
  assert.match(testDialogSource, /行为未配置存储分组，无法选择数据行/);
  assert.match(testDialogSource, /isMainStorageGroup/);
  assert.match(testDialogSource, /isMainGroupDataRowLocked/);
  assert.match(testDialogSource, /applyLockedMainGroupDataRowSelection/);
  assert.match(testDialogSource, /:disabled="isMainGroupDataRowLocked"/);
  assert.match(testDialogSource, /isUpdateTest\.value && isMainStorageGroup\(resolvedStorageGroup\.value\)/);
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

test("space behavior maps listAction records to table rows with published draft status", () => {
  const published = mapListOntologyActionRecord({
    id: 1,
    actionApi: "act.pv.weapon.add",
    displayName: "武器行-新增",
    description: "属性值行为：向 weapon 分组新增一行",
    ontologyUniqIdentifier: "ea512d439cd34c6ebbcde6b692261ab5",
    categoryId: 14,
    status: 1,
    updateTime: "2026-11-06 15:23:36",
    actionKind: "BASE",
    subjectType: "PROPERTY_VALUE",
    operation: "CREATE",
    storageGroup: "weapon",
    functionApi: null,
    functionDescription: null,
    outputMode: null,
  });
  assert.equal(published.displayName, "武器行-新增");
  assert.equal(published.behaviorApiName, "act.pv.weapon.add");
  assert.equal(published.functionOperatorName, "-");
  assert.equal(published.status, "published");
  assert.equal(published.ontologyUniqIdentifier, "ea512d439cd34c6ebbcde6b692261ab5");
  assert.equal(mapSpaceBehaviorItemToListStatus(published.status), "published");
  assert.equal(published.updatedAt, "2026-11-06 15:23:36");
  assert.equal(published.kind, "basic");
  assert.equal(published.valueType, "attributeValue");
  assert.equal(published.basicAction, "create");

  const draft = mapListOntologyActionRecord({
    id: 2,
    actionApi: "fn.demo",
    displayName: "草稿行为",
    description: "desc",
    ontologyUniqIdentifier: "oid",
    categoryId: 11,
    status: 2,
    updateTime: "  ",
    actionKind: "APPLICATION",
    subjectType: "BASIC_OPERATOR",
    operation: "UPDATE",
    storageGroup: "",
    functionApi: "op.api",
    functionDescription: "算子说明",
    outputMode: null,
  });
  assert.equal(draft.status, "draft");
  assert.equal(mapSpaceBehaviorItemToListStatus(draft.status), "draft");
  assert.equal(draft.functionOperatorName, "op.api");
  assert.equal(draft.kind, "application");
  assert.equal(draft.basicAction, "update");
  assert.equal(draft.updatedAt, "-");
  assert.equal(mapSpaceBehaviorListStatusToQuery("published"), 1);
  assert.equal(mapSpaceBehaviorListStatusToQuery("draft"), 2);
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
  assert.equal(linkAction.updatedAt, "-");
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
  assert.match(formSource, /getOntologyActionInfoInterface\(\{ actionApi, ontologySpaceId \}\)/);
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
  assert.match(formSource, /listSpaceBehaviorRelationTargetStatusOptions/);
  assert.match(formSource, /relationTargetStatusOptions/);
  assert.match(formSource, /selectedRelationId: isApplication/);
  assert.match(formSource, /showApplicationRelationSection\.value/);
  assert.match(formSource, /selectedRelationId\.value\.trim\(\)/);
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
  assert.match(workspaceComposable, /buildApplicationCreateActionParams/);
  assert.match(workspaceComposable, /isApplicationActionCreateDraft/);
  assert.match(workspaceComposable, /putEditOntologyActionInterface/);
  assert.match(
    workspaceComposable,
    /isApplicationActionCreateDraft\(draft\)[\s\S]*buildApplicationCreateActionParams\(draft\)[\s\S]*putEditOntologyActionInterface/,
  );
  assert.match(formSource, /applyApplicationActionInfoBindings/);
  assert.match(formSource, /applicationBindingSeeds/);
  assert.match(workspaceIndex, /await createBehavior/);
  assert.match(workspaceIndex, /await updateBehavior/);
  assert.match(workspaceIndex, /useRemotePropertyValueAction: false/);
  assert.doesNotMatch(formSource, /另存草稿副本/);
  assert.match(formSource, /sourceOntologyId/);
  assert.doesNotMatch(formSource, /新增值/);
  assert.doesNotMatch(formSource, /修改值/);
  assert.doesNotMatch(formSource, /updatePropertyInputValue/);
  assert.match(formSource, /sortPropertyInfosByStorageGroup/);
  assert.match(formSource, /关联函数算子/);
  assert.match(formSource, /excludeTypes: "BASIC_QUERY"/);
  assert.match(formSource, /types: "BASIC_QUERY"/);
  assert.match(formSource, /loadApplicationOperatorDetail/);
  assert.match(formSource, /flattenApplicationFunctionInputRows/);
  assert.match(formSource, /flattenApplicationFunctionOutputRows/);
  assert.match(formSource, /applicationInputRows/);
  assert.match(formSource, /applicationOutputRows/);
  assert.match(formSource, /label="输入来源"/);
  assert.match(formSource, /label="输出方式"/);
  assert.match(formSource, /v-if="!row\.isObject"/);
  assert.match(formSource, /SPACE_BEHAVIOR_APPLICATION_INPUT_SOURCE_OPTIONS/);
  assert.match(formSource, /updateApplicationInputSourceType/);
  assert.match(formSource, /updateApplicationInputOntologyId/);
  assert.match(formSource, /ensureApplicationPropertyOptions/);
  assert.match(formSource, /请先选择对象/);
  assert.match(formSource, /选择读取属性/);
  assert.match(formSource, /item\.propertyType/);
  assert.match(formSource, /\$\{nameLabel\} · \$\{propertyType\}/);
  assert.match(formSource, /sourceType === ['"]FIXED['"]/);
  assert.match(formSource, /启用默认值/);
  assert.match(formSource, /placeholder='例如: \{"target":"A"\}'/);
  assert.match(formSource, /SPACE_BEHAVIOR_APPLICATION_OUTPUT_MODE_OPTIONS/);
  assert.match(formSource, /updateApplicationOutputMode/);
  assert.match(formSource, /updateApplicationOutputOntologyId/);
  assert.match(formSource, /返回算子结果，不写入本体属性/);
  assert.match(formSource, /选择写入属性/);
  assert.match(formSource, /behavior-form-dialog__object-property-pickers/);
  assert.match(formSource, /绑定关系/);
  assert.match(formSource, /showApplicationRelationSection/);
  assert.match(formSource, /hasApplicationWritePropertyOutput/);
  assert.match(formSource, /selectApplicationRelationRow/);
  assert.match(formSource, /handleApplicationRelationRowClick/);
  assert.match(formSource, /formatApplicationRelationMapping/);
  assert.match(formSource, /可选；从当前空间关系中单选一条，可再次点击取消/);
  assert.match(formSource, /selectedRelationId\.value === nextId \? "" : nextId/);
  assert.match(formSource, /watch\(showApplicationRelationSection/);
  assert.match(formSource, /@click\.stop="selectApplicationRelationRow\(row\.id\)"/);
  assert.match(formSource, /buildApplicationCreateActionParams/);
  assert.match(formSource, /applicationInputBindings/);
  assert.match(formSource, /applicationOutputBindings/);
  assert.doesNotMatch(formSource, /placeholder="后续可选"/);
  assert.doesNotMatch(formSource, /label="配置状态"/);
  assert.doesNotMatch(formSource, /待完善/);
  assert.match(typeSource, /SpaceBehaviorApplicationInputSourceType/);
  assert.match(typeSource, /SpaceBehaviorApplicationParamRowSnapshot/);
  assert.match(typeSource, /applicationInputRows: SpaceBehaviorApplicationParamRowSnapshot\[\]/);
  assert.match(typeSource, /SPACE_BEHAVIOR_APPLICATION_INPUT_SOURCE_OPTIONS/);
  assert.match(typeSource, /ontologyUniqueIdentifier: string/);
  assert.match(typeSource, /label: "对象属性"/);
  assert.match(typeSource, /label: "固定值"/);
  assert.match(typeSource, /label: "外部输入"/);
  assert.match(typeSource, /SpaceBehaviorApplicationOutputMode/);
  assert.match(typeSource, /SPACE_BEHAVIOR_APPLICATION_OUTPUT_MODE_OPTIONS/);
  assert.match(typeSource, /label: "仅返回结果"/);
  assert.match(typeSource, /label: "写入对象属性"/);
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
  assert.match(typeSource, /ontologyUniqIdentifier: string/);
  assert.match(typeSource, /SPACE_BEHAVIOR_RELATION_TARGET_STATUS_OPTIONS/);
  assert.match(typeSource, /listSpaceBehaviorRelationTargetStatusOptions/);
  assert.match(typeSource, /value: "ENABLE"/);
  assert.match(typeSource, /value: "DISABLE"/);
  assert.match(typeSource, /value: "DELETE"/);
  assert.match(typeSource, /label: "enable"/);
  assert.match(typeSource, /label: "disable"/);
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
  assert.match(drawerSource, /getOntologyActionInfoInterface/);
  assert.match(drawerSource, /mapOntologyActionInfoToViewState/);
  assert.match(drawerSource, /loadActionInfoForView/);
  assert.match(drawerSource, /spaceId: string/);
  assert.match(drawerSource, /background: var\(--aircas-color-section-header\)/);
  assert.match(drawerSource, /行为 ID/);
  assert.match(drawerSource, /行为 api/);
  assert.match(drawerSource, /主体类型/);
  assert.match(drawerSource, /输入参数/);
  assert.match(drawerSource, /输出参数/);
  assert.doesNotMatch(drawerSource, /执行范围/);
  assert.doesNotMatch(drawerSource, /执行次数/);
  assert.doesNotMatch(drawerSource, /变更说明/);
  assert.doesNotMatch(drawerSource, /状态操作记录/);

  assert.match(deleteSource, /删除行为/);
  assert.match(deleteSource, /确定删除行为/);
  assert.match(deleteSource, /确认删除/);
  assert.match(deleteSource, /width="520px"/);
  assert.doesNotMatch(deleteSource, /影响范围/);
  assert.doesNotMatch(deleteSource, /请输入行为名称确认删除/);

  assert.match(workspaceSource, /BehaviorDetailDrawer/);
  assert.match(workspaceSource, /:space-id="spaceId"/);
  assert.doesNotMatch(workspaceSource, /behaviorFormMode\.value = "view"/);
});

test("space behavior maps entity row detail into selectable data rows for update test", () => {
  const detail = {
    primaryKey: "1",
    ontologyUniqueIdentifier: "onto-1",
    propertyGroups: [
      {
        storageGroup: "engine",
        groupDataList: [
          {
            dataPrimaryKey: "100",
            props: [
              {
                propertyUniqIdentifier: "p1",
                propertyApiName: "e_thrust",
                propertyDisplayName: "加力推力",
                propertyValue: 1,
              },
            ],
          },
          {
            dataPrimaryKey: "",
            props: [],
          },
        ],
      },
      {
        storageGroup: "main",
        groupDataList: [
          {
            dataPrimaryKey: "200",
            props: [
              {
                propertyUniqIdentifier: "p2",
                propertyApiName: "name",
                propertyDisplayName: "名称",
                propertyValue: "F-22",
              },
            ],
          },
        ],
      },
    ],
  };
  const engineRows = mapOntologyEntityRowDetailToDataRows(detail, "engine");
  assert.equal(engineRows.length, 1);
  assert.equal(engineRows[0]?.storageGroup, "engine");
  assert.equal(engineRows[0]?.dataPrimaryKey, "100");
  assert.match(engineRows[0]?.propertySummary ?? "", /加力推力/);
  const mainRows = mapOntologyEntityRowDetailToDataRows(detail, " main ");
  assert.equal(mainRows.length, 1);
  assert.equal(mainRows[0]?.dataPrimaryKey, "200");
  assert.deepEqual(mapOntologyEntityRowDetailToDataRows(null, "engine"), []);
});

test("space behavior coerces test param values by property type for backend params", () => {
  const doubleOk = coerceBehaviorTestParamValue("1.5", "Double", "加力推力");
  assert.equal(doubleOk.ok, true);
  if (doubleOk.ok) assert.equal(doubleOk.value, 1.5);

  const intOk = coerceBehaviorTestParamValue("2", "Int", "装机数量");
  assert.equal(intOk.ok, true);
  if (intOk.ok) assert.equal(intOk.value, 2);

  const stringOk = coerceBehaviorTestParamValue(" a ", "String", "发动机型号");
  assert.equal(stringOk.ok, true);
  if (stringOk.ok) assert.equal(stringOk.value, "a");

  const boolOk = coerceBehaviorTestParamValue("true", "Boolean", "启用");
  assert.equal(boolOk.ok, true);
  if (boolOk.ok) assert.equal(boolOk.value, true);

  const intBad = coerceBehaviorTestParamValue("1.2", "Int", "装机数量");
  assert.equal(intBad.ok, false);
  if (!intBad.ok) assert.match(intBad.error, /装机数量/);

  const doubleBad = coerceBehaviorTestParamValue("abc", "Double", "加力推力");
  assert.equal(doubleBad.ok, false);
  if (!doubleBad.ok) assert.match(doubleBad.error, /加力推力/);
});

test("space behavior maps action info detail into view drawer state", () => {
  const propertyView = mapOntologyActionInfoToViewState({
    id: 8,
    actionApi: "act.pv.weapon.add",
    displayName: "武器行-新增",
    description: "属性值行为",
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
        functionParamId: null,
        parameterName: "w_range",
        displayName: "射程",
        propertyType: "Double",
        sourceType: "FIXED",
        sourceConfig: "120.5",
        propertyUniqueIdentifier: "p1",
        ontologyUniqueIdentifier: "onto-1",
      },
      {
        functionParamId: null,
        parameterName: "e_thrust",
        displayName: "加力推力",
        propertyType: "Double",
        sourceType: "EXTERNAL",
        propertyUniqueIdentifier: "p2",
        ontologyUniqueIdentifier: "onto-1",
      },
    ],
    functionParams: [],
  });
  assert.equal(propertyView.status, "published");
  assert.equal(propertyView.actionKindLabel, "基础行为");
  assert.equal(propertyView.subjectTypeLabel, "属性值");
  assert.equal(propertyView.operationLabel, "新增");
  assert.equal(propertyView.storageGroup, "weapon");
  assert.equal(propertyView.inputRows.length, 2);
  assert.equal(propertyView.outputRows.length, 0);
  assert.match(propertyView.inputRows[0]?.bindSummary ?? "", /固定值 120\.5/);
  assert.equal(propertyView.inputRows[0]?.propertyDisplayName, "射程");
  assert.equal(propertyView.inputRows[0]?.propertyType, "Double");
  assert.equal(propertyView.inputRows[0]?.paramType, "Double");
  assert.equal(propertyView.inputRows[1]?.paramName, "e_thrust");
  assert.equal(propertyView.inputRows[1]?.propertyDisplayName, "加力推力");
  assert.equal(propertyView.inputRows[1]?.propertyType, "Double");
  assert.match(propertyView.inputRows[1]?.bindSummary ?? "", /外部输入/);

  const applicationView = mapOntologyActionInfoToViewState({
    id: 9,
    actionApi: "act.ap.obj.nested",
    displayName: "应用行为-对象子字段绑定",
    description: "desc",
    ontologyUniqIdentifier: "onto-1",
    categoryId: 14,
    status: 2,
    actionKind: "APPLICATION",
    subjectType: null,
    operation: null,
    storageGroup: null,
    functionApi: "act.fn.obj",
    functionDescription: "OBJECT 入参演示算子",
    outputMode: "RESULT_ONLY",
    linkMapping: {
      ontologyLinkUniqIdentifier: "link-1",
      targetStatus: null,
      visibilityWindows: [],
    },
    mappingIns: [
      {
        functionParamId: 2298,
        parameterName: "lng",
        sourceType: "PROPERTY",
        paramPath: "lng",
        propertyUniqueIdentifier: "prop-lng",
        ontologyUniqueIdentifier: "onto-1",
      },
      {
        functionParamId: 2298,
        parameterName: "lat",
        sourceType: "EXTERNAL",
        paramPath: "lat",
      },
      {
        functionParamId: 2300,
        parameterName: "sum",
        functionParamExpression: "$.data.sum",
        outputMode: "RESULT_ONLY",
      },
    ],
    functionParams: [
      {
        paramId: 2298,
        paramName: "pos",
        paramType: "OBJECT",
        category: "INPUT",
        paramOrder: 1,
        description: "坐标对象",
      },
      {
        paramId: 2300,
        paramName: "sum",
        paramType: "DOUBLE",
        category: "OUTPUT",
        paramOrder: 2,
        description: "lng+lat 之和",
      },
    ],
  });
  assert.equal(applicationView.status, "draft");
  assert.equal(applicationView.actionKindLabel, "应用行为");
  assert.equal(applicationView.linkRelationId, "link-1");
  assert.equal(applicationView.inputRows.length, 2);
  assert.equal(applicationView.outputRows.length, 1);
  assert.equal(applicationView.inputRows[0]?.paramPath, "lng");
  assert.equal(applicationView.inputRows[0]?.paramType, "OBJECT");
  assert.match(applicationView.inputRows[0]?.bindSummary ?? "", /对象属性/);
  assert.match(applicationView.outputRows[0]?.bindSummary ?? "", /仅返回/);

  const edgeView = mapOntologyActionInfoToViewState({
    id: 10,
    actionApi: "act.link.demo",
    displayName: "",
    description: "",
    ontologyUniqIdentifier: "onto-2",
    categoryId: 1,
    status: 1,
    actionKind: "BASE",
    subjectType: "LINK",
    operation: "UPDATE",
    storageGroup: null,
    functionApi: null,
    functionDescription: null,
    outputMode: null,
    linkMapping: {
      ontologyLinkUniqIdentifier: "link-2",
      targetStatus: "ENABLE",
    },
    mappingIns: [
      { category: "INPUT", sourceType: "PROPERTY" },
      { category: "INPUT", sourceType: "FIXED" },
      { category: "INPUT", sourceType: "EXTERNAL" },
      { category: "INPUT", sourceType: "OBJECT", propertyUniqueIdentifier: "obj-1" },
      { category: "INPUT", sourceType: "LIST", propertyUniqueIdentifier: "list-1" },
      { category: "INPUT", propertyUniqueIdentifier: "only-prop" },
      { category: "INPUT", sourceConfig: "raw-config" },
      { category: "INPUT" },
      {
        category: "OUTPUT",
        outputMode: "WRITE_PROPERTY",
        functionParamExpression: "$.data.x",
        propertyUniqueIdentifier: "out-prop",
      },
      { category: "OUTPUT" },
    ],
    functionParams: null,
  });
  assert.equal(edgeView.displayName, "act.link.demo");
  assert.equal(edgeView.subjectTypeLabel, "关系实例");
  assert.equal(edgeView.operationLabel, "修改");
  assert.equal(edgeView.linkTargetStatus, "ENABLE");
  assert.equal(edgeView.inputRows.length, 8);
  assert.equal(edgeView.outputRows.length, 2);
  assert.equal(edgeView.inputRows[0]?.bindSummary, "对象属性");
  assert.equal(edgeView.inputRows[1]?.bindSummary, "固定值");
  assert.equal(edgeView.inputRows[2]?.bindSummary, "外部输入");
  assert.match(edgeView.inputRows[3]?.bindSummary ?? "", /对象 obj-1/);
  assert.match(edgeView.inputRows[4]?.bindSummary ?? "", /列表 list-1/);
  assert.match(edgeView.inputRows[5]?.bindSummary ?? "", /属性 only-prop/);
  assert.equal(edgeView.inputRows[6]?.bindSummary, "raw-config");
  assert.equal(edgeView.inputRows[7]?.bindSummary, "—");
  assert.match(edgeView.outputRows[0]?.bindSummary ?? "", /\$\.data\.x/);
  assert.equal(edgeView.outputRows[1]?.bindSummary, "仅返回结果");
});

test("space behavior category form validates the required name before submit", () => {
  const source = readSource("../src/views/SpaceBehaviorWorkspace/components/BehaviorCategoryFormDialog.vue");
  assert.match(source, /:error="nameError"/);
  assert.match(source, /nameError\.value = "请输入分类名称"/);
  assert.match(source, /if \(!trimmed\) \{[\s\S]*return;/);
});

test("space behavior status dialog submits change directly without confirm step", () => {
  const dialogSource = readSource("../src/views/SpaceBehaviorWorkspace/components/BehaviorStatusDialog.vue");
  assert.match(dialogSource, /title="行为状态管理"/);
  assert.match(dialogSource, /width="480px"/);
  assert.match(dialogSource, /目标操作/);
  assert.match(dialogSource, /submitStatusChange">确认变更</);
  assert.match(dialogSource, /reason: ""/);
  assert.doesNotMatch(dialogSource, /openConfirmStep/);
  assert.doesNotMatch(dialogSource, /上一步/);
  assert.doesNotMatch(dialogSource, /step === ['"]form['"]/);
  assert.doesNotMatch(dialogSource, /对象行为状态管理/);
  assert.doesNotMatch(dialogSource, /下一步：/);
  assert.doesNotMatch(dialogSource, /label="操作原因"/);
  assert.doesNotMatch(dialogSource, /引用检查/);
  assert.doesNotMatch(dialogSource, /重新检查/);
  assert.doesNotMatch(dialogSource, /Mockup 生命周期/);
  assert.doesNotMatch(dialogSource, /behavior-status-dialog__header/);
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

test("application function detail params flatten nested object fields for input and output", () => {
  assert.equal(mapFunctionParamTypeLabel("OBJECT"), "对象");
  assert.equal(mapFunctionParamTypeLabel("MAP"), "对象");
  assert.equal(mapFunctionParamTypeLabel("LIST"), "列表");
  assert.equal(mapFunctionParamTypeLabel("ARRAY"), "列表");
  assert.equal(mapFunctionParamTypeLabel("STRING"), "字符串");
  assert.equal(mapFunctionParamTypeLabel("INTEGER"), "整数");
  assert.equal(mapFunctionParamTypeLabel("INT"), "整数");
  assert.equal(mapFunctionParamTypeLabel("LONG"), "整数");
  assert.equal(mapFunctionParamTypeLabel("DOUBLE"), "数值");
  assert.equal(mapFunctionParamTypeLabel("FLOAT"), "数值");
  assert.equal(mapFunctionParamTypeLabel("NUMBER"), "数值");
  assert.equal(mapFunctionParamTypeLabel("DECIMAL"), "数值");
  assert.equal(mapFunctionParamTypeLabel("BOOLEAN"), "布尔");
  assert.equal(mapFunctionParamTypeLabel("BOOL"), "布尔");
  assert.equal(mapFunctionParamTypeLabel("CUSTOM"), "CUSTOM");
  assert.equal(mapFunctionParamTypeLabel(""), "未知");
  assert.equal(mapFunctionParamTypeLabel("   "), "未知");

  const params = [
    {
      paramId: 11,
      paramName: "pos",
      paramType: "OBJECT",
      category: "INPUT",
      paramOrder: 2,
      fields: [
        {
          paramName: "longitude",
          paramType: "DOUBLE",
          category: "INPUT",
          paramOrder: 1,
        },
        {
          paramName: "latitude",
          paramType: "DOUBLE",
          category: "INPUT",
          paramOrder: 0,
        },
        {
          paramName: "",
          paramType: "STRING",
          category: "INPUT",
          paramOrder: 3,
        },
      ],
    },
    {
      paramId: 10,
      paramName: "name",
      paramType: "STRING",
      category: "INPUT",
      paramOrder: 1,
    },
    {
      paramName: "skipped",
      paramType: "STRING",
      category: "OTHER",
      paramOrder: 9,
    },
    {
      paramName: "unordered",
      paramType: "BOOL",
      category: "input",
    },
    {
      paramId: 20,
      paramName: "result",
      paramType: "MAP",
      category: "OUTPUT",
      paramOrder: 1,
      fields: [
        {
          paramName: "code",
          paramType: "INTEGER",
          category: "OUTPUT",
          paramOrder: 1,
        },
        {
          paramName: "tags",
          paramType: "LIST",
          category: "OUTPUT",
          paramOrder: 2,
        },
      ],
    },
  ];

  const inputRows = flattenApplicationFunctionInputRows(params);
  assert.deepEqual(
    inputRows.map((row) => ({
      fullPath: row.fullPath,
      paramPath: row.paramPath,
      depth: row.depth,
      functionParamId: row.functionParamId,
      typeLabel: row.typeLabel,
      hasChildren: row.hasChildren,
    })),
    [
      {
        fullPath: "name",
        paramPath: "",
        depth: 0,
        functionParamId: 10,
        typeLabel: "字符串",
        hasChildren: false,
      },
      {
        fullPath: "pos",
        paramPath: "",
        depth: 0,
        functionParamId: 11,
        typeLabel: "对象",
        hasChildren: true,
      },
      {
        fullPath: "pos.latitude",
        paramPath: "pos.latitude",
        depth: 1,
        functionParamId: 11,
        typeLabel: "数值",
        hasChildren: false,
      },
      {
        fullPath: "pos.longitude",
        paramPath: "pos.longitude",
        depth: 1,
        functionParamId: 11,
        typeLabel: "数值",
        hasChildren: false,
      },
      {
        fullPath: "unordered",
        paramPath: "",
        depth: 0,
        functionParamId: null,
        typeLabel: "布尔",
        hasChildren: false,
      },
    ],
  );

  const outputRows = flattenApplicationFunctionOutputRows(params);
  assert.equal(outputRows.length, 3);
  assert.equal(outputRows[0]?.fullPath, "result");
  assert.equal(outputRows[0]?.typeLabel, "对象");
  assert.equal(outputRows[0]?.isObject, true);
  assert.equal(outputRows[1]?.fullPath, "result.code");
  assert.equal(outputRows[1]?.functionParamId, 20);
  assert.equal(outputRows[1]?.typeLabel, "整数");
  assert.equal(outputRows[1]?.depth, 1);
  assert.equal(outputRows[2]?.fullPath, "result.tags");
  assert.equal(outputRows[2]?.typeLabel, "列表");
  assert.equal(flattenApplicationFunctionInputRows([]).length, 0);
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
    ...EMPTY_APPLICATION_DRAFT_FIELDS,
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
    ...EMPTY_APPLICATION_DRAFT_FIELDS,
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
    assert.equal(created.mappingIns[0]?.sourceType, "EXTERNAL");
    assert.equal("sourceConfig" in (created.mappingIns[0] ?? {}), false);
    assert.equal(created.mappingIns[0]?.parameterName, "w_range");
    assert.equal(created.mappingIns[1]?.sourceType, "EXTERNAL");
    assert.equal("sourceConfig" in (created.mappingIns[1] ?? {}), false);
  }

  const updated = buildPropertyValueCreateActionParams({ ...baseDraft, basicAction: "update", description: "  " });
  assert.equal("error" in updated, false);
  if (!("error" in updated)) {
    assert.equal(updated.operation, "UPDATE");
    assert.equal(updated.mappingIns[0]?.sourceType, "EXTERNAL");
    assert.equal("sourceConfig" in (updated.mappingIns[0] ?? {}), false);
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
    ...EMPTY_APPLICATION_DRAFT_FIELDS,
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

  const createdDisable = buildLinkCreateActionParams({
    ...baseDraft,
    relationTargetStatus: "DISABLE",
  });
  assert.equal("error" in createdDisable, false);
  if (!("error" in createdDisable)) {
    assert.equal(createdDisable.linkMapping?.targetStatus, "DISABLE");
  }
  assert.equal("error" in buildLinkCreateActionParams({ ...baseDraft, relationTargetStatus: "DELETE" }), true);

  const updated = buildLinkCreateActionParams({
    ...baseDraft,
    basicAction: "update",
    relationTargetStatus: "ENABLE",
    relationVisibilityWindows: [],
    description: "  ",
  });
  assert.equal("error" in updated, false);
  if (!("error" in updated)) {
    assert.equal(updated.operation, "UPDATE");
    assert.deepEqual(updated.linkMapping, {
      ontologyLinkUniqIdentifier: "link-1",
      targetStatus: "ENABLE",
    });
    assert.equal("visibilityWindows" in (updated.linkMapping ?? {}), false);
  }
  assert.equal(
    "error" in
      buildLinkCreateActionParams({
        ...baseDraft,
        basicAction: "update",
        relationTargetStatus: "DELETE",
        relationVisibilityWindows: [],
      }),
    true,
  );

  const updatedDisable = buildLinkCreateActionParams({
    ...baseDraft,
    basicAction: "update",
    relationTargetStatus: "DISABLE",
    relationVisibilityWindows: [],
  });
  assert.equal("error" in updatedDisable, false);
  if (!("error" in updatedDisable)) {
    assert.equal(updatedDisable.linkMapping?.targetStatus, "DISABLE");
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

test("space behavior lists relation target status options by basic action", async () => {
  const { listSpaceBehaviorRelationTargetStatusOptions } = await import("../src/types/pages/ontologySpaceBehaviorType.ts");
  assert.deepEqual(
    listSpaceBehaviorRelationTargetStatusOptions("create").map((item) => item.value),
    ["ENABLE", "DISABLE"],
  );
  assert.deepEqual(
    listSpaceBehaviorRelationTargetStatusOptions("update").map((item) => item.value),
    ["ENABLE", "DISABLE"],
  );
  assert.deepEqual(listSpaceBehaviorRelationTargetStatusOptions("delete"), []);
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

  const linkIsoWindowsState = mapOntologyActionInfoToFormState({
    id: 22,
    actionApi: "act.lk.strike.update",
    displayName: "打击关系",
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
      ontologyLinkUniqIdentifier: "link-iso",
      targetStatus: "ENABLE",
      visibilityWindows: [
        {
          startTime: "2026-11-08T16:00:00.000+00:00",
          endTime: "2026-11-09T16:00:00.000+00:00",
        },
        {
          startTime: "2026-12-13T16:00:00.000+00:00",
          endTime: "2026-12-14T16:00:00.000+00:00",
        },
      ],
    },
    mappingIns: [],
    functionParams: [],
  });
  assert.equal(linkIsoWindowsState.selectedRelationId, "link-iso");
  assert.deepEqual(linkIsoWindowsState.relationVisibilityWindows, [
    {
      startTime: Date.parse("2026-11-08T16:00:00.000+00:00"),
      endTime: Date.parse("2026-11-09T16:00:00.000+00:00"),
    },
    {
      startTime: Date.parse("2026-12-13T16:00:00.000+00:00"),
      endTime: Date.parse("2026-12-14T16:00:00.000+00:00"),
    },
  ]);
  assert.match(readSource("../src/types/apis/getOntologyActionInfoType.ts"), /GetOntologyActionInfoVisibilityWindow/);
  assert.match(readSource("../src/types/apis/getOntologyActionInfoType.ts"), /startTime: number \| string/);
  assert.match(readSource("../src/views/SpaceBehaviorWorkspace/utils/mapOntologyActionInfoToFormState.ts"), /parseVisibilityWindowTimestamp/);
  assert.match(readSource("../src/views/SpaceBehaviorWorkspace/utils/mapOntologyActionInfoToFormState.ts"), /Date\.parse/);
  assert.match(readSource("../src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue"), /Date\.parse\(trimmed\)/);

  const linkDisableState = mapOntologyActionInfoToFormState({
    id: 21,
    actionApi: "act.lk.carry.disable",
    displayName: "搭载关系-disable",
    description: "",
    ontologyUniqIdentifier: "onto-from",
    categoryId: 14,
    status: 1,
    actionKind: "BASE",
    subjectType: "LINK",
    operation: "CREATE",
    storageGroup: null,
    functionApi: null,
    functionDescription: null,
    outputMode: null,
    linkMapping: {
      ontologyLinkUniqIdentifier: "link-2",
      targetStatus: "DISABLE",
      visibilityWindows: [],
    },
    mappingIns: [],
    functionParams: [],
  });
  assert.equal(linkDisableState.relationTargetStatus, "DISABLE");

  const linkUnknownStatus = mapOntologyActionInfoToFormState({
    id: 22,
    actionApi: "act.lk.carry.unknown",
    displayName: "搭载关系-unknown",
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
      ontologyLinkUniqIdentifier: "link-3",
      targetStatus: "UNKNOWN",
      visibilityWindows: null,
    },
    mappingIns: [],
    functionParams: [],
  });
  assert.equal(linkUnknownStatus.relationTargetStatus, "");

  const operatorState = mapOntologyActionInfoToFormState({
    id: 3,
    actionApi: "act.bo.aircraft",
    displayName: "基础算子",
    description: "",
    ontologyUniqIdentifier: "onto-1",
    categoryId: 14,
    status: 2,
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
  assert.equal(operatorState.status, "draft");
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
    linkMapping: {
      ontologyLinkUniqIdentifier: "link-1",
      ontologyLinkFunctionParamExpression: null,
      targetStatus: null,
      visibilityWindows: null,
    },
    mappingIns: [
      {
        functionParamId: 2298,
        parameterName: "lng",
        sourceType: "PROPERTY",
        sourceConfig: null,
        paramPath: "lng",
        propertyUniqueIdentifier: "prop-lng",
        ontologyUniqueIdentifier: "onto-from",
        category: "INPUT",
      },
      {
        functionParamId: 2300,
        parameterName: "sum",
        sourceType: null,
        sourceConfig: null,
        paramPath: null,
        propertyUniqueIdentifier: null,
        ontologyUniqueIdentifier: null,
        category: "OUTPUT",
        outputMode: "RESULT_ONLY",
      },
    ],
    functionParams: [
      {
        paramId: 2298,
        paramName: "pos",
        paramType: "OBJECT",
        category: "INPUT",
        paramOrder: 1,
      },
      {
        paramId: 2300,
        paramName: "sum",
        paramType: "DOUBLE",
        category: "OUTPUT",
        paramOrder: 1,
      },
    ],
  });
  assert.equal(applicationState.kind, "application");
  assert.equal(applicationState.unsupportedEditReason, "");
  assert.equal(applicationState.selectedRelationId, "link-1");
  assert.equal(applicationState.functionOperatorId, "act.fn.obj");
  assert.equal(applicationState.applicationBindingSeeds.length, 2);
  assert.equal(applicationState.applicationBindingSeeds[0]?.category, "INPUT");
  assert.equal(applicationState.applicationBindingSeeds[0]?.inputBinding?.sourceType, "PROPERTY");
  assert.equal(applicationState.applicationBindingSeeds[0]?.inputBinding?.propertyUniqueIdentifier, "prop-lng");
  assert.equal(applicationState.applicationBindingSeeds[1]?.category, "OUTPUT");
  assert.equal(applicationState.applicationBindingSeeds[1]?.outputBinding?.outputMode, "RESULT_ONLY");

  const matchedNestedInput = findApplicationParamRowForBindingSeed(
    [
      {
        rowKey: "INPUT:pos",
        functionParamId: 2298,
        paramName: "pos",
        paramPath: "",
        fullPath: "pos",
        paramType: "OBJECT",
        typeLabel: "对象",
        depth: 0,
        isObject: true,
        hasChildren: true,
      },
      {
        rowKey: "INPUT:pos.lng",
        functionParamId: 2298,
        paramName: "lng",
        paramPath: "pos.lng",
        fullPath: "pos.lng",
        paramType: "DOUBLE",
        typeLabel: "数值",
        depth: 1,
        isObject: false,
        hasChildren: false,
      },
    ],
    applicationState.applicationBindingSeeds[0],
  );
  assert.equal(matchedNestedInput?.rowKey, "INPUT:pos.lng");
  const appliedBindings = applyApplicationActionInfoBindings(
    applicationState.applicationBindingSeeds,
    [
      {
        rowKey: "INPUT:pos.lng",
        functionParamId: 2298,
        paramName: "lng",
        paramPath: "pos.lng",
        fullPath: "pos.lng",
        paramType: "DOUBLE",
        typeLabel: "数值",
        depth: 1,
        isObject: false,
        hasChildren: false,
      },
    ],
    [
      {
        rowKey: "OUTPUT:sum",
        functionParamId: 2300,
        paramName: "sum",
        paramPath: "",
        fullPath: "sum",
        paramType: "DOUBLE",
        typeLabel: "数值",
        depth: 0,
        isObject: false,
        hasChildren: false,
      },
    ],
  );
  assert.equal(appliedBindings.applicationInputBindings["INPUT:pos.lng"]?.propertyUniqueIdentifier, "prop-lng");
  assert.equal(appliedBindings.applicationOutputBindings["OUTPUT:sum"]?.outputMode, "RESULT_ONLY");

  const unsupportedSubject = mapOntologyActionInfoToFormState({
    id: 9,
    actionApi: "act.unknown",
    displayName: "未知主体",
    description: "",
    ontologyUniqIdentifier: "onto-1",
    categoryId: 14,
    status: 1,
    actionKind: "BASE",
    subjectType: "UNKNOWN_SUBJECT",
    operation: "CREATE",
    storageGroup: null,
    functionApi: null,
    functionDescription: null,
    outputMode: null,
    linkMapping: null,
    mappingIns: [],
    functionParams: [],
  });
  assert.match(unsupportedSubject.unsupportedEditReason, /暂不支持编辑保存/);

  const linkDeleteStatus = mapOntologyActionInfoToFormState({
    id: 23,
    actionApi: "act.lk.carry.delete-status",
    displayName: "",
    description: "",
    ontologyUniqIdentifier: "onto-from",
    categoryId: 14,
    status: 2,
    actionKind: "BASE",
    subjectType: "LINK",
    operation: "QUERY",
    storageGroup: null,
    functionApi: null,
    functionDescription: null,
    outputMode: null,
    linkMapping: {
      ontologyLinkUniqIdentifier: "link-4",
      targetStatus: "DELETE",
      visibilityWindows: [
        { startTime: "bad", endTime: 20 },
        { startTime: 1, endTime: 2 },
      ],
    },
    mappingIns: null,
    functionParams: [],
  });
  assert.equal(linkDeleteStatus.relationTargetStatus, "DELETE");
  assert.equal(linkDeleteStatus.basicAction, "query");
  assert.equal(linkDeleteStatus.status, "draft");
  assert.equal(linkDeleteStatus.displayName, "act.lk.carry.delete-status");
  assert.deepEqual(linkDeleteStatus.relationVisibilityWindows, [{ startTime: 1, endTime: 2 }]);

  const propertyEdge = mapOntologyActionInfoToFormState({
    id: 24,
    actionApi: "act.pv.edge",
    displayName: "属性边",
    description: "",
    ontologyUniqIdentifier: "onto-1",
    categoryId: 14,
    status: 1,
    actionKind: "BASE",
    subjectType: "PROPERTY_VALUE",
    operation: "DELETE",
    storageGroup: "g1",
    functionApi: null,
    functionDescription: null,
    outputMode: null,
    linkMapping: null,
    mappingIns: [
      { propertyUniqueIdentifier: "  ", parameterName: "skip", sourceConfig: "x" },
      { propertyUniqueIdentifier: "p2", parameterName: "  ", sourceConfig: 12 },
      { propertyUniqueIdentifier: "p3", parameterName: "named", sourceConfig: "ok" },
    ],
    functionParams: [],
  });
  assert.equal(propertyEdge.basicAction, "delete");
  assert.deepEqual(propertyEdge.selectedPropertyIds, ["p2", "p3"]);
  assert.equal(propertyEdge.selectedPropertyValues.p2, "");
  assert.equal(propertyEdge.selectedPropertyApiNames.p3, "named");
  assert.equal("p2" in propertyEdge.selectedPropertyApiNames, false);
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
    ...EMPTY_APPLICATION_DRAFT_FIELDS,
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

test("space behavior builds application createAction params with linkMapping and mixed mappingIns", () => {
  const baseDraft = {
    displayName: "飞机问候语行为",
    behaviorApiName: "act.ap.aircraft.greeting",
    kind: "application",
    valueType: "attributeValue",
    functionOperatorId: "act.fn.aircraft.greeting",
    functionOperatorName: "问候语",
    functionOperatorVersion: "1.0.0",
    description: "应用行为",
    categoryId: "14",
    status: "draft",
    basicAction: "create",
    ontologyIdentifier: "",
    operatorParamBindings: {},
    operatorParamIds: {},
    selectedPropertyIds: [],
    selectedPropertyValues: {},
    selectedPropertyApiNames: {},
    storageGroup: "",
    selectedRelationId: "4ed7c4da646f4006bec301815b61debb",
    relationTargetStatus: "",
    relationVisibilityWindows: [],
    applicationInputRows: [
      {
        rowKey: "in-name",
        functionParamId: 3001,
        paramName: "name",
        paramPath: "",
        fullPath: "name",
        isObject: false,
      },
      {
        rowKey: "in-obj",
        functionParamId: 3099,
        paramName: "payload",
        paramPath: "",
        fullPath: "payload",
        isObject: true,
      },
      {
        rowKey: "in-mach",
        functionParamId: 3002,
        paramName: "max_mach",
        paramPath: "",
        fullPath: "max_mach",
        isObject: false,
      },
      {
        rowKey: "in-ext",
        functionParamId: 3003,
        paramName: "note",
        paramPath: "",
        fullPath: "note",
        isObject: false,
      },
    ],
    applicationOutputRows: [
      {
        rowKey: "out-greeting",
        functionParamId: 4001,
        paramName: "greeting",
        paramPath: "",
        fullPath: "greeting",
        isObject: false,
      },
      {
        rowKey: "out-speed",
        functionParamId: 4002,
        paramName: "new_speed",
        paramPath: "",
        fullPath: "new_speed",
        isObject: false,
      },
    ],
    applicationInputBindings: {
      "in-name": {
        sourceType: "PROPERTY",
        ontologyUniqueIdentifier: "onto-1",
        propertyUniqueIdentifier: "prop-name",
        fixedValue: "",
        enableDefaultValue: false,
        defaultValue: "",
      },
      "in-mach": {
        sourceType: "FIXED",
        ontologyUniqueIdentifier: "",
        propertyUniqueIdentifier: "",
        fixedValue: "2.25",
        enableDefaultValue: false,
        defaultValue: "",
      },
      "in-ext": {
        sourceType: "EXTERNAL",
        ontologyUniqueIdentifier: "",
        propertyUniqueIdentifier: "",
        fixedValue: "",
        enableDefaultValue: true,
        defaultValue: '"ignored"',
      },
    },
    applicationOutputBindings: {
      "out-greeting": {
        outputMode: "RESULT_ONLY",
        ontologyUniqueIdentifier: "",
        propertyUniqueIdentifier: "",
      },
      "out-speed": {
        outputMode: "WRITE_PROPERTY",
        ontologyUniqueIdentifier: "onto-1",
        propertyUniqueIdentifier: "prop-speed",
      },
    },
  };

  assert.equal(isApplicationActionCreateDraft(baseDraft), true);
  assert.equal(isBasicOperatorActionCreateDraft(baseDraft), false);
  assert.equal(
    buildApplicationOutputFunctionParamExpression({
      rowKey: "x",
      functionParamId: 1,
      paramName: "greeting",
      paramPath: "",
      fullPath: "greeting",
      isObject: false,
    }),
    "$.data.greeting",
  );

  const created = buildApplicationCreateActionParams(baseDraft);
  assert.equal("error" in created, false);
  if (!("error" in created)) {
    assert.equal(created.actionKind, "APPLICATION");
    assert.equal(created.functionApi, "act.fn.aircraft.greeting");
    assert.equal("ontologyIdentifier" in created, false);
    assert.equal("subjectType" in created, false);
    assert.equal("outputMode" in created, false);
    assert.deepEqual(created.linkMapping, { ontologyLinkUniqIdentifier: "4ed7c4da646f4006bec301815b61debb" });
    assert.deepEqual(created.mappingIns, [
      {
        functionParamId: 3001,
        category: "INPUT",
        sourceType: "PROPERTY",
        parameterName: "name",
        propertyUniqueIdentifier: "prop-name",
        ontologyUniqueIdentifier: "onto-1",
      },
      {
        functionParamId: 3002,
        category: "INPUT",
        sourceType: "FIXED",
        parameterName: "max_mach",
        sourceConfig: "2.25",
      },
      {
        functionParamId: 3003,
        category: "INPUT",
        sourceType: "EXTERNAL",
        parameterName: "note",
      },
      {
        functionParamId: 4001,
        category: "OUTPUT",
        outputMode: "RESULT_ONLY",
        parameterName: "greeting",
      },
      {
        functionParamId: 4002,
        category: "OUTPUT",
        outputMode: "WRITE_PROPERTY",
        parameterName: "new_speed",
        functionParamExpression: "$.data.new_speed",
        propertyUniqueIdentifier: "prop-speed",
        ontologyUniqueIdentifier: "onto-1",
      },
    ]);
  }

  const withoutRelation = buildApplicationCreateActionParams({ ...baseDraft, selectedRelationId: " " });
  assert.equal("error" in withoutRelation, false);
  if (!("error" in withoutRelation)) {
    assert.equal("linkMapping" in withoutRelation, false);
  }
  assert.equal("error" in buildApplicationCreateActionParams({ ...baseDraft, functionOperatorId: "" }), true);
  assert.equal(
    "error" in
      buildApplicationCreateActionParams({
        ...baseDraft,
        applicationInputBindings: {
          ...baseDraft.applicationInputBindings,
          "in-name": { ...baseDraft.applicationInputBindings["in-name"], propertyUniqueIdentifier: "" },
        },
      }),
    true,
  );
  assert.equal(
    "error" in
      buildApplicationCreateActionParams({
        ...baseDraft,
        applicationOutputBindings: {
          ...baseDraft.applicationOutputBindings,
          "out-speed": { ...baseDraft.applicationOutputBindings["out-speed"], propertyUniqueIdentifier: "" },
        },
      }),
    true,
  );
  assert.equal(
    "error" in
      buildApplicationCreateActionParams({
        ...baseDraft,
        applicationInputRows: baseDraft.applicationInputRows.filter((row) => row.isObject),
      }),
    true,
  );
  assert.equal("error" in buildApplicationCreateActionParams({ ...baseDraft, categoryId: "root" }), true);
  assert.equal("error" in buildApplicationCreateActionParams({ ...baseDraft, behaviorApiName: "" }), true);
  assert.equal("error" in buildApplicationCreateActionParams({ ...baseDraft, displayName: " " }), true);
  assert.equal(
    "error" in
      buildApplicationCreateActionParams({
        ...baseDraft,
        applicationInputBindings: {
          ...baseDraft.applicationInputBindings,
          "in-name": { ...baseDraft.applicationInputBindings["in-name"], ontologyUniqueIdentifier: "" },
        },
      }),
    true,
  );
  assert.equal(
    "error" in
      buildApplicationCreateActionParams({
        ...baseDraft,
        applicationInputBindings: {
          ...baseDraft.applicationInputBindings,
          "in-mach": { ...baseDraft.applicationInputBindings["in-mach"], fixedValue: "  " },
        },
      }),
    true,
  );
  assert.equal(
    "error" in
      buildApplicationCreateActionParams({
        ...baseDraft,
        applicationInputRows: [{ ...baseDraft.applicationInputRows[0], functionParamId: null }],
      }),
    true,
  );
  assert.equal(
    "error" in
      buildApplicationCreateActionParams({
        ...baseDraft,
        applicationOutputRows: [{ ...baseDraft.applicationOutputRows[0], functionParamId: null }],
      }),
    true,
  );
  assert.equal(
    "error" in
      buildApplicationCreateActionParams({
        ...baseDraft,
        applicationOutputBindings: {
          ...baseDraft.applicationOutputBindings,
          "out-speed": { ...baseDraft.applicationOutputBindings["out-speed"], ontologyUniqueIdentifier: "" },
        },
      }),
    true,
  );

  const nested = buildApplicationCreateActionParams({
    ...baseDraft,
    description: "  ",
    applicationInputRows: [
      {
        rowKey: "in-nested",
        functionParamId: 3010,
        paramName: "longitude",
        paramPath: "position.longitude",
        fullPath: "pos.position.longitude",
        isObject: false,
      },
    ],
    applicationInputBindings: {
      "in-nested": {
        sourceType: "PROPERTY",
        ontologyUniqueIdentifier: "onto-1",
        propertyUniqueIdentifier: "prop-lon",
        fixedValue: "",
        enableDefaultValue: false,
        defaultValue: "",
      },
    },
    applicationOutputRows: [
      {
        rowKey: "out-nested",
        functionParamId: 4010,
        paramName: "longitude",
        paramPath: "position.longitude",
        fullPath: "pos.position.longitude",
        isObject: false,
      },
    ],
    applicationOutputBindings: {
      "out-nested": {
        outputMode: "WRITE_PROPERTY",
        ontologyUniqueIdentifier: "onto-1",
        propertyUniqueIdentifier: "prop-lon",
      },
    },
  });
  assert.equal("error" in nested, false);
  if (!("error" in nested)) {
    assert.equal("description" in nested, false);
    assert.equal(nested.mappingIns?.[0]?.paramPath, "position.longitude");
    assert.equal(nested.mappingIns?.[1]?.functionParamExpression, "$.data.pos.position.longitude");
  }

  assert.equal(
    "error" in
      buildApplicationCreateActionParams({
        ...baseDraft,
        applicationInputRows: [
          {
            rowKey: "missing-binding",
            functionParamId: 5001,
            paramName: "orphan",
            paramPath: "",
            fullPath: "orphan",
            isObject: false,
          },
        ],
        applicationInputBindings: {},
        applicationOutputRows: [],
        applicationOutputBindings: {},
      }),
    true,
  );

  const defaultOutput = buildApplicationCreateActionParams({
    ...baseDraft,
    applicationInputRows: [
      {
        rowKey: "in-ext-only",
        functionParamId: 5002,
        paramName: "",
        paramPath: "",
        fullPath: "",
        isObject: false,
      },
    ],
    applicationInputBindings: {
      "in-ext-only": {
        sourceType: "EXTERNAL",
        ontologyUniqueIdentifier: "",
        propertyUniqueIdentifier: "",
        fixedValue: "",
        enableDefaultValue: false,
        defaultValue: "",
      },
    },
    applicationOutputRows: [
      {
        rowKey: "out-default",
        functionParamId: 5003,
        paramName: "result",
        paramPath: "",
        fullPath: "",
        isObject: false,
      },
    ],
    applicationOutputBindings: {},
  });
  assert.equal("error" in defaultOutput, false);
  if (!("error" in defaultOutput)) {
    assert.equal(defaultOutput.mappingIns?.[0]?.parameterName, undefined);
    assert.equal(defaultOutput.mappingIns?.[1]?.outputMode, "RESULT_ONLY");
    assert.equal("parameterName" in (defaultOutput.mappingIns?.[1] ?? {}), true);
  }

  assert.equal(
    buildApplicationOutputFunctionParamExpression({
      rowKey: "fallback",
      functionParamId: 1,
      paramName: "onlyName",
      paramPath: "",
      fullPath: "  ",
      isObject: false,
    }),
    "$.data.onlyName",
  );
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

test("space behavior status operations allow only publish and unpublish by status", () => {
  assert.deepEqual(listAvailableSpaceBehaviorStatusOperations("published"), ["draft"]);
  assert.deepEqual(listAvailableSpaceBehaviorStatusOperations("draft"), ["publish"]);
  assert.deepEqual(listAvailableSpaceBehaviorStatusOperations("disabled"), []);

  const typeSource = readSource("../src/types/pages/ontologySpaceBehaviorType.ts");
  assert.match(typeSource, /draft: "撤销发布"/);

  const apiSource = readSource("../src/apis/ontologyActionApi.ts");
  assert.match(apiSource, /putPublishOntologyActionInterface/);
  assert.match(apiSource, /putUnpublishOntologyActionInterface/);
  assert.match(apiSource, /\/ontology\/action\/publish/);
  assert.match(apiSource, /\/ontology\/action\/unpublish/);
  assert.match(apiSource, /method: "put"/);
  assert.match(apiSource, /params/);

  const composableSource = readSource("../src/views/SpaceBehaviorWorkspace/composables/useSpaceBehaviorWorkspace.ts");
  assert.match(composableSource, /putPublishOntologyActionInterface/);
  assert.match(composableSource, /putUnpublishOntologyActionInterface/);
  assert.match(composableSource, /async function changeBehaviorStatus/);
  assert.match(composableSource, /ontologySpaceId: numericSpaceId/);
  assert.match(composableSource, /actionApi/);

  const routesSource = readSource("../src/mockData/routes.json");
  assert.match(routesSource, /\/ontology\/action\/publish/);
  assert.match(routesSource, /\/ontology\/action\/unpublish/);

  const data = querySpaceBehaviorWorkspaceMock("behavior-status-space");
  const draft = data.behaviors.find((item) => item.status === "draft");
  assert.ok(draft);
  const published = applySpaceBehaviorStatusChangeMock("behavior-status-space", draft.id, {
    operation: "publish",
    reason: "",
  });
  assert.equal(published?.status, "published");
  const unpublished = applySpaceBehaviorStatusChangeMock("behavior-status-space", draft.id, {
    operation: "draft",
    reason: "",
  });
  assert.equal(unpublished?.status, "draft");
});
