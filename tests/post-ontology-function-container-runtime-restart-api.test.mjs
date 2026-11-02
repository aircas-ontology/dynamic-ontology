import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

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

test("container runtime restart types expose containerKey params and runtime item data", () => {
  const typeSource = readSource("../src/types/apis/postOntologyFunctionContainerRuntimeRestartType.ts");
  const barrel = readSource("../src/types/index.ts");
  assert.match(typeSource, /export interface PostOntologyFunctionContainerRuntimeRestartParams/);
  assert.match(typeSource, /containerKey:\s*string/);
  assert.match(typeSource, /export type PostOntologyFunctionContainerRuntimeRestartData = OntologyFunctionContainerRuntimeItem/);
  assert.match(barrel, /PostOntologyFunctionContainerRuntimeRestartData/);
  assert.match(barrel, /PostOntologyFunctionContainerRuntimeRestartParams/);
});

test("container runtime restart api posts containerKey query on manage domain uri", () => {
  const apiSource = readSource("../src/apis/functionApi.ts");
  assert.match(
    apiSource,
    /export function postOntologyFunctionContainerRuntimeRestartInterface\(\s*params: PostOntologyFunctionContainerRuntimeRestartParams,?\s*\):\s*Promise<ApiResponse<PostOntologyFunctionContainerRuntimeRestartData>>/,
  );
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/function\/container\/runtime\/restart"/);
  assert.match(apiSource, /method:\s*"post"/);
  assert.match(apiSource, /@description/);
});

test("apis barrel exports the container runtime restart interface", () => {
  const barrel = readSource("../src/apis/index.ts");
  assert.match(barrel, /postOntologyFunctionContainerRuntimeRestartInterface/);
});
