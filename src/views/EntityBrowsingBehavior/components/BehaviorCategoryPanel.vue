<template>
  <aside class="behavior-category-panel" aria-label="行为分类">
    <header class="behavior-category-panel__header">
      <h3>行为分类</h3>
    </header>
    <el-input v-model="keyword" clearable maxlength="50" placeholder="搜索行为分类" ariaLabel="搜索行为分类">
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>
    <div class="behavior-category-panel__content">
      <button
        type="button"
        class="behavior-category-panel__all"
        :class="{ 'is-active': selectedCategoryId === ROOT_SPACE_BEHAVIOR_CATEGORY_ID }"
        :aria-pressed="selectedCategoryId === ROOT_SPACE_BEHAVIOR_CATEGORY_ID"
        @click="emit('select', ROOT_SPACE_BEHAVIOR_CATEGORY_ID)"
      >
        全部行为
      </button>
      <el-tree
        v-if="treeData.length"
        v-show="hasSearchResult"
        ref="treeRef"
        :data="treeData"
        node-key="id"
        :default-expanded-keys="defaultExpandedKeys"
        highlight-current
        :current-node-key="selectedCategoryId === ROOT_SPACE_BEHAVIOR_CATEGORY_ID ? undefined : selectedCategoryId || undefined"
        :expand-on-click-node="false"
        :filter-node-method="filterBehaviorCategoryNode"
        @node-click="handleBehaviorCategoryClick"
      >
        <template #default="{ data }">
          <span class="behavior-category-panel__tree-label" :title="data.label">
            <el-icon><FolderOpened /></el-icon>
            <span class="behavior-category-panel__label">{{ data.label }}</span>
          </span>
        </template>
      </el-tree>
      <el-empty v-else-if="status === 'empty' || !treeData.length" description="暂无行为分类" :image-size="54" />
      <el-empty v-else-if="treeData.length && !hasSearchResult" description="暂无匹配分类" :image-size="54" />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { FolderOpened, Search } from "@element-plus/icons-vue";
import type { TreeInstance, TreeNodeData } from "element-plus";
import type { SpaceBehaviorCategoryNode } from "@/types";
import { ROOT_SPACE_BEHAVIOR_CATEGORY_ID } from "@/types";
import { collectBrowseCategoryIds } from "../utils/browseBehaviorCategoryTree";

const props = withDefaults(
  defineProps<{
    treeData?: SpaceBehaviorCategoryNode[];
    selectedCategoryId?: string;
    status?: "loading" | "ready" | "empty" | "error";
  }>(),
  {
    treeData: () => [],
    selectedCategoryId: ROOT_SPACE_BEHAVIOR_CATEGORY_ID,
    status: "ready",
  },
);

const emit = defineEmits<{
  select: [categoryId: string];
}>();

const keyword = ref("");
const treeRef = ref<TreeInstance>();
const hasSearchResult = ref(true);
const defaultExpandedKeys = computed(() => collectBrowseCategoryIds(props.treeData).slice(0, 20));

/**
 * @description 按关键字过滤分类树节点。
 * @param value 搜索关键字。
 * @param data 树节点。
 * @returns 是否保留。
 */
function filterBehaviorCategoryNode(value: string, data: TreeNodeData): boolean {
  const label = typeof data.label === "string" ? data.label : "";
  return !value.trim() || label.toLocaleLowerCase().includes(value.trim().toLocaleLowerCase());
}

/**
 * @description 点击分类节点并通知父级筛选列表。
 * @param data 树节点数据。
 */
function handleBehaviorCategoryClick(data: TreeNodeData): void {
  const id = typeof data.id === "string" ? data.id.trim() : "";
  if (!id) return;
  emit("select", id);
}

watch(keyword, (value) => {
  treeRef.value?.filter(value);
  void nextTick(() => {
    const root = treeRef.value?.$el as HTMLElement | undefined;
    hasSearchResult.value = !value.trim() || Boolean(root?.querySelector(".el-tree-node"));
  });
});

watch(
  () => props.treeData,
  () => {
    keyword.value = "";
    hasSearchResult.value = true;
  },
);
</script>

<style scoped lang="scss">
.behavior-category-panel {
  display: grid;
  min-width: 0;
  min-height: 0;
  grid-template-rows: 38px auto minmax(0, 1fr);
  gap: 8px;
  padding-bottom: 8px;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 6px;
  background: var(--aircas-color-panel-background-deep);
  box-shadow: inset 0 0 28px var(--aircas-color-effect-primary-shadow);
}

.behavior-category-panel__header {
  display: flex;
  align-items: center;
  height: 38px;
  padding: 0 14px;
  border-bottom: 1px solid var(--aircas-color-border-light);

  h3 {
    margin: 0;
    color: var(--aircas-color-text-primary);
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 1px;
  }
}

.behavior-category-panel :deep(.el-input) {
  width: auto;
  margin: 0 10px;
}

.behavior-category-panel__content {
  min-height: 0;
  padding: 0 8px;
  overflow: auto;
}

.behavior-category-panel__all {
  display: flex;
  width: 100%;
  align-items: center;
  margin-bottom: 6px;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 4px;
  color: var(--aircas-color-text-primary);
  font-size: 14px;
  text-align: left;
  background: transparent;
  cursor: pointer;
}

.behavior-category-panel__all.is-active,
.behavior-category-panel__all:hover {
  border-color: var(--aircas-color-border-accent);
  background: var(--aircas-color-effect-primary-soft);
}

.behavior-category-panel__tree-label {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
  color: var(--aircas-color-text-primary);
}

.behavior-category-panel__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.behavior-category-panel :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background: var(--aircas-color-effect-primary-soft);
}
</style>
