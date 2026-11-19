<template>
  <el-dialog
    :model-value="modelValue"
    title="配置 Switch 分支"
    width="880px"
    append-to-body
    destroy-on-close
    :z-index="5100"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="rule-switch-editor">
      <el-form v-if="step" :disabled="readonly">
        <ScheduleRuleSwitchConfig :step="step" />
      </el-form>
    </div>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">{{ readonly ? "关闭" : "取消" }}</el-button>
      <el-button v-if="!readonly" type="primary" @click="emit('confirm')">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { RuleFlowSwitchStep } from "@/types";
import ScheduleRuleSwitchConfig from "./ScheduleRuleSwitchConfig.vue";

defineProps<{
  modelValue: boolean;
  step: RuleFlowSwitchStep | null;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [];
}>();
</script>

<style scoped lang="scss">
.rule-switch-editor {
  min-height: 240px;
  max-height: 62vh;
  padding: 4px;
  overflow: auto;
}
</style>
