<template>
  <el-dialog
    :model-value="modelValue"
    class="aircas-dialog"
    :title="mode === 'create' ? '新建行为分类' : '编辑行为分类'"
    width="440px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form label-position="top"
      ><el-form-item label="分类名称" required><el-input v-model="name" class="aircas-input" :maxlength="50" placeholder="请输入分类名称" /></el-form-item>
      <p v-if="mode === 'create'" class="object-behavior-dialog__hint">将在“{{ parentLabel }}”下创建分类。</p></el-form
    >
    <template #footer
      ><el-button class="aircas-button aircas-button--tone-ghost" @click="emit('update:modelValue', false)">取消</el-button
      ><el-button class="aircas-button aircas-button--tone-primary" :disabled="!name.trim()" @click="submitCategoryForm">确认</el-button></template
    >
  </el-dialog>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";
const props = defineProps<{ modelValue: boolean; mode: "create" | "edit"; parentLabel: string; initialName: string }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean]; submit: [name: string] }>();
const name = ref("");
/** @description 提交修剪后的分类名称。 */
function submitCategoryForm(): void {
  const value = name.value.trim();
  if (value) emit("submit", value);
}
watch(
  () => props.modelValue,
  (visible) => {
    if (visible) name.value = props.initialName;
  },
);
</script>
<style scoped lang="scss">
.object-behavior-dialog__hint {
  margin: 0;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}
</style>
