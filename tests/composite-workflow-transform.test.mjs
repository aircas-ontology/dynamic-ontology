import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  COMPOSITE_WORKFLOW_TRANSFORM_DEFAULT_CODE,
  createDefaultCompositeWorkflowTransformConfig,
  mapParsedScriptParametersToCompositeBriefs,
  resolveCompositeWorkflowTransformOutputs,
} from "../src/views/FunctionOperatorPanel/utils/compositeWorkflowTransformDefaults.ts";

/**
 * @description 读取仓库源文件。
 * @param relativePath 相对路径。
 * @returns 文件文本。
 */
function readSource(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

test("transform default config is typescript with user script template", () => {
  const config = createDefaultCompositeWorkflowTransformConfig();
  assert.equal(config.language, "typescript");
  assert.equal(config.code, COMPOSITE_WORKFLOW_TRANSFORM_DEFAULT_CODE);
  assert.match(config.code, /export function handle\(input: User\): Output/);
  assert.deepEqual(config.paramsSnapshot, { inputs: [], outputs: [] });
  assert.deepEqual(config.inputBindings, []);
});

test("resolveCompositeWorkflowTransformOutputs prefers paramsSnapshot tree", () => {
  const outputs = resolveCompositeWorkflowTransformOutputs({
    kind: "transform",
    language: "typescript",
    code: "",
    paramsSnapshot: {
      inputs: [],
      outputs: [{ paramName: "Output", paramType: "object", fields: [{ paramName: "name", paramType: "string" }] }],
    },
    outputKeys: ["legacy"],
  });
  assert.deepEqual(outputs, [{ paramName: "Output", paramType: "object", fields: [{ paramName: "name", paramType: "string" }] }]);
});

test("mapParsedScriptParametersToCompositeBriefs keeps nested fields", () => {
  const briefs = mapParsedScriptParametersToCompositeBriefs([
    {
      paramName: "Output",
      paramType: "OBJECT",
      category: "OUTPUT",
      paramOrder: 1,
      referenceType: "",
      fields: [{ paramName: "name", paramType: "STRING", category: "OUTPUT", paramOrder: 1, referenceType: "" }],
    },
  ]);
  assert.deepEqual(briefs, [{ paramName: "Output", paramType: "OBJECT", fields: [{ paramName: "name", paramType: "STRING" }] }]);
});

test("transform dialog parses on confirm and uses script code editor", () => {
  const dialog = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeTransformNodeDialog.vue");
  assert.match(dialog, /postParseOntologyFunctionParamsInterface/);
  assert.match(dialog, /FunctionOperatorScriptCodeEditor/);
  assert.match(dialog, /language="typescript"/);
  assert.match(dialog, /mapScriptLanguageToApi\("typescript"\)/);
  assert.doesNotMatch(dialog, /javascript/);
  assert.doesNotMatch(dialog, /outputKeys/);
});

test("transform dialog footer exposes parse button beside confirm", () => {
  const dialog = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeTransformNodeDialog.vue");
  assert.match(dialog, />\s*解析\s*</);
  assert.match(dialog, /onParseTransformScriptClick/);
  assert.match(dialog, /parseTransformScript/);
  assert.match(dialog, /ElMessage\.success\(["']解析成功["']\)/);
  assert.match(dialog, /点击解析识别脚本输入输出/);
  assert.doesNotMatch(dialog, /点击确定将解析/);
});

test("canvas opens dedicated transform edit context", () => {
  const canvas = readSource("../src/views/FunctionOperatorPanel/composables/useCompositeWorkflowCanvas.ts");
  assert.match(canvas, /openTransformNodeEdit/);
  assert.match(canvas, /transformNodeEdit/);
  assert.match(canvas, /createDefaultCompositeWorkflowTransformConfig/);
  assert.match(canvas, /resolveCompositeWorkflowNodeUpstreamOutputs/);
  assert.doesNotMatch(canvas, /language: "javascript"/);
  const graph = readSource("../src/views/FunctionOperatorPanel/utils/compositeWorkflowGraph.ts");
  assert.match(graph, /resolveCompositeWorkflowTransformOutputs/);
});
