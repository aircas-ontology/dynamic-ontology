import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";
import * as Vue from "vue";
import { compileScript, parse } from "@vue/compiler-sfc";
import { ModuleKind, transpileModule } from "typescript";
import { createSwitchStep, createDefaultSwitchCase } from "../src/views/SpaceBehaviorScheduleWorkspace/utils/scheduleRuleFlowFactory.ts";

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
const { buildRuleFlowRegion, fillRuleFlowRenderBuffer, serializeRuleFlowGraph } =
  await import("../src/views/SpaceBehaviorScheduleWorkspace/utils/scheduleRuleFlowGraphSerialize.ts");

test("switch case editor adds and deletes cases with at least one, and toggles empty default without phantom nodes", () => {
  const { descriptor } = parse(
    readFileSync(new URL("../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleSwitchConfig.vue", import.meta.url), "utf8"),
  );
  const compiled = compileScript(descriptor, { id: "switch-editor" });
  const { outputText } = transpileModule(compiled.content, { compilerOptions: { module: ModuleKind.CommonJS } });
  const exports = {};
  new Function("require", "exports", outputText)(
    (id) => (id === "vue" ? Vue : id.includes("scheduleRuleFlowFactory") ? { createDefaultSwitchCase } : {}),
    exports,
  );
  const step = createSwitchStep();
  const page = exports.default.setup({ step }, { expose() {} });
  const originalId = step.cases[1].id;
  page.addSwitchCase();
  assert.equal(step.cases.length, 3);
  assert.deepEqual(step.cases[2].steps, []);
  page.removeSwitchCase(0);
  assert.equal(step.cases[0].id, originalId);
  page.removeSwitchCase(0);
  page.removeSwitchCase(0);
  assert.equal(step.cases.length, 1);
  page.changeSwitchDefault(false);
  assert.equal(step.defaultSteps, null);
  page.changeSwitchDefault(true);
  assert.deepEqual(step.defaultSteps, []);
});

test("switch port updates preserve surviving edge identities, remove only deleted routes and update labels", async () => {
  const source = readFileSync(new URL("../src/views/SpaceBehaviorScheduleWorkspace/utils/updateScheduleRuleSwitchNode.ts", import.meta.url), "utf8");
  const { outputText } = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS } });
  const exports = {};
  const template = {
    isNode: () => true,
    getMarkup: () => ["new-markup"],
    getAttrs: () => ({ summary: "new" }),
    getSize: () => ({ width: 220, height: 200 }),
    getPorts: () => [{ id: "in" }, { id: "case_0" }, { id: "case_1" }],
  };
  const cells = {
    PORT_SWITCH_CASE_PREFIX: "case_",
    PORT_SWITCH_DEFAULT: "default",
    addSwitchNode: (ctx) => ctx.renderBuffer.push(template),
    createEdgeLabelConfig: (text) => [text],
    switchCasePortDisplay: (step, port) => step.cases[Number(port.slice(5))]?.label || port,
  };
  new Function("require", "exports", outputText)((id) => (id.includes("scheduleRuleFlowGraphCells") ? cells : {}), exports);
  const previous = createSwitchStep();
  previous.cases.push(createDefaultSwitchCase("case 3"));
  const updated = structuredClone(previous);
  updated.cases.splice(1, 1);
  updated.defaultSteps = null;
  const routes = ["case_0", "case_1", "case_2", "default"].map((port) => ({
    port,
    removed: false,
    getSourcePortId() {
      return this.port;
    },
    setSource(value) {
      this.port = value.port;
    },
    setLabels(value) {
      this.labels = value;
    },
  }));
  const node = {
    id: "switch",
    position: () => ({ x: 10, y: 20 }),
    setData(value, options) {
      this.data = value;
      this.dataOptions = options;
    },
    setMarkup(value) {
      this.markup = value;
    },
    setAttrs(value) {
      this.attrs = value;
    },
    setSize(value) {
      this.size = value;
    },
    setPropByPath(name, value) {
      this[name] = value;
    },
  };
  const graph = {
    getOutgoingEdges: () => routes,
    removeEdge: (edge) => {
      edge.removed = true;
    },
  };
  exports.updateScheduleRuleSwitchNode(graph, node, previous, updated);
  assert.equal(routes[0].port, "case_0");
  assert.equal(routes[0].removed, false);
  assert.equal(routes[1].removed, true);
  assert.equal(routes[2].removed, false);
  assert.equal(routes[2].port, "case_1");
  assert.deepEqual(routes[2].labels, [updated.cases[1].label]);
  assert.equal(routes[3].removed, true);
  assert.equal(node.data.switchStep, updated);
  assert.deepEqual(node.dataOptions, { overwrite: true });
  assert.deepEqual(node["ports/items"], template.getPorts());
});

