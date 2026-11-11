import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire, registerHooks } from "node:module";
import test from "node:test";
import { effectScope, nextTick, reactive } from "vue";
import * as Vue from "vue";
import { compileScript, parse } from "@vue/compiler-sfc";
import { baseParse, compile } from "@vue/compiler-dom";
import { renderToString } from "vue/server-renderer";
import { ModuleKind, transpileModule } from "typescript";
import { buildBehaviorScheduleCreateParams } from "../src/views/SpaceBehaviorScheduleWorkspace/utils/buildBehaviorScheduleCreateParams.ts";
import * as scheduleTypes from "../src/types/pages/ontologySpaceBehaviorScheduleType.ts";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) specifier = new URL(`../src/${specifier.slice(2)}${specifier.endsWith(".ts") ? "" : ".ts"}`, import.meta.url).href;
    if (specifier.startsWith(".") && !/\.[a-z]+$/i.test(specifier)) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(candidate)) specifier = candidate.href;
    }
    return nextResolve(specifier, context);
  },
});

const { useBehaviorParameters } = await import("../src/composables/behavior/useBehaviorParameters.ts");
const { cloneBehaviorParameterSnapshot } = await import("../src/utils/behaviorParameters/cloneBehaviorParameterSnapshot.ts");
const { restoreScheduleBehaviorParameters } = await import("../src/views/SpaceBehaviorScheduleWorkspace/utils/restoreScheduleBehaviorParameters.ts");

/** @description 创建隔离的参数配置测试上下文。 @param overrides 接口覆盖。 @returns 状态、作用域与调用记录。 */
function createContext(overrides = {}) {
  const calls = [];
  const props = reactive({ spaceId: "23", behavior: { id: "1", kind: "application", behaviorApiName: "app", ontologyUniqIdentifier: "ship" } });
  const apis = {
    getOntologyActionInfoInterface: async (query) => {
      calls.push(query);
      return { code: 200, data: { id: 1, actionApi: query.actionApi, mappingIns: [], mappingOuts: [] } };
    },
    getOntologyEntitiesInterface: async () => ({ code: 200, data: { records: [], total: 0 } }),
    getOntologyLinkByUniqueIdentifierInterface: async () => ({ code: 500, message: "关系加载失败" }),
    postGetOntologyEntityRowDetailPageInterface: async () => ({ code: 200, data: { records: [], total: 0 } }),
    ...overrides,
  };
  const scope = effectScope();
  const state = scope.run(() => useBehaviorParameters(props, apis));
  return { state, scope, props, calls };
}

test("parameter configuration loads without executing behavior and snapshots are isolated", async () => {
  const { state, scope, calls } = createContext();
  await state.loadApplicationTestForm();
  assert.equal(state.detailError.value, "");
  assert.equal(calls.length, 1);
  state.updateParamValue("amount", "7");
  const built = state.createParameterSnapshot();
  assert.equal(built.ok, true);
  assert.equal(built.snapshot.request.actionApi, "app");
  state.updateParamValue("amount", "8");
  state.restoreParameterSnapshot(built.snapshot);
  assert.equal(state.paramValues.amount, "7");
  state.updateParamValue("amount", "9");
  assert.equal(built.snapshot.values.amount, "7");
  scope.stop();
});

test("configuration exposes errors and rejects incomplete loading state", async () => {
  const { state, scope } = createContext({ getOntologyActionInfoInterface: async () => ({ code: 500, message: "接口提示" }) });
  state.detailLoading.value = true;
  assert.equal(state.createParameterSnapshot().ok, false);
  state.detailLoading.value = false;
  await state.loadApplicationTestForm();
  assert.equal(state.detailError.value, "接口提示");
  assert.equal(state.createParameterSnapshot().ok, false);
  scope.stop();
});

