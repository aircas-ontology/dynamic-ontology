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
      "\nreturn { showSchemaSelection, initializeDatasourceBuild, deleteHistoricalConnection, invalidateConnectionTest, handleConnectionDbTypeChange, chooseHistoricalConnection, activateNewConnection, filteredConnections, connectionKeyword, hasBoundConnection, activeStep, stepTitles, connectionMode, testConnection, isConnectionTested, connections, datasourceId, connectionForm, createConnection, selectConnection, loadConnections, objectName, categoryId, nextStep, loadSchemas, step, schemas, schemaName, tables, selected, primary, error, busy, resetTableSelection, fieldIdsByTable, foreignKeys, visible, uploadSqliteDatabaseFile, sqliteUploadHint, sqliteSelectedFileName };",
    { target: ts.ScriptTarget.ES2022 },
  );
  const dependencies = {
    ElLoading: { directive: {} },
    ElMessageBox: { confirm: async () => "confirm" },
    ref,
    reactive,
    computed,
    watch: () => {},
    onBeforeUnmount: () => {},
    defineModel: () => ref(true),
    defineProps: () => ({ spaceId: "42", categoryTree: [{ id: "3", label: "分类", children: [] }] }),
    defineEmits: () => () => {},
    getDatasourceSchemaListInterface: async () => ({ code: 200, data: [{ schemaName: "public" }] }),
    getDatasourceSchemaListByDatasourceInterface: async () => ({ code: 200, data: [{ schemaName: "public" }] }),
    postUploadSqliteDatabaseInterface: async () => ({
      code: 200,
      data: {
        jdbcUrl: "jdbc:sqlite:/sqlite-data/xxx-app.db",
        schemaName: "main",
        path: "/sqlite-data/xxx-app.db",
        fileName: "app.db",
        size: 102400,
        tableCount: 3,
      },
    }),
    ...api,
  };
  const wizard = new Function(...Object.keys(dependencies), code)(...Object.values(dependencies));
  wizard.objectName.value = "舰船";
  wizard.categoryId.value = "3";
  return wizard;
}

test("opening checks space Schema before looking up historical connections", async () => {
  let open;
  const wizard = createWizard({
    watch: (_, callback) => {
      open = callback;
    },
    getDatasourceSchemaListInterface: async (params) => {
      assert.deepEqual(params, { spaceId: 42 });
      return { code: 200, data: [{ schemaName: "bound" }] };
    },
    getDatasourceConnectionListInterface: () => assert.fail("bound space must skip history"),
  });
  open([true]);
  await new Promise(setImmediate);
  assert.equal(wizard.step.value, 0);
  assert.deepEqual(wizard.schemas.value, [{ schemaName: "bound" }]);
  assert.equal(wizard.showSchemaSelection.value, true);
});

