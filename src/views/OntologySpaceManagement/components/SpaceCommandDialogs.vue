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
    <p>导出「{{ space?.displayName }}」。</p>
    <ul class="space-command-dialogs__export-types">
      <li>可仅导出结构数据也可导出结构+实例数据</li>
    </ul>
    <el-radio-group
      :model-value="exportType"
      class="aircas-radio-group space-command-dialogs__export-type"
      :disabled="busy"
      ariaLabel="导出类型"
      @update:model-value="setOntologySpaceExportType"
    >
      <el-radio class="aircas-radio" value="SCHEMA">仅结构</el-radio>
      <el-radio class="aircas-radio" value="INSTANCE">含实例数据</el-radio>
    </el-radio-group>
    <p v-if="error" class="space-command-dialogs__error" role="alert">{{ error }}</p>
    <template #footer>
      <el-button class="aircas-button" :disabled="busy" @click="exportVisible = false">取消</el-button>
      <el-button class="aircas-button" type="primary" :loading="busy" @click="emit('confirmExport', exportType)">导出</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { OntologySpaceExportType, OntologySpaceItem } from "@/types";

defineProps<{
  space: OntologySpaceItem | null;
  busy: boolean;
  error: string;
}>();

const deleteVisible = defineModel<boolean>("deleteVisible", { required: true });
const exportVisible = defineModel<boolean>("exportVisible", { required: true });
const exportType = ref<OntologySpaceExportType>("INSTANCE");
const emit = defineEmits<{ confirmDelete: []; confirmExport: [exportType: OntologySpaceExportType] }>();

/**
 * @description 切换本体空间导出类型。只接受 SCHEMA 与 INSTANCE。
 * @param value 单选组当前值。
 */
function setOntologySpaceExportType(value: string | number | boolean | undefined) {
  if (value === "SCHEMA" || value === "INSTANCE") {
    exportType.value = value;
  }
}

/**
 * @description 导出弹窗打开时把导出类型恢复为 INSTANCE（含实例数据）。
 * @param visible 导出弹窗是否可见。
 */
function resetOntologySpaceExportType(visible: boolean) {
  if (visible) {
    exportType.value = "INSTANCE";
  }
}

watch(exportVisible, resetOntologySpaceExportType);
</script>

<style scoped lang="scss">
.space-command-dialogs__export-types {
  margin: 12px 0 0;
  padding-left: 18px;
  color: var(--aircas-color-text-secondary);
}

.space-command-dialogs__export-type {
  margin-top: 12px;
}

.space-command-dialogs__error {
  margin-top: 12px;
  color: var(--aircas-color-danger);
}
</style>
