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

test("function unpublish types expose functionApi version and null data", () => {
  const source = readSource("../src/types/apis/functionUnpublishType.ts");
  assert.match(source, /export interface FunctionUnpublishParams/);
  assert.match(source, /functionApi: string/);
  assert.match(source, /version: string/);
  assert.match(source, /export type FunctionUnpublishData = null/);
  const barrel = readSource("../src/types/index.ts");
  assert.match(barrel, /FunctionUnpublishData/);
  assert.match(barrel, /FunctionUnpublishParams/);
  assert.match(barrel, /functionUnpublishType/);
});

test("function unpublish api posts functionApi and version to unpublish uri", () => {
  const source = readSource("../src/apis/functionApi.ts");
  assert.match(source, /postOntologyFunctionUnpublishInterface/);
  assert.match(source, /DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/function\/unpublish"/);
  assert.match(source, /method: "post"/);
  const unpublishFn = source.match(/export function postOntologyFunctionUnpublishInterface[\s\S]*?\n\}/);
  assert.ok(unpublishFn, "missing postOntologyFunctionUnpublishInterface implementation");
  assert.match(unpublishFn[0], /\bparams(?::\s*params)?,/);
  assert.doesNotMatch(unpublishFn[0], /\bdata:\s*params\b/);
  const barrel = readSource("../src/apis/index.ts");
  assert.match(barrel, /postOntologyFunctionUnpublishInterface/);
  assert.match(barrel, /from "\.\/functionApi"/);
});

test("function operator workspace unpublish calls real api", () => {
  const workspace = readSource("../src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts");
  const panel = readSource("../src/views/FunctionOperatorPanel/index.vue");
  assert.match(workspace, /postOntologyFunctionUnpublishInterface/);
  assert.match(workspace, /const functionApi = operator\.functionApi\.trim\(\)/);
  assert.match(workspace, /const version = operator\.version\.trim\(\)/);
  assert.match(workspace, /postOntologyFunctionUnpublishInterface\(\{\s*functionApi,\s*version,?\s*\}\)/);
  assert.match(workspace, /下线成功/);
  assert.match(workspace, /status === ["']published["']/);
  assert.match(panel, /togglePublish\(operator\)/);
  assert.match(panel, /togglePublish\(asOperator\(row\)\)/);
});
