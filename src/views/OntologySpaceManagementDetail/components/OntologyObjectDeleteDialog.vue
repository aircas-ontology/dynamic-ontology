<template>
  <el-dialog v-model="visible" class="aircas-dialog" title="删除本体" width="min(440px, 94vw)" append-to-body destroy-on-close>
    <p>确认删除本体对象「{{ objectName }}」吗？此操作不可恢复。</p>
    <p v-if="error" class="ontology-object-delete-dialog__error" role="alert">{{ error }}</p>
    <template #footer>
      <el-button class="aircas-button" :disabled="submitting" @click="visible = false">取消</el-button>
      <el-button class="aircas-button" type="danger" :loading="submitting" @click="emit('confirm')">确认删除</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
const visible = defineModel<boolean>({ required: true });
defineProps<{ objectName: string; submitting: boolean; error: string }>();
const emit = defineEmits<{ confirm: [] }>();
</script>

<style scoped lang="scss">
.ontology-object-delete-dialog__error {
  margin-top: 8px;
  color: var(--aircas-color-danger);
  font-size: 12px;
}
</style>
