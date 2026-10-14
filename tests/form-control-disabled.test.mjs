import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("disabled inputs and selects share the theme disabled colors", () => {
  const mapping = readSource("../src/styles/variables.scss");
  assert.match(mapping, /--el-disabled-bg-color: var\(--aircas-color-section-background\)/);
  assert.match(mapping, /--el-disabled-text-color: var\(--aircas-color-text-disabled\)/);
  assert.match(mapping, /--el-disabled-border-color: var\(--aircas-color-border-light\)/);
  const input = readSource("../src/styles/components/input.scss");
  const select = readSource("../src/styles/components/select.scss");
  assert.doesNotMatch(input + select, /is-disabled/);
});
