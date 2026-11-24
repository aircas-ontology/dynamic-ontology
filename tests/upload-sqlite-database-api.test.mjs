import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

/**
 * @description 读取相对 tests 目录的源文件文本。
 * @param relativePath 相对路径。
 * @returns 文件内容。
 */
const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("upload sqlite database types expose file params and upload result fields", () => {
  const typeSource = readSource("../src/types/apis/uploadSqliteDatabaseType.ts");
  const barrel = readSource("../src/types/index.ts");
  assert.match(typeSource, /export interface UploadSqliteDatabaseParams/);
  assert.match(typeSource, /file:\s*File/);
  assert.match(typeSource, /export interface UploadSqliteDatabaseData/);
  assert.match(typeSource, /jdbcUrl:\s*string/);
  assert.match(typeSource, /schemaName:\s*string/);
  assert.match(typeSource, /path:\s*string/);
  assert.match(typeSource, /fileName:\s*string/);
  assert.match(typeSource, /size:\s*number/);
  assert.match(typeSource, /tableCount:\s*number/);
  assert.match(barrel, /UploadSqliteDatabaseData,\s*UploadSqliteDatabaseParams/);
});

test("upload sqlite database api posts FormData file to manage domain uri", () => {
  const apiSource = readSource("../src/apis/datasourceConnectionApi.ts");
  assert.match(
    apiSource,
    /export function postUploadSqliteDatabaseInterface\(\s*params: UploadSqliteDatabaseParams,?\s*\):\s*Promise<ApiResponse<UploadSqliteDatabaseData>>/,
  );
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/datasource\/connection\/sqlite\/upload"/);
  assert.match(apiSource, /method:\s*"post"/);
  assert.match(apiSource, /FormData/);
  assert.match(apiSource, /append\(\s*"file"/);
  assert.match(apiSource, /multipart\/form-data/);
  assert.match(apiSource, /@description/);
});

test("apis barrel exports the sqlite database upload interface", () => {
  const barrel = readSource("../src/apis/index.ts");
  assert.match(barrel, /postUploadSqliteDatabaseInterface/);
});

test("mockData registers sqlite upload route with documented sample data", () => {
  const routes = readSource("../src/mockData/routes.json");
  assert.match(routes, /\/ontology\/datasource\/connection\/sqlite\/upload/);
  const fixture = readSource("../src/mockData/fixtures/ontology/datasource/connection/sqlite/upload.post.json");
  assert.match(fixture, /"code":\s*200/);
  assert.match(fixture, /"jdbcUrl":\s*"jdbc:sqlite:\/sqlite-data\/xxx-app\.db"/);
  assert.match(fixture, /"schemaName":\s*"main"/);
  assert.match(fixture, /"tableCount":\s*3/);
});

test("datasource build dialog uploads sqlite file into readonly jdbc url", () => {
  const formSource = readSource("../src/views/ObjectWorkspacePanel/components/DatasourceBuildDialog.vue");
  assert.match(formSource, /postUploadSqliteDatabaseInterface/);
  assert.match(formSource, /uploadSqliteDatabaseFile/);
  assert.match(formSource, /:readonly="connectionForm\.dbType === 'SQLITE'"/);
  assert.match(formSource, /\.db|\.sqlite|\.sqlite3/);
});
