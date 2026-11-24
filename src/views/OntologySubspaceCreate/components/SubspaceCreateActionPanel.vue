<template>
  <div class="subspace-create-action-panel" data-onboarding="subspace-create-action-panel">
    <div v-if="loadStatus === 'loading'" class="subspace-create-action-panel__state" role="status">正在加载行为列表…</div>
    <div v-else-if="loadStatus === 'error'" class="subspace-create-action-panel__state" role="alert">
      <span>{{ loadError || "行为列表加载失败" }}</span>
      <el-button class="aircas-button" size="small" @click="emit('retry')">重试</el-button>
    </div>
    <div v-else-if="loadStatus === 'empty' || !rows.length" class="subspace-create-action-panel__state">暂无行为</div>
    <template v-else>
      <el-table
        ref="tableRef"
        class="aircas-table aircas-table--flat subspace-create-action-panel__table"
        :data="rows"
        row-key="id"
        stripe
        height="100%"
        @selection-change="syncSelectedActionRows"
      >
        <el-table-column type="selection" width="48" reserve-selection />
        <el-table-column prop="displayName" label="行为名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="actionApi" label="API 名称" min-width="180" show-overflow-tooltip />
        <el-table-column label="类别" width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ resolveActionKindLabel(row.actionKind) }}</template>
        </el-table-column>
        <el-table-column prop="functionApi" label="函数 API" min-width="160" show-overflow-tooltip />
        <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip />
      </el-table>
    </template>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import type { TableInstance } from "element-plus";
import type { GetOntologyActionSelectableItem } from "@/types";

const props = defineProps<{
  rows: GetOntologyActionSelectableItem[];
  selectedActionIds: number[];
  loadStatus: "idle" | "loading" | "success" | "empty" | "error";
  loadError: string;
}>();

const emit = defineEmits<{
  "update:selectedActionIds": [value: number[]];
  retry: [];
}>();

const tableRef = ref<TableInstance>();
let isApplyingSelection = false;

const ACTION_KIND_LABELS: Record<string, string> = {
  BASE: "基础行为",
  APPLICATION: "应用行为",
  TREE: "行为树",
};

/**
 * @description 将行为类别枚举转为展示文案。
 * @param actionKind 行为类别。
 * @returns 中文标签；未知值原样返回。
 */
function resolveActionKindLabel(actionKind: string | null | undefined): string {
  if (!actionKind) return "";
  return ACTION_KIND_LABELS[actionKind] ?? actionKind;
}

/**
 * @description 将表格勾选同步为已选行为 id。
 * @param selection 当前勾选行。
 */
function syncSelectedActionRows(selection: GetOntologyActionSelectableItem[]): void {
  if (isApplyingSelection) return;
  const selected = selection.map((row) => row.id).filter((id): id is number => typeof id === "number" && Number.isFinite(id));
  emit("update:selectedActionIds", [...new Set(selected)]);
}

/**
 * @description 按已选 id 回显表格勾选。
 */
async function applyActionTableSelection(): Promise<void> {
  const table = tableRef.value;
  if (!table) return;
  isApplyingSelection = true;
  table.clearSelection();
  const selected = new Set(props.selectedActionIds);
  for (const row of props.rows) {
    if (typeof row.id === "number" && selected.has(row.id)) table.toggleRowSelection(row, true);
  }
  await nextTick();
  isApplyingSelection = false;
}

watch(
  () => [props.rows, props.selectedActionIds] as const,
  () => {
    void applyActionTableSelection();
  },
  { deep: true, immediate: true },
);
</script>

<style scoped lang="scss">
.subspace-create-action-panel {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
  overflow: hidden;
}

.subspace-create-action-panel__table {
  min-height: 0;
  flex: 1;
}

.subspace-create-action-panel__state {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  color: var(--aircas-color-text-secondary);
}
</style>
