<template>
  <section class="behavior-list-panel">
    <header class="behavior-list-panel__header">
      <div class="behavior-list-panel__title">
        <h2>{{ categoryLabel }}</h2>
        <span>空间内行为 · {{ total }} 条</span>
      </div>
      <div class="behavior-list-panel__filters">
        <el-input v-model="keywordModel" class="behavior-list-panel__keyword" clearable placeholder="按行为名称搜索" />
        <el-select v-model="statusModel" class="behavior-list-panel__status" clearable placeholder="行为状态">
          <el-option v-for="item in SPACE_BEHAVIOR_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-button @click="emit('query')">查询</el-button>
        <el-button @click="emit('reset')">重置</el-button>
        <el-button :icon="Plus" @click="emit('create')">新建行为</el-button>
      </div>
    </header>

    <div v-if="items.length" class="behavior-list-panel__table-wrap">
      <el-table :data="items" stripe height="100%" class="aircas-table--accent-header behavior-list-panel__table">
        <el-table-column label="行为名称" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="behavior-list-panel__name">{{ asBehavior(row).displayName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="函数算子" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">{{ asBehavior(row).functionOperatorName }}</template>
        </el-table-column>
        <el-table-column label="描述" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">{{ asBehavior(row).description }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="statusTagType(asBehavior(row).status)">{{ SPACE_BEHAVIOR_STATUS_LABELS[asBehavior(row).status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="160">
          <template #default="{ row }">{{ asBehavior(row).updatedAt }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <div class="behavior-list-panel__row-actions">
              <el-button size="small" @click="emit('view', asBehavior(row))">查看</el-button>
              <el-button size="small" @click="emit('edit', asBehavior(row))">编辑</el-button>
              <el-dropdown trigger="click" @command="handleMoreCommand($event, asBehavior(row))">
                <el-button size="small"
                  >更多<el-icon><ArrowDown /></el-icon
                ></el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="status">状态管理</el-dropdown-item>
                    <el-dropdown-item command="delete">删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-empty v-else description="暂无行为" :image-size="72" />

    <el-pagination
      v-if="total > 0"
      background
      :current-page="page"
      :page-size="pageSize"
      class="behavior-list-panel__pagination"
      layout="total, sizes, prev, pager, next"
      :total="total"
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
  "page-size-change": [pageSize: number];
}>();

const keywordModel = computed({
  get: () => props.keyword,
  set: (value: string) => emit("update:keyword", value),
});
const statusModel = computed({
  get: () => props.statusFilter,
  set: (value: SpaceBehaviorStatus | "") => emit("update:statusFilter", value),
});

/**
 * @description 将表格行收窄为行为记录。
 * @param row 表格行。
 * @returns 行为记录。
 */
function asBehavior(row: unknown): SpaceBehaviorItem {
  return row as SpaceBehaviorItem;
}

/**
 * @description 将行为状态映射为标签颜色。
 * @param status 行为状态。
 * @returns Element Plus 标签类型。
 */
function statusTagType(status: SpaceBehaviorStatus): "success" | "info" | "warning" {
  if (status === "published") return "success";
  if (status === "disabled") return "warning";
  return "info";
}

/**
 * @description 处理行内更多菜单；等下拉关闭后再打开弹窗，避免点击穿透立刻关掉弹层。
 * @param command 菜单命令。
 * @param item 当前行为。
 */
function handleMoreCommand(command: string, item: SpaceBehaviorItem): void {
  void nextTick(() => {
    if (command === "status") emit("status", item);
    if (command === "delete") emit("delete", item);
  });
}
</script>

<style lang="scss" scoped>
.behavior-list-panel {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}
.behavior-list-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 52px;
  padding: 8px 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
  box-shadow: inset 0 0 18px var(--aircas-color-effect-page-glow);
}

:root:not(.dark) .behavior-list-panel__header {
  background: linear-gradient(135deg, var(--aircas-color-card-background), var(--aircas-color-panel-background-deep));
}
.behavior-list-panel__title {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}
.behavior-list-panel__title h2 {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  font-weight: 600;
}
.behavior-list-panel__title span {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.behavior-list-panel__filters {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
  min-width: 0;
  gap: 8px;
}
.behavior-list-panel__keyword {
  width: min(220px, 24vw);
}
.behavior-list-panel__status {
  width: 140px;
}
.behavior-list-panel__table-wrap {
  min-width: 0;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
}
.behavior-list-panel__name {
  color: var(--aircas-color-text-primary);
  font-weight: 600;
}
.behavior-list-panel__row-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.behavior-list-panel__pagination {
  justify-content: flex-end;
}
</style>
