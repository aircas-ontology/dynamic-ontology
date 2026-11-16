import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as Vue from "vue";
import { compileScript, parse } from "@vue/compiler-sfc";
import { ModuleKind, transpileModule } from "typescript";
import { renderToString } from "@vue/server-renderer";
import { ElConfigProvider, useZIndex, ZINDEX_INJECTION_KEY } from "element-plus";
import {
  createDefaultScheduleRuleFlow,
  createSwitchStep,
  cloneRuleFlowValue,
  cloneScheduleRuleFlow,
} from "../src/views/SpaceBehaviorScheduleWorkspace/utils/scheduleRuleFlowFactory.ts";
import { filterBehaviorsByObjects } from "../src/views/SpaceBehaviorScheduleWorkspace/utils/filterRuleBehaviorsByObject.ts";
import { buildSavedActionEntityJson } from "../src/views/SpaceBehaviorScheduleWorkspace/utils/restoreRuleScheduleDetail.ts";

/** @description 隔离节点组件测试的参数控制器边界，参数真实行为另行集成验证。 @returns {object} 参数控制器替身。 */
function createRuleParameterStub() {
  return {
    parameterConfig: {},
    parameterBusy: Vue.ref(false),
    parameterError: Vue.ref(""),
    clearActionParameters() {},
    initializeActionParameters: async () => {},
    captureActionParameters: () => true,
  };
}

test("node dialog dropdown layers stay above both dialogs without changing outside menus", async () => {
  const { descriptor } = parse(
    readFileSync(new URL("../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleFlowDesigner.vue", import.meta.url), "utf8"),
  );
  const compiled = compileScript(descriptor, { id: "dropdown-layer-test", inlineTemplate: true });
  const { outputText } = transpileModule(compiled.content, { compilerOptions: { module: ModuleKind.CommonJS } });
  const exports = {};
  const layers = [];
  const empty = Vue.defineComponent({ render: () => null });
  new Function("require", "exports", outputText)((id) => {
    if (id === "vue") return Vue;
    if (id === "vue-router") return { useRoute: () => ({ params: { spaceId: "7" } }) };
    if (id.includes("useRuleActionParameters")) return { useRuleActionParameters: createRuleParameterStub };
    if (id.includes("filterRuleBehaviorsByObject")) return { filterBehaviorsByObjects };
    if (id.includes("restoreRuleScheduleDetail")) return { buildSavedActionEntityJson };
    if (id === "element-plus") return { ElConfigProvider, ElMessage: {}, ElMessageBox: {} };
    if (id.includes("scheduleRuleFlowFactory")) return { cloneRuleFlowValue };
    return { default: empty };
  }, exports);
  const probe = Vue.defineComponent({
    /** @description 分配真实 Element Plus 菜单层级。 @returns {Function} 空渲染。 */
    setup() {
      const { nextZIndex } = useZIndex();
      layers.push(nextZIndex(), nextZIndex());
      return () => null;
    },
  });
  const app = Vue.createSSRApp({
    render: () =>
      Vue.h(
        ElConfigProvider,
        { zIndex: 2000 },
        {
          default: () => [Vue.h(probe), Vue.h(exports.default, { modelValue: createDefaultScheduleRuleFlow(), behaviorOptions: [] }), Vue.h(probe)],
        },
      ),
  });
  app.provide(ZINDEX_INJECTION_KEY, { current: 0 });
  app.component("el-config-provider", ElConfigProvider);
  app.component("el-dialog", probe);
  app.config.warnHandler = () => {};
  await renderToString(app);
  assert.equal(layers.length, 6);
  assert.ok(layers[2] > 5200, `dropdown layer ${layers[2]} must exceed condition (5100) and variable (5200) dialogs`);
  assert.ok(layers[3] > layers[2]);
  assert.ok(layers[0] < 5100 && layers[4] < 5100, "outside menus retain their original layer base");
});

