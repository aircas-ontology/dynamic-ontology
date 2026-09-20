import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("relation category tree api issues a GET to link_category tree uri with spaceId", () => {
  const apiSource = readSource("../src/apis/ontologyManageApi.ts");
  const barrelSource = readSource("../src/apis/index.ts");
  assert.match(
    apiSource,
    /export function getOntologyRelationCategoryTreeInterface\(\s*params: OntologyRelationCategoryTreeParams,?\s*\): Promise<ApiResponse<OntologyRelationCategoryTreeData>>/,
  );
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/link_category\/tree"/);
  assert.match(apiSource, /method:\s*"get"/);
  assert.match(apiSource, /params,/);
  assert.match(apiSource, /timeout: requestTimeoutMs,/);
  assert.match(apiSource, /@param \{string\} params\.spaceId/);
  assert.match(barrelSource, /getOntologyRelationCategoryTreeInterface/);
});

test("relation category tree types cover params, links, and recursive children", () => {
  const typeSource = readSource("../src/types/apis/ontologyRelationCategoryTreeType.ts");
  const barrelSource = readSource("../src/types/index.ts");
  assert.match(typeSource, /export interface OntologyRelationCategoryTreeParams/);
  assert.match(typeSource, /spaceId:\s*string/);
  assert.match(typeSource, /export interface OntologyRelationCategoryLink/);
  assert.match(typeSource, /uniqueIdentifier:\s*string/);
  assert.match(typeSource, /ontologyNameFrom:\s*string/);
  assert.match(typeSource, /ontologyNameTo:\s*string/);
  assert.match(typeSource, /export interface OntologyRelationCategoryTreeNode/);
  assert.match(typeSource, /categoryId:\s*number/);
  assert.match(typeSource, /links\?:\s*OntologyRelationCategoryLink\[\]/);
  assert.match(typeSource, /children\?:\s*OntologyRelationCategoryTreeNode\[\]/);
  assert.match(typeSource, /export type OntologyRelationCategoryTreeData = OntologyRelationCategoryTreeNode/);
  assert.match(barrelSource, /OntologyRelationCategoryTreeData/);
  assert.match(barrelSource, /OntologyRelationCategoryTreeParams/);
  assert.match(barrelSource, /from "\.\/apis\/ontologyRelationCategoryTreeType"/);
});

test("relation category tree mock mirrors the SUCCESS sample", () => {
  const mockSource = readSource("../src/mocks/ontologyRelationCategoryTreeMock/ontologyRelationCategoryTreeMock.ts");
  assert.match(mockSource, /export const ontologyRelationCategoryTreeMock: ApiResponse<OntologyRelationCategoryTreeData>/);
  assert.match(mockSource, /code: 200,/);
  assert.match(mockSource, /message: "SUCCESS",/);
  assert.match(mockSource, /success: true,/);
  assert.match(mockSource, /categoryId:\s*1/);
  assert.match(mockSource, /name: "全部关系1"/);
  assert.match(mockSource, /uniqueIdentifier: "4fcd1a4cb21244898ee0497b6e529625"/);
  assert.match(mockSource, /name: "编制隶书"/);
  assert.match(mockSource, /name: "指挥控制"/);
});

test("relation category tree mapper builds page nodes from categoryId and name", async () => {
  const mapperUrl = new URL("../src/views/OntologySpaceManagementDetail/utils/mapOntologyRelationCategoryTree.ts", import.meta.url);
  assert.equal(existsSync(mapperUrl), true, "missing mapper file");
  const { mapOntologyRelationCategoryTree } = await import(mapperUrl.href);
  const tree = mapOntologyRelationCategoryTree({
    categoryId: 1,
    name: "全部关系1",
    links: [
      {
        uniqueIdentifier: "l1",
        name: "a",
        type: "COMPOSITION",
        categoryId: 1,
        ontologyUniqueIdentifierFrom: "a",
        ontologyNameFrom: "舰船2",
        ontologyUniqueIdentifierTo: "b",
        ontologyNameTo: "舰船1",
      },
    ],
    children: [{ categoryId: 2, name: "编制隶书", children: [{ categoryId: 3, name: "指挥控制" }] }],
  });
  assert.equal(tree.length, 1);
  assert.equal(tree[0]?.id, "1");
  assert.equal(tree[0]?.label, "全部关系1");
  assert.equal(tree[0]?.children[0]?.id, "2");
  assert.equal(tree[0]?.children[0]?.label, "编制隶书");
  assert.equal(tree[0]?.children[0]?.children[0]?.id, "3");
  assert.equal(tree[0]?.children[0]?.children[0]?.label, "指挥控制");
});

