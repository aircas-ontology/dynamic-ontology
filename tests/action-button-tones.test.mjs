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

test("card gradients are explicit and ordinary actions use default component props", () => {
  const objectList = readSource("../src/views/ObjectWorkspacePanel/components/OntologyObjectList.vue");
  const spaceActions = readSource("../src/views/OntologySpaceManagement/components/SpaceActions.vue");
  assert.match(objectList, /ontology-object-action--view aircas-button--gradient/);
  assert.match(objectList, /type="danger"/);
  assert.match(spaceActions, /'aircas-button--gradient': gradient/);
  assert.doesNotMatch(objectList + spaceActions, /aircas-button--tone-/);
});
