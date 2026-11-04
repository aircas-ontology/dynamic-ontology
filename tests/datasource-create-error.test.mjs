import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { ref, computed } from "vue";

/**
 * @description 执行真实对象操作模块，注入接口及消息边界以验证失败反馈。
 * @param {Function} request 创建接口替身。
 * @returns {object} 对象操作及消息、刷新记录。
 */
function createActions(request) {
  const source = readFileSync(new URL("../src/views/ObjectWorkspacePanel/composables/useObjectWorkspaceObjectActions.ts", import.meta.url), "utf8");
  const code = ts.transpile(source, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS });
  const errors = [];
  const successes = [];
  let refreshes = 0;
  const dependencies = {
    vue: { ref, computed },
    "element-plus": { ElMessage: { error: (value) => errors.push(value), success: (value) => successes.push(value) } },
    "@/apis": { postBuildObjectFromDatasourceInterface: request },
  };
  const moduleExports = {};
  new Function("exports", "require", code)(moduleExports, (name) => dependencies[name] ?? {});
  const actions = moduleExports.useObjectWorkspaceObjectActions({
    spaceId: ref("42"),
    workspace: ref(undefined),
    load: async () => {
      refreshes++;
    },
  });
  return {
    actions,
    errors,
    successes,
    get refreshes() {
      return refreshes;
    },
  };
}

const selection = {
  schemaName: "public",
  primaryTableId: "ship",
  selectedTableIds: ["ship"],
  selectedTables: [{ id: "ship", name: "ship", fields: [{ id: "id", name: "id" }] }],
  fieldIdsByTable: { ship: ["id"] },
  foreignKeys: {},
};
const draft = { categoryId: "1", displayName: "舰船", apiName: "ship" };

for (const [name, request, expected] of [
  ["business failure", async () => ({ code: 500, message: "对象 APIName 已存在" }), "对象 APIName 已存在"],
  [
    "network exception",
    async () => {
      throw new Error("网络连接失败");
    },
    "网络连接失败",
  ],
  ["empty error response", async () => ({ code: 500, message: "" }), "数据源构建对象失败，请重试。"],
  [
    "unknown exception",
    async () => {
      throw null;
    },
    "数据源构建对象失败，请重试。",
  ],
]) {
  test(`datasource creation visibly reports ${name} after wizard is closed`, async () => {
    const state = createActions(request);
    await state.actions.createOntologyObjectFromDatasource(selection, draft);
    assert.deepEqual(state.errors, [expected]);
    assert.equal(state.actions.objectCreateError.value, expected);
    assert.equal(state.actions.objectCreateSubmitting.value, false);
    assert.equal(state.refreshes, 0);
    assert.deepEqual(state.successes, []);
  });
}

test("successful datasource creation refreshes once and blocks duplicate submission", async () => {
  let finish;
  let calls = 0;
  const state = createActions(() => {
    calls++;
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  const pending = state.actions.createOntologyObjectFromDatasource(selection, draft);
  await state.actions.createOntologyObjectFromDatasource(selection, draft);
  assert.equal(calls, 1);
  assert.equal(state.actions.objectCreateSubmitting.value, true);
  finish({ code: 200, data: { message: "构建成功" } });
  await pending;
  assert.deepEqual(state.errors, []);
  assert.deepEqual(state.successes, ["构建成功"]);
  assert.equal(state.refreshes, 1);
  assert.equal(state.actions.objectCreateSubmitting.value, false);
});
