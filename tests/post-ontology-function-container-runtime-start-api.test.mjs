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

test("container runtime start types expose containerKey params and runtime item data", () => {
  const typeSource = readSource("../src/types/apis/postOntologyFunctionContainerRuntimeStartType.ts");
  const barrel = readSource("../src/types/index.ts");
  assert.match(typeSource, /export interface PostOntologyFunctionContainerRuntimeStartParams/);
  assert.match(typeSource, /containerKey:\s*string/);
  assert.match(typeSource, /export type PostOntologyFunctionContainerRuntimeStartData = OntologyFunctionContainerRuntimeItem/);
  assert.match(barrel, /PostOntologyFunctionContainerRuntimeStartData/);
  assert.match(barrel, /PostOntologyFunctionContainerRuntimeStartParams/);
});

test("container runtime start api posts containerKey query on manage domain uri", () => {
  const apiSource = readSource("../src/apis/functionApi.ts");
  assert.match(
    apiSource,
    /export function postOntologyFunctionContainerRuntimeStartInterface\(\s*params: PostOntologyFunctionContainerRuntimeStartParams,?\s*\):\s*Promise<ApiResponse<PostOntologyFunctionContainerRuntimeStartData>>/,
  );
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/function\/container\/runtime\/start"/);
  assert.match(apiSource, /method:\s*"post"/);
  assert.match(apiSource, /@description/);
});

test("apis barrel exports the container runtime start interface", () => {
  const barrel = readSource("../src/apis/index.ts");
  assert.match(barrel, /postOntologyFunctionContainerRuntimeStartInterface/);
});
