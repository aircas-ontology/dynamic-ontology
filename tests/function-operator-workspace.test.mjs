import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  createDefaultBasicParameterConfig,
  createFunctionOperatorMock,
  queryFunctionOperatorsMock,
} from "../src/mocks/functionOperatorMock/functionOperatorMock.ts";
import { parseBasicFilterConfig, stringifyBasicFilterConfig } from "../src/utils/functionOperatorBasicFilter.ts";

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

test("function-operator route mounts FunctionOperatorPanel", () => {
  const routeSource = readSource("../src/router/modules/workspaceRoutes.ts");
  const functionOperatorBlock = routeSource.match(
    /path:\s*"function-operator"[\s\S]*?meta:\s*\{\s*title:\s*"空间内管理",\s*workspaceTab:\s*"function-operator"\s*\}/,
  );
  assert.ok(functionOperatorBlock, "function-operator route block missing");
  assert.match(functionOperatorBlock[0], /FunctionOperatorPanel\/index\.vue/);
  assert.doesNotMatch(functionOperatorBlock[0], /emptyWorkspacePanel/);
});

test("basic filter config round-trips through parse and stringify", () => {
  const raw = createDefaultBasicParameterConfig();
  const doc = parseBasicFilterConfig(raw);
  assert.equal(doc.logic, "AND");
  assert.ok(doc.children.length >= 1);
  const again = parseBasicFilterConfig(stringifyBasicFilterConfig(doc));
  assert.equal(again.logic, doc.logic);
  assert.equal(again.children.length, doc.children.length);
});

test("function operator mock seeds basic operators and supports create", () => {
  const page = queryFunctionOperatorsMock({
    spaceId: 99,
    keyword: "",
    type: "basic",
    creator: "",
    status: "",
    updatedFrom: "",
    updatedTo: "",
    page: 1,
    pageSize: 8,
    sortBy: "updatedAt",
    sortOrder: "desc",
  });
  assert.ok(page.total >= 3);
  assert.ok(page.records.every((item) => item.type === "basic"));

  assert.ok(page.records.every((item) => typeof item.functionApi === "string" && item.functionApi.length > 0));

  const created = createFunctionOperatorMock({
    spaceId: 99,
    name: "单元测试基础函数",
    functionApi: "unit_test_basic_fn",
    type: "basic",
    protocol: "HTTP",
    version: "v1.0.0",
    description: "测试创建",
    createdBy: "tester",
    status: "draft",
    category: "基础操作",
    inputParameters: [],
    outputParameters: [],
    timeout: 5000,
    retryCount: 0,
    retryInterval: 0,
    definition: { kind: "basic", parameterConfig: createDefaultBasicParameterConfig() },
    dependencies: [],
    testStatus: "untested",
    testedAt: "",
  });
  assert.equal(created.type, "basic");
  assert.match(created.name, /单元测试基础函数/);
  assert.equal(created.functionApi, "unit_test_basic_fn");
});

