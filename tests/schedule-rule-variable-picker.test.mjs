import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire, registerHooks } from "node:module";
import test from "node:test";
import { ModuleKind, transpileModule } from "typescript";
import * as Vue from "vue";
import { compileScript, parse } from "@vue/compiler-sfc";
import { renderToString } from "@vue/server-renderer";
import TreeStore from "../node_modules/element-plus/es/components/tree/src/model/tree-store.mjs";

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
const modules = createRequire(import.meta.url);
const { mapOntologyEntityRowDetailPageToDataRows } = await import("../src/utils/behaviorParameters/mapOntologyEntityRowDetailToDataRows.ts");
const { needsRuleVariableDataRow } = await import("../src/views/SpaceBehaviorScheduleWorkspace/utils/needsRuleVariableDataRow.ts");

test("picker keeps object nodes collapsed when highlighting a previously selected property", async () => {
  const source = readFileSync(new URL("../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleVariablePicker.vue", import.meta.url), "utf8");
  const { descriptor } = parse(source);
  const compiled = compileScript(descriptor, { id: "collapse-picker" });
  const { outputText } = transpileModule(compiled.content, { compilerOptions: { module: ModuleKind.CommonJS } });
  const exports = {};
  const { state } = createPickerHarness(apis);
  new Function("require", "exports", outputText)(
    (id) =>
      id === "vue"
        ? Vue
        : id === "vue-router"
          ? { useRoute: () => ({ params: { spaceId: "7" } }) }
          : {
              useRuleVariablePicker: () => state,
              needsRuleVariableDataRow: (group) => Boolean(String(group ?? "").trim()) && String(group).trim() !== "main",
            },
    exports,
  );
  const objectId = JSON.stringify(["ship"]);
  const propertyId = JSON.stringify(["ship", "country"]);
  const data = [{ id: objectId, label: "舰船", children: [{ id: propertyId, label: "国家" }] }];
  const store = new TreeStore({ key: "id", data, props: { label: "label", children: "children" } });
  store.initialize();
  const props = Vue.reactive({
    modelValue: true,
    initial: { kind: "variable", objectId: "ship", objectName: "舰船", objectKind: "object", propertyId: "country", propertyName: "国家", instanceIds: [] },
  });
  const scope = Vue.effectScope();
  const page = scope.run(() => exports.default.setup(props, { expose() {}, emit() {} }));
  page.treeRef.value = { setCurrentKey: (key, expand) => store.setCurrentNodeKey(key, expand) };
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(store.getCurrentNode().key, propertyId);
  assert.equal(store.getNode(objectId).expanded, false);
  store.getNode(objectId).expand();
  assert.equal(store.getNode(objectId).expanded, true);
  const reopened = new TreeStore({ key: "id", data, props: { label: "label", children: "children" } });
  reopened.initialize();
  page.treeRef.value = { setCurrentKey: (key, expand) => reopened.setCurrentNodeKey(key, expand) };
  await Vue.nextTick();
  await Vue.nextTick();
  assert.equal(reopened.getCurrentNode().key, propertyId);
  assert.equal(reopened.getNode(objectId).expanded, false);
  scope.stop();
});

/** @description 执行真实变量查询状态并替换网络边界。 @param {object} apis 接口替身。 @returns {object} 状态及清理函数。 */
function createPickerHarness(apis) {
  const source = readFileSync(new URL("../src/views/SpaceBehaviorScheduleWorkspace/composables/useRuleVariablePicker.ts", import.meta.url), "utf8");
  const { outputText } = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS } });
  const cleanup = [];
  const exports = {};
  new Function("require", "exports", outputText)((id) => {
    if (id === "vue") return { ...Vue, onScopeDispose: (fn) => cleanup.push(fn) };
    if (id === "@/apis" || id.endsWith("/apis") || id.includes("apis/index")) return apis;
    if (id.includes("mapOntologyEntityRowDetailToDataRows")) return { mapOntologyEntityRowDetailPageToDataRows };
    if (id.includes("needsRuleVariableDataRow")) return { needsRuleVariableDataRow };
    if (id === "@/types" || id.includes("/types")) return {};
    return modules(id);
  }, exports);
  return { state: exports.useRuleVariablePicker(() => "7"), cleanup };
}

