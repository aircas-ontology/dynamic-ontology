import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { ModuleKind, transpileModule } from "typescript";
import * as Vue from "vue";
import { compileScript, parse } from "@vue/compiler-sfc";
import { cloneRuleFlowValue, summarizeRuleCondition, truncateRuleFlowText } from "../src/views/SpaceBehaviorScheduleWorkspace/utils/scheduleRuleFlowFactory.ts";
import { buildRuleScheduleCreateParams } from "../src/views/SpaceBehaviorScheduleWorkspace/utils/buildRuleScheduleCreateParams.ts";
import {
  collectActionConditionPaths,
  collectConditionVariableRows,
  filterConfigurableConditionVariableRows,
  validateConditionBindings,
} from "../src/views/SpaceBehaviorScheduleWorkspace/utils/ruleConditionInstanceBindings.ts";
import { readRuleVariableBindingRequirement } from "../src/views/SpaceBehaviorScheduleWorkspace/utils/needsRuleVariableDataRow.ts";

/** @description 创建变量引用。 @param {string} objectId 对象标识。 @returns {object} 变量。 */
function createVariable(objectId = "plane") {
  return { kind: "variable", objectId, objectName: objectId, propertyId: "speed", propertyName: "速度", objectKind: "object", instanceIds: [] };
}
/** @description 创建可执行真实遍历的图替身。 @param {object} data 节点数据。 @param {Array} edges 连线。 @returns {object} 图。 */
function createGraph(data, edges) {
  const nodes = new Map(Object.entries(data).map(([id, value]) => [id, { id, isNode: () => true, getData: () => value }]));
  return {
    getCellById: (id) => nodes.get(id),
    getIncomingEdges: (node) => edges.filter((edge) => edge[1] === node.id).map(([id, , port]) => ({ getSourceCellId: () => id, getSourcePortId: () => port })),
  };
}
const condition = {
  id: "root",
  type: "composite",
  logic: "and",
  children: [
    { id: "one", type: "leaf", left: createVariable(), operator: "gt", right: { kind: "input", text: "1" } },
    {
      id: "nested",
      type: "composite",
      logic: "or",
      children: [{ id: "two", type: "leaf", left: createVariable("radar"), operator: "eq", right: createVariable() }],
    },
  ],
};

test("nested rows preserve group logic, operand side and independent same-object references", () => {
  const rows = collectConditionVariableRows(condition);
  assert.equal(rows.length, 3);
  assert.match(rows[1].label, /或者/);
  assert.match(rows[1].label, /2.1/);
  assert.match(rows[2].label, /右侧/);
  assert.equal(new Set(rows.map((row) => row.key)).size, 3);
  rows[0].value.instanceIds = ["a"];
  assert.deepEqual(rows[2].value.instanceIds, []);
  rows[0].value.instanceIds = [];
});

test("paths retain outer predicates and false branches, excluding unrelated nodes; drafts cancel without mutation", () => {
  const graph = createGraph(
    {
      start: { kind: "start" },
      outer: { kind: "condition", condition },
      inner: { kind: "condition", condition: structuredClone(condition) },
      a: { kind: "action" },
      b: { kind: "action" },
      unrelated: { kind: "condition", condition },
    },
    [
      ["start", "outer", "out"],
      ["outer", "inner", "true"],
      ["inner", "a", "false"],
      ["outer", "b", "true"],
    ],
  );
  const paths = collectActionConditionPaths(graph, "a");
  assert.deepEqual(
    paths[0].map((item) => item.nodeId),
    ["outer", "inner"],
  );
  assert.match(paths[0][1].label, /不满足/);
  paths[0][0].rows[0].value.instanceIds = ["changed"];
  assert.deepEqual(condition.children[0].left.instanceIds, []);
  assert.deepEqual(collectActionConditionPaths(graph, "b")[0][0].rows[0].value.instanceIds, []);
  assert.deepEqual(collectActionConditionPaths(graph, "missing"), []);
});

test("merged paths share one draft per source node and preserve each route", () => {
  const graph = createGraph({ root: { kind: "condition", condition }, left: { kind: "action" }, right: { kind: "action" }, target: { kind: "action" } }, [
    ["root", "left", "true"],
    ["root", "right", "false"],
    ["left", "target", "out"],
    ["right", "target", "out"],
  ]);
  const paths = collectActionConditionPaths(graph, "target");
  assert.equal(paths.length, 2);
  paths[0][0].rows[0].value.instanceIds = ["shared"];
  assert.deepEqual(paths[1][0].rows[0].value.instanceIds, ["shared"]);
  assert.equal(paths[0][0].data, paths[1][0].data);
});

