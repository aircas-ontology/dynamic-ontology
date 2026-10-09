import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("ontology object create dialog exposes prototype creation modes and required fields", () => {
  const source = readSource("../src/views/OntologySpaceManagementDetail/components/OntologyObjectCreateDialog.vue");
  assert.match(source, /title="新建本体"/);
  assert.match(source, /手动创建/);
  assert.match(source, /导入创建/);
  assert.match(source, /class="aircas-upload ontology-object-create-dialog__upload"/);
  assert.match(
    source,
    /ontology-object-create-dialog__upload :deep\(\.el-upload-dragger\)[\s\S]*background-color: var\(--aircas-color-input-background\)[\s\S]*border: 1px dashed var\(--aircas-color-border\)/,
  );
  assert.match(source, /ontology-object-create-dialog__upload :deep\(\.el-upload-dragger:hover\)[\s\S]*border-color: var\(--aircas-color-border-highlight\)/);
  assert.match(source, /ontology-object-create-dialog__upload :deep\(\.el-upload-dragger \.el-icon\)[\s\S]*color: var\(--aircas-color-title\)/);
  assert.match(source, /大模型构建/);
  assert.match(source, /API 名称/);
  assert.match(source, /显示名称/);
  assert.match(source, /继承本体/);
  assert.match(source, /分类/);
  assert.match(source, /el-tree-select/);
  assert.match(source, /aircas-tree-select/);
  assert.match(source, /check-strictly/);
  assert.doesNotMatch(source, /<el-select v-model="draft\.categoryId"/);
  assert.match(source, /submitCreate/);
  assert.match(source, /const payload: OntologyObjectCreateDraft = \{ \.\.\.draft \}/);
  assert.doesNotMatch(source, /structuredClone\(draft\)/);
});

test("object workspace routes create action to the dialog and separates manual api submission", () => {
  const source = readSource("../src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue");
  const objectActions = readSource("../src/views/OntologySpaceManagementDetail/composables/useObjectWorkspaceObjectActions.ts");
  assert.match(source, /:category-tree="workspaceTree"/);
  assert.match(source, /@submit-manual="createOntologyObject"/);
  assert.match(source, /@submit-import="importOntologyObjects"/);
  assert.match(source, /if \(action === "create"\)/);
  assert.match(source, /useObjectWorkspaceObjectActions/);
  assert.match(objectActions, /createOntologyObjectInterface/);
  assert.match(objectActions, /await load\(\)/);
});

test("category tree mapping includes ontology metadata in object sections", () => {
  const source = readSource("../src/views/OntologySpaceManagementDetail/utils/mapOntologyCategoryTree.ts");
  assert.match(source, /mapOntologyCategorySections/);
  assert.match(source, /node\.ontologyMetaInfos/);
  assert.match(source, /objects:/);
  assert.match(source, /meta\.uniqueIdentifier/);
  assert.match(source, /meta\.displayName/);
  assert.match(source, /propertyCount/);
});

test("concept hierarchy tree renders object names below each category node", () => {
  const source = readSource("../src/views/OntologySpaceManagementDetail/components/ConceptHierarchyTree.vue");
  assert.match(source, /isObjectNode\(data\)/);
  assert.match(source, /concept-hierarchy__object-row/);
  assert.match(source, /concept-hierarchy__object-dot/);
  assert.match(source, /concept-hierarchy__object-name/);
});

test("clicking a tree object node navigates to the object detail page", () => {
  const treeSource = readSource("../src/views/OntologySpaceManagementDetail/components/ConceptHierarchyTree.vue");
  assert.match(treeSource, /"select-object": \[object: OntologyConceptObjectRef\]/);
  assert.match(treeSource, /emit\("select-object", \{ uniqueIdentifier: value\.objectId, displayName: value\.label \}\)/);
  const panelSource = readSource("../src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue");
  assert.match(panelSource, /@select-object="openObjectDetailFromTree"/);
  assert.match(panelSource, /name: "OntologyObjectDetail", params: \{ objectId \}/);
});
