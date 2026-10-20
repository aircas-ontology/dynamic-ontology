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

/** 六步链全部 39 个小步 id，顺序与统一配置一致。 */
const CHAIN_STEP_IDS = [
  "space-create-open",
  "space-create-manual",
  "space-create-confirm",
  "space-create-import-mode",
  "space-create-import-file",
  "space-create-import-confirm",
  "space-list-enter",
  "object-menu",
  "object-tree-create",
  "object-tree-child-confirm",
  "object-create-open",
  "object-create-required",
  "object-create-confirm",
  "object-create-import",
  "object-create-import-file",
  "object-create-import-confirm",
  "relation-menu",
  "relation-tree-create",
  "relation-category-confirm",
  "relation-create-open",
  "relation-create-required",
  "relation-create-confirm",
  "object-menu-back",
  "object-detail-open",
  "attribute-menu",
  "attribute-tree-create",
  "attribute-category-confirm",
  "attribute-create-open",
  "attribute-create-required",
  "attribute-create-save",
  "associate-open",
  "associate-select-datasource",
  "associate-map-datasource",
  "associate-fields",
  "associate-link",
  "associate-drag",
  "associate-submit",
  "associate-auto-open",
  "associate-auto",
];

/** 六个大步骤（chain）名称，按引导顺序排列。 */
const CHAIN_NAMES = ["新建对象空间", "新建对象", "新建关系", "新建属性", "属性关联数据源", "自动关联数据源"];

test("onboarding guide overlay renders step description with mock fallback and keyboard escape", () => {
  const source = readSource("../src/components/OnboardingGuide/OnboardingGuideOverlay.vue");
  assert.match(source, /<Teleport to="body">/);
  assert.match(source, /role="dialog" aria-modal="true" aria-label="新手引导"/);
  assert.match(source, /\{\{ currentStep\.description \}\}/);
  assert.match(source, /<li v-for="hint in currentStep\.hints"/);
  assert.match(source, /mockLabel/);
  assert.match(source, /请先完成上一步操作/);
  assert.match(source, /@keydown\.esc="close"/);
  assert.match(source, /跳过/);
  assert.match(source, /@click="skipChain\(\)">跳过</);
  assert.match(source, /上一步/);
  assert.match(source, /下一步/);
  assert.match(source, /window\.addEventListener\("resize", refreshTarget\)/);
  assert.match(source, /window\.addEventListener\("scroll", refreshTarget, true\)/);
  assert.doesNotMatch(source, /@click="currentStep\.title"/);

  const composableSource = readSource("../src/composables/shared/useOnboardingGuide.ts");
  assert.match(composableSource, /hints\?: string\[\]/);
  assert.match(composableSource, /enterTriggerSelector\?: string;/);
});

test("onboarding guide overlay auto-opens dialog steps by clicking the configured trigger", () => {
  const source = readSource("../src/components/OnboardingGuide/OnboardingGuideOverlay.vue");
  assert.match(source, /function activateCurrentStep/);
  assert.match(source, /step\.enterTriggerSelector/);
  assert.match(source, /document\.querySelector<HTMLElement>\(triggerSelector\)/);
  assert.match(source, /clickWithSuppress\(trigger\)/);
  assert.match(source, /void nextTick\(locateTarget\)/);
  assert.match(source, /window\.setTimeout\(\(\) => \{\s*runEnterClick\(step\);\s*locateTarget\(\);\s*\}, 360\)/);
  assert.match(source, /index\.value = nextIndex;\r?\n  writeOnboardingGuideStepId\(props\.steps\[nextIndex\]\?\.id \?\? ""\);\r?\n  activateCurrentStep\(\);/);
});