test("stale and disposed requests cannot overwrite the latest behavior", async () => {
  const pending = [];
  const { state, scope, props } = createContext({ getOntologyActionInfoInterface: (query) => new Promise((resolve) => pending.push({ query, resolve })) });
  const first = state.loadApplicationTestForm();
  props.behavior.behaviorApiName = "next";
  const second = state.loadApplicationTestForm();
  pending[1].resolve({ code: 200, data: { actionApi: "next", mappingIns: [], mappingOuts: [] } });
  await second;
  pending[0].resolve({ code: 200, data: { actionApi: "old", mappingIns: [], mappingOuts: [] } });
  await first;
  assert.equal(state.resolvedActionApi.value, "next");
  const third = state.loadApplicationTestForm();
  scope.stop();
  pending[2].resolve({ code: 200, data: { actionApi: "disposed", mappingIns: [], mappingOuts: [] } });
  await third;
  assert.notEqual(state.resolvedActionApi.value, "disposed");
});

test("switching spaces with the same behavior API supersedes a pending request", async () => {
  const pending = [];
  const { state, scope, props } = createContext({ getOntologyActionInfoInterface: (query) => new Promise((resolve) => pending.push({ query, resolve })) });
  const first = state.loadApplicationTestForm();
  props.spaceId = "24";
  const second = state.loadApplicationTestForm();
  assert.equal(pending.length, 2);
  pending[1].resolve({ code: 200, data: { actionApi: "new-space", mappingIns: [] } });
  await second;
  pending[0].resolve({ code: 200, data: { actionApi: "old-space", mappingIns: [] } });
  await first;
  assert.equal(state.resolvedActionApi.value, "new-space");
  scope.stop();
});

test("cancelled detail loading can be retried immediately and cannot commit its old response", async () => {
  const pending = [];
  const { state, scope } = createContext({ getOntologyActionInfoInterface: () => new Promise((resolve) => pending.push(resolve)) });
  const first = state.loadApplicationTestForm();
  state.cancelParameterRequests();
  const retry = state.loadApplicationTestForm();
  assert.equal(pending.length, 2);
  pending[1]({ code: 200, data: { actionApi: "retry", mappingIns: [] } });
  await retry;
  pending[0]({ code: 200, data: { actionApi: "old", mappingIns: [] } });
  await first;
  assert.equal(state.resolvedActionApi.value, "retry");
  scope.stop();
});

/** @description 创建包含不同来源、出参和可选关系的详情。 @param link 是否绑定关系。 @returns 接口详情。 */
function createActionDetail(link = false) {
  return {
    actionApi: "app",
    ontologyUniqIdentifier: "ship",
    mappingIns: [
      { parameterName: "amount", category: "INPUT", sourceType: "EXTERNAL", propertyType: "Int" },
      { parameterName: "fixed", category: "INPUT", sourceType: "FIXED", sourceConfig: "constant" },
      { parameterName: "ships", category: "INPUT", sourceType: "PROPERTY", ontologyUniqueIdentifier: "ship", storageGroup: "main" },
      { parameterName: "result", category: "OUTPUT", outputMode: "WRITE_PROPERTY", ontologyUniqueIdentifier: "ship", storageGroup: "main" },
    ],
    linkMapping: link ? { ontologyLinkUniqIdentifier: "link" } : null,
  };
}

/** @description 创建实际参数和实例列表。 @param link 是否带关系。 @returns 隔离上下文。 */
function createBindingContext(link = false) {
  return createContext({
    getOntologyActionInfoInterface: async () => ({ code: 200, data: createActionDetail(link) }),
    getOntologyEntitiesInterface: async () => ({
      code: 200,
      data: {
        records: [
          { entityPrimaryKey: 1, displayName: "one" },
          { entityPrimaryKey: 2, displayName: "two" },
        ],
        total: 2,
      },
    }),
    getOntologyLinkByUniqueIdentifierInterface: async () => ({ code: 200, data: { ontologyUniqueIdentifierFrom: "ship", ontologyUniqueIdentifierTo: "port" } }),
  });
}

