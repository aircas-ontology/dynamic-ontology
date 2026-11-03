import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";

test("object creation exposes datasource build mode and four-step workflow", () => {
  const dialog = readFileSync(new URL("../src/views/ObjectWorkspacePanel/components/OntologyObjectCreateDialog.vue", import.meta.url), "utf8");
  assert.match(dialog, /数据源构建/);
  assert.match(dialog, /DatasourceBuildDialog/);
  assert.match(dialog, /handleDatasourceSubmit/);
  const wizard = readFileSync(new URL("../src/views/ObjectWorkspacePanel/components/DatasourceBuildDialog.vue", import.meta.url), "utf8");
  for (const title of ["连接数据库", "选择数据库表", "字段与外键"]) assert.match(wizard, new RegExp(title));
  assert.match(wizard, /主表/);
  assert.match(wizard, /外键/);
});

test("datasource mock covers both supported database types and connection validation", () => {
  const mock = readFileSync(new URL("../src/mocks/datasourceBuildMock/datasourceBuildMock.ts", import.meta.url), "utf8");
  assert.match(mock, /mysql/);
  assert.match(mock, /postgresql/);
  assert.match(mock, /validateDatasourceConnection/);
});
