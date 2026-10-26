<template>
  <el-dialog
    :model-value="modelValue"
    class="function-operator-script-ide-dialog"
    fullscreen
    destroy-on-close
    :show-close="true"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="function-operator-script-ide__header">
        <div class="function-operator-script-ide__title-block">
          <strong class="function-operator-script-ide__title">脚本函数 Web-IDE</strong>
          <span class="function-operator-script-ide__meta">{{ subtitleText }}</span>
        </div>
        <div class="function-operator-script-ide__actions">
          <el-button :disabled="saving || testing" @click="goBackPreviousStep">返回上一步</el-button>
          <el-button :disabled="saving || parsing" :loading="testing" @click="runScriptIdeTest">测试</el-button>
          <el-button :disabled="saving || testing" @click="templateDrawerVisible = true">模板管理</el-button>
          <el-button type="primary" :loading="saving || parsing" :disabled="testing" @click="submitScriptFunctionCreate">保存</el-button>
        </div>
      </div>
    </template>

    <div class="function-operator-script-ide__body">
      <aside class="function-operator-script-ide__side function-operator-script-ide__side--left">
        <div class="function-operator-script-ide__field">
          <div class="function-operator-script-ide__label">语言</div>
          <el-select :model-value="language" placeholder="选择语言" :disabled="languageLocked" @update:model-value="onScriptLanguageChange">
            <el-option v-for="item in FUNCTION_OPERATOR_SCRIPT_LANGUAGE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
        <div class="function-operator-script-ide__field">
          <div class="function-operator-script-ide__label">输入参数</div>
          <FunctionOperatorScriptParamTree :nodes="inputParameters" ariaLabel="输入参数列表" />
        </div>
        <div class="function-operator-script-ide__field">
          <div class="function-operator-script-ide__label">输出参数</div>
          <FunctionOperatorScriptParamTree :nodes="outputParameters" ariaLabel="输出参数列表" />
        </div>
      </aside>

      <section class="function-operator-script-ide__editor-pane" aria-label="脚本代码编辑区">
        <el-select
          v-model="selectedTemplate"
          class="function-operator-script-ide__template-select"
          clearable
          placeholder="选择模板"
          @change="applySelectedTemplate"
        >
          <el-option v-for="item in templateOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <FunctionOperatorScriptCodeEditor :model-value="code" :language="language" @update:model-value="emit('update:code', $event)" />
      </section>

      <aside class="function-operator-script-ide__side function-operator-script-ide__side--right">
        <div class="function-operator-script-ide__field function-operator-script-ide__field--grow">
          <div class="function-operator-script-ide__label">测试参数</div>
          <div class="function-operator-script-ide__test-params">
            <p v-if="ideTestInputRows.length === 0" class="function-operator-script-ide__empty">请先保存以生成测试参数</p>
            <FunctionOperatorScriptTestParamTree v-else :rows="ideTestInputRows" ariaLabel="脚本 IDE 测试入参" @update-param="updateIdeTestParamValue" />
          </div>
          <p class="function-operator-script-ide__status">{{ ideTestStatusText }}</p>
        </div>
        <div class="function-operator-script-ide__field function-operator-script-ide__field--grow">
          <div class="function-operator-script-ide__label">运行结果</div>
          <pre class="function-operator-script-ide__result" aria-live="polite">{{ ideTestOutput || "测试结果将在这里显示" }}</pre>
        </div>
      </aside>
    </div>
  </el-dialog>
  <FunctionOperatorTemplateDrawer v-model="templateDrawerVisible" :current-language="language" :current-code="code" @use="applyTemplate" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { postParseOntologyFunctionParamsInterface, testOntologyFunctionInterface } from "@/apis";
