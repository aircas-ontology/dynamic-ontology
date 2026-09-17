<template>
  <el-dialog v-model="deleteVisible" class="aircas-dialog" title="删除本体空间" width="min(460px, 94vw)"
    :close-on-click-modal="false" :close-on-press-escape="!busy" :show-close="!busy">
    <p>确定删除「{{ space?.displayName }}」？本次演示中的更改将在刷新后重置。</p>
    <p v-if="error" class="space-command-dialogs__error" role="alert">{{ error }}</p>
    <template #footer>
      <el-button class="aircas-button" :disabled="busy" @click="deleteVisible = false">取消</el-button>
      <el-button class="aircas-button" type="danger" :loading="busy" @click="emit('confirmDelete')">删除</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="exportVisible" class="aircas-dialog" title="导出本体空间" width="min(460px, 94vw)"
    :close-on-click-modal="!busy" :close-on-press-escape="!busy" :show-close="!busy">
    <p>导出「{{ space?.displayName }}」的空间基本信息，文件可用于导入创建。</p>
    <p class="space-command-dialogs__notice">对象结构与实体数据尚未接入，本次不包含这些内容。</p>
    <p v-if="error" class="space-command-dialogs__error" role="alert">{{ error }}</p>
    <template #footer>
      <el-button class="aircas-button" :disabled="busy" @click="exportVisible = false">取消</el-button>
      <el-button class="aircas-button" type="primary" :loading="busy" @click="emit('confirmExport')">导出 JSON</el-button>
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
.space-command-dialogs__notice {
  margin-top: 12px;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}

.space-command-dialogs__error {
  margin-top: 12px;
  color: var(--aircas-color-danger);
}
</style>
