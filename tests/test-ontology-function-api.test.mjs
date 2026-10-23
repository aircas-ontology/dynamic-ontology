import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

import {
  buildOntologyFunctionScriptTestInputRows,
  buildOntologyFunctionScriptTestRequest,
  buildOntologyFunctionTestBindingKeys,
  buildOntologyFunctionTestRequest,
} from "../src/utils/mapOntologyFunctionTest.ts";

/**
 * @description 读取相对 tests 目录的源文件文本。
 * @param relativePath 相对路径。
 * @returns 文件内容。
 */
const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("test ontology function types expose documented request fields and null data", () => {
  const source = readSource("../src/types/apis/testOntologyFunctionType.ts");
  assert.match(source, /export interface TestOntologyFunctionParams/);
  assert.match(source, /functionApi: string/);
  assert.match(source, /version: string/);
  assert.match(source, /ontologyIdentifier\?: string/);
  assert.match(source, /variableBindings\?: Record<string, string>/);
  assert.match(source, /parameters\?: TestOntologyFunctionParameterItem\[\]/);
  assert.match(source, /pageNum\?: number/);
  assert.match(source, /pageSize\?: number/);
  assert.match(source, /export interface TestOntologyFunctionParameterItem/);
  assert.match(source, /paramName: string/);
  assert.match(source, /paramValue\?: string/);
  assert.match(source, /fields\?: TestOntologyFunctionParameterItem\[\]/);
  assert.match(source, /export type TestOntologyFunctionData = null/);
  const detail = readSource("../src/types/apis/getOntologyFunctionDetailType.ts");
  assert.match(detail, /paramRole\?: string/);
  const barrel = readSource("../src/types/index.ts");
  assert.match(barrel, /TestOntologyFunctionData/);
  assert.match(barrel, /TestOntologyFunctionParams/);
  assert.match(barrel, /TestOntologyFunctionParameterItem/);
  assert.match(barrel, /testOntologyFunctionType/);
});

