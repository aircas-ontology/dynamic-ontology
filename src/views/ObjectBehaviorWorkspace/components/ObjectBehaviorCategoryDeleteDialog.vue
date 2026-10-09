<template>
  <el-dialog
    :model-value="modelValue"
    class="aircas-dialog"
    title="删除行为分类"
    width="440px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-alert type="warning" :closable="false" title="仅可删除不含子分类和行为的分类。" />
    <p>确认删除分类“{{ categoryName }}”吗？</p>
    <template #footer
      ><el-button class="aircas-button aircas-button--tone-ghost" @click="emit('update:modelValue', false)">取消</el-button
      ><el-button class="aircas-button aircas-button--tone-danger" type="danger" :disabled="blocked" @click="emit('confirm')">确认删除</el-button></template
    >
  </el-dialog>
</template>
<script setup lang="ts">
defineProps<{ modelValue: boolean; categoryName: string; blocked: boolean }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean]; confirm: [] }>();
</script>
<style scoped lang="scss">
p {
  color: var(--aircas-color-text-secondary);
}
</style>
