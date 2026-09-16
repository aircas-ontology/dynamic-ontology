import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readSource = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const apiSource = readSource("../src/apis/ontologyManageApi.ts");
const apiBarrelSource = readSource("../src/apis/index.ts");
const apiTypeSource = readSource("../src/types/apis/ontologyManageType.ts");
const typeBarrelSource = readSource("../src/types/index.ts");
const runtimeConfigSource = readSource("../src/types/global/runtimeConfigType.ts");
const mockSource = readSource("../src/mocks/ontologySpaceListMock/ontologySpaceListMock.ts");
const managementSource = readSource("../src/views/OntologySpaceManagement/composables/useSpaceManagement.ts");
const workspaceSource = readSource("../src/views/OntologySpaceManagementDetail/composables/useSpaceWorkspace.ts");

test("ontology space list api issues a GET to the manage domain space uri with the typed response contract", () => {
  assert.match(apiSource, /export function getOntologySpaceListInterface\(\): Promise<ApiResponse<OntologySpaceListData>>/);
  assert.match(apiSource, /request<OntologySpaceListData>\(\{/);
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/space"/);
  assert.match(apiSource, /method:\s*"get"/);
  assert.match(apiSource, /timeout: ONTOLOGY_SPACE_LIST_TIMEOUT,/);
  assert.match(apiSource, /const ONTOLOGY_SPACE_LIST_TIMEOUT = 10000;/);
  assert.match(apiSource, /import type \{ ApiResponse, OntologySpaceListData \} from "@\/types"/);
  assert.match(apiSource, /@description/);
  assert.doesNotMatch(apiSource, /LOGIN_URL/);
  assert.doesNotMatch(apiSource, /\/ontology\/user\/login/);
  assert.doesNotMatch(apiSource, /getOntologyListInterface/);
});

test("apis barrel exports the renamed interface in dictionary order without stale aliases", () => {
  assert.match(apiBarrelSource, /import \{ getOntologySpaceListInterface \} from "\.\/ontologyManageApi";/);
  assert.match(apiBarrelSource, /export \{ getExampleInterface, getOntologySpaceListInterface, postLoginInterface \};/);
  assert.doesNotMatch(apiBarrelSource, /getOntologyListInterface/);
});

test("ontology space list data is the ontology space item array and exported through the types barrel", () => {
  assert.match(apiTypeSource, /import type \{ OntologySpaceItem \} from "\.\.\/pages\/ontologySpaceManagementType";/);
  assert.match(apiTypeSource, /export type OntologySpaceListData = OntologySpaceItem\[\];/);
  assert.doesNotMatch(apiTypeSource, /OntologyListData/);
  assert.match(typeBarrelSource, /export type \{ OntologySpaceListData \} from "\.\/apis\/ontologyManageType";/);
  assert.doesNotMatch(typeBarrelSource, /OntologyListData/);
});

test("runtime domain config declares the ontology manage domain", () => {
  assert.match(runtimeConfigSource, /readonly ONTOLOGYMANAGE_URL: string;/);
});

test("ontology space list mock follows the standard response envelope and keeps six sample spaces", () => {
  assert.match(mockSource, /import type \{ ApiResponse, OntologySpaceItem, OntologySpaceListData \} from "@\/types";/);
  assert.match(mockSource, /export const ontologySpaceListMock: ApiResponse<OntologySpaceListData> = \{/);
  assert.match(mockSource, /code: 200,/);
  assert.match(mockSource, /message: "列表查询成功",/);
  assert.match(mockSource, /success: true,/);
  assert.equal((mockSource.match(/displayName: ".*本体空间"/g) || []).length, 6);
  assert.doesNotMatch(mockSource, /ontologySpaceManagementMock/);
});

test("space management page queries the real interface on load and falls back to the mock only on failure", () => {
  assert.match(managementSource, /import \{ getOntologySpaceListInterface \} from "@\/apis";/);
  assert.match(managementSource, /import \{ ontologySpaceListMock \} from "@\/mocks\/ontologySpaceListMock\/ontologySpaceListMock";/);
  assert.match(managementSource, /getOntologySpaceListInterface\(\)/);
  assert.match(managementSource, /response\.code === 200/);
  assert.match(managementSource, /ontologySpaceListMock\.data/);
  assert.doesNotMatch(managementSource, /ontologySpaceManagementMock/);
});

test("space workspace detail reads samples from the renamed list mock envelope", () => {
  assert.match(workspaceSource, /import \{ ontologySpaceListMock \} from "@\/mocks\/ontologySpaceListMock\/ontologySpaceListMock";/);
  assert.match(workspaceSource, /findSpaceById\(ontologySpaceListMock\.data, spaceId\.value\)/);
  assert.doesNotMatch(workspaceSource, /ontologySpaceManagementMock/);
});