test("function operator panel wires workspace composable and basic form", () => {
  const typeSource = readSource("../src/types/pages/ontologyFunctionOperatorType.ts");
  const panelSource = readSource("../src/views/FunctionOperatorPanel/index.vue");
  const formSource = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue");
  assert.match(panelSource, /useFunctionOperatorWorkspace/);
  assert.match(panelSource, /FUNCTION_OPERATOR_PUBLISH_STATUS_OPTIONS/);
  assert.doesNotMatch(panelSource, /FUNCTION_OPERATOR_STATUS_OPTIONS/);
  assert.match(typeSource, /FUNCTION_OPERATOR_PUBLISH_STATUS_OPTIONS/);
  assert.match(typeSource, /FUNCTION_OPERATOR_PUBLISH_STATUS_OPTIONS[\s\S]*?=\s*\[[\s\S]*?value: "draft"[\s\S]*?value: "published"[\s\S]*?\];/);
  assert.doesNotMatch(typeSource, /FUNCTION_OPERATOR_PUBLISH_STATUS_OPTIONS[\s\S]*?=\s*\[[\s\S]*?(testing|disabled)[\s\S]*?\];/);
  assert.match(panelSource, /<el-date-picker[\s\S]*class="function-operator-panel__date"/);
  assert.doesNotMatch(panelSource, /--aircas-color-cyan-soft/);
  assert.equal((panelSource.match(/<el-tag/g) || []).length, 4);
  assert.equal((panelSource.match(/<el-tag\b/g) || []).length, 4);
  assert.match(panelSource, /class="function-operator-panel__pagination"/);

  assert.doesNotMatch(panelSource, /popper-class="aircas-[^" ]+"/);
  assert.match(panelSource, /function-operator-panel__cards[\s\S]*align-items:\s*start/);
  assert.match(panelSource, /function-operator-card__description[\s\S]*-webkit-line-clamp:\s*2/);
  assert.match(panelSource, /function-operator-card__description[\s\S]*min-height:\s*calc\(1\.6em \* 2\)/);
  assert.match(panelSource, /function-operator-card__description[\s\S]*height:\s*calc\(1\.6em \* 2\)/);
  assert.match(panelSource, /function-operator-card__actions[\s\S]*justify-content:\s*flex-end/);
  assert.match(panelSource, /FunctionOperatorFormDialog/);
  assert.match(panelSource, /FunctionOperatorDetailDrawer/);
  assert.match(panelSource, /v-if="operator\.status !== ['"]published['"]"[\s\S]*openEdit\(operator\)/);
  assert.match(panelSource, /v-if="asOperator\(row\)\.status !== ['"]published['"]"[\s\S]*openEdit\(asOperator\(row\)\)/);
  const workspaceSource = readSource("../src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts");
  assert.match(workspaceSource, /operator\.status === ['"]published['"]/);
  assert.match(workspaceSource, /已发布函数不可编辑/);
  assert.doesNotMatch(panelSource, /运行配置/);
  assert.match(formSource, /FunctionOperatorBasicFilterBuilder/);
  assert.match(formSource, /本阶段暂未开放/);
  assert.match(formSource, /class="function-operator-form-dialog"/);
  assert.match(formSource, /class="function-operator-form"/);
  assert.match(formSource, /<el-empty\b/);
  assert.match(formSource, /function-operator-form__name-grid/);
  assert.match(formSource, /基于已有函数 \(可选\)/);
  assert.match(formSource, /label="源函数"[\s\S]*label="源版本"/);
  assert.match(formSource, /选择已有函数作为模板/);
  assert.match(formSource, /选择版本/);
  assert.match(formSource, /sourceFunctionOptions/);
  assert.match(formSource, /sourceVersionOptions/);
  assert.match(formSource, /getOntologyFunctionListInterface/);
  assert.match(formSource, /getOntologyFunctionVersionsInterface/);
  assert.match(formSource, /onSourceFunctionChange/);
  assert.match(formSource, /onSourceVersionChange/);
  assert.match(formSource, /getOntologyFunctionDetailInterface/);
  assert.match(formSource, /mapOntologyFunctionDetailToDraft/);
  assert.match(formSource, /getOntologyFunctionDetailInterface\(\{\s*functionApi,\s*version,?\s*\}\)/);
  assert.match(formSource, /isSourceTemplateLocked/);
  assert.match(formSource, /form\.functionApi\s*=\s*draft\.functionApi/);
  assert.match(formSource, /clearValidate\(\[\s*["']name["']\s*,\s*["']functionApi["']\s*\]\)/);
  assert.match(formSource, /nextTick/);
  assert.match(formSource, /form\.name\s*=\s*""/);
  assert.match(formSource, /form\.functionApi\s*=\s*""/);
  const changeTypeBlock = formSource.slice(formSource.indexOf("function changeType"), formSource.indexOf("function clearTargetProperty"));
  assert.match(changeTypeBlock, /form\.type === type/);
  assert.match(changeTypeBlock, /createEmptyDraft\(\)/);
  assert.match(changeTypeBlock, /Object\.assign\(form,/);
  assert.match(changeTypeBlock, /clearValidate\(\)/);
  assert.doesNotMatch(formSource, /sourceVersionOptions = computed<string\[\]>\(\(\) => \[\]\)/);
  assert.match(formSource, /mapFunctionOperatorTypeToApi/);
  assert.match(formSource, /pageSize:\s*1000/);
  assert.match(formSource, /pageNum:\s*1/);
  assert.doesNotMatch(formSource, /operators\?:/);
  assert.doesNotMatch(formSource, /basicSourceOptions/);
  assert.doesNotMatch(formSource, /compositeSourceOptions/);
  assert.doesNotMatch(formSource, /codeSourceOptions/);
  assert.match(
    formSource,
    /form\.type === ['"]composite['"]\s*\|\|\s*form\.type === ['"]code['"]|form\.type === ['"]code['"]\s*\|\|\s*form\.type === ['"]composite['"]/,
  );
  assert.match(formSource, /label="API名称"/);
  assert.match(formSource, /label="版本号"/);
  assert.match(formSource, /label="调用协议"/);
  assert.match(formSource, /PROTOCOL_OPTIONS/);
  assert.match(formSource, /PROTOCOL_OPTIONS[\s\S]*=\s*\["HTTP"\]/);
  assert.doesNotMatch(formSource, /PROTOCOL_OPTIONS[\s\S]*=\s*\[[^\]]*gRPC/);
  assert.doesNotMatch(formSource, /PROTOCOL_OPTIONS[\s\S]*=\s*\[[^\]]*MQ/);
  assert.match(formSource, /goGeneralConfigNextStep/);
  assert.match(formSource, /下一步/);
  assert.match(formSource, /FunctionOperatorScriptIdeDialog/);
  assert.match(formSource, /scriptIdeVisible/);
  assert.match(formSource, /form\.type === ['"]code['"][\s\S]*scriptIdeVisible\.value\s*=\s*true|scriptIdeVisible\.value\s*=\s*true/);
  assert.match(formSource, /函数编排后续步骤暂未开放/);
  assert.doesNotMatch(formSource, /脚本函数后续步骤暂未开放/);
  assert.match(typeSource, /FunctionOperatorScriptLanguage/);
  assert.match(typeSource, /FUNCTION_OPERATOR_SCRIPT_LANGUAGE_OPTIONS/);
  assert.match(typeSource, /typescript[\s\S]*groovy[\s\S]*python[\s\S]*java|typescript[\s\S]*python[\s\S]*java[\s\S]*groovy/);
  const scriptIdeSource = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorScriptIdeDialog.vue");
  assert.match(scriptIdeSource, /脚本函数 Web-IDE/);
  assert.match(scriptIdeSource, /fullscreen/);
  assert.match(scriptIdeSource, /返回上一步/);
  assert.match(scriptIdeSource, /FunctionOperatorScriptCodeEditor/);
  assert.match(scriptIdeSource, /测试参数/);
  assert.match(scriptIdeSource, /运行结果/);
  assert.match(scriptIdeSource, /parseTypescriptScriptExportParams/);
  assert.match(scriptIdeSource, /refreshScriptParameterLabels/);
  assert.doesNotMatch(scriptIdeSource, /DEFAULT_INPUT_LABELS/);
  assert.doesNotMatch(scriptIdeSource, /DEFAULT_OUTPUT_LABELS/);
  assert.match(scriptIdeSource, /export function handle/);
  assert.match(scriptIdeSource, /scriptLanguage\.value !== ['"]typescript['"]/);
  assert.match(scriptIdeSource, /submitScriptFunctionCreate/);
  assert.match(scriptIdeSource, /buildCreateOntologyScriptFunctionParams/);
  assert.match(scriptIdeSource, /emit\(["']save["']/);
  assert.doesNotMatch(scriptIdeSource, /notifyScriptFeatureUnavailable\(['"]保存['"]\)/);
  assert.match(formSource, /save-script|emitSaveScript|@save=/);
  assert.match(formSource, /emit\(["']save-script["']/);
  assert.match(workspaceSource, /saveScriptOperator/);
  assert.match(workspaceSource, /type !== ['"]CUSTOMIZE['"]|params\.type !== ['"]CUSTOMIZE['"]/);
  assert.match(panelSource, /@save-script=["']saveScriptOperator["']/);
  const parseUtilSource = readSource("../src/views/FunctionOperatorPanel/utils/parseTypescriptScriptExportParams.ts");
  assert.match(parseUtilSource, /export function parseTypescriptScriptExportParams/);
  assert.match(parseUtilSource, /export\s+(?:async\s+)?function/);
  const scriptEditorSource = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorScriptCodeEditor.vue");
  assert.match(scriptEditorSource, /monaco-editor/);
  assert.match(scriptEditorSource, /typescript/);
  assert.match(scriptEditorSource, /python/);
  assert.match(scriptEditorSource, /java/);
  assert.match(scriptEditorSource, /groovy/);
  assert.match(formSource, /请输入API名称/);
  assert.match(formSource, /请输入函数api名称/);
  assert.match(formSource, /请选择调用协议/);
  assert.match(formSource, /请选择基础函数、脚本函数或函数编排/);
  assert.match(formSource, /label="函数名称"[\s\S]*label="函数api名称"/);
  assert.match(formSource, /label="函数版本"[\s\S]*label="函数说明"/);
  assert.match(formSource, /prop="version"/);
  assert.match(formSource, /v-model="form\.version"/);
  assert.match(formSource, /prop="functionApi"/);
  assert.doesNotMatch(panelSource, /:operators="operators"/);
  const typeMapSource = readSource("../src/utils/mapFunctionOperatorTypeToApi.ts");
  assert.match(typeMapSource, /export function mapFunctionOperatorTypeToApi/);
  assert.match(typeMapSource, /export function mapFunctionOperatorTypeFromApi/);
  assert.match(typeMapSource, /BASIC_QUERY/);
  assert.match(typeMapSource, /CUSTOMIZE/);
  assert.match(typeMapSource, /COMPOSITE/);
  assert.match(workspaceSource, /mapFunctionOperatorTypeToApi/);
  assert.match(panelSource, /FUNCTION_OPERATOR_TYPE_LABELS\[operator\.type\]/);
  assert.doesNotMatch(panelSource, /apiModelType === ['"]CUSTOMIZE['"][\s\S]*return [\'\"]{2}/);
  const listMapSource = readSource("../src/utils/mapOntologyFunctionList.ts");
  assert.match(listMapSource, /mapFunctionOperatorTypeFromApi/);

  assert.match(typeSource, /通过编排多个函数构建复杂流程/);
  assert.match(typeSource, /通过脚本编写自定义函数逻辑/);
  assert.match(formSource, /v-model="form\.name"[\s\S]*:disabled="Boolean\(operator\) \|\| isSourceTemplateLocked"/);
  assert.match(formSource, /v-model="form\.functionApi"[\s\S]*:disabled="Boolean\(operator\) \|\| isSourceTemplateLocked"/);
  assert.match(formSource, /v-model="form\.version"[\s\S]*:disabled="Boolean\(operator\)"/);
  assert.match(typeSource, /functionApi:\s*string/);
  const filterSource = readSource("../src/views/FunctionOperatorPanel/components/BasicFilterGroupEditor.vue");
  assert.equal((filterSource.match(/<el-select/g) || []).length, 4);
  assert.equal((filterSource.match(/<el-select/g) || []).length, 4);
  assert.doesNotMatch(filterSource, /popper-class="aircas-select-popper"/);
  assert.equal((filterSource.match(/<el-input(?!-)/g) || []).length, 5);
  assert.equal((filterSource.match(/<el-input(?!-)/g) || []).length, 5);
  assert.match(filterSource, /opNeedsList/);
  assert.match(filterSource, /逗号分隔/);
  assert.match(filterSource, /background: var\(--aircas-color-panel-background\)/);
  assert.doesNotMatch(filterSource, /--aircas-color-panel-overlay/);
  assert.match(filterSource, /<el-input-number/);
  const drawerSource = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorDetailDrawer.vue");
  assert.match(drawerSource, /class="function-operator-detail"/);
  assert.match(drawerSource, /class="function-operator-detail__meta"/);
  assert.match(drawerSource, /<el-descriptions/);

  assert.equal((drawerSource.match(/<el-tag/g) || []).length, 3);
  assert.equal((drawerSource.match(/<el-tag\b/g) || []).length, 3);
});
