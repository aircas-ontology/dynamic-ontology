import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";
import * as Vue from "vue";
import { ModuleKind, transpileModule } from "typescript";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) specifier = new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href;
    if (specifier.startsWith(".") && !/\.[a-z]+$/i.test(specifier)) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(candidate)) specifier = candidate.href;
    }
    return nextResolve(specifier, context);
  },
});
const realParameters = await import("../src/composables/behavior/useBehaviorParameters.ts");
const realRestore = await import("../src/views/SpaceBehaviorScheduleWorkspace/utils/restoreScheduleBehaviorParameters.ts");

/** @description 构造调度行为树参数桩，避免规则参数测试加载真实执行面板依赖。 @returns {object} 树参数控制器。 */
function createScheduleTreeParametersStub() {
  return {
    planStatus: Vue.ref("idle"),
    planError: Vue.ref(""),
    testStatus: Vue.ref("idle"),
    logs: Vue.ref([]),
    externalBlackboardRows: Vue.ref([]),
    propertyBlackboardGroups: Vue.ref([]),
    execNodeBlocks: Vue.ref([]),
    externalInputDraft: Vue.reactive({}),
    blackboardObjectKeys: Vue.reactive({}),
    nodeDrafts: Vue.reactive({}),
    instanceOptions: Vue.reactive({}),
    instanceLoadingIds: Vue.reactive({}),
    parameterBusy: Vue.ref(false),
    parameterError: Vue.ref(""),
    resolveObjectLabel: () => "",
    clearTreeParameters() {},
    initializeTreeParameters: async () => {},
    captureTreeParameters: () => ({ ok: false, error: "tree stub" }),
    loadBehaviorTreeEntityOptions() {},
    updateNodeParamDraft() {},
    updateNodeEntityKeyDraft() {},
    updateNodeInputParamDraft() {},
    updateNodeOutputDraft() {},
  };
}

/** @description 运行真实规则参数适配层并隔离公共参数查询。 @returns {object} 参数状态及测试记录。 */
function createActionHarness(savedDetail = "", restoreResult = "") {
  const source = readFileSync(new URL("../src/views/SpaceBehaviorScheduleWorkspace/composables/useRuleActionParameters.ts", import.meta.url), "utf8");
  const { outputText } = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS } });
  const exports = {};
  const calls = [];
  let finish;
  const controller = {
    detailLoading: Vue.ref(false),
    detailError: Vue.ref(""),
    paramRows: Vue.ref([{ paramName: "name", propertyDisplayName: "名称" }]),
    paramValues: Vue.reactive({ name: "" }),
    cancelParameterRequests: () => calls.push("cancel"),
    clearDetailParamState: () => {
      controller.paramValues.name = "";
    },
    clearRelationTestState() {},
    loadApplicationTestForm: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
    restoreParameterSnapshot: (snapshot) => {
      controller.paramValues.name = snapshot.values.name;
      return true;
    },
    createParameterSnapshot: () => ({ ok: true, snapshot: { values: { ...controller.paramValues }, actionApi: "api", spaceId: "7" } }),
  };
  new Function("require", "exports", outputText)((id) => {
    if (id === "vue") return Vue;
    if (id.includes("useBehaviorParameters")) return { useBehaviorParameters: () => controller };
    if (id.includes("useScheduleTreeParameters")) return { useScheduleTreeParameters: () => createScheduleTreeParametersStub() };
    if (id.includes("restoreScheduleBehaviorParameters"))
      return {
        restoreScheduleBehaviorParameters: (_controller, json, spaceId, api) => {
          calls.push(["restore", json, spaceId, api]);
          return restoreResult;
        },
      };
    return {};
  }, exports);
  const option = Vue.ref({ id: "b", actionApi: "api", displayName: "行为", ontologyUniqIdentifier: "o", kind: "application" });
  const action = Vue.ref({ id: "a", behaviorId: "b", params: [] });
  const visible = Vue.ref(true);
  const scope = Vue.effectScope();
  const state = scope.run(() =>
    exports.useRuleActionParameters(
      () => "7",
      () => option.value,
      () => action.value,
      () => visible.value,
      () => savedDetail,
    ),
  );
  return { state, controller, action, visible, calls, scope, finish: () => finish() };
}

