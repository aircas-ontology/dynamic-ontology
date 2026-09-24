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

test("delete ontology function types expose functionApi path param and null data", () => {
  const source = readSource("../src/types/apis/deleteOntologyFunctionType.ts");
  assert.match(source, /export interface DeleteOntologyFunctionParams/);
  assert.match(source, /functionApi: string/);
  assert.match(source, /export type DeleteOntologyFunctionData = null/);
  const barrel = readSource("../src/types/index.ts");
  assert.match(barrel, /DeleteOntologyFunctionData/);
  assert.match(barrel, /DeleteOntologyFunctionParams/);
  assert.match(barrel, /deleteOntologyFunctionType/);
});

test("delete ontology function api deletes by functionApi path segment", () => {
  const source = readSource("../src/apis/functionApi.ts");
  assert.match(source, /deleteOntologyFunctionInterface/);
  assert.match(source, /DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ `\/ontology\/function\/delete\/\$\{encodeURIComponent\(params\.functionApi\)\}`/);
  assert.match(source, /method: "delete"/);
  const deleteFn = source.match(/export function deleteOntologyFunctionInterface[\s\S]*?\n\}/);
  assert.ok(deleteFn, "missing deleteOntologyFunctionInterface implementation");
  assert.doesNotMatch(deleteFn[0], /\bdata:/);
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
  const workspace = readSource("../src/views/OntologySpaceManagementDetail/composables/useFunctionOperatorWorkspace.ts");
  const panel = readSource("../src/views/OntologySpaceManagementDetail/functionOperatorComponents/FunctionOperatorPanel.vue");
  const dialog = readSource("../src/views/OntologySpaceManagementDetail/functionOperatorComponents/FunctionOperatorDeleteDialog.vue");
  assert.match(workspace, /deleteOntologyFunctionInterface/);
  assert.match(workspace, /openDeleteOperator/);
  assert.match(workspace, /confirmDeleteOperator/);
  assert.doesNotMatch(workspace, /ElMessageBox/);
  assert.doesNotMatch(workspace, /deleteFunctionOperatorMock/);
  assert.match(panel, /FunctionOperatorDeleteDialog/);
  assert.match(panel, /@click="openDeleteOperator\(operator\)"/);
  assert.match(panel, /@click\.stop="openDeleteOperator\(asOperator\(row\)\)"/);
  assert.match(dialog, /class="aircas-dialog"/);
  assert.match(dialog, /确认删除/);
});