/** @description 执行真实值编辑组件，替换组件模型边界。 @param {object} initial 初始规则值。 @returns {object} 组件状态。 */
function createValueEditorHarness(initial = { kind: "input", text: "" }) {
  const { descriptor } = parse(
    readFileSync(new URL("../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleValueEditor.vue", import.meta.url), "utf8"),
  );
  const compiled = compileScript(descriptor, { id: "value-options-test" });
  const { outputText } = transpileModule(compiled.content, { compilerOptions: { module: ModuleKind.CommonJS } });
  const exports = {};
  const model = Vue.ref(initial);
  new Function("require", "exports", outputText)((id) => (id === "vue" ? { ...Vue, useModel: () => model } : {}), exports);
  return exports.default.setup({ label: "条件左值" }, { expose() {} });
}

test("rule values offer only input and variable and reject removed types", () => {
  const page = createValueEditorHarness({ kind: "input", text: "保留输入" });
  assert.deepEqual(
    page.valueKindOptions.map((item) => item.value),
    ["input", "variable"],
  );
  for (const kind of ["function", "expression", "invalid"]) page.changeValueKind(kind);
  assert.deepEqual(page.value.value, { kind: "input", text: "保留输入" });
  page.changeValueKind("variable");
  assert.equal(page.value.value.kind, "variable");
  const variable = {
    kind: "variable",
    objectId: "ship",
    objectName: "舰船",
    objectKind: "object",
    propertyId: "name",
    propertyName: "名称",
    instanceIds: ["2"],
  };
  page.applyVariableSelection(variable);
  assert.equal(page.variableSummary.value, "舰船.名称 · 1 个实例");
  page.changeValueKind("input");
  assert.deepEqual(page.value.value, { kind: "input", text: "" });
});

test("removed values remain untouched until an explicit supported selection", () => {
  for (const old of [
    { kind: "expression", terms: [] },
    { kind: "function", fn: "max", argKind: "collection", arg: { kind: "input", text: "42" } },
  ]) {
    const page = createValueEditorHarness(structuredClone(old));
    assert.equal(page.unsupportedValue.value, true);
    assert.deepEqual(page.value.value, old);
    page.changeValueKind("function");
    assert.deepEqual(page.value.value, old);
    page.changeValueKind("input");
    assert.equal(page.unsupportedValue.value, false);
    assert.deepEqual(page.value.value, { kind: "input", text: "" });
  }
});

