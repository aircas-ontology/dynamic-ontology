import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("export ontology space api types cover the required spaceId and exportType query", () => {
  const apiTypeSource = readSource("../src/types/apis/exportOntologySpaceType.ts");
  const typeBarrelSource = readSource("../src/types/index.ts");
  assert.match(apiTypeSource, /export type OntologySpaceExportType = "SCHEMA" \| "INSTANCE"/);
  assert.match(apiTypeSource, /export interface ExportOntologySpaceParams/);
  assert.match(apiTypeSource, /spaceId:\s*number/);
  assert.match(apiTypeSource, /exportType:\s*OntologySpaceExportType/);
  assert.match(apiTypeSource, /export interface ExportOntologySpaceFile/);
  assert.match(apiTypeSource, /blob:\s*Blob/);
  assert.match(apiTypeSource, /contentDisposition:\s*string/);
  assert.match(apiTypeSource, /contentType:\s*string/);
  assert.match(
    typeBarrelSource,
    /export type \{ ExportOntologySpaceFile, ExportOntologySpaceParams, OntologySpaceExportType \} from "\.\/apis\/exportOntologySpaceType";/,
  );
});

test("export ontology space api gets the prefixed space export uri as a blob", () => {
  const apiSource = readSource("../src/apis/ontologyManageApi.ts");
  assert.match(apiSource, /export async function getExportOntologySpaceInterface\(params: ExportOntologySpaceParams\): Promise<ExportOntologySpaceFile>/);
  assert.match(apiSource, /requestFull<Blob>\(\{/);
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/space\/export"/);
  assert.match(apiSource, /method:\s*"get"/);
  assert.match(apiSource, /params\.exportType 导出类型，必填。SCHEMA 表示仅结构，INSTANCE 表示含实例数据。/);
  assert.match(apiSource, /params,/);
  assert.match(apiSource, /responseType:\s*"blob"/);
  assert.match(apiSource, /import type \{[\s\S]*ExportOntologySpaceFile[\s\S]*ExportOntologySpaceParams[\s\S]*\} from "@\/types"/);
});

test("apis barrel exports the space export interface in dictionary order", () => {
  const apiBarrelSource = readSource("../src/apis/index.ts");
  assert.match(
    apiBarrelSource,
    /import \{[\s\S]*?deleteOntologySpaceInterface,[\s\S]*?getExportOntologySpaceInterface,[\s\S]*?getOntologyCategoryTreeInterface[\s\S]*?\} from "\.\/ontologyManageApi";/,
  );
  assert.match(apiBarrelSource, /export \{[\s\S]*?getExampleInterface,[\s\S]*?getExportOntologySpaceInterface,[\s\S]*?getOntologyApiDocsInterface[\s\S]*?\};/);
});

test("space export confirmation calls the export api instead of local json", () => {
  const actionsSource = readSource("../src/views/OntologySpaceManagement/composables/useSpaceManagementActions.ts");
  const dialogSource = readSource("../src/views/OntologySpaceManagement/components/SpaceCommandDialogs.vue");
  assert.match(actionsSource, /confirmExportOntologySpace\(exportType: OntologySpaceExportType\)/);
  assert.match(actionsSource, /getExportOntologySpaceInterface\(\{ spaceId, exportType \}\)/);
  assert.doesNotMatch(actionsSource, /serializeSpace/);
  assert.match(dialogSource, /导出「\{\{ space\?\.displayName \}\}」。/);
  assert.match(dialogSource, /SCHEMA：仅结构/);
  assert.match(dialogSource, /INSTANCE：含实例数据/);
  assert.match(dialogSource, /ref<OntologySpaceExportType>\("INSTANCE"\)/);
  assert.match(dialogSource, /exportType\.value = "INSTANCE"/);
  assert.match(dialogSource, /class="aircas-radio-group space-command-dialogs__export-type"/);
  assert.match(dialogSource, /value="SCHEMA"/);
  assert.match(dialogSource, /value="INSTANCE"/);
  assert.match(dialogSource, /emit\('confirmExport', exportType\)/);
  assert.doesNotMatch(dialogSource, /分类树、本体 schema 与实例数据/);
  assert.doesNotMatch(dialogSource, /尚未接入/);
  assert.doesNotMatch(dialogSource, /导出 JSON/);
});

test("export file name prefers content disposition and falls back by content type", async () => {
  const resolverUrl = new URL("../src/views/OntologySpaceManagement/utils/resolveExportOntologySpaceFileName.ts", import.meta.url);
  const { resolveExportOntologySpaceFileName } = await import(resolverUrl.href);
  assert.equal(
    resolveExportOntologySpaceFileName({
      contentDisposition: "attachment; filename*=UTF-8''%E8%88%B0%E8%88%B9.zip",
      contentType: "application/zip",
      apiName: "ship",
      spaceId: 3,
    }),
    "舰船.zip",
  );
  assert.equal(
    resolveExportOntologySpaceFileName({
      contentDisposition: 'attachment; filename="space.json"',
      contentType: "application/octet-stream",
      apiName: "ship",
      spaceId: 3,
    }),
    "space.json",
  );
  assert.equal(
    resolveExportOntologySpaceFileName({
      contentDisposition: "",
      contentType: "application/json;charset=utf-8",
      apiName: "ship",
      spaceId: 3,
    }),
    "ship.json",
  );
  assert.equal(
    resolveExportOntologySpaceFileName({
      contentDisposition: "",
      contentType: "application/zip",
      apiName: "",
      spaceId: 3,
    }),
    "ontology-space-3.zip",
  );
  assert.equal(
    resolveExportOntologySpaceFileName({
      contentDisposition: "",
      contentType: "application/octet-stream",
      apiName: "ship",
      spaceId: 3,
    }),
    "ship",
  );
});
