import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("delete ontology space api types follow the contract spaceId only", () => {
  const apiTypeSource = readSource("../src/types/apis/deleteOntologySpaceType.ts");
  const typeBarrelSource = readSource("../src/types/index.ts");
  assert.match(apiTypeSource, /export interface DeleteOntologySpaceParams/);
  assert.match(apiTypeSource, /spaceId:\s*number/);
  assert.doesNotMatch(apiTypeSource, /icon/);
  assert.match(apiTypeSource, /export type DeleteOntologySpaceData = Record<string, unknown>/);
  assert.match(typeBarrelSource, /export type \{ DeleteOntologySpaceData, DeleteOntologySpaceParams \} from "\.\/apis\/deleteOntologySpaceType";/);
});

test("delete ontology space api issues a DELETE to the manage domain space uri with path param", () => {
  const apiSource = readSource("../src/apis/ontologyManageApi.ts");
  assert.match(apiSource, /export function deleteOntologySpaceInterface\(params: DeleteOntologySpaceParams\): Promise<ApiResponse<DeleteOntologySpaceData>>/);
  assert.match(apiSource, /request<DeleteOntologySpaceData>\(\{/);
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/space\/" \+ params\.spaceId/);
  assert.match(apiSource, /method:\s*"delete"/);
  assert.match(apiSource, /timeout: DELETE_ONTOLOGY_SPACE_TIMEOUT,/);
  assert.match(apiSource, /const DELETE_ONTOLOGY_SPACE_TIMEOUT = 10000;/);
  assert.match(apiSource, /import type \{[\s\S]*DeleteOntologySpaceData[\s\S]*\} from "@\/types"/);
  assert.match(apiSource, /@description/);
});

test("apis barrel exports the delete interface in dictionary order", () => {
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

test("delete ontology space mock mirrors the response sample with success flag", () => {
  const mockSource = readSource("../src/mocks/deleteOntologySpaceMock/deleteOntologySpaceMock.ts");
  assert.match(mockSource, /import type \{ ApiResponse, DeleteOntologySpaceData \} from "@\/types";/);
  assert.match(mockSource, /export const deleteOntologySpaceMock: ApiResponse<DeleteOntologySpaceData> = \{/);
  assert.match(mockSource, /code: 200,/);
  assert.match(mockSource, /message: "SUCCESS",/);
  assert.match(mockSource, /success: true,/);
  assert.match(mockSource, /data: \{\},/);
});