/** @description 运行真实画布组件，通过会话边界触发双击并观察回写。 @returns {Promise<object>} 组件和会话记录。 */
async function createDesignerHarness(readonly = false) {
  const file = "../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleFlowDesigner.vue";
  const { descriptor } = parse(readFileSync(new URL(file, import.meta.url), "utf8"));
  const compiled = compileScript(descriptor, { id: "node-edit-test" });
  const { outputText } = transpileModule(compiled.content, { compilerOptions: { module: ModuleKind.CommonJS } });
  const mounted = [];
  const cleanup = [];
  const nodes = new Map();
  const updates = [];
  let callbacks;
  let savedJson;
  const branch = createDefaultScheduleRuleFlow().steps[0];
  nodes.set("condition", { kind: "condition", condition: branch.condition });
  nodes.set("unconnected-action", { kind: "action", action: branch.then[0].actions[0] });
  nodes.set("start", { kind: "start" });
  nodes.set("switch", { kind: "switch", switchStep: createSwitchStep() });
  class GraphSession {
    /** @description 捕获真实组件的画布事件回调。 @param {object} value 回调。 */
    constructor(value) {
      callbacks = value;
    }
    /** @description 测试不创建 DOM 图。 */
    mount(container, doc, readonlyMode) {
      updates.push({ readonlyMode });
    }
    /** @description 读取节点副本。 @param {string} id 标识。 @returns {object} 数据。 */
    getNodeData(id) {
      return structuredClone(nodes.get(id));
    }
    /** @description 返回测试中指定的上游对象。 @returns {string[]} 上游对象。 */
    getActionConditionObjectIds() {
      return objectIds;
    }
    /** @description 记录目标节点回写。 @param {string} id 标识。 @param {object} value 数据。 */
    updateNodeData(id, value) {
      updates.push({ id, value });
      nodes.set(id, value);
    }
    /** @description 测试忽略图形布局。 */
    adaptViewport() {}
    /** @description 记录实例销毁。 */
    dispose() {
      updates.push("disposed");
    }
  }
  const exports = {};
  let objectIds = [];
  new Function("require", "exports", outputText)((id) => {
    if (id === "vue") return { ...Vue, onMounted: (fn) => mounted.push(fn), onBeforeUnmount: (fn) => cleanup.push(fn) };
    if (id === "vue-router") return { useRoute: () => ({ params: { spaceId: "7" } }) };
    if (id.includes("useRuleActionParameters"))
      return {
        useRuleActionParameters: (...args) => {
          savedJson = args[4];
          return createRuleParameterStub();
        },
      };
    if (id.includes("restoreRuleScheduleDetail")) return { buildSavedActionEntityJson };
    if (id.includes("filterRuleBehaviorsByObject")) return { filterBehaviorsByObjects };
    if (id.includes("scheduleRuleFlowGraphSession")) return { ScheduleRuleFlowGraphSession: GraphSession };
    if (id.includes("scheduleRuleFlowFactory")) return { cloneRuleFlowValue };
    if (id === "element-plus") return { ElMessage: { warning() {} }, ElMessageBox: {} };
    return {};
  }, exports);
  const scope = Vue.effectScope();
  const props = {
    readonly,
    modelValue: createDefaultScheduleRuleFlow(),
    behaviorOptions: [
      { id: "b", displayName: "行为 B", actionApi: "b", ontologyUniqIdentifier: "o" },
      { id: "c", displayName: "行为 C", actionApi: "c", ontologyUniqIdentifier: "other" },
    ],
  };
  const page = scope.run(() => exports.default.setup(props, { expose() {}, emit() {} }));
  page.canvasRef.value = {};
  mounted.forEach((fn) => fn());
  await Vue.nextTick();
  const mountRecord = updates.shift();
  return {
    page,
    updates,
    nodes,
    callbacks,
    cleanup,
    scope,
    mountRecord,
    props,
    savedJson: () => savedJson(),
    setObjectIds: (ids) => {
      objectIds = ids;
    },
  };
}

test("read-only designer opens node details but never writes changes or handles delete", async () => {
  const h = await createDesignerHarness(true);
  assert.equal(h.mountRecord.readonlyMode, true);
  h.callbacks.onNodeDoubleClick("condition", "condition");
  assert.equal(h.page.nodeEditorVisible.value, true);
  h.page.confirmNodeEditor();
  h.page.onCanvasKeydown({
    key: "Delete",
    preventDefault() {
      throw new Error("should not handle delete");
    },
  });
  assert.equal(h.updates.length, 0);
  h.scope.stop();
});

test("double clicking condition clones data, cancel preserves original and confirm updates only its node", async () => {
  const h = await createDesignerHarness();
  h.callbacks.onNodeDoubleClick("condition", "condition");
  assert.equal(h.page.nodeEditorVisible.value, true);
  h.page.editingNode.value.condition.children[0].left.text = "left";
  assert.equal(h.nodes.get("condition").condition.children[0].left.text, "");
  h.page.nodeEditorVisible.value = false;
  assert.equal(h.updates.length, 0);
  h.callbacks.onNodeDoubleClick("condition", "condition");
  assert.equal(h.page.editingNode.value.condition.children[0].left.text, "");
  h.page.editingNode.value.condition.children[0].right.text = "42";
  h.page.confirmNodeEditor();
  assert.equal(h.updates[0].id, "condition");
  assert.equal(h.nodes.get("condition").condition.children[0].right.text, "42");
  assert.equal(h.page.nodeEditorVisible.value, false);
  h.scope.stop();
});

