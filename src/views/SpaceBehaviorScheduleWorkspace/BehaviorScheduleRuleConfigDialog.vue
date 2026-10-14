<template>
  <el-dialog
    :model-value="modelValue"
    class="aircas-dialog behavior-schedule-rule-config-dialog"
    append-to-body
    destroy-on-close
    fullscreen
    :z-index="5000"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="behavior-schedule-rule-config-dialog__header">
        <div class="behavior-schedule-rule-config-dialog__header-main">
          <el-button class="aircas-button aircas-button--tone-ghost" @click.stop="closeRuleConfigDialog">返回</el-button>
          <span class="behavior-schedule-rule-config-dialog__title">规则配置</span>
        </div>
        <div class="behavior-schedule-rule-config-dialog__header-actions">
          <el-button class="aircas-button aircas-button--tone-secondary" @click.stop="customVariableDialogOpen = true">自定义变量</el-button>
          <el-button class="aircas-button aircas-button--tone-secondary" @click.stop="codePanelOpen = !codePanelOpen">
            {{ codePanelOpen ? "收起代码" : "规则代码" }}
          </el-button>
          <el-button class="aircas-button aircas-button--tone-secondary" @click.stop="aiDrawerOpen = !aiDrawerOpen">
            {{ aiDrawerOpen ? "收起 AI" : "AI 生成规则" }}
          </el-button>
        </div>
      </div>
    </template>
    <div class="behavior-schedule-rule-config-dialog__body">
      <div class="behavior-schedule-rule-config-dialog__layout" :class="{ 'is-code-open': codePanelOpen }">
        <section class="behavior-schedule-rule-config-dialog__visual">
          <ScheduleRuleFlowDesigner v-if="modelValue" :key="designerSessionKey" v-model="flowDoc" />
        </section>
        <section v-if="codePanelOpen" class="behavior-schedule-rule-config-dialog__code">
          <ScheduleRuleFlowCodeEditor v-model="codeText" :parse-error="codeError" />
        </section>
      </div>
      <ScheduleRuleAiChatPanel v-if="aiDrawerOpen" :open="aiDrawerOpen" :catalog="catalog" @update:open="aiDrawerOpen = $event" @apply="applyAiDsl" />
    </div>
    <template #footer>
      <el-button class="aircas-button aircas-button--tone-ghost" @click="closeRuleConfigDialog">取消</el-button>
      <el-button class="aircas-button aircas-button--tone-primary" @click="saveRuleFlowDocument">保存</el-button>
    </template>
  </el-dialog>

  <CustomRuleVariableDialog v-model="customVariableDialogOpen" @saved="refreshVariableCatalog" />
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { RuleVariableCatalogObject, ScheduleRuleFlowDocument } from "@/types";
import { cloneScheduleRuleFlow, createDefaultScheduleRuleFlow } from "./utils/scheduleRuleFlowFactory";
import { parseScheduleRuleFlow, serializeScheduleRuleFlow } from "./utils/scheduleRuleFlowText";
import { listCustomRuleVariableCatalog } from "./utils/scheduleRuleVariableCatalog";
import CustomRuleVariableDialog from "./CustomRuleVariableDialog.vue";
import ScheduleRuleFlowDesigner from "./ruleConfig/ScheduleRuleFlowDesigner.vue";
import ScheduleRuleFlowCodeEditor from "./ruleConfig/ScheduleRuleFlowCodeEditor.vue";
import ScheduleRuleAiChatPanel from "./ruleConfig/ScheduleRuleAiChatPanel.vue";

const props = defineProps<{
  modelValue: boolean;
  initialFlow: ScheduleRuleFlowDocument | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  apply: [doc: ScheduleRuleFlowDocument];
}>();

const designerSessionKey = ref(0);
const flowDoc = ref(createDefaultScheduleRuleFlow());
const catalog = ref<RuleVariableCatalogObject[]>([]);
const codeText = ref("");
const codeError = ref("");
/** 右侧代码面板开关，对应原型 data-code-open 布局。 */
const codePanelOpen = ref(false);
const aiDrawerOpen = ref(false);
const customVariableDialogOpen = ref(false);
let syncingFromVisual = false;
let syncingFromCode = false;
let syncToken = 0;

/**
 * @description 关闭规则配置弹窗且不写回草稿。
 */
function closeRuleConfigDialog() {
  emit("update:modelValue", false);
}

/**
 * @description 重新读取内存中的自定义变量目录。
 */
function refreshVariableCatalog() {
  catalog.value = listCustomRuleVariableCatalog();
}

/**
 * @description 把当前画布同步到规则代码，避免覆盖正在编辑的文本。
 */
function applyVisualToCode() {
  if (syncingFromCode) return;
  const next = serializeScheduleRuleFlow(flowDoc.value);
  if (next === codeText.value) {
    codeError.value = "";
    return;
  }
  syncToken += 1;
  const token = syncToken;
  syncingFromVisual = true;
  codeText.value = next;
  codeError.value = "";
  void nextTick(() => {
    if (token === syncToken) syncingFromVisual = false;
  });
}

