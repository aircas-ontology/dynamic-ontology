import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";
import * as Vue from "vue";
import { compileScript, parse } from "@vue/compiler-sfc";
import { ModuleKind, transpileModule } from "typescript";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) specifier = new URL("../src/" + specifier.slice(2) + (specifier.endsWith(".ts") ? "" : ".ts"), import.meta.url).href;
    if (specifier.startsWith(".") && !/\.[a-z]+$/i.test(specifier)) {
      const candidate = new URL(specifier + ".ts", context.parentURL);
      if (existsSync(candidate)) specifier = candidate.href;
    }
    return nextResolve(specifier, context);
  },
});
const { useBehaviorParameters } = await import("../src/composables/behavior/useBehaviorParameters.ts");
const initialEntityUtils = await import("../src/utils/behaviorParameters/createBehaviorTestInitialEntity.ts");
const dataUtils = await import("../src/utils/behaviorParameters/mapOntologyEntityRowDetailToDataRows.ts");
const detailUtils = await import("../src/utils/behaviorParameters/mapOntologyActionInfoToViewState.ts");
const selectionUtils = await import("../src/utils/behaviorParameters/resolveAttributeValueSelection.ts");
const behaviorLabels = await import("../src/types/pages/ontologySpaceBehaviorType.ts");
const mapper = await import("../src/utils/behaviorParameters/mapListOntologyActionRecord.ts");

/** @description 编译真实组件脚本并替换 HTTP 边界。 @param {string} path 组件相对路径。 @param {Function} resolve 依赖解析器。 @returns {object} 组件。 */
function compileExecutionComponent(path, resolve) {
  const { descriptor } = parse(readFileSync(new URL("../src/" + path, import.meta.url), "utf8"));
  const { outputText } = transpileModule(compileScript(descriptor, { id: "execution-test" }).content, { compilerOptions: { module: ModuleKind.CommonJS } });
  const exports = {};
  new Function("require", "exports", outputText)(resolve, exports);
  return exports.default;
}

/** @description 创建使用真实参数控制器的弹窗上下文。 @param {object} options 行为、实例及接口覆盖。 @returns {object} 弹窗状态与请求记录。 */
function createExecutionHarness(options = {}) {
  const calls = [],
    messages = [];
  const primaryKey = options.primaryKey ?? "001";
  const initialEntity = initialEntityUtils.createBehaviorTestInitialEntity("ship", primaryKey, "当前实例");
  const apis = {
    getOntologyEntitiesInterface: async () => ({ code: 200, data: { records: [{ entityPrimaryKey: 999, displayName: "其他实例" }], total: 30 } }),
    getOntologyActionInfoInterface: async () => ({
      code: 200,
      data: { actionApi: "action", ontologyUniqIdentifier: "ship", storageGroup: "main", mappingIns: [], mappingOuts: [] },
    }),
    getOntologyLinkByUniqueIdentifierInterface: async () => ({ code: 200, data: { ontologyUniqueIdentifierFrom: "ship", ontologyUniqueIdentifierTo: "port" } }),
    postGetOntologyEntityRowDetailPageInterface: async () => ({ code: 200, data: { records: [], total: 0 } }),
    postOntologyEntityAllLinkInterface: async () => ({ code: 200, data: [] }),
    postTestOntologyActionInterface: async (params) => {
      calls.push(JSON.parse(JSON.stringify(params)));
      return { code: 200, data: {} };
    },
    ...options.apis,
  };
  const component = compileExecutionComponent("components/BehaviorTestDialog/BehaviorTestDialog.vue", (id) => {
    if (id === "vue") return Vue;
    if (id === "@/types") return behaviorLabels;
    if (id === "element-plus")
      return { ElMessage: Object.fromEntries(["info", "warning", "error", "success"].map((kind) => [kind, (message) => messages.push([kind, message])])) };
    if (id.includes("useBehaviorParameters")) return { useBehaviorParameters };
    if (id.includes("createBehaviorTestInitialEntity")) return initialEntityUtils;
    if (id.includes("mapOntologyEntityRowDetailToDataRows")) return dataUtils;
    if (id.includes("mapOntologyActionInfoToViewState")) return detailUtils;
    if (id.includes("resolveAttributeValueSelection")) return selectionUtils;
    return { __esModule: true, default: {} };
  });
  const props = Vue.reactive({
    modelValue: false,
    spaceId: "23",
    initialEntity,
    apis,
    behavior: {
      id: "1",
      kind: "basic",
      valueType: "basicFunctionOperator",
      basicAction: "create",
      behaviorApiName: "action",
      ontologyUniqIdentifier: "ship",
      ...options.behavior,
    },
  });
  const scope = Vue.effectScope();
  const state = scope.run(() => component.setup(props, { expose() {}, emit() {} }));
  return { props, scope, state, calls, messages };
}

