<template>
  <el-dialog
    :model-value="modelValue"
    title="删除行为"
    width="520px"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @close="emit('update:modelValue', false)"
  >
    <p class="behavior-delete-dialog__copy">确定删除行为“{{ behaviorName }}”吗？</p>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="danger" :loading="loading" @click="emit('confirm')">确认删除</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  behaviorName: string;
  loading: boolean;
}>();

const emit = defineEmits<{ "update:modelValue": [value: boolean]; confirm: [] }>();
</script>

<style scoped lang="scss">
.behavior-delete-dialog__copy {
  margin: 0;
  color: var(--aircas-color-text-primary);
  line-height: 1.7;
}
</style>