test("onboarding guide overlay interaction corrections for exit skip mask and click advance", () => {
  const source = readSource("../src/components/OnboardingGuide/OnboardingGuideOverlay.vue");
  assert.match(source, /import \{ Close, QuestionFilled \} from "@element-plus\/icons-vue";/);
  assert.match(source, /aria-label="退出引导"/);
  assert.match(source, /@click="close">\s*<el-icon><Close \/><\/el-icon>/);
  assert.match(source, /@click="move\(1\)">{{ index === steps\.length - 1 \? "完成" : "下一步" }}<\/el-button>/);
  assert.match(source, /function goToStep/);
  assert.match(source, /function skipChain/);
  assert.match(source, /next\.chain !== current\.chain/);
  assert.match(source, /next\.page !== current\.page/);
  assert.match(source, /step\.exitClickSelector/);
  assert.match(source, /leaveClickSelector \|\| step\.targetSelector/);
  assert.doesNotMatch(source, /onboarding-guide__backdrop/);
  assert.match(source, /onboarding-guide__board/);
  assert.match(source, /const boardStyle = computed/);
  assert.match(source, /function handleTargetClick/);
  assert.match(source, /event\.isTrusted/);
  assert.match(source, /suppressAdvanceClick/);
  assert.match(source, /if \(!visible\.value \|\| !event\.isTrusted \|\| suppressAdvanceClick \|\| !currentStep\.value\.advanceOnTargetClick\) return;/);
  assert.match(source, /currentStep\.value\.advanceOnTargetClick/);
  assert.match(source, /target\.contains\(event\.target\)/);
  assert.match(source, /window\.addEventListener\("click", handleTargetClick, true\)/);
  assert.match(source, /window\.removeEventListener\("click", handleTargetClick, true\)/);
  assert.match(source, /function runEnterClick/);
  assert.match(source, /step\.enterClickSelector/);
  assert.match(source, /function clickWithSuppress/);
  assert.match(source, /suppressAdvanceClick = true;\s*element\.click\(\);\s*window\.setTimeout\(\(\) => \{\s*suppressAdvanceClick = false;\s*\}, 0\);/);
  assert.match(source, /clickWithSuppress\(clickTarget\)/);
  assert.match(source, /clickWithSuppress\(trigger\)/);
});

