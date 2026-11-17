import assert from "node:assert/strict";
import test from "node:test";
import {
  collectUpstreamConditionObjectIds,
  filterBehaviorsByObjects,
  clearMismatchedGraphBehaviors,
} from "../src/views/SpaceBehaviorScheduleWorkspace/utils/filterRuleBehaviorsByObject.ts";

const variable = (objectId) => ({ kind: "variable", objectId });
const input = { kind: "input", text: "" };
const leaf = (left, right = input) => ({ id: "l", type: "leaf", left, right });
const group = (...children) => ({ id: "g", type: "composite", logic: "and", children });
const options = [
  { id: "a", ontologyUniqIdentifier: "plane", kind: "application" },
  { id: "b", ontologyUniqIdentifier: "ship", kind: "application" },
  { id: "c", ontologyUniqIdentifier: "tank", kind: "application" },
  { id: "d", ontologyUniqIdentifier: "", kind: "application" },
];

/** @description 构建节点和入边替身，用于执行真实图遍历。 @param {object} nodes 节点数据。 @param {string[][]} edges 连线。 @returns {object} 图。 */
function graphOf(nodes, edges) {
  const entries = new Map(
    Object.entries(nodes).map(([id, data]) => [
      id,
      { id, isNode: () => true, getData: () => data, setData: (next) => (entries.get(id).data = next), attr() {}, data },
    ]),
  );
  for (const node of entries.values()) node.getData = () => node.data;
  return {
    getCellById: (id) => entries.get(id),
    getNodes: () => [...entries.values()],
    getIncomingEdges: (node) =>
      edges.filter(([, to]) => to === node.id).map(([from, , port]) => ({ getSourceCellId: () => from, getSourcePortId: () => port })),
  };
}

test("collects all upstream condition objects from both sides and nested groups, excluding other branches", () => {
  const graph = graphOf(
    {
      c1: { kind: "condition", condition: group(leaf(variable("plane"), variable("ship")), group(leaf(variable("plane")), leaf(variable("")))) },
      c2: { kind: "condition", condition: group(leaf(variable("tank"))) },
      unrelated: { kind: "condition", condition: group(leaf(variable("other"))) },
      mid: { kind: "action" },
      target: { kind: "action" },
    },
    [
      ["c1", "mid"],
      ["mid", "target"],
      ["c2", "target"],
    ],
  );
  assert.deepEqual(new Set(collectUpstreamConditionObjectIds(graph, "target")), new Set(["plane", "ship", "tank"]));
  assert.deepEqual(collectUpstreamConditionObjectIds(graph, "unrelated"), []);
  assert.deepEqual(collectUpstreamConditionObjectIds(graph, "missing"), []);
});

test("filters behavior union and retains all options without an object", () => {
  assert.deepEqual(
    filterBehaviorsByObjects(options, ["plane", "ship"]).map((item) => item.id),
    ["a", "b"],
  );
  assert.deepEqual(
    filterBehaviorsByObjects(options, []).map((item) => item.id),
    ["a", "b", "c", "d"],
  );
  assert.deepEqual(filterBehaviorsByObjects(options, ["other"]), []);
});

test("clears known mismatched connected behavior and its parameters but preserves valid and unknown selections", () => {
  const action = (behaviorId) => ({ behaviorId, behaviorName: behaviorId, params: [{ value: "keep" }], behaviorParameters: { values: {} } });
  const graph = graphOf(
    {
      c: { kind: "condition", condition: group(leaf(variable("plane"))) },
      bad: { kind: "action", action: action("b") },
      ok: { kind: "action", action: action("a") },
      unknown: { kind: "action", action: action("gone") },
      isolated: { kind: "action", action: action("c") },
    },
    [
      ["c", "bad"],
      ["c", "ok"],
      ["c", "unknown"],
    ],
  );
  assert.equal(clearMismatchedGraphBehaviors(graph, options), 1);
  assert.equal(graph.getCellById("bad").data.action.behaviorId, "");
  assert.deepEqual(graph.getCellById("bad").data.action.params, []);
  assert.equal(graph.getCellById("bad").data.action.behaviorParameters, undefined);
  for (const id of ["ok", "unknown", "isolated"]) assert.notEqual(graph.getCellById(id).data.action.behaviorId, "");
  assert.equal(clearMismatchedGraphBehaviors(graph, options), 0);
});

test("switch case filters only switch operand and its own case; default includes all case operands", () => {
  const graph = graphOf(
    {
      sw: { kind: "switch", switchStep: { switchOn: variable("plane"), cases: [{ value: variable("ship") }, { value: variable("tank") }] } },
      a: { kind: "action" },
      b: { kind: "action" },
      d: { kind: "action" },
    },
    [
      ["sw", "a", "case_0"],
      ["sw", "b", "case_1"],
      ["sw", "d", "default"],
    ],
  );
  assert.deepEqual(new Set(collectUpstreamConditionObjectIds(graph, "a")), new Set(["plane", "ship"]));
  assert.deepEqual(new Set(collectUpstreamConditionObjectIds(graph, "b")), new Set(["plane", "tank"]));
  assert.deepEqual(new Set(collectUpstreamConditionObjectIds(graph, "d")), new Set(["plane", "ship", "tank"]));
});

test("switch nested in outer condition collects path union; merged case ports and cycles remain safe", () => {
  const graph = graphOf(
    {
      outer: { kind: "condition", condition: group(leaf(variable("outer"))) },
      sw: { kind: "switch", switchStep: { switchOn: input, cases: [{ value: variable("plane") }, { value: variable("ship") }] } },
      inner: { kind: "switch", switchStep: { switchOn: variable("tank"), cases: [{ value: input }] } },
      mid: { kind: "action" },
      a: { kind: "action" },
    },
    [
      ["outer", "sw"],
      ["sw", "mid", "case_0"],
      ["sw", "mid", "case_1"],
      ["mid", "inner"],
      ["inner", "a", "case_0"],
      ["a", "mid"],
    ],
  );
  assert.deepEqual(new Set(collectUpstreamConditionObjectIds(graph, "a")), new Set(["outer", "plane", "ship", "tank"]));
});

test("changing switch operands clears mismatched actions and parameters, while literal-only switches keep all choices", () => {
  const sw = { kind: "switch", switchStep: { switchOn: variable("plane"), cases: [{ value: input }] } };
  const graph = graphOf({ sw, action: { kind: "action", action: { behaviorId: "b", behaviorName: "ship", params: [1], behaviorParameters: {} } } }, [
    ["sw", "action", "case_0"],
  ]);
  assert.equal(clearMismatchedGraphBehaviors(graph, options), 1);
  assert.equal(graph.getCellById("action").getData().action.behaviorId, "");
  assert.equal(graph.getCellById("action").getData().action.behaviorParameters, undefined);
  sw.switchStep.switchOn = input;
  assert.deepEqual(collectUpstreamConditionObjectIds(graph, "action"), []);
  assert.equal(filterBehaviorsByObjects(options, []).length, options.length);
});
