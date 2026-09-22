<template>
  <el-table class="aircas-table aircas-table--flat space-table-view" height="100%" :data="spaces" stripe row-key="id">
    <el-table-column label="空间名称" min-width="280">
      <template #default="{ row }">
        <div class="space-table-view__name">
          <span class="space-table-view__icon">
            <img v-if="spaceRow(row).iconUrl" :src="spaceRow(row).iconUrl" alt="" />
            <el-icon v-else :size="22">
              <Box />
            </el-icon>
          </span>
          <div>
            <strong>{{ spaceRow(row).displayName }}</strong
            ><small>{{ spaceRow(row).apiName }}</small>
          </div>
        </div>
      </template>
    </el-table-column>
    <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
    <el-table-column prop="createdTime" label="创建时间" width="180" />
    <el-table-column prop="updatedTime" label="更新时间" width="180" />
    <el-table-column label="操作" width="230" fixed="right">
      <template #default="{ row }">
        <SpaceActions :space="spaceRow(row)" @action="emit('action', $event, spaceRow(row))" />
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
import { Box } from "@element-plus/icons-vue";
import type { OntologySpaceAction, OntologySpaceItem } from "@/types";
import SpaceActions from "./SpaceActions.vue";

const props = defineProps<{ spaces: OntologySpaceItem[] }>();
const emit = defineEmits<{ action: [action: OntologySpaceAction, space: OntologySpaceItem] }>();

/**
 * @description 将表格行还原为页面空间模型，找不到对应 id 时视为无效行。
 * @param row 表格当前行。
 * @returns 匹配到的本体空间项。
 */
function spaceRow(row: unknown): OntologySpaceItem {
  if (row && typeof row === "object" && "id" in row) {
    const space = props.spaces.find((item) => item.id === row.id);
    if (space) return space;
  }
  throw new Error("无效的空间数据行。");
}
</script>

<style scoped lang="scss">
.space-table-view {
  --aircas-table-cell-padding: 14px 0;
  flex: 1;
  min-height: 320px;
  border: 1px solid var(--aircas-color-cyan-border);
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(160deg, var(--aircas-color-panel-overlay), var(--aircas-color-panel-overlay-deep));
  box-shadow:
    inset 0 0 28px var(--aircas-color-border-shadow),
    0 0 18px var(--aircas-color-blue-soft);
}

.space-table-view :deep(.el-table__header-wrapper th.el-table__cell) {
  background: linear-gradient(180deg, var(--aircas-color-section-header), var(--aircas-color-panel-background-deep));
  color: var(--aircas-color-text-primary);
  font-size: 13px;
  font-weight: 700;
}

.space-table-view :deep(.el-table__body tr > td.el-table__cell) {
  background-color: var(--aircas-color-panel-background) !important;
}

.space-table-view :deep(.el-table__body tr.el-table__row--striped > td.el-table__cell) {
  background-color: var(--aircas-color-panel-background-deep) !important;
}

.space-table-view :deep(.el-table__body tr:hover > td.el-table__cell) {
  background-color: var(--aircas-color-blue-soft) !important;
}

.space-table-view__name {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.space-table-view__icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  overflow: hidden;
  border: 1px solid var(--aircas-color-cyan-border);
  border-radius: 8px;
  background: var(--aircas-color-section-header);
  box-shadow: 0 0 12px var(--aircas-color-cyan-soft);
  color: var(--aircas-color-accent-cyan);
  flex-shrink: 0;
}

.space-table-view__icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.space-table-view__name div {
  min-width: 0;
}

.space-table-view :deep(.el-table__body .space-table-view__name strong) {
  color: var(--aircas-color-text-primary);
}

.space-table-view__name strong {
  display: block;
  overflow: hidden;
  color: var(--aircas-color-text-primary);
  font-size: 14px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.space-table-view__name small {
  display: block;
  margin-top: 4px;
  overflow-wrap: anywhere;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}
</style>
