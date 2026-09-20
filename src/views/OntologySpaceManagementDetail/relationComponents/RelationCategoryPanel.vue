<template>
  <aside class="relation-category-panel">
    <header class="relation-category-panel__header">
      <h1 class="relation-category-panel__title">关系分类树</h1>
    </header>
    <el-input v-model="keyword" class="aircas-input" :maxlength="50" clearable placeholder="搜索关系分类" ariaLabel="搜索关系分类">
      <template #prefix
        ><el-icon><Search /></el-icon
      ></template>
    </el-input>
    <div class="relation-category-panel__content">
      <div v-if="!displayTreeData.length" class="relation-category-panel__empty">
        <el-button class="aircas-button" type="primary" @click="emit('create', '')">添加关系分类</el-button>
      </div>
      <el-tree
        v-else-if="displayTreeData.length"
        v-show="hasSearchResult"
        ref="treeRef"
        :data="displayTreeData"
        node-key="id"
        default-expand-all
        highlight-current
        :current-node-key="selectedNodeId || undefined"
        :expand-on-click-node="false"
        :filter-node-method="filterNode"
        @node-click="handleNodeClick"
      >
        <template #default="{ data }">
          <span class="relation-category-panel__node" :title="data.label">
            <i class="relation-category-panel__color-dot" :style="{ background: data.color || 'var(--aircas-color-accent-cyan)' }" aria-hidden="true" />
            <i class="fa fa-folder-open-o" aria-hidden="true"></i>
            <span class="relation-category-panel__label">{{ data.label }}</span>
            <span class="relation-category-panel__count">{{ data.relationCount }}</span>
            <span v-if="canCreate || canUpdate || canDelete" class="relation-category-panel__actions" @click.stop>
              <el-tooltip v-if="canCreate" content="添加子分类" placement="top" :show-after="200">
                <button
                  type="button"
                  class="relation-category-panel__action relation-category-panel__action--add"
                  aria-label="添加子分类"
                  @click="emit('create', data.id)"
                >
                  <el-icon><Plus /></el-icon>
                </button>
              </el-tooltip>
              <el-tooltip v-if="canUpdate && !isRootCategory(data.id)" content="编辑分类" placement="top" :show-after="200">
                <button
                  type="button"
                  class="relation-category-panel__action relation-category-panel__action--edit"
                  aria-label="编辑分类"
                  @click="emit('edit', data.id)"
                >
                  <el-icon><Edit /></el-icon>
                </button>
              </el-tooltip>
              <el-tooltip v-if="canDelete && !isRootCategory(data.id)" content="删除分类" placement="top" :show-after="200">
                <button
                  type="button"
                  class="relation-category-panel__action relation-category-panel__action--danger"
                  aria-label="删除分类"
                  @click="emit('delete', data.id)"
                >
                  <el-icon><Delete /></el-icon>
                </button>
              </el-tooltip>
            </span>
          </span>
        </template>
      </el-tree>
      <el-empty v-if="displayTreeData.length && !hasSearchResult" description="暂无匹配分类" :image-size="54" />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { Delete, Edit, Plus, Search } from "@element-plus/icons-vue";
import type { TreeInstance, TreeNodeData } from "element-plus";
import type { OntologyRelationCategoryNode, OntologyRelationClass } from "@/types";
import { ROOT_RELATION_CATEGORY_ID } from "@/types";

interface DisplayCategoryNode extends OntologyRelationCategoryNode {
  children: DisplayCategoryNode[];
  relationCount: number;
}

