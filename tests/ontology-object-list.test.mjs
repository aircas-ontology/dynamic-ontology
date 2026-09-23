import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("object cards hide the parent ontology row when none is available", () => {
  const source = readSource("../src/views/OntologySpaceManagementDetail/components/OntologyObjectList.vue");
  assert.match(source, /parentDisplayName !== '无'/);
  assert.doesNotMatch(source, /父本体：—/);
  assert.doesNotMatch(source, /ontology-object-card__parent--placeholder/);
});

test("object table operation column keeps all actions on one line", () => {
  const source = readSource("../src/views/OntologySpaceManagementDetail/components/OntologyObjectList.vue");
  assert.match(source, /<el-table-column label="操作" width="300" fixed="right">/);
  assert.match(source, /white-space:\s*nowrap/);
});

test("object card and table actions use the prototype button colors", () => {
  const source = readSource("../src/views/OntologySpaceManagementDetail/components/OntologyObjectList.vue");
  assert.equal((source.match(/class="aircas-button ontology-object-action ontology-object-action--view"/g) || []).length, 1);
  assert.equal((source.match(/class="aircas-button ontology-object-action ontology-object-action--edit"/g) || []).length, 1);
  assert.equal((source.match(/class="aircas-button ontology-object-action ontology-object-action--export"/g) || []).length, 1);
  assert.equal((source.match(/class="aircas-button ontology-object-action ontology-object-action--delete"/g) || []).length, 1);
  assert.match(
    source,
    /\.ontology-object-card__actions\s+\.ontology-object-action--view\.aircas-button\.el-button:not\(\.el-button--primary\)[\s\S]*background: linear-gradient\(90deg, var\(--aircas-color-active-background\), var\(--aircas-color-blue-fill\)\)/,
  );
  assert.match(source, /\.ontology-object-card__actions\s+\.ontology-object-action--edit[\s\S]*background: var\(--aircas-color-blue-soft\)/);
  assert.match(source, /\.ontology-object-card__actions\s+\.ontology-object-action--export[\s\S]*background: var\(--aircas-color-panel-overlay-deep\)/);
  assert.match(
    source,
    /\.ontology-object-card__actions\s+\.ontology-object-action--delete\.aircas-button\.el-button\.el-button--danger[\s\S]*background: var\(--aircas-color-danger-background\)/,
  );
  assert.match(source, /ontology-object-card__actions \.ontology-object-action\.aircas-button\.el-button[\s\S]*height: 28px/);
  assert.match(source, /ontology-object-action__icon[\s\S]*fill: none/);
  assert.match(source, /ontology-object-action__icon[\s\S]*stroke: currentColor/);
  assert.doesNotMatch(source, /<View|<EditPen|<Download|<Delete/);
});

test("object list view switch matches the space list and create uses the detail tone", () => {
  const source = readSource("../src/views/OntologySpaceManagementDetail/components/OntologyObjectList.vue");
  assert.match(source, /class="aircas-radio-group ontology-object-list__view-switch"/);
  assert.match(source, /el-radio-button value="card"/);
  assert.match(source, /el-radio-button value="table"/);
  assert.match(source, /ontology-object-list__view-icon[\s\S]*fill: none/);
  assert.match(source, /ontology-object-list__view-icon[\s\S]*stroke: currentColor/);
  assert.match(
    source,
    /ontology-object-list__view-switch\.aircas-radio-group :deep\(\.el-radio-button__original-radio:checked \+ \.el-radio-button__inner\)[\s\S]*border-color: var\(--aircas-color-accent-cyan\)[\s\S]*background: var\(--aircas-color-active-background\)[\s\S]*box-shadow: 0 0 10px var\(--aircas-color-cyan-soft\)/,
  );
  assert.match(source, /class="aircas-button aircas-button--tone-primary"[\s\S]*新建本体/);
  assert.doesNotMatch(source, /<Grid|<List/);
});

test("object cards use the prototype inset background and image glow", () => {
  const source = readSource("../src/views/OntologySpaceManagementDetail/components/OntologyObjectList.vue");
  assert.match(source, /background: var\(--aircas-color-card-background\)/);
  assert.match(source, /box-shadow: inset 0 0 20px var\(--aircas-color-border-shadow\)/);
  assert.match(
    source,
    /linear-gradient\(\s*90deg,\s*var\(--aircas-color-accent-cyan\),\s*var\(--aircas-color-accent-blue\),\s*var\(--aircas-color-accent-purple\)\s*\)/,
  );
  assert.match(source, /radial-gradient\(circle at 50% 40%, var\(--aircas-color-cyan-soft\), var\(--aircas-color-transparent\) 58%\)/);
  assert.match(source, /var\(--aircas-color-section-header\)/);
});
