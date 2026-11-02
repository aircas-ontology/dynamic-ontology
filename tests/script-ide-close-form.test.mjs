import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("closing script ide via dialog close also closes the parent form", () => {
  const formSource = readFileSync(new URL("../src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue", import.meta.url), "utf8");
  const ideSource = readFileSync(new URL("../src/views/FunctionOperatorPanel/components/FunctionOperatorScriptIdeDialog.vue", import.meta.url), "utf8");
  assert.match(formSource, /function onScriptIdeVisibleChange/);
  assert.match(formSource, /function onScriptIdeBack/);
  assert.match(formSource, /skipCloseFormOnScriptIdeHide/);
  assert.match(formSource, /@update:model-value="onScriptIdeVisibleChange"/);
  assert.match(formSource, /@back="onScriptIdeBack"/);
  assert.match(formSource, /emit\(["']update:modelValue["'],\s*false\)/);
  assert.match(ideSource, /emit\(["']back["']\)/);
  assert.doesNotMatch(ideSource, /function goBackPreviousStep[\s\S]*emit\(["']update:modelValue["'],\s*false\)/);
});
