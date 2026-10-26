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
  assert.match(panelSource, /运行配置/);
  assert.match(panelSource, /FunctionOperatorContainerRuntimePanel/);
  assert.match(panelSource, /runtimePanelVisible/);
  assert.match(formSource, /FunctionOperatorBasicFilterBuilder/);
  assert.match(formSource, /本阶段暂未开放/);
  assert.match(formSource, /class="function-operator-form-dialog"/);
  assert.match(formSource, /:close-on-click-modal="false"/);
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
  assert.match(formSource, /scriptDraftCode/);
  assert.match(formSource, /scriptDraftLanguage/);
  assert.doesNotMatch(formSource, /scriptDraftTestParams/);
  assert.match(formSource, /resetScriptDraft/);
  assert.match(formSource, /applyScriptDraftFromDefinition/);
  assert.match(formSource, /createDefaultCodeDefinition/);
  assert.match(formSource, /form\.type === ['"]code['"][\s\S]*applyScriptDraftFromDefinition|applyScriptDraftFromDefinition\(draft\)/);
  assert.match(formSource, /v-model:code="scriptDraftCode"/);
  assert.match(formSource, /v-model:language="scriptDraftLanguage"/);
  assert.doesNotMatch(formSource, /v-model:test-params/);
  assert.match(formSource, /v-model:parsed-input-parameters="scriptDraftInputParameters"/);
  assert.match(formSource, /v-model:parsed-output-parameters="scriptDraftOutputParameters"/);
  assert.match(formSource, /mapOperatorParametersToScriptParamTree/);
  assert.match(formSource, /form\.type === ['"]code['"][\s\S]*scriptIdeVisible\.value\s*=\s*true|scriptIdeVisible\.value\s*=\s*true/);
  assert.match(formSource, /onScriptIdeVisibleChange/);
  assert.match(formSource, /onScriptIdeBack/);
  assert.match(formSource, /FunctionOperatorCompositeWorkflowDialog/);
  assert.match(formSource, /compositeWorkflowVisible/);
  assert.match(formSource, /compositeWorkflowVisible\.value\s*=\s*true/);
  assert.match(formSource, /:space-id="form\.spaceId"/);
  assert.match(formSource, /:function-api="form\.functionApi"/);
  assert.match(formSource, /:composite-config="form\.type === ['"]composite['"] \? form\.compositeConfig : undefined"/);
  assert.match(formSource, /delete form\.compositeConfig/);
  assert.doesNotMatch(formSource, /函数编排后续步骤暂未开放/);
  assert.doesNotMatch(formSource, /脚本函数后续步骤暂未开放/);
  const compositeWorkflowSource = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeWorkflowDialog.vue");
  assert.match(compositeWorkflowSource, /函数编排工作流/);
  assert.match(compositeWorkflowSource, /fullscreen/);
  assert.match(compositeWorkflowSource, /返回上一步/);
  assert.match(compositeWorkflowSource, /当前空间函数/);
  assert.match(compositeWorkflowSource, /组合工作流/);
  assert.match(compositeWorkflowSource, /测试参数/);
  assert.match(compositeWorkflowSource, /运行结果/);
  assert.match(compositeWorkflowSource, /goBackPreviousStep/);
  assert.match(compositeWorkflowSource, /notifyFeatureUnavailable/);
  assert.match(compositeWorkflowSource, /getOntologyFunctionListInterface/);
  assert.match(compositeWorkflowSource, /type:\s*["']CUSTOMIZE["']/);
  assert.match(compositeWorkflowSource, /pageSize:\s*1000/);
  assert.match(compositeWorkflowSource, /loadSpaceFunctionList/);
  assert.match(compositeWorkflowSource, /filteredSpaceFunctionItems/);
  assert.match(compositeWorkflowSource, /useCompositeWorkflowCanvas/);
  assert.match(compositeWorkflowSource, /@logicflow\/core/);
  assert.match(compositeWorkflowSource, /buildCompositeWorkflowCreateParams/);
  assert.match(compositeWorkflowSource, /emit\(["']save["']/);
  assert.match(compositeWorkflowSource, /initCompositeWorkflowCanvas/);
  assert.match(compositeWorkflowSource, /description/);
  assert.match(compositeWorkflowSource, /compositeConfig/);
  assert.match(compositeWorkflowSource, /initialCompositeConfig/);
  assert.doesNotMatch(compositeWorkflowSource, /sampleFunctionItems/);
  assert.doesNotMatch(compositeWorkflowSource, /入\s*\/\s*.*出/);
  assert.doesNotMatch(compositeWorkflowSource, /saveCompositeWorkflowToConsole/);
  const canvasComposable = readSource("../src/views/FunctionOperatorPanel/composables/useCompositeWorkflowCanvas.ts");
  assert.match(canvasComposable, /new LogicFlow/);
  assert.match(canvasComposable, /buildCompositeWorkflowCreateParams/);
  assert.match(canvasComposable, /type:\s*["']COMPOSITE["']/);
  assert.match(canvasComposable, /compositeConfig/);
  assert.match(canvasComposable, /initialCompositeConfig/);
  assert.match(canvasComposable, /resolveCompositeWorkflowLogicFlowForRender/);
  assert.match(canvasComposable, /lf\.render\(/);
  assert.doesNotMatch(canvasComposable, /console\.log\("\[composite-workflow\]"/);
  assert.match(canvasComposable, /wouldCompositeWorkflowEdgeCreateCycle/);
  assert.match(workspaceSource, /async function saveCompositeOperator/);
  assert.match(workspaceSource, /函数编排草稿已保存/);
  assert.match(panelSource, /@save-composite="saveCompositeOperator"/);
  assert.match(formSource, /save-composite/);
  assert.match(formSource, /:description="form\.description"/);
  assert.match(typeSource, /FunctionOperatorScriptLanguage/);
  assert.match(typeSource, /FUNCTION_OPERATOR_SCRIPT_LANGUAGE_OPTIONS/);
  assert.match(typeSource, /typescript[\s\S]*groovy[\s\S]*python[\s\S]*java|typescript[\s\S]*python[\s\S]*java[\s\S]*groovy/);
  const scriptIdeSource = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorScriptIdeDialog.vue");
  assert.match(scriptIdeSource, /applyIncomingParsedParameters/);
  assert.match(scriptIdeSource, /parsedInputParameters/);
  const scriptStartersSource = readSource("../src/views/FunctionOperatorPanel/utils/scriptFunctionStarters.ts");
  assert.match(scriptIdeSource, /脚本函数 Web-IDE/);
  assert.match(scriptIdeSource, /fullscreen/);
  assert.match(scriptIdeSource, /返回上一步/);
  assert.match(scriptIdeSource, /FunctionOperatorScriptCodeEditor/);
  assert.match(scriptIdeSource, /测试参数/);
  assert.match(scriptIdeSource, /运行结果/);
  assert.doesNotMatch(scriptIdeSource, /请先执行解析/);
  assert.doesNotMatch(scriptIdeSource, />\s*解析\s*</);
  assert.doesNotMatch(scriptIdeSource, /parseScriptExportParams/);
  assert.match(scriptIdeSource, /FunctionOperatorScriptParamTree/);
  assert.match(scriptIdeSource, /splitParsedScriptParameters/);
  assert.match(scriptIdeSource, /postParseOntologyFunctionParamsInterface/);
  assert.match(scriptIdeSource, /async function submitScriptFunctionCreate/);
  assert.match(scriptIdeSource, /await parseScriptParameters/);
  assert.doesNotMatch(scriptIdeSource, /refreshScriptParameterLabels/);
  assert.doesNotMatch(scriptIdeSource, /DEFAULT_INPUT_LABELS/);
  assert.doesNotMatch(scriptIdeSource, /DEFAULT_OUTPUT_LABELS/);
  assert.doesNotMatch(scriptIdeSource, /SCRIPT_STARTERS\.typescript/);
  assert.doesNotMatch(scriptIdeSource, /scriptCode\.value\s*=\s*SCRIPT_/);
  assert.doesNotMatch(scriptIdeSource, /props\.language !== ['"]typescript['"]/);
  assert.doesNotMatch(scriptIdeSource, /if\s*\(\s*!parseLocked\.value\s*\)/);
  assert.match(scriptIdeSource, /emit\(["']update:code["']/);
  assert.match(scriptIdeSource, /emit\(["']update:language["']/);
  assert.doesNotMatch(scriptIdeSource, /emit\(["']update:testParams["']/);
  assert.match(scriptIdeSource, /submitScriptFunctionCreate/);
  assert.match(scriptIdeSource, /buildCreateOntologyScriptFunctionParams/);
  assert.match(scriptIdeSource, /sourceVersion:\s*props\.sourceVersion/);
  assert.match(scriptIdeSource, /emit\(["']save["']/);
  assert.doesNotMatch(scriptIdeSource, /notifyScriptFeatureUnavailable\(['"]保存['"]\)/);
  assert.doesNotMatch(scriptIdeSource, /notifyScriptFeatureUnavailable\(['"]测试['"]\)/);
  assert.match(scriptIdeSource, /FunctionOperatorScriptTestParamTree/);
  assert.match(scriptIdeSource, /async function runScriptIdeTest/);
  assert.match(scriptIdeSource, /refreshIdeTestInputRows/);
  assert.match(scriptIdeSource, /buildOntologyFunctionScriptTestRequest/);
  assert.match(scriptIdeSource, /testOntologyFunctionInterface/);
  assert.match(scriptStartersSource, /export function handle/);
  assert.match(scriptStartersSource, /SCRIPT_FUNCTION_STARTERS/);
  assert.match(formSource, /:source-version="sourceVersion"/);
  assert.match(formSource, /save-script|emitSaveScript|@save=/);
  assert.match(formSource, /emit\(["']save-script["']/);
  const buildScriptParamsSource = readSource("../src/views/FunctionOperatorPanel/utils/buildCreateOntologyScriptFunctionParams.ts");
  assert.match(buildScriptParamsSource, /basedOnOldVersion:\s*Boolean\(input\.sourceVersion\.trim\(\)\)/);
  assert.match(workspaceSource, /saveScriptOperator/);
  assert.match(workspaceSource, /type !== ['"]CUSTOMIZE['"]|params\.type !== ['"]CUSTOMIZE['"]/);
  assert.match(workspaceSource, /updateOntologyFunctionInterface\(updateParams\)/);
  assert.match(panelSource, /@save-script=["']saveScriptOperator["']/);
  assert.match(formSource, /:language-locked="Boolean\(operator\) \|\| isSourceTemplateLocked"/);
  const parseUtilSource = readSource("../src/views/FunctionOperatorPanel/utils/parseTypescriptScriptExportParams.ts");
  assert.match(parseUtilSource, /export function parseTypescriptScriptExportParams/);
  assert.match(parseUtilSource, /export\s+(?:async\s+)?function/);
  const parseScriptSource = readSource("../src/views/FunctionOperatorPanel/utils/parseScriptExportParams.ts");
  assert.match(parseScriptSource, /export function parseScriptExportParams/);
  assert.match(parseScriptSource, /parsePythonScriptExportParams/);
  assert.match(parseScriptSource, /parseGroovyScriptExportParams/);
  assert.match(parseScriptSource, /parseJavaLanguageScriptExportParams/);
  const scriptEditorSource = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorScriptCodeEditor.vue");
  assert.match(scriptEditorSource, /monaco-editor/);
  assert.match(scriptEditorSource, /typescript/);
  assert.match(scriptEditorSource, /python/);
  assert.match(scriptEditorSource, /java/);
  assert.match(scriptEditorSource, /groovy/);
  assert.match(formSource, /请输入API名称/);
  assert.match(formSource, /请输入函数api名称/);
  assert.match(formSource, /请选择调用协议/);
  assert.match(formSource, /请选择基础函数、脚本函数、外部 API、容器算子或函数编排/);
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
  assert.match(typeMapSource, /docker:\s*"CONTAINER"/);
  assert.match(typeMapSource, /CONTAINER:\s*"docker"/);
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
  assert.doesNotMatch(filterSource, /group\.children\.length <= 1/);
  assert.match(filterSource, /<el-input-number/);
  assert.match(formSource, /validateBasicFilterDocument/);
  assert.match(formSource, /请填写过滤条件的变量名|validateBasicFilterDocument/);
  const drawerSource = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorDetailDrawer.vue");
  assert.match(drawerSource, /class="function-operator-detail"/);
  assert.match(drawerSource, /class="function-operator-detail__meta"/);
  assert.match(drawerSource, /<el-descriptions/);

  assert.equal((drawerSource.match(/<el-tag/g) || []).length, 3);
  assert.equal((drawerSource.match(/<el-tag\b/g) || []).length, 3);
});

test("external api function create form shows endpoint method and auth without saving", () => {
  const formSource = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue");
  const workspaceSource = readSource("../src/views/FunctionOperatorPanel/composables/useFunctionOperatorWorkspace.ts");
  const pageSource = readSource("../src/views/FunctionOperatorPanel/index.vue");
  const typeSource = readSource("../src/types/pages/ontologyFunctionOperatorType.ts");
  const typeMapSource = readSource("../src/utils/mapFunctionOperatorTypeToApi.ts");
  assert.match(typeSource, /value: "api", label: "外部 API 函数", description: "调用外部 HTTP 接口"/);
  assert.match(typeMapSource, /api:\s*"EXTERNAL"/);
  assert.match(typeMapSource, /EXTERNAL:\s*"api"/);
  assert.match(formSource, /form\.type === ['"]api['"]/);
  assert.match(formSource, /外部 API 函数配置/);
  assert.match(formSource, /label="接口地址"/);
  assert.match(formSource, /https:\/\/service\.example\/api\/run/);
  assert.match(formSource, /label="请求方法"/);
  assert.match(formSource, /label="认证方式"/);
  assert.match(formSource, /无认证/);
  assert.match(formSource, /API Key/);
  assert.match(formSource, /externalApiAuth === ['"]apiKey['"]/);
  assert.match(formSource, /v-model="externalApiHeaderKey"/);
  assert.match(formSource, /v-model="externalApiHeader"/);
  assert.match(formSource, /label="认证 Header key"/);
  assert.match(formSource, /label="认证 Header value"/);
  assert.match(formSource, /输入参数/);
  assert.match(formSource, /<el-table\b/);
  assert.match(formSource, /:data="externalApiInputParameters"/);
  assert.match(formSource, /:data="externalApiOutputParameters"/);
  assert.doesNotMatch(formSource, /配置测试/);
  assert.doesNotMatch(formSource, /externalApiTestInput/);
  assert.doesNotMatch(formSource, /notifyExternalApiTestUnavailable/);
  assert.doesNotMatch(formSource, /配置测试本阶段暂未开放/);
  assert.doesNotMatch(formSource, /testOntologyFunctionInterface/);
  assert.doesNotMatch(formSource, /function-operator-form__param-card/);
  assert.match(formSource, /上传接口文档/);
  assert.match(formSource, /已发现接口/);
  assert.match(formSource, /请勾选一条接口以回填入出参/);
  assert.match(formSource, /postUploadOntologyFunctionContainerDocInterface/);
  assert.match(formSource, /postProbeOntologyFunctionContainerInterfacesInterface/);
  assert.match(formSource, /onExternalApiDocFileChange/);
  assert.match(formSource, /onExternalApiDiscoveredInterfaceSelect/);
  assert.match(formSource, /mapProbeInterfaceToExternalApiFormParams/);
  assert.match(formSource, /externalApiSelectedInterfaceKey/);
  assert.match(formSource, /输出参数/);
  assert.match(formSource, /addExternalApiInputParameter/);
  assert.match(formSource, /removeExternalApiInputParameter/);
  assert.match(formSource, /addExternalApiOutputParameter/);
  assert.match(formSource, /removeExternalApiOutputParameter/);
  assert.match(formSource, /FunctionOperatorExternalApiParamFieldsEditor/);
  assert.match(formSource, /onExternalApiParameterTypeChange/);
  assert.match(formSource, /validateExternalApiNestedFields/);
  const fieldsEditorSource = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorExternalApiParamFieldsEditor.vue");
  assert.match(fieldsEditorSource, /添加属性/);
  assert.match(formSource, /label="name"/);
  assert.match(formSource, /label="type"/);
  assert.match(formSource, /label="description"/);
  assert.match(formSource, /label="location"/);
  assert.match(formSource, /label="required"/);
  assert.match(formSource, /Body/);
  assert.match(formSource, /Path/);
  assert.match(formSource, /Query/);
  assert.match(formSource, /Header/);
  assert.match(formSource, /string/);
  assert.match(formSource, /number/);
  assert.match(formSource, /boolean/);
  assert.match(formSource, /array/);
  assert.match(formSource, /object/);
  assert.match(formSource, /label="是"/);
  assert.match(formSource, /label="否"/);
  assert.match(formSource, /externalApiInputParameters\.value = \[\]/);
  assert.match(formSource, /externalApiOutputParameters\.value = \[\]/);
  assert.match(formSource, /仅作原型展示，正式密钥由后端托管/);
  assert.match(formSource, /form\.type === "api"/);
  assert.match(formSource, /buildCreateOntologyExternalFunctionParams/);
  assert.match(formSource, /save-external/);
  assert.doesNotMatch(formSource, /外部 API 函数编辑本阶段暂未开放/);
  assert.match(formSource, /请填写认证 Header key/);
  assert.match(formSource, /请填写认证 Header 值/);
  assert.doesNotMatch(formSource, /:disabled="form\.type !== 'basic'"/);
  assert.match(workspaceSource, /saveExternalApiOperator/);
  const externalSaveStart = workspaceSource.indexOf("async function saveExternalApiOperator");
  const externalSaveNext = workspaceSource.indexOf("\n  async function ", externalSaveStart + 1);
  const externalSaveSource = workspaceSource.slice(externalSaveStart, externalSaveNext === -1 ? undefined : externalSaveNext);
  assert.match(externalSaveSource, /createOntologyFunctionInterface\(params\)/);
  assert.match(externalSaveSource, /外部 API 函数草稿已保存/);
  assert.match(externalSaveSource, /if \(editingOperator\.value\)/);
  assert.match(externalSaveSource, /updateOntologyFunctionInterface\(params\)/);
  assert.match(externalSaveSource, /外部 API 函数已更新/);
  assert.match(pageSource, /@save-external="saveExternalApiOperator"/);
  assert.doesNotMatch(formSource, /form\.type === ['"]api['"][\s\S]{0,80}goGeneralConfigNextStep/);
});

test("docker container operator form shows general and container config with readonly version", () => {
  const formSource = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue");
  const typeSource = readSource("../src/types/pages/ontologyFunctionOperatorType.ts");
  assert.match(typeSource, /value:\s*["']docker["'][\s\S]*?部署容器镜像并绑定接口/);
  assert.match(formSource, /form\.type === ['"]docker['"]/);
  assert.match(formSource, /容器算子函数配置/);
  assert.doesNotMatch(formSource, /待部署/);
  assert.match(formSource, /上传镜像/);
  assert.match(formSource, /\.tar\s*\/\s*\.tar\.gz\s*\/\s*\.tgz/);
  assert.match(formSource, /上传接口文档/);
  assert.match(formSource, /OpenAPI\s*\/\s*Swagger/);
  assert.match(formSource, /启动命令/);
  assert.match(formSource, /python \/app\/main\.py/);
  assert.match(formSource, /已发现接口/);
  assert.match(formSource, /请选择本算子绑定的接口/);
  assert.match(formSource, /上传接口文档并探测后展示/);
  assert.match(formSource, /submitDockerOperator/);
  assert.match(formSource, /"save-container"/);
  assert.match(formSource, /buildCreateOntologyFunctionContainerParams/);
  assert.match(formSource, /resetDockerOperatorForm/);
  assert.match(formSource, /onDockerImageFileChange/);
  assert.match(formSource, /onDockerApiDocFileChange/);
  assert.match(formSource, /type === ["']docker["'][\s\S]*?next\.version\s*=\s*["']1\.0\.0["']/);
  const dockerSectionStart = formSource.indexOf("v-else-if=\"form.type === 'docker'\"");
  assert.ok(dockerSectionStart > 0, "docker form section missing");
  const dockerSectionEnd = formSource.indexOf('class="function-operator-form__section function-operator-form__section--empty"', dockerSectionStart);
  const dockerSection = formSource.slice(dockerSectionStart, dockerSectionEnd === -1 ? undefined : dockerSectionEnd);
  assert.match(dockerSection, /label="函数名称"[\s\S]*label="版本"[\s\S]*label="API名称"/);
  assert.match(dockerSection, /label="版本"[\s\S]*:model-value="form\.version"[\s\S]*disabled/);
  assert.match(dockerSection, /label="调用协议"[\s\S]*:disabled="Boolean\(operator\)"/);
  assert.match(dockerSection, /label="函数说明"/);
  assert.match(dockerSection, /v-if="!operator"[\s\S]*容器算子函数配置/);
  assert.doesNotMatch(dockerSection, /基于已有函数/);
  assert.doesNotMatch(dockerSection, /label="源版本"/);
  assert.match(formSource, /form\.type !== ['"]basic['"] && form\.type !== ['"]api['"] && form\.type !== ['"]docker['"]/);
});
