import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  groupSubspaceCreateInstancesByObject,
  mapSubspaceCreateSelectedInstances,
  resolveSubspaceCreateInstancePage,
  selectAllSubspaceCreateInstances,
  sliceSubspaceCreateInstancePage,
  SUBSPACE_CREATE_INSTANCE_PAGE_SIZE,
  SUBSPACE_CREATE_INSTANCE_SAMPLE_COUNT,
  toggleSubspaceCreateInstanceSelection,
} from "../src/views/OntologySubspaceCreate/utils/mapSubspaceCreateSelectedInstance.ts";
import { mapSubspaceCreateSelectedObjects } from "../src/views/OntologySubspaceCreate/utils/mapSubspaceCreateSelectedObject.ts";
import {
  listSubspaceCreateObjectsMissingProperties,
  mapSubspaceCreateObjectPropertyGroup,
} from "../src/views/OntologySubspaceCreate/utils/mapSubspaceCreateObjectProperty.ts";
import { mapSubspaceCreateRelationsFromTree } from "../src/views/OntologySubspaceCreate/utils/mapSubspaceCreateSelectedRelation.ts";
import { mapSubspaceCreateRequest } from "../src/views/OntologySubspaceCreate/utils/mapSubspaceCreateRequest.ts";
import { resolveSubspaceCreatePropertyFilterKind } from "../src/views/OntologySubspaceCreate/utils/resolveSubspaceCreatePropertyFilterKind.ts";

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