test("read-only action loads the definition and restores saved parameters, failures remain visible", async () => {
  for (const error of ["", "参数定义不匹配"]) {
    const h = createActionHarness('{"params":{"name":"saved"}}', error);
    const pending = h.state.initializeActionParameters();
    h.finish();
    await pending;
    assert.deepEqual(
      h.calls.find((call) => Array.isArray(call)),
      ["restore", '{"params":{"name":"saved"}}', "7", "api"],
    );
    assert.equal(h.state.parameterError.value, error);
    h.scope.stop();
  }
});

test("rule action parameters load, validate, snapshot and restore without changing the node prematurely", async () => {
  const h = createActionHarness();
  const pending = h.state.initializeActionParameters();
  assert.equal(h.state.parameterBusy.value, true);
  assert.equal(h.state.captureActionParameters(), false);
  h.finish();
  await pending;
  assert.equal(h.state.captureActionParameters(), false);
  assert.match(h.state.parameterError.value, /名称/);
  h.controller.paramValues.name = "飞机";
  assert.equal(h.action.value.behaviorParameters, undefined);
  assert.equal(h.state.captureActionParameters(), true);
  assert.equal(h.action.value.behaviorParameters.values.name, "飞机");
  const reopen = h.state.initializeActionParameters();
  h.finish();
  await reopen;
  assert.equal(h.controller.paramValues.name, "飞机");
  h.scope.stop();
});

test("closing or switching action cancels sessions and does not restore an obsolete snapshot", async () => {
  const h = createActionHarness();
  h.action.value.behaviorParameters = { values: { name: "旧参数" } };
  const pending = h.state.initializeActionParameters();
  h.state.clearActionParameters();
  h.visible.value = false;
  h.finish();
  await pending;
  assert.equal(h.controller.paramValues.name, "");
  assert.equal(h.state.parameterBusy.value, false);
  assert.ok(h.calls.length > 1);
  h.scope.stop();
});

test("closing before the definition response does not restore stale saved parameters", async () => {
  const h = createActionHarness('{"params":{"name":"old"}}');
  const pending = h.state.initializeActionParameters();
  h.state.clearActionParameters();
  h.finish();
  await pending;
  assert.equal(
    h.calls.some((call) => Array.isArray(call) && call[0] === "restore"),
    false,
  );
  h.scope.stop();
});

test("real parameter controller restores saved input values for the read-only detail", async () => {
  const source = readFileSync(new URL("../src/views/SpaceBehaviorScheduleWorkspace/composables/useRuleActionParameters.ts", import.meta.url), "utf8");
  const { outputText } = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS } });
  const exports = {};
  const apis = {
    getOntologyActionInfoInterface: async () => ({
      code: 200,
      data: { actionApi: "api", mappingIns: [{ parameterName: "amount", category: "INPUT", sourceType: "EXTERNAL", propertyType: "Int" }], mappingOuts: [] },
    }),
  };
  new Function("require", "exports", outputText)((id) => {
    if (id === "vue") return Vue;
    if (id.includes("useBehaviorParameters")) return realParameters;
    if (id.includes("useScheduleTreeParameters")) return { useScheduleTreeParameters: () => createScheduleTreeParametersStub() };
    if (id.includes("restoreScheduleBehaviorParameters")) return realRestore;
    return apis;
  }, exports);
  const scope = Vue.effectScope();
  const state = scope.run(() =>
    exports.useRuleActionParameters(
      () => "7",
      () => ({ id: "b", actionApi: "api", ontologyUniqIdentifier: "ship", kind: "application" }),
      () => action,
      () => true,
      () => '{"ontologySpaceId":7,"actionApi":"api","params":{"amount":12}}',
    ),
  );
  const action = { id: "a", behaviorId: "b", params: [] };
  await state.initializeActionParameters();
  assert.equal(state.parameterError.value, "");
  assert.equal(state.parameterConfig.paramValues.amount, "12");
  assert.equal(action.behaviorParameters, undefined);
  scope.stop();
});

