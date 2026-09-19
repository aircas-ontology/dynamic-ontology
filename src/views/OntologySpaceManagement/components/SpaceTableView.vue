<template>
  <el-table class="aircas-table aircas-table--flat space-table-view" height="100%" :data="spaces" stripe row-key="id">
    <el-table-column label="空间名称" min-width="280">
      <template #default="{ row }">
        <div class="space-table-view__name">
          <img v-if="spaceRow(row).iconUrl" :src="spaceRow(row).iconUrl" alt="" />
          <el-icon v-else :size="32">
            <Box />
          </el-icon>
          <div><strong>{{ spaceRow(row).displayName }}</strong><small>{{ spaceRow(row).apiName }}</small></div>
        </div>
      </template>
    </el-table-column>
    <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
    <el-table-column prop="createdTime" label="创建时间" width="160" />
    <el-table-column prop="updatedTime" label="更新时间" width="160" />
    <el-table-column label="操作" width="230" fixed="right">
      <template #default="{ row }">
        <SpaceActions :space="spaceRow(row)" @action="emit('action', $event, spaceRow(row))" />
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
import { Box, UserFilled } from "@element-plus/icons-vue";
import type { OntologySpaceAction, OntologySpaceItem } from "@/types";
import SpaceActions from "./SpaceActions.vue";

const props = defineProps<{ spaces: OntologySpaceItem[] }>();
const emit = defineEmits<{ action: [action: OntologySpaceAction, space: OntologySpaceItem] }>();

function spaceRow(row: unknown): OntologySpaceItem {
  if (row && typeof row === "object" && "id" in row) {
    const space = props.spaces.find(item => item.id === row.id);
    if (space) return space;
  }
  throw new Error("无效的空间数据行。");
}
</script>

<style scoped lang="scss">
.space-table-view {
  --aircas-table-cell-padding: 20px 0;
  flex: 1;
  min-height: 320px;
}

.space-table-view__user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.space-table-view__avatar {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: var(--aircas-color-accent-cyan);
  background: var(--aircas-color-accent-cyan-fill);
}

.space-table-view__name {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.space-table-view__name img {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.space-table-view__name div {
  min-width: 0;
}

.space-table-view__name strong {
  display: block;
  overflow: hidden;
  font-size: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.space-table-view__name small {
  display: block;
  margin-top: 4px;
  overflow-wrap: anywhere;
  color: var(--aircas-color-text-muted);
  font-size: 14px;
}
</style>
