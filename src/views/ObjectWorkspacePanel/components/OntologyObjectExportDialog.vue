<template>
  <el-dialog v-model="visible" class="aircas-dialog" title="导出本体" width="min(440px, 94vw)" append-to-body destroy-on-close>
    <p>导出「{{ objectName }}」。</p>
    <ul class="ontology-object-export-dialog__export-types">
      <li>可仅导出结构数据也可导出结构+实例数据</li>
    </ul>
    <el-radio-group
      :model-value="exportType"
      class="aircas-radio-group ontology-object-export-dialog__export-type"
      :disabled="submitting"
      ariaLabel="导出类型"
      @update:model-value="setOntologyExportType"
    >
      <el-radio class="aircas-radio" value="SCHEMA">仅结构</el-radio>
      <el-radio class="aircas-radio" value="INSTANCE">含实例数据</el-radio>
    </el-radio-group>
    <p v-if="error" class="ontology-object-export-dialog__error" role="alert">{{ error }}</p>
    <template #footer>
      <el-button class="aircas-button" :disabled="submitting" @click="visible = false">取消</el-button>
      <el-button class="aircas-button" type="primary" :loading="submitting" @click="emit('confirm', exportType)">导出</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { OntologyExportType } from "@/types";

const visible = defineModel<boolean>({ required: true });
defineProps<{ objectName: string; submitting: boolean; error: string }>();
const exportType = ref<OntologyExportType>("INSTANCE");
const emit = defineEmits<{ confirm: [exportType: OntologyExportType] }>();

/**
 * @description 切换本体对象导出类型。只接受 SCHEMA 与 INSTANCE。
 * @param value 单选组当前值。
 */
function setOntologyExportType(value: string | number | boolean | undefined) {
  if (value === "SCHEMA" || value === "INSTANCE") {
    exportType.value = value;
  }
}

/**
 * @description 导出弹窗打开时把导出类型恢复为 INSTANCE（含实例数据）。
 * @param opened 导出弹窗是否可见。
 */
function resetOntologyExportType(opened: boolean) {
  if (opened) {
    exportType.value = "INSTANCE";
  }
}

watch(visible, resetOntologyExportType);
</script>

<style scoped lang="scss">
.ontology-object-export-dialog__export-types {
  margin: 12px 0 0;
  padding-left: 18px;
  color: var(--aircas-color-text-secondary);
}

.ontology-object-export-dialog__export-type {
  margin-top: 12px;
}

.ontology-object-export-dialog__error {
  margin-top: 8px;
  color: var(--aircas-color-danger);
  font-size: 12px;
}
</style>
