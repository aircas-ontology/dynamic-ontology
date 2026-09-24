import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("get ontology meta by object id types follow the documented response fields", () => {
  const source = readSource("../src/types/apis/getOntologyMetaByObjectIdType.ts");
  assert.match(source, /export interface GetOntologyMetaByObjectIdParams/);
  assert.match(source, /objectId: number/);
  assert.match(source, /export interface GetOntologyMetaByObjectIdData/);
  assert.match(source, /id: number/);
  assert.match(source, /displayName: string/);
  assert.match(source, /spaceName: string/);
  assert.match(source, /uniqueIdentifier: string/);
});

test("get ontology meta by object id api gets the prefixed meta path", () => {
  const source = readSource("../src/apis/ontologyObjectArrManageApi.ts");
  assert.match(source, /getOntologyMetaByObjectIdInterface/);
  assert.match(source, /\/ontology\/meta\/\$\{encodeURIComponent\(String\(params\.objectId\)\)\}/);
  assert.match(source, /method: "get"/);
  const barrel = readSource("../src/apis/index.ts");
  assert.match(barrel, /getOntologyMetaByObjectIdInterface/);
});

test("get ontology meta by object id mock mirrors the documented sample", () => {
  const source = readSource("../src/mocks/getOntologyMetaByObjectIdMock/getOntologyMetaByObjectIdMock.ts");
  assert.match(source, /export const getOntologyMetaByObjectIdMock: ApiResponse<GetOntologyMetaByObjectIdData>/);
  assert.match(source, /code: 200/);
  assert.match(source, /message: "SUCCESS"/);
  assert.match(source, /id: 106/);
  assert.match(source, /displayName: "飞机"/);
  assert.match(source, /spaceName: "测试-rwl"/);
  assert.match(source, /uniqueIdentifier: "246ef68e87524c33911b92af900700f9"/);
});
