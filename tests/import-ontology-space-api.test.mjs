import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("import ontology space api types cover the binary file and string list data", () => {
  const apiTypeSource = readSource("../src/types/apis/importOntologySpaceType.ts");
  const typeBarrelSource = readSource("../src/types/index.ts");
  assert.match(apiTypeSource, /export interface ImportOntologySpaceParams/);
  assert.match(apiTypeSource, /file:\s*File/);
  assert.match(apiTypeSource, /export type ImportOntologySpaceData = string\[\]/);
  assert.match(typeBarrelSource, /export type \{ ImportOntologySpaceData, ImportOntologySpaceParams \} from "\.\/apis\/importOntologySpaceType";/);
});

test("import ontology space api posts the file as multipart form data to the prefixed import uri", () => {
  const apiSource = readSource("../src/apis/ontologyManageApi.ts");
  const fn = apiSource.match(/export function postImportOntologySpaceInterface[\s\S]*?\n\}/);
  assert.ok(fn, "missing import interface");
  assert.match(fn[0], /Promise<ApiResponse<ImportOntologySpaceData>>/);
  assert.match(fn[0], /request<ImportOntologySpaceData>\(\{/);
  assert.match(fn[0], /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/space\/import"/);
  assert.match(fn[0], /method:\s*"post"/);
  assert.match(fn[0], /const formData = new FormData\(\)/);
  assert.match(fn[0], /formData\.append\("file", params\.file\)/);
  assert.match(fn[0], /data:\s*formData/);
  assert.match(fn[0], /Content-Type.*multipart\/form-data/);
  assert.match(apiSource, /import type \{[\s\S]*ImportOntologySpaceData[\s\S]*ImportOntologySpaceParams[\s\S]*\} from "@\/types"/);
});

test("apis barrel exports the space import interface in dictionary order", () => {
  const apiBarrelSource = readSource("../src/apis/index.ts");
  assert.match(
    apiBarrelSource,
    /import \{[\s\S]*?postCreateOntologyRelationCategoryTreeInterface,[\s\S]*?postImportOntologySpaceInterface,[\s\S]*?postUploadOntologyThumbnailInterface[\s\S]*?\} from "\.\/ontologyManageApi";/,
  );
  assert.match(
    apiBarrelSource,
    /export \{[\s\S]*?postCreateOntologyRelationCategoryTreeInterface,[\s\S]*?postImportOntologySpaceInterface,[\s\S]*?postLoginInterface[\s\S]*?\};/,
  );
});

test("import ontology space mock uses the structural string list sample", () => {
  const mockSource = readSource("../src/mocks/importOntologySpaceMock/importOntologySpaceMock.ts");
  assert.match(mockSource, /export const importOntologySpaceMock: ApiResponse<ImportOntologySpaceData> = \{/);
  assert.match(mockSource, /code: 200,/);
  assert.match(mockSource, /message: "SUCCESS",/);
  assert.match(mockSource, /success: true,/);
  assert.match(mockSource, /"imported-item"/);
});

test("create dialog import mode submits the selected file to the import api", () => {
  const dialogSource = readSource("../src/views/OntologySpaceManagement/components/SpaceFormDialog.vue");
  const actionsSource = readSource("../src/views/OntologySpaceManagement/composables/useSpaceManagementActions.ts");
  const pageSource = readSource("../src/views/OntologySpaceManagement/index.vue");
  assert.match(dialogSource, /postImportOntologySpaceInterface\(\{ file: importFile\.value \}\)/);
  assert.match(dialogSource, /response\.code !== 200/);
  assert.match(dialogSource, /emit\("imported"\)/);
  assert.doesNotMatch(dialogSource, /parseSpaceImport/);
  assert.match(pageSource, /@imported="completeOntologySpaceImport"/);
  assert.match(actionsSource, /function completeOntologySpaceImport/);
  assert.match(actionsSource, /ElMessage\.success\("导入成功"\)/);
  assert.match(actionsSource, /loadOntologySpaces/);
});