for (const rejects of [false, true]) {
  test(`unconfigured space enters connection selection for ${rejects ? "HTTP error" : "business response"}`, async () => {
    let open;
    const wizard = createWizard({
      watch: (_, callback) => {
        open = callback;
      },
      getDatasourceSchemaListInterface: async () => {
        const message = "该对象空间未配置数据源：spaceId=42";
        if (rejects) throw new Error(message);
        return { code: 500, message };
      },
      getDatasourceConnectionListInterface: async () => ({ code: 200, data: { records: [{ id: 7, name: "db", dbType: "SQLITE" }], total: 1 } }),
    });
    open([true]);
    await new Promise(setImmediate);
    assert.equal(wizard.step.value, -1);
    assert.equal(wizard.hasBoundConnection.value, false);
    assert.equal(wizard.error.value, "");
    assert.equal(wizard.connections.value.length, 1);
    await wizard.chooseHistoricalConnection(7);
    assert.equal(wizard.step.value, 0);
    assert.equal(wizard.datasourceId.value, 7);
  });
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

test("target table names start with source names and cannot be blank", async () => {
  const wizard = createWizard({
    getDatasourceTableListInterface: async () => ({ code: 200, data: [{ tableName: "ship", columnCount: 0 }] }),
    getDatasourceTableColumnsInterface: async () => ({ code: 200, data: [{ tableName: "ship", columns: [] }] }),
  });
  wizard.schemaName.value = "public";
  await wizard.nextStep();
  assert.equal(wizard.tables.value[0].targetName, "ship");
  wizard.selected.value = ["ship"];
  wizard.primary.value = "ship";
  wizard.tables.value[0].targetName = " ";
  await wizard.nextStep();
  assert.match(wizard.error.value, /入库表名/);
  wizard.tables.value[0].targetName = "target_ship";
  await wizard.nextStep();
  wizard.step.value = 1;
  await wizard.nextStep();
  assert.equal(wizard.tables.value[0].name, "ship");
  assert.equal(wizard.tables.value[0].targetName, "target_ship");
  wizard.step.value = 0;
  await wizard.nextStep();
  assert.equal(wizard.tables.value[0].targetName, "target_ship");
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
  assert.equal(wizard.tables.value[0].fields[0].propertyName, "id");
  wizard.tables.value[0].fields[0].propertyName = "object_id";
  wizard.tables.value[0].fields[0].description = "编辑说明";
  wizard.step.value = 1;
  await wizard.nextStep();
  assert.equal(wizard.tables.value[0].fields[0].description, "编辑说明");
  assert.equal(wizard.tables.value[0].fields[0].propertyName, "object_id");
  wizard.tables.value[0].fields[0].propertyName = " ";
  await wizard.nextStep();
  assert.match(wizard.error.value, /属性名/);
  wizard.tables.value[0].fields[0].propertyName = "object_id";
  await wizard.nextStep();
  assert.equal(emitted.schemaName, "public");
  assert.equal(Object.hasOwn(emitted, "datasourceId"), false);
  assert.deepEqual(objectInfo, { displayName: "舰船", categoryId: "3" });
  assert.equal(emitted.selectedTables[0].fields[0].description, "编辑说明");
  assert.equal(wizard.visible.value, false);
});

test("wizard submission includes the selected datasource id", async () => {
  let emitted;
  const wizard = createWizard({
    defineEmits: () => (_, value) => {
      emitted = value;
    },
  });
  wizard.datasourceId.value = 7;
  wizard.schemaName.value = "public";
  wizard.step.value = 2;
  wizard.tables.value = [
    { id: "ship", name: "ship", storageName: "ship", comment: "", fields: [{ id: "id", name: "id", propertyName: "id", dataType: "Int" }] },
  ];
  wizard.selected.value = ["ship"];
  wizard.primary.value = "ship";
  wizard.fieldIdsByTable.ship = ["id"];
  await wizard.nextStep();
  assert.equal(emitted.datasourceId, 7);
});

test("field metadata retains primary key flags for every table after reload", async () => {
  const wizard = createWizard({
    getDatasourceTableColumnsInterface: async () => ({
      code: 200,
      data: [
        {
          tableName: "ship",
          columns: [
            { columnName: "id", nativeType: "int", ontologyDataType: "Int", isPrimaryKey: true },
            { columnName: "name", nativeType: "text", ontologyDataType: "String", isPrimaryKey: false },
          ],
        },
        {
          tableName: "detail",
          columns: [
            { columnName: "ship_id", nativeType: "int", ontologyDataType: "Int", isPrimaryKey: true },
            { columnName: "seq", nativeType: "int", ontologyDataType: "Int", isPrimaryKey: true },
            { columnName: "unknown", nativeType: "text", ontologyDataType: "String" },
          ],
        },
      ],
    }),
  });
  wizard.schemaName.value = "public";
  wizard.step.value = 1;
  wizard.tables.value = ["ship", "detail"].map((name) => ({ id: name, name, storageName: name, comment: "", fields: [] }));
  wizard.selected.value = ["ship", "detail"];
  wizard.primary.value = "ship";
  await wizard.nextStep();
  assert.deepEqual(
    wizard.tables.value.map((table) => table.fields.map((field) => field.isPrimaryKey)),
    [
      [true, false],
      [true, true, undefined],
    ],
  );
  wizard.step.value = 1;
  await wizard.nextStep();
  assert.deepEqual(
    wizard.tables.value.map((table) => table.fields.map((field) => field.isPrimaryKey)),
    [
      [true, false],
      [true, true, undefined],
    ],
  );
});

test("datasource APIs send space/schema and comma-separated table names to documented endpoints", () => {
  const source = readFileSync(new URL("../src/apis/datasourceConnectionApi.ts", import.meta.url), "utf8");
  const code = ts.transpile(source, { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 });
  const api = {};
  new Function("exports", "require", "DOMAIN_CONFIG", code)(api, () => ({ request: (config) => config }), { ONTOLOGYMANAGE_URL: "https://example.test" });
  const schema = api.getDatasourceSchemaListInterface({ spaceId: 42 });
  assert.equal(schema.url, "https://example.test/ontology/datasource/connection/schema/list");
  assert.deepEqual(schema.params, { spaceId: 42 });
  assert.deepEqual(api.getDatasourceSchemaListInterface({ spaceId: 42, datasourceId: 9 }).params, { spaceId: 42, datasourceId: 9 });
  const tables = api.getDatasourceTableListInterface({ spaceId: 42, schemaName: "public" });
  assert.deepEqual(tables.params, { spaceId: 42, schemaName: "public" });
  const columns = api.getDatasourceTableColumnsInterface({ spaceId: 42, schemaName: "public", tableNames: ["ship", "port"] });
  assert.deepEqual(columns.params, { spaceId: 42, schemaName: "public", tableNames: "ship,port" });
  const payload = { spaceId: 42, schemaName: "public", tables: [] };
  assert.equal(api.postBuildObjectFromDatasourceInterface(payload).data, payload);
});

test("empty space Schema leaves history selectable even when a record matches the space", async () => {
  let open;
  const wizard = createWizard({
    watch: (_, callback) => {
      open = callback;
    },
    getDatasourceSchemaListInterface: async () => ({ code: 200, data: [] }),
    getDatasourceConnectionListInterface: async () => ({ code: 200, data: { records: [{ id: 7, name: "db", dbType: "SQLITE", spaceId: 42 }], total: 1 } }),
  });
  open([true]);
  await new Promise(setImmediate);
  assert.equal(wizard.step.value, -1);
  assert.equal(wizard.datasourceId.value, undefined);
  await wizard.chooseHistoricalConnection(7);
  assert.equal(wizard.datasourceId.value, 7);
  assert.equal(wizard.schemaName.value, "main");
});
test("new SQLite connection omits spaceId and uses main", async () => {
  let body;
  const wizard = createWizard({
    postDatasourceConnectionTestInterface: async (data) => {
      body = data;
      return { code: 200 };
    },
    postDatasourceConnectionInterface: async (data) => {
      assert.deepEqual(data, body);
      return { code: 200, data: { ...data, id: 9 } };
    },
  });
  Object.assign(wizard.connectionForm, { name: "local", dbType: "SQLITE", jdbcUrl: "jdbc:sqlite:/data/db.sqlite", username: "", password: "" });
  await wizard.testConnection();
  await wizard.createConnection();
  assert.equal(Object.hasOwn(body, "spaceId"), false);
  assert.equal(body.schemaName, "main");
  assert.equal(wizard.datasourceId.value, 9);
});

test("sqlite file upload fills jdbc url and uses main schema hint", async () => {
  let uploaded;
  const wizard = createWizard({
    postUploadSqliteDatabaseInterface: async (params) => {
      uploaded = params;
      return {
        code: 200,
        data: {
          jdbcUrl: "jdbc:sqlite:/sqlite-data/ship.db",
          schemaName: "main",
          path: "/sqlite-data/ship.db",
          fileName: "ship.db",
          size: 2048,
          tableCount: 0,
        },
      };
    },
  });
  wizard.connectionForm.dbType = "SQLITE";
  await wizard.uploadSqliteDatabaseFile({ name: "ship.db", size: 2048 });
  assert.equal(uploaded.file.name, "ship.db");
  assert.equal(wizard.connectionForm.jdbcUrl, "jdbc:sqlite:/sqlite-data/ship.db");
  assert.equal(wizard.connectionForm.schemaName, "main");
  assert.equal(wizard.sqliteSelectedFileName.value, "ship.db");
  assert.match(wizard.sqliteUploadHint.value, /未扫描到用户表|没有用户表|无用户表/);
});

test("sqlite upload rejects unsupported extension and upload errors", async () => {
  const wizard = createWizard({
    postUploadSqliteDatabaseInterface: async () => {
      assert.fail("invalid extension must not upload");
    },
  });
  wizard.connectionForm.dbType = "SQLITE";
  await wizard.uploadSqliteDatabaseFile({ name: "notes.txt", size: 10 });
  assert.match(wizard.error.value, /\.db|\.sqlite|扩展名|文件/);
  assert.equal(wizard.connectionForm.jdbcUrl, "");
  const failing = createWizard({
    postUploadSqliteDatabaseInterface: async () => ({ code: 400, message: "非法 SQLite 文件" }),
  });
  failing.connectionForm.dbType = "SQLITE";
  await failing.uploadSqliteDatabaseFile({ name: "bad.db", size: 10 });
  assert.equal(failing.error.value, "非法 SQLite 文件");
  assert.equal(failing.connectionForm.jdbcUrl, "");
});

test("leaving sqlite clears uploaded jdbc url", async () => {
  const wizard = createWizard();
  wizard.connectionForm.dbType = "SQLITE";
  await wizard.uploadSqliteDatabaseFile({ name: "app.db", size: 100 });
  assert.match(wizard.connectionForm.jdbcUrl, /jdbc:sqlite:/);
  wizard.connectionForm.dbType = "POSTGRESQL";
  wizard.handleConnectionDbTypeChange();
  assert.equal(wizard.connectionForm.jdbcUrl, "");
  assert.equal(wizard.sqliteSelectedFileName.value, "");
});

test("connection pagination finds association on later pages and uses datasource queries", async () => {
  const pages = [];
  const wizard = createWizard({
    getDatasourceConnectionListInterface: async ({ pageNum }) => {
      pages.push(pageNum);
      return { code: 200, data: { total: 2, records: [{ id: pageNum, name: "db", dbType: "POSTGRESQL", spaceId: pageNum === 2 ? 42 : 1 }] } };
    },
    getDatasourceSchemaListInterface: async (params) => {
      assert.deepEqual(params, { spaceId: 42 });
      return { code: 200, data: [] };
    },
    getDatasourceTableListByDatasourceInterface: async (params) => {
      assert.deepEqual(params, { id: 2, schemaName: "public" });
      return { code: 200, data: [] };
    },
  });
  await wizard.loadConnections();
  assert.deepEqual(pages, [1, 2]);
  wizard.hasBoundConnection.value = false;
  wizard.step.value = -1;
  await wizard.chooseHistoricalConnection(2);
  await wizard.nextStep();
  assert.equal(wizard.step.value, 1);
});

test("switching connection ignores schema result for previous connection", async () => {
  let finish;
  const wizard = createWizard({
    getDatasourceSchemaListInterface: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  wizard.connections.value = [
    { id: 1, name: "old", dbType: "POSTGRESQL", schemaName: "old" },
    { id: 2, name: "new", dbType: "SQLITE" },
  ];
  const pending = wizard.selectConnection(1);
  await wizard.selectConnection(2);
  finish({ code: 200, data: [{ schemaName: "old" }] });
  await pending;
  assert.equal(wizard.datasourceId.value, 2);
  assert.equal(wizard.schemaName.value, "main");
  assert.deepEqual(wizard.schemas.value, []);
});

test("failed test prevents connection creation and duplicate submissions", async () => {
  let finish;
  let calls = 0;
  const wizard = createWizard({
    postDatasourceConnectionTestInterface: () => {
      calls++;
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
    postDatasourceConnectionInterface: () => {
      assert.fail("must not create failed connection");
    },
  });
  await wizard.testConnection();
  assert.match(wizard.error.value, /填写/);
  Object.assign(wizard.connectionForm, { name: "db", dbType: "DM", jdbcUrl: "jdbc:dm://host:5236", username: "user", password: "secret" });
  const pending = wizard.testConnection();
  await wizard.testConnection();
  assert.equal(calls, 1);
  finish({ code: 500, message: "无法连接" });
  await pending;
  assert.equal(wizard.error.value, "无法连接");
  assert.equal(wizard.busy.value, false);
});

test("empty connection list needs selection and reports query failures", async () => {
  const wizard = createWizard({ getDatasourceConnectionListInterface: async () => ({ code: 200, data: { total: 0, records: [] } }) });
  await wizard.loadConnections();
  wizard.schemaName.value = "public";
  await wizard.nextStep();
  assert.match(wizard.error.value, /连接/);
  const failed = createWizard({
    getDatasourceConnectionListInterface: async () => {
      throw new Error("网络失败");
    },
  });
  await failed.loadConnections();
  assert.equal(failed.error.value, "网络失败");
  assert.equal(failed.busy.value, false);
});

test("closing wizard discards pending connection list", async () => {
  let cleanup;
  let finish;
  const wizard = createWizard({
    onBeforeUnmount: (callback) => {
      cleanup = callback;
    },
    getDatasourceConnectionListInterface: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  const pending = wizard.loadConnections();
  cleanup();
  finish({ code: 200, data: { total: 1, records: [{ id: 1, name: "late", dbType: "SQLITE" }] } });
  await pending;
  assert.deepEqual(wizard.connections.value, []);
});

test("clearing connection discards pending schema default", async () => {
  let finish;
  const wizard = createWizard({
    getDatasourceSchemaListInterface: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  wizard.connections.value = [{ id: 1, name: "db", dbType: "POSTGRESQL", schemaName: "old" }];
  const pending = wizard.selectConnection(1);
  await wizard.selectConnection(undefined);
  finish({ code: 200, data: [{ schemaName: "old" }] });
  await pending;
  assert.equal(wizard.schemaName.value, "");
});

test("selected datasource supplies columns and its id is included in build selection", async () => {
  let selection;
  const wizard = createWizard({
    getDatasourceTableColumnsByDatasourceInterface: () => assert.fail("bound space must keep original columns API"),
    defineEmits: () => (_event, value) => {
      selection = value;
    },
    getDatasourceTableColumnsInterface: async (params) => {
      assert.deepEqual(params, { datasourceId: 7, schemaName: "main", tableNames: ["ship"] });
      return { code: 200, data: [{ tableName: "ship", columns: [{ columnName: "id", nativeType: "int", ontologyDataType: "Int", isPrimaryKey: true }] }] };
    },
  });
  wizard.connections.value = [{ id: 7, name: "db", dbType: "SQLITE" }];
  await wizard.selectConnection(7);
  wizard.tables.value = [{ id: "ship", name: "ship", storageName: "ship", fields: [] }];
  wizard.selected.value = ["ship"];
  wizard.primary.value = "ship";
  wizard.step.value = 1;
  await wizard.nextStep();
  await wizard.nextStep();
  assert.equal(selection.schemaName, "main");
  assert.equal(selection.datasourceId, 7);
  assert.equal(Object.hasOwn(selection, "password"), false);
});

test("PostgreSQL creation defaults schema and selects created connection", async () => {
  const wizard = createWizard({
    postDatasourceConnectionTestInterface: async (params) => {
      assert.equal(params.schemaName, "public");
      return { code: 200 };
    },
    postDatasourceConnectionInterface: async (params) => {
      assert.equal(Object.hasOwn(params, "spaceId"), false);
      return { code: 200, data: { ...params, id: 3 } };
    },
  });
  Object.assign(wizard.connectionForm, { name: "pg", jdbcUrl: "jdbc:postgresql://host/db", username: "user", password: "secret", schemaName: " " });
  await wizard.testConnection();
  await wizard.createConnection();
  assert.equal(wizard.datasourceId.value, 3);
  assert.equal(wizard.schemaName.value, "public");
  assert.equal(wizard.connectionForm.password, "");
});

test("non-progressing connection pagination fails instead of looping", async () => {
  let calls = 0;
  const wizard = createWizard({
    getDatasourceConnectionListInterface: async () => {
      calls++;
      return { code: 200, data: { total: 2, records: [{ id: 1, name: "db", dbType: "SQLITE" }] } };
    },
  });
  await wizard.loadConnections();
  assert.equal(calls, 2);
  assert.match(wizard.error.value, /分页数据不完整/);
});

test("closing while testing does not create a connection", async () => {
  let cleanup;
  let finish;
  const wizard = createWizard({
    onBeforeUnmount: (callback) => {
      cleanup = callback;
    },
    postDatasourceConnectionTestInterface: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
    postDatasourceConnectionInterface: () => {
      assert.fail("closed wizard must not create a connection");
    },
  });
  Object.assign(wizard.connectionForm, { name: "db", dbType: "SQLITE", jdbcUrl: "jdbc:sqlite:/data/db.sqlite" });
  const pending = wizard.testConnection();
  cleanup();
  finish({ code: 200 });
  await pending;
  assert.equal(wizard.datasourceId.value, undefined);
});

test("unbound space has four steps and connection step needs no object information", async () => {
  const wizard = createWizard({
    getDatasourceConnectionListInterface: async () => ({ code: 200, data: { total: 1, records: [{ id: 5, name: "sqlite", dbType: "SQLITE" }] } }),
  });
  await wizard.loadConnections();
  wizard.hasBoundConnection.value = false;
  wizard.step.value = -1;
  assert.deepEqual(wizard.stepTitles.value, ["连接数据源", "对象信息", "选择数据库表", "字段与外键"]);
  assert.equal(wizard.step.value, -1);
  assert.equal(wizard.activeStep.value, 0);
  wizard.objectName.value = "";
  wizard.categoryId.value = "";
  await wizard.chooseHistoricalConnection(5);
  assert.equal(wizard.step.value, 0);
  assert.equal(wizard.activeStep.value, 1);
  await wizard.nextStep();
  assert.match(wizard.error.value, /对象名称/);
});

test("failed space Schema query can retry and ignores a response after close", async () => {
  let open;
  let resolveSchema;
  let calls = 0;
  const wizard = createWizard({
    watch: (_, callback) => {
      open = callback;
    },
    getDatasourceSchemaListInterface: () => {
      calls++;
      return new Promise((resolve) => {
        resolveSchema = resolve;
      });
    },
  });
  open([true]);
  resolveSchema({ code: 500, message: "查询失败" });
  await new Promise(setImmediate);
  assert.equal(wizard.step.value, -2);
  assert.equal(wizard.error.value, "查询失败");
  const pending = wizard.initializeDatasourceBuild();
  assert.equal(calls, 2);
  open([false]);
  resolveSchema({ code: 200, data: [{ schemaName: "stale" }] });
  await pending;
  assert.equal(wizard.step.value, -2);
  assert.deepEqual(wizard.schemas.value, []);
});

test("testing never creates connection and next step creates exactly once", async () => {
  let creations = 0;
  const wizard = createWizard({
    getDatasourceConnectionListInterface: async () => ({ code: 200, data: { total: 0, records: [] } }),
    postDatasourceConnectionTestInterface: async () => ({ code: 200 }),
    postDatasourceConnectionInterface: async (params) => {
      creations++;
      return { code: 200, data: { ...params, id: 6 } };
    },
  });
  await wizard.loadConnections();
  wizard.hasBoundConnection.value = false;
  wizard.step.value = -1;
  Object.assign(wizard.connectionForm, { name: "local", dbType: "SQLITE", jdbcUrl: "jdbc:sqlite:/data/db" });
  await wizard.testConnection();
  assert.equal(creations, 0);
  assert.equal(wizard.step.value, -1);
  assert.equal(wizard.isConnectionTested.value, true);
  await wizard.nextStep();
  assert.equal(creations, 1);
  assert.equal(wizard.step.value, 0);
  wizard.step.value = -1;
  await wizard.nextStep();
  assert.equal(creations, 1);
});

test("editing configuration invalidates success even if reverted", async () => {
  const wizard = createWizard({
    postDatasourceConnectionTestInterface: async () => ({ code: 200 }),
    postDatasourceConnectionInterface: () => assert.fail("untested configuration"),
  });
  Object.assign(wizard.connectionForm, { name: "local", dbType: "SQLITE", jdbcUrl: "jdbc:sqlite:/data/db" });
  await wizard.testConnection();
  wizard.connectionForm.name = "changed";
  wizard.invalidateConnectionTest();
  wizard.connectionForm.name = "local";
  assert.equal(wizard.isConnectionTested.value, false);
  await wizard.createConnection();
  assert.match(wizard.error.value, /重新测试/);
});

test("history search and switching retain object information but clear old tables", async () => {
  const wizard = createWizard();
  wizard.connections.value = [
    { id: 1, name: "Ship", dbType: "SQLITE" },
    { id: 2, name: "Port", dbType: "SQLITE" },
  ];
  wizard.connectionKeyword.value = "ship";
  assert.equal(wizard.filteredConnections.value.length, 1);
  await wizard.chooseHistoricalConnection(1);
  wizard.tables.value = [{ id: "old", name: "old", fields: [] }];
  wizard.selected.value = ["old"];
  await wizard.chooseHistoricalConnection(2);
  assert.equal(wizard.objectName.value, "舰船");
  assert.equal(wizard.categoryId.value, "3");
  assert.deepEqual(wizard.tables.value, []);
  assert.deepEqual(wizard.selected.value, []);
});

test("returning through object information retains selected table and primary", async () => {
  const wizard = createWizard({ getDatasourceTableListInterface: async () => ({ code: 200, data: [{ tableName: "ship", columnCount: 0 }] }) });
  wizard.schemaName.value = "public";
  wizard.tables.value = [{ id: "ship", name: "ship", storageName: "edited", fields: [] }];
  wizard.selected.value = ["ship"];
  wizard.primary.value = "ship";
  await wizard.nextStep();
  assert.deepEqual(wizard.selected.value, ["ship"]);
  assert.equal(wizard.primary.value, "ship");
  assert.equal(wizard.tables.value[0].storageName, "edited");
});

test("closing during next step creation does not update wizard feedback", async () => {
  let cleanup;
  let finish;
  const wizard = createWizard({
    onBeforeUnmount: (callback) => {
      cleanup = callback;
    },
    postDatasourceConnectionTestInterface: async () => ({ code: 200 }),
    postDatasourceConnectionInterface: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  wizard.hasBoundConnection.value = false;
  wizard.step.value = -1;
  Object.assign(wizard.connectionForm, { name: "local", dbType: "SQLITE", jdbcUrl: "jdbc:sqlite:/data/db" });
  await wizard.testConnection();
  const pending = wizard.nextStep();
  cleanup();
  finish({ code: 200, data: { id: 6, name: "local", dbType: "SQLITE" } });
  await pending;
  assert.equal(wizard.error.value, "");
  assert.equal(wizard.step.value, -1);
});

test("unbound space loads schema by datasource id and retries through the same endpoint", async () => {
  const ids = [];
  const wizard = createWizard({
    getDatasourceSchemaListInterface: () => assert.fail("must not query schema by space"),
    getDatasourceSchemaListByDatasourceInterface: async (id) => {
      ids.push(id);
      return ids.length === 1 ? { code: 500, message: "查询失败" } : { code: 200, data: [{ schemaName: "ship" }] };
    },
  });
  wizard.hasBoundConnection.value = false;
  wizard.connections.value = [{ id: 9, name: "db", dbType: "POSTGRESQL" }];
  await wizard.selectConnection(9);
  assert.equal(wizard.error.value, "查询失败");
  await wizard.loadSchemas();
  assert.deepEqual(ids, [9, 9]);
  assert.deepEqual(wizard.schemas.value, [{ schemaName: "ship" }]);
});

test("schema by datasource API sends only id to requested endpoint", () => {
  const source = readFileSync(new URL("../src/apis/datasourceConnectionApi.ts", import.meta.url), "utf8");
  const code = ts.transpile(source, { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 });
  const api = {};
  new Function("exports", "require", "DOMAIN_CONFIG", code)(api, () => ({ request: (config) => config }), { ONTOLOGYMANAGE_URL: "https://example.test" });
  const config = api.getDatasourceSchemaListByDatasourceInterface(9);
  assert.equal(config.url, "https://example.test/ontology/datasource/connection/schema/list_by_datasource");
  assert.equal(config.method, "get");
  assert.deepEqual(config.params, { id: 9 });
});

test("historical connection advances only after schema succeeds and retries failures", async () => {
  let calls = 0;
  const wizard = createWizard({
    getDatasourceSchemaListByDatasourceInterface: async () => {
      calls++;
      return calls === 1 ? { code: 500, message: "查询失败" } : { code: 200, data: [{ schemaName: "public" }] };
    },
  });
  wizard.hasBoundConnection.value = false;
  wizard.step.value = -1;
  wizard.connections.value = [{ id: 9, name: "db", dbType: "POSTGRESQL" }];
  await wizard.chooseHistoricalConnection(9);
  assert.equal(wizard.step.value, -1);
  assert.equal(wizard.error.value, "查询失败");
  await wizard.chooseHistoricalConnection(9);
  assert.equal(wizard.step.value, 0);
  assert.equal(calls, 2);
});

test("pending historical selection blocks duplicates and does not advance after close", async () => {
  let finish;
  let cleanup;
  let calls = 0;
  const wizard = createWizard({
    onBeforeUnmount: (callback) => {
      cleanup = callback;
    },
    getDatasourceSchemaListByDatasourceInterface: () => {
      calls++;
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
  });
  wizard.hasBoundConnection.value = false;
  wizard.step.value = -1;
  wizard.connections.value = [{ id: 9, name: "db", dbType: "POSTGRESQL" }];
  const pending = wizard.chooseHistoricalConnection(9);
  await wizard.chooseHistoricalConnection(9);
  assert.equal(calls, 1);
  assert.equal(wizard.step.value, -1);
  cleanup();
  finish({ code: 200, data: [{ schemaName: "public" }] });
  await pending;
  assert.equal(wizard.step.value, -1);
});

test("unbound space queries tables by id and schema with retry", async () => {
  let calls = 0;
  const wizard = createWizard({
    getDatasourceTableListInterface: () => assert.fail("unbound space must not use bound table API"),
    getDatasourceTableListByDatasourceInterface: async (params) => {
      calls++;
      assert.deepEqual(params, { id: 7, schemaName: "ship_schema" });
      return calls === 1 ? { code: 500, message: "读取表失败" } : { code: 200, data: [{ tableName: "ship", columnCount: 2 }] };
    },
  });
  wizard.hasBoundConnection.value = false;
  wizard.datasourceId.value = 7;
  wizard.schemaName.value = "ship_schema";
  await wizard.nextStep();
  assert.equal(wizard.step.value, 0);
  assert.equal(wizard.error.value, "读取表失败");
  await wizard.nextStep();
  assert.equal(wizard.step.value, 1);
  assert.equal(wizard.tables.value[0].name, "ship");
  assert.equal(calls, 2);
});

test("bound space keeps original table API and datasource parameter handling", async () => {
  let calls = 0;
  const wizard = createWizard({
    getDatasourceTableListInterface: async (params) => {
      calls++;
      assert.deepEqual(params, { datasourceId: 7, schemaName: "public" });
      return { code: 200, data: [] };
    },
    getDatasourceTableListByDatasourceInterface: () => assert.fail("bound space must keep original table API"),
  });
  wizard.datasourceId.value = 7;
  wizard.schemaName.value = "public";
  await wizard.nextStep();
  assert.equal(calls, 1);
  assert.equal(wizard.step.value, 1);
});

test("table by datasource API uses ontology prefix and documented query parameters", () => {
  const source = readFileSync(new URL("../src/apis/datasourceConnectionApi.ts", import.meta.url), "utf8");
  const code = ts.transpile(source, { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 });
  const api = {};
  new Function("exports", "require", "DOMAIN_CONFIG", code)(api, () => ({ request: (config) => config }), { ONTOLOGYMANAGE_URL: "https://example.test" });
  const config = api.getDatasourceTableListByDatasourceInterface({ id: 7, schemaName: "public" });
  assert.equal(config.url, "https://example.test/ontology/datasource/connection/table/list_by_datasource");
  assert.equal(config.method, "get");
  assert.deepEqual(config.params, { id: 7, schemaName: "public" });
});

test("unbound table query requires a valid datasource id", async () => {
  const wizard = createWizard({ getDatasourceTableListByDatasourceInterface: () => assert.fail("invalid datasource id") });
  wizard.hasBoundConnection.value = false;
  wizard.schemaName.value = "public";
  for (const id of [undefined, 0, -1, 1.5]) {
    wizard.datasourceId.value = id;
    await wizard.nextStep();
    assert.equal(wizard.step.value, 0);
    assert.match(wizard.error.value, /有效的数据源连接/);
    assert.equal(wizard.busy.value, false);
  }
});

test("unbound pending table query coalesces calls and ignores old schema response", async () => {
  let finish;
  let calls = 0;
  const wizard = createWizard({
    getDatasourceTableListByDatasourceInterface: () => {
      calls++;
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
  });
  wizard.hasBoundConnection.value = false;
  wizard.datasourceId.value = 7;
  wizard.schemaName.value = "old";
  const pending = wizard.nextStep();
  await wizard.nextStep();
  assert.equal(calls, 1);
  wizard.schemaName.value = "new";
  wizard.resetTableSelection();
  finish({ code: 200, data: [{ tableName: "old_table", columnCount: 0 }] });
  await pending;
  assert.deepEqual(wizard.tables.value, []);
  assert.equal(wizard.step.value, 0);
});

test("unbound columns query uses id and retains edited property metadata", async () => {
  let calls = 0;
  const wizard = createWizard({
    getDatasourceTableColumnsInterface: () => assert.fail("must not use bound columns API"),
    getDatasourceTableColumnsByDatasourceInterface: async (params) => {
      calls++;
      assert.deepEqual(params, { id: 7, schemaName: "public", tableNames: ["ship"] });
      return {
        code: 200,
        data: [{ tableName: "ship", columns: [{ columnName: "id", nativeType: "int", ontologyDataType: "Int", isPrimaryKey: true, description: "编号" }] }],
      };
    },
  });
  wizard.hasBoundConnection.value = false;
  wizard.datasourceId.value = 7;
  wizard.schemaName.value = "public";
  wizard.tables.value = [{ id: "ship", name: "ship", storageName: "ship", fields: [] }];
  wizard.selected.value = ["ship"];
  wizard.primary.value = "ship";
  wizard.step.value = 1;
  await wizard.nextStep();
  assert.equal(wizard.step.value, 2);
  assert.equal(wizard.tables.value[0].fields[0].isPrimaryKey, true);
  wizard.tables.value[0].fields[0].propertyName = "ship_id";
  wizard.tables.value[0].fields[0].description = "编辑编号";
  wizard.step.value = 1;
  await wizard.nextStep();
  assert.equal(calls, 2);
  assert.equal(wizard.tables.value[0].fields[0].propertyName, "ship_id");
  assert.equal(wizard.tables.value[0].fields[0].description, "编辑编号");
});

test("columns by datasource API sends id schema and comma-separated table names", () => {
  const source = readFileSync(new URL("../src/apis/datasourceConnectionApi.ts", import.meta.url), "utf8");
  const code = ts.transpile(source, { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 });
  const api = {};
  new Function("exports", "require", "DOMAIN_CONFIG", code)(api, () => ({ request: (config) => config }), { ONTOLOGYMANAGE_URL: "https://example.test" });
  const config = api.getDatasourceTableColumnsByDatasourceInterface({ id: 7, schemaName: "public", tableNames: ["Ship", "port"] });
  assert.equal(config.url, "https://example.test/ontology/datasource/connection/table/columns_by_datasource");
  assert.equal(config.method, "get");
  assert.deepEqual(config.params, { id: 7, schemaName: "public", tableNames: "Ship,port" });
});

test("unbound columns failure retries coalesce and stale responses are ignored", async () => {
  let calls = 0;
  let finish;
  const wizard = createWizard({
    getDatasourceTableColumnsByDatasourceInterface: async () => {
      calls++;
      if (calls === 1) return { code: 500, message: "字段查询失败" };
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
  });
  wizard.hasBoundConnection.value = false;
  wizard.datasourceId.value = 7;
  wizard.schemaName.value = "public";
  wizard.tables.value = [{ id: "ship", name: "ship", storageName: "ship", fields: [] }];
  wizard.selected.value = ["ship"];
  wizard.primary.value = "ship";
  wizard.step.value = 1;
  await wizard.nextStep();
  assert.equal(wizard.error.value, "字段查询失败");
  assert.equal(wizard.step.value, 1);
  assert.equal(wizard.busy.value, false);
  const pending = wizard.nextStep();
  await wizard.nextStep();
  assert.equal(calls, 2);
  wizard.resetTableSelection();
  finish({ code: 200, data: [{ tableName: "ship", columns: [{ columnName: "old_id", ontologyDataType: "Int" }] }] });
  await pending;
  assert.deepEqual(wizard.tables.value, []);
  assert.equal(wizard.step.value, 1);
});

test("unbound columns query rejects invalid datasource ids", async () => {
  const wizard = createWizard({ getDatasourceTableColumnsByDatasourceInterface: () => assert.fail("invalid datasource") });
  wizard.hasBoundConnection.value = false;
  wizard.schemaName.value = "public";
  wizard.tables.value = [{ id: "ship", name: "ship", storageName: "ship", fields: [] }];
  wizard.selected.value = ["ship"];
  wizard.primary.value = "ship";
  wizard.step.value = 1;
  for (const id of [undefined, 0, -1, 1.5]) {
    wizard.datasourceId.value = id;
    await wizard.nextStep();
    assert.match(wizard.error.value, /有效的数据源连接/);
    assert.equal(wizard.step.value, 1);
    assert.equal(wizard.busy.value, false);
  }
});

test("deleting selected history clears dependent selection without advancing", async () => {
  let deletedId;
  const wizard = createWizard({
    ElMessageBox: {
      confirm: async (message) => {
        assert.match(message, /物理删除.*local/);
        return "confirm";
      },
    },
    deleteDatasourceConnectionInterface: async (id) => {
      deletedId = id;
      return { code: 200 };
    },
  });
  wizard.hasBoundConnection.value = false;
  wizard.step.value = -1;
  wizard.connections.value = [
    { id: 7, name: "local", dbType: "SQLITE" },
    { id: 8, name: "other", dbType: "SQLITE" },
  ];
  wizard.datasourceId.value = 7;
  wizard.schemaName.value = "public";
  wizard.schemas.value = [{ schemaName: "public" }];
  wizard.tables.value = [{ id: "ship", name: "ship", fields: [] }];
  wizard.selected.value = ["ship"];
  wizard.fieldIdsByTable.ship = ["id"];
  wizard.foreignKeys.ship = { childFieldId: "id", parentFieldId: "id" };
  await wizard.deleteHistoricalConnection(7);
  assert.equal(deletedId, 7);
  assert.deepEqual(
    wizard.connections.value.map((item) => item.id),
    [8],
  );
  assert.equal(wizard.datasourceId.value, undefined);
  assert.equal(wizard.schemaName.value, "");
  assert.deepEqual(wizard.schemas.value, []);
  assert.deepEqual(wizard.tables.value, []);
  assert.deepEqual(wizard.fieldIdsByTable, {});
  assert.deepEqual(wizard.foreignKeys, {});
  assert.equal(wizard.step.value, -1);
  assert.equal(wizard.busy.value, false);
});

test("cancelled and failed deletion preserve history", async () => {
  const cancelled = createWizard({
    ElMessageBox: {
      confirm: async () => {
        throw "cancel";
      },
    },
    deleteDatasourceConnectionInterface: () => assert.fail("cancelled deletion"),
  });
  cancelled.connections.value = [{ id: 7, name: "local", dbType: "SQLITE" }];
  await cancelled.deleteHistoricalConnection(7);
  assert.equal(cancelled.connections.value.length, 1);
  assert.equal(cancelled.error.value, "");
  assert.equal(cancelled.busy.value, false);
  const failed = createWizard({ deleteDatasourceConnectionInterface: async () => ({ code: 500, message: "连接仍在使用" }) });
  failed.connections.value = [{ id: 7, name: "local", dbType: "SQLITE" }];
  failed.datasourceId.value = 7;
  failed.schemaName.value = "public";
  await failed.deleteHistoricalConnection(7);
  assert.equal(failed.connections.value.length, 1);
  assert.equal(failed.datasourceId.value, 7);
  assert.equal(failed.schemaName.value, "public");
  assert.equal(failed.error.value, "连接仍在使用");
});

test("delete datasource API uses DELETE with query id and no request body", () => {
  const source = readFileSync(new URL("../src/apis/datasourceConnectionApi.ts", import.meta.url), "utf8");
  const code = ts.transpile(source, { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 });
  const api = {};
  new Function("exports", "require", "DOMAIN_CONFIG", code)(api, () => ({ request: (config) => config }), { ONTOLOGYMANAGE_URL: "https://example.test" });
  const config = api.deleteDatasourceConnectionInterface(7);
  assert.equal(config.url, "https://example.test/ontology/datasource/connection");
  assert.equal(config.method, "delete");
  assert.deepEqual(config.params, { id: 7 });
  assert.equal(Object.hasOwn(config, "data"), false);
});

test("history deletion coalesces requests and preserves other selections", async () => {
  let finish;
  let calls = 0;
  const wizard = createWizard({
    deleteDatasourceConnectionInterface: () => {
      calls++;
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
  });
  wizard.connections.value = [
    { id: 7, name: "local" },
    { id: 8, name: "selected" },
  ];
  wizard.datasourceId.value = 8;
  wizard.schemaName.value = "public";
  const pending = wizard.deleteHistoricalConnection(7);
  await wizard.deleteHistoricalConnection(7);
  assert.equal(calls, 1);
  finish({ code: 200 });
  await pending;
  assert.equal(wizard.datasourceId.value, 8);
  assert.equal(wizard.schemaName.value, "public");
  assert.deepEqual(
    wizard.connections.value.map((item) => item.id),
    [8],
  );
});

test("closing during confirmation prevents deletion and repeated confirmation", async () => {
  let confirm;
  let confirmations = 0;
  let unmount;
  const wizard = createWizard({
    onBeforeUnmount: (callback) => {
      unmount = callback;
    },
    ElMessageBox: {
      confirm: () => {
        confirmations++;
        return new Promise((resolve) => {
          confirm = resolve;
        });
      },
    },
    deleteDatasourceConnectionInterface: () => assert.fail("closed confirmation"),
  });
  wizard.connections.value = [{ id: 7, name: "local" }];
  const pending = wizard.deleteHistoricalConnection(7);
  await wizard.deleteHistoricalConnection(7);
  assert.equal(confirmations, 1);
  unmount();
  confirm("confirm");
  await pending;
  assert.equal(wizard.connections.value.length, 1);
});

test("unmounted deletion ignores response and does not overwrite newer state", async () => {
  let finish;
  let unmount;
  const wizard = createWizard({
    onBeforeUnmount: (callback) => {
      unmount = callback;
    },
    deleteDatasourceConnectionInterface: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  wizard.connections.value = [{ id: 7, name: "local" }];
  const pending = wizard.deleteHistoricalConnection(7);
  await Promise.resolve();
  unmount();
  wizard.error.value = "new state";
  finish({ code: 200 });
  await pending;
  assert.equal(wizard.connections.value.length, 1);
  assert.equal(wizard.error.value, "new state");
});
