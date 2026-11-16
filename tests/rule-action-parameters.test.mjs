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

/** @description 运行真实规则参数适配层并隔离公共参数查询。 @returns {object} 参数状态及测试记录。 */
function createActionHarness() {
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
    return {};
  }, exports);
  const option = Vue.ref({ id: "b", actionApi: "api", displayName: "行为", ontologyUniqIdentifier: "o" });
  const action = Vue.ref({ id: "a", behaviorId: "b", params: [] });
  const visible = Vue.ref(true);
  const scope = Vue.effectScope();
  const state = scope.run(() =>
    exports.useRuleActionParameters(
      () => "7",
      () => option.value,
      () => action.value,
      () => visible.value,
    ),
  );
  return { state, controller, action, visible, calls, scope, finish: () => finish() };
}

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
  new Function("require", "exports", outputText)((id) => (id === "vue" ? Vue : id.includes("useBehaviorParameters") ? realParameters : apis), exports);
  const action = Vue.ref({ id: "a", behaviorId: "b", params: [] });
  const option = { id: "b", actionApi: "api", ontologyUniqIdentifier: "ship" };
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