import {
  FUNCTION_OPERATOR_SCRIPT_LANGUAGE_OPTIONS,
  type CreateOntologyFunctionParams,
  type FunctionOperatorScriptLanguage,
  type ParseOntologyFunctionParamItem,
} from "@/types";
import { mapScriptLanguageToApi } from "@/utils/mapFunctionOperatorScriptLanguage";
import {
  buildOntologyFunctionScriptTestInputRowsFromParsed,
  buildOntologyFunctionScriptTestRequest,
  writeOntologyFunctionScriptTestParamValue,
  type OntologyFunctionScriptTestInputRow,
} from "@/utils/mapOntologyFunctionTest";
import FunctionOperatorScriptCodeEditor from "./FunctionOperatorScriptCodeEditor.vue";
import FunctionOperatorScriptParamTree from "./FunctionOperatorScriptParamTree.vue";
import FunctionOperatorScriptTestParamTree from "./FunctionOperatorScriptTestParamTree.vue";
import FunctionOperatorTemplateDrawer from "./FunctionOperatorTemplateDrawer.vue";
import { buildCreateOntologyScriptFunctionParams } from "../utils/buildCreateOntologyScriptFunctionParams";
import { SCRIPT_FUNCTION_STARTERS } from "../utils/scriptFunctionStarters";
import { splitParsedScriptParameters } from "../utils/splitParsedScriptParameters";

/** IDE 内测试命令状态。 */
type IdeTestStatus = "idle" | "testing" | "success" | "error";