/** @description 等待测试弹窗初始化和响应式队列。 @returns {Promise<void>} 等待完成。 */
async function settleExecution() {
  for (let index = 0; index < 16; index += 1) await Vue.nextTick();
}

test("initial instance rows preserve zero, false, strings and composite primary keys without duplicate options", () => {
  for (const key of [0, false, "001", { id: 0, code: "001" }]) {
    const row = initialEntityUtils.createBehaviorTestInitialEntity("ship", key, "当前实例");
    assert.deepEqual(row.savedPrimaryKey, key);
    assert.deepEqual(initialEntityUtils.mergeBehaviorTestEntityRows([{ ...row, rowKey: "server" }], row), [row]);
  }
});

test("basic operator execution preselects an off-page instance and sends its original key after pagination", async () => {
  for (const key of [0, false, "001", { id: 0 }]) {
    const h = createExecutionHarness({ primaryKey: key });
    try {
      h.props.modelValue = true;
      await settleExecution();
      assert.deepEqual(h.state.selectedEntityPrimaryKey.value, key);
      assert.equal(h.calls.length, 0);
      h.state.changeEntityPage(2);
      await settleExecution();
      assert.deepEqual(h.state.selectedEntityPrimaryKey.value, key);
      await h.state.submitBehaviorTest();
      assert.deepEqual(h.calls[0], { ontologySpaceId: "23", actionApi: "action", entityPrimaryKey: key });
    } finally {
      h.scope.stop();
    }
  }
});

test("application execution binds current instance into matching input and output payloads", async () => {
  const h = createExecutionHarness({
    primaryKey: 0,
    behavior: { kind: "application" },
    apis: {
      getOntologyActionInfoInterface: async () => ({
        code: 200,
        data: {
          actionApi: "action",
          ontologyUniqIdentifier: "ship",
          mappingIns: [
            { parameterName: "input", category: "INPUT", sourceType: "PROPERTY", ontologyUniqueIdentifier: "ship", storageGroup: "main" },
            { parameterName: "output", category: "OUTPUT", outputMode: "WRITE_PROPERTY", ontologyUniqueIdentifier: "ship", storageGroup: "main" },
          ],
        },
      }),
    },
  });
  try {
    h.props.modelValue = true;
    await settleExecution();
    assert.equal(h.calls.length, 0);
    await h.state.submitBehaviorTest();
    assert.equal(h.calls.length, 1);
    assert.equal(h.calls[0].inputParams.input[0].entityPrimaryKey, 0);
    assert.equal(h.calls[0].outputParams.output.entityPrimaryKey, 0);
  } finally {
    h.scope.stop();
  }
});

test("relationship execution seeds only matching mount side and preserves composite keys", async () => {
  const h = createExecutionHarness({
    primaryKey: { id: 0 },
    behavior: { valueType: "relationInstance" },
    apis: { getOntologyActionInfoInterface: async () => ({ code: 200, data: { actionApi: "action", linkMapping: { ontologyLinkUniqIdentifier: "link" } } }) },
  });
  try {
    h.props.modelValue = true;
    await settleExecution();
    assert.equal(h.state.selectedFromEntityRows.value.length, 1);
    assert.equal(h.state.selectedToEntityRows.value.length, 0);
    await h.state.submitBehaviorTest();
    assert.equal(h.calls.length, 0);
    h.state.parameterConfig.toggleToEntityRow(h.state.parameterConfig.toEntityRows.value[0]);
    await h.state.submitBehaviorTest();
    assert.deepEqual(h.calls[0].entityPrimaryKey, { id: 0 });
    assert.equal(h.calls[0].linkEntityPrimaryKey, 999);
  } finally {
    h.scope.stop();
  }
});

