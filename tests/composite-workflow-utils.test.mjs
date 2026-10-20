import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { buildCompositeWorkflowLiteFlowEl } from "../src/views/FunctionOperatorPanel/utils/compositeWorkflowLiteFlowEl.ts";
import {
  buildCompositeWorkflowSavePayload,
  buildDefaultCompositeWorkflowInputBindings,
  hasCompositeWorkflowIncomingEdge,
  listCompositeWorkflowParamLeaves,
  listCompositeWorkflowParamNodes,
  mapCompositeWorkflowDetailParamBriefs,
  repairCompositeWorkflowInputBindings,
  resolveCompositeWorkflowNodeUpstreamOutputs,
  resolveCompositeWorkflowParamsFromSnapshotAndDetail,
  validateCompositeWorkflowForSave,
  wouldCompositeWorkflowEdgeCreateCycle,
} from "../src/views/FunctionOperatorPanel/utils/compositeWorkflowGraph.ts";
import { isCompositeWorkflowInputAnchorId, isCompositeWorkflowOutputAnchorId } from "../src/views/FunctionOperatorPanel/utils/compositeWorkflowAnchors.ts";
import {
  createDefaultCompositeWorkflowBranchConfig,
  normalizeCompositeWorkflowBranchConfig,
} from "../src/views/FunctionOperatorPanel/utils/compositeWorkflowBranchDefaults.ts";
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

test("listCompositeWorkflowParamLeaves flattens nested OUTPUT to bottom leaves", () => {
  const leaves = listCompositeWorkflowParamLeaves([
    {
      paramName: "Output",
      paramType: "object",
      fields: [
        { paramName: "id", paramType: "number" },
        { paramName: "name", paramType: "string" },
      ],
    },
  ]);
  assert.deepEqual(
    leaves.map((item) => item.paramPath),
    [
      ["Output", "id"],
      ["Output", "name"],
    ],
  );
  assert.equal(leaves[0]?.brief.paramType, "number");
});

test("listCompositeWorkflowParamNodes includes every level of multiple roots", () => {
  const nodes = listCompositeWorkflowParamNodes([
    {
      paramName: "Output",
      paramType: "object",
      fields: [
        { paramName: "id", paramType: "number" },
        { paramName: "name", paramType: "string" },
      ],
    },
    { paramName: "flag", paramType: "boolean" },
  ]);
  assert.deepEqual(
    nodes.map((item) => item.paramPath),
    [["Output"], ["Output", "id"], ["Output", "name"], ["flag"]],
  );
});

test("buildDefaultCompositeWorkflowInputBindings never auto-matches upstream", () => {
  const bindings = buildDefaultCompositeWorkflowInputBindings(
    [
      { paramName: "name", paramType: "string" },
      { paramName: "age", paramType: "number" },
    ],
    [{ paramName: "name", paramType: "string" }],
    true,
  );
  assert.deepEqual(bindings, [
    { mode: "manual", paramName: "name", paramPath: ["name"], value: "" },
    { mode: "manual", paramName: "age", paramPath: ["age"], value: "" },
  ]);
});

test("buildDefaultCompositeWorkflowInputBindings binds only nested input leaves as manual", () => {
  const bindings = buildDefaultCompositeWorkflowInputBindings(
    [
      {
        paramName: "input",
        paramType: "object",
        fields: [
          { paramName: "title", paramType: "string" },
          {
            paramName: "meta",
            paramType: "object",
            fields: [{ paramName: "count", paramType: "number" }],
          },
        ],
      },
    ],
    [{ paramName: "title", paramType: "string" }],
    true,
  );
  assert.deepEqual(bindings, [
    { mode: "manual", paramName: "title", paramPath: ["input", "title"], value: "" },
    { mode: "manual", paramName: "count", paramPath: ["input", "meta", "count"], value: "" },
  ]);
});

test("repairCompositeWorkflowInputBindings drops invalid upstream refs", () => {
  const repaired = repairCompositeWorkflowInputBindings(
    [
      { mode: "fromUpstream", paramName: "a", paramPath: ["a"], upstreamParamName: "gone", upstreamParamPath: ["gone"] },
      { mode: "manual", paramName: "b", paramPath: ["b"], value: "1" },
    ],
    [{ paramName: "keep", paramType: "string" }],
    true,
  );
  assert.deepEqual(repaired, [
    { mode: "manual", paramName: "a", paramPath: ["a"], value: "" },
    { mode: "manual", paramName: "b", paramPath: ["b"], value: "1" },
  ]);
});