test("relation workspace loads category tree api and keeps relations empty until links can map", () => {
  const workspaceSource = readSource("../src/views/OntologySpaceManagementDetail/composables/useSpaceRelationWorkspace.ts");
  const panelSource = readSource("../src/views/OntologySpaceManagementDetail/relationComponents/RelationCategoryPanel.vue");
  assert.match(workspaceSource, /getOntologyRelationCategoryTreeInterface/);
  assert.match(workspaceSource, /mapOntologyRelationCategoryTree/);
  assert.match(workspaceSource, /relations:\s*\[\]/);
  assert.match(workspaceSource, /isMissingOntologyRelationCategoryTreeData|data == null|data === undefined/);
  assert.match(panelSource, /添加关系分类/);
  assert.doesNotMatch(workspaceSource, /createOntologySpaceRelationWorkspaceData\(\)/);
});

test("create relation category api posts spaceId parentId and name to link_category uri", () => {
  const apiSource = readSource("../src/apis/ontologyManageApi.ts");
  const typeSource = readSource("../src/types/apis/ontologyRelationCategoryTreeType.ts");
  const mockSource = readSource("../src/mocks/ontologyRelationCategoryTreeMock/ontologyRelationCategoryTreeMock.ts");
  const barrelSource = readSource("../src/apis/index.ts");
  assert.match(
    apiSource,
    /export function postCreateOntologyRelationCategoryTreeInterface\(\s*payload: CreateOntologyRelationCategoryTreeParams,?\s*\): Promise<ApiResponse<undefined>>/,
  );
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/link_category"/);
  assert.match(apiSource, /method:\s*"post"/);
  assert.match(apiSource, /data: payload/);
  assert.match(apiSource, /@param \{number\} payload\.spaceId/);
  assert.match(apiSource, /@param \{number\} payload\.parentId/);
  assert.match(apiSource, /@param \{string\} payload\.name/);
  assert.match(typeSource, /export interface CreateOntologyRelationCategoryTreeParams/);
  assert.match(typeSource, /spaceId:\s*number/);
  assert.match(typeSource, /parentId:\s*number/);
  assert.match(typeSource, /name:\s*string/);
  assert.match(mockSource, /export const createOntologyRelationCategoryTreeMock: ApiResponse<undefined>/);
  assert.match(mockSource, /message: "SUCCESS"/);
  assert.match(barrelSource, /postCreateOntologyRelationCategoryTreeInterface/);
});

test("relation workspace create category posts api then reloads and does not send color", () => {
  const panelSource = readSource("../src/views/OntologySpaceManagementDetail/relationComponents/SpaceRelationWorkspace.vue");
  assert.match(panelSource, /postCreateOntologyRelationCategoryTreeInterface/);
  assert.match(panelSource, /parentId:\s*numericParentId/);
  assert.match(panelSource, /categoryParentId\.value\.trim\(\) === "" \? 0 : Number\(categoryParentId\.value\)/);
  assert.match(panelSource, /loadSpaceRelationWorkspace/);
  assert.match(panelSource, /postCreateOntologyRelationCategoryTreeInterface\(\{\s*spaceId:\s*numericSpaceId,\s*parentId:\s*numericParentId,\s*name,\s*\}\)/);
});