test("onboarding guide overlay persists progress via session storage and clears on close", () => {
  const source = readSource("../src/components/OnboardingGuide/OnboardingGuideOverlay.vue");
  assert.match(source, /import type \{ OnboardingGuideStep \} from "@\/composables\/shared\/useOnboardingGuide";/);
  assert.match(source, /import \{ clearOnboardingGuideStep, writeOnboardingGuideStepId \} from "@\/composables\/shared\/useOnboardingGuide";/);
  assert.match(source, /writeOnboardingGuideStepId\(/);
  assert.match(source, /clearOnboardingGuideStep\(\)/);
  assert.match(source, /\{ immediate: true \}/);
  assert.match(source, /currentStep\.chain/);
  assert.match(source, /\{\{ steps\.length \}\}/);
});

test("onboarding guide composable resumes pending step for the matching page only", () => {
  const source = readSource("../src/composables/shared/useOnboardingGuide.ts");
  assert.match(source, /export type OnboardingGuidePageId = "space-list" \| "space-manage" \| "object-detail";/);
  assert.match(source, /export interface OnboardingGuideStep/);
  assert.match(source, /export function useOnboardingGuide/);
  assert.match(source, /const ONBOARDING_GUIDE_STORAGE_KEY = "onboarding-guide-active-step";/);
  assert.match(source, /export function readOnboardingGuideStepId/);
  assert.match(source, /export function writeOnboardingGuideStepId/);
  assert.match(source, /export function clearOnboardingGuideStep/);
  assert.match(source, /storedStep\.page === options\.page/);
  assert.match(source, /startId\.value = options\.entryStepId/);
  assert.match(source, /page: OnboardingGuidePageId;/);
  assert.match(source, /entryStepId: string;/);
  assert.match(source, /enterClickSelector\?: string;/);
  assert.match(source, /advanceOnTargetClick\?: boolean;/);
  assert.match(source, /exitClickSelector\?: string;/);
  assert.match(source, /leaveClickSelector\?: string;/);
});

test("unified step config defines the six-chain 39-step flow with page ownership", () => {
  const source = readSource("../src/views/onboardingGuideSteps.ts");
  for (const id of CHAIN_STEP_IDS) {
    assert.match(source, new RegExp(`id: "${id}"`), `missing step id: ${id}`);
  }
  assert.match(source, /export const CHAIN_CREATE_SPACE = "新建对象空间";/);
  assert.match(source, /chain: CHAIN_CREATE_SPACE/);
  for (const chain of CHAIN_NAMES.slice(1)) {
    assert.match(source, new RegExp(`chain: "${chain}"`), `missing chain: ${chain}`);
  }
  assert.match(source, /export const ONBOARDING_GUIDE_STEPS/);
  assert.match(source, /page: "space-list"/);
  assert.match(source, /page: "space-manage"/);
  assert.match(source, /page: "object-detail"/);
  assert.match(source, /export const ONBOARDING_GUIDE_ENTRY_IDS/);
  assert.match(source, /"space-list": "space-create-open"/);
  assert.match(source, /"space-manage": "object-menu"/);
  assert.match(source, /"object-detail": "attribute-menu"/);
  assert.match(source, /export const ONBOARDING_GUIDE_EMBEDDED_ENTRY_IDS/);
  assert.match(source, /"space-list": "space-list-enter"/);
  assert.match(source, /id: "space-create-confirm"[\s\S]*?targetSelector: "\[data-onboarding='space-create-confirm'\]"/);
  assert.match(source, /id: "associate-auto"[\s\S]*?targetSelector: "\[data-onboarding='associate-auto'\]"/);
  const triggerCount = source.match(/enterTriggerSelector:/g)?.length ?? 0;
  assert.equal(triggerCount, 24);
  assert.match(source, /id: "space-create-manual"[\s\S]*?enterTriggerSelector: "\.welcome-panel__create"/);
  assert.match(source, /id: "object-tree-child-confirm"[\s\S]*?enterTriggerSelector: "\[data-onboarding='object-tree-create'\]"/);
  assert.match(source, /id: "object-create-required"[\s\S]*?enterTriggerSelector: "\[data-onboarding='object-create-open'\]"/);
  assert.match(source, /id: "relation-create-required"[\s\S]*?enterTriggerSelector: "\[data-onboarding='relation-create-open'\]"/);
  assert.match(source, /id: "attribute-create-required"[\s\S]*?enterTriggerSelector: "\[data-onboarding='attribute-create-open'\]"/);
  assert.match(source, /id: "associate-select-datasource"[\s\S]*?enterTriggerSelector: "\[data-onboarding='associate-open'\]"/);
  const enterClickCount = source.match(/enterClickSelector:/g)?.length ?? 0;
  assert.equal(enterClickCount, 10);
  assert.match(source, /id: "space-create-import-mode"[\s\S]*?enterClickSelector: "\[data-onboarding='space-create-import-mode'\]"/);
  assert.match(source, /id: "object-create-import"[\s\S]*?enterClickSelector: "\[data-onboarding='object-create-mode-import'\]"/);
  assert.match(source, /id: "relation-menu"[\s\S]*?enterClickSelector: "\[data-onboarding='workspace-tab-relation'\]"/);
  assert.match(source, /id: "object-menu-back"[\s\S]*?enterClickSelector: "\[data-onboarding='workspace-tab-object'\]"/);
  assert.match(source, /id: "attribute-menu"[\s\S]*?enterClickSelector: "\[data-onboarding='object-tab-attribute'\]"/);
  const exitClickCount = source.match(/exitClickSelector:/g)?.length ?? 0;
  assert.equal(exitClickCount, 30);
  assert.match(source, /id: "space-create-open"[\s\S]*?exitClickSelector: "\[data-onboarding='space-create-cancel'\]"/);
  assert.match(source, /id: "object-tree-child-confirm"[\s\S]*?exitClickSelector: "\[data-onboarding='object-tree-child-cancel'\]"/);
  assert.match(source, /id: "relation-create-confirm"[\s\S]*?exitClickSelector: "\[data-onboarding='relation-create-cancel'\]"/);
  assert.match(source, /id: "attribute-create-save"[\s\S]*?exitClickSelector: "\[data-onboarding='attribute-create-cancel'\]"/);
  assert.match(source, /id: "associate-open"[\s\S]*?exitClickSelector: "\.property-datasource-mapping-dialog \.el-dialog__headerbtn"/);
  const leaveClickCount = source.match(/leaveClickSelector:/g)?.length ?? 0;
  assert.equal(leaveClickCount, 6);
  assert.match(source, /id: "space-create-manual"[\s\S]*?leaveClickSelector: "\[data-onboarding='space-enter'\]"/);
  const advanceCount = source.match(/advanceOnTargetClick: true/g)?.length ?? 0;
  assert.equal(advanceCount, 29);
  assert.match(
    source,
    /id: "space-create-open"[\s\S]*?targetSelector: "\.welcome-panel__create"[\s\S]*?advanceOnTargetClick: true[\s\S]*?mockLabel: "新建对象空间"/,
  );
  assert.match(source, /id: "associate-auto"[\s\S]*?advanceOnTargetClick: true[\s\S]*?mockLabel: "自动关联数据源"/);
});

test("onboarding guide wires three pages to the unified config with page scope and entries", () => {
  const spaceSource = readSource("../src/views/OntologySpaceManagement/index.vue");
  assert.match(
    spaceSource,
    /import \{ CHAIN_CREATE_SPACE, ONBOARDING_GUIDE_EMBEDDED_ENTRY_IDS, ONBOARDING_GUIDE_ENTRY_IDS, ONBOARDING_GUIDE_STEPS \} from "@\/views\/onboardingGuideSteps";/,
  );
  assert.match(spaceSource, /useOnboardingGuide\(\{/);
  assert.match(spaceSource, /page: "space-list"/);
  assert.match(spaceSource, /isEmbedded\.value \? ONBOARDING_GUIDE_EMBEDDED_ENTRY_IDS\["space-list"\] : ONBOARDING_GUIDE_ENTRY_IDS\["space-list"\]/);
  assert.match(spaceSource, /chain !== CHAIN_CREATE_SPACE/);
  assert.match(spaceSource, /@click="openOnboardingGuide\(\)"/);
  assert.match(spaceSource, /<OnboardingGuideOverlay v-model="guideVisible" :steps="onboardingGuideSteps" :start-id="guideStartId" \/>/);
  assert.doesNotMatch(spaceSource, /id: "create-space"/);

  const detailSource = readSource("../src/views/OntologySpaceManagementDetail/index.vue");
  assert.match(detailSource, /page: "space-manage"/);
  assert.match(detailSource, /ONBOARDING_GUIDE_ENTRY_IDS\["space-manage"\]/);
  assert.match(detailSource, /@click="openOnboardingGuide\(\)"/);
  assert.match(detailSource, /<OnboardingGuideOverlay v-model="guideVisible" :steps="onboardingGuideSteps" :start-id="guideStartId" \/>/);
  assert.doesNotMatch(detailSource, /id: "create-object"/);

  const objectSource = readSource("../src/views/OntologyObjectDetail/index.vue");
  assert.match(objectSource, /page: "object-detail"/);
  assert.match(objectSource, /ONBOARDING_GUIDE_ENTRY_IDS\["object-detail"\]/);
  assert.match(objectSource, /@click="openOnboardingGuide\(\)"/);
  assert.match(objectSource, /<OnboardingGuideOverlay v-model="guideVisible" :steps="onboardingGuideSteps" :start-id="guideStartId" \/>/);
  assert.doesNotMatch(objectSource, /id: "create-property"/);
});

test("dialog and toolbar elements expose data-onboarding anchors for the step chain", () => {
  const anchors = [
    ["../src/views/OntologySpaceManagement/components/SpaceActions.vue", 'data-onboarding="space-enter"'],
    ["../src/views/OntologySpaceManagement/components/SpaceFormDialog.vue", 'data-onboarding="space-create-manual-form"'],
    ["../src/views/OntologySpaceManagement/components/SpaceFormDialog.vue", 'data-onboarding="space-create-confirm"'],
    ["../src/views/OntologySpaceManagement/components/SpaceFormDialog.vue", 'data-onboarding="space-create-import-mode"'],
    ["../src/views/OntologySpaceManagement/components/SpaceFormDialog.vue", 'data-onboarding="space-create-import-file"'],
    ["../src/views/OntologySpaceManagement/components/SpaceFormDialog.vue", 'data-onboarding="space-create-cancel"'],
    ["../src/views/ObjectWorkspacePanel/components/CategoryTreeChildDialog.vue", 'data-onboarding="object-tree-child-cancel"'],
    ["../src/views/ObjectWorkspacePanel/components/OntologyObjectCreateDialog.vue", 'data-onboarding="object-create-cancel"'],
    ["../src/views/SpaceRelationWorkspace/components/RelationCategoryFormDialog.vue", 'data-onboarding="relation-category-cancel"'],
    ["../src/views/SpaceRelationWorkspace/components/SpaceRelationFormDialog.vue", 'data-onboarding="relation-create-cancel"'],
    ["../src/views/OntologyObjectAttributePanel/components/AttributeCategoryCreateDialog.vue", 'data-onboarding="attribute-category-cancel"'],
    ["../src/views/OntologyObjectAttributePanel/components/AttributePropertyFormDialog.vue", 'data-onboarding="attribute-create-cancel"'],
    ["../src/views/OntologySpaceManagementDetail/components/WorkspaceTypeTabs.vue", "workspace-tab-${tab.id}"],
    ["../src/views/ObjectWorkspacePanel/components/ConceptHierarchyTree.vue", 'data-onboarding="object-tree-create"'],
    ["../src/views/ObjectWorkspacePanel/components/CategoryTreeChildDialog.vue", 'data-onboarding="object-tree-child-confirm"'],
    ["../src/views/ObjectWorkspacePanel/components/OntologyObjectList.vue", 'data-onboarding="object-create-open"'],
    ["../src/views/ObjectWorkspacePanel/components/OntologyObjectList.vue", 'data-onboarding="object-detail-open"'],
    ["../src/views/ObjectWorkspacePanel/components/OntologyObjectCreateDialog.vue", "object-create-mode-${mode.value}"],
    ["../src/views/ObjectWorkspacePanel/components/OntologyObjectCreateDialog.vue", 'data-onboarding="object-create-required"'],
    ["../src/views/ObjectWorkspacePanel/components/OntologyObjectCreateDialog.vue", 'data-onboarding="object-create-import-file"'],
    ["../src/views/ObjectWorkspacePanel/components/OntologyObjectCreateDialog.vue", 'data-onboarding="object-create-confirm"'],
    ["../src/views/SpaceRelationWorkspace/components/RelationCategoryPanel.vue", 'data-onboarding="relation-tree-create"'],
    ["../src/views/SpaceRelationWorkspace/components/RelationCategoryFormDialog.vue", 'data-onboarding="relation-category-confirm"'],
    ["../src/views/SpaceRelationWorkspace/index.vue", 'data-onboarding="relation-create-open"'],
    ["../src/views/SpaceRelationWorkspace/components/SpaceRelationFormDialog.vue", 'data-onboarding="relation-create-required"'],
    ["../src/views/SpaceRelationWorkspace/components/SpaceRelationFormDialog.vue", 'data-onboarding="relation-create-confirm"'],
    ["../src/views/OntologyObjectDetail/components/ObjectDetailTabs.vue", "object-tab-${tab.id}"],
    ["../src/views/OntologyObjectAttributePanel/components/AttributeCategoryTree.vue", 'data-onboarding="attribute-tree-create"'],
    ["../src/views/OntologyObjectAttributePanel/components/AttributeCategoryCreateDialog.vue", 'data-onboarding="attribute-category-confirm"'],
    ["../src/views/OntologyObjectAttributePanel/components/AttributePropertyTable.vue", 'data-onboarding="attribute-create-open"'],
    ["../src/views/OntologyObjectAttributePanel/components/AttributePropertyTable.vue", 'data-onboarding="associate-open"'],
    ["../src/views/OntologyObjectAttributePanel/components/AttributePropertyFormDialog.vue", 'data-onboarding="attribute-create-required"'],
    ["../src/views/OntologyObjectAttributePanel/components/AttributePropertyFormDialog.vue", 'data-onboarding="attribute-create-save"'],
    ["../src/views/OntologyObjectAttributePanel/components/DataSourceAssociateDialog.vue", 'data-onboarding="associate-select-datasource"'],
    ["../src/views/OntologyObjectAttributePanel/components/DataSourceAssociateDialog.vue", 'data-onboarding="associate-map-datasource"'],
    ["../src/views/OntologyObjectAttributePanel/components/DataSourceAssociateDialog.vue", 'data-onboarding="associate-fields"'],
    ["../src/views/OntologyObjectAttributePanel/components/DataSourceAssociateDialog.vue", 'data-onboarding="associate-link"'],
    ["../src/views/OntologyObjectAttributePanel/components/DataSourceAssociateDialog.vue", 'data-onboarding="associate-drag"'],
    ["../src/views/OntologyObjectAttributePanel/components/DataSourceAssociateDialog.vue", 'data-onboarding="associate-auto"'],
    ["../src/views/OntologyObjectAttributePanel/components/DataSourceAssociateDialog.vue", 'data-onboarding="associate-submit"'],
  ];
  for (const [file, anchor] of anchors) {
    const source = readSource(file);
    assert.match(source, new RegExp(anchor.replaceAll("$", "\\$")), `missing anchor ${anchor} in ${file}`);
  }
});

test("onboarding guide overlay registers as a global component", () => {
  const source = readSource("../src/components/register.ts");
  assert.match(source, /import OnboardingGuideOverlay from "\.\/OnboardingGuide\/OnboardingGuideOverlay\.vue";/);
  assert.match(source, /app\.component\("OnboardingGuideOverlay", OnboardingGuideOverlay\);/);
});
