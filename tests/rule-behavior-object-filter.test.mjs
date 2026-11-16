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
  { id: "a", ontologyUniqIdentifier: "plane" },
  { id: "b", ontologyUniqIdentifier: "ship" },
  { id: "c", ontologyUniqIdentifier: "tank" },
  { id: "d", ontologyUniqIdentifier: "" },
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
    getIncomingEdges: (node) => edges.filter(([, to]) => to === node.id).map(([from]) => ({ getSourceCellId: () => from })),
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
