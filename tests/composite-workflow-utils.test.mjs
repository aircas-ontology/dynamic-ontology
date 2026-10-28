import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { buildCompositeWorkflowLiteFlowEl } from "../src/views/FunctionOperatorPanel/utils/compositeWorkflowLiteFlowEl.ts";
import {
  buildAutoConfiguredCompositeWorkflowInputBindings,
  buildCompositeWorkflowSavePayload,
  buildDefaultCompositeWorkflowInputBindings,
  hasCompositeWorkflowIncomingEdge,
  listCompositeWorkflowParamLeaves,
  listCompositeWorkflowParamNodes,
  mapCompositeWorkflowDetailParamBriefs,
  repairCompositeWorkflowInputBindings,
  resolveCompositeWorkflowLogicFlowForRender,
  resolveCompositeWorkflowNodeUpstreamOutputs,
  resolveCompositeWorkflowParamsFromSnapshotAndDetail,
  validateCompositeWorkflowForSave,
  wouldCompositeWorkflowEdgeCreateCycle,
} from "../src/views/FunctionOperatorPanel/utils/compositeWorkflowGraph.ts";
import {
  buildCompositeWorkflowSwitchCaseOutletAnchorId,
  buildCompositeWorkflowSwitchDefaultOutletAnchorId,
  isCompositeWorkflowInputAnchorId,
  isCompositeWorkflowOutputAnchorId,
  parseCompositeWorkflowLoopOutletFromAnchorId,
  parseCompositeWorkflowSwitchOutletFromAnchorId,
  pickClosestAllowedCompositeWorkflowAnchor,
} from "../src/views/FunctionOperatorPanel/utils/compositeWorkflowAnchors.ts";
import {
  createDefaultCompositeWorkflowBranchConfig,
  normalizeCompositeWorkflowBranchConfig,
} from "../src/views/FunctionOperatorPanel/utils/compositeWorkflowBranchDefaults.ts";
import {
  createDefaultCompositeWorkflowLoopConfig,
  normalizeCompositeWorkflowLoopConfig,
} from "../src/views/FunctionOperatorPanel/utils/compositeWorkflowLoopDefaults.ts";
import {
  createDefaultCompositeWorkflowSwitchConfig,
  normalizeCompositeWorkflowSwitchConfig,
} from "../src/views/FunctionOperatorPanel/utils/compositeWorkflowSwitchDefaults.ts";
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

test("buildAutoConfiguredCompositeWorkflowInputBindings matches same name and compatible type", () => {
  const bindings = buildAutoConfiguredCompositeWorkflowInputBindings(
    [
      { paramName: "name", paramType: "string" },
      { paramName: "age", paramType: "number" },
      { paramName: "flag", paramType: "boolean" },
    ],
    [
      { paramName: "name", paramType: "STRING", sourceNodeId: "up1" },
      { paramName: "age", paramType: "string" },
    ],
    true,
  );
  assert.deepEqual(bindings, [
    {
      mode: "fromUpstream",
      paramName: "name",
      paramPath: ["name"],
      upstreamParamName: "name",
      upstreamParamPath: ["name"],
      sourceNodeId: "up1",
    },
    { mode: "manual", paramName: "age", paramPath: ["age"], value: "" },
    { mode: "manual", paramName: "flag", paramPath: ["flag"], value: "" },
  ]);
});

test("buildAutoConfiguredCompositeWorkflowInputBindings stays manual without upstream", () => {
  const bindings = buildAutoConfiguredCompositeWorkflowInputBindings(
    [{ paramName: "name", paramType: "string" }],
    [{ paramName: "name", paramType: "string" }],
    false,
  );
  assert.deepEqual(bindings, [{ mode: "manual", paramName: "name", paramPath: ["name"], value: "" }]);
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
  assert.equal(isCompositeWorkflowOutputAnchorId("n1_out_body"), true);
  assert.equal(isCompositeWorkflowOutputAnchorId("n1_out_done"), true);
  assert.equal(isCompositeWorkflowOutputAnchorId("n1_out_default"), true);
  assert.equal(isCompositeWorkflowOutputAnchorId("n1_out_case_abc"), true);
  assert.equal(isCompositeWorkflowOutputAnchorId("n1_in"), false);
  assert.equal(isCompositeWorkflowOutputAnchorId(undefined), false);
});

