<template>
  <div class="subspace-create-function-panel" data-onboarding="subspace-create-function-panel">
    <div v-if="loadStatus === 'loading'" class="subspace-create-function-panel__state" role="status">正在加载函数列表…</div>
    <div v-else-if="loadStatus === 'error'" class="subspace-create-function-panel__state" role="alert">
      <span>{{ loadError || "函数列表加载失败" }}</span>
      <el-button class="aircas-button" size="small" @click="emit('retry')">重试</el-button>
    </div>
    <div v-else-if="loadStatus === 'empty' || !rows.length" class="subspace-create-function-panel__state">暂无函数</div>
    <template v-else>
      <el-table
        ref="tableRef"
        class="aircas-table aircas-table--flat subspace-create-function-panel__table"
        :data="rows"
        row-key="functionApi"
        stripe
        height="100%"
        @selection-change="syncSelectedFunctionRows"
      >
        <el-table-column type="selection" width="48" reserve-selection />
        <el-table-column prop="displayName" label="函数名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="functionApi" label="API 名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="120" show-overflow-tooltip />
        <el-table-column prop="version" label="版本" width="100" show-overflow-tooltip />
        <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip />
      </el-table>
      <el-pagination
        v-if="total > 0"
        background
        :current-page="page"
        :page-size="pageSize"
        class="aircas-pagination subspace-create-function-panel__pagination"
        popper-class="aircas-pagination-popper"
        layout="total, sizes, prev, pager, next"
        :total="total"
        :page-sizes="[8, 16, 32]"
        @current-change="emit('page-change', $event)"
        @size-change="emit('page-size-change', $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import type { TableInstance } from "element-plus";
import type { GetOntologyFunctionListItem } from "@/types";

const props = defineProps<{
  rows: GetOntologyFunctionListItem[];
  selectedFunctionApis: string[];
  loadStatus: "idle" | "loading" | "success" | "empty" | "error";
  loadError: string;
  page: number;
  pageSize: number;
  total: number;
}>();

const emit = defineEmits<{
  "update:selectedFunctionApis": [value: string[]];
  "page-change": [page: number];
  "page-size-change": [pageSize: number];
  retry: [];
}>();

const tableRef = ref<TableInstance>();
let isApplyingSelection = false;

/**
 * @description 将表格勾选同步为已选函数 api（保留跨页已选）。
 * @param selection 当前页勾选行。
 */
function syncSelectedFunctionRows(selection: GetOntologyFunctionListItem[]): void {
  if (isApplyingSelection) return;
  const pageApis = new Set(props.rows.map((row) => row.functionApi));
  const kept = props.selectedFunctionApis.filter((api) => !pageApis.has(api));
  const selected = selection.map((row) => row.functionApi).filter(Boolean);
  emit("update:selectedFunctionApis", [...new Set([...kept, ...selected])]);
}

/**
 * @description 按已选 api 回显当前页表格勾选。
 */
async function applyFunctionTableSelection(): Promise<void> {
  const table = tableRef.value;
  if (!table) return;
  isApplyingSelection = true;
  table.clearSelection();
  for (const row of props.rows) {
    if (props.selectedFunctionApis.includes(row.functionApi)) table.toggleRowSelection(row, true);
  }
  await nextTick();
  isApplyingSelection = false;
}

watch(
  () => [props.rows, props.selectedFunctionApis] as const,
  () => {
    void applyFunctionTableSelection();
  },
  { deep: true, immediate: true },
);
</script>

<style scoped lang="scss">
.subspace-create-function-panel {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
  overflow: hidden;
}

.subspace-create-function-panel__table {
  min-height: 0;
  flex: 1;
}

.subspace-create-function-panel__pagination {
  justify-content: flex-end;
}

.subspace-create-function-panel__state {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  color: var(--aircas-color-text-secondary);
}
</style>
