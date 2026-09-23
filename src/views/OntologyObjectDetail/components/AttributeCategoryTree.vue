<template>
  <aside class="ontology-object-attribute-panel__categories" aria-label="属性分类树">
    <header class="ontology-object-attribute-panel__section-header">
      <div>
        <h1>属性分类树 <small>/ Property Category</small></h1>
        <p>按分类浏览当前本体对象的属性</p>
      </div>
    </header>
    <el-input
      class="aircas-input"
      :model-value="categorySearch"
      clearable
      placeholder="搜索属性分类"
      ariaLabel="搜索属性分类"
      @update:model-value="$emit('update:categorySearch', $event)"
    />
    <p v-if="categoryTreeLoading" class="ontology-object-attribute-panel__tree-state"><AircasLoading>正在加载属性分类...</AircasLoading></p>
    <p v-else-if="categoryTreeError" class="ontology-object-attribute-panel__tree-state is-error" role="alert">{{ categoryTreeError }}</p>
    <div v-else-if="categoryTreeEmpty" class="ontology-object-attribute-panel__tree-empty">
      <p class="ontology-object-attribute-panel__tree-state">暂无分类树数据</p>
      <el-button class="aircas-button aircas-button--tone-primary" @click="$emit('create-root')">创建分类</el-button>
    </div>
    <el-tree
      v-else
      ref="treeRef"
      class="ontology-object-attribute-panel__tree"
      :data="categories"
      node-key="id"
      :props="treeProps"
      default-expand-all
      highlight-current
      :current-node-key="selectedCategoryId"
      :expand-on-click-node="false"
      :filter-node-method="filterCategoryNode"
      @node-click="$emit('select-category', $event)"
    >
      <template #default="{ data }">
        <div class="ontology-object-attribute-panel__tree-node">
          <template v-if="isCategoryNode(data)">
            <span class="ontology-object-attribute-panel__tree-label">
              <el-icon><FolderOpened /></el-icon>{{ data.label }}<em>{{ data.propertyCount }}</em>
            </span>
          </template>
          <template v-else>
            <span class="ontology-object-attribute-panel__tree-property-node" :title="data.label">
              <span class="ontology-object-attribute-panel__tree-property-dot" aria-hidden="true"></span>
              <span class="ontology-object-attribute-panel__tree-property-name">{{ data.label }}</span>
            </span>
          </template>
          <span v-if="isCategoryNode(data)" class="ontology-object-attribute-panel__tree-actions" @click.stop>
            <el-tooltip content="添加子分类" placement="top" popper-class="aircas-popper" :show-after="200">
              <button type="button" class="ontology-object-attribute-panel__tree-action" aria-label="添加子分类" @click="$emit('create-category', data)">
                <el-icon><Plus /></el-icon>
              </button>
            </el-tooltip>
            <el-tooltip content="编辑分类" placement="top" popper-class="aircas-popper" :show-after="200">
              <button type="button" class="ontology-object-attribute-panel__tree-action is-edit" aria-label="编辑分类" @click="$emit('edit-category', data)">
                <el-icon><EditPen /></el-icon>
              </button>
            </el-tooltip>
            <el-tooltip v-if="!data.isRoot" content="删除分类" placement="top" popper-class="aircas-popper" :show-after="200">
              <button
                type="button"
                class="ontology-object-attribute-panel__tree-action is-danger"
                aria-label="删除分类"
                @click="$emit('remove-category', data)"
              >
                <el-icon><Delete /></el-icon>
              </button>
            </el-tooltip>
          </span>
        </div>
      </template>
    </el-tree>
  </aside>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { Delete, EditPen, FolderOpened, Plus } from "@element-plus/icons-vue";
import type { OntologyAttributeCategoryNode, OntologyAttributeTreeNode } from "@/types";
import AircasLoading from "@/components/AircasLoading.vue";

const props = defineProps<{
  categories: OntologyAttributeCategoryNode[];
  treeProps: { children: string; label: string };
  categorySearch: string;
  categoryTreeLoading: boolean;
  categoryTreeError: string;
  categoryTreeEmpty: boolean;
  selectedCategoryId: string;
  filterCategoryNode: (value: string, data: unknown) => boolean;
}>();

defineEmits<{
  "update:categorySearch": [value: string];
  "select-category": [data: OntologyAttributeTreeNode];
  "create-root": [];
  "create-category": [data: OntologyAttributeCategoryNode];
  "edit-category": [data: OntologyAttributeCategoryNode];
  "remove-category": [data: OntologyAttributeCategoryNode];
}>();

const treeRef = ref<{ filter: (value: string) => void }>();