test("closed or disposed application initialization cannot preselect a stale instance", async () => {
  let resolveDetail;
  const h = createExecutionHarness({
    behavior: { kind: "application" },
    apis: {
      getOntologyActionInfoInterface: () =>
        new Promise((resolve) => {
          resolveDetail = resolve;
        }),
    },
  });
  h.props.modelValue = true;
  await settleExecution();
  h.props.modelValue = false;
  await settleExecution();
  resolveDetail({ code: 200, data: { actionApi: "old", mappingIns: [] } });
  await settleExecution();
  assert.equal(h.state.parameterConfig.resolvedActionApi.value, "");
  assert.equal(h.calls.length, 0);
  h.props.modelValue = true;
  await settleExecution();
  h.scope.stop();
  resolveDetail({ code: 200, data: { actionApi: "disposed", mappingIns: [] } });
  await settleExecution();
  assert.equal(h.state.parameterConfig.resolvedActionApi.value, "");
});

test("entity detail routes card execution to normal or tree dialog with current instance", async () => {
  const state = Object.fromEntries(["categories", "filteredProperties", "behaviors"].map((key) => [key, Vue.ref([])]));
  const component = compileExecutionComponent("views/EntityBrowsingObjectProfile/components/ObjectProfileEntityDetail.vue", (id) => {
    if (id === "vue") return Vue;
    if (id.includes("useObjectProfileEntityDetail")) return { useObjectProfileEntityDetail: () => state };
    if (id.includes("useEntityRelationCategories"))
      return { useEntityRelationCategories: () => ({ items: Vue.ref(undefined), status: Vue.ref("empty"), error: Vue.ref("") }) };
    if (id.includes("useEntityBehaviorCategories"))
      return { useEntityBehaviorCategories: () => ({ items: Vue.ref([]), status: Vue.ref("empty"), error: Vue.ref("") }) };
    if (id.includes("mapListOntologyActionRecord")) return mapper;
    if (id.includes("createBehaviorTestInitialEntity")) return initialEntityUtils;
    if (id.includes("entityDetailData")) return { parseEntityPrimaryKey: (key) => key };
    if (id === "element-plus") return { ElMessage: { error() {} } };
    return {};
  });
  const props = Vue.reactive({ objectId: "ship", instanceId: "0", entityPrimaryKey: 0, spaceId: "23", entityName: "当前实例", listProperties: [] });
  const scope = Vue.effectScope();
  try {
    const page = scope.run(() => component.setup(props, { expose() {}, emit() {} }));
    const record = { id: 1, categoryId: 1, displayName: "action", actionApi: "action", actionKind: "BASE", subjectType: "BASIC_OPERATOR", status: 1 };
    page.openEntityBehaviorTest(record);
    assert.equal(page.behaviorTestVisible.value, true);
    assert.equal(page.behaviorTreeTestVisible.value, false);
    assert.equal(page.initialBehaviorEntity.value.savedPrimaryKey, 0);
    page.openEntityBehaviorTest({ ...record, actionKind: "TREE" });
    assert.equal(page.behaviorTestVisible.value, false);
    assert.equal(page.behaviorTreeTestVisible.value, true);
    props.instanceId = "001";
    props.entityPrimaryKey = "001";
    await settleExecution();
    assert.equal(page.behaviorTreeTestVisible.value, false);
    assert.equal(page.activeBehavior.value, null);
  } finally {
    scope.stop();
  }
});

