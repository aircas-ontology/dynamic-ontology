<template>
  <el-table class="aircas-table aircas-table--flat ai-assistant-property-table" :data="[...rows]" row-key="id" stripe size="small" max-height="280">
    <el-table-column label="选择" width="52">
      <template #header>
        <el-checkbox
          v-if="multiSelect"
          class="aircas-checkbox"
          :model-value="areAllRowsSelected"
          :indeterminate="areSomeRowsSelected"
          :disabled="disabled || rows.length === 0"
          label="全选属性"
          @change="changeAllRows($event)"
        />
      </template>
      <template #default="{ row }">
        <el-checkbox
          class="aircas-checkbox"
          :model-value="selectedIds.includes(row.id)"
          :disabled="disabled"
          :label="`选择${row.name}`"
          @change="changeRow(row.id, $event)"
        />
      </template>
    </el-table-column>
    <el-table-column label="属性名称" min-width="140">
      <template #default="{ row }">
        <div class="ai-assistant-property-table__name">
          <strong>{{ row.name }}</strong>
          <small>{{ row.field }}</small>
        </div>
      </template>
    </el-table-column>
    <el-table-column prop="dataType" label="类型" width="96" show-overflow-tooltip />
    <el-table-column prop="sourceTable" label="来源表" min-width="110" show-overflow-tooltip />
    <el-table-column label="主键" width="56">
      <template #default="{ row }">{{ row.primaryKey ? "是" : "—" }}</template>
    </el-table-column>
    <el-table-column prop="description" label="描述" min-width="120" show-overflow-tooltip />
  </el-table>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { CheckboxValueType } from "element-plus";

import type { AiAssistantPropertySelectionRow } from "@/types";

const props = defineProps<{
  rows: readonly AiAssistantPropertySelectionRow[];
  selectedIds: readonly string[];
  multiSelect: boolean;
  disabled: boolean;
}>();

const emit = defineEmits<{
  "change-option": [optionId: string, checked: boolean];
  "change-all": [checked: boolean];
}>();

const areAllRowsSelected = computed(() => props.rows.length > 0 && props.rows.every((row) => props.selectedIds.includes(row.id)));
const areSomeRowsSelected = computed(() => props.rows.some((row) => props.selectedIds.includes(row.id)) && !areAllRowsSelected.value);

/**
 * @description 切换单行勾选。
 * @param optionId 属性选项 id。
 * @param checked 复选框目标勾选状态。
 */
function changeRow(optionId: string, checked: CheckboxValueType): void {
  emit("change-option", optionId, checked === true);
}

/**
 * @description 多选时切换全部属性勾选。
 * @param checked 复选框目标勾选状态。
 */
function changeAllRows(checked: CheckboxValueType): void {
  emit("change-all", checked === true);
}
</script>

<style scoped lang="scss">
.ai-assistant-property-table {
  width: 100%;
}

.ai-assistant-property-table__name {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.ai-assistant-property-table__name strong {
  font-size: 12px;
}

.ai-assistant-property-table__name small {
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}
</style>
