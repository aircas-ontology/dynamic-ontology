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

test("upload ontology function container doc types expose file params and path data", () => {
  const typeSource = readSource("../src/types/apis/uploadOntologyFunctionContainerDocType.ts");
  const barrel = readSource("../src/types/index.ts");
  assert.match(typeSource, /export interface UploadOntologyFunctionContainerDocParams/);
  assert.match(typeSource, /file:\s*File/);
  assert.match(typeSource, /export interface UploadOntologyFunctionContainerDocData/);
  assert.match(typeSource, /fileName:\s*string/);
  assert.match(typeSource, /path:\s*string/);
  assert.match(typeSource, /format:\s*string/);
  assert.match(barrel, /UploadOntologyFunctionContainerDocData,\s*UploadOntologyFunctionContainerDocParams/);
});

test("upload ontology function container doc api posts FormData file to manage domain uri", () => {
  const apiSource = readSource("../src/apis/functionApi.ts");
  assert.match(
    apiSource,
    /export function postUploadOntologyFunctionContainerDocInterface\(\s*params: UploadOntologyFunctionContainerDocParams,?\s*\):\s*Promise<ApiResponse<UploadOntologyFunctionContainerDocData>>/,
  );
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/function\/container\/upload_doc"/);
  assert.match(apiSource, /method:\s*"post"/);
  assert.match(apiSource, /FormData/);
  assert.match(apiSource, /append\(\s*"file"/);
  assert.match(apiSource, /multipart\/form-data/);
  assert.match(apiSource, /@description/);
});

test("apis barrel exports the container doc upload interface", () => {
  const barrel = readSource("../src/apis/index.ts");
  assert.match(barrel, /postUploadOntologyFunctionContainerDocInterface/);
});

test("upload ontology function container doc mock mirrors SUCCESS sample with path data", () => {
  const mockSource = readSource("../src/mocks/uploadOntologyFunctionContainerDocMock/uploadOntologyFunctionContainerDocMock.ts");
  assert.match(mockSource, /export const uploadOntologyFunctionContainerDocMock: ApiResponse<UploadOntologyFunctionContainerDocData> = \{/);
  assert.match(mockSource, /code: 200,/);
  assert.match(mockSource, /message: "SUCCESS",/);
  assert.match(mockSource, /success: true,/);
  assert.match(mockSource, /path:\s*["']\/app\/interface-docs\//);
  assert.match(mockSource, /fileName:\s*["']httpbin\.json["']/);
  assert.match(mockSource, /format:\s*["']openapi3["']/);
});

test("mockData registers container doc upload route with path data", () => {
  const routes = readSource("../src/mockData/routes.json");
  assert.match(routes, /\/ontology\/function\/container\/upload_doc/);
  const fixture = readSource("../src/mockData/fixtures/ontology/function/container/upload_doc.post.json");
  assert.match(fixture, /"code":\s*200/);
  assert.match(fixture, /"path":\s*"\/app\/interface-docs\//);
  assert.match(fixture, /"fileName":\s*"httpbin\.json"/);
});

test("docker form uploads api doc, saves path, probes interfaces, and toasts upload success", () => {
  const formSource = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue");
  assert.match(formSource, /postUploadOntologyFunctionContainerDocInterface/);
  assert.match(formSource, /postProbeOntologyFunctionContainerInterfacesInterface/);
  assert.match(formSource, /dockerApiDocUploading/);
  assert.match(formSource, /dockerInterfaceDoc/);
  assert.match(formSource, /上传成功/);
  assert.match(formSource, /onDockerApiDocFileChange/);
  assert.match(formSource, /postProbeOntologyFunctionContainerInterfacesInterface\(\{\s*docPath\s*\}\)/);
});