test("tree execution prefills only matching blackboard, node input, relationship and output instances", () => {
  const calls = [];
  const execution = {
    cancelBehaviorTreeExecutionRequests() {},
    clearBehaviorTreeExecLogs() {},
    loadBehaviorTreeExecutePlan: async () => {},
    blackboardObjectKeys: {},
    instanceOptions: {},
    propertyBlackboardGroups: Vue.ref([{ objectId: "ship" }, { objectId: "port" }]),
    execNodeBlocks: Vue.ref([
      {
        nodeId: "a",
        objects: ["ship"],
        ends: null,
        params: [
          { key: "input", sourceType: "PROPERTY", objectIdentifier: "ship" },
          { key: "other", sourceType: "PROPERTY", objectIdentifier: "port" },
        ],
        outputs: [{ key: "result", objectIdentifier: "ship", mode: "OUTPUT_PARAM" }],
      },
      { nodeId: "b", objects: [], ends: { from: "ship", to: "port" }, params: [], outputs: [] },
    ]),
    updateNodeEntityKeyDraft: (...args) => calls.push(["entity", ...args]),
    updateNodeInputParamDraft: (...args) => calls.push(["input", ...args]),
    updateNodeOutputDraft: (...args) => calls.push(["output", ...args]),
    resolveBehaviorTreeOutputDraftKey: (item) => item.key,
  };
  const component = compileExecutionComponent("components/BehaviorTreeTestDialog.vue", (id) => {
    if (id === "vue") return Vue;
    if (id.includes("useBehaviorTreeExecution")) return { useBehaviorTreeExecution: () => execution };
    return { __esModule: true, default: {} };
  });
  const props = Vue.reactive({
    modelValue: false,
    spaceId: "23",
    behavior: { id: "tree", behaviorApiName: "tree" },
    initialEntity: initialEntityUtils.createBehaviorTestInitialEntity("ship", "001", "当前实例"),
  });
  const scope = Vue.effectScope();
  try {
    const state = scope.run(() => component.setup(props, { expose() {}, emit() {} }));
    state.prefillBehaviorTreeEntity();
    assert.deepEqual(execution.blackboardObjectKeys, { ship: "001" });
    assert.equal(execution.instanceOptions.ship[0].value, "001");
    assert.deepEqual(calls, [
      ["entity", "a", "ship", "001"],
      ["input", "a", "input", "entityPrimaryKey", "001"],
      ["output", "a", "result", "entityPrimaryKey", "001"],
      ["entity", "b", "from", "001"],
    ]);
    assert.equal(execution.instanceOptions.port, undefined);
  } finally {
    scope.stop();
  }
});

test("attribute deletion preselects current instance and requires an explicit data-row selection", async () => {
  const rowQueries = [];
  const h = createExecutionHarness({
    primaryKey: false,
    behavior: { valueType: "attributeValue", basicAction: "delete" },
    apis: {
      postGetOntologyEntityRowDetailPageInterface: async (query) => {
        rowQueries.push(query);
        return { code: 200, data: { records: [{ dataPrimaryKey: 0, props: [] }], total: 1 } };
      },
    },
  });
  try {
    h.props.modelValue = true;
    await settleExecution();
    assert.equal(rowQueries.length, 1);
    assert.equal(rowQueries[0].entityPrimaryKey, false);
    await h.state.submitBehaviorTest();
    assert.equal(h.calls.length, 0);
    h.state.selectGroupDataRow(h.state.groupDataRows.value[0]);
    await h.state.submitBehaviorTest();
    assert.equal(h.calls[0].entityPrimaryKey, false);
    assert.equal(h.calls[0].dataPrimaryKey, 0);
  } finally {
    h.scope.stop();
  }
});

test("non-main application parameters preselect the instance but require selecting a row and adding its binding", async () => {
  const h = createExecutionHarness({
    primaryKey: { id: 0 },
    behavior: { kind: "application" },
    apis: {
      getOntologyActionInfoInterface: async () => ({
        code: 200,
        data: {
          actionApi: "action",
          mappingIns: [{ parameterName: "events", category: "INPUT", sourceType: "PROPERTY", ontologyUniqueIdentifier: "ship", storageGroup: "events" }],
        },
      }),
      postGetOntologyEntityRowDetailPageInterface: async () => ({ code: 200, data: { records: [{ dataPrimaryKey: 0, props: [] }], total: 1 } }),
    },
  });
  try {
    h.props.modelValue = true;
    await settleExecution();
    const config = h.state.parameterConfig;
    const picker = config.applicationStorageGroupPickers.value[0];
    const slot = picker.entitySlots[0];
    assert.deepEqual(slot.entityPrimaryKey, { id: 0 });
    assert.equal(config.listApplicationInputBindingRecords("events").length, 0);
    await h.state.submitBehaviorTest();
    assert.equal(h.calls.length, 0);
    config.updateApplicationStorageGroupRowSelection(picker.pickerKey, slot.entityRowKey, slot.rows[0].rowKey);
    config.addApplicationInputBindingRecords("events");
    await h.state.submitBehaviorTest();
    assert.deepEqual(h.calls[0].inputParams.events[0], { entityPrimaryKey: { id: 0 }, dataPrimaryKeys: { events: 0 } });
  } finally {
    h.scope.stop();
  }
});

