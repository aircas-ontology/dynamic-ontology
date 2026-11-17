import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as Vue from "vue";
import { compileScript, parse } from "@vue/compiler-sfc";
import { ModuleKind, transpileModule } from "typescript";

/** @description 编译公共弹窗并隔离目录查询与执行边界。 @param {Function} query 查询替身。 @returns {object} 响应式弹窗上下文。 */
function createTreeDialogHarness(query = async () => ({ code: 200, data: [] })) {
  const source = readFileSync(new URL("../src/components/BehaviorTreeTestDialog.vue", import.meta.url), "utf8");
  const { descriptor } = parse(source);
  const { outputText } = transpileModule(compileScript(descriptor, { id: "tree-dialog" }).content, { compilerOptions: { module: ModuleKind.CommonJS } });
  const calls = [];
  const exports = {};
  new Function("require", "exports", outputText)((id) => {
    if (id === "vue") return Vue;
    if (id.includes("useBehaviorTreeExecution"))
      return {
        useBehaviorTreeExecution: () => ({
          cancelBehaviorTreeExecutionRequests() {},
          externalInputDraft: {},
          blackboardObjectKeys: {},
          nodeDrafts: {},
          instanceOptions: {},
          clearBehaviorTreeExecLogs: () => calls.push("clear"),
          loadBehaviorTreeExecutePlan: async (force) => calls.push(["plan", force]),
        }),
      };
    if (id.includes("mapOntologyObjectsToRelationOptions")) return { mapOntologyObjectsToRelationOptions: (items) => items };
    return { __esModule: true, default: {} };
  }, exports);
  const props = Vue.reactive({
    modelValue: false,
    spaceId: "23",
    behavior: { id: "1", behaviorApiName: "tree", displayName: "行为树" },
    queryObjectCatalog: query,
  });
  const scope = Vue.effectScope();
  const state = scope.run(() => exports.default.setup(props, { expose() {}, emit() {} }));
  return { props, scope, state, calls };
}

/** @description 等待弹窗侦听器与异步边界完成。 @returns {Promise<void>} 等待完成。 */
async function settleTreeDialog() {
  for (let index = 0; index < 8; index += 1) await Vue.nextTick();
}

test("shared tree dialog queries its injected catalog then loads the execution plan", async () => {
  const queries = [];
  const h = createTreeDialogHarness(async (params) => {
    queries.push(params);
    return { code: 200, data: [{ id: "ship" }] };
  });
  try {
    h.props.modelValue = true;
    await settleTreeDialog();
    assert.deepEqual(queries, [{ spaceId: "23" }]);
    assert.deepEqual(h.calls, ["clear", ["plan", true]]);
    assert.deepEqual(h.state.objectOptions.value, [{ id: "ship" }]);
    h.props.modelValue = false;
    await settleTreeDialog();
    h.props.modelValue = true;
    await settleTreeDialog();
    assert.equal(queries.length, 2);
  } finally {
    h.scope.stop();
  }
});

test("shared tree dialog reports query failures and invalid behavior or space", async () => {
  const h = createTreeDialogHarness(async () => {
    throw new Error("目录不可用");
  });
  try {
    h.props.modelValue = true;
    await settleTreeDialog();
    assert.equal(h.state.catalogError.value, "目录不可用");
    h.props.behavior = null;
    await settleTreeDialog();
    assert.equal(h.state.catalogError.value, "缺少行为 api");
    h.props.behavior = { id: "2", behaviorApiName: "next" };
    h.props.spaceId = "";
    await settleTreeDialog();
    assert.equal(h.state.catalogError.value, "空间标识无效");
  } finally {
    h.scope.stop();
  }
});

test("closed, superseded and disposed tree catalog requests cannot update state or load a plan", async () => {
  const pending = [];
  const h = createTreeDialogHarness(() => new Promise((resolve) => pending.push(resolve)));
  try {
    h.props.modelValue = true;
    await settleTreeDialog();
    h.props.modelValue = false;
    await settleTreeDialog();
    pending[0]({ code: 200, data: [{ id: "closed" }] });
    await settleTreeDialog();
    assert.deepEqual(h.state.objectOptions.value, []);
    assert.equal(h.calls.filter(Array.isArray).length, 0);
    h.props.modelValue = true;
    await settleTreeDialog();
    h.props.behavior = { id: "2", behaviorApiName: "next" };
    await settleTreeDialog();
    pending[2]({ code: 200, data: [{ id: "new" }] });
    await settleTreeDialog();
    pending[1]({ code: 200, data: [{ id: "old" }] });
    await settleTreeDialog();
    assert.deepEqual(h.state.objectOptions.value, [{ id: "new" }]);
    assert.equal(h.calls.filter(Array.isArray).length, 1);
    h.props.spaceId = "24";
    await settleTreeDialog();
    h.scope.stop();
    pending[3]({ code: 200, data: [{ id: "disposed" }] });
    await settleTreeDialog();
    assert.deepEqual(h.state.objectOptions.value, []);
    assert.equal(h.calls.filter(Array.isArray).length, 1);
  } finally {
    h.scope.stop();
  }
});
