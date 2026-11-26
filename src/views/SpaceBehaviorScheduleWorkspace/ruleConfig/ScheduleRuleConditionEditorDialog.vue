<template>
  <el-dialog
    :model-value="modelValue"
    title="配置条件"
    width="1180px"
    append-to-body
    destroy-on-close
    draggable
    overflow
    :modal="false"
    modal-penetrable
    :z-index="5100"
    :close-on-click-modal="false"
    :before-close="handleConditionDialogBeforeClose"
  >
    <div ref="editorRef" class="rule-condition-editor">
      <el-form v-if="condition" :disabled="readonly">
        <ScheduleRuleConditionWireSurface :condition="condition" :readonly="readonly" />
      </el-form>
    </div>
    <template #footer>
      <el-button @click="closeConditionDialogWithoutConfirm">{{ readonly ? "关闭" : "取消" }}</el-button>
      <el-button v-if="!readonly" type="primary" @click="emit('confirm')">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { RuleCompositeCondition } from "@/types";
import ScheduleRuleConditionWireSurface from "./ScheduleRuleConditionWireSurface.vue";

const props = defineProps<{
  modelValue: boolean;
  condition: RuleCompositeCondition | null;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [];
}>();

const editorRef = ref<HTMLElement | null>(null);

/**
 * @description 取消或只读关闭：不写回条件草稿。
 */
function closeConditionDialogWithoutConfirm(): void {
  emit("update:modelValue", false);
}

/**
 * @description 标题栏关闭与确定一致：可编辑时触发确认写回；校验失败时不关闭。
 * @param done 关闭完成回调。
 */
function handleConditionDialogBeforeClose(done: (cancel?: boolean) => void): void {
  if (props.readonly) {
    emit("update:modelValue", false);
    done();
    return;
  }
  emit("confirm");
}

defineExpose({ editorRef });
</script>

<style scoped lang="scss">
.rule-condition-editor {
  min-height: 240px;
  max-height: 62vh;
  padding: 4px;
  overflow-x: hidden;
  overflow-y: auto;
}
</style>