test("switch case binds own operands; default includes all cases; cycles terminate", () => {
  const graph = createGraph(
    {
      sw: {
        kind: "switch",
        switchStep: {
          switchOn: createVariable(),
          cases: [
            { id: "c1", label: "巡航", value: createVariable("radar") },
            { id: "c2", label: "返航", value: createVariable("ship") },
          ],
        },
      },
      a: { kind: "action" },
      d: { kind: "action" },
    },
    [
      ["sw", "a", "case_0"],
      ["sw", "d", "default"],
      ["a", "sw", "out"],
    ],
  );
  assert.deepEqual(
    collectActionConditionPaths(graph, "a")[0][0].rows.map((row) => row.value.objectId),
    ["plane", "radar"],
  );
  assert.equal(collectActionConditionPaths(graph, "d")[0][0].rows.length, 3);
  assert.match(collectActionConditionPaths(graph, "d")[0][0].label, /默认/);
});

test("binding validation requires one instance and a subtable row, accepting zero and false keys", () => {
  const value = createVariable();
  const rows = [{ key: "one", label: "条件1 左侧", value }];
  assert.match(validateConditionBindings(rows), /实例/);
  value.instanceIds = ["a", "b"];
  assert.match(validateConditionBindings(rows), /实例/);
  value.instanceIds = ["a"];
  assert.equal(validateConditionBindings(rows), "");
  value.storageGroup = "weapons";
  assert.match(validateConditionBindings(rows), /数据行/);
  value.dataPrimaryKey = 0;
  assert.equal(validateConditionBindings(rows), "");
  value.dataPrimaryKey = false;
  assert.equal(validateConditionBindings(rows), "");
  assert.equal(validateConditionBindings([]), "");
});

test("insert or delete bindings skip main instance and subtable data rows", () => {
  assert.deepEqual(readRuleVariableBindingRequirement("main", "insert"), { requiresInstance: false, requiresDataRow: false });
  assert.deepEqual(readRuleVariableBindingRequirement("weapons", "delete"), { requiresInstance: true, requiresDataRow: false });
  assert.deepEqual(readRuleVariableBindingRequirement("weapons", "update"), { requiresInstance: true, requiresDataRow: true });

  const main = createVariable();
  main.storageGroup = "main";
  const sub = createVariable("plane");
  sub.propertyId = "range";
  sub.propertyName = "射程";
  sub.storageGroup = "weapons";
  const rows = [
    { key: "main", label: "条件1 左侧", value: main },
    { key: "sub", label: "条件2 左侧", value: sub },
  ];
  assert.deepEqual(
    filterConfigurableConditionVariableRows(rows, "insert").map((row) => row.key),
    ["sub"],
  );
  assert.equal(validateConditionBindings([{ key: "main", label: "条件1 左侧", value: main }], "insert"), "");
  assert.match(validateConditionBindings([{ key: "sub", label: "条件2 左侧", value: sub }], "insert"), /实例/);
  sub.instanceIds = ["plane-1"];
  assert.equal(validateConditionBindings([{ key: "sub", label: "条件2 左侧", value: sub }], "insert"), "");

  const insertCondition = {
    id: "root",
    type: "composite",
    logic: "and",
    monitorType: "insert",
    children: [
      { id: "one", type: "leaf", left: main, operator: "eq", right: { kind: "input", text: "1" } },
      { id: "two", type: "leaf", left: sub, operator: "eq", right: { kind: "input", text: "2" } },
    ],
  };
  const graph = createGraph({ root: { kind: "condition", condition: insertCondition }, action: { kind: "action" } }, [["root", "action", "true"]]);
  const pathRows = collectActionConditionPaths(graph, "action")[0][0].rows;
  assert.deepEqual(
    pathRows.map((row) => row.value.propertyId),
    ["range"],
  );
});

