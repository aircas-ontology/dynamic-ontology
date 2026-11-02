import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildCompositeWorkflowRestoreGraphData,
  compileCompositeWorkflowToBackendConfig,
} from "../src/views/FunctionOperatorPanel/utils/compositeWorkflowBackendConfig.ts";

test("compileCompositeWorkflowToBackendConfig maps function chain with bindings and control edges", () => {
  const config = compileCompositeWorkflowToBackendConfig({
    nodes: [
      {
        id: "n_input",
        kind: "function",
        functionApi: "demo.op.parseNumber",
        version: "1.0.0",
        displayName: "起点",
        inputBindings: [{ mode: "manual", paramName: "text", paramPath: ["text"], value: "21" }],
      },
      {
        id: "n_double",
        kind: "function",
        functionApi: "demo.op.doubleit",
        version: "1.0.0",
        displayName: "翻倍",
        inputBindings: [{ mode: "fromUpstream", paramName: "numInput", paramPath: ["numInput"], upstreamParamName: "result", upstreamParamPath: ["result"] }],
      },
    ],
    edges: [{ id: "edge_1", sourceNodeId: "n_input", targetNodeId: "n_double" }],
    logicFlowGraph: { nodes: [{ id: "n_input" }], edges: [] },
  });

  assert.equal(config.nodes.length, 2);
  const first = config.nodes[0];
  assert.equal(first.kind, "function");
  assert.equal(first.functionId, "demo.op.parseNumber");
  assert.equal(first.functionVersion, "1.0.0");
  assert.equal(first.label, "起点");
  assert.deepEqual(first.inputDefaults, { text: "21" });

  const controlEdge = config.edges.find((edge) => edge.targetParameterId === "__flow_in__");
  assert.ok(controlEdge);
  assert.equal(controlEdge.sourceNodeId, "n_input");
  assert.equal(controlEdge.targetNodeId, "n_double");
  assert.equal(controlEdge.sourceParameterId, "__flow_out__");

  const dataEdge = config.edges.find((edge) => edge.targetParameterId === "numInput");
  assert.ok(dataEdge);
  assert.equal(dataEdge.sourceNodeId, "n_input");
  assert.equal(dataEdge.sourceParameterId, "result");

  assert.deepEqual(config.graph, { nodes: [{ id: "n_input" }], edges: [] });
});

test("compileCompositeWorkflowToBackendConfig maps tail function node to external output", () => {
  const config = compileCompositeWorkflowToBackendConfig({
    nodes: [
      { id: "a", kind: "function", functionApi: "op.a", version: "1.0.0", inputBindings: [] },
      {
        id: "b",
        kind: "function",
        functionApi: "op.b",
        version: "1.0.0",
        inputBindings: [],
        paramsSnapshot: { inputs: [], outputs: [{ paramName: "result", paramType: "DOUBLE" }] },
      },
    ],
    edges: [{ id: "e1", sourceNodeId: "a", targetNodeId: "b" }],
    logicFlowGraph: null,
  });

  assert.equal(config.outputMappings.length, 1);
  assert.equal(config.outputMappings[0].nodeId, "b");
  assert.equal(config.outputMappings[0].nodeParameterId, "result");
  assert.equal(config.outputParameters.length, 1);
  assert.equal(config.outputParameters[0].name, "result");
  assert.equal(config.outputParameters[0].type, "number");
});

test("compileCompositeWorkflowToBackendConfig keeps object type when params snapshot missing", () => {
  const config = compileCompositeWorkflowToBackendConfig({
    nodes: [{ id: "a", kind: "function", functionApi: "op.a", version: "1.0.0", inputBindings: [] }],
    edges: [],
    logicFlowGraph: null,
  });
  assert.equal(config.outputParameters[0].type, "object");
});

