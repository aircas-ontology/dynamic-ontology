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
          <el-select v-model="scriptLanguage" placeholder="选择语言" @change="onScriptLanguageChange">
            <el-option v-for="item in FUNCTION_OPERATOR_SCRIPT_LANGUAGE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
        <div class="function-operator-script-ide__field">
          <div class="function-operator-script-ide__label">输入参数</div>
          <ul class="function-operator-script-ide__param-list" aria-label="输入参数列表">
            <li v-for="item in inputParameterLabels" :key="item" class="function-operator-script-ide__param-item">{{ item }}</li>
          </ul>
        </div>
        <div class="function-operator-script-ide__field">
          <div class="function-operator-script-ide__label">输出参数</div>
          <ul class="function-operator-script-ide__param-list" aria-label="输出参数列表">
            <li v-for="item in outputParameterLabels" :key="item" class="function-operator-script-ide__param-item">{{ item }}</li>
          </ul>
        </div>
      </aside>

      <section class="function-operator-script-ide__editor-pane" aria-label="脚本代码编辑区">
        <FunctionOperatorScriptCodeEditor v-model="scriptCode" :language="scriptLanguage" />
      </section>

      <aside class="function-operator-script-ide__side function-operator-script-ide__side--right">
        <div class="function-operator-script-ide__field function-operator-script-ide__field--grow">
          <div class="function-operator-script-ide__label">测试参数</div>
          <el-input v-model="testParamsText" type="textarea" :rows="6" class="function-operator-script-ide__test-input" resize="none" />
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
import { FUNCTION_OPERATOR_SCRIPT_LANGUAGE_OPTIONS, type CreateOntologyFunctionParams, type FunctionOperatorScriptLanguage } from "@/types";
import FunctionOperatorScriptCodeEditor from "./FunctionOperatorScriptCodeEditor.vue";
import { buildCreateOntologyScriptFunctionParams } from "../utils/buildCreateOntologyScriptFunctionParams";
import { parseTypescriptScriptExportParams } from "../utils/parseTypescriptScriptExportParams";

const props = defineProps<{
  modelValue: boolean;
  functionApi: string;
  version: string;
  displayName: string;
  description: string;
  spaceId: number;
  saving: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  save: [params: CreateOntologyFunctionParams];
}>();

const SCRIPT_STARTERS: Record<FunctionOperatorScriptLanguage, string> = {
  typescript: `interface User {
  id: number;
  name: string;
}

interface Output {
  id: number;
  name: string;
}

export function handle(input: User): Output {
    return {
        id:input.id+1,
        name:input.name+'a',
    }
}
`,
  groovy: `class ExecuteInput {
  String name
  Number count
  Boolean enabled
}

class ExecuteOutput {
  String message
  Number score
  Boolean ok
}

ExecuteOutput execute(ExecuteInput input) {
  // 在这里实现业务逻辑
  return new ExecuteOutput(
    message: input.name,
    score: input.count,
    ok: input.enabled
  )
}
`,
  python: `from typing import TypedDict


class ExecuteInput(TypedDict):
    name: str
    count: float
    enabled: bool


class ExecuteOutput(TypedDict):
    message: str
    score: float
    ok: bool


def execute(input: ExecuteInput) -> ExecuteOutput:
    # 在这里实现业务逻辑
    return {
        "message": input["name"],
        "score": input["count"],
        "ok": input["enabled"],
    }
`,
  java: `public class ExecuteInput {
  public String name;
  public double count;
  public boolean enabled;
}

public class ExecuteOutput {
  public String message;
  public double score;
  public boolean ok;
}

public class ScriptFunction {
  public ExecuteOutput execute(ExecuteInput input) {
    // 在这里实现业务逻辑
    ExecuteOutput output = new ExecuteOutput();
    output.message = input.name;
    output.score = input.count;
    output.ok = input.enabled;
    return output;
  }
}
`,
};

const scriptLanguage = ref<FunctionOperatorScriptLanguage>("typescript");
const scriptCode = ref(SCRIPT_STARTERS.typescript);
const testParamsText = ref("{}");
const lastStarterLanguage = ref<FunctionOperatorScriptLanguage>("typescript");
const inputParameterLabels = ref<string[]>([]);
const outputParameterLabels = ref<string[]>([]);

const subtitleText = computed(() => {
  const apiName = props.functionApi.trim() || "-";
  const versionText = props.version.trim() ? `v${props.version.trim()}` : "v-";
  return `${apiName} · ${versionText}`;
});

/**
 * @description 按当前语言刷新左侧入参/出参展示；仅 TypeScript 解析 export 方法。
 */
function refreshScriptParameterLabels(): void {
  if (scriptLanguage.value !== "typescript") {
    inputParameterLabels.value = [];
    outputParameterLabels.value = [];
    return;
  }
  const parsed = parseTypescriptScriptExportParams(scriptCode.value);
  inputParameterLabels.value = parsed.inputLabels;
  outputParameterLabels.value = parsed.outputLabels;
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
 * @description 校验并组装创建请求，向父组件提交脚本函数保存。
 */
function submitScriptFunctionCreate(): void {
  if (props.saving) {
    return;
  }
  const code = scriptCode.value;
  if (!code.trim()) {
    ElMessage.warning("请输入脚本代码");
    return;
  }
  if (scriptLanguage.value === "typescript" && !/\bexport\s+(?:async\s+)?function\b/.test(code)) {
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
    language: scriptLanguage.value,
    code,
    inputLabels: inputParameterLabels.value,
    outputLabels: outputParameterLabels.value,
  });
  emit("save", params);
}

/**
 * @description 切换语言；若当前代码仍为上一语言默认模板则替换为新语言 starter。
 * @param language 目标语言。
 */
function onScriptLanguageChange(language: FunctionOperatorScriptLanguage): void {
  const previousStarter = SCRIPT_STARTERS[lastStarterLanguage.value];
  if (!scriptCode.value.trim() || scriptCode.value === previousStarter) {
    scriptCode.value = SCRIPT_STARTERS[language];
  }
  lastStarterLanguage.value = language;
}

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) {
      return;
    }
    scriptLanguage.value = "typescript";
    scriptCode.value = SCRIPT_STARTERS.typescript;
    lastStarterLanguage.value = "typescript";
    testParamsText.value = "{}";
    refreshScriptParameterLabels();
  },
);

watch([scriptCode, scriptLanguage], () => {
  refreshScriptParameterLabels();
});

refreshScriptParameterLabels();
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
  min-width: 0;
  min-height: 0;
  height: 100%;
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

.function-operator-script-ide__param-list {
  display: flex;
  margin: 0;
  padding: 0;
  flex-direction: column;
  gap: 8px;
  list-style: none;
}

.function-operator-script-ide__param-item {
  padding: 8px 10px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 6px;
  background: var(--aircas-color-panel-background-deep);
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  word-break: break-word;
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
