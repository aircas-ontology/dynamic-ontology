import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("shared action tones cover primary, secondary, ghost, and danger buttons", () => {
  const source = readSource("../src/styles/element-plus/el-button.scss");
  assert.match(
    source,
    /\.aircas-button--tone-primary:not\(\.el-button--primary\)[\s\S]*background: linear-gradient\(90deg, var\(--aircas-color-active-background\), var\(--aircas-color-blue-fill\)\)/,
  );
  assert.match(source, /\.aircas-button--tone-secondary:not\(\.el-button--primary\)[\s\S]*background: var\(--aircas-color-blue-soft\)/);
  assert.match(source, /\.aircas-button--tone-ghost:not\(\.el-button--primary\)[\s\S]*background: var\(--aircas-color-panel-overlay-deep\)/);
  assert.match(source, /\.el-button--danger\.aircas-button--tone-danger[\s\S]*background: var\(--aircas-color-danger-background\)/);
});

test("list and table actions use the shared button tones", () => {
  const objectList = readSource("../src/views/OntologySpaceManagementDetail/components/OntologyObjectList.vue");
  const attributeTable = readSource("../src/views/OntologyObjectDetail/components/AttributePropertyTable.vue");
  const relationWorkspace = readSource("../src/views/OntologySpaceManagementDetail/relationComponents/SpaceRelationWorkspace.vue");
  const spaceActions = readSource("../src/views/OntologySpaceManagement/components/SpaceActions.vue");
  const relationGraph = readSource("../src/views/OntologySpaceManagementDetail/relationComponents/RelationGraphView.vue");

  assert.match(objectList, /ontology-object-action--view aircas-button--tone-primary/);
  assert.match(objectList, /ontology-object-action--edit aircas-button--tone-secondary/);
  assert.match(objectList, /ontology-object-action--export aircas-button--tone-ghost/);
  assert.match(objectList, /ontology-object-action--delete aircas-button--tone-danger/);
  assert.match(attributeTable, /aircas-button aircas-button--tone-secondary/);
  assert.match(attributeTable, /aircas-button aircas-button--tone-danger/);
  assert.match(relationWorkspace, /aircas-button aircas-button--tone-secondary/);
  assert.match(relationWorkspace, /aircas-button aircas-button--tone-danger/);
  assert.match(spaceActions, /aircas-button aircas-button--tone-primary/);
  assert.match(spaceActions, /aircas-button aircas-button--tone-secondary/);
  assert.match(spaceActions, /aircas-button aircas-button--tone-ghost/);
  assert.match(relationGraph, /\.relation-graph-context-menu__item-danger[\s\S]*background: var\(--aircas-color-danger-background\)/);
});