test("real shared controller queries behavior details and preserves validated parameters when reopened", async () => {
  const source = readFileSync(new URL("../src/views/SpaceBehaviorScheduleWorkspace/composables/useRuleActionParameters.ts", import.meta.url), "utf8");
  const { outputText } = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS } });
  const exports = {};
  const calls = [];
  let failed = true;
  const apis = {
    getOntologyActionInfoInterface: async (query) => {
      calls.push(query);
      if (failed) throw new Error("详情查询失败");
      return {
        code: 200,
        data: {
          actionApi: query.actionApi,
          mappingIns: [{ parameterName: "amount", category: "INPUT", sourceType: "EXTERNAL", propertyType: "Int" }],
          mappingOuts: [],
        },
      };
    },
  };
  new Function("require", "exports", outputText)((id) => {
    if (id === "vue") return Vue;
    if (id.includes("useBehaviorParameters")) return realParameters;
    if (id.includes("useScheduleTreeParameters")) return { useScheduleTreeParameters: () => createScheduleTreeParametersStub() };
    return apis;
  }, exports);
  const action = Vue.ref({ id: "a", behaviorId: "b", params: [] });
  const option = { id: "b", actionApi: "api", ontologyUniqIdentifier: "ship", kind: "application" };
  const scope = Vue.effectScope();
  const state = scope.run(() =>
    exports.useRuleActionParameters(
      () => "7",
      () => option,
      () => action.value,
      () => true,
    ),
  );
  await state.initializeActionParameters();
  assert.match(state.parameterError.value, /失败/);
  assert.equal(state.captureActionParameters(), false);
  failed = false;
  await state.initializeActionParameters();
  assert.equal(state.parameterConfig.paramRows.value[0].paramName, "amount");
  state.parameterConfig.updateParamValue("amount", "12");
  assert.equal(state.captureActionParameters(), true);
  assert.equal(action.value.behaviorParameters.request.actionApi, "api");
  assert.equal(action.value.behaviorParameters.request.params.amount, 12);
  await state.initializeActionParameters();
  assert.equal(state.parameterConfig.paramValues.amount, "12");
  assert.equal(calls.length, 3);
  scope.stop();
});

test("newly confirmed snapshot takes precedence over original saved entity JSON", async () => {
  const h = createActionHarness('{"params":{"name":"old"}}', "old request must not be restored");
  h.action.value.behaviorParameters = { values: { name: "changed" } };
  const pending = h.state.initializeActionParameters();
  h.finish();
  await pending;
  assert.equal(h.controller.paramValues.name, "changed");
  assert.equal(h.state.parameterError.value, "");
  assert.equal(
    h.calls.some((call) => Array.isArray(call)),
    false,
  );
  h.scope.stop();
});

test("confirming binding-only parameters and reopening the node retains a configured summary", async () => {
  const { summarizeThenAction } = await import("../src/views/SpaceBehaviorScheduleWorkspace/utils/scheduleRuleFlowFactory.ts");
  const h = createActionHarness();
  h.controller.paramRows.value = [];
  h.controller.createParameterSnapshot = () => ({
    ok: true,
    snapshot: {
      values: { name: "" },
      request: { actionApi: "api", ontologySpaceId: "7", outputParams: { result: { entityPrimaryKey: 0 } } },
    },
  });
  const pending = h.state.initializeActionParameters();
  h.finish();
  await pending;
  assert.equal(h.state.captureActionParameters(), true);
  assert.deepEqual(h.action.value.params, []);
  assert.match(summarizeThenAction(h.action.value), /输出 1 项/);
  const reopen = h.state.initializeActionParameters();
  h.finish();
  await reopen;
  assert.match(summarizeThenAction(h.action.value), /输出 1 项/);
  h.scope.stop();
});
