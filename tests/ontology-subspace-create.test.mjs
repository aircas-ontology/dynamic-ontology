import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

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
  assert.match(source, /placeholder="搜索本体对象"/);
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
  assert.match(source, /apiName: "carrier_ford"/);
  assert.match(source, /getCheckedNodes\(true\)/);
  assert.match(source, /function syncSelectedTreeObjects/);
  assert.match(source, /update:selectedObjects/);
  assert.doesNotMatch(source, /function selectAllTreeObjects/);
  assert.doesNotMatch(source, /function clearTreeSelection/);
  assert.doesNotMatch(source, /function flattenTreeNodes/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{3,8}/);
  assert.doesNotMatch(source, /rgb[a]?\(/);
});

test("subspace create workspace panel uses public form empty and actions", () => {
  const source = readSource("../src/views/OntologySubspaceCreate/components/SubspaceCreateWorkspacePanel.vue");
  assert.match(source, /class="aircas-button"/);
  assert.match(source, />返回</);
  assert.match(source, /v-if="currentStepIndex > 0"/);
  assert.match(source, /emit\('previous'\)/);
  assert.match(source, />上一步</);
  assert.match(source, /父空间：\{\{ parentSpaceName \}\}/);
  assert.match(source, />下一步</);
  assert.match(source, />创建</);
  assert.match(source, /currentStepIndex/);
  assert.match(source, /class="aircas-form /);
  assert.match(source, /子空间名称/);
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
  assert.match(source, /请在左侧勾选本体对象/);
  assert.match(source, /selectedObjects/);
  assert.match(source, /subspace-create-workspace__card/);
  assert.match(source, /\.subspace-create-workspace__card \{[^}]*background: var\(--aircas-color-card-background-active\)/);
  assert.match(source, /<Ship \/>/);
  assert.match(source, /v-if="currentStepIndex === 0 && selectedObjects.length"/);
  assert.match(source, /第二步：选择实例/);
  assert.match(source, /选择纳入子空间的对象实例/);
  assert.match(source, /class="aircas-table aircas-table--flat /);
  assert.match(source, /type="selection"/);
  assert.match(source, /实例名称/);
  assert.match(source, /所属对象/);
  assert.match(source, /toggleRowSelection/);
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

test("subspace create maps selected objects to property groups", () => {
  const source = readSource("../src/views/OntologySubspaceCreate/utils/mapSubspaceCreateObjectProperty.ts");
  assert.match(source, /export interface SubspaceCreateObjectPropertyGroup/);
  assert.match(source, /function mapSubspaceCreateObjectPropertyGroups/);
  assert.match(source, /hullNumber/);
  assert.doesNotMatch(source, /validationLabel/);
});

test("subspace create property filter kind follows data type", () => {
  const source = readSource("../src/views/OntologySubspaceCreate/utils/resolveSubspaceCreatePropertyFilterKind.ts");
  assert.match(source, /function resolveSubspaceCreatePropertyFilterKind/);
  assert.match(source, /dateRange/);
  assert.match(source, /"text"/);
  assert.match(source, /"number"/);
});

test("subspace create maps selected objects to relation rows", () => {
  const source = readSource("../src/views/OntologySubspaceCreate/utils/mapSubspaceCreateSelectedRelation.ts");
  assert.match(source, /export interface SubspaceCreateSelectedRelation/);
  assert.match(source, /function mapSubspaceCreateSelectedRelations/);
  assert.match(source, /护航/);
  assert.match(source, /同编队/);
});

test("subspace create maps selected objects to instance rows", () => {
  const source = readSource("../src/views/OntologySubspaceCreate/utils/mapSubspaceCreateSelectedInstance.ts");
  assert.match(source, /export interface SubspaceCreateSelectedInstance/);
  assert.match(source, /function mapSubspaceCreateSelectedInstances/);
  assert.match(source, /实例\$\{index\}/);
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
  assert.match(source, /请至少选择一个对象实例/);
  assert.match(source, /selectedPropertyIds/);
  assert.match(source, /function selectObjectProperties/);
  assert.match(source, /currentStepIndex.value = 2/);
  assert.match(source, /selectedRelationIds/);
  assert.match(source, /currentStepIndex.value = 3/);
  assert.match(source, /请至少选择一个对象关系/);
  assert.match(source, /OntologySpaceManagement/);
  assert.match(source, /请填写子空间名称和 API 名称/);
  assert.match(source, /请至少选择一个本体对象/);
  assert.match(source, /grid-template-columns: 320px minmax\(0, 1fr\)/);
  assert.match(source, /gap: 8px/);
  assert.match(source, /width: 100%/);
  assert.match(source, /flex: 1/);
  assert.doesNotMatch(source, /views\/Ontology/);
});