const props = withDefaults(
  defineProps<{
    treeData?: OntologyRelationCategoryNode[];
    selectedNodeId?: string | null;
    relations?: OntologyRelationClass[];
    canCreate?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
  }>(),
  {
    treeData: () => [],
    selectedNodeId: null,
    relations: () => [],
    canCreate: true,
    canUpdate: true,
    canDelete: true,
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

function collectIds(node: OntologyRelationCategoryNode): string[] {
  return [node.id, ...node.children.flatMap(collectIds)];
}

function enrich(nodes: OntologyRelationCategoryNode[]): DisplayCategoryNode[] {
  return nodes.map((node) => {
    const children = enrich(node.children);
    const ids = new Set(collectIds(node));
    const relationCount = props.relations.filter((item) => ids.has(item.categoryId)).length;
    return { ...node, children, relationCount };
  });
}

const displayTreeData = computed(() => enrich(Array.isArray(props.treeData) ? props.treeData : []));
const rootCategoryId = computed(() => displayTreeData.value[0]?.id ?? ROOT_RELATION_CATEGORY_ID);
const hasSearchResult = computed(() => {
  const searchValue = keyword.value.trim().toLocaleLowerCase();
  if (!searchValue) return true;
  const matches = (node: OntologyRelationCategoryNode): boolean => node.label.toLocaleLowerCase().includes(searchValue) || node.children.some(matches);
  return displayTreeData.value.some(matches);
});

/**
 * @description 判断节点是否为关系分类树根节点。
 * @param categoryId 分类 id。
 * @returns 是否为根分类。
 */
function isRootCategory(categoryId: string): boolean {
  return categoryId === ROOT_RELATION_CATEGORY_ID || categoryId === rootCategoryId.value;
}

function filterNode(value: string, data: TreeNodeData): boolean {
  const label = typeof data.label === "string" ? data.label : "";
  return !value || label.toLocaleLowerCase().includes(value.toLocaleLowerCase());
}

function handleNodeClick(data: OntologyRelationCategoryNode): void {
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
.relation-category-panel {
  display: flex;
  min-height: 0;
  padding: 12px;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-section-background), var(--aircas-color-panel-background-deep));
  box-shadow: inset 0 0 20px var(--aircas-color-divider);
  flex-direction: column;
  gap: 8px;
}
.relation-category-panel__header {
  display: flex;
  align-items: baseline;
  gap: 7px;
}
.relation-category-panel__title {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  font-weight: 600;
}
.relation-category-panel__content {
  min-height: 0;
  overflow: auto;
  flex: 1;
}
.relation-category-panel__empty {
  display: grid;
  min-height: 120px;
  place-items: center;
}
.relation-category-panel :deep(.el-tree) {
  color: var(--aircas-color-text-secondary);
  background: var(--aircas-color-transparent);
  --el-tree-node-hover-bg-color: var(--aircas-color-hover-background);
}
.relation-category-panel :deep(.el-tree-node__content) {
  height: 30px;
  border-radius: 4px;
}
.relation-category-panel :deep(.el-tree-node.is-current > .el-tree-node__content) {
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-card-background-active);
}
.relation-category-panel__node {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding-right: 4px;
  font-size: 13px;
}
.relation-category-panel__color-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
  box-shadow: 0 0 6px var(--aircas-color-accent-cyan-soft);
}
.relation-category-panel__node .fa {
  font-size: 13px;
  line-height: 1;
  color: inherit;
  flex-shrink: 0;
}
.relation-category-panel__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.relation-category-panel__count {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0 6px;
  font-size: 12px;
  line-height: 16px;
  color: var(--aircas-color-text-muted);
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 8px;
  background: var(--aircas-color-input-background);
}
.relation-category-panel__actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
  flex-shrink: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}
.relation-category-panel :deep(.el-tree-node__content:hover) .relation-category-panel__actions {
  opacity: 1;
  pointer-events: auto;
}
.relation-category-panel__action {
  display: inline-grid;
  width: 22px;
  height: 22px;
  place-items: center;
  padding: 0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: var(--aircas-color-text-inverse);
}
.relation-category-panel__action--add {
  background: var(--aircas-color-button-primary-background);
}
.relation-category-panel__action--edit {
  background: var(--aircas-color-accent-blue);
}
.relation-category-panel__action--danger {
  background: var(--aircas-color-danger);
}
</style>
