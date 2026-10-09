import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/**
 * @description 读取当前测试直接相关的源码。
 * @param {string} relativePath 相对测试目录的文件路径。
 * @returns {string} 源码内容。
 */
const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("shared buttons cover current primary, danger, plain, text, and disabled styles", () => {
  const source = readSource("../src/styles/element-plus/el-button.scss");
  assert.match(source, /&\.el-button--primary[\s\S]*background-color: var\(--aircas-color-button-primary-background\)/);
  assert.match(source, /&\.el-button--danger[\s\S]*background-color: var\(--aircas-color-button-danger-background\)/);
  assert.match(source, /&\.is-plain[\s\S]*background-color: var\(--aircas-color-transparent\)/);
  assert.match(source, /&\.is-text[\s\S]*background-color: var\(--aircas-color-transparent\)/);
  assert.match(source, /&\.is-disabled[\s\S]*cursor: not-allowed/);
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
