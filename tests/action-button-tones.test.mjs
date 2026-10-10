import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("shared special effects preserve gradients and disabled defaults without legacy tones", () => {
  const source = readSource("../src/styles/components/special-effects.scss");
  assert.match(source, /\.el-button\.aircas-button--gradient[\s\S]*linear-gradient/);
  assert.match(source, /not\(\.is-disabled\):hover[\s\S]*?color: var\(--aircas-color-text-primary\)/);
  assert.match(source, /is-disabled[\s\S]*--el-disabled-bg-color/);
  assert.doesNotMatch(source, /tone-secondary|tone-ghost|tone-danger/);
});

test("card gradients are explicit and ordinary actions use default component props", () => {
  const objectList = readSource("../src/views/ObjectWorkspacePanel/components/OntologyObjectList.vue");
  const spaceActions = readSource("../src/views/OntologySpaceManagement/components/SpaceActions.vue");
  assert.match(objectList, /ontology-object-action--view aircas-button--gradient/);
  assert.match(objectList, /type="danger"/);
  assert.match(spaceActions, /'aircas-button--gradient': gradient/);
  assert.doesNotMatch(objectList + spaceActions, /aircas-button--tone-/);
});
