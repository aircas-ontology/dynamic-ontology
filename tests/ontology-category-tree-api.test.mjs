import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("ontology category tree api issues a GET to the manage domain ontology uri with spaceId params", () => {
  const apiSource = readSource("../src/apis/ontologyManageApi.ts");
  assert.match(apiSource, /export function getOntologyCategoryTreeInterface\(/);
  assert.match(apiSource, /params: OntologyCategoryTreeParams/);
  assert.match(apiSource, /Promise<ApiResponse<OntologyCategoryTreeData>>/);
  assert.match(apiSource, /request<OntologyCategoryTreeData>\(\{/);
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/category\/tree"/);
  assert.match(apiSource, /method:\s*"get"/);
  assert.match(apiSource, /params,/);
  assert.match(apiSource, /@description/);
});

test("apis barrel exports category tree interface in dictionary order", () => {
  const apiBarrelSource = readSource("../src/apis/index.ts");
  assert.match(
    apiBarrelSource,
    /import\s*\{[\s\S]*?createOntologySpaceInterface,[\s\S]*?deleteOntologyCategoryTreeInterface,[\s\S]*?deleteOntologySpaceInterface,[\s\S]*?getOntologyCategoryTreeInterface,[\s\S]*?getOntologySpaceListInterface,[\s\S]*?postCreateOntologyCategoryTreeInterface,[\s\S]*?updateOntologySpaceInterface[\s\S]*?\}\s*from "\.\/ontologyManageApi";/,
  );
  assert.match(
    apiBarrelSource,
    /export\s*\{[\s\S]*?createOntologySpaceInterface,[\s\S]*?deleteOntologyCategoryTreeInterface,[\s\S]*?deleteOntologySpaceInterface,[\s\S]*?getExampleInterface,[\s\S]*?getOntologyCategoryTreeInterface,[\s\S]*?getOntologySpaceListInterface,[\s\S]*?postCreateOntologyCategoryTreeInterface,[\s\S]*?postLoginInterface,[\s\S]*?updateOntologySpaceInterface[\s\S]*?\};/,
  );
});

test("ontology category tree types cover params, recursive node, and meta infos", () => {
  const apiTypeSource = readSource("../src/types/apis/ontologyCategoryTreeType.ts");
  const typeBarrelSource = readSource("../src/types/index.ts");
  assert.match(apiTypeSource, /export interface OntologyCategoryTreeParams/);
  assert.match(apiTypeSource, /spaceId:\s*string/);
  assert.match(apiTypeSource, /export interface OntologyCategoryTreeNode/);
  assert.match(apiTypeSource, /categoryId:\s*number/);
  assert.match(apiTypeSource, /name\?:\s*string/);
  assert.match(apiTypeSource, /ontologyMetaInfos\?:\s*OntologyCategoryMetaInfo\[\]/);
  assert.match(apiTypeSource, /children\?:\s*OntologyCategoryTreeNode\[\]/);
  assert.match(apiTypeSource, /export interface OntologyCategoryMetaInfo/);
  assert.match(apiTypeSource, /uniqueIdentifier:\s*string/);
  assert.match(apiTypeSource, /parentOntologyUniqueIdentifier\?:\s*string/);
  assert.match(apiTypeSource, /export type OntologyCategoryTreeData = OntologyCategoryTreeNode/);
  assert.match(typeBarrelSource, /OntologyCategoryMetaInfo/);
  assert.match(typeBarrelSource, /OntologyCategoryTreeData/);
  assert.match(typeBarrelSource, /OntologyCategoryTreeNode/);
  assert.match(typeBarrelSource, /OntologyCategoryTreeParams/);
  assert.match(typeBarrelSource, /from "\.\/apis\/ontologyCategoryTreeType"/);
});

test("category tree mock mirrors the contract sample with success message", () => {
  const mockSource = readSource("../src/mocks/ontologyCategoryTreeMock/ontologyCategoryTreeMock.ts");
  assert.match(mockSource, /export const ontologyCategoryTreeMock: ApiResponse<OntologyCategoryTreeData>/);
  assert.match(mockSource, /code: 200,/);
  assert.match(mockSource, /message: "查询成功",/);
  assert.match(mockSource, /success: true,/);
  assert.match(mockSource, /categoryId:\s*1/);
  assert.match(mockSource, /displayName: "舰船"/);
  assert.match(mockSource, /categoryId:\s*4/);
});

test("category tree mapper builds concept nodes with empty name and local meta count", async () => {
  const mapperUrl = new URL("../src/views/OntologySpaceManagementDetail/utils/mapOntologyCategoryTree.ts", import.meta.url);
  assert.equal(existsSync(mapperUrl), true, "missing mapper file");
  const { mapOntologyCategoryTree } = await import(mapperUrl.href);
  const tree = mapOntologyCategoryTree({
    categoryId: 1,
    name: "舰船",
    ontologyMetaInfos: [{}, {}, {}],
    children: [{ categoryId: 4 }],
  });
  assert.equal(tree.length, 1);
  assert.equal(tree[0]?.id, "1");
  assert.equal(tree[0]?.label, "舰船");
  assert.equal(tree[0]?.count, 3);
  assert.equal(tree[0]?.targetCategoryId, "1");
  assert.equal(tree[0]?.children[0]?.id, "4");
  assert.equal(tree[0]?.children[0]?.label, "");
  assert.equal(tree[0]?.children[0]?.count, 0);
});

test("object workspace loads category tree api into the left tree and keeps sections empty", () => {
  const workspaceSource = readSource("../src/views/OntologySpaceManagementDetail/composables/useOntologyObjectWorkspace.ts");
  assert.match(workspaceSource, /getOntologyCategoryTreeInterface/);
  assert.match(workspaceSource, /mapOntologyCategoryTree/);
  assert.match(workspaceSource, /sections:\s*\[\]/);
  assert.doesNotMatch(workspaceSource, /ontologySpaceObjectMock/);
});

test("create category tree api posts name, parentId and spaceId to the category uri", () => {
  const apiSource = readSource("../src/apis/ontologyManageApi.ts");
  const typeSource = readSource("../src/types/apis/ontologyCategoryTreeType.ts");
  const mockSource = readSource("../src/mocks/ontologyCategoryTreeMock/ontologyCategoryTreeMock.ts");
  const panelSource = readSource("../src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue");
  assert.match(
    apiSource,
    /export function postCreateOntologyCategoryTreeInterface\(payload: CreateOntologyCategoryTreeParams\): Promise<ApiResponse<undefined>>/,
  );
  assert.match(apiSource, /method:\s*"post"/);
  assert.match(apiSource, /data: payload/);
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/category"/);
  assert.match(typeSource, /export interface CreateOntologyCategoryTreeParams[\s\S]*spaceId:\s*number;[\s\S]*parentId:\s*number;/);
  assert.match(panelSource, /const numericSpaceId = Number\(space\)/);
  assert.match(panelSource, /spaceId:\s*numericSpaceId/);
  assert.match(mockSource, /export const createOntologyCategoryTreeMock: ApiResponse<undefined>/);
  assert.match(mockSource, /message: "SUCCESS"/);
  assert.match(panelSource, /postCreateOntologyCategoryTreeInterface/);
  assert.match(panelSource, /parentId:\s*0/);
});

test("delete category tree api sends spaceId and categoryId with delete", () => {
  const apiSource = readSource("../src/apis/ontologyManageApi.ts");
  const typeSource = readSource("../src/types/apis/ontologyCategoryTreeType.ts");
  const mockSource = readSource("../src/mocks/ontologyCategoryTreeMock/ontologyCategoryTreeMock.ts");
  const panelSource = readSource("../src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue");
  assert.match(apiSource, /export function deleteOntologyCategoryTreeInterface\(payload: DeleteOntologyCategoryTreeParams\): Promise<ApiResponse<undefined>>/);
  assert.match(apiSource, /method:\s*"delete"/);
  assert.match(apiSource, /data: payload/);
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/category"/);
  assert.match(typeSource, /export interface DeleteOntologyCategoryTreeParams[\s\S]*spaceId:\s*number;[\s\S]*categoryId:\s*number;/);
  assert.match(mockSource, /export const deleteOntologyCategoryTreeMock: ApiResponse<undefined>/);
  assert.match(mockSource, /message: "SUCCESS"/);
  assert.match(panelSource, /deleteOntologyCategoryTreeInterface/);
  assert.match(panelSource, /categoryId: numericCategoryId/);
});

test("update category name api puts spaceId, categoryId and name to the category uri", () => {
  const apiSource = readSource("../src/apis/ontologyManageApi.ts");
  const typeSource = readSource("../src/types/apis/ontologyCategoryTreeType.ts");
  const mockSource = readSource("../src/mocks/ontologyCategoryTreeMock/ontologyCategoryTreeMock.ts");
  const panelSource = readSource("../src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue");
  const barrelSource = readSource("../src/apis/index.ts");
  assert.match(
    apiSource,
    /export function putUpdateOntologyCategoryNameInterface\(payload: UpdateOntologyCategoryNameParams\): Promise<ApiResponse<undefined>>/,
  );
  assert.match(apiSource, /method:\s*"put"/);
  assert.match(apiSource, /data: payload/);
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/category"/);
  assert.match(typeSource, /export interface UpdateOntologyCategoryNameParams[\s\S]*spaceId:\s*number;[\s\S]*categoryId:\s*number;[\s\S]*name:\s*string;/);
  assert.match(mockSource, /export const updateOntologyCategoryNameMock: ApiResponse<undefined>/);
  assert.match(mockSource, /message: "SUCCESS"/);
  assert.match(panelSource, /putUpdateOntologyCategoryNameInterface/);
  assert.match(panelSource, /name,/);
  assert.match(barrelSource, /putUpdateOntologyCategoryNameInterface/);
});
