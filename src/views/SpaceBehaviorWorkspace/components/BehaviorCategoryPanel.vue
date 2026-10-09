<template>
  <aside class="behavior-category-panel">
    <header class="behavior-category-panel__header">
      <h1 class="behavior-category-panel__title">行为分类树</h1>
    </header>
    <el-input v-model="keyword" class="aircas-input" :maxlength="50" clearable placeholder="搜索行为分类" ariaLabel="搜索行为分类">
      <template #prefix
        ><el-icon><Search /></el-icon
      ></template>
    </el-input>
    <div class="behavior-category-panel__content">
      <div v-if="!treeData.length" class="behavior-category-panel__empty">
        <el-button class="aircas-button aircas-button--tone-primary" @click="emit('create', '')">添加行为分类</el-button>
      </div>
      <el-tree
        v-else
        v-show="hasSearchResult"
        ref="treeRef"
        class="aircas-tree"
        :data="treeData"
        node-key="id"
        :default-expanded-keys="defaultExpandedKeys"
        highlight-current
        :current-node-key="selectedNodeId || undefined"
        :expand-on-click-node="false"
        :filter-node-method="filterBehaviorCategoryNode"
        @node-click="handleBehaviorCategoryClick"
      >
        <template #default="{ data }">
          <div class="behavior-category-panel__tree-node">
            <span class="behavior-category-panel__tree-label" :title="data.label">
              <el-icon><FolderOpened /></el-icon>
              <span class="behavior-category-panel__label">{{ data.label }}</span>
              <em class="behavior-category-panel__count">{{ data.count }}</em>
            </span>
            <span class="behavior-category-panel__actions" @click.stop>
              <el-tooltip content="添加子分类" placement="top" popper-class="aircas-popper" :show-after="200">
                <button
                  type="button"
                  class="behavior-category-panel__action behavior-category-panel__action--add"
                  aria-label="添加子分类"
                  @click="emit('create', data.id)"
                >
                  <el-icon><Plus /></el-icon>
                </button>
              </el-tooltip>
              <el-tooltip v-if="!isRootCategory(data.id)" content="编辑分类" placement="top" popper-class="aircas-popper" :show-after="200">
                <button
                  type="button"
                  class="behavior-category-panel__action behavior-category-panel__action--edit"
                  aria-label="编辑分类"
                  @click="emit('edit', data.id)"
                >
                  <el-icon><EditPen /></el-icon>
                </button>
              </el-tooltip>
              <el-tooltip v-if="!isRootCategory(data.id)" content="删除分类" placement="top" popper-class="aircas-popper" :show-after="200">
                <button
                  type="button"
                  class="behavior-category-panel__action behavior-category-panel__action--danger"
                  aria-label="删除分类"
                  @click="emit('delete', data.id)"
                >
                  <el-icon><Delete /></el-icon>
                </button>
              </el-tooltip>
            </span>
          </div>
        </template>
      </el-tree>
      <el-empty v-if="treeData.length && !hasSearchResult" description="暂无匹配分类" :image-size="54" />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { Delete, EditPen, FolderOpened, Plus, Search } from "@element-plus/icons-vue";
import type { TreeInstance, TreeNodeData } from "element-plus";
import type { SpaceBehaviorCategoryNode } from "@/types";
import { ROOT_SPACE_BEHAVIOR_CATEGORY_ID } from "@/types";
import { collectSpaceBehaviorCategoryIds } from "../utils/spaceBehaviorOperations";

const props = withDefaults(
  defineProps<{
    treeData?: SpaceBehaviorCategoryNode[];
    selectedNodeId?: string | null;
  }>(),
  {
    treeData: () => [],
    selectedNodeId: null,
  },
);

const emit = defineEmits<{
  "select-node": [nodeId: string];
  create: [parentId: string];
  edit: [categoryId: string];
  delete: [categoryId: string];
}>();

const keyword = ref("");
const treeRef = ref<TreeInstance>();

/**
 * @description 判断分类名称是否匹配关键字。
 * @param nodes 分类树。
 * @param searchValue 已小写化的关键字。
 * @returns 是否存在匹配。
 */
function hasMatchingCategory(nodes: SpaceBehaviorCategoryNode[], searchValue: string): boolean {
  return nodes.some((node) => node.label.toLocaleLowerCase().includes(searchValue) || hasMatchingCategory(node.children, searchValue));
}