const object = { uniqueIdentifier: "ship", displayName: "舰船" };
const apis = {
  getOntologyCategoryTreeInterface: async () => ({ code: 200, data: { categoryId: 1, ontologyMetaInfos: [object] } }),
  getOntologyPropertyByOntologyIdInterface: async () => ({
    code: 200,
    data: [
      { uniqueIdentifier: "country", displayName: "国家", propertyType: "String", storageGroup: "main" },
      { uniqueIdentifier: "payload", displayName: "载荷", propertyType: "String", storageGroup: "payload" },
    ],
  }),
  getOntologyEntitiesInterface: async () => ({ code: 200, data: { records: [{ primaryKey: 12 }], total: 1, current: 1, size: 100 } }),
  postGetOntologyEntityRowDetailPageInterface: async () => ({
    code: 200,
    data: { records: [{ dataPrimaryKey: "row-1" }, { dataPrimaryKey: "row-2" }], total: 2, size: 100, current: 1 },
  }),
};

test("variable picker queries current-space properties and preserves selected instance ids", async () => {
  const { state } = createPickerHarness(apis);
  await state.fetchVariableCatalog();
  assert.equal(state.catalog.value[0].name, "舰船");
  assert.equal(state.catalog.value[0].properties[0].name, "国家");
  assert.equal(state.catalog.value[0].properties[0].storageGroup, "main");
  assert.equal(state.catalog.value[0].properties[1].storageGroup, "payload");
  await state.fetchVariableInstances("ship");
  assert.deepEqual(state.instances.value, [{ id: "12", label: "12" }]);
});

test("non-main storage group loads data rows and clears them when cancelled", async () => {
  const queries = [];
  const { state } = createPickerHarness({
    ...apis,
    postGetOntologyEntityRowDetailPageInterface: async (query) => {
      queries.push(query);
      return {
        code: 200,
        data: { records: [{ dataPrimaryKey: "row-1" }], total: 1, size: 100, current: 1 },
      };
    },
  });
  await state.fetchVariableDataRows("ship", "12", "payload");
  assert.deepEqual(queries[0], {
    ontologyUniqueIdentifier: "ship",
    entityPrimaryKey: "12",
    sort: "DESC",
    storageGroup: "payload",
    pageNum: 1,
    pageSize: 100,
  });
  assert.equal(state.dataRows.value[0].label, "row-1");
  assert.equal(state.dataRows.value[0].dataPrimaryKey, "row-1");
  await state.fetchVariableDataRows("ship", "12", "main");
  assert.deepEqual(state.dataRows.value, []);
  state.clearVariableDataRows();
  assert.equal(state.dataRowLoading.value, false);
});

test("instance response maps primaryKey and displayName for all returned aircraft", async () => {
  const records = [
    { primaryKey: 2, displayName: "F-35" },
    { primaryKey: 5, displayName: "阵风F4" },
    { primaryKey: 4, displayName: "建-10" },
    { primaryKey: 3, displayName: "苏-90" },
    { primaryKey: 6, displayName: "F-1" },
    { primaryKey: 1, displayName: "zhangliang" },
  ];
  const { state } = createPickerHarness({
    ...apis,
    getOntologyEntitiesInterface: async () => ({ code: 200, data: { records, total: 6, size: 100, current: 1, pages: 1 } }),
  });
  await state.fetchVariableInstances("ea512d439cd34c6ebbcde6b692261ab5");
  assert.deepEqual(
    state.instances.value,
    records.map((record) => ({ id: String(record.primaryKey), label: record.displayName })),
  );
  assert.equal(state.instanceError.value, "");
  assert.equal(state.instanceLoading.value, false);
});

test("instance identity uses only primaryKey including zero and string keys", async () => {
  const records = [
    { primaryKey: 0, displayName: "零", entityPrimaryKey: 10, id: 20 },
    { primaryKey: "aircraft-1", displayName: "飞机" },
    { entityPrimaryKey: 2, displayName: "旧字段" },
    { id: 3, displayName: "旧标识" },
    { primaryKey: null, id: 4 },
    { primaryKey: {}, id: 5 },
  ];
  const { state } = createPickerHarness({ ...apis, getOntologyEntitiesInterface: async () => ({ code: 200, data: { records, total: records.length } }) });
  await state.fetchVariableInstances("aircraft");
  assert.deepEqual(state.instances.value, [
    { id: "0", label: "零" },
    { id: "aircraft-1", label: "飞机" },
  ]);
});