test("input records remain multiple, output stays single and external values are coerced", async () => {
  const { state, scope } = createBindingContext();
  await state.loadApplicationTestForm();
  state.updateParamValue("amount", "abc");
  assert.equal(state.createParameterSnapshot().ok, false);
  for (const key of ["1", "2"]) {
    state.updateApplicationOntologyEntitySelection("ships", key);
    state.addApplicationInputBindingRecords("ships");
  }
  state.updateApplicationOntologyEntitySelection("result", ["1", "2"]);
  assert.equal(state.findApplicationOntologyPicker("result").selectedEntities.length, 1);
  state.updateParamValue("amount", "7");
  const result = state.createParameterSnapshot();
  assert.equal(result.ok, true);
  assert.deepEqual(result.snapshot.request.params, { amount: 7 });
  assert.deepEqual(
    result.snapshot.request.inputParams.ships.map((item) => item.entityPrimaryKey),
    [1, 2],
  );
  assert.equal(result.snapshot.request.outputParams.result.entityPrimaryKey, 1);
  const record = state.listApplicationInputBindingRecords("ships")[0];
  state.removeApplicationInputBindingRecord("ships", record.recordKey);
  assert.equal(state.listApplicationInputBindingRecords("ships").length, 1);
  assert.equal(state.restoreParameterSnapshot(result.snapshot), true);
  assert.equal(state.listApplicationInputBindingRecords("ships").length, 2);
  assert.equal(state.paramValues.amount, "7");
  scope.stop();
});

test("saved execution request restores property bindings, outputs, external values and link endpoints", async () => {
  const { state, scope } = createBindingContext(true);
  await state.loadApplicationTestForm();
  const request = {
    ontologySpaceId: 23,
    actionApi: "app",
    params: { amount: 0 },
    inputParams: { ships: [{ entityPrimaryKey: 1 }, { entityPrimaryKey: 9 }] },
    outputParams: { result: { entityPrimaryKey: 2 } },
    entityPrimaryKeys: { from: [1, 9], to: [2] },
  };
  assert.equal(restoreScheduleBehaviorParameters(state, JSON.stringify(request), "23", "app"), "");
  assert.equal(state.paramValues.amount, "0");
  assert.deepEqual(
    state.listApplicationInputBindingRecords("ships").map((row) => row.entityPrimaryKey),
    [1, 9],
  );
  assert.deepEqual(state.findApplicationOntologyPicker("ships").selectedRowKeys, ["1", "9"]);
  assert.deepEqual(state.findApplicationOntologyPicker("result").selectedRowKeys, ["2"]);
  assert.deepEqual(state.selectedFromEntityRowKeys.value, ["1", "9"]);
  assert.deepEqual(state.selectedToEntityRowKeys.value, ["2"]);
  const built = state.createParameterSnapshot();
  assert.equal(built.ok, true);
  assert.deepEqual(built.snapshot.request.inputParams, request.inputParams);
  assert.deepEqual(built.snapshot.request.outputParams, request.outputParams);
  assert.deepEqual(built.snapshot.request.entityPrimaryKeys, request.entityPrimaryKeys);
  scope.stop();
});

test("saved request restores non-main rich keys and cross-page output selections without changing types", async () => {
  const detail = createActionDetail();
  detail.mappingIns.find((row) => row.parameterName === "ships").storageGroup = "events";
  const { state, scope } = createContext({ getOntologyActionInfoInterface: async () => ({ code: 200, data: detail }) });
  await state.loadApplicationTestForm();
  const input = { entityPrimaryKey: { id: 1 }, dataPrimaryKeys: { events: { row: 2 } } };
  const output = { entityPrimaryKey: { id: 9 } };
  const request = { ontologySpaceId: "23", actionApi: "app", params: { amount: 3 }, inputParams: { ships: [input] }, outputParams: { result: output } };
  assert.equal(restoreScheduleBehaviorParameters(state, JSON.stringify(request), "23", "app"), "");
  const built = state.createParameterSnapshot();
  assert.equal(built.ok, true);
  assert.deepEqual(built.snapshot.request.inputParams.ships, [input]);
  assert.deepEqual(built.snapshot.request.outputParams.result, output);
  assert.equal(state.applicationStorageGroupPickers.value[0].entitySlots[0].selectedDataRow.dataPrimaryKey.row, 2);
  scope.stop();
});

