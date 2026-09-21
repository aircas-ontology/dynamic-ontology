import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("ontology space list api issues a GET to the manage domain space uri with the typed response contract", () => {
  const apiSource = readSource("../src/apis/ontologyManageApi.ts");
  assert.match(apiSource, /export function getOntologySpaceListInterface\(\): Promise<ApiResponse<OntologySpaceListData>>/);
  assert.match(apiSource, /request<OntologySpaceListData>\(\{/);
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/space"/);
  assert.match(apiSource, /method:\s*"get"/);
  assert.match(apiSource, /timeout: requestTimeoutMs,/);
  assert.match(apiSource, /import \{ requestTimeoutMs \} from "@\/utils\/constants";/);
  assert.match(apiSource, /import type \{[\s\S]*OntologySpaceListData[\s\S]*\} from "@\/types"/);
  assert.match(apiSource, /@description/);
  assert.doesNotMatch(apiSource, /LOGIN_URL/);
  assert.doesNotMatch(apiSource, /\/ontology\/user\/login/);
  assert.doesNotMatch(apiSource, /getOntologyListInterface/);
});

test("apis barrel exports the renamed interface in dictionary order without stale aliases", () => {
  const apiBarrelSource = readSource("../src/apis/index.ts");
  assert.match(
    apiBarrelSource,
    /import\s*\{[\s\S]*createOntologySpaceInterface,[\s\S]*deleteOntologyCategoryTreeInterface,[\s\S]*deleteOntologySpaceInterface,[\s\S]*getOntologyCategoryTreeInterface,[\s\S]*getOntologySpaceListInterface,[\s\S]*postCreateOntologyCategoryTreeInterface,[\s\S]*updateOntologySpaceInterface[\s\S]*\}\s*from "\.\/ontologyManageApi";/,
  );
  assert.match(
    apiBarrelSource,
    /export\s*\{[\s\S]*createOntologySpaceInterface,[\s\S]*deleteOntologyCategoryTreeInterface,[\s\S]*deleteOntologySpaceInterface,[\s\S]*getExampleInterface,[\s\S]*getOntologyCategoryTreeInterface,[\s\S]*getOntologySpaceListInterface,[\s\S]*postCreateOntologyCategoryTreeInterface,[\s\S]*postLoginInterface,[\s\S]*updateOntologySpaceInterface[\s\S]*\};/,
  );
  assert.doesNotMatch(apiBarrelSource, /getOntologyListInterface/);
});

test("ontology space list api types follow the contract item fields and array data", () => {
  const apiTypeSource = readSource("../src/types/apis/ontologyManageType.ts");
  const typeBarrelSource = readSource("../src/types/index.ts");
  assert.match(apiTypeSource, /export interface OntologySpaceListItem/);
  assert.match(apiTypeSource, /spaceId:\s*number/);
  assert.match(apiTypeSource, /ontologyCount:\s*number/);
  assert.match(apiTypeSource, /actionCount:\s*number/);
  assert.match(apiTypeSource, /propertyCount:\s*number/);
  assert.match(apiTypeSource, /linkCount:\s*number/);
  assert.match(apiTypeSource, /export type OntologySpaceListData = OntologySpaceListItem\[\]/);
  assert.doesNotMatch(apiTypeSource, /OntologySpaceItem/);
  assert.match(typeBarrelSource, /export type \{ OntologySpaceListData, OntologySpaceListItem \} from "\.\/apis\/ontologyManageType";/);
});

test("runtime domain config declares the ontology manage domain", () => {
  const runtimeConfigSource = readSource("../src/types/global/runtimeConfigType.ts");
  assert.match(runtimeConfigSource, /readonly ONTOLOGYMANAGE_URL: string;/);
});

test("page sample mock stays as OntologySpaceItem list for detail fallback", () => {
  const pageMockSource = readSource("../src/mocks/ontologySpaceListMock/ontologySpaceListMock.ts");
  assert.match(pageMockSource, /import type \{ ApiResponse, OntologySpaceItem \} from "@\/types";/);
  assert.match(pageMockSource, /export const ontologySpaceListMock: ApiResponse<OntologySpaceItem\[\]> = \{/);
  assert.match(pageMockSource, /success: true,/);
  assert.equal((pageMockSource.match(/displayName: ".*本体空间"/g) || []).length, 6);
  assert.doesNotMatch(pageMockSource, /OntologySpaceListData/);
});

test("api contract mock lives beside the page sample and mirrors the response sample", () => {
  const apiMockSource = readSource("../src/mocks/ontologySpaceListMock/ontologySpaceListApiMock.ts");
  assert.match(apiMockSource, /import type \{ ApiResponse, OntologySpaceListData \} from "@\/types";/);
  assert.match(apiMockSource, /export const ontologySpaceListApiMock: ApiResponse<OntologySpaceListData> = \{/);
  assert.match(apiMockSource, /code: 200,/);
  assert.match(apiMockSource, /message: "SUCCESS",/);
  assert.match(apiMockSource, /success: true,/);
  assert.match(apiMockSource, /spaceId:\s*1/);
  assert.match(apiMockSource, /ontologyCount:\s*2/);
  assert.match(apiMockSource, /actionCount:\s*0/);
  assert.match(apiMockSource, /propertyCount:\s*7/);
  assert.match(apiMockSource, /linkCount:\s*0/);
  assert.match(apiMockSource, /createTime:\s*"2026-09-21 10:47:32"/);
  assert.match(apiMockSource, /updateTime:\s*"2026-09-21 10:47:32"/);
});

test("mapper converts contract list items into page ontology space items", async () => {
  const mapperUrl = new URL("../src/utils/mapOntologySpaceList.ts", import.meta.url);
  assert.equal(existsSync(mapperUrl), true, "missing mapper file");
  const { mapOntologySpaceListItem } = await import(mapperUrl.href);
  const mapped = mapOntologySpaceListItem({
    iconUrl: "",
    displayName: "xxx战场",
    apiName: "space_a",
    description: "这是空间描述",
    spaceId: 1,
    ontologyCount: 2,
    actionCount: 0,
    propertyCount: 7,
    linkCount: 0,
    createTime: "2026-09-21 10:47:32",
    updateTime: "2026-09-21 10:47:32",
  });
  assert.equal(mapped.id, "1");
  assert.equal(mapped.metrics.ontology, 2);
  assert.equal(mapped.metrics.behavior, 0);
  assert.equal(mapped.metrics.relation, 0);
  assert.equal(mapped.metrics.rule, 7);
  assert.equal(mapped.metrics.source, 0);
  assert.equal(mapped.createdTime, "2026-09-21 10:47:32");
  assert.equal(mapped.updatedTime, "2026-09-21 10:47:32");
  assert.equal(mapped.category, "");
  assert.equal(mapped.isSubspace, false);
  assert.equal(mapped.parentSpaceDisplayName, "");
});

test("space management page maps successful list responses and falls back to page mock on failure", () => {
  const managementSource = readSource("../src/views/OntologySpaceManagement/composables/useSpaceManagement.ts");
  assert.match(managementSource, /import \{ getOntologySpaceListInterface \} from "@\/apis";/);
  assert.match(managementSource, /import \{ ontologySpaceListMock \} from "@\/mocks\/ontologySpaceListMock\/ontologySpaceListMock";/);
  assert.match(managementSource, /mapOntologySpaceList/);
  assert.match(managementSource, /getOntologySpaceListInterface\(\)/);
  assert.match(managementSource, /response\.code === 200/);
  assert.match(managementSource, /ontologySpaceListMock\.data/);
  assert.doesNotMatch(managementSource, /ontologySpaceManagementMock/);
});

test("space workspace detail resolves the current space from the list api", () => {
  const workspaceSource = readSource("../src/views/OntologySpaceManagementDetail/composables/useSpaceWorkspace.ts");
  assert.match(workspaceSource, /import \{ getOntologySpaceListInterface \} from "@\/apis";/);
  assert.match(workspaceSource, /import \{ mapOntologySpaceList \} from "@\/utils\/mapOntologySpaceList";/);
  assert.match(workspaceSource, /findSpaceById/);
  assert.match(workspaceSource, /getOntologySpaceListInterface\(\)/);
  assert.match(workspaceSource, /response\.code === 200/);
  assert.doesNotMatch(workspaceSource, /ontologySpaceListMock/);
  assert.doesNotMatch(workspaceSource, /ontologySpaceManagementMock/);
});
