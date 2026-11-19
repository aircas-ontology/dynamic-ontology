import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

/**
 * @description 读取仓库内相对路径源码。
 * @param {string} relativePath 相对本测试文件的路径。
 * @returns {string} 文件原文。
 */
const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("export api doc types cover required spaceId and file response fields", () => {
  const apiTypeSource = readSource("../src/types/apis/exportApiDocType.ts");
  const typeBarrelSource = readSource("../src/types/index.ts");
  assert.match(apiTypeSource, /export interface ExportApiDocParams/);
  assert.match(apiTypeSource, /spaceId:\s*number/);
  assert.match(apiTypeSource, /export interface ExportApiDocFile/);
  assert.match(apiTypeSource, /blob:\s*Blob/);
  assert.match(apiTypeSource, /contentDisposition:\s*string/);
  assert.match(apiTypeSource, /contentType:\s*string/);
  assert.match(typeBarrelSource, /export type \{ ExportApiDocFile, ExportApiDocParams \} from "\.\/apis\/exportApiDocType";/);
});

test("export api doc api gets the prefixed ontology api_doc export uri as a blob", () => {
  const apiSource = readSource("../src/apis/ontologyManageApi.ts");
  assert.match(apiSource, /export async function getExportApiDocInterface\(params: ExportApiDocParams\): Promise<ExportApiDocFile>/);
  assert.match(apiSource, /requestFull<Blob>\(\{/);
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/api_doc\/export"/);
  assert.match(apiSource, /method:\s*"get"/);
  assert.match(apiSource, /params,/);
  assert.match(apiSource, /responseType:\s*"blob"/);
  assert.match(apiSource, /import type \{[\s\S]*ExportApiDocFile[\s\S]*ExportApiDocParams[\s\S]*\} from "@\/types"/);
});

test("apis barrel exports the api doc export interface in dictionary order", () => {
  const apiBarrelSource = readSource("../src/apis/index.ts");
  assert.match(
    apiBarrelSource,
    /import \{[\s\S]*?deleteOntologySpaceInterface,[\s\S]*?getExportApiDocInterface,[\s\S]*?getExportOntologySpaceInterface[\s\S]*?\} from "\.\/ontologyManageApi";/,
  );
  assert.match(apiBarrelSource, /export \{[\s\S]*?getExampleInterface,[\s\S]*?getExportApiDocInterface,[\s\S]*?getExportOntologyInterface[\s\S]*?\};/);
});

test("theme space management downloads api doc via export interface", () => {
  const themeSource = readSource("../src/views/ThemeSpaceManagement/index.vue");
  assert.match(themeSource, /getExportApiDocInterface/);
  assert.match(themeSource, /downloadThemeSpaceApiDoc/);
  assert.match(themeSource, /downloadSpaceFile/);
  assert.match(themeSource, /获取接口文档/);
  assert.match(themeSource, /api-doc-\$\{suffix\}\.html/);
});