test("invalid saved requests fail explicitly without changing parameter state", async () => {
  const { state, scope } = createBindingContext();
  await state.loadApplicationTestForm();
  state.updateParamValue("amount", "7");
  for (const value of [
    "bad",
    "null",
    "[]",
    '{"actionApi":"other"}',
    '{"ontologySpaceId":"other","actionApi":"app"}',
    '{"actionApi":"app","inputParams":{"ships":[{}]}}',
    '{"actionApi":"app","outputParams":{"result":[]}}',
    '{"actionApi":"app","entityPrimaryKeys":{"from":[],"to":[null]}}',
  ]) {
    assert.notEqual(restoreScheduleBehaviorParameters(state, value, "23", "app"), "");
    assert.equal(state.paramValues.amount, "7");
  }
  scope.stop();
});

test("relation endpoints preserve multiple selections and restore across configuration sessions", async () => {
  const { state, scope } = createBindingContext(true);
  await state.loadApplicationTestForm();
  state.updateParamValue("amount", "7");
  state.updateApplicationOntologyEntitySelection("ships", "1");
  state.addApplicationInputBindingRecords("ships");
  state.updateApplicationOntologyEntitySelection("result", "2");
  assert.equal(state.createParameterSnapshot().ok, false);
  state.fromEntityRows.value.forEach(state.toggleFromEntityRow);
  state.toEntityRows.value.forEach(state.toggleToEntityRow);
  const result = state.createParameterSnapshot();
  assert.equal(result.ok, true);
  assert.deepEqual(result.snapshot.request.entityPrimaryKeys, { from: [1, 2], to: [1, 2] });
  state.clearRelationTestState();
  state.restoreParameterSnapshot(result.snapshot);
  assert.deepEqual(state.selectedFromEntityRowKeys.value, ["1", "2"]);
  assert.deepEqual(state.selectedToEntityRowKeys.value, ["1", "2"]);
  scope.stop();
});

test("snapshots reject a different action or space without mutating configuration", async () => {
  const { state, scope, props } = createContext();
  await state.loadApplicationTestForm();
  const result = state.createParameterSnapshot();
  props.spaceId = "24";
  assert.equal(state.restoreParameterSnapshot(result.snapshot), false);
  props.spaceId = "23";
  assert.equal(state.restoreParameterSnapshot({ ...result.snapshot, actionApi: "other" }), false);
  scope.stop();
});

