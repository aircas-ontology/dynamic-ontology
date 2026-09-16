<template>
  <section class="space-collection" aria-label="本体空间列表">
    <el-empty v-if="!spaces.length" class="aircas-empty" description="暂无本体空间，请创建空间或调整搜索条件" />
    <SpaceTableView v-else-if="viewMode === 'table'" :spaces="spaces" @action="forward" />
    <SpaceCardGrid v-else :spaces="spaces" @action="forward" />
    <footer v-if="total" class="space-collection__pagination">
      <span>共 {{ total }} 条</span>
      <el-pagination
        class="aircas-pagination"
        popper-class="aircas-pagination-popper"
        background
        layout="prev, pager, next, sizes"
        :total="total"
        :page-sizes="[5, 10, 20]"
        :current-page="page"
        :page-size="pageSize"
        @update:current-page="emit('update:page', $event)"
        @update:page-size="emit('update:pageSize', $event)"
      />
    </footer>
  </section>
</template>

<script setup lang="ts">
import type { OntologySpaceAction, OntologySpaceItem, OntologyViewMode } from "@/types";
import SpaceCardGrid from "./SpaceCardGrid.vue";
import SpaceTableView from "./SpaceTableView.vue";

defineProps<{
  spaces: OntologySpaceItem[];
  viewMode: OntologyViewMode;
  total: number;
  page: number;
  pageSize: number;
}>();

const emit = defineEmits<{
  action: [action: OntologySpaceAction, space: OntologySpaceItem];
  "update:page": [value: number];
  "update:pageSize": [value: number];
}>();

function forward(action: OntologySpaceAction, space: OntologySpaceItem) {
  emit("action", action, space);
}
</script>

<style scoped lang="scss">
.space-collection { display: flex; min-width: 0; min-height: 400px; flex: 1; flex-direction: column; }
.space-collection__pagination { display: flex; padding-top: 16px; padding-bottom: 4px; margin-top: auto; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; color: var(--aircas-color-text-secondary); font-size: 12px; }
.space-collection__pagination .aircas-pagination { max-width: 100%; row-gap: 8px; flex-wrap: wrap; }
</style>
