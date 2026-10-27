import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

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

test("update ontology function types expose the documented request fields", () => {
  const source = readSource("../src/types/apis/updateOntologyFunctionType.ts");
  assert.match(source, /export interface UpdateOntologyFunctionParams/);
  assert.match(source, /functionApi: string/);
  assert.match(source, /version: string/);
  assert.match(source, /displayName: string/);
  assert.match(source, /description: string/);
  assert.match(source, /type: CreateOntologyFunctionType/);
  assert.match(source, /language\?: string/);
  assert.match(source, /code\?: string/);
  assert.match(source, /parameters\?: CreateOntologyFunctionParameter\[\]/);
  assert.match(source, /basedOnOldVersion\?: boolean/);
  assert.match(source, /apiConfig\?: CreateOntologyFunctionApiConfig/);
  assert.match(source, /compositeConfig\?: OntologyCompositeConfig/);
  assert.match(source, /ontologySpaceId: number/);
  assert.match(source, /queryConfig\?: CreateOntologyFunctionQueryConfig/);
  assert.match(source, /export type UpdateOntologyFunctionData = null/);
  const barrel = readSource("../src/types/index.ts");
  assert.match(barrel, /UpdateOntologyFunctionData/);
  assert.match(barrel, /UpdateOntologyFunctionParams/);
  assert.match(barrel, /from "\.\/apis\/updateOntologyFunctionType"/);
});

test("update ontology function api puts to ontology function endpoint", () => {
  const source = readSource("../src/apis/functionApi.ts");
  assert.match(source, /updateOntologyFunctionInterface/);
  assert.match(source, /DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/function"/);
  assert.match(source, /method: "put"/);
  assert.match(source, /data: params/);
  const barrel = readSource("../src/apis/index.ts");
  assert.match(barrel, /updateOntologyFunctionInterface/);
  assert.match(barrel, /from "\.\/functionApi"/);
});

test("update ontology function mock mirrors SUCCESS envelope with null data", () => {
  const source = readSource("../src/mocks/updateOntologyFunctionMock/updateOntologyFunctionMock.ts");
  assert.match(source, /export const updateOntologyFunctionMock: ApiResponse<UpdateOntologyFunctionData>/);
  assert.match(source, /code: 200/);
  assert.match(source, /message: "SUCCESS"/);
  assert.match(source, /success: true/);
  assert.match(source, /data: null/);
});

test("function operator workspace edit save calls update api", () => {
  const workspaceSource = readSource("../src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts");
  assert.match(workspaceSource, /updateOntologyFunctionInterface/);
  assert.match(workspaceSource, /buildOntologyFunctionQueryConfig/);
  assert.doesNotMatch(workspaceSource, /updateFunctionOperatorMock/);
  assert.match(workspaceSource, /if \(editingOperator\.value\)/);
  assert.match(workspaceSource, /createOntologyFunctionInterface/);
  const saveBlock = workspaceSource.slice(workspaceSource.indexOf("async function saveOperator"), workspaceSource.indexOf("function openDeleteOperator"));
  assert.match(saveBlock, /updateOntologyFunctionInterface\(payload\)/);
  assert.match(saveBlock, /version:\s*version/);
  assert.match(saveBlock, /draft\.version\.trim\(\)/);
  assert.match(saveBlock, /缺少函数版本/);
});

test("function operator saveScriptOperator uses put when editing", () => {
  const workspaceSource = readSource("../src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts");
  const saveScriptBlock = workspaceSource.slice(
    workspaceSource.indexOf("async function saveScriptOperator"),
    workspaceSource.indexOf("async function saveExternalApiOperator"),
  );
  assert.match(saveScriptBlock, /if \(editingOperator\.value\)/);
  assert.match(saveScriptBlock, /basedOnOldVersion:\s*_basedOnOldVersion/);
  assert.match(saveScriptBlock, /rateLimitTemplateId:\s*_rateLimitTemplateId/);
  assert.match(saveScriptBlock, /updateOntologyFunctionInterface\(updateParams\)/);
  assert.match(saveScriptBlock, /createOntologyFunctionInterface\(params\)/);
  assert.match(saveScriptBlock, /脚本函数已更新/);
  assert.match(saveScriptBlock, /buildScriptOperatorFromSaveParams/);
  assert.match(saveScriptBlock, /buildScriptDraftFromSaveParams/);
  assert.match(saveScriptBlock, /editingOperator\.value = /);
  assert.match(saveScriptBlock, /formDraft\.value = /);
  assert.doesNotMatch(saveScriptBlock, /keepScriptFormOpenAfterSave/);
  assert.doesNotMatch(saveScriptBlock, /formVisible\.value = false/);
  assert.doesNotMatch(workspaceSource, /keepScriptFormOpenAfterSave/);
  const formSource = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue");
  assert.match(formSource, /:language-locked="Boolean\(operator\) || isSourceTemplateLocked"/);
  assert.match(formSource, /scriptSessionGeneralLocked/);
  const ideSource = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorScriptIdeDialog.vue");
  assert.match(ideSource, /languageLocked/);
  assert.match(ideSource, /:disabled="languageLocked"/);
});