test("duplicate pending detail loads share one query and empty or failed child lists remain explicit", async () => {
  let finish;
  let calls = 0;
  const { state, scope } = createContext({
    getOntologyActionInfoInterface: () => {
      calls += 1;
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
  });
  const first = state.loadApplicationTestForm();
  await state.loadApplicationTestForm();
  assert.equal(calls, 1);
  finish({ code: 200, data: createActionDetail() });
  await first;
  assert.equal(state.findApplicationOntologyPicker("ships").rows.length, 0);
  assert.equal(state.createParameterSnapshot().ok, false);
  scope.stop();
});

test("rich binding primary keys are cloned without retaining reactive references", async () => {
  const { state, scope } = createBindingContext();
  await state.loadApplicationTestForm();
  state.updateParamValue("amount", "1");
  state.applicationInputBindingRecords.value.ships = [{ recordKey: "rich", entityPrimaryKey: { nested: { id: 1 } }, entityDisplayName: "rich" }];
  state.updateApplicationOntologyEntitySelection("result", "1");
  const result = state.createParameterSnapshot();
  assert.equal(result.ok, true);
  state.applicationInputBindingRecords.value.ships[0].entityPrimaryKey.nested.id = 9;
  assert.equal(result.snapshot.inputBindings.ships[0].entityPrimaryKey.nested.id, 1);
  scope.stop();
});

test("non-main input stores entity and data-row bindings and survives snapshot restore", async () => {
  const detail = createActionDetail();
  detail.mappingIns.find((row) => row.parameterName === "ships").storageGroup = "events";
  const { state, scope } = createContext({
    getOntologyActionInfoInterface: async () => ({ code: 200, data: detail }),
    getOntologyEntitiesInterface: async () => ({ code: 200, data: { records: [{ entityPrimaryKey: 1, displayName: "one" }], total: 1 } }),
    postGetOntologyEntityRowDetailPageInterface: async () => ({ code: 200, data: { records: [{ dataPrimaryKey: { id: 10 }, props: [] }], total: 1 } }),
  });
  await state.loadApplicationTestForm();
  state.updateParamValue("amount", "3");
  state.updateApplicationOntologyEntitySelection("result", "1");
  state.updateApplicationOntologyEntitySelection("ships", "1");
  await settleForm();
  const picker = state.applicationStorageGroupPickers.value[0];
  const slot = picker.entitySlots[0];
  state.addApplicationInputBindingRecords("ships");
  assert.equal(state.listApplicationInputBindingRecords("ships").length, 0);
  state.updateApplicationStorageGroupRowSelection(picker.pickerKey, slot.entityRowKey, slot.rows[0].rowKey);
  state.addApplicationInputBindingRecords("ships");
  const result = state.createParameterSnapshot();
  assert.equal(result.ok, true);
  assert.deepEqual(result.snapshot.request.inputParams.ships[0], { entityPrimaryKey: 1, dataPrimaryKeys: { events: { id: 10 } } });
  state.clearApplicationInputParamDraft("ships");
  state.restoreParameterSnapshot(result.snapshot);
  assert.deepEqual(state.listApplicationInputBindingRecords("ships")[0].dataPrimaryKey, { id: 10 });
  assert.equal(state.createParameterSnapshot().ok, true);
  scope.stop();
});

/** @description 编译真实调度表单脚本，注入可观察的数据接口，不加载浏览器 UI。 @param initialDraft 初始草稿。 @param mode 表单模式。 @param mappingIns 参数定义。 @returns 表单状态、事件和控制台输出。 */
function createScheduleFormHarness(
  initialDraft = null,
  mode = "create",
  mappingIns = [{ parameterName: "amount", category: "INPUT", sourceType: "EXTERNAL", propertyType: "Int" }],
) {
  const source = readFileSync(new URL("../src/views/SpaceBehaviorScheduleWorkspace/BehaviorScheduleFormDialog.vue", import.meta.url), "utf8");
  const { descriptor } = parse(source);
  const compiled = compileScript(descriptor, { id: "schedule-parameters" });
  const { outputText } = transpileModule(compiled.content, { compilerOptions: { module: ModuleKind.CommonJS } });
  const modules = createRequire(import.meta.url);
  const queries = [];
  const apis = {
    getOntologyActionInfoInterface: async (query) => {
      queries.push(query);
      return {
        code: 200,
        data: { actionApi: query.actionApi, mappingIns },
      };
    },
    getOntologyEntitiesInterface: async () => ({ code: 200, data: { records: [] } }),
    getOntologyLinkByUniqueIdentifierInterface: async () => ({ code: 500 }),
    postGetOntologyEntityRowDetailPageInterface: async () => ({ code: 500 }),
    postTestOntologyActionInterface: () => {
      throw new Error("调度参数配置不得执行测试接口");
    },
  };
  const exports = {};
  /** @description 注入表单数据依赖和 UI 占位组件。 @param id 依赖路径。 @returns 对应模块。 */
  function resolveFormModule(id) {
    if (id.endsWith(".vue")) return { default: {} };
    if (id === "@/apis") return apis;
    if (id === "@/types") return scheduleTypes;
    if (id.includes("useBehaviorParameters")) return { useBehaviorParameters };
    if (id.includes("cloneBehaviorParameterSnapshot")) return { cloneBehaviorParameterSnapshot };
    if (id.includes("restoreScheduleBehaviorParameters")) return { restoreScheduleBehaviorParameters };
    if (id.includes("buildBehaviorScheduleCreateParams")) return { buildBehaviorScheduleCreateParams };
    if (id.includes("scheduleRuleFlowFactory")) return { cloneScheduleRuleFlow: structuredClone };
    if (id === "@element-plus/icons-vue") return { Close: {}, Plus: {} };
    return modules(id);
  }
  const logs = [];
  new Function("require", "exports", "console", outputText)(resolveFormModule, exports, { log: (...args) => logs.push(args) });
  const props = reactive({
    modelValue: false,
    mode,
    spaceId: "23",
    initialDraft,
    submitting: false,
    behaviorLoading: false,
    behaviorError: "",
    behaviorOptions: [
      { id: "1", actionApi: "app", displayName: "同名行为", ontologyUniqIdentifier: "ship" },
      { id: "2", actionApi: "next", displayName: "同名行为", ontologyUniqIdentifier: "ship" },
    ],
  });
  const events = [];
  const scope = effectScope();
  const form = scope.run(() => exports.default.setup(props, { expose: () => {}, emit: (...event) => events.push(event) }));
  return { form, props, events, queries, logs, scope };
}

/** @description 等待表单监听器和接口微任务完成。 */
async function settleForm() {
  await nextTick();
  await new Promise((resolve) => setImmediate(resolve));
}

test("schedule config selects stable same-name behavior, validates and emits an isolated snapshot without testing", async () => {
  const { form, props, events, queries, scope } = createScheduleFormHarness();
  props.modelValue = true;
  await settleForm();
  form.draft.name = "schedule";
  form.draft.strategy = "周期调度";
  form.selectScheduleBehavior("1");
  await settleForm();
  form.parameterConfig.updateParamValue("amount", "bad");
  form.submitCreateScheduleForm();
  assert.equal(events.length, 0);
  form.parameterConfig.updateParamValue("amount", "4");
  form.submitCreateScheduleForm();
  assert.equal(events[0][0], "confirm");
  assert.equal(events[0][1].behaviorId, "1");
  assert.equal(events[0][1].behaviorParameters.request.params.amount, 4);
  form.parameterConfig.updateParamValue("amount", "5");
  assert.equal(events[0][1].behaviorParameters.values.amount, "4");
  form.selectScheduleBehavior("2");
  await settleForm();
  assert.equal(form.draft.behaviorActionApi, "next");
  assert.equal(form.draft.behaviorParameters, null);
  assert.equal(form.parameterConfig.paramValues.amount, "");
  assert.deepEqual(
    queries.map((query) => query.actionApi),
    ["app", "next"],
  );
  props.modelValue = false;
  await settleForm();
  scope.stop();
});

test("schedule edit and view restore snapshots and never mutate the saved record", async () => {
  const first = createScheduleFormHarness();
  first.props.modelValue = true;
  await settleForm();
  first.form.draft.name = "saved";
  first.form.draft.strategy = "周期调度";
  first.form.selectScheduleBehavior("1");
  await settleForm();
  first.form.parameterConfig.updateParamValue("amount", "8");
  first.form.submitCreateScheduleForm();
  const saved = first.events[0][1];
  first.scope.stop();
  for (const mode of ["edit", "view"]) {
    const context = createScheduleFormHarness(saved, mode);
    context.props.modelValue = true;
    await settleForm();
    assert.equal(context.form.parameterConfig.paramValues.amount, "8");
    if (mode === "view") {
      context.form.selectScheduleBehavior("2");
      context.form.submitCreateScheduleForm();
      assert.equal(context.form.draft.behaviorId, "1");
      assert.equal(context.events.length, 0);
    } else context.form.parameterConfig.updateParamValue("amount", "9");
    assert.equal(saved.behaviorParameters.values.amount, "8");
    context.scope.stop();
  }
});

test("new schedule rejects empty and whitespace external text before logging or submitting", async () => {
  const { form, props, events, logs, scope } = createScheduleFormHarness(null, "create", [
    { parameterName: "message", displayName: "消息内容", category: "INPUT", sourceType: "EXTERNAL", propertyType: "String" },
  ]);
  props.modelValue = true;
  await settleForm();
  form.draft.name = "text schedule";
  form.draft.strategy = "周期调度";
  form.selectScheduleBehavior("1");
  await settleForm();
  for (const value of ["", "  \t\n"]) {
    form.parameterConfig.updateParamValue("message", value);
    form.submitCreateScheduleForm();
    assert.equal(events.length, 0);
    assert.equal(logs.length, 0);
    assert.match(form.validationError.value, /消息内容/);
  }
  form.parameterConfig.updateParamValue("message", "hello");
  form.submitCreateScheduleForm();
  assert.equal(events.length, 1);
  assert.equal(logs.length, 1);
  assert.equal(logs[0][0], "行为调度创建参数");
  assert.deepEqual(JSON.parse(logs[0][1].task.entityJson), { ontologySpaceId: "23", actionApi: "app", params: { message: "hello" } });
  assert.deepEqual(events[0][2], logs[0][1]);
  scope.stop();
});

test("new schedule logs valid zero and false, blocks invalid values and respects disabled confirmation", async () => {
  const { form, props, events, logs, scope } = createScheduleFormHarness(null, "create", [
    { parameterName: "amount", category: "INPUT", sourceType: "EXTERNAL", propertyType: "Int" },
    { parameterName: "enabled", category: "INPUT", sourceType: "EXTERNAL", propertyType: "Boolean" },
  ]);
  props.modelValue = true;
  await settleForm();
  form.draft.name = "typed schedule";
  form.draft.strategy = "周期调度";
  form.selectScheduleBehavior("1");
  await settleForm();
  form.parameterConfig.updateParamValue("amount", "bad");
  form.parameterConfig.updateParamValue("enabled", "false");
  form.submitCreateScheduleForm();
  assert.equal(logs.length, 0);
  assert.equal(events.length, 0);
  form.parameterConfig.updateParamValue("amount", "0");
  props.submitting = true;
  form.submitCreateScheduleForm();
  assert.equal(logs.length, 0);
  props.submitting = false;
  props.mode = "view";
  form.submitCreateScheduleForm();
  assert.equal(logs.length, 0);
  props.mode = "create";
  form.submitCreateScheduleForm();
  assert.deepEqual(JSON.parse(logs[0][1].task.entityJson).params, { amount: 0, enabled: false });
  assert.equal(events.length, 1);
  form.parameterConfig.updateParamValue("amount", "9");
  assert.equal(JSON.parse(logs[0][1].task.entityJson).params.amount, 0);
  scope.stop();
});

test("new schedule with no external parameters logs its valid request", async () => {
  const { form, props, events, logs, scope } = createScheduleFormHarness(null, "create", []);
  props.modelValue = true;
  await settleForm();
  form.draft.name = "no params";
  form.draft.strategy = "周期调度";
  form.selectScheduleBehavior("1");
  await settleForm();
  form.submitCreateScheduleForm();
  assert.equal(events.length, 1);
  assert.deepEqual(JSON.parse(logs[0][1].task.entityJson), { ontologySpaceId: "23", actionApi: "app" });
  scope.stop();
});

test("new schedule blocks malformed cron and missing ontology before logging or emitting", async () => {
  const { form, props, events, logs, scope } = createScheduleFormHarness(null, "create", []);
  props.modelValue = true;
  await settleForm();
  form.draft.name = "invalid schedule";
  form.draft.strategy = "周期调度";
  form.selectScheduleBehavior("1");
  await settleForm();
  form.draft.periodKind = "Cron";
  form.draft.cronExpression = "bad";
  form.submitCreateScheduleForm();
  assert.match(form.validationError.value, /Cron/);
  form.draft.periodKind = "每天";
  props.behaviorOptions[0].ontologyUniqIdentifier = "";
  form.submitCreateScheduleForm();
  assert.match(form.validationError.value, /本体标识/);
  assert.equal(events.length, 0);
  assert.equal(logs.length, 0);
  scope.stop();
});

test("schedule parameter panel stays visible while its content follows the selected behavior", async () => {
  const source = readFileSync(new URL("../src/views/SpaceBehaviorScheduleWorkspace/BehaviorScheduleFormDialog.vue", import.meta.url), "utf8");
  const { descriptor } = parse(source);
  const template = baseParse(descriptor.template.content);
  /** @description 定位参数模块的模板节点。 @param {object} node 模板节点。 @returns {object|undefined} 参数模块节点。 */
  function findParameterPanel(node) {
    if (node.props?.some((prop) => ["label", "aria-label"].includes(prop.name) && prop.value?.content === "行为参数")) return node;
    for (const child of node.children ?? []) {
      const found = findParameterPanel(child);
      if (found) return found;
    }
    return undefined;
  }
  const panel = findParameterPanel(template);
  assert.ok(panel);
  const { code } = compile(panel.loc.source);
  const renderPanel = new Function("Vue", code)(Vue);
  const draft = reactive({ behaviorActionApi: "" });
  /** @description 渲染真实参数模块，替换内部业务组件为可观察的占位节点。 @returns {Promise<string>} 模块 HTML。 */
  async function renderParameterPanel() {
    const app = Vue.createSSRApp({ render: () => renderPanel({ draft, parameterConfig: {}, formDisabled: false }, []) });
    app.component("el-form-item", {
      setup:
        (props, { slots }) =>
        () =>
          Vue.h("div", slots.default?.()),
    });
    app.component("BehaviorParameterConfig", { render: () => Vue.h("div", { "data-parameter-content": "true" }) });
    return renderToString(app);
  }
  const emptyPanel = await renderParameterPanel();
  assert.match(emptyPanel, /behavior-schedule-form-dialog__parameters/);
  assert.match(emptyPanel, /行为参数/);
  assert.doesNotMatch(emptyPanel, /data-parameter-content/);
  draft.behaviorActionApi = "app";
  assert.match(await renderParameterPanel(), /data-parameter-content/);
  draft.behaviorActionApi = "";
  const clearedPanel = await renderParameterPanel();
  assert.match(clearedPanel, /behavior-schedule-form-dialog__parameters/);
  assert.doesNotMatch(clearedPanel, /data-parameter-content/);
});

test("schedule remote detail hydrates API selection and zero parameter after options retry", async () => {
  const seed = createScheduleFormHarness();
  const saved = {
    ...seed.form.createEmptyScheduleDraft(),
    name: "saved",
    strategy: "周期调度",
    behavior: "已保存行为",
    behaviorActionApi: "app",
    savedEntityJson: JSON.stringify({ ontologySpaceId: "23", actionApi: "app", params: { amount: 0 } }),
  };
  seed.scope.stop();
  for (const mode of ["view", "edit"]) {
    const context = createScheduleFormHarness(saved, mode);
    context.props.behaviorOptions = [];
    context.props.modelValue = true;
    await settleForm();
    assert.equal(context.form.parameterConfig.paramValues.amount, "0");
    assert.equal(context.form.selectedBehaviorValue.value, "saved:app");
    context.form.parameterConfig.updateParamValue("amount", "7");
    context.props.behaviorOptions = [{ id: "1", actionApi: "app", displayName: "行为", ontologyUniqIdentifier: "ship" }];
    await settleForm();
    assert.equal(context.form.selectedBehaviorValue.value, "1");
    assert.equal(context.form.parameterConfig.paramValues.amount, "7");
    context.props.modelValue = false;
    await settleForm();
    context.props.mode = "create";
    context.props.modelValue = true;
    await settleForm();
    assert.equal(context.form.draft.savedEntityJson, "");
    context.scope.stop();
  }
});

test("schedule malformed saved parameters block confirmation and recover on retry", async () => {
  const context = createScheduleFormHarness(null, "edit");
  context.props.initialDraft = {
    ...context.form.createEmptyScheduleDraft(),
    name: "saved",
    strategy: "周期调度",
    behavior: "行为",
    behaviorActionApi: "app",
    savedEntityJson: "{",
  };
  context.props.modelValue = true;
  await settleForm();
  assert.match(context.form.validationError.value, /JSON/);
  context.form.submitCreateScheduleForm();
  assert.equal(context.events.length, 0);
  context.form.draft.savedEntityJson = JSON.stringify({ actionApi: "app", params: { amount: 4 } });
  await context.form.initializeScheduleParameters();
  assert.equal(context.form.validationError.value, "");
  assert.equal(context.form.parameterConfig.paramValues.amount, "4");
  context.form.submitCreateScheduleForm();
  assert.equal(context.events[0][1].behaviorParameters.request.params.amount, 4);
  context.scope.stop();
});
