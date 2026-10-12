<template>
  <el-dialog
    title="创建分类"
    width="min(480px, 94vw)"
    append-to-body
    destroy-on-close
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form label-position="top">
      <el-form-item label="父分类">
        <el-input :model-value="parentName" readonly ariaLabel="父分类" />
      </el-form-item>
      <el-form-item label="输入分类名称" required>
        <el-input
          maxlength="64"
          ariaLabel="输入分类名称"
          placeholder="请输入分类名称"
          :model-value="name"
          :disabled="submitting"
          @update:model-value="$emit('update:name', $event)"
        />
      </el-form-item>
    </el-form>
    <p v-if="error" class="ontology-object-attribute-panel__dialog-error" role="alert">{{ error }}</p>
    <template #footer>
      <el-button :disabled="submitting" @click="$emit('update:visible', false)">取消</el-button>
      <el-button :loading="submitting" @click="$emit('confirm')">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean;
  parentName: string;
  name: string;
  submitting: boolean;
  error: string;
}>();

defineEmits<{
  "update:visible": [value: boolean];
  "update:name": [value: string];
  confirm: [];
}>();
</script>

<style scoped lang="scss">
.ontology-object-attribute-panel__dialog-error {
  margin: 8px 0 0;
  color: var(--aircas-color-danger);
  font-size: 12px;
}
</style>