const props = defineProps<{
  modelValue: boolean;
  /** 父级持有的脚本代码草稿。 */
  code: string;
  /** 父级持有的脚本语言草稿。 */
  language: FunctionOperatorScriptLanguage;
  functionApi: string;
  version: string;
  displayName: string;
  description: string;
  spaceId: number;
  /** 新建表单所选源版本；非空时创建请求 basedOnOldVersion 为 true。 */
  sourceVersion: string;
  /** 限流配置模板 ID；有值才写入创建请求。 */
  rateLimitTemplateId?: number;
  /** 编辑态或基于源函数创建时锁定语言（不可切换 language）。 */
  languageLocked: boolean;
  saving: boolean;
  /** 打开 IDE 时带入的已解析输入参数树。 */
  parsedInputParameters: ParseOntologyFunctionParamItem[];
  /** 打开 IDE 时带入的已解析输出参数树。 */
  parsedOutputParameters: ParseOntologyFunctionParamItem[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "update:code": [value: string];
  "update:language": [value: FunctionOperatorScriptLanguage];
  "update:parsedInputParameters": [value: ParseOntologyFunctionParamItem[]];
  "update:parsedOutputParameters": [value: ParseOntologyFunctionParamItem[]];
  save: [params: CreateOntologyFunctionParams];
  /** 仅返回上一步通用配置，不关闭上层表单。 */
  back: [];
}>();

const lastStarterLanguage = ref<FunctionOperatorScriptLanguage>(props.language);
const inputParameters = ref<ParseOntologyFunctionParamItem[]>([]);
const outputParameters = ref<ParseOntologyFunctionParamItem[]>([]);
const parsing = ref(false);
const templateDrawerVisible = ref(false);
const selectedTemplate = ref<string>();
const parseLocked = ref(false);
const testing = ref(false);
const ideTestStatus = ref<IdeTestStatus>("idle");
const ideTestOutput = ref("");
const ideTestInputRows = ref<OntologyFunctionScriptTestInputRow[]>([]);
let parsedCodeSnapshot = "";
let parsedLanguageSnapshot: FunctionOperatorScriptLanguage | "" = "";
let parseGeneration = 0;
let ideTestGeneration = 0;

const templateOptions = computed(() => [{ label: `${languageLabel(props.language)} 默认模板`, value: props.language }]);

function languageLabel(value: FunctionOperatorScriptLanguage): string {
  return FUNCTION_OPERATOR_SCRIPT_LANGUAGE_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

/**
 * @description 选择模板后将对应代码写入当前编辑器。
 * @param value 模板语言标识。
 */
function applySelectedTemplate(value: string | undefined): void {
  if (!value || !(value in SCRIPT_FUNCTION_STARTERS)) return;
  const templateLanguage = value as FunctionOperatorScriptLanguage;
  if (templateLanguage !== props.language) emit("update:language", templateLanguage);
  emit("update:code", SCRIPT_FUNCTION_STARTERS[templateLanguage]);
  clearParsedScriptParameters();
}

/**
 * @description 将模板代码和语言回填到当前 Web-IDE 草稿。
 * @param template 模板语言与代码。
 */
function applyTemplate(template: { language: FunctionOperatorScriptLanguage; code: string }): void {
  emit("update:language", template.language);
  emit("update:code", template.code);
  clearParsedScriptParameters();
  ElMessage.success("模板已应用");
}

const subtitleText = computed(() => {
  const apiName = props.functionApi.trim() || "-";
  const versionText = props.version.trim() ? `v${props.version.trim()}` : "v-";
  return `${apiName} · ${versionText}`;
});

const ideTestStatusText = computed(() => {
  if (ideTestStatus.value === "testing") {
    return "测试中…";
  }
  if (ideTestStatus.value === "success") {
    return "测试成功";
  }
  if (ideTestStatus.value === "error") {
    return "测试失败";
  }
  return "尚未测试";
});

/**
 * @description 按解析得到的 INPUT 树刷新右侧测试入参，并重置运行结果状态。
 * @param items 输入参数树。
 */
function refreshIdeTestInputRows(items: ParseOntologyFunctionParamItem[]): void {
  ideTestInputRows.value = buildOntologyFunctionScriptTestInputRowsFromParsed(items);
  ideTestStatus.value = "idle";
  ideTestOutput.value = "";
}

/**
 * @description 清空左侧参数树与右侧测试入参，并同步清空父级草稿。
 */
function clearParsedScriptParameters(): void {
  inputParameters.value = [];
  outputParameters.value = [];
  ideTestInputRows.value = [];
  ideTestStatus.value = "idle";
  ideTestOutput.value = "";
  emit("update:parsedInputParameters", []);
  emit("update:parsedOutputParameters", []);
}

/**
 * @description 打开 IDE 时套用详情或上次解析得到的参数树；有参数则视为已解析并初始化测试入参。
 */
function applyIncomingParsedParameters(): void {
  inputParameters.value = props.parsedInputParameters.map((item) => ({ ...item }));
  outputParameters.value = props.parsedOutputParameters.map((item) => ({ ...item }));
  if (inputParameters.value.length > 0 || outputParameters.value.length > 0) {
    parsedCodeSnapshot = props.code;
    parsedLanguageSnapshot = props.language;
    parseLocked.value = true;
    refreshIdeTestInputRows(inputParameters.value);
    return;
  }
  parseLocked.value = false;
  parsedCodeSnapshot = "";
  parsedLanguageSnapshot = "";
  ideTestInputRows.value = [];
  ideTestStatus.value = "idle";
  ideTestOutput.value = "";
}

/**
 * @description 返回上一步通用配置表单，不关闭上层新建/编辑弹框。
 */
function goBackPreviousStep(): void {
  emit("back");
}

/**
 * @description 按路径更新 IDE 测试入参叶子值。
 * @param path 各层序号。
 * @param paramValue 参数值。
 */
function updateIdeTestParamValue(path: number[], paramValue: string): void {
  ideTestInputRows.value = writeOntologyFunctionScriptTestParamValue(ideTestInputRows.value, path, paramValue);
}

/**
 * @description 调用与列表脚本测试相同的请求体测试当前已保存函数。
 */
async function runScriptIdeTest(): Promise<void> {
  if (testing.value || props.saving || parsing.value) {
    return;
  }
  const functionApi = props.functionApi.trim();
  const version = props.version.trim();
  if (!functionApi) {
    ElMessage.error("缺少函数 API 名称，无法测试");
    return;
  }
  if (!version) {
    ElMessage.error("缺少函数版本，无法测试");
    return;
  }
  const requestId = ++ideTestGeneration;
  const payload = buildOntologyFunctionScriptTestRequest({
    functionApi,
    version,
    rows: ideTestInputRows.value,
  });
  testing.value = true;
  ideTestStatus.value = "testing";
  ideTestOutput.value = "";
  try {
    const response = await testOntologyFunctionInterface(payload);
    if (requestId !== ideTestGeneration) {
      return;
    }
    ideTestOutput.value = `${JSON.stringify(response, null, 2)}\n`;
    if (response.code !== 200) {
      throw new Error(typeof response.message === "string" && response.message.trim() ? response.message : "函数测试失败");
    }
    ideTestStatus.value = "success";
    ElMessage.success("测试成功");
  } catch (error) {
    if (requestId !== ideTestGeneration) {
      return;
    }
    const message = error instanceof Error && error.message.trim() ? error.message : "函数测试失败";
    if (!ideTestOutput.value.trim()) {
      ideTestOutput.value = `${JSON.stringify({ code: null, message, success: false, data: null }, null, 2)}\n`;
    }
    ideTestStatus.value = "error";
    ElMessage.error(message);
  } finally {
    if (requestId === ideTestGeneration) {
      testing.value = false;
    }
  }
}

/**
 * @description 调用解析接口，并用返回的参数树刷新左侧输入、输出展示。
 * @returns 解析是否成功。
 */
async function parseScriptParameters(): Promise<boolean> {
  if (parsing.value) {
    return false;
  }
  const source = props.code;
  if (!source.trim()) {
    ElMessage.warning("请输入脚本代码");
    return false;
  }
  const requestId = ++parseGeneration;
  parsing.value = true;
  try {
    const response = await postParseOntologyFunctionParamsInterface({
      language: mapScriptLanguageToApi(props.language),
      code: source,
    });
    if (requestId !== parseGeneration) {
      return false;
    }
    if (response.code !== 200 || !response.data?.parsed) {
      throw new Error(typeof response.message === "string" && response.message.trim() ? response.message : "脚本解析失败");
    }
    const split = splitParsedScriptParameters(response.data.parameters);
    inputParameters.value = split.inputParameters;
    outputParameters.value = split.outputParameters;
    parsedCodeSnapshot = source;
    parsedLanguageSnapshot = props.language;
    parseLocked.value = true;
    emit("update:parsedInputParameters", split.inputParameters);
    emit("update:parsedOutputParameters", split.outputParameters);
    return true;
  } catch (error) {
    if (requestId !== parseGeneration) {
      return false;
    }
    clearParsedScriptParameters();
    const message = error instanceof Error && error.message.trim() ? error.message : "脚本解析失败";
    ElMessage.error(message);
    return false;
  } finally {
    if (requestId === parseGeneration) {
      parsing.value = false;
    }
  }
}

/**
 * @description 先解析脚本参数，再组装创建或修改请求并提交保存；解析成功后刷新右侧测试入参。
 */
async function submitScriptFunctionCreate(): Promise<void> {
  if (props.saving || parsing.value || testing.value) {
    return;
  }
  const code = props.code;
  if (!code.trim()) {
    ElMessage.warning("请输入脚本代码");
    return;
  }
  if (props.language === "typescript" && !/\bexport\s+(?:async\s+)?function\b/.test(code)) {
    ElMessage.warning("请导出一个 function（export function）后再保存");
    return;
  }
  if (!props.functionApi.trim() || !props.version.trim() || !props.displayName.trim() || !props.description.trim()) {
    ElMessage.warning("请先完善通用配置中的名称、API、版本与说明");
    return;
  }
  if (!props.spaceId) {
    ElMessage.error("无效的空间标识，无法保存");
    return;
  }
  const parsed = await parseScriptParameters();
  if (!parsed) {
    return;
  }
  refreshIdeTestInputRows(inputParameters.value);
  const params = buildCreateOntologyScriptFunctionParams({
    functionApi: props.functionApi,
    version: props.version,
    displayName: props.displayName,
    description: props.description,
    ontologySpaceId: props.spaceId,
    language: props.language,
    code,
    parameters: [...inputParameters.value, ...outputParameters.value],
    sourceVersion: props.sourceVersion,
    rateLimitTemplateId: props.rateLimitTemplateId,
  });
  emit("save", params);
}

/**
 * @description 切换语言；若当前代码仍为上一语言默认模板则替换为新语言 starter，并写回父级草稿。
 * @param value 目标语言。
 */
function onScriptLanguageChange(value: string | number | boolean | undefined): void {
  if (typeof value !== "string" || !(value in SCRIPT_FUNCTION_STARTERS)) {
    return;
  }
  const language = value as FunctionOperatorScriptLanguage;
  const previousStarter = SCRIPT_FUNCTION_STARTERS[lastStarterLanguage.value];
  if (!props.code.trim() || props.code === previousStarter) {
    emit("update:code", SCRIPT_FUNCTION_STARTERS[language]);
  }
  lastStarterLanguage.value = language;
  emit("update:language", language);
}

watch(
  () => [props.code, props.language] as const,
  ([code, language]) => {
    if (parseLocked.value && (code !== parsedCodeSnapshot || language !== parsedLanguageSnapshot)) {
      parseLocked.value = false;
      clearParsedScriptParameters();
    }
  },
);

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) {
      parseGeneration += 1;
      parsing.value = false;
      ideTestGeneration += 1;
      testing.value = false;
      ideTestStatus.value = "idle";
      ideTestOutput.value = "";
      return;
    }
    applyIncomingParsedParameters();
  },
);
</script>