/**
 * @description 把规则代码解析回画布；失败时只提示，不覆盖可视化。
 * @param source 规则文本。
 */
function applyCodeToVisual(source: string) {
  if (syncingFromVisual) return;
  const token = syncToken;
  const parsed = parseScheduleRuleFlow(source, catalog.value);
  if (!parsed.ok) {
    codeError.value = parsed.message;
    return;
  }
  if (token !== syncToken) return;
  if (serializeScheduleRuleFlow(parsed.doc) === serializeScheduleRuleFlow(flowDoc.value)) {
    codeError.value = "";
    return;
  }
  syncingFromCode = true;
  codeError.value = "";
  flowDoc.value = cloneScheduleRuleFlow(parsed.doc);
  syncingFromVisual = true;
  codeText.value = serializeScheduleRuleFlow(parsed.doc);
  void nextTick(() => {
    syncingFromCode = false;
    syncingFromVisual = false;
  });
}

/**
 * @description 把 AI 生成的规则文本应用到画布和代码面板。
 * @param dsl 规则文本。
 */
function applyAiDsl(dsl: string) {
  const source = dsl.trim();
  if (!source) {
    ElMessage.warning("暂无可应用的规则代码");
    return;
  }
  const parsed = parseScheduleRuleFlow(source, catalog.value);
  if (!parsed.ok) {
    ElMessage.warning(parsed.message || "生成结果无法解析");
    return;
  }
  syncToken += 1;
  syncingFromCode = true;
  codeError.value = "";
  flowDoc.value = cloneScheduleRuleFlow(parsed.doc);
  syncingFromVisual = true;
  codeText.value = serializeScheduleRuleFlow(parsed.doc);
  void nextTick(() => {
    syncingFromCode = false;
    syncingFromVisual = false;
  });
  ElMessage.success("已同步到规则配置");
}

/**
 * @description 校验规则代码后把画布文档写回调度草稿。
 */
function saveRuleFlowDocument() {
  if (codeError.value) {
    ElMessage.warning(codeError.value);
    return;
  }
  const parsed = parseScheduleRuleFlow(codeText.value, catalog.value);
  if (!parsed.ok) {
    codeError.value = parsed.message;
    ElMessage.warning(parsed.message);
    return;
  }
  emit("apply", cloneScheduleRuleFlow(parsed.doc));
  emit("update:modelValue", false);
}

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return;
    designerSessionKey.value += 1;
    syncToken += 1;
    syncingFromCode = true;
    flowDoc.value = cloneScheduleRuleFlow(props.initialFlow ?? createDefaultScheduleRuleFlow());
    refreshVariableCatalog();
    syncingFromVisual = true;
    codeText.value = serializeScheduleRuleFlow(flowDoc.value);
    codeError.value = "";
    codePanelOpen.value = false;
    aiDrawerOpen.value = false;
    void nextTick(() => {
      syncingFromCode = false;
      syncingFromVisual = false;
    });
  },
  { immediate: true },
);

watch(
  flowDoc,
  () => {
    if (props.modelValue) applyVisualToCode();
  },
  { deep: true },
);

watch(codeText, (value) => {
  if (!props.modelValue || syncingFromVisual) return;
  applyCodeToVisual(value);
});
</script>

<style lang="scss">
.behavior-schedule-rule-config-dialog.el-dialog {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  margin: 0;
  background: var(--aircas-color-page-background);
  overflow: hidden;
}

.behavior-schedule-rule-config-dialog .el-dialog__header {
  position: relative;
  flex-shrink: 0;
  margin: 0;
  padding: 12px 18px;
  border-bottom: 1px solid var(--aircas-color-border-soft);
}

.behavior-schedule-rule-config-dialog .el-dialog__header::before {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 2px;
  content: "";
  background: linear-gradient(90deg, var(--aircas-color-accent-cyan), var(--aircas-color-accent-blue), var(--aircas-color-accent-purple));
}

.behavior-schedule-rule-config-dialog .el-dialog__body {
  position: relative;
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  padding: 12px 16px;
  overflow: hidden;
}

.behavior-schedule-rule-config-dialog .el-dialog__footer {
  flex-shrink: 0;
  padding: 12px 16px 16px;
  border-top: 1px solid var(--aircas-color-border-soft);
}
</style>

<style scoped lang="scss">
.behavior-schedule-rule-config-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-right: 28px;
}

.behavior-schedule-rule-config-dialog__header-main,
.behavior-schedule-rule-config-dialog__header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.behavior-schedule-rule-config-dialog__header-actions {
  flex-shrink: 0;
  gap: 8px;
}

.behavior-schedule-rule-config-dialog__title {
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  font-weight: 650;
}

.behavior-schedule-rule-config-dialog__body {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 12px;
}

.behavior-schedule-rule-config-dialog__layout {
  display: grid;
  min-height: 0;
  flex: 1;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
}

.behavior-schedule-rule-config-dialog__layout.is-code-open {
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 1fr);
}

.behavior-schedule-rule-config-dialog__visual,
.behavior-schedule-rule-config-dialog__code {
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}
</style>
