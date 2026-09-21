import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("update ontology object api follows the documented PUT contract", () => {
  const apiSource = readSource("../src/apis/ontologyObjectManageApi.ts");
  const typeSource = readSource("../src/types/apis/updateOntologyObjectType.ts");
  const barrelSource = readSource("../src/apis/index.ts");
  const typeBarrelSource = readSource("../src/types/index.ts");
  const mockSource = readSource("../src/mocks/updateOntologyObjectMock/updateOntologyObjectMock.ts");

  assert.match(apiSource, /export function updateOntologyObjectInterface\(/);
  assert.match(apiSource, /Promise<ApiResponse<UpdateOntologyObjectData>>/);
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/meta"/);
  assert.match(apiSource, /method:\s*"put"/);
  assert.match(apiSource, /data: params/);
  assert.match(typeSource, /ontologyIdentifier:\s*string/);
  assert.match(typeSource, /displayName:\s*string/);
  assert.match(typeSource, /groupIds:\s*Array<string \| null>/);
  assert.match(barrelSource, /updateOntologyObjectInterface/);
  assert.match(typeBarrelSource, /UpdateOntologyObjectParams/);
  assert.match(mockSource, /updateOntologyObjectMock: ApiResponse<UpdateOntologyObjectData>/);
});

test("object edit action opens a prefilled dialog and refreshes after success", () => {
  const panelSource = readSource("../src/views/OntologySpaceManagementDetail/components/ObjectWorkspacePanel.vue");
  const actionsSource = readSource("../src/views/OntologySpaceManagementDetail/composables/useObjectWorkspaceObjectActions.ts");
  const dialogSource = readSource("../src/views/OntologySpaceManagementDetail/components/OntologyObjectCreateDialog.vue");

  assert.match(actionsSource, /updateOntologyObjectInterface/);
  assert.match(actionsSource, /editingObject/);
  assert.match(panelSource, /action === "edit"/);
  assert.match(actionsSource, /const response = await updateOntologyObjectInterface\([\s\S]*?if \(response\.code !== 200\)/);
  assert.match(actionsSource, /updateOntologyObjectInterface\([\s\S]*?groupIds:\s*\[null\]/);
  assert.match(actionsSource, /await load\(\)/);
  assert.match(dialogSource, /editingItem/);
  assert.match(dialogSource, /编辑本体/);
  assert.match(dialogSource, /submit-edit/);
});
