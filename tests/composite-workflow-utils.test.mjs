import assert from "node:assert/strict";
import { test } from "node:test";

import { buildCompositeWorkflowLiteFlowEl } from "../src/views/FunctionOperatorPanel/utils/compositeWorkflowLiteFlowEl.ts";
import {
  buildCompositeWorkflowSavePayload,
  buildDefaultCompositeWorkflowInputBindings,
  hasCompositeWorkflowIncomingEdge,
  repairCompositeWorkflowInputBindings,
  validateCompositeWorkflowForSave,
  wouldCompositeWorkflowEdgeCreateCycle,
} from "../src/views/FunctionOperatorPanel/utils/compositeWorkflowGraph.ts";
import { isCompositeWorkflowInputAnchorId, isCompositeWorkflowOutputAnchorId } from "../src/views/FunctionOperatorPanel/utils/compositeWorkflowAnchors.ts";
import {
  compareCompositeWorkflowParamTypes,
  normalizeCompositeWorkflowParamType,
} from "../src/views/FunctionOperatorPanel/utils/compositeWorkflowParamType.ts";

test("normalizeCompositeWorkflowParamType maps aliases", () => {
  assert.equal(normalizeCompositeWorkflowParamType("STRING"), "string");
  assert.equal(normalizeCompositeWorkflowParamType("int"), "number");
  assert.equal(normalizeCompositeWorkflowParamType("Bool"), "boolean");
  assert.equal(normalizeCompositeWorkflowParamType("List"), "array");
  assert.equal(normalizeCompositeWorkflowParamType("custom"), "custom");
});

test("compareCompositeWorkflowParamTypes requires equality after normalize", () => {
  assert.deepEqual(compareCompositeWorkflowParamTypes("int", "number"), { compatible: true, unknown: false });
  assert.deepEqual(compareCompositeWorkflowParamTypes("string", "number"), { compatible: false, unknown: false });
  assert.deepEqual(compareCompositeWorkflowParamTypes("", "number"), { compatible: true, unknown: true });
});

test("wouldCompositeWorkflowEdgeCreateCycle detects loops", () => {
  const edges = [
    { id: "e1", sourceNodeId: "a", targetNodeId: "b" },
    { id: "e2", sourceNodeId: "b", targetNodeId: "c" },
  ];
  assert.equal(wouldCompositeWorkflowEdgeCreateCycle(edges, "c", "a"), true);
  assert.equal(wouldCompositeWorkflowEdgeCreateCycle(edges, "a", "c"), false);
  assert.equal(wouldCompositeWorkflowEdgeCreateCycle(edges, "x", "x"), true);
});

test("hasCompositeWorkflowIncomingEdge respects exclude", () => {
  const edges = [{ id: "e1", sourceNodeId: "a", targetNodeId: "b" }];
  assert.equal(hasCompositeWorkflowIncomingEdge(edges, "b"), true);
  assert.equal(hasCompositeWorkflowIncomingEdge(edges, "b", "e1"), false);
  assert.equal(hasCompositeWorkflowIncomingEdge(edges, "a"), false);
});

test("buildDefaultCompositeWorkflowInputBindings prefers same-name upstream", () => {
  const bindings = buildDefaultCompositeWorkflowInputBindings(
    [
      { paramName: "name", paramType: "string" },
      { paramName: "age", paramType: "number" },
    ],
    [{ paramName: "name", paramType: "string" }],
    true,
  );
  assert.deepEqual(bindings, [
    { mode: "fromUpstream", paramName: "name", upstreamParamName: "name" },
    { mode: "manual", paramName: "age", value: "" },
  ]);
});

test("repairCompositeWorkflowInputBindings drops invalid upstream refs", () => {
  const repaired = repairCompositeWorkflowInputBindings(
    [
      { mode: "fromUpstream", paramName: "a", upstreamParamName: "gone" },
      { mode: "manual", paramName: "b", value: "1" },
    ],
    [{ paramName: "keep", paramType: "string" }],
    true,
  );
  assert.deepEqual(repaired, [
    { mode: "manual", paramName: "a", value: "" },
    { mode: "manual", paramName: "b", value: "1" },
  ]);
});

