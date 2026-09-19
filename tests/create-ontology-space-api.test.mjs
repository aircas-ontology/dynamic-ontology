import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("create ontology space api types follow the contract params and numeric data", () => {
  const apiTypeSource = readSource("../src/types/apis/createOntologySpaceType.ts");
  const typeBarrelSource = readSource("../src/types/index.ts");
  assert.match(apiTypeSource, /export interface CreateOntologySpaceParams/);
  assert.match(apiTypeSource, /displayName:\s*string/);
  assert.match(apiTypeSource, /apiName:\s*string/);
  assert.match(apiTypeSource, /icon:\s*string/);
  assert.match(apiTypeSource, /description:\s*string/);
  assert.match(apiTypeSource, /export type CreateOntologySpaceData = number/);
  assert.match(typeBarrelSource, /export type \{ CreateOntologySpaceData, CreateOntologySpaceParams \} from "\.\/apis\/createOntologySpaceType";/);
});

test("create ontology space api issues a POST to the manage domain space uri with the typed response contract", () => {
  const apiSource = readSource("../src/apis/ontologyManageApi.ts");
  assert.match(apiSource, /export function createOntologySpaceInterface\(params: CreateOntologySpaceParams\): Promise<ApiResponse<CreateOntologySpaceData>>/);
  assert.match(apiSource, /request<CreateOntologySpaceData>\(\{/);
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/space"/);
  assert.match(apiSource, /method:\s*"post"/);
  assert.match(apiSource, /data: params,/);
  assert.match(apiSource, /timeout: requestTimeoutMs,/);
  assert.match(apiSource, /import \{ requestTimeoutMs \} from "@\/utils\/constants";/);
  assert.match(apiSource, /import type \{[\s\S]*CreateOntologySpaceData[\s\S]*\} from "@\/types"/);
  assert.match(apiSource, /@description/);
  assert.doesNotMatch(apiSource, /method:\s*"get"[^\n]*\n[\s\S]*createOntologySpaceInterface/);
});

test("apis barrel exports the create interface in dictionary order", () => {
  const apiBarrelSource = readSource("../src/apis/index.ts");
  assert.match(
    apiBarrelSource,
    /import \{[\s\S]*?createOntologySpaceInterface,[\s\S]*?deleteOntologySpaceInterface,[\s\S]*?getOntologyCategoryTreeInterface,[\s\S]*?getOntologySpaceListInterface,[\s\S]*?updateOntologySpaceInterface[\s\S]*?\} from "\.\/ontologyManageApi";/,
  );
  assert.match(
    apiBarrelSource,
    /export \{[\s\S]*?createOntologySpaceInterface,[\s\S]*?deleteOntologySpaceInterface,[\s\S]*?getExampleInterface,[\s\S]*?getOntologyCategoryTreeInterface,[\s\S]*?getOntologySpaceListInterface,[\s\S]*?postLoginInterface,[\s\S]*?updateOntologySpaceInterface[\s\S]*?\};/,
  );
});

test("create ontology space mock mirrors the response sample with success flag", () => {
  const mockSource = readSource("../src/mocks/createOntologySpaceMock/createOntologySpaceMock.ts");
  assert.match(mockSource, /import type \{ ApiResponse, CreateOntologySpaceData \} from "@\/types";/);
  assert.match(mockSource, /export const createOntologySpaceMock: ApiResponse<CreateOntologySpaceData> = \{/);
  assert.match(mockSource, /code: 200,/);
  assert.match(mockSource, /message: "SUCCESS",/);
  assert.match(mockSource, /success: true,/);
  assert.match(mockSource, /data: 8,/);
});
