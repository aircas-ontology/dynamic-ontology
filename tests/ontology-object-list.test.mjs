import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("object cards hide the parent ontology row when none is available", () => {
  const source = readSource("../src/views/ObjectWorkspacePanel/components/OntologyObjectList.vue");
  assert.match(source, /parentDisplayName !== '无'/);
  assert.doesNotMatch(source, /父本体：—/);
  assert.doesNotMatch(source, /ontology-object-card__parent--placeholder/);
});

test("object table operation column keeps all actions on one line", () => {
  const source = readSource("../src/views/ObjectWorkspacePanel/components/OntologyObjectList.vue");
  assert.match(source, /<el-table-column label="操作" width="300" fixed="right">/);
  assert.match(source, /white-space:\s*nowrap/);
});

test("object card and table actions use the prototype button colors", () => {
  const source = readSource("../src/views/ObjectWorkspacePanel/components/OntologyObjectList.vue");
  for (const action of ["view", "edit", "export", "delete"]) {
    assert.equal((source.match(new RegExp(`ontology-object-action--${action}(?:[ " ])`, "g")) || []).length, 2);
  }
  assert.equal((source.match(/aircas-button--gradient/g) || []).length, 1);
  assert.match(source, /ontology-object-card__actions \.ontology-object-action\.el-button[\s\S]*height: 28px/);
  assert.match(source, /ontology-object-action__icon[\s\S]*fill: none/);
  assert.match(source, /ontology-object-action__icon[\s\S]*stroke: currentColor/);
  assert.match(source, /type="danger"/);
  assert.doesNotMatch(source, /aircas-button--tone-|<View|<EditPen|<Download|<Delete/);
});

test("object list view switch matches the space list and create uses the detail tone", () => {
  const source = readSource("../src/views/ObjectWorkspacePanel/components/OntologyObjectList.vue");
  assert.match(source, /class="ontology-object-list__view-switch"/);
  assert.match(source, /el-radio-button value="card"/);
  assert.match(source, /el-radio-button value="table"/);
  assert.match(source, /ontology-object-list__view-icon[\s\S]*fill: none/);
  assert.match(source, /ontology-object-list__view-icon[\s\S]*stroke: currentColor/);
  assert.doesNotMatch(source, /original-radio:checked/);
  assert.match(source, /<el-button[^>]*type="primary"[\s\S]*新建本体/);
  assert.doesNotMatch(source, /aircas-button--tone-primary"[\s\S]*新建本体/);
  assert.doesNotMatch(source, /<Grid|<List/);
});

test("object cards use the prototype inset background and image glow", () => {
  const source = readSource("../src/views/ObjectWorkspacePanel/components/OntologyObjectList.vue");
  assert.match(source, /background: var\(--aircas-color-card-background\)/);
  assert.match(source, /box-shadow: inset 0 0 20px var\(--aircas-color-effect-page-glow\)/);
  assert.match(
    source,
    /linear-gradient\(\s*90deg,\s*var\(--aircas-color-primary\),\s*var\(--aircas-color-category-blue\),\s*var\(--aircas-color-category-purple\)\s*\)/,
  );
  assert.match(source, /radial-gradient\(circle at 50% 40%, var\(--aircas-color-effect-primary-soft\), transparent 58%\)/);
  assert.match(source, /var\(--aircas-color-section-header\)/);
});
