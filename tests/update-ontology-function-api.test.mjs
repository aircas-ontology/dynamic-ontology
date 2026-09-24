import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

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

test("update ontology function types expose the documented request fields", () => {
  const source = readSource("../src/types/apis/updateOntologyFunctionType.ts");
  assert.match(source, /export interface UpdateOntologyFunctionParams/);
  assert.match(source, /functionApi: string/);
  assert.match(source, /displayName: string/);
  assert.match(source, /description: string/);
  assert.match(source, /type: "BASIC_QUERY"/);
  assert.match(source, /ontologySpaceId: number/);
  assert.match(source, /queryConfig\?: CreateOntologyFunctionQueryConfig/);
  assert.match(source, /export type UpdateOntologyFunctionData = null/);
  const barrel = readSource("../src/types/index.ts");
  assert.match(barrel, /UpdateOntologyFunctionData/);
  assert.match(barrel, /UpdateOntologyFunctionParams/);
  assert.match(barrel, /from "\.\/apis\/updateOntologyFunctionType"/);
});

test("update ontology function api puts to ontology function endpoint", () => {
  const source = readSource("../src/apis/functionApi.ts");
  assert.match(source, /updateOntologyFunctionInterface/);
  assert.match(source, /DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/function"/);
  assert.match(source, /method: "put"/);
  assert.match(source, /data: params/);
  const barrel = readSource("../src/apis/index.ts");
  assert.match(barrel, /updateOntologyFunctionInterface/);
  assert.match(barrel, /from "\.\/functionApi"/);
});

test("update ontology function mock mirrors SUCCESS envelope with null data", () => {
  const source = readSource("../src/mocks/updateOntologyFunctionMock/updateOntologyFunctionMock.ts");
  assert.match(source, /export const updateOntologyFunctionMock: ApiResponse<UpdateOntologyFunctionData>/);
  assert.match(source, /code: 200/);
  assert.match(source, /message: "SUCCESS"/);
  assert.match(source, /success: true/);
  assert.match(source, /data: null/);
});

test("function operator workspace edit save calls update api", () => {
  const workspaceSource = readSource("../src/views/OntologySpaceManagementDetail/composables/useFunctionOperatorWorkspace.ts");
  assert.match(workspaceSource, /updateOntologyFunctionInterface/);
  assert.match(workspaceSource, /buildOntologyFunctionQueryConfig/);
  assert.doesNotMatch(workspaceSource, /updateFunctionOperatorMock/);
  assert.match(workspaceSource, /if \(editingOperator\.value\)/);
  assert.match(workspaceSource, /createOntologyFunctionInterface/);
});
