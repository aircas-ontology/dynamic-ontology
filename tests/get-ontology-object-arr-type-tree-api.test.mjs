import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("object attribute panel queries the category tree with the route object identifier", () => {
  const source = readSource("../src/views/OntologyObjectAttributePanel/composables/useAttributeCategoryTree.ts");
  const treeSource = readSource("../src/views/OntologyObjectAttributePanel/components/AttributeCategoryTree.vue");
  const createDialogSource = readSource("../src/views/OntologyObjectAttributePanel/components/AttributeCategoryCreateDialog.vue");
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
