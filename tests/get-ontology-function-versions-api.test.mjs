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

test("function versions types expose functionApi query and string array data", () => {
  const source = readSource("../src/types/apis/getOntologyFunctionVersionsType.ts");
  assert.match(source, /export interface GetOntologyFunctionVersionsParams/);
  assert.match(source, /functionApi: string/);
  assert.match(source, /export type GetOntologyFunctionVersionsData = string\[\]/);
  const barrel = readSource("../src/types/index.ts");
  assert.match(barrel, /GetOntologyFunctionVersionsData/);
  assert.match(barrel, /GetOntologyFunctionVersionsParams/);
  assert.match(barrel, /getOntologyFunctionVersionsType/);
});

test("function versions api gets functionApi as query params", () => {
  const source = readSource("../src/apis/functionApi.ts");
  assert.match(source, /getOntologyFunctionVersionsInterface/);
  assert.match(source, /DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/function\/versions"/);
  assert.match(source, /method: "get"/);
  const versionsFn = source.match(/export function getOntologyFunctionVersionsInterface[\s\S]*?\n\}/);
  assert.ok(versionsFn, "missing getOntologyFunctionVersionsInterface implementation");
  assert.match(versionsFn[0], /\bparams(?::\s*params)?,/);
  assert.doesNotMatch(versionsFn[0], /\bdata:\s*params\b/);
  const barrel = readSource("../src/apis/index.ts");
  assert.match(barrel, /getOntologyFunctionVersionsInterface/);
  assert.match(barrel, /from "\.\/functionApi"/);
});

test("function versions mock mirrors SUCCESS envelope with version array", () => {
  const source = readSource("../src/mocks/getOntologyFunctionVersionsMock/getOntologyFunctionVersionsMock.ts");
  assert.match(source, /export const getOntologyFunctionVersionsMock: ApiResponse<GetOntologyFunctionVersionsData>/);
  assert.match(source, /code: 200/);
  assert.match(source, /message: "SUCCESS"/);
  assert.match(source, /success: true/);
  assert.match(source, /data: \["1\.0\.0"\]/);
});

test("mockData routes cover function versions contract", () => {
  const routes = JSON.parse(readSource("../src/mockData/routes.json"));
  const versions = routes.find((item) => item.method === "GET" && item.path === "/ontology/function/versions");
  assert.ok(versions);
  assert.equal(existsSync(new URL(`../src/mockData/${versions.file}`, import.meta.url)), true);
  const fixture = JSON.parse(readSource(`../src/mockData/${versions.file}`));
  assert.equal(fixture.code, 200);
  assert.deepEqual(fixture.data, ["1.0.0"]);
});