const defaultExpandedKeys = computed(() => props.treeData.flatMap((node) => collectSpaceBehaviorCategoryIds(node)));
const hasSearchResult = computed(() => {
  const searchValue = keyword.value.trim().toLocaleLowerCase();
  if (!searchValue) return true;
  return hasMatchingCategory(props.treeData, searchValue);
});

/**
 * @description 判断节点是否为行为分类树根节点。
 * @param categoryId 分类 id。
 * @returns 是否为根分类。
 */
function isRootCategory(categoryId: string): boolean {
  return categoryId === ROOT_SPACE_BEHAVIOR_CATEGORY_ID || categoryId === props.treeData[0]?.id;
}

/**
 * @description el-tree 按分类名称过滤。
 * @param value 当前搜索关键字。
 * @param data 树节点数据。
 * @returns 是否保留该节点。
 */
function filterBehaviorCategoryNode(value: string, data: TreeNodeData): boolean {
  const label = typeof data.label === "string" ? data.label : "";
  return !value || label.toLocaleLowerCase().includes(value.toLocaleLowerCase());
}

/**
 * @description 点击分类节点后筛选右侧行为列表。
 * @param data 被点击的分类。
 */
function handleBehaviorCategoryClick(data: SpaceBehaviorCategoryNode): void {
  emit("select-node", data.id);
}

watch(keyword, (value) => treeRef.value?.filter(value.trim().slice(0, 50)));
watch(
  () => props.selectedNodeId,
  async (value) => {
    await nextTick();
    treeRef.value?.setCurrentKey(value || undefined);
  },
);
</script>

<style lang="scss" scoped>
.behavior-category-panel {
  display: flex;
  min-height: 0;
  padding: 12px;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-overlay), var(--aircas-color-overlay-deep));
  box-shadow: inset 0 0 20px var(--aircas-color-page-glow);
  flex-direction: column;
  gap: 8px;
}

:root[theme="light"] .behavior-category-panel {
  background: linear-gradient(135deg, var(--aircas-color-card-background), var(--aircas-color-panel-background-deep));
}
.behavior-category-panel__header {
  display: flex;
  align-items: baseline;
  gap: 7px;
}
.behavior-category-panel__title {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  font-weight: 600;
}
.behavior-category-panel__content {
  min-height: 0;
  overflow: auto;
  flex: 1;
}
.behavior-category-panel__empty {
  display: grid;
  min-height: 120px;
  place-items: center;
}
.behavior-category-panel__tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  min-width: 0;
}
.behavior-category-panel__tree-label {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  gap: 6px;
  color: var(--aircas-color-text-secondary);
}
.behavior-category-panel__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.behavior-category-panel__count {
  flex-shrink: 0;
  padding: 0 6px;
  border-radius: 10px;
  color: var(--aircas-color-text-muted);
  border: 1px solid var(--aircas-color-border-soft);
  background: var(--aircas-color-input-background);
  font-size: 11px;
  font-style: normal;
}
.behavior-category-panel__actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
  flex-shrink: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}
.behavior-category-panel :deep(.el-tree-node__content:hover) .behavior-category-panel__actions,
.behavior-category-panel :deep(.el-tree-node__content:focus-within) .behavior-category-panel__actions {
  opacity: 1;
  pointer-events: auto;
}
.behavior-category-panel__action {
  display: inline-grid;
  width: 22px;
  height: 22px;
  place-items: center;
  padding: 0;
  border-radius: 4px;
  cursor: pointer;
  color: var(--aircas-color-text-primary);
  border: 1px solid var(--aircas-color-border);
}
.behavior-category-panel__action--add {
  color: var(--aircas-color-text-primary);
  border-color: var(--aircas-color-accent-cyan);
  background: linear-gradient(90deg, var(--aircas-color-active-background), var(--aircas-color-accent-blue-fill));
  box-shadow:
    inset 0 0 10px var(--aircas-color-accent-cyan-fill),
    0 0 8px var(--aircas-color-accent-cyan-soft);
}
.behavior-category-panel__action--edit {
  color: var(--aircas-color-accent-blue);
  border-color: var(--aircas-color-accent-blue-border);
  background: var(--aircas-color-accent-blue-soft);
}
.behavior-category-panel__action--danger {
  color: var(--aircas-color-danger);
  border-color: var(--aircas-color-danger);
  background: var(--aircas-color-danger-background);
}
</style>
