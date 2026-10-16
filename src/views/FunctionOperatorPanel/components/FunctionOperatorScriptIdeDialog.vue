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
          <el-button :disabled="saving" @click="goBackPreviousStep">返回上一步</el-button>
          <el-button :disabled="saving" @click="notifyScriptFeatureUnavailable('测试')">测试</el-button>
          <el-button type="primary" :loading="saving" @click="submitScriptFunctionCreate">保存</el-button>
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
        <el-button class="function-operator-script-ide__parse" size="small" :loading="parsing" :disabled="parseLocked" @click="parseScriptParameters">
          解析
        </el-button>
        <FunctionOperatorScriptCodeEditor :model-value="code" :language="language" @update:model-value="emit('update:code', $event)" />
      </section>

      <aside class="function-operator-script-ide__side function-operator-script-ide__side--right">
        <div class="function-operator-script-ide__field function-operator-script-ide__field--grow">
          <div class="function-operator-script-ide__label">测试参数</div>
          <el-input
            :model-value="testParams"
            type="textarea"
            :rows="6"
            class="function-operator-script-ide__test-input"
            resize="none"
            @update:model-value="emit('update:testParams', $event)"
          />
          <p class="function-operator-script-ide__status">尚未测试</p>
        </div>
        <div class="function-operator-script-ide__field function-operator-script-ide__field--grow">
          <div class="function-operator-script-ide__label">运行结果</div>
          <div class="function-operator-script-ide__result" aria-live="polite">测试结果将在这里显示</div>
        </div>
      </aside>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { postParseOntologyFunctionParamsInterface } from "@/apis";
import {
  FUNCTION_OPERATOR_SCRIPT_LANGUAGE_OPTIONS,
  type CreateOntologyFunctionParams,
  type FunctionOperatorScriptLanguage,
  type ParseOntologyFunctionParamItem,
} from "@/types";
import { mapScriptLanguageToApi } from "@/utils/mapFunctionOperatorScriptLanguage";
import FunctionOperatorScriptCodeEditor from "./FunctionOperatorScriptCodeEditor.vue";
import FunctionOperatorScriptParamTree from "./FunctionOperatorScriptParamTree.vue";
import { buildCreateOntologyScriptFunctionParams } from "../utils/buildCreateOntologyScriptFunctionParams";
import { SCRIPT_FUNCTION_STARTERS } from "../utils/scriptFunctionStarters";
import { splitParsedScriptParameters } from "../utils/splitParsedScriptParameters";

const props = defineProps<{
  modelValue: boolean;
  /** 父级持有的脚本代码草稿。 */
  code: string;
  /** 父级持有的脚本语言草稿。 */
  language: FunctionOperatorScriptLanguage;
  /** 父级持有的测试参数草稿。 */
  testParams: string;
  functionApi: string;
  version: string;
  displayName: string;
  description: string;
  spaceId: number;
  /** 新建表单所选源版本；非空时创建请求 basedOnOldVersion 为 true。 */
  sourceVersion: string;
  /** 编辑态锁定语言（创建后不可修改 language）。 */
  languageLocked: boolean;
  saving: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "update:code": [value: string];
  "update:language": [value: FunctionOperatorScriptLanguage];
  "update:testParams": [value: string];
  save: [params: CreateOntologyFunctionParams];
}>();

const lastStarterLanguage = ref<FunctionOperatorScriptLanguage>(props.language);
const inputParameters = ref<ParseOntologyFunctionParamItem[]>([]);
const outputParameters = ref<ParseOntologyFunctionParamItem[]>([]);
const parsing = ref(false);
const parseLocked = ref(false);
let parsedCodeSnapshot = "";
let parsedLanguageSnapshot: FunctionOperatorScriptLanguage | "" = "";
let parseGeneration = 0;

const subtitleText = computed(() => {
  const apiName = props.functionApi.trim() || "-";
  const versionText = props.version.trim() ? `v${props.version.trim()}` : "v-";
  return `${apiName} · ${versionText}`;
});

/**
 * @description 清空左侧由解析接口得到的输入、输出参数树。
 */
function clearParsedScriptParameters(): void {
  inputParameters.value = [];
  outputParameters.value = [];
}

/**
 * @description 关闭 IDE 并返回上一步通用配置表单。
 */
function goBackPreviousStep(): void {
  emit("update:modelValue", false);
}

/**
 * @description 提示测试本阶段未开放。
 * @param actionLabel 操作名称。
 */
function notifyScriptFeatureUnavailable(actionLabel: string): void {
  ElMessage.info(`脚本函数${actionLabel}本阶段暂未开放`);
}

/**
 * @description 调用解析接口，并用返回的参数树刷新左侧输入、输出展示。
 */
async function parseScriptParameters(): Promise<void> {
  if (parsing.value) {
    return;
  }
  const source = props.code;
  if (!source.trim()) {
    ElMessage.warning("请输入脚本代码");
    return;
  }
  const requestId = ++parseGeneration;
  parsing.value = true;
  try {
    const response = await postParseOntologyFunctionParamsInterface({
      language: mapScriptLanguageToApi(props.language),
      code: source,
    });
    if (requestId !== parseGeneration) {
      return;
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
    ElMessage.success("解析完成");
  } catch (error) {
    if (requestId !== parseGeneration) {
      return;
    }
    clearParsedScriptParameters();
    const message = error instanceof Error && error.message.trim() ? error.message : "脚本解析失败";
    ElMessage.error(message);
  } finally {
    if (requestId === parseGeneration) {
      parsing.value = false;
    }
  }
}

/**
 * @description 校验并组装创建请求，向父组件提交脚本函数保存。
 */
function submitScriptFunctionCreate(): void {
  if (props.saving) {
    return;
  }
  const code = props.code;
  if (!code.trim()) {
    ElMessage.warning("请输入脚本代码");
    return;
  }
  if (!parseLocked.value) {
    ElMessage.warning("请先执行解析");
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
      parseLocked.value = false;
      parsedCodeSnapshot = "";
      parsedLanguageSnapshot = "";
      clearParsedScriptParameters();
    }
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

.function-operator-script-ide__parse {
  position: absolute;
  top: 8px;
  right: 16px;
  z-index: 2;
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

.function-operator-script-ide__status {
  margin: 0;
  font-size: 12px;
  color: var(--aircas-color-text-secondary);
}

.function-operator-script-ide__result {
  flex: 1 1 auto;
  min-height: 120px;
  padding: 10px;
  overflow: auto;
  border: 1px solid var(--aircas-color-border);
  border-radius: 6px;
  background: var(--aircas-color-panel-background-deep);
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.function-operator-script-ide__test-input {
  flex: 1 1 auto;
}

:deep(.function-operator-script-ide__test-input .el-textarea__inner) {
  height: 100%;
  min-height: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  background: var(--aircas-color-panel-background-deep);
}

:deep(.function-operator-script-ide__test-input.el-textarea) {
  flex: 1 1 auto;
  height: 100%;
  min-height: 0;
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
