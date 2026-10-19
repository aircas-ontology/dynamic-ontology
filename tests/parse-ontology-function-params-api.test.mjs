import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

/**
 * @description 读取相对 tests 目录的源文件文本。
 * @param relativePath 相对路径。
 * @returns 文件内容。
 */
function readSource(relativePath) {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
}

test("parse ontology function params types match the documented contract", () => {
  const source = readSource("../src/types/apis/parseOntologyFunctionParamsType.ts");
  assert.match(source, /export interface ParseOntologyFunctionParamsParams/);
  assert.match(source, /language: string/);
  assert.match(source, /code: string/);
  assert.match(source, /export interface ParseOntologyFunctionParamItem/);
  assert.match(source, /paramName: string/);
  assert.match(source, /paramType: string/);
  assert.match(source, /category: string/);
  assert.match(source, /paramOrder: number/);
  assert.match(source, /referenceType: string/);
  assert.match(source, /fields\?: ParseOntologyFunctionParamItem\[\]/);
  assert.match(source, /status: string/);
  assert.match(source, /parsed: boolean/);
  assert.match(source, /parameters: ParseOntologyFunctionParamItem\[\]/);
  const barrel = readSource("../src/types/index.ts");
  assert.match(barrel, /ParseOntologyFunctionParamsData/);
  assert.match(barrel, /ParseOntologyFunctionParamsParams/);
  assert.match(barrel, /parseOntologyFunctionParamsType/);
});

test("parse ontology function params api posts language and code", () => {
  const source = readSource("../src/apis/functionApi.ts");
  assert.match(source, /postParseOntologyFunctionParamsInterface/);
  assert.match(source, /DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/function\/parse_params"/);
  assert.match(source, /method: "post"/);
  assert.match(source, /data: params/);
  const barrel = readSource("../src/apis/index.ts");
  assert.match(barrel, /postParseOntologyFunctionParamsInterface/);
});

test("parse ontology function params mock mirrors the documented success sample", () => {
  const source = readSource("../src/mocks/parseOntologyFunctionParamsMock/parseOntologyFunctionParamsMock.ts");
  assert.match(source, /message: "SUCCESS"/);
  assert.match(source, /status: "OK"/);
  assert.match(source, /parsed: true/);
  assert.match(source, /paramName: "input"/);
  assert.match(source, /fields:/);
  assert.match(source, /paramName: "Output"/);
  const fixture = readSource("../src/mockData/fixtures/ontology/function/parse_params.post.json");
  assert.match(fixture, /"paramName": "aa"/);
  assert.match(fixture, /"fields"/);
  const routes = readSource("../src/mockData/routes.json");
  assert.match(routes, /\/ontology\/function\/parse_params/);
});
