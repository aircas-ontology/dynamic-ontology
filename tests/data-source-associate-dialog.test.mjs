import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { computed, ref } from "vue";
import ts from "typescript";

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

/** @description 使用组件实际脚本创建关联草稿测试环境。 @param {object[]} properties 属性及已保存关联。 @returns {object} 状态和提交记录。 */
function createMappingDialog(properties) {
  const source = readSource("../src/views/OntologyObjectAttributePanel/components/DataSourceAssociateDialog.vue");
  const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/import[\s\S]*?from\s+"[^"]+";/g, "");
  const submissions = [];
  let exposed;
  const deps = {
    computed,
    ref,
    nextTick: () => Promise.resolve(),
    watch: () => {},
    onMounted: () => {},
    onBeforeUnmount: () => {},
    defineProps: () => ({ properties, catalog: [], modelValue: true, autoAssociateLoading: false }),
    defineEmits: () => (name, payload) => {
      if (name === "submit") submissions.push(payload);
    },
    defineExpose: (value) => {
      exposed = value;
    },
  };
  const create = new Function(
    ...Object.keys(deps),
    ts.transpile(
      `${script}\nreturn { initDraftBinds, draftBinds, savedBinds, pendingOperations, mappedCount, removeAllBinds, undoOperation, handleConfirm, loading };`,
      {
        target: ts.ScriptTarget.ES2022,
      },
    ),
  );
  const state = create(...Object.values(deps));
  state.initDraftBinds();
  return { ...state, submissions, exposed };
}

test("remove all stages saved deletions, cancels additions, and preserves retry and undo", () => {
  const bind = (field) => ({ databaseId: "db", databaseName: "db", schemaName: "s", tableId: "t", tableName: "table", fieldId: field, fieldName: field });
  const properties = [
    { id: "a", apiName: "a", dataSource: bind("old-a") },
    { id: "b", apiName: "b", dataSource: bind("old-b") },
    { id: "c", apiName: "c", dataSource: null },
  ];
  const state = createMappingDialog(properties);
  state.draftBinds.value = new Map([
    ["a", bind("new-a")],
    ["b", bind("old-b")],
    ["c", bind("new-c")],
  ]);
  state.removeAllBinds();
  assert.equal(state.mappedCount.value, 0);
  assert.deepEqual(
    state.pendingOperations.value.map(({ propertyId, kind }) => [propertyId, kind]),
    [
      ["a", "remove"],
      ["b", "remove"],
    ],
  );
  assert.equal(state.submissions.length, 0);
  state.removeAllBinds();
  assert.equal(state.pendingOperations.value.length, 2);
  state.undoOperation("a", "remove");
  assert.equal(state.draftBinds.value.get("a").fieldId, "old-a");
  state.removeAllBinds();
  state.handleConfirm();
  assert.deepEqual(state.submissions[0], [
    { id: "a", dataSource: null },
    { id: "b", dataSource: null },
  ]);
  state.removeAllBinds();
  state.handleConfirm();
  assert.equal(state.submissions.length, 1);
  state.exposed.setLoading(false);
  assert.equal(state.pendingOperations.value.length, 2);
  state.handleConfirm();
  assert.equal(state.submissions.length, 2);
  state.exposed.completeSubmit();
  assert.equal(state.pendingOperations.value.length, 0);
});

test("data source mapping dialog uses prototype class, width and non-dismissable modal", () => {
  const source = readSource("../src/views/OntologyObjectAttributePanel/components/DataSourceAssociateDialog.vue");
  assert.match(source, /class="property-datasource-mapping-dialog"/);
  assert.match(source, /title="关联数据源"/);
  assert.match(source, /width="92vw"/);
  assert.match(source, /:close-on-click-modal="false"/);
  assert.match(source, /destroy-on-close/);
  assert.match(source, /append-to-body/);
  assert.doesNotMatch(source, /\.el-dialog__header::before/);
});