test("validateCompositeWorkflowForSave blocks incompatible fromUpstream types", () => {
  const result = validateCompositeWorkflowForSave(
    [
      {
        id: "u",
        kind: "function",
        displayName: "上游",
        paramsSnapshot: { inputs: [], outputs: [{ paramName: "x", paramType: "string" }] },
        inputBindings: [],
      },
      {
        id: "d",
        kind: "function",
        displayName: "下游",
        paramsSnapshot: { inputs: [{ paramName: "x", paramType: "number" }], outputs: [] },
        inputBindings: [{ mode: "fromUpstream", paramName: "x", upstreamParamName: "x" }],
      },
    ],
    [{ id: "e1", sourceNodeId: "u", targetNodeId: "d" }],
  );
  assert.match(result.error ?? "", /不兼容/);
});

test("isCompositeWorkflowOutputAnchorId recognizes right-side outlets", () => {
  assert.equal(isCompositeWorkflowOutputAnchorId("n1_out"), true);
  assert.equal(isCompositeWorkflowOutputAnchorId("n1_out_true"), true);
  assert.equal(isCompositeWorkflowOutputAnchorId("n1_out_false"), true);
  assert.equal(isCompositeWorkflowOutputAnchorId("n1_in"), false);
  assert.equal(isCompositeWorkflowOutputAnchorId(undefined), false);
});

test("isCompositeWorkflowInputAnchorId recognizes left inlet", () => {
  assert.equal(isCompositeWorkflowInputAnchorId("n1_in"), true);
  assert.equal(isCompositeWorkflowInputAnchorId("n1_out"), false);
  assert.equal(isCompositeWorkflowInputAnchorId(undefined), false);
});

test("buildCompositeWorkflowLiteFlowEl serializes chain, when, and if", () => {
  const chain = buildCompositeWorkflowLiteFlowEl(
    [
      { id: "a", kind: "function" },
      { id: "b", kind: "function" },
      { id: "c", kind: "function" },
    ],
    [
      { id: "e1", sourceNodeId: "a", targetNodeId: "b" },
      { id: "e2", sourceNodeId: "b", targetNodeId: "c" },
    ],
  );
  assert.equal(chain.expression, "THEN(a, b, c);");

  const diamond = buildCompositeWorkflowLiteFlowEl(
    [
      { id: "a", kind: "function" },
      { id: "b", kind: "function" },
      { id: "c", kind: "function" },
      { id: "d", kind: "function" },
    ],
    [
      { id: "e1", sourceNodeId: "a", targetNodeId: "b" },
      { id: "e2", sourceNodeId: "a", targetNodeId: "c" },
      { id: "e3", sourceNodeId: "b", targetNodeId: "d" },
      { id: "e4", sourceNodeId: "c", targetNodeId: "d" },
    ],
  );
  assert.equal(diamond.expression, "THEN(a, WHEN(b, c), d);");

  const branch = buildCompositeWorkflowLiteFlowEl(
    [
      { id: "a", kind: "function" },
      { id: "br", kind: "branch" },
      { id: "t", kind: "function" },
      { id: "f", kind: "function" },
    ],
    [
      { id: "e1", sourceNodeId: "a", targetNodeId: "br" },
      { id: "e2", sourceNodeId: "br", targetNodeId: "t", branch: "true" },
      { id: "e3", sourceNodeId: "br", targetNodeId: "f", branch: "false" },
    ],
  );
  assert.equal(branch.expression, "THEN(a, IF(br, t, f));");
});

test("buildCompositeWorkflowSavePayload assembles schemaVersion 1", () => {
  const payload = buildCompositeWorkflowSavePayload({
    displayName: "编排A",
    functionApi: "comp.a",
    version: "1.0.0",
    ontologySpaceId: 9,
    logicFlowGraph: { nodes: [], edges: [] },
    nodes: [{ id: "n1", kind: "loop", loopConfig: { kind: "loop", collection: { mode: "manual", jsonText: "[]" }, itemParamName: "item" } }],
    edges: [],
    savedAt: "2026-10-15T00:00:00.000Z",
  });
  assert.equal(payload.schemaVersion, 1);
  assert.equal(payload.meta.functionApi, "comp.a");
  assert.equal(payload.nodes[0]?.kind, "loop");
});