test("execution errors remain visible, pending commands coalesce and reopening clears old instance selection", async () => {
  let finish;
  let count = 0;
  const h = createExecutionHarness({
    apis: {
      postTestOntologyActionInterface: () => {
        count += 1;
        return new Promise((resolve) => {
          finish = resolve;
        });
      },
    },
  });
  try {
    h.props.modelValue = true;
    await settleExecution();
    const first = h.state.submitBehaviorTest();
    await h.state.submitBehaviorTest();
    assert.equal(count, 1);
    finish({ code: 500, message: "测试失败" });
    await first;
    assert.equal(h.state.submitError.value, "测试失败");
    h.props.modelValue = false;
    await settleExecution();
    h.props.initialEntity = initialEntityUtils.createBehaviorTestInitialEntity("ship", 2, "新实例");
    h.props.modelValue = true;
    await settleExecution();
    assert.equal(h.state.selectedEntityPrimaryKey.value, 2);
    assert.equal(h.state.submitError.value, "");
  } finally {
    h.scope.stop();
  }
});

test("clicking the rendered card or detail button emits the selected behavior record", () => {
  const { descriptor } = parse(
    readFileSync(new URL("../src/views/EntityBrowsingObjectProfile/components/ObjectProfileEntityBehaviors.vue", import.meta.url), "utf8"),
  );
  const { outputText } = transpileModule(compileScript(descriptor, { id: "card-click", inlineTemplate: true }).content, {
    compilerOptions: { module: ModuleKind.CommonJS },
  });
  const exports = {};
  new Function("require", "exports", outputText)(
    (id) => (id === "vue" ? Vue : { __esModule: true, default: {}, Operation: Vue.defineComponent({ render: () => null }) }),
    exports,
  );
  const renderer = Vue.createRenderer({
    createElement: (type) => ({ type, props: {}, children: [] }),
    createText: (text) => ({ type: "text", text }),
    createComment: (text) => ({ type: "comment", text }),
    setText: (node, text) => {
      node.text = text;
    },
    setElementText: (node, text) => {
      node.text = text;
      node.children = [];
    },
    parentNode: (node) => node.parent,
    nextSibling: () => null,
    patchProp: (node, key, previous, value) => {
      node.props[key] = value;
    },
    insert: (node, parent) => {
      parent.children.push(node);
      node.parent = parent;
    },
    remove: (node) => {
      node.parent.children = node.parent.children.filter((child) => child !== node);
    },
  });
  const record = { id: 7, displayName: "执行示例", actionApi: "action", actionKind: "BASE" };
  const events = [];
  const app = renderer.createApp(exports.default, {
    items: [record],
    status: "ready",
    error: "",
    page: 1,
    pageSize: 8,
    total: 1,
    onExecute: (item) => events.push(item),
  });
  const slot = Vue.defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        Vue.h("span", slots.default?.()),
  });
  const button = Vue.defineComponent({
    emits: ["click"],
    setup:
      (_, { slots, emit }) =>
      () =>
        Vue.h(
          "button",
          {
            onClick: (event) => emit("click", event),
          },
          slots.default?.(),
        ),
  });
  for (const name of ["el-icon", "el-tag", "el-empty", "el-pagination"]) app.component(name, slot);
  app.component("el-button", button);
  const root = { type: "root", children: [] };
  app.mount(root);
  try {
    const nodes = [...root.children];
    let detailButton;
    let card;
    while (nodes.length) {
      const node = nodes.shift();
      if (node.type === "button") detailButton = node;
      if (node.type === "article") card = node;
      nodes.push(...(node.children ?? []));
    }
    const clickEvent = { stopPropagation() {}, preventDefault() {} };
    assert.ok(detailButton);
    detailButton.props.onClick(clickEvent);
    assert.deepEqual(events, [record]);
    events.length = 0;
    assert.ok(card?.props?.onClick);
    card.props.onClick(clickEvent);
    assert.deepEqual(events, [record]);
  } finally {
    app.unmount();
  }
});