test("update relation category name api puts spaceId categoryId and name to link_category uri", () => {
  const apiSource = readSource("../src/apis/ontologyManageApi.ts");
  const typeSource = readSource("../src/types/apis/ontologyRelationCategoryTreeType.ts");
  const mockSource = readSource("../src/mocks/ontologyRelationCategoryTreeMock/ontologyRelationCategoryTreeMock.ts");
  const barrelSource = readSource("../src/apis/index.ts");
  assert.match(
    apiSource,
    /export function putUpdateOntologyRelationCategoryNameInterface\(\s*payload: UpdateOntologyRelationCategoryNameParams,?\s*\): Promise<ApiResponse<undefined>>/,
  );
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/link_category"/);
  assert.match(apiSource, /method:\s*"put"/);
  assert.match(apiSource, /@param \{number\} payload\.categoryId/);
  assert.match(typeSource, /export interface UpdateOntologyRelationCategoryNameParams/);
  assert.match(typeSource, /categoryId:\s*number/);
  assert.match(mockSource, /export const updateOntologyRelationCategoryNameMock: ApiResponse<undefined>/);
  assert.match(mockSource, /message: "SUCCESS"/);
  assert.match(barrelSource, /putUpdateOntologyRelationCategoryNameInterface/);
});

test("relation workspace edit category puts api then reloads and does not send color", () => {
  const panelSource = readSource("../src/views/OntologySpaceManagementDetail/relationComponents/SpaceRelationWorkspace.vue");
  assert.match(panelSource, /putUpdateOntologyRelationCategoryNameInterface/);
  assert.match(panelSource, /categoryId:\s*numericCategoryId/);
  assert.match(
    panelSource,
    /putUpdateOntologyRelationCategoryNameInterface\(\{\s*spaceId:\s*numericSpaceId,\s*categoryId:\s*numericCategoryId,\s*name,\s*\}\)/,
  );
  assert.match(panelSource, /分类已更新/);
  assert.doesNotMatch(panelSource, /editCategory\(\{\s*id:\s*categoryActionId/);
});

test("delete relation category api deletes spaceId and categoryId on link_category uri", () => {
  const apiSource = readSource("../src/apis/ontologyManageApi.ts");
  const typeSource = readSource("../src/types/apis/ontologyRelationCategoryTreeType.ts");
  const mockSource = readSource("../src/mocks/ontologyRelationCategoryTreeMock/ontologyRelationCategoryTreeMock.ts");
  const barrelSource = readSource("../src/apis/index.ts");
  assert.match(
    apiSource,
    /export function deleteOntologyRelationCategoryTreeInterface\(\s*payload: DeleteOntologyRelationCategoryTreeParams,?\s*\): Promise<ApiResponse<undefined>>/,
  );
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/link_category"/);
  assert.match(apiSource, /method:\s*"delete"/);
  assert.match(apiSource, /@param \{number\} payload\.spaceId/);
  assert.match(apiSource, /@param \{number\} payload\.categoryId/);
  assert.match(typeSource, /export interface DeleteOntologyRelationCategoryTreeParams/);
  assert.match(typeSource, /spaceId:\s*number/);
  assert.match(typeSource, /categoryId:\s*number/);
  assert.match(mockSource, /export const deleteOntologyRelationCategoryTreeMock: ApiResponse<undefined>/);
  assert.match(mockSource, /message: "SUCCESS"/);
  assert.match(barrelSource, /deleteOntologyRelationCategoryTreeInterface/);
});

test("relation workspace delete category calls api then reloads", () => {
  const panelSource = readSource("../src/views/OntologySpaceManagementDetail/relationComponents/SpaceRelationWorkspace.vue");
  assert.match(panelSource, /deleteOntologyRelationCategoryTreeInterface/);
  assert.match(panelSource, /deleteOntologyRelationCategoryTreeInterface\(\{\s*spaceId:\s*numericSpaceId,\s*categoryId:\s*numericCategoryId,\s*\}\)/);
  assert.match(panelSource, /分类已删除/);
  assert.doesNotMatch(panelSource, /deleteCategory\(categoryActionId/);
});
