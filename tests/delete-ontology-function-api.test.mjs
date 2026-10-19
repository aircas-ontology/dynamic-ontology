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

test("delete ontology function types expose functionApi version and null data", () => {
  const source = readSource("../src/types/apis/deleteOntologyFunctionType.ts");
  assert.match(source, /export interface DeleteOntologyFunctionParams/);
  assert.match(source, /functionApi: string/);
  assert.match(source, /version: string/);
  assert.match(source, /export type DeleteOntologyFunctionData = null/);
  const barrel = readSource("../src/types/index.ts");
  assert.match(barrel, /DeleteOntologyFunctionData/);
  assert.match(barrel, /DeleteOntologyFunctionParams/);
  assert.match(barrel, /deleteOntologyFunctionType/);
});

test("delete ontology function api deletes with functionApi and version query", () => {
  const source = readSource("../src/apis/functionApi.ts");
  assert.match(source, /deleteOntologyFunctionInterface/);
  assert.match(source, /DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/function\/delete"/);
  assert.match(source, /method: "delete"/);
  const deleteFn = source.match(/export function deleteOntologyFunctionInterface[\s\S]*?\n\}/);
  assert.ok(deleteFn, "missing deleteOntologyFunctionInterface implementation");
  assert.match(deleteFn[0], /\bparams,/);
  assert.doesNotMatch(deleteFn[0], /\bdata:/);
  assert.doesNotMatch(deleteFn[0], /encodeURIComponent\(params\.functionApi\)/);
  const barrel = readSource("../src/apis/index.ts");
  assert.match(barrel, /deleteOntologyFunctionInterface/);
  assert.match(barrel, /from "\.\/functionApi"/);
});

test("delete ontology function mock mirrors SUCCESS envelope with null data", () => {
  const source = readSource("../src/mocks/deleteOntologyFunctionMock/deleteOntologyFunctionMock.ts");
  assert.match(source, /export const deleteOntologyFunctionMock: ApiResponse<DeleteOntologyFunctionData>/);
  assert.match(source, /code: 200/);
  assert.match(source, /message: "SUCCESS"/);
  assert.match(source, /success: true/);
  assert.match(source, /data: null/);
});

test("function operator workspace removeOperator calls delete api for card and table", () => {
  const workspace = readSource("../src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts");
  const panel = readSource("../src/views/FunctionOperatorPanel/index.vue");
  const dialog = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorDeleteDialog.vue");
  assert.match(workspace, /deleteOntologyFunctionInterface\(\{ functionApi, version \}\)/);
  assert.match(workspace, /缺少函数版本，无法删除/);
  assert.match(workspace, /openDeleteOperator/);
  assert.match(workspace, /confirmDeleteOperator/);
  assert.doesNotMatch(workspace, /ElMessageBox/);
  assert.doesNotMatch(workspace, /deleteFunctionOperatorMock/);
  assert.match(panel, /FunctionOperatorDeleteDialog/);
  assert.match(panel, /@click="openDeleteOperator\(operator\)"/);
  assert.match(panel, /@click\.stop="openDeleteOperator\(asOperator\(row\)\)"/);
  assert.match(dialog, /<el-dialog\b/);
  assert.match(dialog, /确认删除/);
});