/** @description 创建真实行为树执行控制器并仅替换接口边界。 @param {object} apis 接口替身。 @returns {Promise<object>} 控制器及作用域。 */
async function createTreeControllerHarness(apis) {
  const treePlanUtils = await import("../src/utils/behaviorTreeExecutePlan.ts");
  const treeBlackboardUtils = await import("../src/utils/behaviorTreeBlackboard.ts");
  const source = readFileSync(new URL("../src/composables/behaviorTree/useBehaviorTreeExecution.ts", import.meta.url), "utf8");
  const { outputText } = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS } });
  const exports = {};
  new Function("require", "exports", outputText)((id) => {
    if (id === "vue") return Vue;
    if (id === "element-plus") return { ElMessage: { error() {}, warning() {}, success() {} } };
    if (id === "@/apis") return apis;
    if (id.includes("behaviorTreeExecutePlan")) return treePlanUtils;
    if (id.includes("behaviorTreeBlackboard")) return treeBlackboardUtils;
    throw new Error(id);
  }, exports);
  const scope = Vue.effectScope();
  const state = scope.run(() =>
    exports.useBehaviorTreeExecution({
      spaceId: Vue.ref("23"),
      treeApi: Vue.ref("tree"),
      model: { blackboard: [], roots: [] },
      objectOptions: Vue.ref([]),
      objectProperties: Vue.ref({}),
    }),
  );
  return { scope, state };
}

test("tree cancellation and disposal discard late plan responses", async () => {
  for (const dispose of [false, true]) {
    let resolvePlan;
    const h = await createTreeControllerHarness({
      getOntologyActionInfoInterface: () =>
        new Promise((resolve) => {
          resolvePlan = resolve;
        }),
    });
    const pending = h.state.loadBehaviorTreeExecutePlan(true);
    if (dispose) h.scope.stop();
    else h.state.cancelBehaviorTreeExecutionRequests();
    resolvePlan({ code: 200, data: { actionKind: "TREE", executeInputs: { nodes: [] } } });
    await pending;
    assert.equal(h.state.execPlan.value, null);
    assert.equal(h.state.planStatus.value, "idle");
    h.scope.stop();
  }
});

test("tree cancellation prevents stale instance options and preserves a newer request loading state", async () => {
  const requests = [];
  const h = await createTreeControllerHarness({
    getOntologyEntitiesInterface: () => new Promise((resolve) => requests.push(resolve)),
  });
  try {
    const oldRequest = h.state.loadBehaviorTreeEntityOptions("ship");
    h.state.cancelBehaviorTreeExecutionRequests();
    const newRequest = h.state.loadBehaviorTreeEntityOptions("ship");
    requests[0]({ code: 200, data: { records: [{ entityPrimaryKey: "old" }] } });
    await oldRequest;
    assert.equal(h.state.instanceOptions.ship, undefined);
    assert.equal(h.state.instanceLoadingIds.ship, true);
    requests[1]({ code: 200, data: { records: [{ entityPrimaryKey: "new", displayName: "新实例" }] } });
    await newRequest;
    assert.equal(h.state.instanceOptions.ship[0].value, "new");
    assert.equal(h.state.instanceLoadingIds.ship, undefined);
    const disposedRequest = h.state.loadBehaviorTreeEntityOptions("port");
    h.scope.stop();
    requests[2]({ code: 200, data: { records: [{ entityPrimaryKey: "late" }] } });
    await disposedRequest;
    assert.equal(h.state.instanceOptions.port, undefined);
  } finally {
    h.scope.stop();
  }
});
