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

test("create ontology function container types expose create params and string array data", () => {
  const typeSource = readSource("../src/types/apis/createOntologyFunctionContainerType.ts");
  const barrel = readSource("../src/types/index.ts");
  assert.match(typeSource, /export interface CreateOntologyFunctionContainerParams/);
  assert.match(typeSource, /functionApi:\s*string/);
  assert.match(typeSource, /version:\s*string/);
  assert.match(typeSource, /displayName:\s*string/);
  assert.match(typeSource, /type:\s*CreateOntologyFunctionContainerType/);
  assert.match(typeSource, /export type CreateOntologyFunctionContainerType = "CONTAINER"/);
  assert.match(typeSource, /export interface CreateOntologyFunctionContainerConfig/);
  assert.match(typeSource, /containerConfig:\s*CreateOntologyFunctionContainerConfig/);
  assert.match(typeSource, /image:\s*UploadOntologyFunctionContainerImageData/);
  assert.match(typeSource, /runCommand:\s*string/);
  assert.match(typeSource, /selectedInterfaces:\s*ProbeOntologyFunctionContainerInterfaceItem\[\]/);
  assert.match(typeSource, /export type CreateOntologyFunctionContainerData = string\[\]/);
  assert.match(barrel, /CreateOntologyFunctionContainerConfig/);
  assert.match(barrel, /CreateOntologyFunctionContainerData/);
  assert.match(barrel, /CreateOntologyFunctionContainerParams/);
});

test("create ontology function container api posts params to manage domain uri", () => {
  const apiSource = readSource("../src/apis/functionApi.ts");
  assert.match(
    apiSource,
    /export function postCreateOntologyFunctionContainerInterface\(\s*params: CreateOntologyFunctionContainerParams,?\s*\):\s*Promise<ApiResponse<CreateOntologyFunctionContainerData>>/,
  );
  assert.match(
    apiSource,
    /export function postCreateOntologyFunctionContainerInterface\([\s\S]*?url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/function"/,
  );
  assert.doesNotMatch(
    apiSource,
    /export function postCreateOntologyFunctionContainerInterface\([\s\S]*?url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/function\/container"/,
  );
  assert.match(apiSource, /method:\s*"post"/);
  assert.match(apiSource, /@description/);
});

test("apis barrel exports the container create interface", () => {
  const barrel = readSource("../src/apis/index.ts");
  assert.match(barrel, /postCreateOntologyFunctionContainerInterface/);
});

test("create ontology function container mock mirrors SUCCESS sample with api list", () => {
  const mockSource = readSource("../src/mocks/createOntologyFunctionContainerMock/createOntologyFunctionContainerMock.ts");
  assert.match(mockSource, /export const createOntologyFunctionContainerMock: ApiResponse<CreateOntologyFunctionContainerData> = \{/);
  assert.match(mockSource, /code: 200,/);
  assert.match(mockSource, /message: "SUCCESS",/);
  assert.match(mockSource, /success: true,/);
  assert.match(mockSource, /httpbin_GET_get/);
  assert.match(mockSource, /httpbin_POST_post/);
});

test("create ontology function container success fixture lists derived apis", () => {
  const fixture = readSource("../src/mockData/fixtures/ontology/function/container/create.post.json");
  assert.match(fixture, /"code":\s*200/);
  assert.match(fixture, /httpbin_GET_get/);
  assert.match(fixture, /httpbin_POST_post/);
});

test("buildCreateOntologyFunctionContainerParams maps form fields to create body", () => {
  const utilSource = readSource("../src/views/FunctionOperatorPanel/utils/buildCreateOntologyFunctionContainerParams.ts");
  assert.match(utilSource, /export function buildCreateOntologyFunctionContainerParams/);
  assert.match(utilSource, /version:\s*input\.version\.trim\(\)/);
  assert.match(utilSource, /type:\s*["']CONTAINER["']/);
  assert.match(utilSource, /containerConfig:\s*\{/);
  assert.match(utilSource, /runCommand:\s*input\.runCommand\.trim\(\)/);
  assert.match(utilSource, /selectedInterfaces:\s*input\.selectedInterfaces/);
  assert.match(utilSource, /image:\s*input\.image/);
});

test("docker form emits save-container with built create params", () => {
  const formSource = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue");
  assert.match(formSource, /"save-container"/);
  assert.match(formSource, /buildCreateOntologyFunctionContainerParams/);
  assert.match(formSource, /submitDockerOperator/);
  assert.match(formSource, /请先上传镜像/);
  assert.match(formSource, /请至少勾选一条已发现接口/);
});

test("workspace saves container operator via create interface", () => {
  const workspaceSource = readSource("../src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts");
  const indexSource = readSource("../src/views/FunctionOperatorPanel/index.vue");
  assert.match(workspaceSource, /postCreateOntologyFunctionContainerInterface/);
  assert.match(workspaceSource, /saveContainerOperator/);
  assert.match(workspaceSource, /容器算子草稿已保存/);
  assert.match(indexSource, /@save-container="saveContainerOperator"/);
});
