import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

/**
 * @description 读取测试目标源文件并断言其存在。
 * @param relativePath 相对于当前测试文件的路径。
 * @returns 源文件文本。
 */
function readSource(relativePath) {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
}

test("object delete action opens a confirmation dialog and refreshes after success", () => {
  const panelSource = readSource("../src/views/ObjectWorkspacePanel/index.vue");
  const actionsSource = readSource("../src/views/ObjectWorkspacePanel/composables/useObjectWorkspaceObjectActions.ts");
  const dialogSource = readSource("../src/views/ObjectWorkspacePanel/components/OntologyObjectDeleteDialog.vue");

  assert.match(panelSource, /<OntologyObjectDeleteDialog/);
  assert.match(actionsSource, /deleteOntologyObjectInterface/);
  assert.match(panelSource, /action === "delete"/);
  assert.match(actionsSource, /const response = await deleteOntologyObjectInterface\([\s\S]*?if \(response\.code !== 200\)/);
  assert.match(actionsSource, /await load\(\)/);
  assert.match(dialogSource, /确认删除对象/);
  assert.match(dialogSource, /确认删除/);
});
