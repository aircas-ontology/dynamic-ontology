import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("import ontologies api types cover the binary file and empty data object", () => {
  const apiTypeSource = readSource("../src/types/apis/importOntologiesType.ts");
  const typeBarrelSource = readSource("../src/types/index.ts");
  assert.match(apiTypeSource, /export interface ImportOntologiesParams/);
  assert.match(apiTypeSource, /file:\s*File/);
  assert.match(apiTypeSource, /export type ImportOntologiesData = Record<string, unknown>/);
  assert.match(typeBarrelSource, /export type \{ ImportOntologiesData, ImportOntologiesParams \} from "\.\/apis\/importOntologiesType";/);
});

test("import ontologies api posts the file as multipart form data to the prefixed import uri", () => {
  const apiSource = readSource("../src/apis/ontologyObjectManageApi.ts");
  const fn = apiSource.match(/export function postImportOntologiesInterface[\s\S]*?\n\}/);
  assert.ok(fn, "missing import interface");
  assert.match(fn[0], /Promise<ApiResponse<ImportOntologiesData>>/);
  assert.match(fn[0], /request<ImportOntologiesData>\(\{/);
  assert.match(fn[0], /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/meta\/import"/);
  assert.match(fn[0], /method:\s*"post"/);
  assert.match(fn[0], /const formData = new FormData\(\)/);
  assert.match(fn[0], /formData\.append\("file", params\.file\)/);
  assert.match(fn[0], /data:\s*formData/);
  assert.match(fn[0], /Content-Type.*multipart\/form-data/);
  assert.match(apiSource, /import type \{[\s\S]*ImportOntologiesData[\s\S]*ImportOntologiesParams[\s\S]*\} from "@\/types"/);
});

test("apis barrel exports the ontology import interface in dictionary order", () => {
  const apiBarrelSource = readSource("../src/apis/index.ts");
  assert.match(
    apiBarrelSource,
    /import \{[\s\S]*?getOntologyObjectByCategoryIdInterface,[\s\S]*?postImportOntologiesInterface,[\s\S]*?updateOntologyObjectInterface[\s\S]*?\} from "\.\/ontologyObjectManageApi";/,
  );
  assert.match(
    apiBarrelSource,
    /export \{[\s\S]*?postCreateOntologyRelationCategoryTreeInterface,[\s\S]*?postImportOntologiesInterface,[\s\S]*?postImportOntologySpaceInterface[\s\S]*?\};/,
  );
});

test("import ontologies mock uses the structural empty data object", () => {
  const mockSource = readSource("../src/mocks/importOntologiesMock/importOntologiesMock.ts");
  assert.match(mockSource, /export const importOntologiesMock: ApiResponse<ImportOntologiesData> = \{/);
  assert.match(mockSource, /code: 200,/);
  assert.match(mockSource, /message: "SUCCESS",/);
  assert.match(mockSource, /success: true,/);
  assert.match(mockSource, /data: \{\},/);
});

test("object create dialog import mode submits the selected file to the import api", () => {
  const dialogSource = readSource("../src/views/OntologySpaceManagementDetail/components/OntologyObjectCreateDialog.vue");
  const actionsSource = readSource("../src/views/OntologySpaceManagementDetail/composables/useObjectWorkspaceObjectActions.ts");
  const panelSource = readSource("../src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue");
  assert.match(dialogSource, /emit\(\s*"submit-import",\s*importFile\.value\s*\)/);
  assert.match(dialogSource, /请先选择文件。/);
  assert.doesNotMatch(dialogSource, /JSON\.parse/);
  assert.match(panelSource, /@submit-import="importOntologyObjects"/);
  assert.match(actionsSource, /postImportOntologiesInterface\(\{ file \}\)/);
  assert.match(actionsSource, /response\.code !== 200/);
  assert.match(actionsSource, /ElMessage\.success\("导入成功"\)/);
  assert.match(actionsSource, /await load\(\)/);
});