test("compileCompositeWorkflowToBackendConfig maps branch node and branch ports", () => {
  const config = compileCompositeWorkflowToBackendConfig({
    nodes: [
      { id: "src", kind: "function", functionApi: "op.src", version: "1.0.0", inputBindings: [] },
      {
        id: "br",
        kind: "branch",
        branchConfig: {
          kind: "branch",
          left: { mode: "fromUpstream", upstreamParamName: "result", upstreamParamPath: ["result"] },
          operator: "gt",
          right: { mode: "manual", value: "5" },
        },
      },
      { id: "t", kind: "function", functionApi: "op.t", version: "1.0.0", inputBindings: [] },
    ],
    edges: [
      { id: "e1", sourceNodeId: "src", targetNodeId: "br" },
      { id: "e2", sourceNodeId: "br", targetNodeId: "t", branch: "true" },
    ],
    logicFlowGraph: null,
  });

  const branchNode = config.nodes.find((node) => node.id === "br");
  assert.ok(branchNode && branchNode.branchConfig);
  assert.equal(branchNode.branchConfig.expression, "value > 5");

  const dataEdgeToBranch = config.edges.find((edge) => edge.targetNodeId === "br" && edge.targetParameterId === "value");
  assert.ok(dataEdgeToBranch);
  assert.equal(dataEdgeToBranch.sourceNodeId, "src");
  assert.equal(dataEdgeToBranch.sourceParameterId, "result");

  const branchEdge = config.edges.find((edge) => edge.sourceNodeId === "br" && edge.targetParameterId === "__flow_in__");
  assert.ok(branchEdge);
  assert.equal(branchEdge.sourceParameterId, "true");
});

test("compileCompositeWorkflowToBackendConfig maps loop and transform nodes", () => {
  const config = compileCompositeWorkflowToBackendConfig({
    nodes: [
      { id: "l1", kind: "loop", loopConfig: { kind: "loop", collection: { mode: "manual", jsonText: "[]" }, itemParamName: "item", maxIterations: 3 } },
      {
        id: "t1",
        kind: "transform",
        transformConfig: { kind: "transform", mappingMode: "script", language: "typescript", code: "return { num: 1 }" },
      },
    ],
    edges: [{ id: "e1", sourceNodeId: "l1", targetNodeId: "t1" }],
    logicFlowGraph: null,
  });

  const loopNode = config.nodes.find((node) => node.id === "l1");
  assert.ok(loopNode && loopNode.loopConfig);
  assert.equal(loopNode.loopConfig.mode, "times");
  assert.equal(loopNode.loopConfig.times, 3);
  assert.equal(loopNode.loopConfig.itemName, "item");

  const transformNode = config.nodes.find((node) => node.id === "t1");
  assert.ok(transformNode && transformNode.transformConfig);
  assert.equal(transformNode.transformConfig.mappingMode, "script");
  assert.equal(transformNode.transformConfig.language, "typescript");
  assert.equal(transformNode.transformConfig.script, "return { num: 1 }");
  assert.equal(transformNode.transformConfig.mappings, undefined);
});

test("compileCompositeWorkflowToBackendConfig maps json transform mappings", () => {
  const mappings = [{ outputField: "name", mappingType: "direct", inputPath: "user.name" }];
  const config = compileCompositeWorkflowToBackendConfig({
    nodes: [
      {
        id: "t1",
        kind: "transform",
        transformConfig: { kind: "transform", mappingMode: "json", mappings },
      },
    ],
    edges: [],
    logicFlowGraph: null,
  });
  const transformNode = config.nodes.find((node) => node.id === "t1");
  assert.ok(transformNode && transformNode.transformConfig);
  assert.equal(transformNode.transformConfig.mappingMode, "json");
  assert.deepEqual(transformNode.transformConfig.mappings, mappings);
  assert.equal(transformNode.transformConfig.language, undefined);
  assert.equal(transformNode.transformConfig.script, undefined);
});