<style scoped lang="scss">
.function-operator-script-ide__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding-right: 36px;
}

.function-operator-script-ide__title-block {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.function-operator-script-ide__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--aircas-color-text-primary);
}

.function-operator-script-ide__meta {
  font-size: 12px;
  color: var(--aircas-color-text-secondary);
}

.function-operator-script-ide__actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
}

.function-operator-script-ide__body {
  display: grid;
  grid-template-columns: minmax(220px, 260px) minmax(0, 1fr) minmax(240px, 300px);
  gap: 12px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.function-operator-script-ide__side {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  overflow: auto;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-panel-background);
}

.function-operator-script-ide__editor-pane {
  position: relative;
  min-width: 0;
  min-height: 0;
  height: 100%;
}

.function-operator-script-ide__template-select {
  position: absolute;
  z-index: 2;
  top: 10px;
  right: 12px;
  width: 150px;
}

.function-operator-script-ide__field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
}

.function-operator-script-ide__field--grow {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-height: 0;
}

.function-operator-script-ide__side--right {
  overflow: hidden;
}

.function-operator-script-ide__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--aircas-color-text-primary);
}

.function-operator-script-ide__test-params {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.function-operator-script-ide__empty {
  margin: 0;
  font-size: 12px;
  color: var(--aircas-color-text-secondary);
}

.function-operator-script-ide__status {
  margin: 0;
  font-size: 12px;
  color: var(--aircas-color-text-secondary);
}

.function-operator-script-ide__result {
  flex: 1 1 auto;
  min-height: 120px;
  margin: 0;
  padding: 10px;
  overflow: auto;
  border: 1px solid var(--aircas-color-border);
  border-radius: 6px;
  background: var(--aircas-color-panel-background-deep);
  color: var(--aircas-color-text-secondary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>

<style lang="scss">
.function-operator-script-ide-dialog.el-dialog.is-fullscreen {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 100vh;
  margin: 0;
  overflow: hidden;
  background: var(--aircas-color-page-background);
}

.function-operator-script-ide-dialog.el-dialog.is-fullscreen .el-dialog__header {
  flex-shrink: 0;
  margin-right: 0;
  padding: 12px 16px;
  border-bottom: 1px solid var(--aircas-color-border);
}

.function-operator-script-ide-dialog.el-dialog.is-fullscreen .el-dialog__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  padding: 12px 16px 16px;
  overflow: hidden;
}
</style>
