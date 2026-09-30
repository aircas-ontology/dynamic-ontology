<template>
  <el-dialog
    :model-value="modelValue"
    class="aircas-dialog"
    title="删除分类确认"
    width="440px"
    append-to-body
    destroy-on-close
    @close="emit('update:modelValue', false)"
  >
    <p v-if="blocked" class="relation-confirm-dialog__warn">分类「{{ categoryName }}」或其子分类下仍有关系，无法删除。请先移除相关关系后再试。</p>
    <p v-else>确认删除分类「{{ categoryName }}」及其空子节点吗？此操作不可恢复。</p>
    <template #footer>
      <el-button class="aircas-button aircas-button--tone-ghost" @click="emit('update:modelValue', false)">取消</el-button>
      <el-button class="aircas-button aircas-button--tone-danger" type="danger" :disabled="blocked" :loading="loading" @click="emit('confirm')"
        >确认删除</el-button
      >
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean; categoryName: string; blocked: boolean; loading: boolean }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean]; confirm: [] }>();
</script>

<style scoped lang="scss">
.relation-confirm-dialog__warn {
  color: var(--aircas-color-accent-orange);
}
</style>
