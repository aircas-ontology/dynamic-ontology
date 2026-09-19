import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("update ontology space api types follow the contract params and empty object data", () => {
  const apiTypeSource = readSource("../src/types/apis/updateOntologySpaceType.ts");
  const typeBarrelSource = readSource("../src/types/index.ts");
  assert.match(apiTypeSource, /export interface UpdateOntologySpaceParams/);
  assert.match(apiTypeSource, /displayName:\s*string/);
  assert.match(apiTypeSource, /spaceId:\s*number/);
  assert.match(apiTypeSource, /icon\?:\s*string/);
  assert.match(apiTypeSource, /description\?:\s*string/);
  assert.match(apiTypeSource, /export type UpdateOntologySpaceData = Record<string, unknown>/);
  assert.match(typeBarrelSource, /export type \{ UpdateOntologySpaceData, UpdateOntologySpaceParams \} from "\.\/apis\/updateOntologySpaceType";/);
});

test("update ontology space api issues a PUT to the manage domain space uri with the typed response contract", () => {
  const apiSource = readSource("../src/apis/ontologyManageApi.ts");
  assert.match(apiSource, /export function updateOntologySpaceInterface\(params: UpdateOntologySpaceParams\): Promise<ApiResponse<UpdateOntologySpaceData>>/);
  assert.match(apiSource, /request<UpdateOntologySpaceData>\(\{/);
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/space"/);
  assert.match(apiSource, /method:\s*"put"/);
  assert.match(apiSource, /data: params,/);
  assert.match(apiSource, /timeout: requestTimeoutMs,/);
  assert.match(apiSource, /import \{ requestTimeoutMs \} from "@\/utils\/constants";/);
  assert.match(apiSource, /import type \{[\s\S]*UpdateOntologySpaceData[\s\S]*\} from "@\/types"/);
  assert.match(apiSource, /@description/);
  assert.doesNotMatch(apiSource, /method:\s*"get"[^\n]*\n[\s\S]*updateOntologySpaceInterface/);
});

test("apis barrel exports the update interface in dictionary order", () => {
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

test("update ontology space mock mirrors the response sample with success flag", () => {
  const mockSource = readSource("../src/mocks/updateOntologySpaceMock/updateOntologySpaceMock.ts");
  assert.match(mockSource, /import type \{ ApiResponse, UpdateOntologySpaceData \} from "@\/types";/);
  assert.match(mockSource, /export const updateOntologySpaceMock: ApiResponse<UpdateOntologySpaceData> = \{/);
  assert.match(mockSource, /code: 200,/);
  assert.match(mockSource, /message: "SUCCESS",/);
  assert.match(mockSource, /success: true,/);
  assert.match(mockSource, /data: \{\},/);
});