/** @description 判断树节点是否为属性分类节点。 */
function isCategoryNode(value: unknown): value is OntologyAttributeCategoryNode {
  return Boolean(value && typeof value === "object" && "nodeType" in value && value.nodeType === "category");
}

watch(
  () => props.categorySearch,
  (value) => treeRef.value?.filter(value),
);
</script>

<style scoped lang="scss">
.ontology-object-attribute-panel__categories {
  display: flex;
  min-width: 0;
  min-height: 0;
  padding: 16px 12px;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-overlay), var(--aircas-color-overlay-deep));
  box-shadow: inset 0 0 20px var(--aircas-color-page-glow);
}

.ontology-object-attribute-panel__section-header h1 {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
}

.ontology-object-attribute-panel__section-header h1 small {
  color: var(--aircas-color-text-muted);
  font-size: 12px;
  font-weight: 400;
}

.ontology-object-attribute-panel__section-header p {
  margin: 4px 0 0;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}

.ontology-object-attribute-panel__tree {
  min-height: 0;
  padding-right: 4px;
  flex: 1;
  overflow: auto;
  color: var(--aircas-color-text-secondary);
  background: var(--aircas-color-transparent);
}

.ontology-object-attribute-panel__tree-state {
  display: grid;
  min-height: 120px;
  margin: 0;
  place-items: center;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
  text-align: center;
}

.ontology-object-attribute-panel__tree-state.is-error {
  color: var(--aircas-color-danger);
}

.ontology-object-attribute-panel__tree-empty {
  display: grid;
  min-height: 120px;
  place-items: center;
  gap: 12px;
}

.ontology-object-attribute-panel__tree-empty .ontology-object-attribute-panel__tree-state {
  min-height: auto;
}

.ontology-object-attribute-panel__tree :deep(.el-tree-node__content) {
  min-height: 32px;
  height: auto;
  padding: 4px 0;
  border-radius: 4px;
}

.ontology-object-attribute-panel__tree :deep(.el-tree-node__content:hover) {
  background: var(--aircas-color-hover-background);
}

.ontology-object-attribute-panel__tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-active-background);
}

.ontology-object-attribute-panel__tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
}

.ontology-object-attribute-panel__tree-label {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  gap: 6px;
  color: var(--aircas-color-text-secondary);
}

.ontology-object-attribute-panel__tree-property-node {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
  color: var(--aircas-color-text-secondary);
}

.ontology-object-attribute-panel__tree-property-dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--aircas-color-accent-cyan);
}

.ontology-object-attribute-panel__tree-property-name {
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ontology-object-attribute-panel__tree-label em {
  padding: 0 6px;
  border-radius: 10px;
  color: var(--aircas-color-text-muted);
  border: 1px solid var(--aircas-color-border-soft);
  background: var(--aircas-color-input-background);
  font-size: 11px;
  font-style: normal;
}

.ontology-object-attribute-panel__tree-actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
  flex-shrink: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.ontology-object-attribute-panel__tree :deep(.el-tree-node__content:hover) .ontology-object-attribute-panel__tree-actions,
.ontology-object-attribute-panel__tree :deep(.el-tree-node__content:focus-within) .ontology-object-attribute-panel__tree-actions {
  opacity: 1;
  pointer-events: auto;
}

.ontology-object-attribute-panel__tree-action {
  display: inline-grid;
  width: 22px;
  height: 22px;
  padding: 0;
  border-radius: 4px;
  place-items: center;
  color: var(--aircas-color-text-primary);
  border: 1px solid var(--aircas-color-accent-cyan);
  background: linear-gradient(90deg, var(--aircas-color-active-background), var(--aircas-color-accent-blue-fill));
  box-shadow:
    inset 0 0 10px var(--aircas-color-accent-cyan-fill),
    0 0 8px var(--aircas-color-accent-cyan-soft);
  cursor: pointer;
}

.ontology-object-attribute-panel__tree-action.is-edit {
  color: var(--aircas-color-accent-blue);
  border-color: var(--aircas-color-accent-blue-border);
  background: var(--aircas-color-accent-blue-soft);
  box-shadow: none;
}

.ontology-object-attribute-panel__tree-action.is-danger {
  color: var(--aircas-color-danger);
  border-color: var(--aircas-color-danger);
  background: var(--aircas-color-danger-background);
  box-shadow: none;
}

.ontology-object-attribute-panel__tree-action:focus-visible {
  outline: 1px solid var(--aircas-color-border);
  outline-offset: 1px;
}

@media (max-width: 720px) {
  .ontology-object-attribute-panel__categories {
    min-height: 280px;
  }
}
</style>
