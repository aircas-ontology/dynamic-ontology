import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("data source mapping dialog uses prototype class, width and non-dismissable modal", () => {
  const source = readSource("../src/views/OntologyObjectDetail/components/DataSourceAssociateDialog.vue");
  assert.match(source, /class="property-datasource-mapping-dialog aircas-dialog"/);
  assert.match(source, /title="关联数据源"/);
  assert.match(source, /width="92vw"/);
  assert.match(source, /:close-on-click-modal="false"/);
  assert.match(source, /destroy-on-close/);
  assert.match(source, /append-to-body/);
});

test("data source mapping dialog toolbar exposes selects and action buttons", () => {
  const source = readSource("../src/views/OntologyObjectDetail/components/DataSourceAssociateDialog.vue");
  assert.match(source, /选择数据源/);
  assert.match(source, /关联数据源/);
  assert.match(source, /关联数据源字段/);
  assert.match(source, /<Connection \/>/);
  assert.match(source, /关联本体字段/);
  assert.match(source, />关联<\/el-button>/);
  assert.match(source, /自动关联数据源/);
  assert.match(source, /跳转到数据管道/);
  assert.match(source, /:disabled="!canAddManualBind \|\| loading"/);
});

test("data source mapping dialog renders prototype workspace, panels and svg lines", () => {
  const source = readSource("../src/views/OntologyObjectDetail/components/DataSourceAssociateDialog.vue");
  assert.match(source, /property-datasource-mapping-dialog__workspace/);
  assert.match(source, /property-datasource-mapping-dialog__panels/);
  assert.match(source, /property-datasource-mapping-dialog__source/);
  assert.match(source, /property-datasource-mapping-dialog__target/);
  assert.match(source, /property-datasource-mapping-dialog__svg/);
  assert.match(source, /class="mapping-line/);
  assert.match(source, /@dblclick\.stop="removeBind\(line\.id\)"/);
});

test("data source mapping dialog renders mind-node tables, field-list and property-list with anchors", () => {
  const source = readSource("../src/views/OntologyObjectDetail/components/DataSourceAssociateDialog.vue");
  assert.match(source, /mind-node mind-node-table/);
  assert.match(source, /mind-node__toggle/);
  assert.match(source, /mind-node__badge/);
  assert.match(source, /field-list/);
  assert.match(source, /property-list/);
  assert.match(source, /mapping-anchor mapping-anchor-source/);
  assert.match(source, /mapping-anchor mapping-anchor-target/);
  assert.match(source, /@pointerdown\.prevent="startDrag/);
});

test("data source mapping dialog operation cache panel exposes submit and hint text", () => {
  const source = readSource("../src/views/OntologyObjectDetail/components/DataSourceAssociateDialog.vue");
  assert.match(source, /操作缓存/);
  assert.match(source, /项待提交/);
  assert.match(source, /图中双击连线可临时删除，提交后保存。/);
  assert.match(source, /已关联 \{\{ mappedCount \}\} \/ \{\{ properties\.length \}\}/);
  assert.match(source, /:disabled="!pendingOperations\.length"/);
});

test("data source mapping dialog defines local prototype types and exposes setLoading", () => {
  const source = readSource("../src/views/OntologyObjectDetail/components/DataSourceAssociateDialog.vue");
  assert.match(source, /interface OntologyDataSourceDatabase/);
  assert.match(source, /interface OntologyPropertyClass/);
  assert.match(source, /interface OntologyPropertyDataSourceBind/);
  assert.match(source, /interface PropertyDataSourceBindPayload/);
  assert.match(source, /defineExpose\(\{\s*setLoading/);
  assert.match(source, /emit\("submit", payloads\)/);
});

test("data source mapping dialog delegates automatic binding to the parent", () => {
  const source = readSource("../src/views/OntologyObjectDetail/components/DataSourceAssociateDialog.vue");
  assert.match(source, /auto-associate/);
  assert.match(source, /emit\('auto-associate'\)/);
  assert.match(source, /@click="emit\('auto-associate'\)"/);
  assert.doesNotMatch(source, /function autoAssociate\(\)/);
});

test("attribute panel wires api catalog and all properties to the data source mapping dialog", () => {
  const source = readSource("../src/views/OntologyObjectDetail/components/OntologyObjectAttributePanel.vue");
  assert.match(source, /import DataSourceAssociateDialog from "\.\/DataSourceAssociateDialog\.vue"/);
  assert.match(source, /const dataSourceDialogVisible = ref\(false\)/);
  assert.match(source, /:catalog="dataSourceCatalog"/);
  assert.match(source, /:properties="ontologyPropertyMappings"/);
  assert.match(source, /@table-change="loadDataSourceColumns"/);
  assert.match(source, /dataSourceId: record\.tableName/);
  assert.match(source, /dataSourceId: table\.dataSourceId/);
  assert.match(source, /void loadDataSourceTables\(\)/);
  assert.match(source, /@submit="handleDataSourceSubmit"/);
  assert.match(source, /function openDataSource\(\) \{[\s\S]*dataSourceDialogVisible\.value = true;[\s\S]*loadDataSourceTables/);
});

test("attribute panel handles automatic datasource binding without closing the dialog", () => {
  const source = readSource("../src/views/OntologyObjectDetail/components/OntologyObjectAttributePanel.vue");
  assert.match(source, /autoBindOntologyPropertyDatasourceInterface/);
  assert.match(source, /@auto-associate="handleAutoDataSourceAssociate"/);
  assert.match(source, /const ontologyIdentifier = String\(route\.params\.objectId \|\| \"\"\)\.trim\(\)/);
  assert.match(source, /自动关联数据源成功/);
  assert.doesNotMatch(source, /dataSourceDialogVisible\.value = false;[\s\S]*自动关联数据源成功/);
});