test("picker reports failures, prevents duplicates and ignores responses after close", async () => {
  let resolve;
  let calls = 0;
  const { state } = createPickerHarness({
    ...apis,
    getOntologyCategoryTreeInterface: () => {
      calls++;
      return new Promise((done) => {
        resolve = done;
      });
    },
  });
  const pending = state.fetchVariableCatalog();
  await state.fetchVariableCatalog();
  assert.equal(calls, 1);
  state.cancelVariableQueries();
  resolve({ code: 200, data: { categoryId: 1, ontologyMetaInfos: [object] } });
  await pending;
  assert.deepEqual(state.catalog.value, []);
  const failed = createPickerHarness({
    ...apis,
    getOntologyCategoryTreeInterface: async () => {
      throw new Error("查询失败");
    },
  }).state;
  await failed.fetchVariableCatalog();
  assert.equal(failed.catalogError.value, "查询失败");
  assert.equal(failed.catalogLoading.value, false);
});

test("instance queries ignore superseded objects, paginate and support retry after error", async () => {
  let finishOld;
  const { state } = createPickerHarness({
    ...apis,
    getOntologyEntitiesInterface: async ({ ontologyUniqueIdentifier, pageNum }) => {
      if (ontologyUniqueIdentifier === "old")
        return new Promise((resolve) => {
          finishOld = resolve;
        });
      if (ontologyUniqueIdentifier === "broken") throw new Error("实例失败");
      return { code: 200, data: { records: [{ primaryKey: pageNum }], total: 101 } };
    },
  });
  const old = state.fetchVariableInstances("old");
  await state.fetchVariableInstances("broken");
  assert.equal(state.instanceError.value, "实例失败");
  await state.fetchVariableInstances("new");
  assert.deepEqual(
    state.instances.value.map((item) => item.id),
    ["1", "2"],
  );
  finishOld({ code: 200, data: { records: [{ primaryKey: 99 }], total: 1 } });
  await old;
  assert.deepEqual(
    state.instances.value.map((item) => item.id),
    ["1", "2"],
  );
  assert.equal(state.instanceError.value, "");
});

/** @description 执行实际字段选择组件与查询控制器。 @param {object} initial 初始引用。 @returns {object} 组件状态。 */
function createFieldPickerHarness(initial) {
  const { state } = createPickerHarness(apis);
  const { descriptor } = parse(
    readFileSync(new URL("../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleVariablePicker.vue", import.meta.url), "utf8"),
  );
  const compiled = compileScript(descriptor, { id: "field-picker" });
  const { outputText } = transpileModule(compiled.content, { compilerOptions: { module: ModuleKind.CommonJS } });
  const exports = {};
  new Function("require", "exports", outputText)(
    (id) => (id === "vue" ? Vue : id === "vue-router" ? { useRoute: () => ({ params: { spaceId: "7" } }) } : { useRuleVariablePicker: () => state }),
    exports,
  );
  const props = Vue.reactive({ modelValue: true, initial });
  const emitted = [];
  const scope = Vue.effectScope();
  const page = scope.run(() => exports.default.setup(props, { expose() {}, emit: (...args) => emitted.push(args) }));
  return { props, page, emitted, scope, state };
}

test("field picker confirms without instance, preserves unchanged binding and clears changed field binding", async () => {
  const initial = {
    kind: "variable",
    objectId: "ship",
    objectName: "舰船",
    objectKind: "object",
    propertyId: "country",
    propertyName: "国家",
    instanceIds: ["12"],
    storageGroup: "main",
  };
  const h = createFieldPickerHarness(initial);
  await new Promise((resolve) => setImmediate(resolve));
  h.page.selectVariableProperty({ id: JSON.stringify(["ship", "country"]) });
  assert.equal(h.page.canConfirm.value, true);
  assert.deepEqual(h.page.selected.value.instanceIds, ["12"]);
  h.page.selectVariableProperty({ id: JSON.stringify(["ship", "payload"]) });
  assert.deepEqual(h.page.selected.value.instanceIds, []);
  assert.equal(h.page.canConfirm.value, true);
  h.page.confirmVariableSelection();
  assert.equal(h.emitted.find(([name]) => name === "confirm")[1].propertyId, "payload");
  assert.deepEqual(initial.instanceIds, ["12"]);
  h.scope.stop();
});

