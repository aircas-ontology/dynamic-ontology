import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { ref, reactive, computed } from "vue";

/**
 * @description 执行真实 Vue 向导脚本，以可控接口验证异步状态和选择流程。
 * @param {Record<string, unknown>} api 接口及组件边界替身。
 * @returns {object} 向导公开给测试的状态和动作。
 */
function createWizard(api = {}) {
  const source = readFileSync(new URL("../src/views/ObjectWorkspacePanel/components/DatasourceBuildDialog.vue", import.meta.url), "utf8");
  const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/import[\s\S]*?from\s+"[^"]+";/g, "");
  const code = ts.transpile(
    script +
      "\nreturn { objectName, categoryId, nextStep, loadSchemas, step, schemas, schemaName, tables, selected, primary, error, busy, resetTableSelection, fieldIdsByTable, foreignKeys, visible };",
    { target: ts.ScriptTarget.ES2022 },
  );
  const dependencies = {
    ElLoading: { directive: {} },
    ref,
    reactive,
    computed,
    watch: () => {},
    onBeforeUnmount: () => {},
    defineModel: () => ref(true),
    defineProps: () => ({ spaceId: "42", categoryTree: [{ id: "3", label: "分类", children: [] }] }),
    defineEmits: () => () => {},
    getDatasourceSchemaListInterface: async () => ({ code: 200, data: [{ schemaName: "public" }] }),
    ...api,
  };
  const wizard = new Function(...Object.keys(dependencies), code)(...Object.values(dependencies));
  wizard.objectName.value = "舰船";
  wizard.categoryId.value = "3";
  return wizard;
}

test("first step validates object information and retains it when schema changes", async () => {
  const wizard = createWizard({ getDatasourceTableListInterface: async () => ({ code: 200, data: [] }) });
  wizard.schemaName.value = "public";
  wizard.objectName.value = "  ";
  await wizard.nextStep();
  assert.equal(wizard.step.value, 0);
  assert.match(wizard.error.value, /对象名称/);
  wizard.objectName.value = "舰船";
  for (const category of ["", "missing"]) {
    wizard.categoryId.value = category;
    await wizard.nextStep();
    assert.equal(wizard.step.value, 0);
    assert.match(wizard.error.value, /分类/);
  }
  wizard.categoryId.value = "3";
  wizard.resetTableSelection();
  assert.equal(wizard.objectName.value, "舰船");
  assert.equal(wizard.categoryId.value, "3");
  await wizard.nextStep();
  assert.equal(wizard.step.value, 1);
});

test("schema query uses current space and table query uses selected schema", async () => {
  const wizard = createWizard({
    getDatasourceSchemaListInterface: async (params) => {
      assert.deepEqual(params, { spaceId: 42 });
      return { code: 200, data: [{ schemaName: "public" }] };
    },
    getDatasourceTableListInterface: async (params) => {
      assert.deepEqual(params, { spaceId: 42, schemaName: "public" });
      return { code: 200, data: [] };
    },
  });
  await wizard.loadSchemas();
  assert.equal(wizard.schemas.value.length, 1);
  await wizard.nextStep();
  assert.match(wizard.error.value, /schema/i);
  wizard.schemaName.value = "public";
  await wizard.nextStep();
  assert.equal(wizard.step.value, 1);
  assert.equal(wizard.tables.value.length, 0);
});

test("schema failures provide feedback and pending queries cannot duplicate", async () => {
  let finish;
  let calls = 0;
  const wizard = createWizard({
    getDatasourceSchemaListInterface: () => {
      calls++;
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
  });
  const pending = wizard.loadSchemas();
  await wizard.loadSchemas();
  assert.equal(calls, 1);
  assert.equal(wizard.busy.value, true);
  finish({ code: 500, message: "查询失败" });
  await pending;
  assert.equal(wizard.busy.value, false);
  assert.equal(wizard.error.value, "查询失败");
});

test("changing schema invalidates pending tables and clears dependent choices", async () => {
  let finish;
  const wizard = createWizard({
    getDatasourceTableListInterface: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  wizard.schemaName.value = "old";
  const pending = wizard.nextStep();
  wizard.schemaName.value = "new";
  wizard.selected.value = ["old-table"];
  wizard.fieldIdsByTable.old = ["id"];
  wizard.resetTableSelection();
  finish({ code: 200, data: [{ tableName: "old-table", columnCount: 1 }] });
  await pending;
  assert.equal(wizard.step.value, 0);
  assert.deepEqual(wizard.tables.value, []);
  assert.deepEqual(wizard.selected.value, []);
  assert.deepEqual(wizard.fieldIdsByTable, {});
});

test("columns and submission retain selected schema and edited field descriptions", async () => {
  let emitted;
  let objectInfo;
  const wizard = createWizard({
    defineEmits: () => (event, value, info) => {
      emitted = value;
      objectInfo = info;
    },
    getDatasourceTableColumnsInterface: async (params) => {
      assert.deepEqual(params, { spaceId: 42, schemaName: "public", tableNames: ["ship"] });
      return { code: 200, data: [{ tableName: "ship", columns: [{ columnName: "id", ontologyDataType: "Int", nativeType: "int", description: "编号" }] }] };
    },
  });
  wizard.schemaName.value = "public";
  wizard.step.value = 1;
  wizard.tables.value = [{ id: "ship", name: "ship", storageName: "ship", comment: "舰船", fields: [] }];
  wizard.selected.value = ["ship"];
  wizard.primary.value = "ship";
  await wizard.nextStep();
  assert.equal(wizard.step.value, 2);
  wizard.tables.value[0].fields[0].description = "编辑说明";
  wizard.step.value = 1;
  await wizard.nextStep();
  assert.equal(wizard.tables.value[0].fields[0].description, "编辑说明");
  await wizard.nextStep();
  assert.equal(emitted.schemaName, "public");
  assert.deepEqual(objectInfo, { displayName: "舰船", categoryId: "3" });
  assert.equal(emitted.selectedTables[0].fields[0].description, "编辑说明");
  assert.equal(wizard.visible.value, false);
});

test("datasource APIs send space/schema and comma-separated table names to documented endpoints", () => {
  const source = readFileSync(new URL("../src/apis/datasourceConnectionApi.ts", import.meta.url), "utf8");
  const code = ts.transpile(source, { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 });
  const api = {};
  new Function("exports", "require", "DOMAIN_CONFIG", code)(api, () => ({ request: (config) => config }), { ONTOLOGYMANAGE_URL: "https://example.test" });
  const schema = api.getDatasourceSchemaListInterface({ spaceId: 42 });
  assert.equal(schema.url, "https://example.test/ontology/datasource/connection/schema/list");
  assert.deepEqual(schema.params, { spaceId: 42 });
  const tables = api.getDatasourceTableListInterface({ spaceId: 42, schemaName: "public" });
  assert.deepEqual(tables.params, { spaceId: 42, schemaName: "public" });
  const columns = api.getDatasourceTableColumnsInterface({ spaceId: 42, schemaName: "public", tableNames: ["ship", "port"] });
  assert.deepEqual(columns.params, { spaceId: 42, schemaName: "public", tableNames: "ship,port" });
  const payload = { spaceId: 42, schemaName: "public", tables: [] };
  assert.equal(api.postBuildObjectFromDatasourceInterface(payload).data, payload);
});
