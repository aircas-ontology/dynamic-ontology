<template>
  <div class="rule-switch-config">
    <div class="rule-switch-config__row">
      <span class="rule-switch-config__label">switchOn 变量</span>
      <ScheduleRuleValueEditor v-model="step.switchOn" label="switchOn 变量" compact />
    </div>
    <section class="rule-switch-config__section" aria-label="Case 分支">
      <div class="rule-switch-config__header">
        <strong>Case 分支</strong>
        <el-button @click="addSwitchCase">+ 新增 Case</el-button>
      </div>
      <div v-for="(item, index) in step.cases" :key="item.id" class="rule-switch-config__case">
        <span class="rule-switch-config__case-label">Case {{ index + 1 }}</span>
        <ScheduleRuleValueEditor v-model="item.value" :label="`Case ${index + 1} 值`" compact />
        <el-button class="rule-switch-config__remove" :disabled="step.cases.length <= 1" @click="removeSwitchCase(index)">删除</el-button>
      </div>
    </section>
    <section class="rule-switch-config__section" aria-label="默认分支">
      <div class="rule-switch-config__header">
        <strong>默认分支（Default）</strong>
        <el-switch
          :model-value="step.defaultSteps !== null"
          inline-prompt
          active-text="有 Default"
          inactive-text="无 Default"
          ariaLabel="默认分支"
          @change="changeSwitchDefault"
        />
      </div>
      <p v-if="step.defaultSteps !== null" class="rule-switch-config__hint">Default 分支存在时，Switch 节点会多出一个 default 端口，画布上可连接对应路径。</p>
    </section>
  </div>
</template>
<script setup lang="ts">
import type { RuleFlowSwitchStep } from "@/types";
import { createDefaultSwitchCase } from "../utils/scheduleRuleFlowFactory";
import ScheduleRuleValueEditor from "./ScheduleRuleValueEditor.vue";
const props = defineProps<{ step: RuleFlowSwitchStep }>();
/** @description 新增尚未连接的 Case，保留独立的分支标识。 */
function addSwitchCase(): void {
  const item = createDefaultSwitchCase(`case ${props.step.cases.length + 1}`);
  item.steps = [];
  props.step.cases.push(item);
}
/** @description 删除指定 Case，至少保留一项。 @param index Case 序号。 */
function removeSwitchCase(index: number): void {
  if (props.step.cases.length <= 1 || index < 0 || index >= props.step.cases.length) return;
  props.step.cases.splice(index, 1);
}
/** @description 启用空默认路径或关闭默认路径。 @param value 开关值。 */
function changeSwitchDefault(value: string | number | boolean): void {
  if (value === true && props.step.defaultSteps === null) props.step.defaultSteps = [];
  else if (value === false) props.step.defaultSteps = null;
}
</script>
<style scoped lang="scss">
.rule-switch-config {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.rule-switch-config__row,
.rule-switch-config__case {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.rule-switch-config__label {
  min-width: 100px;
  color: var(--aircas-color-text-primary);
  font-weight: 600;
}
.rule-switch-config__section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 8px;
  background: var(--aircas-color-panel-background);
}
.rule-switch-config__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.rule-switch-config__case-label {
  flex: 0 0 64px;
  color: var(--aircas-color-accent-purple);
  font-size: 12px;
  font-weight: 600;
}
.rule-switch-config__remove {
  margin-left: auto;
}
.rule-switch-config__hint {
  margin: 0;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
  line-height: 1.6;
}
</style>