test("field picker cancel, search, invalid directory and error prevent incorrect writes", async () => {
  const h = createFieldPickerHarness(null);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(h.page.canConfirm.value, false);
  h.page.selectVariableProperty({ id: JSON.stringify(["ship", "country"]) });
  h.state.catalogError.value = "失败";
  assert.equal(h.page.canConfirm.value, false);
  h.page.confirmVariableSelection();
  h.page.keyword.value = "不存在";
  assert.deepEqual(h.page.variableTree.value, []);
  h.page.closeVariablePicker();
  assert.equal(
    h.emitted.some(([name]) => name === "confirm"),
    false,
  );
  h.scope.stop();
});

/** @description 执行共享条件实例行组件并注入真实查询控制器。 @param {object} value 条件引用。 @returns {object} 组件状态。 */
function createInstanceRowHarness(value) {
  const { state, cleanup } = createPickerHarness(apis);
  const { descriptor } = parse(
    readFileSync(new URL("../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleConditionInstanceRow.vue", import.meta.url), "utf8"),
  );
  const compiled = compileScript(descriptor, { id: "instance-row" });
  const { outputText } = transpileModule(compiled.content, { compilerOptions: { module: ModuleKind.CommonJS } });
  const exports = {};
  new Function("require", "exports", outputText)(
    (id) =>
      id === "vue"
        ? Vue
        : id === "vue-router"
          ? { useRoute: () => ({ params: { spaceId: "7" } }) }
          : { useRuleVariablePicker: () => state, needsRuleVariableDataRow },
    exports,
  );
  const props = Vue.reactive({ value, label: "条件1 左侧", readonly: false });
  const emitted = [];
  const scope = Vue.effectScope();
  const page = scope.run(() => exports.default.setup(props, { expose() {}, emit: (...args) => emitted.push(args) }));
  return { props, page, emitted, scope, state, cleanup };
}

test("instance row restores saved subtable selection, clears on instance change and validates current options", async () => {
  const h = createInstanceRowHarness({ objectId: "ship", instanceIds: ["12"], storageGroup: "payload", dataPrimaryKey: "row-1" });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(h.page.ready.value, true);
  assert.ok(h.page.selectedDataRowId.value);
  h.page.changeConditionInstance("12");
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(h.props.value.dataPrimaryKey, undefined);
  assert.equal(h.page.ready.value, false);
  h.page.changeConditionDataRow(h.state.dataRows.value[0].id);
  assert.equal(h.page.ready.value, true);
  assert.equal(h.props.value.dataPrimaryKey, "row-1");
  h.page.changeConditionDataRow("");
  assert.equal(h.page.ready.value, false);
  h.page.changeConditionInstance("missing");
  await Vue.nextTick();
  assert.equal(h.page.ready.value, false);
  assert.equal(h.props.value.dataPrimaryKey, undefined);
  h.cleanup.forEach((fn) => fn());
  h.scope.stop();
});

test("main field needs only instance; readonly renders persisted data without querying", async () => {
  const h = createInstanceRowHarness({ objectId: "ship", instanceIds: [], storageGroup: "main" });
  await new Promise((resolve) => setImmediate(resolve));
  h.page.changeConditionInstance("12");
  await Vue.nextTick();
  assert.equal(h.page.ready.value, true);
  assert.deepEqual(h.props.value.instanceNames, ["12"]);
  h.props.readonly = true;
  await Vue.nextTick();
  assert.equal(h.page.ready.value, true);
  assert.equal(h.state.instanceLoading.value, false);
  h.cleanup.forEach((fn) => fn());
  h.scope.stop();
});