test("unconnected enabled default persists through real graph serialization", () => {
  const step = createSwitchStep(undefined, undefined, []);
  const node = { isNode: () => true, getData: () => ({ kind: "switch", switchStep: step }) };
  const graph = { getCellById: () => node, getOutgoingEdges: () => [] };
  const [saved] = buildRuleFlowRegion(graph, step.id, "end");
  assert.deepEqual(saved.defaultSteps, []);
  assert.equal(saved.cases.length, 2);
  step.defaultSteps = null;
  assert.equal(buildRuleFlowRegion(graph, step.id, "end")[0].defaultSteps, null);
});

const { buildRuleScheduleCreateParams } = await import("../src/views/SpaceBehaviorScheduleWorkspace/utils/buildRuleScheduleCreateParams.ts");
const { restoreRuleFlowDocument } = await import("../src/views/SpaceBehaviorScheduleWorkspace/utils/restoreRuleFlowDocument.ts");
const { START_NODE_ID, END_NODE_ID, PORT_OUT } = await import("../src/views/SpaceBehaviorScheduleWorkspace/utils/scheduleRuleFlowGraphCells.ts");

/** @description 创建只隔离图形 DOM 的模型，执行真实画布重建与序列化代码。 @returns {object} 图模型。 */
function createRuleGraphModel() {
  const nodes = new Map();
  const edges = [];
  return {
    createNode: (config) => ({ id: config.id, isNode: () => true, getData: () => config.data, getAttrs: () => config.attrs }),
    createEdge: (config) => ({
      isNode: () => false,
      getSourceCellId: () => config.source.cell,
      getSourcePortId: () => config.source.port,
      getTargetCellId: () => config.target.cell,
    }),
    addCell: (cell) => (cell.isNode() ? nodes.set(cell.id, cell) : edges.push(cell)),
    getCellById: (id) => nodes.get(id),
    getNodes: () => [...nodes.values()],
    getOutgoingEdges: (id) => edges.filter((edge) => edge.getSourceCellId() === (typeof id === "string" ? id : id.id)),
  };
}
/** @description 创建完整可提交的行为，步骤标识与序列化规范一致。 @param {string} id 行为标识。 @returns {object[]} 行为步骤。 */
function configuredSteps(id) {
  return [
    {
      kind: "actions",
      id,
      actions: [
        {
          id,
          behaviorId: "behavior",
          behaviorName: id,
          relatedObject: "对象",
          instanceIds: [],
          params: [],
          behaviorParameters: { request: { ontologySpaceId: 156, actionApi: "app", params: { name: id } } },
        },
      ],
    },
  ];
}
/** @description 创建已配置的 case。 @param {string} id 分支标识。 @param {object[]} steps 分支步骤。 @returns {object} case。 */
function configuredCase(id, steps) {
  return { id, label: id, value: { kind: "input", text: id }, steps };
}
/** @description 将业务文档重建为图，再由真实序列化器读取。 @param {object} flow 画布文档。 @returns {object} 恢复文档。 */
function roundTripGraph(flow) {
  const graph = createRuleGraphModel();
  fillRuleFlowRenderBuffer({ graph }, flow);
  return serializeRuleFlowGraph(graph);
}

test("a single connected case stays inside switch with default absent or unconnected", () => {
  for (const defaultSteps of [null, []]) {
    const step = createSwitchStep({ kind: "input", text: "one" }, [configuredCase("one", configuredSteps("a")), configuredCase("two", [])], defaultSteps);
    assert.deepEqual(roundTripGraph({ steps: [step] }), { steps: [step] });
  }
});

test("only a connected default keeps its action and does not invent case actions", () => {
  const step = createSwitchStep({ kind: "input", text: "other" }, [configuredCase("one", []), configuredCase("two", [])], configuredSteps("default-action"));
  assert.deepEqual(roundTripGraph({ steps: [step] }), { steps: [step] });
});

test("separate case and default action chains retain their exact branch ownership", () => {
  const step = createSwitchStep(
    { kind: "input", text: "one" },
    [configuredCase("one", configuredSteps("a")), configuredCase("two", configuredSteps("b"))],
    configuredSteps("default"),
  );
  assert.deepEqual(roundTripGraph({ steps: [step] }), { steps: [step] });
});

