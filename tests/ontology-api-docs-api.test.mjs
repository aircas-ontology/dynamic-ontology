import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

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

test("ontology api docs interface uses manage domain openapi uri and raw document return type", () => {
  const apiSource = readSource("../src/apis/ontologyDocApi.ts");
  assert.match(apiSource, /export function getOntologyApiDocsInterface\(\): Promise<OntologyApiDocsData>/);
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/v3\/api-docs\/ontology"/);
  assert.match(apiSource, /method:\s*"get"/);
  assert.match(apiSource, /@description/);
  assert.doesNotMatch(apiSource, /Promise<ApiResponse</);
  assert.doesNotMatch(apiSource, /timeout:/);
});

test("apis barrel exports getOntologyApiDocsInterface", () => {
  const apiBarrelSource = readSource("../src/apis/index.ts");
  assert.match(apiBarrelSource, /import \{ getOntologyApiDocsInterface \} from "\.\/ontologyDocApi";/);
  assert.match(apiBarrelSource, /getOntologyApiDocsInterface,/);
});

test("ontology api docs types and page types are exported from types barrel", () => {
  const apiTypeSource = readSource("../src/types/apis/ontologyApiDocsType.ts");
  const pageTypeSource = readSource("../src/types/pages/applicationManagementType.ts");
  const typeBarrelSource = readSource("../src/types/index.ts");
  assert.match(apiTypeSource, /export interface OntologyApiDocsData/);
  assert.match(apiTypeSource, /paths:\s*Record<string,\s*OntologyApiDocsPathItem>/);
  assert.match(pageTypeSource, /export interface ApiDocsEndpointItem/);
  assert.match(pageTypeSource, /export interface ApiDocsEndpointDetail/);
  assert.match(typeBarrelSource, /export type \{[\s\S]*OntologyApiDocsData[\s\S]*\} from "\.\/apis\/ontologyApiDocsType";/);
  assert.match(typeBarrelSource, /export type \{[\s\S]*ApiDocsEndpointDetail[\s\S]*\} from "\.\/pages\/applicationManagementType";/);
});

test("api docs ontology mock exports typed OpenAPI document sample", () => {
  const mockSource = readSource("../src/mocks/apiDocsOntologyMock/apiDocsOntologyMock.ts");
  assert.match(mockSource, /import type \{ OntologyApiDocsData \} from "@\/types";/);
  assert.match(mockSource, /export const apiDocsOntologyMock: OntologyApiDocsData =/);
  assert.match(mockSource, /\\"openapi\\":\\"3\.1\.0\\"/);
  assert.match(mockSource, /\\"title\\":\\"本体服务\\"/);
  assert.equal(existsSync(new URL("../src/mocks/apiDocsOntologyMock/mock.ts", import.meta.url)), false);
});