test("repair keeps explicit mid-level upstream object path", () => {
  const repaired = repairCompositeWorkflowInputBindings(
    [
      {
        mode: "fromUpstream",
        paramName: "payload",
        paramPath: ["payload"],
        upstreamParamName: "Output",
        upstreamParamPath: ["Output"],
      },
    ],
    [
      {
        paramName: "Output",
        paramType: "object",
        fields: [{ paramName: "id", paramType: "number" }],
      },
    ],
    true,
  );
  assert.deepEqual(repaired, [
    {
      mode: "fromUpstream",
      paramName: "payload",
      paramPath: ["payload"],
      upstreamParamName: "Output",
      upstreamParamPath: ["Output"],
    },
  ]);
});

test("input binding tree selects upstream by any node path without auto-fill", () => {
  const tree = readFileSync(new URL("../src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeInputBindingTree.vue", import.meta.url), "utf8");
  const dialog = readFileSync(
    new URL("../src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeFunctionNodeDialog.vue", import.meta.url),
    "utf8",
  );
  assert.match(tree, /请选择上游参数/);
  assert.match(dialog, /listCompositeWorkflowParamNodes/);
  assert.match(dialog, /upstreamParamPath: \[\]/);
  assert.doesNotMatch(dialog, /upstreamOptions\.value\[0\]/);
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
        inputBindings: [{ mode: "fromUpstream", paramName: "x", paramPath: ["x"], upstreamParamName: "x", upstreamParamPath: ["x"] }],
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

test("upstream outputs come from detail OUTPUT params even when INPUT values are empty", () => {
  const outputs = mapCompositeWorkflowDetailParamBriefs(
    [
      { paramName: "keyword", paramType: "string", category: "INPUT", paramOrder: 1 },
      {
        paramName: "result",
        paramType: "object",
        category: "OUTPUT",
        paramOrder: 1,
        fields: [{ paramName: "id", paramType: "string", category: "OUTPUT", paramOrder: 1 }],
      },
    ],
    "OUTPUT",
  );
  assert.deepEqual(outputs, [{ paramName: "result", paramType: "object", fields: [{ paramName: "id", paramType: "string" }] }]);
  const canvas = readFileSync(new URL("../src/views/FunctionOperatorPanel/composables/useCompositeWorkflowCanvas.ts", import.meta.url), "utf8");
  assert.match(canvas, /ensureUpstreamFunctionOutputs/);
  assert.match(canvas, /mapCompositeWorkflowDetailParamBriefs\(detailParams, "OUTPUT"\)/);
  assert.match(canvas, /mapCompositeWorkflowDetailParamBriefs\(detailParams, "INPUT"\)/);
});

test("resolveCompositeWorkflowParamsFromSnapshotAndDetail fills INPUT when snapshot inputs are empty", () => {
  const detailParams = [
    {
      paramName: "input",
      paramType: "object",
      category: "INPUT",
      paramOrder: 1,
      fields: [
        { paramName: "id", paramType: "number", category: "INPUT", paramOrder: 1 },
        { paramName: "name", paramType: "string", category: "INPUT", paramOrder: 2 },
      ],
    },
    {
      paramName: "output",
      paramType: "object",
      category: "OUTPUT",
      paramOrder: 1,
      fields: [
        { paramName: "id", paramType: "number", category: "OUTPUT", paramOrder: 1 },
        { paramName: "name", paramType: "string", category: "OUTPUT", paramOrder: 2 },
      ],
    },
  ];
  const resolved = resolveCompositeWorkflowParamsFromSnapshotAndDetail({ inputs: [], outputs: [{ paramName: "output", paramType: "object" }] }, detailParams);
  assert.equal(resolved.inputs.length, 1);
  assert.equal(resolved.inputs[0]?.paramName, "input");
  assert.deepEqual(
    resolved.inputs[0]?.fields?.map((item) => item.paramName),
    ["id", "name"],
  );
  assert.deepEqual(resolved.outputs, [{ paramName: "output", paramType: "object" }]);
});

test("resolveCompositeWorkflowParamsFromSnapshotAndDetail keeps non-empty snapshot sides", () => {
  const detailParams = [
    { paramName: "fromDetail", paramType: "string", category: "INPUT", paramOrder: 1 },
    { paramName: "outDetail", paramType: "string", category: "OUTPUT", paramOrder: 1 },
  ];
  const resolved = resolveCompositeWorkflowParamsFromSnapshotAndDetail(
    {
      inputs: [{ paramName: "fromSnapshot", paramType: "number" }],
      outputs: [{ paramName: "outSnapshot", paramType: "boolean" }],
    },
    detailParams,
  );
  assert.deepEqual(resolved.inputs, [{ paramName: "fromSnapshot", paramType: "number" }]);
  assert.deepEqual(resolved.outputs, [{ paramName: "outSnapshot", paramType: "boolean" }]);
});

test("no-upstream defaults to manual bindings for resolved INPUT leaves", () => {
  const inputs = [
    {
      paramName: "input",
      paramType: "object",
      fields: [
        { paramName: "id", paramType: "number" },
        { paramName: "name", paramType: "string" },
      ],
    },
  ];
  const bindings = buildDefaultCompositeWorkflowInputBindings(inputs, [], false);
  assert.deepEqual(bindings, [
    { mode: "manual", paramName: "id", paramPath: ["input", "id"], value: "" },
    { mode: "manual", paramName: "name", paramPath: ["input", "name"], value: "" },
  ]);
});

test("function node dialog resolves params via snapshot-and-detail helper", () => {
  const dialog = readFileSync(
    new URL("../src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeFunctionNodeDialog.vue", import.meta.url),
    "utf8",
  );
  assert.match(dialog, /resolveCompositeWorkflowParamsFromSnapshotAndDetail/);
  assert.doesNotMatch(dialog, /Boolean\(context\.paramsSnapshot\?\.inputs\)/);
});

test("function node input binding tree shows nested leaves and types", () => {
  const dialog = readFileSync(
    new URL("../src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeFunctionNodeDialog.vue", import.meta.url),
    "utf8",
  );
  const tree = readFileSync(new URL("../src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeInputBindingTree.vue", import.meta.url), "utf8");
  assert.match(dialog, /FunctionOperatorCompositeInputBindingTree/);
  assert.match(tree, /paramType/);
  assert.match(tree, /fields && node\.fields\.length > 0/);
  assert.match(tree, /手动输入/);
  assert.match(tree, /来自上游/);
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

test("createDefaultCompositeWorkflowBranchConfig uses fromUpstream left and eq", () => {
  const config = createDefaultCompositeWorkflowBranchConfig();
  assert.equal(config.kind, "branch");
  assert.equal(config.left.mode, "fromUpstream");
  assert.equal(config.left.upstreamParamName, "");
  assert.deepEqual(config.left.upstreamParamPath, []);
  assert.equal(config.operator, "eq");
  assert.deepEqual(config.right, { mode: "manual", value: "" });
});

test("normalizeCompositeWorkflowBranchConfig migrates manual and truthy", () => {
  assert.deepEqual(normalizeCompositeWorkflowBranchConfig(null), createDefaultCompositeWorkflowBranchConfig());
  assert.deepEqual(normalizeCompositeWorkflowBranchConfig("bad"), createDefaultCompositeWorkflowBranchConfig());

  const fromManual = normalizeCompositeWorkflowBranchConfig({
    kind: "branch",
    left: { mode: "manual", value: "1" },
    operator: "truthy",
  });
  assert.equal(fromManual.left.mode, "fromUpstream");
  assert.deepEqual(fromManual.left.upstreamParamPath, []);
  assert.equal(fromManual.operator, "eq");
  assert.deepEqual(fromManual.right, { mode: "manual", value: "" });

  const fromNameOnly = normalizeCompositeWorkflowBranchConfig({
    kind: "branch",
    left: { mode: "fromUpstream", upstreamParamName: "score" },
    operator: "gt",
    right: { mode: "manual", value: "10" },
  });
  assert.deepEqual(fromNameOnly.left.upstreamParamPath, ["score"]);
  assert.equal(fromNameOnly.operator, "gt");
  assert.equal(fromNameOnly.right.value, "10");

  const withPath = normalizeCompositeWorkflowBranchConfig({
    kind: "branch",
    left: { mode: "fromUpstream", upstreamParamName: "id", upstreamParamPath: ["result", "id"] },
    operator: "ne",
    right: { mode: "manual", value: "0" },
  });
  assert.deepEqual(withPath.left.upstreamParamPath, ["result", "id"]);
  assert.equal(withPath.left.upstreamParamName, "id");
  assert.equal(withPath.operator, "ne");
});

test("resolveCompositeWorkflowNodeUpstreamOutputs covers transform loop and missing source", () => {
  const transformOutputs = resolveCompositeWorkflowNodeUpstreamOutputs(
    [
      {
        id: "tr",
        kind: "transform",
        transformConfig: {
          kind: "transform",
          language: "typescript",
          code: "",
          paramsSnapshot: { inputs: [], outputs: [{ paramName: "out", paramType: "string" }] },
        },
      },
      { id: "down", kind: "function" },
    ],
    [{ id: "e1", sourceNodeId: "tr", targetNodeId: "down" }],
    "down",
  );
  assert.deepEqual(transformOutputs.upstreamOutputs, [{ paramName: "out", paramType: "string" }]);

  const loopOutputs = resolveCompositeWorkflowNodeUpstreamOutputs(
    [
      { id: "lp", kind: "loop", loopConfig: { kind: "loop", collection: { mode: "manual", jsonText: "[]" }, itemParamName: "row" } },
      { id: "down", kind: "function" },
    ],
    [{ id: "e1", sourceNodeId: "lp", targetNodeId: "down" }],
    "down",
  );
  assert.deepEqual(loopOutputs.upstreamOutputs, [{ paramName: "row", paramType: "object" }]);

  assert.deepEqual(resolveCompositeWorkflowNodeUpstreamOutputs([], [], "x"), { hasUpstream: false, upstreamOutputs: [] });
  assert.deepEqual(resolveCompositeWorkflowNodeUpstreamOutputs([], [{ id: "e1", sourceNodeId: "gone", targetNodeId: "x" }], "x"), {
    hasUpstream: true,
    upstreamOutputs: [],
  });
});

test("resolveCompositeWorkflowNodeUpstreamOutputs passes through branch predecessors", () => {
  const outputs = [{ paramName: "result", paramType: "object", fields: [{ paramName: "id", paramType: "string" }] }];
  const nodes = [
    {
      id: "fn",
      kind: "function",
      paramsSnapshot: { inputs: [], outputs },
    },
    {
      id: "br",
      kind: "branch",
      branchConfig: createDefaultCompositeWorkflowBranchConfig(),
    },
    {
      id: "down",
      kind: "function",
      paramsSnapshot: { inputs: [{ paramName: "x", paramType: "string" }], outputs: [] },
    },
  ];
  const edges = [
    { id: "e1", sourceNodeId: "fn", targetNodeId: "br" },
    { id: "e2", sourceNodeId: "br", targetNodeId: "down", branch: "true" },
  ];
  const resolved = resolveCompositeWorkflowNodeUpstreamOutputs(nodes, edges, "down");
  assert.equal(resolved.hasUpstream, true);
  assert.deepEqual(resolved.upstreamOutputs, outputs);
});

test("branch node registers as diamond with right true and bottom false anchors", () => {
  const source = readFileSync(new URL("../src/views/FunctionOperatorPanel/utils/registerCompositeWorkflowNodes.ts", import.meta.url), "utf8");
  assert.match(source, /DiamondNode/);
  assert.match(source, /DiamondNodeModel/);
  assert.match(source, /\$\{id\}_out_true/);
  assert.match(source, /\$\{id\}_out_false/);
  assert.match(source, /y \+ ry|y\s*\+\s*ry/);
  assert.match(source, /x \+ rx|x\s*\+\s*rx/);
});

test("branch diamond view labels true and false exits", () => {
  const source = readFileSync(new URL("../src/views/FunctionOperatorPanel/utils/registerCompositeWorkflowNodes.ts", import.meta.url), "utf8");
  assert.match(source, /class CompositeBranchDiamondView extends DiamondNode/);
  assert.match(source, /getShape\s*\(/);
  assert.match(source, /["']true["']/);
  assert.match(source, /["']false["']/);
  assert.match(source, /pointer-events["']?\s*:\s*["']none["']/);
  assert.match(source, /view:\s*CompositeBranchDiamondView/);
});

test("branch logic dialog selects upstream output path without manual left", () => {
  const dialog = readFileSync(new URL("../src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeLogicNodeDialog.vue", import.meta.url), "utf8");
  assert.match(dialog, /listCompositeWorkflowParamNodes/);
  assert.match(dialog, /compositeWorkflowParamPathKey/);
  assert.doesNotMatch(dialog, /左值来源/);
  assert.doesNotMatch(dialog, /truthy/);
  assert.match(dialog, /==/);
  assert.match(dialog, /!==/);
});