test("test ontology function api posts to ontology function test endpoint", () => {
  const source = readSource("../src/apis/functionApi.ts");
  assert.match(source, /testOntologyFunctionInterface/);
  assert.match(source, /DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/function\/test"/);
  assert.match(source, /method: "post"/);
  assert.match(source, /data: params/);
  const barrel = readSource("../src/apis/index.ts");
  assert.match(barrel, /testOntologyFunctionInterface/);
});

test("test ontology function mock mirrors 查询成功 envelope with null data", () => {
  const source = readSource("../src/mocks/testOntologyFunctionMock/testOntologyFunctionMock.ts");
  assert.match(source, /export const testOntologyFunctionMock/);
  assert.match(source, /code: 200/);
  assert.match(source, /message: "查询成功"/);
  assert.match(source, /success: true/);
  assert.match(source, /data: null/);
});

test("buildOntologyFunctionTestBindingKeys puts AGGREGATION first then FILTER names", () => {
  const keys = buildOntologyFunctionTestBindingKeys([
    { paramId: 25, paramName: "xingbie", paramType: "STRING", category: "INPUT", paramOrder: 1, description: "", paramRole: "FILTER" },
    { paramId: 26, paramName: "age", paramType: "STRING", category: "INPUT", paramOrder: 2, description: "", paramRole: "FILTER" },
    { paramId: 27, paramName: "target", paramType: "STRING", category: "INPUT", paramOrder: 3, description: "", paramRole: "AGGREGATION" },
  ]);
  assert.deepEqual(keys, ["target", "xingbie", "age"]);
});

test("buildOntologyFunctionTestRequest assembles functionApi version ontologyIdentifier and bindings", () => {
  const request = buildOntologyFunctionTestRequest({
    functionApi: "ss",
    version: "1.0.0",
    ontologyIdentifier: "ont-1",
    bindingKeys: ["target", "age"],
    propertyBindings: { target: "prop_a", age: "prop_b" },
  });
  assert.equal(request.functionApi, "ss");
  assert.equal(request.version, "1.0.0");
  assert.equal(request.ontologyIdentifier, "ont-1");
  assert.deepEqual(request.variableBindings, { target: "prop_a", age: "prop_b" });
  assert.equal(request.pageNum, 1);
  assert.equal(request.pageSize, 10);
});

test("buildOntologyFunctionScriptTestInputRows keeps INPUT only sorted by paramOrder", () => {
  const rows = buildOntologyFunctionScriptTestInputRows([
    { paramId: 1, paramName: "b", paramType: "STRING", category: "INPUT", paramOrder: 2 },
    { paramId: 2, paramName: "out", paramType: "STRING", category: "OUTPUT", paramOrder: 1 },
    { paramId: 3, paramName: "a", paramType: "NUMBER", category: "input", paramOrder: 1 },
  ]);
  assert.deepEqual(rows, [
    { paramName: "a", paramType: "NUMBER", paramValue: "" },
    { paramName: "b", paramType: "STRING", paramValue: "" },
  ]);
});

test("buildOntologyFunctionScriptTestInputRows keeps nested fields and leaf values", () => {
  const rows = buildOntologyFunctionScriptTestInputRows([
    {
      paramName: "input",
      paramType: "OBJECT",
      category: "INPUT",
      paramOrder: 2,
      fields: [
        { paramName: "b", paramType: "LIST", category: "INPUT", paramOrder: 2 },
        {
          paramName: "a",
          paramType: "OBJECT",
          category: "INPUT",
          paramOrder: 1,
          fields: [{ paramName: "aa", paramType: "STRING", category: "INPUT", paramOrder: 1, fields: [] }],
        },
      ],
    },
    { paramName: "age", paramType: "DOUBLE", category: "INPUT", paramOrder: 1 },
    {
      paramName: "out",
      paramType: "OBJECT",
      category: "OUTPUT",
      paramOrder: 1,
      fields: [{ paramName: "id", paramType: "DOUBLE", category: "OUTPUT", paramOrder: 1 }],
    },
  ]);
  assert.deepEqual(rows, [
    { paramName: "age", paramType: "DOUBLE", paramValue: "" },
    {
      paramName: "input",
      paramType: "OBJECT",
      fields: [
        {
          paramName: "a",
          paramType: "OBJECT",
          fields: [{ paramName: "aa", paramType: "STRING", paramValue: "" }],
        },
        { paramName: "b", paramType: "LIST", paramValue: "" },
      ],
    },
  ]);
});

test("buildOntologyFunctionScriptTestRequest keeps nested fields and leaf values", () => {
  const request = buildOntologyFunctionScriptTestRequest({
    functionApi: "smoke.hello.ts",
    version: "1.0.0",
    rows: [
      {
        paramName: "input",
        paramType: "OBJECT",
        fields: [
          {
            paramName: "a",
            paramType: "OBJECT",
            fields: [{ paramName: "aa", paramType: "STRING", paramValue: "leaf" }],
          },
        ],
      },
    ],
  });
  assert.deepEqual(request.parameters, [
    {
      paramName: "input",
      fields: [{ paramName: "a", fields: [{ paramName: "aa", paramValue: "leaf" }] }],
    },
  ]);
});

test("buildOntologyFunctionScriptTestRequest assembles functionApi version and parameters", () => {
  const request = buildOntologyFunctionScriptTestRequest({
    functionApi: "smoke.hello.py",
    version: "1.0.0",
    rows: [{ paramName: "name", paramType: "STRING", paramValue: "foundry" }],
  });
  assert.deepEqual(request, {
    functionApi: "smoke.hello.py",
    version: "1.0.0",
    parameters: [{ paramName: "name", paramValue: "foundry" }],
  });
});

test("function operator openTest loads detail and runTest shows output panel", () => {
  const workspace = readSource("../src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts");
  const panel = readSource("../src/views/FunctionOperatorPanel/index.vue");
  assert.match(workspace, /getOntologyFunctionDetailInterface/);
  assert.match(workspace, /testOntologyFunctionInterface/);
  assert.match(workspace, /async function openTest/);
  assert.match(workspace, /buildOntologyFunctionTestBindingKeys/);
  assert.match(workspace, /getOntologyCategoryTreeInterface/);
  assert.match(workspace, /getOntologyPropertyByOntologyIdInterface/);
  assert.match(workspace, /async function runTest/);
  assert.match(workspace, /testOutput\.value\s*=/);
  assert.match(workspace, /ElMessage\.success\("测试成功"\)/);
  assert.doesNotMatch(workspace, /testFunctionOperatorMock/);
  assert.match(panel, /function-operator-test/);
  assert.match(panel, /选择对象/);
  assert.match(panel, /输出结果/);
  assert.match(panel, /function-operator-test__io/);
  assert.match(panel, /width="960px"/);
  assert.doesNotMatch(panel, /function-operator-panel__test-result/);
});

test("function operator script test uses dedicated dialog and parameters body", () => {
  const workspace = readSource("../src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts");
  const panel = readSource("../src/views/FunctionOperatorPanel/index.vue");
  const dialog = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorScriptTestDialog.vue");
  assert.match(workspace, /isScriptFunctionOperator/);
  assert.match(workspace, /type === "code"/);
  assert.match(workspace, /type === "api"/);
  assert.match(workspace, /type === "docker"/);
  assert.match(workspace, /type === "composite"/);
  assert.match(workspace, /apiModelType === "CUSTOMIZE"/);
  assert.match(workspace, /apiModelType === "EXTERNAL"/);
  assert.match(workspace, /apiModelType === "CONTAINER"/);
  assert.match(workspace, /apiModelType === "COMPOSITE"/);
  assert.match(dialog, /外部 API 函数测试/);
  assert.match(dialog, /容器算子测试/);
  assert.match(dialog, /函数编排测试/);

  assert.match(panel, /:function-type="scriptTestingOperator\?\.type/);
  assert.match(workspace, /async function openScriptTest/);
  assert.match(workspace, /async function runScriptTest/);
  assert.match(workspace, /buildOntologyFunctionScriptTestInputRows/);
  assert.match(workspace, /buildOntologyFunctionScriptTestRequest/);
  assert.match(workspace, /updateScriptTestParamValue/);
  assert.match(dialog, /脚本函数测试/);
  assert.match(dialog, /执行结果/);
  assert.match(dialog, /FunctionOperatorScriptTestParamTree/);
  const tree = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorScriptTestParamTree.vue");
  assert.match(tree, /formatScriptTestParamLabel/);
  assert.match(tree, /row\.fields && row\.fields\.length > 0/);
  assert.match(workspace, /function updateScriptTestParamValue\(path: number\[\], paramValue: string\)/);
  assert.match(panel, /FunctionOperatorScriptTestDialog/);
  assert.match(panel, /scriptTestVisible/);
  assert.match(panel, /runScriptTest/);
});
