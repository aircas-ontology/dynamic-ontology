<template>
  <el-dialog
    :model-value="modelValue"
    class="aircas-dialog behavior-schedule-delete-dialog"
    title="删除调度确认"
    width="min(480px, 94vw)"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p class="behavior-schedule-delete-dialog__copy">确认删除调度「{{ scheduleName }}」吗？此操作不可恢复。</p>
    <template #footer>
      <el-button class="aircas-button aircas-button--tone-ghost" :disabled="submitting" :icon="Close" @click="emit('update:modelValue', false)">取消</el-button>
      <el-button class="aircas-button aircas-button--tone-danger" type="danger" :loading="submitting" :icon="Delete" @click="emit('confirm')"
        >确认删除</el-button
      >
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { Close, Delete } from "@element-plus/icons-vue";

defineProps<{
  modelValue: boolean;
  scheduleName: string;
  submitting: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [];
}>();
</script>

<style scoped lang="scss">
.behavior-schedule-delete-dialog__copy {
  margin: 0;
  color: var(--aircas-color-text-primary);
  line-height: 1.7;
}
</style>