test("real shared continuation before end appears once outside switch rather than duplicated inside cases", () => {
  const step = createSwitchStep(
    { kind: "input", text: "one" },
    [configuredCase("one", configuredSteps("a")), configuredCase("two", configuredSteps("b"))],
    null,
  );
  const flow = { steps: [step, ...configuredSteps("shared")] };
  const graph = createRuleGraphModel();
  fillRuleFlowRenderBuffer({ graph }, flow);
  graph.addCell(graph.createNode({ id: END_NODE_ID, data: { kind: "end" } }));
  graph.addCell(graph.createEdge({ source: { cell: "shared", port: PORT_OUT }, target: { cell: END_NODE_ID, port: "in" } }));
  assert.ok(graph.getOutgoingEdges(START_NODE_ID).length);
  assert.deepEqual(serializeRuleFlowGraph(graph), flow);
});

test("nested switch and if survive graph, request snapshot, detail recovery and graph reconstruction", () => {
  const inner = createSwitchStep({ kind: "input", text: "inside" }, [configuredCase("inside", configuredSteps("inner-action"))], null);
  const branch = {
    id: "nested-if",
    kind: "branch",
    condition: {
      id: "group",
      type: "composite",
      logic: "and",
      children: [{ id: "condition", type: "leaf", left: { kind: "input", text: "1" }, right: { kind: "input", text: "1" }, operator: "eq" }],
    },
    then: [inner],
    otherwise: null,
  };
  const step = createSwitchStep({ kind: "input", text: "one" }, [configuredCase("one", [branch]), configuredCase("two", [])], configuredSteps("fallback"));
  const flow = { steps: [step] };
  const fromGraph = roundTripGraph(flow);
  assert.deepEqual(fromGraph, flow);
  const options = [{ id: "behavior", displayName: "行为", actionApi: "app", ontologyUniqIdentifier: "object" }];
  const draft = { name: "switch", description: "", ruleFlow: fromGraph };
  const created = buildRuleScheduleCreateParams(draft, options, "156");
  assert.equal(created.ok, true, created.error);
  const restored = restoreRuleFlowDocument(created.request.rule.flowDocument);
  assert.equal(restored.ok, true, restored.error);
  const rebuilt = roundTripGraph(restored.group.flow);
  assert.deepEqual(rebuilt, restored.group.flow);
  const edited = buildRuleScheduleCreateParams({ ...draft, ruleFlow: rebuilt }, options, "156", restored.group.actionDetails);
  assert.equal(edited.ok, true, edited.error);
  assert.deepEqual(edited.request.rule.judgeRules, created.request.rule.judgeRules);
  assert.equal(JSON.parse(edited.request.rule.flowDocument).steps[0].kind, "switch");
});

test("switch action node renders a configured summary from output bindings even with an empty legacy params array", () => {
  const steps = configuredSteps("bound-action");
  steps[0].actions[0].behaviorParameters.request = { actionApi: "app", ontologySpaceId: "156", outputParams: { result: { entityPrimaryKey: 0 } } };
  const step = createSwitchStep({ kind: "input", text: "one" }, [configuredCase("one", steps)], null);
  const graph = createRuleGraphModel();
  fillRuleFlowRenderBuffer({ graph }, { steps: [step] });
  assert.match(graph.getCellById("bound-action").getAttrs().summary.text, /输出 1 项/);
  assert.deepEqual(
    serializeRuleFlowGraph(graph).steps[0].cases[0].steps[0].actions[0].behaviorParameters.request,
    steps[0].actions[0].behaviorParameters.request,
  );
});

test("initial graph action nodes display persisted input bindings without changing flow data", () => {
  const graph = createRuleGraphModel();
  const action = { id: "restored", behaviorId: "b", behaviorName: "行为", relatedObject: "", instanceIds: [], params: [] };
  const flow = { steps: [{ id: "actions", kind: "actions", actions: [action] }] };
  const before = structuredClone(flow);
  fillRuleFlowRenderBuffer({ graph, getSavedAction: () => ({ entityJson: '{"inputParams":{"value":[{"entityPrimaryKey":1}]}}' }) }, flow);
  const node = graph.getNodes().find((item) => item.getData().action?.id === action.id);
  assert.match(node.getAttrs().summary.text, /输入 1 项/);
  assert.deepEqual(flow, before);
});