test("instance error cards show readable fields and compact failure feedback without exposing internal identifiers", async () => {
  const { state } = createPickerHarness(apis);
  const serviceError = "服务依赖缺失或版本不一致，请确认部署包与服务脚本已更新到最新版本（请求号：request-123）";
  state.fetchVariableInstances = async () => {
    state.instanceError.value = serviceError;
  };
  const { descriptor } = parse(
    readFileSync(new URL("../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleConditionInstanceRow.vue", import.meta.url), "utf8"),
  );
  const compiled = compileScript(descriptor, { id: "instance-error-display", inlineTemplate: true });
  const { outputText } = transpileModule(compiled.content, { compilerOptions: { module: ModuleKind.CommonJS } });
  const exports = {};
  new Function("require", "exports", outputText)(
    (id) =>
      id === "vue"
        ? Vue
        : id === "vue-router"
          ? { useRoute: () => ({ params: { spaceId: "7" } }) }
          : { useRuleVariablePicker: () => state, needsRuleVariableDataRow },
    exports,
  );
  const app = Vue.createSSRApp(exports.default, {
    value: {
      objectId: "internal-object-id",
      propertyId: "internal-property-id",
      objectName: "飞机",
      propertyName: "武器名称",
      storageGroup: "weapon",
      instanceIds: [],
    },
    label: "并且 / 条件1 · 左侧",
  });
  app.component("el-alert", {
    props: ["title"],
    render() {
      return Vue.h("div", this.title);
    },
  });
  app.component("el-button", {
    setup(_props, { slots }) {
      return () => Vue.h("button", slots.default?.());
    },
  });
  app.component("el-select", { render: () => Vue.h("select") });
  app.component("el-popover", {
    props: ["content"],
    setup(_props, { slots }) {
      return () => Vue.h("span", slots.reference?.());
    },
  });
  app.config.warnHandler = () => {};
  const html = await renderToString(app);
  assert.match(html, /飞机 · 武器名称/);
  assert.doesNotMatch(html, /internal-object-id|internal-property-id|weapon|服务依赖缺失/);
  assert.match(html, /实例加载失败/);
  assert.match(html, /查看详情/);
  assert.match(html, /重新加载实例/);
});

test("condition wires connect direct parent ports and release observers and frames", async () => {
  const { descriptor } = parse(
    readFileSync(new URL("../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleConditionWireSurface.vue", import.meta.url), "utf8"),
  );
  const compiled = compileScript(descriptor, { id: "wire-test" });
  const { outputText } = transpileModule(compiled.content, { compilerOptions: { module: ModuleKind.CommonJS } });
  const exports = {};
  const mounted = [];
  const cleanup = [];
  const calls = [];
  let redraw;
  const browser = {
    cancelAnimationFrame: (id) => calls.push(["cancel", id]),
    requestAnimationFrame: (callback) => {
      redraw = callback;
      return 4;
    },
    addEventListener: () => calls.push(["listen"]),
    removeEventListener: () => calls.push(["unlisten"]),
  };
  class Observer {
    /** @description 记录观察启动。 */
    observe() {
      calls.push(["observe"]);
    }
    /** @description 记录观察清理。 */
    disconnect() {
      calls.push(["disconnect"]);
    }
  }
  new Function("require", "exports", "window", "ResizeObserver", outputText)(
    (id) => (id === "vue" ? { ...Vue, onMounted: (fn) => mounted.push(fn), onBeforeUnmount: (fn) => cleanup.push(fn) } : {}),
    exports,
    browser,
    Observer,
  );
  const scope = Vue.effectScope();
  const condition = { id: "root", type: "composite", children: [{ id: "leaf", type: "leaf" }] };
  const page = scope.run(() => exports.default.setup({ condition }, { expose() {} }));
  const nodes = ["root", "leaf"].map((id, index) => ({
    dataset: { ruleNodeId: id },
    querySelector: () => ({ getBoundingClientRect: () => ({ left: index * 100, top: index * 40, width: 10, height: 10 }) }),
  }));
  page.surfaceRef.value = {
    querySelectorAll: () => nodes,
    getBoundingClientRect: () => ({ left: 0, top: 0 }),
    scrollWidth: 200,
    clientWidth: 200,
    scrollHeight: 100,
    clientHeight: 100,
  };
  mounted.forEach((fn) => fn());
  redraw();
  await Vue.nextTick();
  assert.deepEqual(page.paths.value, ["M 5 5 C 55 5, 55 45, 105 45"]);
  cleanup.forEach((fn) => fn());
  assert.ok(calls.some(([name]) => name === "disconnect"));
  assert.ok(calls.some(([name]) => name === "unlisten"));
  assert.ok(calls.some(([name, id]) => name === "cancel" && id === 4));
  scope.stop();
});