test("data source mapping dialog toolbar exposes selects and action buttons", () => {
  const source = readSource("../src/views/OntologyObjectAttributePanel/components/DataSourceAssociateDialog.vue");
  assert.match(source, /选择数据源/);
  assert.match(source, /关联数据源/);
  assert.match(source, /关联数据源字段/);
  assert.match(source, /<Connection \/>/);
  assert.match(source, /关联对象字段/);
  assert.match(source, />关联<\/el-button>/);
  assert.match(source, /自动关联数据源/);
  assert.match(source, /跳转到数据管道/);
  assert.match(source, /:disabled="!canAddManualBind \|\| loading"/);
});

test("data source mapping dialog renders prototype workspace, panels and svg lines", () => {
  const source = readSource("../src/views/OntologyObjectAttributePanel/components/DataSourceAssociateDialog.vue");
  assert.match(source, /property-datasource-mapping-dialog__workspace/);
  assert.match(source, /property-datasource-mapping-dialog__panels/);
  assert.match(source, /property-datasource-mapping-dialog__source/);
  assert.match(source, /property-datasource-mapping-dialog__target/);
  assert.match(source, /property-datasource-mapping-dialog__svg/);
  assert.match(source, /class="mapping-line/);
  assert.match(source, /@dblclick\.stop="removeBind\(line\.id\)"/);
  assert.match(source, /:disabled="loading \|\| autoAssociateLoading \|\| !mappedCount"/);
  assert.match(source, /@click="removeAllBinds"/);
});

test("data source mapping dialog renders mind-node tables, field-list and property-list with anchors", () => {
  const source = readSource("../src/views/OntologyObjectAttributePanel/components/DataSourceAssociateDialog.vue");
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
  const source = readSource("../src/views/OntologyObjectAttributePanel/components/DataSourceAssociateDialog.vue");
  assert.match(source, /操作缓存/);
  assert.match(source, /项待提交/);
  assert.match(source, /图中双击连线可临时删除，提交后保存。/);
  assert.match(source, /已关联 \{\{ mappedCount \}\} \/ \{\{ properties\.length \}\}/);
  assert.match(source, /:disabled="!pendingOperations\.length"/);
});

test("data source mapping dialog defines local prototype types and exposes setLoading", () => {
  const source = readSource("../src/views/OntologyObjectAttributePanel/components/DataSourceAssociateDialog.vue");
  assert.match(source, /interface OntologyDataSourceDatabase/);
  assert.match(source, /interface OntologyPropertyClass/);
  assert.match(source, /interface OntologyPropertyDataSourceBind/);
  assert.match(source, /interface PropertyDataSourceBindPayload/);
  assert.match(source, /defineExpose\(\{[\s\S]*setLoading/);
  assert.match(source, /completeSubmit/);
  assert.match(source, /syncServerMappings/);
  assert.match(source, /emit\("submit", payloads\)/);
});

test("data source mapping dialog keeps manual edits local until submit", () => {
  const source = readSource("../src/views/OntologyObjectAttributePanel/components/DataSourceAssociateDialog.vue");
  const addManualBindSource = source.match(/function addManualBind\(\)[\s\S]*?function removeBind/)?.[0] ?? "";
  const removeBindSource = source.match(/function removeBind[\s\S]*?const dragPreviewPath/)?.[0] ?? "";

  assert.match(source, /const draftBinds = ref<Map/);
  assert.match(source, /const savedBinds = ref<Map/);
  assert.match(source, /schemaName:\s*string/);
  assert.match(source, /schemaName: table\.schemaName/);
  assert.doesNotMatch(addManualBindSource, /Interface\(/);
  assert.doesNotMatch(removeBindSource, /Interface\(/);
  assert.match(source, /function handleConfirm\(\): void[\s\S]*emit\("submit", payloads\)/);
});

test("data source mapping dialog delegates automatic binding to the parent", () => {
  const source = readSource("../src/views/OntologyObjectAttributePanel/components/DataSourceAssociateDialog.vue");
  assert.match(source, /auto-associate/);
  assert.match(source, /emit\('auto-associate'\)/);
  assert.match(source, /@click="emit\('auto-associate'\)"/);
  assert.doesNotMatch(source, /function autoAssociate\(\)/);
});

test("data source mapping tables mark primary and name keys beside field names", () => {
  const dialog = readSource("../src/views/OntologyObjectAttributePanel/components/DataSourceAssociateDialog.vue");
  const panel = readSource("../src/views/OntologyObjectAttributePanel/index.vue");

  assert.match(dialog, /function formatDatasourceKeyMarks/);
  assert.match(dialog, /marks\.push\("（主）"\)/);
  assert.match(dialog, /marks\.push\("（名）"\)/);
  assert.match(dialog, /\{\{ field\.name \}\}\{\{ formatDatasourceKeyMarks\(\{ isPrimary: field\.isPrimary \}\) \}\}/);
  assert.match(dialog, /\{\{ property\.displayName \}\}\{\{ formatDatasourceKeyMarks\(property\) \}\}/);
  assert.match(dialog, /\$\{field\.name\}\$\{formatDatasourceKeyMarks\(\{ isPrimary: field\.isPrimary \}\)\}/);
  assert.match(dialog, /\$\{property\.displayName\}\$\{formatDatasourceKeyMarks\(property\)\} \(\$\{property\.apiName\}\)`/);
  assert.match(panel, /isPrimary: column\.isPrimaryKey === true/);
  assert.match(panel, /isPrimary: item\.isPrimary/);
  assert.match(panel, /isNameKey: item\.isNameKey/);
});

test("data source mapping dialog dropdowns hide fields that are already associated", () => {
  const source = readSource("../src/views/OntologyObjectAttributePanel/components/DataSourceAssociateDialog.vue");
  assert.match(source, /filter\(\(field\) => !isFieldMapped\(databaseId, tableId, field\.id\)\)/);
  assert.match(source, /const availableManualProperties = computed/);
  assert.match(source, /!draftBinds\.value\.get\(property\.id\)/);
  assert.match(source, /v-for="property in availableManualProperties"/);
});

test("attribute panel wires api catalog and all properties to the data source mapping dialog", () => {
  const source = readSource("../src/views/OntologyObjectAttributePanel/index.vue");
  const tableSource = readSource("../src/views/OntologyObjectAttributePanel/components/AttributePropertyTable.vue");
  assert.match(source, /import DataSourceAssociateDialog from "\.\/components\/DataSourceAssociateDialog\.vue"/);
  assert.match(source, /const dataSourceDialogVisible = ref\(false\)/);
  assert.match(source, /:catalog="dataSourceCatalog"/);
  assert.match(source, /:properties="ontologyPropertyMappings"/);
  assert.match(source, /@table-change="loadDataSourceColumns"/);
  assert.match(source, /dataSourceId: record\.tableName/);
  assert.match(source, /dataSourceId: table\.dataSourceId/);
  assert.match(source, /@submit="handleDataSourceSubmit"/);
  assert.match(source, /ref="dataSourceDialogRef"/);
  assert.match(source, /schemaName: record\.schemaName/);
  assert.match(source, /:data-source-opening="dataSourceOpening"/);
  assert.match(tableSource, /dataSourceOpening:\s*boolean/);
  assert.match(tableSource, /:loading="dataSourceOpening"/);
});

test("attribute panel loads property datasource info before opening the dialog", () => {
  const source = readSource("../src/views/OntologyObjectAttributePanel/index.vue");
  const openSource = source.match(/async function openDataSource\(\)[\s\S]*?async function loadDataSourceTables/)?.[0] ?? "";

  assert.match(source, /getOntologyPropertyDetailByOntologyIdInterface/);
  assert.match(source, /const ontologyPropertyDetails = ref<GetOntologyPropertyDetailByOntologyIdData>/);
  assert.match(source, /function resolvePropertyDataSourceBind/);
  assert.match(source, /detail\.datasourceId/);
  assert.match(source, /detail\?\.datasourceColumnName/);
  assert.doesNotMatch(source, /dataSource:\s*null,/);
  assert.match(openSource, /loadPropertyDataSourceDetails\(ontologyUniqueIdentifier\)/);
  assert.match(openSource, /await loadDataSourceTables\(\)/);
  assert.match(openSource, /await loadAssociatedDataSourceColumns\(\)/);
  assert.match(openSource, /dataSourceDialogVisible\.value = true/);
  assert.ok(openSource.indexOf("loadPropertyDataSourceDetails") < openSource.indexOf("loadDataSourceTables"));
  assert.ok(openSource.indexOf("loadDataSourceTables") < openSource.indexOf("loadAssociatedDataSourceColumns"));
  assert.ok(openSource.indexOf("loadAssociatedDataSourceColumns") < openSource.indexOf("dataSourceDialogVisible.value = true"));
});

test("attribute panel persists local datasource drafts only from dialog submit", () => {
  const source = readSource("../src/views/OntologyObjectAttributePanel/index.vue");
  const submitSource = source.match(/async function handleDataSourceSubmit[\s\S]*?\n}/)?.[0] ?? "";

  assert.match(source, /putBatchUpdateOntologyPropertiesInterface/);
  assert.match(submitSource, /allAttributes\.value\.find/);
  assert.match(submitSource, /uniqueIdentifier: attribute\.uniqueIdentifier/);
  assert.match(submitSource, /schemaName: payload\.dataSource\.schemaName/);
  assert.match(submitSource, /datasourceId: payload\.dataSource\.tableName/);
  assert.match(submitSource, /datasourceColumnName: payload\.dataSource\.fieldName/);
  assert.match(submitSource, /dataSourceDialogRef\.value\?\.completeSubmit\(\)/);
  assert.match(submitSource, /dataSourceDialogRef\.value\?\.setLoading\(false\)/);
  assert.doesNotMatch(submitSource, /dataSourceDialogVisible\.value = false/);
  assert.doesNotMatch(submitSource, /loadAttributeCategoryTree/);
});

test("attribute panel handles automatic datasource binding without closing the dialog", () => {
  const source = readSource("../src/views/OntologyObjectAttributePanel/index.vue");
  const autoSource = source.match(/async function handleAutoDataSourceAssociate\(\)[\s\S]*?\n}/)?.[0] ?? "";
  assert.match(source, /autoBindOntologyPropertyDatasourceInterface/);
  assert.match(source, /@auto-associate="handleAutoDataSourceAssociate"/);
  assert.match(source, /const ontologyIdentifier = String\(route\.params\.objectId \|\| \"\"\)\.trim\(\)/);
  assert.match(autoSource, /const tableLoaded = await loadDataSourceTables\(\)/);
  assert.match(autoSource, /await loadPropertyDataSourceDetails\(ontologyIdentifier\)/);
  assert.match(autoSource, /await loadAssociatedDataSourceColumns\(\)/);
  assert.match(autoSource, /await nextTick\(\)/);
  assert.match(autoSource, /dataSourceDialogRef\.value\?\.syncServerMappings\(\)/);
  assert.match(autoSource, /自动关联数据源成功/);
  assert.doesNotMatch(autoSource, /dataSourceDialogVisible\.value = false/);
  assert.ok(autoSource.indexOf("loadDataSourceTables") < autoSource.indexOf("loadPropertyDataSourceDetails"));
  assert.ok(autoSource.indexOf("loadPropertyDataSourceDetails") < autoSource.indexOf("loadAssociatedDataSourceColumns"));
  assert.ok(autoSource.indexOf("loadAssociatedDataSourceColumns") < autoSource.indexOf("syncServerMappings"));
});
