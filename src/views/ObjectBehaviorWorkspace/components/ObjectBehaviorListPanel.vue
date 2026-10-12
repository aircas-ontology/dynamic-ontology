<template>
  <section class="object-behavior-list-panel">
    <header>
      <div>
        <h2>{{ categoryLabel }}</h2>
        <span>对象内行为 · {{ total }} 条</span>
      </div>
      <div class="object-behavior-list-panel__filters">
        <el-input v-model="keywordModel" clearable placeholder="按行为名称搜索" />
        <el-select v-model="statusModel" clearable placeholder="行为状态"
          ><el-option v-for="item in SPACE_BEHAVIOR_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value"
        /></el-select>
        <el-button @click="emit('query')">查询</el-button><el-button @click="emit('reset')">重置</el-button
        ><el-button :icon="Plus" @click="emit('create')">新建行为</el-button>
      </div>
    </header>
    <div v-if="items.length" class="object-behavior-list-panel__table">
      <el-table :data="items" stripe height="100%" class="aircas-table--accent-header">
        <el-table-column label="行为名称" min-width="140"
          ><template #default="{ row }"
            ><strong>{{ asItem(row).displayName }}</strong></template
          ></el-table-column
        >
        <el-table-column label="函数算子" min-width="200" show-overflow-tooltip
          ><template #default="{ row }">{{ asItem(row).functionOperatorName }}</template></el-table-column
        >
        <el-table-column label="描述" min-width="180" show-overflow-tooltip
          ><template #default="{ row }">{{ asItem(row).description }}</template></el-table-column
        >
        <el-table-column label="状态" width="100"
          ><template #default="{ row }"
            ><el-tag size="small">{{ SPACE_BEHAVIOR_STATUS_LABELS[asItem(row).status] }}</el-tag></template
          ></el-table-column
        >
        <el-table-column label="更新时间" width="160"
          ><template #default="{ row }">{{ asItem(row).updatedAt }}</template></el-table-column
        >
        <el-table-column label="操作" width="220" fixed="right"
          ><template #default="{ row }"
            ><div class="object-behavior-list-panel__actions">
              <el-button size="small" @click="emit('view', asItem(row))">查看</el-button
              ><el-button size="small" @click="emit('edit', asItem(row))">编辑</el-button
              ><el-dropdown trigger="click" @command="handleCommand($event, asItem(row))"
                ><el-button size="small"
                  >更多<el-icon><ArrowDown /></el-icon></el-button
                ><template #dropdown
                  ><el-dropdown-menu
                    ><el-dropdown-item command="status">状态管理</el-dropdown-item><el-dropdown-item command="delete">删除</el-dropdown-item></el-dropdown-menu
                  ></template
                ></el-dropdown
              >
            </div></template
          ></el-table-column
        >
      </el-table>
    </div>
    <el-empty v-else description="暂无行为" />
    <el-pagination
      v-if="total"
      background
      layout="total, sizes, prev, pager, next"
      :total="total"
      :current-page="page"
      :page-size="pageSize"
      :page-sizes="[10, 20, 50]"
      @current-change="emit('page-change', $event)"
      @size-change="emit('page-size-change', $event)"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick } from "vue";
import { ArrowDown, Plus } from "@element-plus/icons-vue";
import type { SpaceBehaviorItem, SpaceBehaviorStatus } from "@/types";
import { SPACE_BEHAVIOR_STATUS_LABELS, SPACE_BEHAVIOR_STATUS_OPTIONS } from "@/types";
const props = defineProps<{
  categoryLabel: string;
  items: SpaceBehaviorItem[];
  total: number;
  page: number;
  pageSize: number;
  keyword: string;
  statusFilter: SpaceBehaviorStatus | "";
}>();
const emit = defineEmits<{
  "update:keyword": [value: string];
  "update:statusFilter": [value: SpaceBehaviorStatus | ""];
  query: [];
  reset: [];
  create: [];
  view: [item: SpaceBehaviorItem];
  edit: [item: SpaceBehaviorItem];
  status: [item: SpaceBehaviorItem];
  delete: [item: SpaceBehaviorItem];
  "page-change": [page: number];
  "page-size-change": [size: number];
}>();
const keywordModel = computed({ get: () => props.keyword, set: (value: string) => emit("update:keyword", value) });
const statusModel = computed({ get: () => props.statusFilter, set: (value: SpaceBehaviorStatus | "") => emit("update:statusFilter", value) });
/** @description 转换表格记录。 @param row 原始记录。 @returns 行为记录。 */
function asItem(row: unknown): SpaceBehaviorItem {
  return row as SpaceBehaviorItem;
}
/** @description 延迟处理更多菜单，避免点击穿透。 @param command 操作命令。 @param item 行为记录。 */
function handleCommand(command: string, item: SpaceBehaviorItem): void {
  void nextTick(() => {
    if (command === "status") emit("status", item);
    if (command === "delete") emit("delete", item);
  });
}
</script>

<style scoped lang="scss">
.object-behavior-list-panel {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}
.object-behavior-list-panel > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 52px;
  padding: 8px 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
  gap: 12px;
}
.object-behavior-list-panel h2 {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
}
.object-behavior-list-panel header span {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.object-behavior-list-panel__filters,
.object-behavior-list-panel__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
.object-behavior-list-panel__filters {
  flex: 1;
}
.object-behavior-list-panel__table {
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  flex: 1;
}
.object-behavior-list-panel :deep(.el-pagination) {
  justify-content: flex-end;
}
</style>