test("compileCompositeWorkflowToBackendConfig maps switch node and switch/loop outlet ports", () => {
  const config = compileCompositeWorkflowToBackendConfig({
    nodes: [
      { id: "src", kind: "function", functionApi: "op.src", version: "1.0.0", inputBindings: [] },
      {
        id: "sw",
        kind: "switch",
        switchConfig: {
          kind: "switch",
          switchOn: { mode: "fromUpstream", upstreamParamName: "result", upstreamParamPath: ["result"] },
          cases: [{ id: "case_a", value: "A" }],
        },
      },
      {
        id: "lp",
        kind: "loop",
        loopConfig: { kind: "loop", collection: { mode: "fromUpstream", upstreamParamName: "items", upstreamParamPath: ["items"] }, itemParamName: "item" },
      },
      { id: "body", kind: "function", functionApi: "op.body", version: "1.0.0", inputBindings: [] },
      { id: "done", kind: "function", functionApi: "op.done", version: "1.0.0", inputBindings: [] },
    ],
    edges: [
      { id: "e1", sourceNodeId: "src", targetNodeId: "sw" },
      { id: "e2", sourceNodeId: "sw", targetNodeId: "lp", switchOutlet: "case_a" },
      { id: "e3", sourceNodeId: "lp", targetNodeId: "body", loopOutlet: "body" },
      { id: "e4", sourceNodeId: "lp", targetNodeId: "done", loopOutlet: "done" },
    ],
    logicFlowGraph: null,
  });

  const switchNode = config.nodes.find((node) => node.id === "sw");
  assert.ok(switchNode);
  assert.equal(switchNode.kind, "switch");
  assert.equal(switchNode.switchConfig.switchOnPath, "result");
  assert.deepEqual(switchNode.switchConfig.cases, [{ id: "case_a", value: "A" }]);

  const switchEdge = config.edges.find((edge) => edge.id === "e2");
  assert.ok(switchEdge);
  assert.equal(switchEdge.sourceParameterId, "case_a");

  const bodyEdge = config.edges.find((edge) => edge.id === "e3");
  assert.ok(bodyEdge);
  assert.equal(bodyEdge.sourceParameterId, "body");

  const doneEdge = config.edges.find((edge) => edge.id === "e4");
  assert.ok(doneEdge);
  assert.equal(doneEdge.sourceParameterId, "done");
});

test("compileCompositeWorkflowToBackendConfig keeps backend raw expression and foreach loop", () => {
  const config = compileCompositeWorkflowToBackendConfig({
    nodes: [
      {
        id: "br",
        kind: "branch",
        branchConfig: {
          kind: "branch",
          left: { mode: "fromUpstream", upstreamParamName: "result", upstreamParamPath: ["result"] },
          operator: "gt",
          right: { mode: "manual", value: "5" },
          rawExpression: "value.size > 4",
        },
      },
      {
        id: "l1",
        kind: "loop",
        loopConfig: { kind: "loop", collection: { mode: "fromUpstream", upstreamParamName: "result" }, itemParamName: "item" },
      },
    ],
    edges: [{ id: "e1", sourceNodeId: "br", targetNodeId: "l1" }],
    logicFlowGraph: null,
  });

  const branchNode = config.nodes.find((node) => node.id === "br");
  assert.ok(branchNode && branchNode.branchConfig);
  assert.equal(branchNode.branchConfig.expression, "value.size > 4");

  const loopNode = config.nodes.find((node) => node.id === "l1");
  assert.ok(loopNode && loopNode.loopConfig);
  assert.equal(loopNode.loopConfig.mode, "foreach");
  assert.equal(loopNode.loopConfig.collectionPath, "result");
});

test("buildCompositeWorkflowRestoreGraphData restores logic node configs from data edges", () => {
  const restored = buildCompositeWorkflowRestoreGraphData({
    nodes: [
      { id: "src", kind: "function", functionId: "op.src", inputDefaults: {} },
      { id: "l1", kind: "loop", loopConfig: { mode: "foreach", collectionPath: "result", itemName: "item" } },
      { id: "br", kind: "branch", branchConfig: { expression: "value.size > 4" } },
      { id: "t1", kind: "transform", transformConfig: { language: "groovy", script: "// @in payload:object" } },
    ],
    edges: [
      { id: "e1", sourceNodeId: "src", sourceParameterId: "__flow_out__", targetNodeId: "l1", targetParameterId: "__flow_in__" },
      { id: "e2", sourceNodeId: "src", sourceParameterId: "result", targetNodeId: "l1", targetParameterId: "collection" },
      { id: "e3", sourceNodeId: "l1", sourceParameterId: "__flow_out__", targetNodeId: "br", targetParameterId: "__flow_in__" },
      { id: "e4", sourceNodeId: "l1", sourceParameterId: "result", targetNodeId: "br", targetParameterId: "value" },
      { id: "e5", sourceNodeId: "br", sourceParameterId: "true", targetNodeId: "t1", targetParameterId: "__flow_in__" },
      { id: "e6", sourceNodeId: "br", sourceParameterId: "true", targetNodeId: "t1", targetParameterId: "payload" },
    ],
    inputMappings: [],
    outputMappings: [],
    inputParameters: [],
    outputParameters: [],
  });

  const loopProps = restored.nodes.find((n) => n.id === "l1").properties;
  assert.equal(loopProps.loopConfig.collection.mode, "fromUpstream");
  assert.equal(loopProps.loopConfig.collection.upstreamParamName, "result");

  const branchProps = restored.nodes.find((n) => n.id === "br").properties;
  assert.equal(branchProps.branchConfig.left.upstreamParamName, "result");
  assert.equal(branchProps.branchConfig.rawExpression, "value.size > 4");

  const transformProps = restored.nodes.find((n) => n.id === "t1").properties;
  assert.equal(transformProps.transformConfig.mappingMode, "script");
  assert.equal(transformProps.transformConfig.language, "groovy");
  assert.equal(transformProps.transformConfig.code, "// @in payload:object");
  assert.equal(transformProps.transformConfig.inputBindings.length, 1);
  assert.equal(transformProps.transformConfig.inputBindings[0].upstreamParamName, "true");
});

