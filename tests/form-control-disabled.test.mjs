import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("disabled inputs and selects share the theme disabled colors", () => {
  const input = readSource("../src/styles/element-plus/el-input.scss");
  const select = readSource("../src/styles/element-plus/el-select.scss");
  const treeSelect = readSource("../src/styles/element-plus/el-tree-select.scss");
  const disabledInput = input.match(/&\.is-disabled[\s\S]*?\.el-input__count/)?.[0] ?? "";
  const disabledSelect = select.match(/\.el-select__wrapper\.is-disabled \{[\s\S]*?\n  \}/)?.[0] ?? "";
  const disabledTreeSelect = treeSelect.match(/\.el-select__wrapper\.is-disabled \{[\s\S]*?\n  \}/)?.[0] ?? "";

  for (const source of [disabledInput, disabledSelect, disabledTreeSelect]) {
    assert.match(source, /background-color: var\(--aircas-color-panel-background\)/);
    assert.match(source, /color: var\(--aircas-color-text-disabled\)/);
    assert.match(source, /box-shadow: 0 0 0 1px var\(--aircas-color-border\) inset/);
  }
  assert.match(disabledInput, /-webkit-text-fill-color: var\(--aircas-color-text-disabled\)/);
  assert.match(disabledSelect, /\.el-select__placeholder/);
  assert.match(disabledSelect, /\.el-select__caret/);
  assert.match(disabledTreeSelect, /\.el-select__placeholder/);
  assert.match(select, /is-hovering:not\(\.is-focused\):not\(\.is-disabled\)/);
  assert.match(treeSelect, /is-hovering:not\(\.is-focused\):not\(\.is-disabled\)/);
});