test("confirm through real graph session synchronizes sibling actions, keeps inner scope and current request format", () => {
  const outerCondition = {
    id: "outer-group",
    type: "composite",
    logic: "and",
    children: [{ id: "outer-leaf", type: "leaf", left: createVariable(), operator: "gt", right: { kind: "input", text: "100" } }],
  };
  const innerCondition = structuredClone(outerCondition);
  innerCondition.id = "inner-group";
  const graph = createGraph(
    {
      outer: { kind: "condition", condition: outerCondition },
      inner: { kind: "condition", condition: innerCondition },
      a: { kind: "action" },
      b: { kind: "action" },
      c: { kind: "action" },
    },
    [
      ["outer", "a", "true"],
      ["outer", "inner", "true"],
      ["inner", "b", "true"],
      ["inner", "c", "true"],
    ],
  );
  const stored = new Map(["outer", "inner", "a", "b", "c"].map((id) => [id, graph.getCellById(id).getData()]));
  for (const [id] of stored) {
    const node = graph.getCellById(id);
    node.getData = () => stored.get(id);
    node.setData = (data) => stored.set(id, data);
    node.attr = () => {};
  }
  const source = readFileSync(new URL("../src/views/SpaceBehaviorScheduleWorkspace/utils/scheduleRuleFlowGraphSession.ts", import.meta.url), "utf8");
  const { outputText } = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS } });
  const exports = {};
  new Function("require", "exports", outputText)(
    (id) =>
      id.includes("ruleConditionInstanceBindings")
        ? { collectActionConditionPaths }
        : id.includes("scheduleRuleFlowFactory")
          ? { cloneRuleFlowValue, summarizeRuleCondition, truncateRuleFlowText }
          : {},
    exports,
  );
  const session = new exports.ScheduleRuleFlowGraphSession({});
  session.graph = graph;
  let commits = 0;
  session.updateNodeData = (id, data) => {
    stored.set(id, data);
    commits++;
  };
  const paths = session.getActionConditionPaths("b");
  paths[0][0].rows[0].value.instanceIds = ["plane-a"];
  paths[0][1].rows[0].value.instanceIds = ["plane-b"];
  session.updateActionWithConditions("b", { kind: "action" }, paths);
  assert.equal(commits, 1);
  assert.deepEqual(session.getActionConditionPaths("a")[0][0].rows[0].value.instanceIds, ["plane-a"]);
  assert.deepEqual(session.getActionConditionPaths("c")[0][1].rows[0].value.instanceIds, ["plane-b"]);
  assert.equal(session.getActionConditionPaths("a")[0].length, 1);
  // A later cancelled edit remains isolated from the condition shared by all actions.
  session.getActionConditionPaths("a")[0][0].rows[0].value.instanceIds = ["cancelled"];
  assert.deepEqual(session.getActionConditionPaths("b")[0][0].rows[0].value.instanceIds, ["plane-a"]);
  const action = (id) => ({
    kind: "actions",
    id: `step-${id}`,
    actions: [{ id, behaviorId: "behavior", params: [], behaviorParameters: { request: { ontologySpaceId: "7", actionApi: "app", params: { id } } } }],
  });
  const flow = { kind: "branch", id: "outer", condition: stored.get("outer").condition, then: [action("a"), action("b")], otherwise: null };
  const result = buildRuleScheduleCreateParams(
    { name: "rule", description: "", ruleFlow: { steps: [flow] } },
    [{ id: "behavior", actionApi: "app", ontologyUniqIdentifier: "plane" }],
    "7",
  );
  assert.equal(result.ok, true);
  assert.deepEqual(
    result.request.rule.judgeRules.map((rule) => rule.judgeParams[0].leftOperate),
    Array(2).fill({ type: "dynamic", OntologyId: "plane", entityId: "plane-a", propertyId: "speed" }),
  );
  assert.deepEqual(
    result.request.rule.judgeRules.map((rule) => JSON.parse(rule.actionParam.entity_json).params.id),
    ["a", "b"],
  );
  assert.equal(JSON.parse(result.request.rule.flowDocument).steps[0].condition.children[0].left.instanceIds[0], "plane-a");
});

test("instance panel merges shared sources, validates query readiness and preserves branch labels", () => {
  const variable = createVariable();
  variable.instanceIds = ["plane-a"];
  const row = { key: "left", label: "条件1 左侧", value: variable };
  const source = { nodeId: "outer", label: "条件分支 · 满足", data: { condition }, rows: [row] };
  const other = {
    ...source,
    label: "条件分支 · 不满足",
    rows: [row, { key: "right", label: "条件2 右侧", value: { ...createVariable("radar"), instanceIds: ["r"] } }],
  };
  const { descriptor } = parse(
    readFileSync(new URL("../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleConditionInstances.vue", import.meta.url), "utf8"),
  );
  const compiled = compileScript(descriptor, { id: "condition-panel-test" });
  const { outputText } = transpileModule(compiled.content, { compilerOptions: { module: ModuleKind.CommonJS } });
  const exports = {};
  new Function("require", "exports", outputText)(
    (id) =>
      id === "vue"
        ? Vue
        : id.includes("ruleConditionInstanceBindings")
          ? { validateConditionBindings }
          : id.includes("scheduleRuleFlowFactory")
            ? { summarizeRuleCondition }
            : {},
    exports,
  );
  const props = Vue.reactive({ paths: [[source], [other]] });
  const page = exports.default.setup(props, { expose() {} });
  assert.equal(page.sources.value.length, 1);
  assert.equal(page.sources.value[0].rows.length, 2);
  assert.match(page.sources.value[0].label, /不满足/);
  assert.match(page.validateInstances(), /等待加载/);
  page.setBindingValidity("outer", "left", true);
  page.setBindingValidity("outer", "right", true);
  assert.equal(page.validateInstances(), "");
  props.paths[0][0].rows[0].value.instanceIds = [];
  assert.match(page.validateInstances(), /实例/);
  assert.match(page.formatSourceTitle(source), /^条件1/);
  props.paths = [];
  assert.equal(page.validateInstances(), "");
});
