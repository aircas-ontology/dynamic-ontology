import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("create ontology object types expose the documented request and response fields", () => {
  const source = readSource("../src/types/apis/createOntologyObjectType.ts");
  assert.match(source, /export interface CreateOntologyObjectParams/);
  assert.match(source, /spaceId: number/);
  assert.match(source, /displayName: string/);
  assert.match(source, /apiName: string/);
  assert.match(source, /parentOntologyUniqueIdentifier\?: number/);
  assert.match(source, /categoryId\?: number/);
  assert.match(source, /groupIds\?: string\[\]/);
  assert.match(source, /export interface CreateOntologyObjectData/);
  assert.match(source, /uniqueIdentifier: string/);
});

test("create ontology object api posts the typed body to the ontology meta endpoint", () => {
  const source = readSource("../src/apis/ontologyObjectManageApi.ts");
  assert.match(source, /createOntologyObjectInterface/);
  assert.match(source, /DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/meta"/);
  assert.match(source, /method: "post"/);
  assert.match(source, /data: params/);
  assert.doesNotMatch(source, /params: params/);
  const barrel = readSource("../src/apis/index.ts");
  assert.match(barrel, /createOntologyObjectInterface/);
});

test("create ontology object mock mirrors the documented success envelope", () => {
  const source = readSource("../src/mocks/createOntologyObjectMock/createOntologyObjectMock.ts");
  assert.match(source, /export const createOntologyObjectMock: ApiResponse<CreateOntologyObjectData>/);
  assert.match(source, /code: 200/);
  assert.match(source, /message: "SUCCESS"/);
  assert.match(source, /success: true/);
  assert.match(source, /uniqueIdentifier: "ae6cca59ced9432189da4af315554957"/);
});

test("object workspace submits manual creation through the api and reloads after success", () => {
  const source = readSource("../src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue");
  assert.match(source, /createOntologyObjectInterface/);
  assert.match(source, /await createOntologyObjectInterface/);
  assert.match(source, /@submit-manual="createOntologyObject"/);
  assert.match(source, /await load\(\)/);
  assert.match(source, /ElMessage\.success/);
  assert.match(source, /objectCreateError\.value/);
  assert.match(source, /response\.code !== 200/);
  assert.doesNotMatch(source, /response\.code !== 200 \|\| !response\.success/);
});