test("parseCompositeWorkflowLoopOutletFromAnchorId maps body and done", () => {
  assert.equal(parseCompositeWorkflowLoopOutletFromAnchorId("lp_out_body"), "body");
  assert.equal(parseCompositeWorkflowLoopOutletFromAnchorId("lp_out_done"), "done");
  assert.equal(parseCompositeWorkflowLoopOutletFromAnchorId("lp_out"), null);
  assert.equal(parseCompositeWorkflowLoopOutletFromAnchorId(undefined), null);
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

test("buildCompositeWorkflowLiteFlowEl serializes FOR DO with done path", () => {
  const result = buildCompositeWorkflowLiteFlowEl(
    [
      { id: "a", kind: "function" },
      { id: "lp", kind: "loop", loopConfig: createDefaultCompositeWorkflowLoopConfig() },
      { id: "body", kind: "function" },
      { id: "after", kind: "function" },
    ],
    [
      { id: "e1", sourceNodeId: "a", targetNodeId: "lp" },
      { id: "e2", sourceNodeId: "lp", targetNodeId: "body", loopOutlet: "body" },
      { id: "e3", sourceNodeId: "lp", targetNodeId: "after", loopOutlet: "done" },
      { id: "e4", sourceNodeId: "body", targetNodeId: "after" },
    ],
  );
  assert.match(result.expression, /FOR\(lp\)\.DO\(/);
  assert.match(result.expression, /body/);
  assert.match(result.expression, /after/);
});

test("buildCompositeWorkflowLiteFlowEl warns when loop body outlet is missing", () => {
  const result = buildCompositeWorkflowLiteFlowEl([{ id: "lp", kind: "loop", loopConfig: createDefaultCompositeWorkflowLoopConfig() }], []);
  assert.equal(result.expression, "lp;");
  assert.ok(result.warnings.some((item) => item.includes("缺少 body")));
});

test("buildCompositeWorkflowLiteFlowEl serializes SWITCH CASE DEFAULT", () => {
  const result = buildCompositeWorkflowLiteFlowEl(
    [
      { id: "a", kind: "function" },
      {
        id: "sw",
        kind: "switch",
        switchConfig: {
          kind: "switch",
          switchOn: { mode: "fromUpstream", upstreamParamName: "status", upstreamParamPath: ["status"] },
          cases: [
            { id: "cid_a", value: "A" },
            { id: "cid_b", value: "B" },
          ],
        },
      },
      { id: "c1", kind: "function" },
      { id: "c2", kind: "function" },
      { id: "d", kind: "function" },
    ],
    [
      { id: "e1", sourceNodeId: "a", targetNodeId: "sw" },
      { id: "e2", sourceNodeId: "sw", targetNodeId: "c1", switchOutlet: "cid_a" },
      { id: "e3", sourceNodeId: "sw", targetNodeId: "c2", switchOutlet: "cid_b" },
      { id: "e4", sourceNodeId: "sw", targetNodeId: "d", switchOutlet: "default" },
    ],
  );
  assert.match(result.expression, /SWITCH\(sw\)\.TO\(/);
  assert.match(result.expression, /CASE\("A", c1\)/);
  assert.match(result.expression, /CASE\("B", c2\)/);
  assert.match(result.expression, /DEFAULT\(d\)/);
});

test("buildCompositeWorkflowLiteFlowEl warns when switch outlets are missing", () => {
  const result = buildCompositeWorkflowLiteFlowEl(
    [
      {
        id: "sw",
        kind: "switch",
        switchConfig: {
          kind: "switch",
          switchOn: { mode: "fromUpstream", upstreamParamName: "x", upstreamParamPath: ["x"] },
          cases: [{ id: "cid_a", value: "A" }],
        },
      },
    ],
    [],
  );
  assert.equal(result.expression, "sw;");
  assert.ok(result.warnings.some((item) => item.includes("缺少 case")));
  assert.ok(result.warnings.some((item) => item.includes("缺少 default")));
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

test("resolveCompositeWorkflowLogicFlowForRender reads valid logicFlow", () => {
  const logicFlow = { nodes: [{ id: "n1" }], edges: [{ id: "e1" }] };
  const resolved = resolveCompositeWorkflowLogicFlowForRender({
    schemaVersion: 1,
    meta: {
      displayName: "编排A",
      functionApi: "comp.a",
      version: "1.0.0",
      ontologySpaceId: 1,
      savedAt: "2026-10-23T00:00:00.000Z",
    },
    graph: { logicFlow },
    nodes: [],
    edges: [],
  });
  assert.deepEqual(resolved, logicFlow);
  assert.equal(resolveCompositeWorkflowLogicFlowForRender(undefined), null);
  assert.equal(resolveCompositeWorkflowLogicFlowForRender({ graph: { logicFlow: { nodes: [] } } }), null);
  assert.equal(resolveCompositeWorkflowLogicFlowForRender({ graph: { logicFlow: null } }), null);
});

test("buildCompositeWorkflowSavePayload assembles schemaVersion 1", () => {
  const payload = buildCompositeWorkflowSavePayload({
    displayName: "编排A",
    functionApi: "comp.a",
    version: "1.0.0",
    ontologySpaceId: 9,
    logicFlowGraph: { nodes: [], edges: [] },
    nodes: [
      {
        id: "n1",
        kind: "loop",
        loopConfig: {
          kind: "loop",
          collection: { mode: "fromUpstream", upstreamParamName: "items", upstreamParamPath: ["items"] },
          itemParamName: "item",
          maxIterations: 100,
        },
      },
    ],
    edges: [{ id: "e1", sourceNodeId: "n1", targetNodeId: "n2", loopOutlet: "body" }],
    savedAt: "2026-10-15T00:00:00.000Z",
  });
  assert.equal(payload.schemaVersion, 1);
  assert.equal(payload.meta.functionApi, "comp.a");
  assert.equal(payload.nodes[0]?.kind, "loop");
  assert.equal(payload.nodes[0]?.kind === "loop" ? payload.nodes[0].config.collection.mode : "", "fromUpstream");
  assert.equal(payload.edges[0]?.loopOutlet, "body");
});

test("createDefaultCompositeWorkflowLoopConfig uses fromUpstream collection", () => {
  const config = createDefaultCompositeWorkflowLoopConfig();
  assert.equal(config.kind, "loop");
  assert.equal(config.collection.mode, "fromUpstream");
  assert.deepEqual(config.collection.upstreamParamPath, []);
  assert.equal(config.itemParamName, "item");
  assert.equal(config.maxIterations, 100);
  assert.equal(config.indexParamName, undefined);
});

test("normalizeCompositeWorkflowLoopConfig migrates manual and fills path", () => {
  assert.deepEqual(normalizeCompositeWorkflowLoopConfig(null), createDefaultCompositeWorkflowLoopConfig());
  const fromManual = normalizeCompositeWorkflowLoopConfig({
    kind: "loop",
    collection: { mode: "manual", jsonText: "[1]" },
    itemParamName: "row",
    maxIterations: 5,
  });
  assert.equal(fromManual.collection.mode, "fromUpstream");
  assert.deepEqual(fromManual.collection.upstreamParamPath, []);
  assert.equal(fromManual.itemParamName, "row");
  assert.equal(fromManual.maxIterations, 5);

  const fromNameOnly = normalizeCompositeWorkflowLoopConfig({
    kind: "loop",
    collection: { mode: "fromUpstream", upstreamParamName: "items" },
    itemParamName: "item",
    indexParamName: "i",
  });
  assert.deepEqual(fromNameOnly.collection.upstreamParamPath, ["items"]);
  assert.equal(fromNameOnly.indexParamName, "i");
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
          mappingMode: "script",
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

  const loopBodyOutputs = resolveCompositeWorkflowNodeUpstreamOutputs(
    [
      {
        id: "lp",
        kind: "loop",
        loopConfig: {
          kind: "loop",
          collection: { mode: "fromUpstream", upstreamParamName: "items", upstreamParamPath: ["items"] },
          itemParamName: "row",
          indexParamName: "idx",
        },
      },
      { id: "down", kind: "function" },
    ],
    [{ id: "e1", sourceNodeId: "lp", targetNodeId: "down", loopOutlet: "body" }],
    "down",
  );
  assert.deepEqual(loopBodyOutputs.upstreamOutputs, [
    { paramName: "row", paramType: "object" },
    { paramName: "idx", paramType: "number" },
  ]);

  const upstreamOutputs = [{ paramName: "items", paramType: "array" }];
  const loopDoneOutputs = resolveCompositeWorkflowNodeUpstreamOutputs(
    [
      { id: "fn", kind: "function", paramsSnapshot: { inputs: [], outputs: upstreamOutputs } },
      {
        id: "lp",
        kind: "loop",
        loopConfig: createDefaultCompositeWorkflowLoopConfig(),
      },
      { id: "after", kind: "function" },
    ],
    [
      { id: "e0", sourceNodeId: "fn", targetNodeId: "lp" },
      { id: "e1", sourceNodeId: "lp", targetNodeId: "after", loopOutlet: "done" },
    ],
    "after",
  );
  assert.deepEqual(loopDoneOutputs.upstreamOutputs, upstreamOutputs);

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

test("loop node registers body and done outlets with labels", () => {
  const source = readFileSync(new URL("../src/views/FunctionOperatorPanel/utils/registerCompositeWorkflowNodes.ts", import.meta.url), "utf8");
  assert.match(source, /registerLoopRectNodeType/);
  assert.match(source, /\$\{id\}_out_body/);
  assert.match(source, /\$\{id\}_out_done/);
  assert.match(source, /循环体/);
  assert.match(source, /结束后/);
  assert.match(source, /CompositeLoopRectView/);
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

test("loop logic dialog selects upstream collection path without manual JSON", () => {
  const dialog = readFileSync(new URL("../src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeLogicNodeDialog.vue", import.meta.url), "utf8");
  assert.match(dialog, /loopCollectionPathKey/);
  assert.match(dialog, /集合（上游输出）/);
  assert.match(dialog, /最大迭代次数/);
  assert.doesNotMatch(dialog, /单项变量名/);
  assert.doesNotMatch(dialog, /索引变量名/);
  assert.doesNotMatch(dialog, /手动 JSON/);
  assert.doesNotMatch(dialog, /jsonText/);
  assert.doesNotMatch(dialog, /loopCollectionMode/);
});

test("createDefaultCompositeWorkflowSwitchConfig has one case and fromUpstream switchOn", () => {
  const config = createDefaultCompositeWorkflowSwitchConfig();
  assert.equal(config.kind, "switch");
  assert.equal(config.switchOn.mode, "fromUpstream");
  assert.deepEqual(config.switchOn.upstreamParamPath, []);
  assert.equal(config.cases.length, 1);
  assert.equal(typeof config.cases[0]?.id, "string");
  assert.ok((config.cases[0]?.id ?? "").length > 0);
  assert.equal(config.cases[0]?.value, "");
});

test("normalizeCompositeWorkflowSwitchConfig fills missing fields and keeps case ids", () => {
  assert.equal(normalizeCompositeWorkflowSwitchConfig(null).kind, "switch");
  const normalized = normalizeCompositeWorkflowSwitchConfig({
    kind: "switch",
    switchOn: { mode: "fromUpstream", upstreamParamName: "status", upstreamParamPath: ["result", "status"] },
    cases: [{ id: "c1", value: "A" }, { value: "B" }, null],
  });
  assert.deepEqual(normalized.switchOn.upstreamParamPath, ["result", "status"]);
  assert.equal(normalized.switchOn.upstreamParamName, "status");
  assert.equal(normalized.cases[0]?.id, "c1");
  assert.equal(normalized.cases[0]?.value, "A");
  assert.equal(normalized.cases[1]?.value, "B");
  assert.ok((normalized.cases[1]?.id ?? "").length > 0);

  const nameOnly = normalizeCompositeWorkflowSwitchConfig({
    kind: "switch",
    switchOn: { mode: "fromUpstream", upstreamParamName: "code" },
    cases: [],
  });
  assert.deepEqual(nameOnly.switchOn.upstreamParamPath, ["code"]);
  assert.equal(nameOnly.cases.length, 1);
});

test("switch outlet anchor helpers encode and parse case and default", () => {
  assert.equal(buildCompositeWorkflowSwitchDefaultOutletAnchorId("n1"), "n1_out_default");
  assert.equal(buildCompositeWorkflowSwitchCaseOutletAnchorId("n1", "abc"), "n1_out_case_abc");
  assert.equal(parseCompositeWorkflowSwitchOutletFromAnchorId("n1_out_default"), "default");
  assert.equal(parseCompositeWorkflowSwitchOutletFromAnchorId("n1_out_case_abc"), "abc");
  assert.equal(parseCompositeWorkflowSwitchOutletFromAnchorId("n1_out_case_"), null);
  assert.equal(parseCompositeWorkflowSwitchOutletFromAnchorId("n1_out"), null);
  assert.equal(parseCompositeWorkflowSwitchOutletFromAnchorId(undefined), null);
});

test("pickClosestAllowedCompositeWorkflowAnchor only snaps to allowed side", () => {
  const anchors = [
    { x: 0, y: 0, id: "n1_in" },
    { x: 100, y: 0, id: "n1_out" },
  ];
  const toInput = pickClosestAllowedCompositeWorkflowAnchor(anchors, { x: 95, y: 0 }, 18, isCompositeWorkflowInputAnchorId);
  assert.equal(toInput, undefined);
  const nearInput = pickClosestAllowedCompositeWorkflowAnchor(anchors, { x: 5, y: 0 }, 18, isCompositeWorkflowInputAnchorId);
  assert.equal(nearInput?.anchor.id, "n1_in");
  const nearOutput = pickClosestAllowedCompositeWorkflowAnchor(anchors, { x: 95, y: 0 }, 18, isCompositeWorkflowOutputAnchorId);
  assert.equal(nearOutput?.anchor.id, "n1_out");
});

test("resolveCompositeWorkflowNodeUpstreamOutputs passes through switch predecessors", () => {
  const outputs = [{ paramName: "result", paramType: "object", fields: [{ paramName: "id", paramType: "string" }] }];
  const nodes = [
    { id: "fn", kind: "function", paramsSnapshot: { inputs: [], outputs } },
    { id: "sw", kind: "switch", switchConfig: createDefaultCompositeWorkflowSwitchConfig() },
    { id: "down", kind: "function", paramsSnapshot: { inputs: [{ paramName: "x", paramType: "string" }], outputs: [] } },
  ];
  const edges = [
    { id: "e1", sourceNodeId: "fn", targetNodeId: "sw" },
    { id: "e2", sourceNodeId: "sw", targetNodeId: "down", switchOutlet: "default" },
  ];
  const resolved = resolveCompositeWorkflowNodeUpstreamOutputs(nodes, edges, "down");
  assert.equal(resolved.hasUpstream, true);
  assert.deepEqual(resolved.upstreamOutputs, outputs);
});

test("switch node registers rect with case and default outlets and labels", () => {
  const source = readFileSync(new URL("../src/views/FunctionOperatorPanel/utils/registerCompositeWorkflowNodes.ts", import.meta.url), "utf8");
  assert.match(source, /composite-switch/);
  assert.match(source, /buildCompositeWorkflowSwitchCaseOutletAnchorId/);
  assert.match(source, /buildCompositeWorkflowSwitchDefaultOutletAnchorId/);
  assert.match(source, /["']default["']/);
  assert.match(source, /switchConfig/);
});

test("workflow dialog lists switch under branch in logic items", () => {
  const dialog = readFileSync(new URL("../src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeWorkflowDialog.vue", import.meta.url), "utf8");
  assert.match(dialog, /nodeKind:\s*["']switch["']/);
  const branchIndex = dialog.indexOf('nodeKind: "branch"');
  const switchIndex = dialog.indexOf('nodeKind: "switch"');
  assert.ok(branchIndex >= 0 && switchIndex > branchIndex);
});

test("switch logic dialog configures switchOn and editable cases", () => {
  const dialog = readFileSync(new URL("../src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeLogicNodeDialog.vue", import.meta.url), "utf8");
  assert.match(dialog, /switchOn|switchPathKey|localKind === ["']switch["']/);
  assert.match(dialog, /cases/);
  assert.match(dialog, /添加.*case|addSwitchCase|增/);
});
