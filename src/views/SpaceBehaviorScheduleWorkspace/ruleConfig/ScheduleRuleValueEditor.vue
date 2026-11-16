<template>
  <div class="rule-value-editor">
    <span v-if="!compact">{{ label }}</span>
    <el-select
      class="rule-value-editor__kind"
      :model-value="unsupportedValue ? undefined : value.kind"
      ariaLabel="值类型"
      placeholder="请选择值类型"
      @update:model-value="changeValueKind"
    >
      <el-option v-for="item in valueKindOptions" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
    <el-input v-if="value.kind === 'input'" class="rule-value-editor__input" v-model="value.text" :ariaLabel="label" placeholder="输入值" />
    <el-button v-else-if="value.kind === 'variable'" class="rule-value-editor__variable" @click="variablePickerVisible = true">{{ variableSummary }}</el-button>
    <el-alert v-else title="当前值类型已停用，请重新选择输入值或变量" type="warning" :closable="false" />
    <ScheduleRuleVariablePicker v-model="variablePickerVisible" :initial="value.kind === 'variable' ? value : null" @confirm="applyVariableSelection" />
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import type { RuleValueNode, RuleVariableValue } from "@/types";
import ScheduleRuleVariablePicker from "./ScheduleRuleVariablePicker.vue";
defineProps<{ label: string; compact?: boolean }>();
const value = defineModel<RuleValueNode>({ required: true });
const valueKindOptions = [
  { value: "input", label: "输入值" },
  { value: "variable", label: "变量" },
];
const unsupportedValue = computed(() => value.value.kind !== "input" && value.value.kind !== "variable");
const variablePickerVisible = ref(false);
const variableSummary = computed(() =>
  value.value.kind === "variable" && value.value.objectId && value.value.propertyId
    ? `${value.value.objectName}.${value.value.propertyName} · ${value.value.instanceIds.length ? `${value.value.instanceIds.length} 个实例` : "全部实例"}`
    : "选择变量",
);
/** @description 应用变量选择副本。 @param selected 选中变量。 */
function applyVariableSelection(selected: RuleVariableValue): void {
  value.value = selected;
}
/** @description 只允许显式切换为输入值或变量，停用类型不创建也不自动转换。 @param kind 目标值类型。 */
function changeValueKind(kind: unknown): void {
  if (kind === value.value.kind) return;
  if (kind === "input") value.value = { kind, text: "" };
  if (kind === "variable") value.value = { kind, objectId: "", objectName: "", objectKind: "object", propertyId: "", propertyName: "", instanceIds: [] };
}
</script>
<style scoped lang="scss">
.rule-value-editor {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}
.rule-value-editor__kind {
  width: 108px;
}
.rule-value-editor__input {
  width: 160px;
}
.rule-value-editor__variable {
  max-width: 260px;
  overflow: hidden;
  color: var(--aircas-color-primary);
}
.rule-value-editor__variable :deep(span) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
