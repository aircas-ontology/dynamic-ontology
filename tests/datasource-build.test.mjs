import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";

test("object creation exposes datasource build mode and three-step workflow", () => {
  const dialog = readFileSync(new URL("../src/views/ObjectWorkspacePanel/components/OntologyObjectCreateDialog.vue", import.meta.url), "utf8");
  assert.match(dialog, /数据源构建/);
  assert.match(dialog, /DatasourceBuildDialog/);
  assert.match(dialog, /handleDatasourceSubmit/);
  const wizard = readFileSync(new URL("../src/views/ObjectWorkspacePanel/components/DatasourceBuildDialog.vue", import.meta.url), "utf8");
  for (const title of ["选择 schema", "选择数据库表", "字段与外键"]) assert.match(wizard, new RegExp(title));
  assert.match(wizard, /主表/);
  assert.match(wizard, /外键/);
});

test("datasource fields display as rows with editable descriptions", () => {
  const wizard = readFileSync(new URL("../src/views/ObjectWorkspacePanel/components/DatasourceBuildDialog.vue", import.meta.url), "utf8");
  assert.match(wizard, /:data="activeTable.fields"/);
  assert.match(wizard, /v-model="row.description"/);
  assert.match(wizard, /field.description/);
});

test("datasource mock covers both supported database types and connection validation", () => {
  const mock = readFileSync(new URL("../src/mocks/datasourceBuildMock/datasourceBuildMock.ts", import.meta.url), "utf8");
  assert.match(mock, /mysql/);
  assert.match(mock, /postgresql/);
  assert.match(mock, /validateDatasourceConnection/);
});

test("datasource table APIName and description are editable and retained for submission", () => {
  const wizard = readFileSync(new URL("../src/views/ObjectWorkspacePanel/components/DatasourceBuildDialog.vue", import.meta.url), "utf8");
  const dialog = readFileSync(new URL("../src/views/ObjectWorkspacePanel/components/OntologyObjectCreateDialog.vue", import.meta.url), "utf8");
  assert.match(wizard, /label="APIName"/);
  assert.match(wizard, /v-model="row.comment"/);
  assert.doesNotMatch(wizard, /入库名/);
  assert.match(dialog, /draft.description = primaryTable\?\.comment/);
});
