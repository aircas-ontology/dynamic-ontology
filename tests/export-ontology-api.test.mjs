import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("export ontology api types cover the required uniqueIdentifier query", () => {
  const apiTypeSource = readSource("../src/types/apis/exportOntologyType.ts");
  const typeBarrelSource = readSource("../src/types/index.ts");
  assert.match(apiTypeSource, /export interface ExportOntologyParams/);
  assert.match(apiTypeSource, /uniqueIdentifier:\s*string/);
  assert.match(apiTypeSource, /export interface ExportOntologyFile/);
  assert.match(apiTypeSource, /blob:\s*Blob/);
  assert.match(apiTypeSource, /contentDisposition:\s*string/);
  assert.match(apiTypeSource, /contentType:\s*string/);
  assert.match(typeBarrelSource, /export type \{ ExportOntologyFile, ExportOntologyParams \} from "\.\/apis\/exportOntologyType";/);
});

test("export ontology api gets the prefixed meta export uri as a blob", () => {
  const apiSource = readSource("../src/apis/ontologyObjectManageApi.ts");
  assert.match(apiSource, /export async function getExportOntologyInterface\(params: ExportOntologyParams\): Promise<ExportOntologyFile>/);
  assert.match(apiSource, /requestFull<Blob>\(\{/);
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/meta\/export"/);
  assert.match(apiSource, /method:\s*"get"/);
  assert.match(apiSource, /params,/);
  assert.match(apiSource, /responseType:\s*"blob"/);
  assert.match(apiSource, /import type \{[\s\S]*ExportOntologyFile[\s\S]*ExportOntologyParams[\s\S]*\} from "@\/types"/);
});

test("apis barrel exports the ontology export interface in dictionary order", () => {
  const apiBarrelSource = readSource("../src/apis/index.ts");
  assert.match(
    apiBarrelSource,
    /import \{[\s\S]*?deleteOntologyObjectInterface,[\s\S]*?getExportOntologyInterface,[\s\S]*?getOntologyMetaStatisticInterface[\s\S]*?\} from "\.\/ontologyObjectManageApi";/,
  );
  assert.match(apiBarrelSource, /export \{[\s\S]*?getExampleInterface,[\s\S]*?getExportOntologyInterface,[\s\S]*?getExportOntologySpaceInterface[\s\S]*?\};/);
});

test("object card and list export confirms before calling the ontology export api", () => {
  const actionsSource = readSource("../src/views/OntologySpaceManagementDetail/composables/useObjectWorkspaceObjectActions.ts");
  const panelSource = readSource("../src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue");
  const dialogSource = readSource("../src/views/OntologySpaceManagementDetail/components/OntologyObjectExportDialog.vue");
  assert.match(actionsSource, /function openOntologyObjectExportDialog/);
  assert.match(actionsSource, /function confirmExportOntologyObject/);
  assert.match(actionsSource, /getExportOntologyInterface\(\{ uniqueIdentifier \}\)/);
  assert.match(actionsSource, /缺少本体对象标识，无法导出。/);
  assert.match(panelSource, /if \(action === "export" && item\) \{\s*openOntologyObjectExportDialog\(item\);\s*return;\s*\}/);
  assert.match(panelSource, /<OntologyObjectExportDialog/);
  assert.match(panelSource, /@confirm="confirmExportOntologyObject"/);
  assert.doesNotMatch(panelSource, /void exportOntologyObject\(item\)/);
  assert.match(dialogSource, /title="导出本体"/);
  assert.match(dialogSource, /schema 与实例数据/);
  assert.match(dialogSource, />导出<\/el-button>/);
});

test("ontology export file name prefers content disposition and falls back by content type", async () => {
  const resolverUrl = new URL("../src/views/OntologySpaceManagementDetail/utils/resolveExportOntologyFileName.ts", import.meta.url);
  const { resolveExportOntologyFileName } = await import(resolverUrl.href);
  assert.equal(
    resolveExportOntologyFileName({
      contentDisposition: "attachment; filename*=UTF-8''%E8%88%B0%E8%88%B9.zip",
      contentType: "application/zip",
      apiName: "ship",
      uniqueIdentifier: "meta-1",
    }),
    "舰船.zip",
  );
  assert.equal(
    resolveExportOntologyFileName({
      contentDisposition: 'attachment; filename="object.json"',
      contentType: "application/octet-stream",
      apiName: "ship",
      uniqueIdentifier: "meta-1",
    }),
    "object.json",
  );
  assert.equal(
    resolveExportOntologyFileName({
      contentDisposition: "",
      contentType: "application/json;charset=utf-8",
      apiName: "ship",
      uniqueIdentifier: "meta-1",
    }),
    "ship.json",
  );
  assert.equal(
    resolveExportOntologyFileName({
      contentDisposition: "",
      contentType: "application/zip",
      apiName: "",
      uniqueIdentifier: "meta-1",
    }),
    "ontology-meta-1.zip",
  );
  assert.equal(
    resolveExportOntologyFileName({
      contentDisposition: "",
      contentType: "application/octet-stream",
      apiName: "ship",
      uniqueIdentifier: "meta-1",
    }),
    "ship",
  );
});
