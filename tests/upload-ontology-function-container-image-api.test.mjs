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

test("upload ontology function container image types expose file params and image data", () => {
  const typeSource = readSource("../src/types/apis/uploadOntologyFunctionContainerImageType.ts");
  const barrel = readSource("../src/types/index.ts");
  assert.match(typeSource, /export interface UploadOntologyFunctionContainerImageParams/);
  assert.match(typeSource, /file:\s*File/);
  assert.match(typeSource, /export interface UploadOntologyFunctionContainerImageData/);
  assert.match(typeSource, /fileName:\s*string/);
  assert.match(typeSource, /path:\s*string/);
  assert.match(typeSource, /size:\s*number/);
  assert.match(typeSource, /architecture:\s*string/);
  assert.match(typeSource, /repoTags:\s*string\[\]/);
  assert.match(barrel, /UploadOntologyFunctionContainerImageData,\s*UploadOntologyFunctionContainerImageParams/);
});

test("upload ontology function container image api posts FormData file to manage domain uri", () => {
  const apiSource = readSource("../src/apis/functionApi.ts");
  assert.match(
    apiSource,
    /export function postUploadOntologyFunctionContainerImageInterface\(\s*params: UploadOntologyFunctionContainerImageParams,?\s*\):\s*Promise<ApiResponse<UploadOntologyFunctionContainerImageData>>/,
  );
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/function\/container\/upload_image"/);
  assert.match(apiSource, /method:\s*"post"/);
  assert.match(apiSource, /FormData/);
  assert.match(apiSource, /append\(\s*"file"/);
  assert.match(apiSource, /multipart\/form-data/);
  assert.match(apiSource, /@description/);
});

test("apis barrel exports the container image upload interface", () => {
  const barrel = readSource("../src/apis/index.ts");
  assert.match(barrel, /postUploadOntologyFunctionContainerImageInterface/);
});

test("upload ontology function container image mock mirrors SUCCESS sample with image data", () => {
  const mockSource = readSource("../src/mocks/uploadOntologyFunctionContainerImageMock/uploadOntologyFunctionContainerImageMock.ts");
  assert.match(mockSource, /export const uploadOntologyFunctionContainerImageMock: ApiResponse<UploadOntologyFunctionContainerImageData> = \{/);
  assert.match(mockSource, /code: 200,/);
  assert.match(mockSource, /message: "SUCCESS",/);
  assert.match(mockSource, /success: true,/);
  assert.match(mockSource, /fileName:\s*["']go-httpbin\.tar["']/);
  assert.match(mockSource, /path:\s*["']\/app\/container-images\//);
  assert.match(mockSource, /repoTags:/);
});

test("mockData registers container image upload route with image data", () => {
  const routes = readSource("../src/mockData/routes.json");
  assert.match(routes, /\/ontology\/function\/container\/upload_image/);
  const fixture = readSource("../src/mockData/fixtures/ontology/function/container/upload_image.post.json");
  assert.match(fixture, /"code":\s*200/);
  assert.match(fixture, /"fileName":\s*"go-httpbin\.tar"/);
  assert.match(fixture, /"path":\s*"\/app\/container-images\//);
});

test("docker form uploads image via container image interface and stores image info", () => {
  const formSource = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue");
  assert.match(formSource, /postUploadOntologyFunctionContainerImageInterface/);
  assert.match(formSource, /dockerImageUploading/);
  assert.match(formSource, /dockerImageInfo/);
  assert.match(formSource, /上传成功/);
  assert.match(formSource, /onDockerImageFileChange/);
});
