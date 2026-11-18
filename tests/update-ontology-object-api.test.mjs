import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("object edit action opens a prefilled dialog and refreshes after success", () => {
  const panelSource = readSource("../src/views/ObjectWorkspacePanel/index.vue");
  const actionsSource = readSource("../src/views/ObjectWorkspacePanel/composables/useObjectWorkspaceObjectActions.ts");
  const dialogSource = readSource("../src/views/ObjectWorkspacePanel/components/OntologyObjectCreateDialog.vue");
  const typeSource = readSource("../src/types/apis/updateOntologyObjectType.ts");

  assert.match(actionsSource, /updateOntologyObjectInterface/);
  assert.match(actionsSource, /editingObject/);
  assert.match(panelSource, /action === "edit"/);
  assert.match(actionsSource, /const response = await updateOntologyObjectInterface\([\s\S]*?if \(response\.code !== 200\)/);
  assert.match(actionsSource, /updateOntologyObjectInterface\([\s\S]*?groupIds:\s*\[null\]/);
  assert.match(actionsSource, /await load\(\)/);
  assert.match(dialogSource, /editingItem/);
  assert.match(dialogSource, /编辑对象/);
  assert.match(dialogSource, /submit-edit/);
  assert.match(typeSource, /apiName\?:\s*string/);
});

test("object edit allows apiName changes only when the object is not datasource-bound", () => {
  const panelSource = readSource("../src/views/ObjectWorkspacePanel/index.vue");
  const actionsSource = readSource("../src/views/ObjectWorkspacePanel/composables/useObjectWorkspaceObjectActions.ts");
  const dialogSource = readSource("../src/views/ObjectWorkspacePanel/components/OntologyObjectCreateDialog.vue");

  assert.match(actionsSource, /getOntologyPropertyDetailByOntologyIdInterface/);
  assert.match(actionsSource, /isOntologyObjectDatasourceBound/);
  assert.match(actionsSource, /objectApiNameLocked/);
  assert.match(actionsSource, /apiName:\s*draft\.apiName\.trim\(\)/);
  assert.match(actionsSource, /\.\.\.\(!objectApiNameLocked\.value[\s\S]*?apiName:/);
  assert.match(panelSource, /:api-name-locked="objectApiNameLocked"/);
  assert.match(panelSource, /:api-name-checking="objectApiNameChecking"/);
  assert.match(dialogSource, /apiNameLocked/);
  assert.match(dialogSource, /apiNameChecking/);
  assert.match(dialogSource, /已关联数据源，API 名称不可修改/);
  assert.match(dialogSource, /:disabled="submitting \|\| apiNameChecking \|\| \(Boolean\(editingItem\) && apiNameLocked\)"/);
  assert.doesNotMatch(dialogSource, /:disabled="submitting \|\| Boolean\(editingItem\)"/);
});
