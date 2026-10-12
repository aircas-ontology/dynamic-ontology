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

test("function publish types expose functionApi version and null data", () => {
  const source = readSource("../src/types/apis/functionPublishType.ts");
  assert.match(source, /export interface FunctionPublishParams/);
  assert.match(source, /functionApi: string/);
  assert.match(source, /version: string/);
  assert.match(source, /export type FunctionPublishData = null/);
  const barrel = readSource("../src/types/index.ts");
  assert.match(barrel, /FunctionPublishData/);
  assert.match(barrel, /FunctionPublishParams/);
  assert.match(barrel, /functionPublishType/);
});

test("function publish api posts functionApi and version to publish uri", () => {
  const source = readSource("../src/apis/functionApi.ts");
  assert.match(source, /postOntologyFunctionPublishInterface/);
  assert.match(source, /DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/function\/publish"/);
  assert.match(source, /method: "post"/);
  const publishFn = source.match(/export function postOntologyFunctionPublishInterface[\s\S]*?\n\}/);
  assert.ok(publishFn, "missing postOntologyFunctionPublishInterface implementation");
  assert.match(publishFn[0], /\bparams(?::\s*params)?,/);
  assert.doesNotMatch(publishFn[0], /\bdata:\s*params\b/);
  const barrel = readSource("../src/apis/index.ts");
  assert.match(barrel, /postOntologyFunctionPublishInterface/);
  assert.match(barrel, /from "\.\/functionApi"/);
});

test("function operator workspace publish and unpublish both call real apis", () => {
  const workspace = readSource("../src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts");
  const panel = readSource("../src/views/FunctionOperatorPanel/index.vue");
  assert.match(workspace, /postOntologyFunctionPublishInterface/);
  assert.match(workspace, /postOntologyFunctionUnpublishInterface/);
  assert.match(workspace, /postOntologyFunctionPublishInterface\(\{\s*functionApi,\s*version,?\s*\}\)/);
  assert.match(workspace, /postOntologyFunctionUnpublishInterface\(\{\s*functionApi,\s*version,?\s*\}\)/);
  assert.match(workspace, /发布成功/);
  assert.doesNotMatch(workspace, /setFunctionOperatorStatusMock/);
  assert.match(panel, /togglePublish\(operator\)/);
  assert.match(panel, /togglePublish\(asOperator\(row\)\)/);
});
