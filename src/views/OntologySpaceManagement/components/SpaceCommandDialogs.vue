<template>
  <el-dialog
    v-model="deleteVisible"
    class="aircas-dialog"
    title="删除本体空间"
    width="min(460px, 94vw)"
    :close-on-click-modal="false"
    :close-on-press-escape="!busy"
    :show-close="!busy"
  >
    <p>确认删除「{{ space?.displayName }}」本体空间数据？</p>
    <p v-if="error" class="space-command-dialogs__error" role="alert">{{ error }}</p>
    <template #footer>
      <el-button class="aircas-button" :disabled="busy" @click="deleteVisible = false">取消</el-button>
      <el-button class="aircas-button" type="danger" :loading="busy" @click="emit('confirmDelete')">删除</el-button>
    </template>
  </el-dialog>

  <el-dialog
    v-model="exportVisible"
    class="aircas-dialog"
    title="导出本体空间"
    width="min(460px, 94vw)"
    :close-on-click-modal="!busy"
    :close-on-press-escape="!busy"
    :show-close="!busy"
  >
    <p>导出「{{ space?.displayName }}」的分类树、本体 schema 与实例数据。</p>
    <p v-if="error" class="space-command-dialogs__error" role="alert">{{ error }}</p>
    <template #footer>
      <el-button class="aircas-button" :disabled="busy" @click="exportVisible = false">取消</el-button>
      <el-button class="aircas-button" type="primary" :loading="busy" @click="emit('confirmExport')">导出</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { OntologySpaceItem } from "@/types";

defineProps<{
  space: OntologySpaceItem | null;
  busy: boolean;
  error: string;
}>();

const deleteVisible = defineModel<boolean>("deleteVisible", { required: true });
const exportVisible = defineModel<boolean>("exportVisible", { required: true });
const emit = defineEmits<{ confirmDelete: []; confirmExport: [] }>();
</script>

<style scoped lang="scss">
.space-command-dialogs__error {
  margin-top: 12px;
  color: var(--aircas-color-danger);
}
</style>