test("double clicking switch edits a copy, cancels unchanged, and confirms its case and default configuration", async () => {
  const h = await createDesignerHarness();
  h.callbacks.onNodeDoubleClick("switch", "switch");
  assert.equal(h.page.nodeEditorVisible.value, true);
  const original = structuredClone(h.nodes.get("switch"));
  h.page.editingNode.value.switchStep.cases[0].value.text = "取消的值";
  h.page.nodeEditorVisible.value = false;
  assert.deepEqual(h.nodes.get("switch"), original);
  h.callbacks.onNodeDoubleClick("switch", "switch");
  h.page.editingNode.value.switchStep.cases[0].value.text = "有效值";
  h.page.editingNode.value.switchStep.defaultSteps = null;
  h.page.confirmNodeEditor();
  assert.equal(h.updates[0].id, "switch");
  assert.equal(h.nodes.get("switch").switchStep.cases[0].value.text, "有效值");
  assert.equal(h.nodes.get("switch").switchStep.defaultSteps, null);
  h.scope.stop();
});

test("action selection filters upstream object union and never commits a mismatched choice", async () => {
  const h = await createDesignerHarness();
  h.setObjectIds(["o"]);
  h.callbacks.onNodeDoubleClick("unconnected-action", "action");
  assert.deepEqual(
    h.page.filteredBehaviorOptions.value.map((option) => option.id),
    ["b"],
  );
  h.page.changeNodeBehavior("c");
  assert.notEqual(h.page.editingNode.value.action.behaviorId, "c");
  h.page.changeNodeBehavior("b");
  h.page.confirmNodeEditor();
  assert.equal(h.nodes.get("unconnected-action").action.behaviorId, "b");
  h.setObjectIds(["o", "other"]);
  h.callbacks.onNodeDoubleClick("unconnected-action", "action");
  assert.deepEqual(
    h.page.filteredBehaviorOptions.value.map((option) => option.id),
    ["b", "c"],
  );
  h.scope.stop();
});

test("double clicking an unconnected action supports current-space selection and ignores start nodes", async () => {
  const h = await createDesignerHarness();
  h.callbacks.onNodeDoubleClick("start", "start");
  assert.equal(h.page.nodeEditorVisible.value, false);
  h.callbacks.onNodeDoubleClick("unconnected-action", "action");
  h.page.changeNodeBehavior("b");
  h.page.confirmNodeEditor();
  assert.equal(h.nodes.get("unconnected-action").action.behaviorName, "行为 B");
  assert.equal(h.nodes.get("unconnected-action").action.behaviorId, "b");
  h.cleanup.forEach((fn) => fn());
  assert.equal(h.updates.at(-1), "disposed");
  h.scope.stop();
});

test("node confirmation rejects removed condition and action values until explicitly replaced", async () => {
  const h = await createDesignerHarness();
  h.callbacks.onNodeDoubleClick("condition", "condition");
  const leaf = h.page.editingNode.value.condition.children[0];
  leaf.left = { kind: "function", fn: "max", argKind: "collection", arg: { kind: "input", text: "42" } };
  h.page.confirmNodeEditor();
  assert.equal(h.updates.length, 0);
  assert.equal(h.page.nodeEditorVisible.value, true);
  leaf.left = { kind: "input", text: "42" };
  h.page.confirmNodeEditor();
  assert.equal(h.updates.length, 1);
  h.callbacks.onNodeDoubleClick("unconnected-action", "action");
  h.page.changeNodeBehavior("b");
  h.page.editingNode.value.action.params = [{ paramName: "test", value: { kind: "expression", terms: [] } }];
  h.page.confirmNodeEditor();
  assert.equal(h.updates.length, 1);
  assert.equal(h.page.nodeEditorVisible.value, true);
  h.page.editingNode.value.action.params[0].value = { kind: "input", text: "" };
  h.page.confirmNodeEditor();
  assert.equal(h.updates.length, 2);
  h.scope.stop();
});

