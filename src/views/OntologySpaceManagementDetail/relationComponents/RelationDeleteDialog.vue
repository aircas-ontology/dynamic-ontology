<template>
  <el-dialog
    :model-value="modelValue"
    class="aircas-dialog"
    title="删除关系确认"
    width="440px"
    append-to-body
    destroy-on-close
    @close="emit('update:modelValue', false)"
  >
    <p>确认删除关系「{{ displayName }}」吗？此操作不可恢复。</p>
    <template #footer>
      <el-button class="aircas-button" @click="emit('update:modelValue', false)">取消</el-button>
      <el-button class="aircas-button" type="danger" :loading="loading" @click="emit('confirm')">确认删除</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean; displayName: string; loading: boolean }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean]; confirm: [] }>();
</script>
