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
  assert.doesNotMatch(apiSource, /timeout:/);
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
  assert.match(typeSource, /apiName\?:\s*string/);
  assert.match(typeSource, /description\?:\s*string/);
  assert.match(typeSource, /ontologyIconFrom\?:\s*string/);
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
  assert.match(mockSource, /categoryId:\s*24/);
  assert.match(mockSource, /name: "全部"/);
  assert.match(mockSource, /uniqueIdentifier: "f5dd661753f84476a652d120be86adb5"/);
  assert.match(mockSource, /name: "人员借调"/);
  assert.match(mockSource, /apiName: "jiediao"/);
  assert.match(mockSource, /description: "班级1借调班级2 语文老师"/);
  assert.match(mockSource, /categoryId:\s*30/);
});

test("relation category tree mapper builds page nodes from categoryId and name", async () => {
  const mapperUrl = new URL("../src/views/OntologySpaceManagementDetail/utils/mapOntologyRelationCategoryTree.ts", import.meta.url);
  assert.equal(existsSync(mapperUrl), true, "missing mapper file");
  const { mapOntologyRelationCategoryTree, mapOntologyRelationLinks } = await import(mapperUrl.href);
  const treeData = {
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
        apiName: "link_a",
        description: "根分类下的关系",
      },
    ],
    children: [
      {
        categoryId: 2,
        name: "编制隶书",
        links: [
          {
            uniqueIdentifier: "l1",
            name: "dup",
            type: "COMPOSITION",
            categoryId: 2,
            ontologyUniqueIdentifierFrom: "a",
            ontologyNameFrom: "x",
            ontologyUniqueIdentifierTo: "b",
            ontologyNameTo: "y",
          },
          {
            uniqueIdentifier: "l2",
            name: "指挥",
            type: "COMPOSITION",
            categoryId: 2,
            ontologyUniqueIdentifierFrom: "c",
            ontologyNameFrom: "飞机",
            ontologyUniqueIdentifierTo: "d",
            ontologyNameTo: "舰船1",
            apiName: "command",
            description: "指挥关系描述",
          },
        ],
        children: [{ categoryId: 3, name: "指挥控制" }],
      },
    ],
  };
  const tree = mapOntologyRelationCategoryTree(treeData);
  assert.equal(tree.length, 1);
  assert.equal(tree[0]?.id, "1");
  assert.equal(tree[0]?.label, "全部关系1");
  assert.equal(tree[0]?.children[0]?.id, "2");
  assert.equal(tree[0]?.children[0]?.label, "编制隶书");
  assert.equal(tree[0]?.children[0]?.children[0]?.id, "3");
  assert.equal(tree[0]?.children[0]?.children[0]?.label, "指挥控制");

  const relations = mapOntologyRelationLinks(treeData);
  assert.equal(relations.length, 2);
  assert.deepEqual(relations[0], {
    id: "l1",
    categoryId: "1",
    categoryName: "全部关系1",
    displayName: "a",
    apiName: "link_a",
    sourceName: "舰船2",
    targetName: "舰船1",
    cardinality: "一对多",
    description: "根分类下的关系",
  });
  assert.equal(relations[1]?.id, "l2");
  assert.equal(relations[1]?.displayName, "指挥");
  assert.equal(relations[1]?.categoryId, "2");
  assert.equal(relations[1]?.categoryName, "编制隶书");
  assert.equal(relations[1]?.apiName, "command");
  assert.equal(relations[1]?.description, "指挥关系描述");
  assert.equal(relations[1]?.sourceName, "飞机");
  assert.equal(relations[1]?.targetName, "舰船1");
});

test("relation workspace loads category tree api and maps links into relations", () => {
  const workspaceSource = readSource("../src/views/OntologySpaceManagementDetail/composables/useSpaceRelationWorkspace.ts");
  const panelSource = readSource("../src/views/OntologySpaceManagementDetail/relationComponents/RelationCategoryPanel.vue");
  const tableSource = readSource("../src/views/OntologySpaceManagementDetail/relationComponents/SpaceRelationWorkspace.vue");
  assert.match(workspaceSource, /getOntologyRelationCategoryTreeInterface/);
  assert.match(workspaceSource, /mapOntologyRelationCategoryTree/);
  assert.match(workspaceSource, /mapOntologyRelationLinks/);
  assert.match(workspaceSource, /relations:\s*mapOntologyRelationLinks\(relationResponse\.data\)/);
  assert.match(workspaceSource, /isMissingOntologyRelationCategoryTreeData|data == null|data === undefined/);
  assert.match(panelSource, /添加关系分类/);
  assert.match(panelSource, /kind:\s*"relation"/);
  assert.match(panelSource, /item\.displayName/);
  assert.match(panelSource, /<FolderOpened \/>/);
  assert.doesNotMatch(panelSource, /CollectionTag/);
  assert.match(panelSource, /relation-category-panel__relation-row/);
  assert.match(panelSource, /relation-category-panel__relation-dot/);
  assert.doesNotMatch(panelSource, /children:\s*\[\]/);
  assert.doesNotMatch(panelSource, /default-expand-all/);
  assert.match(panelSource, /:default-expanded-keys="defaultExpandedKeys"/);
  assert.match(panelSource, /:expand-on-click-node="false"/);
  assert.match(panelSource, /\.relation-category-panel__tree-node \{[\s\S]*?flex: 1;/);
  assert.match(panelSource, /\.el-tree-node__expand-icon[\s\S]*flex-shrink:\s*0/);
  assert.match(panelSource, /\.el-tree-node__expand-icon\.is-leaf[\s\S]*color:\s*var\(--aircas-color-transparent\)/);
  assert.doesNotMatch(workspaceSource, /createOntologySpaceRelationWorkspaceData\(\)/);
  assert.match(tableSource, /label="源对象"/);
  assert.match(tableSource, /label="目标对象"/);
  assert.match(tableSource, /prop="apiName"/);
  assert.match(tableSource, /prop="categoryName"/);
  assert.match(tableSource, /prop="description"/);
  assert.match(tableSource, /postCreateOntologyLinkInterface/);
  assert.match(tableSource, /loadSpaceRelationWorkspace\(\)/);
  assert.doesNotMatch(tableSource, /createRelationClass\(\{/);
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