test("subspace create tree panel uses public tree and filter controls", () => {
  const source = readSource("../src/views/OntologySubspaceCreate/components/SubspaceCreateTreePanel.vue");
  assert.match(source, /分类体系树/);
  assert.match(source, /已选 \{\{ selectedCount \}\} 个/);
  assert.match(source, /class="aircas-input /);
  assert.match(source, /placeholder="搜索对象"/);
  assert.doesNotMatch(source, /全选对象/);
  assert.doesNotMatch(source, /清空选择/);
  assert.match(source, /class="aircas-tree /);
  assert.match(source, /highlight-current/);
  assert.match(source, /--el-checkbox-checked-bg-color: var\(--aircas-color-accent-cyan\)/);
  assert.match(source, /:deep\(\.el-tree-node\.is-checked > \.el-tree-node__content\)[\s\S]*color: var\(--aircas-color-title\)/);
  assert.match(source, /:deep\(\.el-tree-node\.is-checked > \.el-tree-node__content\)[\s\S]*background: var\(--aircas-color-accent-cyan-fill\)/);
  assert.match(source, /--el-tree-text-color: var\(--aircas-color-text-secondary\)/);
  assert.match(source, /:deep\(\.el-tree-node__label\)[\s\S]*color: var\(--aircas-color-text-secondary\)/);
  assert.match(source, /:deep\(\.el-tree-node__expand-icon\)[\s\S]*color: var\(--aircas-color-text-muted\)/);
  assert.match(source, /border: 1px solid var\(--aircas-color-accent-cyan-border\)/);
  assert.match(source, /linear-gradient\(135deg, var\(--aircas-color-overlay\), var\(--aircas-color-overlay-deep\)\)/);
  assert.match(source, /show-checkbox/);
  assert.match(source, /kind: "category"/);
  assert.match(source, /kind: "object"/);
  assert.match(source, /el-icon/);
  assert.match(source, /Folder/);
  assert.match(source, /useOntologyObjectWorkspace/);
  assert.match(source, /mapOntologyTreeToSubspaceNodes/);
  assert.match(source, /getCheckedNodes\(true\)/);
  assert.match(source, /function syncSelectedTreeObjects/);
  assert.match(source, /currentStepIndex/);
  assert.match(source, /请回到对象选择步骤再更改/);
  assert.match(source, /setCheckedKeys/);
  assert.match(source, /update:selectedObjects/);
  assert.doesNotMatch(source, /function selectAllTreeObjects/);
  assert.doesNotMatch(source, /function clearTreeSelection/);
  assert.doesNotMatch(source, /function flattenTreeNodes/);
  assert.doesNotMatch(source, /rgb[a]?\(/);
});

test("subspace create tree selection only maps object nodes", () => {
  const source = readSource("../src/views/OntologySubspaceCreate/utils/mapSubspaceCreateSelectedObject.ts");
  assert.match(source, /readSelectedObjectText\(node, "kind"\) === "object"/);
  const selected = mapSubspaceCreateSelectedObjects([
    { id: "category-1", label: "分类一", kind: "category" },
    { id: "object-1", label: "对象一", apiName: "object_api", kind: "object" },
  ]);
  assert.deepEqual(selected, [{ id: "object-1", label: "对象一", apiName: "object_api" }]);
});

test("subspace create tree maps selected object cards to the real API name", () => {
  const source = readSource("../src/views/OntologySubspaceCreate/components/SubspaceCreateTreePanel.vue");
  assert.match(source, /apiNameByObjectId/);
  assert.match(source, /item\.id, item\.apiName/);
  assert.match(source, /apiName: apiNameByObjectId\.get\(object\.uniqueIdentifier\) \?\? object\.uniqueIdentifier/);
});

test("subspace create workspace panel uses public form empty and actions", () => {
  const source = readSource("../src/views/OntologySubspaceCreate/components/SubspaceCreateWorkspacePanel.vue");
  assert.match(source, /class="aircas-button"/);
  assert.match(source, />返回</);
  assert.match(source, /v-if="currentStepIndex > 0"/);
  assert.match(source, /emit\('previous'\)/);
  assert.match(source, />上一步</);
  assert.match(source, /对象空间：\{\{ parentSpaceName \}\}/);
  assert.match(source, />下一步</);
  assert.match(source, />创建</);
  assert.match(source, /currentStepIndex/);
  assert.match(source, /class="aircas-form /);
  assert.match(source, /主题名称/);
  assert.match(source, /API 名称/);
  assert.match(source, /class="aircas-input"/);
  assert.doesNotMatch(source, /\.el-input__wrapper\) \{[\s\S]*background: var\(--aircas-color-transparent\)/);
  assert.match(source, /选择对象/);
  assert.match(source, /选择实例/);
  assert.match(source, /配置属性/);
  assert.match(source, /配置关系/);
  assert.match(source, /function resolveStepStatus/);
  assert.match(source, /:class="`is-\$\{resolveStepStatus\(index\)\}`"/);
  assert.match(source, /:aria-current="resolveStepStatus\(index\) === 'process' \? 'step' : undefined"/);
  assert.match(source, /subspace-create-workspace__step-index/);
  assert.doesNotMatch(source, /\.subspace-create-workspace__steps \{[\s\S]*border-radius: 999px/);
  assert.match(source, /li\.is-finish[\s\S]*color: var\(--aircas-color-title\)/);
  assert.match(source, /li\.is-process[\s\S]*color: var\(--aircas-color-text-primary\)/);
  assert.match(source, /li\.is-wait[\s\S]*color: var\(--aircas-color-text-muted\)/);
  assert.match(source, /li\.is-finish \.subspace-create-workspace__step-index[\s\S]*background: var\(--aircas-color-accent-cyan\)/);
  assert.match(source, /li\.is-process \.subspace-create-workspace__step-index::after[\s\S]*background: var\(--aircas-color-accent-cyan\)/);
  assert.match(source, /第一步：选择对象/);
  assert.match(source, /class="aircas-empty"/);
  assert.match(source, /请在左侧勾选对象/);
  assert.match(source, /selectedObjects/);
  assert.match(source, /subspace-create-workspace__card/);
  assert.match(source, /\.subspace-create-workspace__card \{[\s\S]*border: 1px solid var\(--aircas-color-border-soft\)/);
  assert.match(source, /\.subspace-create-workspace__card \{[\s\S]*background: var\(--aircas-color-input-background\)/);
  assert.match(source, /grid-template-columns: repeat\(auto-fill, minmax\(320px, 380px\)\)/);
  assert.match(source, /:aria-label="`\$\{item\.label\}，\$\{item\.apiName\}`"/);
  assert.match(source, /\.subspace-create-workspace__property-group \{[\s\S]*flex: 0 0 auto/);
  assert.match(source, /\.subspace-create-workspace__property-filter\.el-date-editor[\s\S]*--el-input-bg-color: var\(--aircas-color-input-background\)/);
  assert.match(source, /\.subspace-create-workspace__property-filter\.el-date-editor[\s\S]*\.el-range-input/);
  assert.match(source, /\.subspace-create-workspace__property-filter\.el-input-number[\s\S]*\.el-input-number__increase/);
  assert.match(source, /\.subspace-create-workspace__property-filter\.el-input-number[\s\S]*var\(--aircas-color-border-highlight\)/);
  assert.match(source, /\.subspace-create-workspace__property-filter\.el-input-number[\s\S]*&\.is-disabled/);
  assert.match(source, /<Ship \/>/);
  assert.match(source, /v-if="currentStepIndex === 0 && selectedObjects.length"/);
  assert.match(source, /第二步：选择实例/);
  assert.match(source, /选择纳入子空间的对象实例/);
  assert.match(source, /from "\.\/SubspaceCreateInstancePanel\.vue"/);
  assert.match(source, /<SubspaceCreateInstancePanel/);
  assert.match(source, /function shouldShowStepEmpty/);
  assert.match(source, /v-else-if="shouldShowStepEmpty\(\)"/);
  assert.doesNotMatch(source, /<el-empty v-else[\s>]/);
  assert.match(source, /propertyLoadStatus/);
  assert.match(source, /propertyLoadError/);
  assert.match(source, /property-retry/);
  assert.match(source, /正在加载对象属性/);
  assert.match(source, /正在加载父空间关系/);
  assert.match(source, /relationLoadStatus/);
  assert.match(source, /relationLoadError/);
  assert.match(source, /relation-retry/);
  assert.match(source, /class="aircas-table aircas-table--flat /);
  assert.match(source, /type="selection"/);
  assert.match(source, /toggleRowSelection/);
  assert.doesNotMatch(source, /所属对象/);
  assert.doesNotMatch(source, /applyInstanceTableSelection/);
  assert.match(source, /第三步：配置对象属性/);
  assert.match(source, /按不同对象配置筛选条件，不修改属性本身。/);
  assert.match(source, /全选属性/);
  assert.match(source, /取消全选/);
  assert.match(source, />全选</);
  assert.match(source, /属性名称/);
  assert.match(source, /数据类型/);
  assert.match(source, /筛选条件/);
  assert.match(source, /'daterange'/);
  assert.match(source, /popper-class="aircas-picker"/);
  assert.match(source, /el-input-number/);
  assert.match(source, /numberRange/);
  assert.match(source, /最小值/);
  assert.match(source, /最大值/);
  assert.match(source, />至</);
  assert.doesNotMatch(source, /验证条件/);
  assert.match(source, /class="aircas-checkbox"/);
  assert.match(source, /class="aircas-tag"/);
  assert.match(source, /function selectObjectProperties/);
  assert.match(source, /第四步：选择关系/);
  assert.match(source, /选择纳入子空间的对象关系/);
  assert.match(source, /关系名称/);
  assert.match(source, /源对象/);
  assert.match(source, /目标对象/);
  assert.match(source, /function applyRelationTableSelection/);
  assert.match(source, /\.subspace-create-workspace__header \{[\s\S]*height: 61\.33px/);
  assert.match(source, /\.subspace-create-workspace__steps \{[\s\S]*height: 47\.33px/);
  assert.match(source, /\.subspace-create-workspace__empty \{[\s\S]*flex: 1/);
  assert.match(source, /class="subspace-create-workspace__header subspace-create-workspace__panel"/);
  assert.match(source, /class="subspace-create-workspace__steps subspace-create-workspace__panel"/);
  assert.match(source, /class="subspace-create-workspace__empty subspace-create-workspace__panel"/);
  assert.match(source, /\.subspace-create-workspace__panel \{[\s\S]*border: 1px solid var\(--aircas-color-accent-cyan-border\)/);
  assert.match(source, /\.subspace-create-workspace__panel \{[\s\S]*background: var\(--aircas-color-panel-background\)/);
  assert.match(source, /\.subspace-create-workspace \{[\s\S]*width: 100%/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{3,8}/);
  assert.doesNotMatch(source, /views\/OntologyLlmBuilder/);
  assert.doesNotMatch(source, /AI 助手/);
});

test("date picker panel remaps Aircas theme variables for range selection", () => {
  const source = readSource("../src/styles/element-plus/el-date-picker.scss");
  assert.match(source, /\.aircas-picker \{[\s\S]*\.el-picker-panel,[\s\S]*--el-datepicker-bg-color: var\(--aircas-color-menu-background\)/);
  assert.match(source, /\.el-date-range-picker \{[\s\S]*--el-datepicker-active-color: var\(--aircas-color-accent-cyan\)/);
  assert.match(source, /\.el-date-table td\.in-range/);
  assert.match(source, /\.el-picker-panel__shortcut\.active[\s\S]*var\(--aircas-color-selected-background\)/);
  assert.match(source, /\.el-time-panel[\s\S]*var\(--aircas-color-menu-background\)/);
  assert.match(source, /\.el-picker-panel__btn:hover[\s\S]*var\(--aircas-color-border-highlight\)/);
  assert.match(source, /\.el-time-spinner__item\.is-active[\s\S]*var\(--aircas-color-title\)/);
});

test("subspace create maps selected objects to property groups", () => {
  const source = readSource("../src/views/OntologySubspaceCreate/utils/mapSubspaceCreateObjectProperty.ts");
  assert.match(source, /export interface SubspaceCreateObjectPropertyGroup/);
  assert.match(source, /function mapSubspaceCreateObjectPropertyGroups/);
  assert.match(source, /function listSubspaceCreateObjectsMissingProperties/);
  assert.match(source, /hullNumber/);
  assert.doesNotMatch(source, /validationLabel/);
});

test("subspace create lists objects that have no selected properties", () => {
  const ship = mapSubspaceCreateObjectPropertyGroup([{ uniqueIdentifier: "prop-ship", displayName: "舰名", apiName: "name", propertyType: "String" }], {
    id: "ship",
    label: "舰船",
    apiName: "ship",
  });
  const plane = mapSubspaceCreateObjectPropertyGroup([{ uniqueIdentifier: "prop-plane", displayName: "机型", apiName: "model", propertyType: "String" }], {
    id: "plane",
    label: "飞机",
    apiName: "plane",
  });
  const empty = mapSubspaceCreateObjectPropertyGroup([], { id: "empty", label: "辽宁号", apiName: "liaoning" });
  assert.deepEqual(listSubspaceCreateObjectsMissingProperties([ship, plane, empty], ["prop-plane"]), ["舰船", "辽宁号"]);
  assert.deepEqual(listSubspaceCreateObjectsMissingProperties([ship, plane], ["prop-ship", "prop-plane"]), []);
});

test("subspace create maps API properties into object property groups", () => {
  const group = mapSubspaceCreateObjectPropertyGroup([{ uniqueIdentifier: "prop-1", displayName: "名称", apiName: "name", propertyType: "String" }], {
    id: "ship",
    label: "舰船",
    apiName: "ship",
  });
  assert.deepEqual(group, {
    objectId: "ship",
    objectLabel: "舰船",
    properties: [
      {
        id: "prop-1",
        objectId: "ship",
        objectLabel: "舰船",
        displayName: "名称",
        apiName: "name",
        dataType: "String",
      },
    ],
  });
  assert.deepEqual(mapSubspaceCreateObjectPropertyGroup([], { id: "empty", label: "无属性对象", apiName: "empty" }).properties, []);
});

test("subspace create property filter kind follows data type", () => {
  const source = readSource("../src/views/OntologySubspaceCreate/utils/resolveSubspaceCreatePropertyFilterKind.ts");
  assert.match(source, /function resolveSubspaceCreatePropertyFilterKind/);
  assert.match(source, /dateRange/);
  assert.match(source, /"text"/);
  assert.match(source, /"numberRange"/);
  assert.equal(resolveSubspaceCreatePropertyFilterKind("Double"), "numberRange");
  assert.equal(resolveSubspaceCreatePropertyFilterKind("Int"), "numberRange");
  assert.equal(resolveSubspaceCreatePropertyFilterKind("Long"), "numberRange");
  assert.equal(resolveSubspaceCreatePropertyFilterKind("Float"), "numberRange");
  assert.equal(resolveSubspaceCreatePropertyFilterKind("Decimal"), "numberRange");
  assert.equal(resolveSubspaceCreatePropertyFilterKind("Short"), "numberRange");
  assert.equal(resolveSubspaceCreatePropertyFilterKind("Byte"), "numberRange");
});

test("subspace create maps selected objects to relation rows", () => {
  const source = readSource("../src/views/OntologySubspaceCreate/utils/mapSubspaceCreateSelectedRelation.ts");
  assert.match(source, /export interface SubspaceCreateSelectedRelation/);
  assert.match(source, /function mapSubspaceCreateSelectedRelations/);
  assert.match(source, /护航/);
  assert.match(source, /同编队/);
});

test("subspace create filters parent-space relations by selected source and target objects", () => {
  const rows = mapSubspaceCreateRelationsFromTree(
    {
      categoryId: 1,
      name: "全部",
      links: [
        {
          uniqueIdentifier: "relation-1",
          name: "护航",
          type: "OTHER",
          categoryId: 1,
          ontologyUniqueIdentifierFrom: "carrier",
          ontologyNameFrom: "旧航母名称",
          ontologyUniqueIdentifierTo: "destroyer",
          ontologyNameTo: "旧驱逐舰名称",
        },
        {
          uniqueIdentifier: "relation-2",
          name: "未纳入",
          type: "OTHER",
          categoryId: 1,
          ontologyUniqueIdentifierFrom: "carrier",
          ontologyNameFrom: "航空母舰",
          ontologyUniqueIdentifierTo: "submarine",
          ontologyNameTo: "潜艇",
        },
      ],
    },
    sampleObjects,
  );
  assert.deepEqual(rows, [{ id: "relation-1", displayName: "护航", sourceLabel: "航空母舰", targetLabel: "驱逐舰", type: "OTHER" }]);
  assert.deepEqual(mapSubspaceCreateRelationsFromTree(undefined, sampleObjects), []);
});

test("subspace create maps selected page state to the create request", () => {
  const request = mapSubspaceCreateRequest({
    parentSpaceId: "92",
    displayName: "测试子空间",
    apiName: "subtest",
    selectedObjects: [{ id: "carrier", label: "航空母舰", apiName: "carrier" }],
    instanceGroups: [
      {
        objectId: "carrier",
        objectLabel: "航空母舰",
        instances: [{ id: "101", name: "实体一", objectId: "carrier", objectLabel: "航空母舰" }],
        total: 1,
        page: 1,
        pageSize: 10,
        status: "success",
        error: "",
      },
    ],
    selectedInstanceIds: ["101"],
    selectedPropertyIds: ["property-1", "property-2"],
    propertyGroups: [
      {
        objectId: "carrier",
        objectLabel: "航空母舰",
        properties: [
          { id: "property-1", objectId: "carrier", objectLabel: "航空母舰", displayName: "舰名", apiName: "name", dataType: "String" },
          { id: "property-2", objectId: "carrier", objectLabel: "航空母舰", displayName: "吨位", apiName: "tonnage", dataType: "Int" },
        ],
      },
    ],
    propertyFilters: {
      "property-1": { text: "驱逐舰", number: null, numberRange: [null, null], dateRange: undefined, booleanValue: undefined },
      "property-2": { text: "", number: null, numberRange: [3000, 10000], dateRange: undefined, booleanValue: undefined },
    },
    selectedRelationIds: ["link-1"],
    relationRows: [
      {
        id: "link-1",
        displayName: "护航",
        sourceLabel: "航空母舰",
        targetLabel: "驱逐舰",
        apiName: "escort",
        type: "OTHER",
        description: "关系描述",
      },
    ],
  });
  assert.deepEqual(request, {
    parentSpaceId: 92,
    displayName: "测试子空间",
    apiName: "subtest",
    description: "测试子空间",
    selectedOntologies: [
      {
        sourceOntologyUniqueIdentifier: "carrier",
        selectedInstancePrimaryKeys: [101],
        selectedProperties: [
          { sourcePropertyUniqueIdentifier: "property-1", filter: { op: "LIKE", value: "驱逐舰", dataType: "String" } },
          { sourcePropertyUniqueIdentifier: "property-2", filter: { op: "BETWEEN", value: [3000, 10000], dataType: "Int" } },
        ],
      },
    ],
    selectedLinks: [{ sourceLinkUniqueIdentifier: "link-1", name: "护航", apiName: "escort", type: "OTHER", description: "关系描述" }],
  });
});

/**
 * @description 构造仅含一条数字筛选的创建请求映射入参。
 * @param propertyId 属性 id。
 * @param numberRange 数字区间。
 * @returns 映射入参。
 */
function buildNumberRangeRequestInput(propertyId, numberRange) {
  return {
    parentSpaceId: "92",
    displayName: "区间",
    apiName: "range",
    selectedObjects: [{ id: "plane", label: "飞机", apiName: "plane" }],
    instanceGroups: [],
    selectedInstanceIds: [],
    selectedPropertyIds: [propertyId],
    propertyGroups: [
      {
        objectId: "plane",
        objectLabel: "飞机",
        properties: [{ id: propertyId, objectId: "plane", objectLabel: "飞机", displayName: "测试1", apiName: "test", dataType: "Double" }],
      },
    ],
    propertyFilters: {
      [propertyId]: { text: "", number: null, numberRange, dateRange: undefined, booleanValue: undefined },
    },
    selectedRelationIds: [],
    relationRows: [],
  };
}

test("subspace create maps one-sided number ranges to GE or LE", () => {
  const minOnly = mapSubspaceCreateRequest(buildNumberRangeRequestInput("prop-min", [1.5, null]));
  assert.deepEqual(minOnly.selectedOntologies[0]?.selectedProperties[0]?.filter, { op: "GE", value: 1.5, dataType: "Double" });
  const maxOnly = mapSubspaceCreateRequest(buildNumberRangeRequestInput("prop-max", [null, 8]));
  assert.deepEqual(maxOnly.selectedOntologies[0]?.selectedProperties[0]?.filter, { op: "LE", value: 8, dataType: "Double" });
});

test("subspace create exposes the create API path and submit wiring", () => {
  const apiSource = readSource("../src/apis/ontologySubspaceApi.ts");
  const typeSource = readSource("../src/types/apis/createOntologySubspaceType.ts");
  const pageSource = readSource("../src/views/OntologySubspaceCreate/index.vue");
  assert.match(apiSource, /\/ontology\/space\/subspace/);
  assert.match(apiSource, /method: "post"/);
  assert.match(typeSource, /selectedOntologies/);
  assert.match(typeSource, /selectedLinks/);
  assert.match(typeSource, /OntologySubspaceCreateVO/);
  assert.match(typeSource, /ontologyMapping/);
  assert.match(typeSource, /linkMapping/);
  assert.match(pageSource, /createOntologySubspaceInterface/);
  assert.match(pageSource, /creating/);
  assert.match(pageSource, /mapSubspaceCreateRequest/);
});

test("subspace create maps selected objects to instance rows", () => {
  const source = readSource("../src/views/OntologySubspaceCreate/utils/mapSubspaceCreateSelectedInstance.ts");
  assert.match(source, /export interface SubspaceCreateSelectedInstance/);
  assert.match(source, /export interface SubspaceCreateInstanceGroup/);
  assert.match(source, /function mapSubspaceCreateSelectedInstances/);
  assert.match(source, /function groupSubspaceCreateInstancesByObject/);
  assert.match(source, /function sliceSubspaceCreateInstancePage/);
  assert.match(source, /function resolveSubspaceCreateInstancePage/);
  assert.match(source, /function toggleSubspaceCreateInstanceSelection/);
  assert.match(source, /function selectAllSubspaceCreateInstances/);
  assert.match(source, /SUBSPACE_CREATE_INSTANCE_SAMPLE_COUNT = 12/);
  assert.match(source, /SUBSPACE_CREATE_INSTANCE_PAGE_SIZE = 10/);
  assert.match(source, /实例\$\{index \+ 1\}/);
});

test("subspace create instance panel groups rows by object and paginates", () => {
  const source = readSource("../src/views/OntologySubspaceCreate/components/SubspaceCreateInstancePanel.vue");
  assert.match(source, /instanceGroups/);
  assert.match(source, /group\.total/);
  assert.match(source, /group\.page/);
  assert.match(source, /page-change/);
  assert.match(source, /page-size-change/);
  assert.match(source, /retry/);
  assert.match(source, /个实例/);
  assert.match(source, /#header/);
  assert.match(source, /:indeterminate=/);
  assert.match(source, /class="aircas-checkbox"/);
  assert.match(source, /实例名称/);
  assert.doesNotMatch(source, />全选</);
  assert.match(source, /aircas-button/);
  assert.match(source, /class="aircas-table aircas-table--flat /);
  assert.match(source, /height="100%"/);
  assert.match(source, /function canFillInstanceGroup/);
  assert.match(source, /is-filled/);
  assert.match(source, /is-compact/);
  assert.match(source, /\.subspace-create-instance-panel__group\.is-filled \{[\s\S]*flex: 1/);
  assert.match(source, /class="aircas-pagination/);
  assert.match(source, /popper-class="aircas-pagination-popper"/);
  assert.match(source, /layout="total, sizes, prev, pager, next"/);
  assert.match(source, /:page-sizes="\[10, 20, 50\]"/);
  assert.doesNotMatch(source, /所属对象/);
  assert.doesNotMatch(source, /type="selection"/);
  assert.doesNotMatch(source, /rgb[a]?\(/);
});

test("subspace create maps checked tree leaves to selected objects", () => {
  const source = readSource("../src/views/OntologySubspaceCreate/utils/mapSubspaceCreateSelectedObject.ts");
  assert.match(source, /export interface SubspaceCreateSelectedObject/);
  assert.match(source, /function mapSubspaceCreateSelectedObjects/);
  assert.match(source, /apiName/);
});

test("subspace create page orchestrates names and next-step validation", () => {
  const source = readSource("../src/views/OntologySubspaceCreate/index.vue");
  assert.match(source, /from "\.\/components\/SubspaceCreateTreePanel\.vue"/);
  assert.match(source, /from "\.\/components\/SubspaceCreateWorkspacePanel\.vue"/);
  assert.match(source, /selectedObjects/);
  assert.match(source, /<SubspaceCreateTreePanel[^>]*current-step-index="currentStepIndex"/);
  assert.match(source, /:selected-objects="selectedObjects"/);
  assert.match(source, /function goBackToSpaceList/);
  assert.match(source, /@back="goBackToSpaceList"/);
  assert.match(source, /@previous="retreatSubspaceCreateStep"/);
  assert.match(source, /function retreatSubspaceCreateStep/);
  assert.match(source, /currentStepIndex.value -= 1/);
  assert.match(source, /function createSubspace/);
  assert.match(source, /router\.back\(\)/);
  assert.match(source, /function advanceSubspaceCreateStep/);
  assert.match(source, /currentStepIndex/);
  assert.match(source, /selectedInstanceIds/);
  assert.doesNotMatch(source, /请至少选择一个对象实例/);
  assert.match(source, /selectedPropertyIds/);
  assert.match(source, /function selectObjectProperties/);
  assert.match(source, /currentStepIndex.value = 2/);
  assert.match(source, /selectedRelationIds/);
  assert.match(source, /currentStepIndex.value = 3/);
  assert.match(source, /getOntologyRelationCategoryTreeInterface/);
  assert.match(source, /ontologyUniqueIdentifierFrom: object.id/);
  assert.match(source, /Promise\.allSettled/);
  assert.match(source, /loadParentSpaceRelations/);
  assert.match(source, /mapSubspaceCreateRelationsFromTree/);
  assert.match(source, /relationLoadStatus/);
  assert.match(source, /currentStepIndex.value = 3/);
  assert.match(source, /OntologySpaceManagement/);
  assert.match(source, /请填写主题名称和 API 名称/);
  assert.match(source, /请至少选择一个对象/);
  assert.match(source, /getOntologyEntitiesInterface/);
  assert.match(source, /:property-load-status="propertyLoadStatus"/);
  assert.match(source, /:property-load-error="propertyLoadError"/);
  assert.match(source, /ontologyUniqueIdentifier: objectId/);
  assert.match(source, /pageNum: page/);
  assert.match(source, /pageSize/);
  assert.match(source, /Promise\.allSettled/);
  assert.match(source, /instanceLoadStatus/);
  assert.match(source, /currentStepIndex.value = 1/);
  assert.doesNotMatch(source, /instanceLoadStatus.value === "empty"/);
  assert.match(source, /loadObjectInstancePageSize/);
  assert.match(source, /getOntologyPropertyByOntologyIdInterface/);
  assert.match(source, /ontologyUniqueIdentifier: object.id/);
  assert.match(source, /loadSelectedObjectProperties/);
  assert.match(source, /propertyLoadStatus/);
  assert.match(source, /currentStepIndex.value = 2/);
  assert.match(source, /listSubspaceCreateObjectsMissingProperties/);
  assert.match(source, /请为对象「\$\{missingObjectLabels\.join\("、"\)\}」选择属性/);
  assert.match(source, /grid-template-columns: 320px minmax\(0, 1fr\)/);
  assert.match(source, /gap: 8px/);
  assert.match(source, /width: 100%/);
  assert.match(source, /flex: 1/);
  assert.doesNotMatch(source, /views\/Ontology/);
});

const sampleObjects = [
  { id: "carrier", label: "航空母舰", apiName: "carrier" },
  { id: "destroyer", label: "驱逐舰", apiName: "destroyer" },
];

test("subspace create instance mapper groups twelve samples per object", () => {
  const rows = mapSubspaceCreateSelectedInstances(sampleObjects);
  assert.equal(SUBSPACE_CREATE_INSTANCE_SAMPLE_COUNT, 12);
  assert.equal(SUBSPACE_CREATE_INSTANCE_PAGE_SIZE, 10);
  assert.equal(rows.length, 24);
  assert.equal(rows.filter((row) => row.objectId === "carrier").length, 12);
  assert.equal(rows[0]?.name, "航空母舰实例1");
  assert.equal(rows[11]?.name, "航空母舰实例12");

  const groups = groupSubspaceCreateInstancesByObject(rows);
  assert.deepEqual(
    groups.map((group) => group.objectId),
    ["carrier", "destroyer"],
  );
  assert.equal(groups[0]?.objectLabel, "航空母舰");
  assert.equal(groups[0]?.instances.length, 12);
  assert.equal(groups[1]?.instances.length, 12);
});

test("subspace create instance pagination slices and clamps page state", () => {
  const rows = mapSubspaceCreateSelectedInstances(sampleObjects).filter((row) => row.objectId === "carrier");
  const firstPage = sliceSubspaceCreateInstancePage(rows, 1, 10);
  const secondPage = sliceSubspaceCreateInstancePage(rows, 2, 10);
  const overflowPage = sliceSubspaceCreateInstancePage(rows, 9, 10);
  const invalidSize = sliceSubspaceCreateInstancePage(rows, 1, 0);

  assert.deepEqual(
    firstPage.map((row) => row.name),
    rows.slice(0, 10).map((row) => row.name),
  );
  assert.deepEqual(
    secondPage.map((row) => row.id),
    ["carrier-11", "carrier-12"],
  );
  assert.deepEqual(
    overflowPage.map((row) => row.id),
    ["carrier-11", "carrier-12"],
  );
  assert.equal(invalidSize.length, 10);
  assert.equal(resolveSubspaceCreateInstancePage(12, 9, 10), 2);
  assert.equal(resolveSubspaceCreateInstancePage(12, 0, 10), 1);
  assert.equal(resolveSubspaceCreateInstancePage(0, 3, 10), 1);
  assert.equal(resolveSubspaceCreateInstancePage(12, 2, 20), 1);
});

test("subspace create instance selection keeps other objects across pages", () => {
  const rows = mapSubspaceCreateSelectedInstances(sampleObjects);
  const carrierRows = rows.filter((row) => row.objectId === "carrier");
  const destroyerRows = rows.filter((row) => row.objectId === "destroyer");
  const selectedAfterToggle = toggleSubspaceCreateInstanceSelection(["destroyer-1"], "carrier-11", true);
  assert.deepEqual(selectedAfterToggle, ["destroyer-1", "carrier-11"]);

  const selectedAfterUncheck = toggleSubspaceCreateInstanceSelection(selectedAfterToggle, "carrier-11", false);
  assert.deepEqual(selectedAfterUncheck, ["destroyer-1"]);

  const selectedGroup = selectAllSubspaceCreateInstances(["destroyer-1"], carrierRows, true);
  assert.equal(selectedGroup.includes("destroyer-1"), true);
  assert.equal(selectedGroup.filter((id) => id.startsWith("carrier-")).length, 12);

  const clearedGroup = selectAllSubspaceCreateInstances(selectedGroup, carrierRows, false);
  assert.deepEqual(clearedGroup, ["destroyer-1"]);

  const duplicateToggle = toggleSubspaceCreateInstanceSelection(["carrier-1"], "carrier-1", true);
  assert.deepEqual(duplicateToggle, ["carrier-1"]);
  assert.equal(destroyerRows.length, 12);
});

test("subspace create maps API entity records and nested properties", () => {
  const records = [
    { entityPrimaryKey: 101, properties: { name: "实体一" } },
    { id: "entity-102", displayName: "实体二" },
    { primaryKey: 103, entityName: "实体三" },
  ];
  const rows = mapSubspaceCreateSelectedInstances(records, sampleObjects[0]);
  assert.deepEqual(
    rows.map((row) => row.id),
    ["101", "entity-102", "103"],
  );
  assert.deepEqual(
    rows.map((row) => row.name),
    ["实体一", "实体二", "实体三"],
  );
  assert.deepEqual(
    rows.map((row) => row.objectId),
    ["carrier", "carrier", "carrier"],
  );
});

test("subspace create exposes entity API contract and type fields", () => {
  const apiSource = readSource("../src/apis/ontologyEntityApi.ts");
  const typeSource = readSource("../src/types/apis/getOntologyEntitiesType.ts");
  assert.match(apiSource, /\/ontology\/entity\/list/);
  assert.match(apiSource, /method: "get"/);
  assert.match(apiSource, /params/);
  assert.match(typeSource, /ontologyUniqueIdentifier: string/);
  assert.match(typeSource, /records: OntologyEntityInfo\[\]/);
  assert.match(typeSource, /properties\?: Record<string, unknown>/);
});
