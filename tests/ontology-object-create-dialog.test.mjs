import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("ontology object create dialog exposes prototype creation modes and required fields", () => {
  const source = readSource("../src/views/OntologySpaceManagementDetail/components/OntologyObjectCreateDialog.vue");
  assert.match(source, /title="新建本体"/);
  assert.match(source, /手动创建/);
  assert.match(source, /导入创建/);
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
  const panelSource = readSource("../src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue");
  const actionsSource = readSource("../src/views/OntologySpaceManagementDetail/composables/useObjectWorkspaceObjectActions.ts");
  assert.match(panelSource, /<OntologyObjectCreateDialog/);
  assert.match(panelSource, /:category-tree="workspaceTree"/);
  assert.match(panelSource, /@submit-manual="createOntologyObject"/);
  assert.match(panelSource, /@submit-import="createOntologyObjects"/);
  assert.match(panelSource, /if \(action === "create"\)/);
  assert.match(actionsSource, /createOntologyObjectInterface/);
  assert.match(actionsSource, /await load\(\)/);
});

test("category tree mapping includes ontology metadata in object sections", () => {
  const source = readSource("../src/views/OntologySpaceManagementDetail/utils/mapOntologyCategoryTree.ts");
  assert.match(source, /mapOntologyCategorySections/);
  assert.match(source, /node\.ontologyMetaInfos/);
  assert.match(source, /objectNames:/);
  assert.match(source, /meta\.displayName/);
  assert.match(source, /propertyCount/);
});

test("concept hierarchy tree renders object names below each category node", () => {
  const source = readSource("../src/views/OntologySpaceManagementDetail/components/ConceptHierarchyTree.vue");
  assert.match(source, /nodeObjectNames\(data\)/);
  assert.match(source, /本体对象名称/);
  assert.match(source, /concept-hierarchy__object-node/);
  assert.match(source, /concept-hierarchy__object-icon/);
  assert.match(source, /concept-hierarchy__object-name/);
});
