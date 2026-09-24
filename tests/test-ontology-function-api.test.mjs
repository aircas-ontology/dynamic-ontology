import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

import { buildOntologyFunctionTestBindingKeys, buildOntologyFunctionTestRequest } from "../src/utils/mapOntologyFunctionTest.ts";

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
  assert.match(source, /ontologyIdentifier: string/);
  assert.match(source, /variableBindings: Record<string, string>/);
  assert.match(source, /pageNum\?: number/);
  assert.match(source, /pageSize\?: number/);
  assert.match(source, /export type TestOntologyFunctionData = null/);
  const detail = readSource("../src/types/apis/getOntologyFunctionDetailType.ts");
  assert.match(detail, /paramRole\?: string/);
  const barrel = readSource("../src/types/index.ts");
  assert.match(barrel, /TestOntologyFunctionData/);
  assert.match(barrel, /TestOntologyFunctionParams/);
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

test("buildOntologyFunctionTestRequest assembles functionApi ontologyIdentifier and bindings", () => {
  const request = buildOntologyFunctionTestRequest({
    functionApi: "ss",
    ontologyIdentifier: "ont-1",
    bindingKeys: ["target", "age"],
    propertyBindings: { target: "prop_a", age: "prop_b" },
  });
  assert.equal(request.functionApi, "ss");
  assert.equal(request.ontologyIdentifier, "ont-1");
  assert.deepEqual(request.variableBindings, { target: "prop_a", age: "prop_b" });
  assert.equal(request.pageNum, 1);
  assert.equal(request.pageSize, 10);
});

test("function operator openTest loads detail and runTest shows output panel", () => {
  const workspace = readSource("../src/views/OntologySpaceManagementDetail/composables/useFunctionOperatorWorkspace.ts");
  const panel = readSource("../src/views/OntologySpaceManagementDetail/functionOperatorComponents/FunctionOperatorPanel.vue");
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
