<template>
  <section class="entity-browsing-behavior" aria-label="空间浏览对象行为">
    <BehaviorCategoryPanel :tree-data="categoryPanelTree" :selected-category-id="selectedCategoryId" :status="status" @select="selectBehaviorCategory" />
    <BehaviorInstancePanel
      :category-name="selectedCategoryLabel"
      :items="behaviors"
      :total="total"
      :page="page"
      :page-size="pageSize"
      :keyword="keyword"
      :kind-filter="kindFilter"
      :status="status"
      :error="errorMessage"
      @update:keyword="keyword = $event"
      @update:kind-filter="kindFilter = $event"
      @query="applyBehaviorFilters"
      @reset="resetBehaviorFilters"
      @retry="loadBrowseBehaviorWorkspace"
      @detail="openBrowseBehaviorTest"
      @page-change="changeBehaviorPage"
      @page-size-change="changeBehaviorPageSize"
    />
    <BehaviorTestDialog
      v-if="activeBehavior && activeBehavior.kind !== 'behaviorTree'"
      v-model="behaviorTestVisible"
      :apis="behaviorTestApis"
      :space-id="spaceId"
      :behavior="activeBehavior"
      show-behavior-detail-panel
    />
    <BehaviorTreeTestDialog
      v-if="activeBehavior && activeBehavior.kind === 'behaviorTree'"
      v-model="behaviorTreeTestVisible"
      :query-object-catalog="behaviorTestApis.getOntologyCategoryTreeInterface"
      :space-id="spaceId"
      :behavior="activeBehavior"
      show-behavior-detail-panel
    />
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import * as behaviorTestApis from "@/apis";
import BehaviorTestDialog from "@/components/BehaviorTestDialog/BehaviorTestDialog.vue";
import BehaviorTreeTestDialog from "@/components/BehaviorTreeTestDialog.vue";
import type { SpaceBehaviorItem } from "@/types";
import BehaviorCategoryPanel from "./components/BehaviorCategoryPanel.vue";
import BehaviorInstancePanel from "./components/BehaviorInstancePanel.vue";
import { useEntityBrowsingBehaviorWorkspace } from "./composables/useEntityBrowsingBehaviorWorkspace";

const {
  spaceId,
  status,
  errorMessage,
  categoryPanelTree,
  behaviors,
  total,
  selectedCategoryId,
  selectedCategoryLabel,
  keyword,
  kindFilter,
  page,
  pageSize,
  loadBrowseBehaviorWorkspace,
  selectBehaviorCategory,
  applyBehaviorFilters,
  resetBehaviorFilters,
  changeBehaviorPage,
  changeBehaviorPageSize,
} = useEntityBrowsingBehaviorWorkspace();

const activeBehavior = ref<SpaceBehaviorItem | null>(null);
const behaviorTestVisible = ref(false);
const behaviorTreeTestVisible = ref(false);

/**
 * @description 打开所选对象行为的测试弹窗，不自动执行。
 * @param item 当前行为。
 */
function openBrowseBehaviorTest(item: SpaceBehaviorItem): void {
  activeBehavior.value = item;
  behaviorTestVisible.value = item.kind !== "behaviorTree";
  behaviorTreeTestVisible.value = item.kind === "behaviorTree";
}

/**
 * @description 空间切换时关闭测试弹窗并清空当前行为。
 */
function clearBrowseBehaviorTest(): void {
  behaviorTestVisible.value = false;
  behaviorTreeTestVisible.value = false;
  activeBehavior.value = null;
}

watch(spaceId, clearBrowseBehaviorTest);
</script>

<style scoped lang="scss">
.entity-browsing-behavior {
  display: grid;
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  grid-template-columns: 270px minmax(0, 1fr);
  gap: 8px;
  overflow: hidden;
}

@media (max-width: 1600px) {
  .entity-browsing-behavior {
    grid-template-columns: 250px minmax(0, 1fr);
  }
}
</style>
