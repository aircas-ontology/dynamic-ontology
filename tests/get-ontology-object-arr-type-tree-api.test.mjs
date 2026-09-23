import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("ontology object attribute category api follows the corrected GET contract", () => {
  const apiSource = readSource("../src/apis/ontologyObjectArrManageApi.ts");
  const typeSource = readSource("../src/types/apis/getOntologyObjectArrTypeTreeType.ts");
  const barrelSource = readSource("../src/apis/index.ts");
  const typeBarrelSource = readSource("../src/types/index.ts");
  const mockSource = readSource("../src/mocks/getOntologyObjectArrTypeTreeMock/getOntologyObjectArrTypeTreeMock.ts");

  assert.match(apiSource, /export function getOntologyObjectArrTypeTreeInterface\(/);
  assert.match(apiSource, /DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/property\/category"/);
  assert.match(apiSource, /method: "get"/);
  assert.match(apiSource, /params,/);
  assert.match(typeSource, /ontologyUniqueIdentifier: string/);
  assert.match(typeSource, /categoryId: number/);
  assert.match(typeSource, /propertyInfos\?: OntologyPropertyInfo\[\]/);
  assert.match(typeSource, /children\?: GetOntologyObjectArrTypeTreeData\[\]/);
  assert.match(barrelSource, /getOntologyObjectArrTypeTreeInterface/);
  assert.match(typeBarrelSource, /GetOntologyObjectArrTypeTreeData/);
  assert.match(mockSource, /code: 200/);
});

test("ontology object attribute category creation api follows the POST contract", () => {
  const apiSource = readSource("../src/apis/ontologyObjectArrManageApi.ts");
  const typeSource = readSource("../src/types/apis/createOntologyObjectArrTypeTreeType.ts");
  const barrelSource = readSource("../src/apis/index.ts");
  const typeBarrelSource = readSource("../src/types/index.ts");
  const mockSource = readSource("../src/mocks/createOntologyObjectArrTypeTreeMock/createOntologyObjectArrTypeTreeMock.ts");

  assert.match(apiSource, /export function createOntologyObjectArrTypeTreeInterface\(/);
  assert.match(apiSource, /method: "post"/);
  assert.match(apiSource, /data: params/);
  assert.match(typeSource, /ontologyIdentifier: string/);
  assert.match(typeSource, /parentId: number/);
  assert.match(typeSource, /name: string/);
  assert.match(barrelSource, /createOntologyObjectArrTypeTreeInterface/);
  assert.match(typeBarrelSource, /CreateOntologyObjectArrTypeTreeParams/);
  assert.match(mockSource, /code: 200/);
});

test("ontology object attribute category update api follows the PUT contract", () => {
  const apiSource = readSource("../src/apis/ontologyObjectArrManageApi.ts");
  const typeSource = readSource("../src/types/apis/updateOntologyObjectArrTypeTreeType.ts");
  const barrelSource = readSource("../src/apis/index.ts");
  const typeBarrelSource = readSource("../src/types/index.ts");
  const mockSource = readSource("../src/mocks/updateOntologyObjectArrTypeTreeMock/updateOntologyObjectArrTypeTreeMock.ts");

  assert.match(apiSource, /export function updateOntologyObjectArrTypeTreeInterface\(/);
  assert.match(apiSource, /method: "put"/);
  assert.match(apiSource, /data: params/);
  assert.match(typeSource, /ontologyIdentifier: string/);
  assert.match(typeSource, /categoryId: number/);
  assert.match(typeSource, /name: string/);
  assert.match(barrelSource, /updateOntologyObjectArrTypeTreeInterface/);
  assert.match(typeBarrelSource, /UpdateOntologyObjectArrTypeTreeParams/);
  assert.match(mockSource, /code: 200/);
});

test("ontology object attribute category delete api follows the DELETE contract", () => {
  const apiSource = readSource("../src/apis/ontologyObjectArrManageApi.ts");
  const typeSource = readSource("../src/types/apis/deleteOntologyObjectArrTypeTreeType.ts");
  const barrelSource = readSource("../src/apis/index.ts");
  const typeBarrelSource = readSource("../src/types/index.ts");
  const mockSource = readSource("../src/mocks/deleteOntologyObjectArrTypeTreeMock/deleteOntologyObjectArrTypeTreeMock.ts");

  assert.match(apiSource, /export function deleteOntologyObjectArrTypeTreeInterface\(/);
  assert.match(apiSource, /method: "delete"/);
  assert.match(apiSource, /data: params/);
  assert.match(typeSource, /ontologyIdentifier: string/);
  assert.match(typeSource, /categoryId: number/);
  assert.match(barrelSource, /deleteOntologyObjectArrTypeTreeInterface/);
  assert.match(typeBarrelSource, /DeleteOntologyObjectArrTypeTreeParams/);
  assert.match(mockSource, /code: 200/);
});

test("object attribute panel queries the category tree with the route object identifier", () => {
  const source = readSource("../src/views/OntologyObjectDetail/composables/useAttributeCategoryTree.ts");
  const treeSource = readSource("../src/views/OntologyObjectDetail/components/AttributeCategoryTree.vue");
  const createDialogSource = readSource("../src/views/OntologyObjectDetail/components/AttributeCategoryCreateDialog.vue");
  assert.match(source, /getOntologyObjectArrTypeTreeInterface/);
  assert.match(source, /useRoute/);
  assert.match(source, /ontologyUniqueIdentifier/);
  assert.match(source, /categoryTreeLoading/);
  assert.match(source, /categoryTreeError/);
  assert.match(source, /categoryTreeEmpty/);
  assert.match(treeSource, /暂无分类树数据/);
  assert.match(treeSource, /<FolderOpened \/>/);
  assert.doesNotMatch(treeSource, /CollectionTag/);
  assert.match(treeSource, /创建分类/);
  assert.match(source, /parentId: Number\(categoryParentId\.value\) \|\| 0/);
  assert.match(source, /categoryParentName/);
  assert.match(createDialogSource, /readonly/);
  assert.match(source, /createOntologyObjectArrTypeTreeInterface/);
  assert.match(source, /updateOntologyObjectArrTypeTreeInterface/);
  assert.match(source, /categoryEditDialogVisible/);
  assert.match(source, /function saveCategoryEdit/);
  assert.match(source, /deleteOntologyObjectArrTypeTreeInterface/);
  assert.match(source, /ElMessageBox\.confirm/);
});