test("editable action restores matching saved request and skips it after switching behavior or capturing a snapshot", async () => {
  const h = await createDesignerHarness();
  const action = h.nodes.get("unconnected-action").action;
  action.behaviorId = "b";
  h.props.actionDetails = { [action.id]: { actionApi: "b", entityJson: '{"params":{"name":"original"}}', ontologyIdentifier: "o", entityId: "" } };
  h.callbacks.onNodeDoubleClick("unconnected-action", "action");
  assert.match(h.savedJson(), /original/);
  h.page.changeNodeBehavior("c");
  assert.equal(h.savedJson(), "");
  h.page.changeNodeBehavior("b");
  h.page.editingNode.value.action.behaviorParameters = { values: { name: "changed" } };
  assert.equal(h.savedJson(), "");
  h.scope.stop();
});

test("editable rule dialog passes the saved flow and action request mapping into the real designer boundary", async () => {
  const source = readFileSync(new URL("../src/views/SpaceBehaviorScheduleWorkspace/BehaviorScheduleRuleConfigDialog.vue", import.meta.url), "utf8");
  const { descriptor } = parse(source);
  const compiled = compileScript(descriptor, { id: "edit-rule-dialog", inlineTemplate: true });
  const { outputText } = transpileModule(compiled.content, { compilerOptions: { module: ModuleKind.CommonJS } });
  const exports = {};
  const captured = [];
  const designer = Vue.defineComponent({
    props: ["modelValue", "behaviorOptions", "actionDetails"],
    /** @description 捕获编辑画布接收的结构与请求映射。 @param {object} props 输入。 @returns {Function} 空渲染。 */
    setup(props) {
      captured.push(props);
      return () => null;
    },
  });
  new Function("require", "exports", outputText)((id) => {
    if (id === "vue") return Vue;
    if (id.includes("scheduleRuleFlowFactory")) return { cloneScheduleRuleFlow, createDefaultScheduleRuleFlow };
    if (id.includes("ScheduleRuleFlowDesigner")) return { __esModule: true, default: designer };
    return {};
  }, exports);
  const flow = createDefaultScheduleRuleFlow();
  const actionDetails = { a: { actionApi: "b", entityJson: '{"params":{"name":"saved"}}', ontologyIdentifier: "o", entityId: "" } };
  const app = Vue.createSSRApp({
    render: () =>
      Vue.h(exports.default, {
        modelValue: true,
        initialFlow: flow,
        readonly: false,
        behaviorOptions: [],
        detailGroups: [{ flow, actionDetails }],
      }),
  });
  app.component("el-dialog", {
    setup(_props, { slots }) {
      return () => Vue.h("div", slots.default?.());
    },
  });
  app.config.warnHandler = () => {};
  await renderToString(app);
  assert.equal(captured.length, 1);
  assert.deepEqual(captured[0].modelValue, flow);
  assert.notEqual(captured[0].modelValue, flow);
  assert.deepEqual(captured[0].actionDetails, actionDetails);
});

test("detail and edit summary boundaries use matching saved actions and reject a switched behavior", async () => {
  for (const readonly of [false, true]) {
    const h = await createDesignerHarness(readonly);
    const action = h.nodes.get("unconnected-action").action;
    action.behaviorId = "b";
    const detail = { actionApi: "b", entityJson: '{"outputParams":{"result":{}}}' };
    h.props.actionDetails = { [action.id]: detail };
    assert.equal(h.callbacks.getSavedAction(action), detail);
    assert.equal(h.callbacks.getSavedAction({ ...action, behaviorId: "c" }), undefined);
    h.cleanup.forEach((fn) => fn());
    h.scope.stop();
  }
});
