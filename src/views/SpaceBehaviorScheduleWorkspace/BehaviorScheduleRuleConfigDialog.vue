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
      </div>
    </template>
    <div class="behavior-schedule-rule-config-dialog__body">
      <div class="behavior-schedule-rule-config-dialog__layout">
        <section class="behavior-schedule-rule-config-dialog__visual">
          <ScheduleRuleFlowDesigner v-if="modelValue" :key="designerSessionKey" v-model="flowDoc" :behavior-options="behaviorOptions" />
        </section>
      </div>
    </div>
    <template #footer>
      <el-button class="aircas-button aircas-button--tone-ghost" @click="closeRuleConfigDialog">取消</el-button>
      <el-button class="aircas-button aircas-button--tone-primary" @click="saveRuleFlowDocument">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

import type { ScheduleBehaviorOption, ScheduleRuleFlowDocument } from "@/types";
import { cloneScheduleRuleFlow, createDefaultScheduleRuleFlow } from "./utils/scheduleRuleFlowFactory";
import ScheduleRuleFlowDesigner from "./ruleConfig/ScheduleRuleFlowDesigner.vue";

const props = defineProps<{
  modelValue: boolean;
  initialFlow: ScheduleRuleFlowDocument | null;
  behaviorOptions: readonly ScheduleBehaviorOption[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  apply: [doc: ScheduleRuleFlowDocument];
}>();

const designerSessionKey = ref(0);
const flowDoc = ref(createDefaultScheduleRuleFlow());

/**
 * @description 关闭规则配置弹窗且不写回草稿。
 */
function closeRuleConfigDialog() {
  emit("update:modelValue", false);
}

/**
 * @description 把规则画布文档写回调度草稿。
 */
function saveRuleFlowDocument() {
  emit("apply", cloneScheduleRuleFlow(flowDoc.value));
  emit("update:modelValue", false);
}

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return;
    designerSessionKey.value += 1;
    const initialFlow = props.initialFlow && props.initialFlow.steps.length ? props.initialFlow : createDefaultScheduleRuleFlow();
    flowDoc.value = cloneScheduleRuleFlow(initialFlow);
  },
  { immediate: true },
);
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

.behavior-schedule-rule-config-dialog__header-main {
  display: flex;
  align-items: center;
  gap: 12px;
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

.behavior-schedule-rule-config-dialog__visual {
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}
</style>
