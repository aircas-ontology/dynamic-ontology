import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pageSource = readFileSync(new URL("../src/views/OntologySpaceManagement/index.vue", import.meta.url), "utf8");

test("space management entry only composes page sections and lifecycle", () => {
  assert.match(pageSource, /SpaceCollection/);
  assert.match(pageSource, /SpaceCommandDialogs/);
  assert.match(pageSource, /useSpaceManagementActions/);
  assert.doesNotMatch(pageSource, /useRouter|ElMessage|downloadSpaceJson|serializeSpace/);
  assert.doesNotMatch(pageSource, /<el-dialog/);
});

test("space collection delegates table and card rendering", () => {
  const source = readFileSync(new URL("../src/views/OntologySpaceManagement/components/SpaceCollection.vue", import.meta.url), "utf8");
  assert.match(source, /SpaceTableView/);
  assert.match(source, /SpaceCardGrid/);
  assert.match(source, /el-pagination/);
});

test("welcome panel emphasizes the guest name and uses a solid create button", () => {
  const source = readFileSync(new URL("../src/views/OntologySpaceManagement/components/WelcomePanel.vue", import.meta.url), "utf8");
  assert.match(source, /<span>访客<\/span>/);
  assert.match(source, /h1 span[\s\S]*color: var\(--aircas-color-accent-cyan\)/);
  assert.match(source, /welcome-panel__create/);
  assert.match(source, /welcome-panel__create\.el-button--primary[\s\S]*background-color: var\(--aircas-color-transparent\)/);
  assert.match(source, /welcome-panel__create\.el-button--primary[\s\S]*border-color: var\(--aircas-color-accent-cyan\)/);
  assert.match(source, /welcome-panel__create\.el-button--primary[\s\S]*color: var\(--aircas-color-accent-cyan\)/);
});

test("overview welcome and stat cards share prototype height and overlay background", () => {
  const page = readFileSync(new URL("../src/views/OntologySpaceManagement/index.vue", import.meta.url), "utf8");
  const welcome = readFileSync(new URL("../src/views/OntologySpaceManagement/components/WelcomePanel.vue", import.meta.url), "utf8");
  const stat = readFileSync(new URL("../src/views/OntologySpaceManagement/components/StatCard.vue", import.meta.url), "utf8");
  assert.match(page, /\.ontology-space-management__overview[\s\S]*min-height: 150px/);
  assert.match(welcome, /min-height: 150px/);
  assert.match(welcome, /linear-gradient/);
  assert.match(stat, /min-height: 150px/);
  assert.match(stat, /linear-gradient/);
  assert.match(stat, /\.stat-card\.aircas-card\.stat-card--object[\s\S]*--aircas-color-accent-green/);
  assert.match(stat, /\.stat-card\.aircas-card\.stat-card--behavior[\s\S]*--aircas-color-accent-blue/);
  assert.match(stat, /\.stat-card\.aircas-card\.stat-card--relation[\s\S]*--aircas-color-accent-purple/);
  assert.doesNotMatch(stat, /今日新增/);
  assert.doesNotMatch(stat, /stat-card__spark/);
});

test("section toolbar uses name sort select and card-then-table view toggle", () => {
  const source = readFileSync(new URL("../src/views/OntologySpaceManagement/components/SectionToolbar.vue", import.meta.url), "utf8");
  assert.match(source, /class="aircas-select"/);
  assert.match(source, /popper-class="aircas-select-popper"/);
  assert.match(source, /value="asc"/);
  assert.match(source, /value="desc"/);
  assert.match(source, /h2[\s\S]*font-size: 16px/);
  assert.match(source, /h2[\s\S]*font-weight: 700/);
  assert.match(source, /h2[\s\S]*color: var\(--aircas-color-text-primary\)/);
  assert.match(source, /p[\s\S]*color: var\(--aircas-color-text-muted\)/);
  assert.match(source, /以表格视图管理全部本体空间/);
  assert.match(source, /以卡片视图管理全部本体空间/);
  assert.match(source, /section-toolbar__view-icon/);
  assert.match(source, /fill: none/);
  assert.match(source, /stroke: currentColor/);
  assert.doesNotMatch(source, /<Grid/);
  assert.doesNotMatch(source, /<List/);
  assert.match(source, /section-toolbar__view/);
  assert.match(source, /gap: 4px/);
  assert.match(source, /border-radius: 4px/);
  assert.match(
    source,
    /section-toolbar__view\.aircas-radio-group :deep\(\.el-radio-button__original-radio:checked \+ \.el-radio-button__inner\)[\s\S]*border-color: var\(--aircas-color-accent-cyan\)[\s\S]*background: var\(--aircas-color-active-background\)[\s\S]*color: var\(--aircas-color-text-primary\)[\s\S]*box-shadow: 0 0 10px var\(--aircas-color-accent-cyan-soft\)/,
  );
  const cardIndex = source.indexOf('value="card"');
  const tableIndex = source.indexOf('value="table"');
  assert.ok(cardIndex >= 0 && tableIndex >= 0 && cardIndex < tableIndex);
});

test("space table keeps prototype name column and overlay gradient", () => {
  const source = readFileSync(new URL("../src/views/OntologySpaceManagement/components/SpaceTableView.vue", import.meta.url), "utf8");
  assert.match(source, /space-table-view__icon/);
  assert.match(source, /width: 48px/);
  assert.match(source, /space-table-view__name strong[\s\S]*--aircas-color-text-primary/);
  assert.match(source, /aircas-table--flat/);
  assert.match(source, /linear-gradient/);
  assert.match(source, /tr > td\.el-table__cell[\s\S]*--aircas-color-panel-background\) !important/);
  assert.match(source, /el-table__row--striped > td\.el-table__cell[\s\S]*--aircas-color-panel-background-deep\) !important/);
  assert.doesNotMatch(source, /创建用户/);
});

test("space cards follow the prototype frame, metrics, and footer", () => {
  const source = readFileSync(new URL("../src/views/OntologySpaceManagement/components/SpaceCardGrid.vue", import.meta.url), "utf8");
  assert.match(source, /space-card__logo/);
  assert.match(source, /width: 48px/);
  assert.match(source, /border: 1px solid var\(--aircas-color-accent-cyan-border\)/);
  assert.match(source, /-webkit-line-clamp: 2/);
  assert.match(source, /border-top: 1px dashed var\(--aircas-color-border-soft\)/);
  assert.match(source, /grid-template-columns: 1fr 1fr/);
  assert.match(source, /创建：/);
  assert.match(source, /更新：/);
  assert.match(source, />对象/);
  assert.match(source, />行为/);
  assert.match(source, />关系/);
  assert.match(source, />规则/);
  assert.match(source, /--aircas-color-accent-blue/);
  assert.match(source, /--aircas-color-accent-purple/);
  assert.match(source, /linear-gradient\(90deg, var\(--aircas-color-active-background\), var\(--aircas-color-accent-blue-fill\)\)/);
});

test("space row actions share outlined primary buttons", () => {
  const source = readFileSync(new URL("../src/views/OntologySpaceManagement/components/SpaceActions.vue", import.meta.url), "utf8");
  assert.equal((source.match(/type="primary" plain/g) || []).length, 3);
  assert.match(source, /:icon="Right"/);
  assert.match(source, /:icon="Edit"/);
  assert.match(source, />更多/);
  assert.doesNotMatch(source, /aircas-button--edit/);
});
