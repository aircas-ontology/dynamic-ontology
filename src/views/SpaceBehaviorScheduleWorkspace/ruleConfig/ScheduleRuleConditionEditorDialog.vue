<template>
  <el-dialog
    :model-value="modelValue"
    title="配置条件"
    width="880px"
    append-to-body
    destroy-on-close
    draggable
    overflow
    :modal="false"
    modal-penetrable
    :z-index="5100"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div ref="editorRef" class="rule-condition-editor">
      <el-form v-if="condition" :disabled="readonly">
        <ScheduleRuleConditionWireSurface :condition="condition" />
      </el-form>
    </div>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">{{ readonly ? "关闭" : "取消" }}</el-button>
      <el-button v-if="!readonly" type="primary" @click="emit('confirm')">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { RuleConditionNode } from "@/types";
import ScheduleRuleConditionWireSurface from "./ScheduleRuleConditionWireSurface.vue";

defineProps<{
  modelValue: boolean;
  condition: RuleConditionNode | null;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [];
}>();

const editorRef = ref<HTMLElement | null>(null);

defineExpose({ editorRef });
</script>

<style scoped lang="scss">
.rule-condition-editor {
  min-height: 240px;
  max-height: 62vh;
  padding: 4px;
  overflow: auto;
}
</style>
