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

test("container runtime stop types expose containerKey params and runtime item data", () => {
  const typeSource = readSource("../src/types/apis/postOntologyFunctionContainerRuntimeStopType.ts");
  const barrel = readSource("../src/types/index.ts");
  assert.match(typeSource, /export interface PostOntologyFunctionContainerRuntimeStopParams/);
  assert.match(typeSource, /containerKey:\s*string/);
  assert.match(typeSource, /export type PostOntologyFunctionContainerRuntimeStopData = OntologyFunctionContainerRuntimeItem/);
  assert.match(barrel, /PostOntologyFunctionContainerRuntimeStopData/);
  assert.match(barrel, /PostOntologyFunctionContainerRuntimeStopParams/);
});

test("container runtime stop api posts containerKey query on manage domain uri", () => {
  const apiSource = readSource("../src/apis/functionApi.ts");
  assert.match(
    apiSource,
    /export function postOntologyFunctionContainerRuntimeStopInterface\(\s*params: PostOntologyFunctionContainerRuntimeStopParams,?\s*\):\s*Promise<ApiResponse<PostOntologyFunctionContainerRuntimeStopData>>/,
  );
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/function\/container\/runtime\/stop"/);
  assert.match(apiSource, /method:\s*"post"/);
  assert.match(apiSource, /@description/);
});

test("apis barrel exports the container runtime stop interface", () => {
  const barrel = readSource("../src/apis/index.ts");
  assert.match(barrel, /postOntologyFunctionContainerRuntimeStopInterface/);
});

test("container runtime stop mock mirrors STOPPED sample item", () => {
  const mockSource = readSource("../src/mocks/postOntologyFunctionContainerRuntimeStopMock/postOntologyFunctionContainerRuntimeStopMock.ts");
  assert.match(mockSource, /export const postOntologyFunctionContainerRuntimeStopMock: ApiResponse<PostOntologyFunctionContainerRuntimeStopData> = \{/);
  assert.match(mockSource, /code: 200,/);
  assert.match(mockSource, /phase:\s*["']STOPPED["']/);
  assert.match(mockSource, /phaseLabel:\s*["']已停止["']/);
});