test("buildCompositeWorkflowRestoreGraphData returns raw graph when present", () => {
  const raw = { nodes: [{ id: "a", type: "composite-function", x: 1, y: 2, properties: { kind: "function" } }], edges: [] };
  const restored = buildCompositeWorkflowRestoreGraphData({
    nodes: [],
    edges: [],
    inputMappings: [],
    outputMappings: [],
    inputParameters: [],
    outputParameters: [],
    graph: raw,
  });
  assert.deepEqual(restored, raw);
});

test("buildCompositeWorkflowRestoreGraphData rebuilds nodes and control edges without graph", () => {
  const restored = buildCompositeWorkflowRestoreGraphData({
    nodes: [
      { id: "n_input", kind: "function", functionId: "demo.op.parseNumber", functionVersion: "1.0.0", label: "起点", inputDefaults: { text: "21" } },
      { id: "n_double", kind: "function", functionId: "demo.op.doubleit", inputDefaults: {} },
    ],
    edges: [
      { id: "e_d", sourceNodeId: "n_input", sourceParameterId: "result", targetNodeId: "n_double", targetParameterId: "numInput" },
      { id: "e_c", sourceNodeId: "n_input", sourceParameterId: "__flow_out__", targetNodeId: "n_double", targetParameterId: "__flow_in__" },
    ],
    inputMappings: [],
    outputMappings: [],
    inputParameters: [],
    outputParameters: [],
  });

  assert.equal(restored.nodes.length, 2);
  const first = restored.nodes[0];
  assert.equal(first.type, "composite-function");
  assert.equal(first.properties.functionApi, "demo.op.parseNumber");
  assert.equal(first.properties.displayName, "起点");
  assert.equal(first.properties.kind, "function");
  const binding = first.properties.inputBindings[0];
  assert.equal(binding.mode, "manual");
  assert.equal(binding.paramName, "text");
  assert.equal(binding.value, "21");

  const downstream = restored.nodes[1];
  const upstreamBinding = downstream.properties.inputBindings[0];
  assert.equal(upstreamBinding.mode, "fromUpstream");
  assert.equal(upstreamBinding.paramName, "numInput");
  assert.equal(upstreamBinding.upstreamParamName, "result");

  assert.equal(restored.edges.length, 1);
  assert.equal(restored.edges[0].id, "e_c");
  assert.equal(restored.edges[0].type, "polyline");
  assert.equal(restored.edges[0].properties.branch, undefined);
});

test("buildCompositeWorkflowRestoreGraphData falls back to data edges when no control edges exist", () => {
  const restored = buildCompositeWorkflowRestoreGraphData({
    nodes: [
      { id: "a", kind: "function", functionId: "op.a", inputDefaults: {} },
      { id: "b", kind: "function", functionId: "op.b", inputDefaults: {} },
    ],
    edges: [
      { id: "d1", sourceNodeId: "a", sourceParameterId: "result", targetNodeId: "b", targetParameterId: "x" },
      { id: "d2", sourceNodeId: "a", sourceParameterId: "result", targetNodeId: "b", targetParameterId: "x" },
    ],
    inputMappings: [],
    outputMappings: [],
    inputParameters: [],
    outputParameters: [],
  });

  assert.equal(restored.edges.length, 1);
  assert.equal(restored.edges[0].id, "d1");
  assert.equal(restored.edges[0].sourceNodeId, "a");
  assert.equal(restored.edges[0].targetNodeId, "b");
});
