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

test("delete ontology object api follows the documented DELETE path contract", () => {
  const apiSource = readSource("../src/apis/ontologyObjectManageApi.ts");
  const barrelSource = readSource("../src/apis/index.ts");
  const typeSource = readSource("../src/types/apis/deleteOntologyObjectType.ts");
  const mockSource = readSource("../src/mocks/deleteOntologyObjectMock/deleteOntologyObjectMock.ts");

  assert.match(apiSource, /export function deleteOntologyObjectInterface\(/);
  assert.match(apiSource, /Promise<ApiResponse<DeleteOntologyObjectData>>/);
  assert.match(apiSource, /url:\s*`\$\{DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL\}\/ontology\/meta\/\$\{encodeURIComponent\(params\.ontologyIdentifier\)\}`/);
  assert.match(apiSource, /method:\s*"delete"/);
  assert.match(barrelSource, /deleteOntologyObjectInterface/);
  assert.match(typeSource, /ontologyIdentifier:\s*string/);
  assert.match(mockSource, /deleteOntologyObjectMock: ApiResponse<DeleteOntologyObjectData>/);
});

test("object delete action opens a confirmation dialog and refreshes after success", () => {
  const panelSource = readSource("../src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue");
  const dialogSource = readSource("../src/views/OntologySpaceManagementDetail/components/OntologyObjectDeleteDialog.vue");

  assert.match(panelSource, /<OntologyObjectDeleteDialog/);
  assert.match(panelSource, /deleteOntologyObjectInterface/);
  assert.match(panelSource, /action === "delete"/);
  assert.match(panelSource, /const response = await deleteOntologyObjectInterface\([\s\S]*?if \(response\.code !== 200\)/);
  assert.match(panelSource, /await load\(\)/);
  assert.match(dialogSource, /确认删除本体对象/);
  assert.match(dialogSource, /确认删除/);
});
