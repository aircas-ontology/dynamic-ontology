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
        <el-button class="aircas-button aircas-button--tone-primary" @click="emit('create', '')">添加关系分类</el-button>
      </div>
      <el-tree
        v-else-if="displayTreeData.length"
        v-show="hasSearchResult"
        ref="treeRef"
        :data="displayTreeData"
        node-key="id"
        :default-expanded-keys="defaultExpandedKeys"
        highlight-current
        :current-node-key="selectedNodeId || undefined"
        :expand-on-click-node="false"
        :filter-node-method="filterNode"
        @node-click="handleNodeClick"
      >
        <template #default="{ data }">
          <div class="relation-category-panel__tree-node">
            <span v-if="isRelationNode(data)" class="relation-category-panel__relation-row" :title="data.label">
              <span class="relation-category-panel__relation-dot" aria-hidden="true"></span>
              <span class="relation-category-panel__relation-name">{{ data.label }}</span>
            </span>
            <template v-else-if="isCategoryNode(data)">
              <span class="relation-category-panel__tree-label" :title="data.label">
                <el-icon><FolderOpened /></el-icon>
                <span class="relation-category-panel__label">{{ data.label }}</span>
                <em class="relation-category-panel__count">{{ data.relationCount }}</em>
              </span>
              <span v-if="canCreate || canUpdate || canDelete" class="relation-category-panel__actions" @click.stop>
                <el-tooltip v-if="canCreate" content="添加子分类" placement="top" popper-class="aircas-popper" :show-after="200">
                  <button
                    type="button"
                    class="relation-category-panel__action relation-category-panel__action--add"
                    aria-label="添加子分类"
                    @click="emit('create', data.id)"
                  >
                    <el-icon><Plus /></el-icon>
                  </button>
                </el-tooltip>
                <el-tooltip v-if="canUpdate && !isRootCategory(data.id)" content="编辑分类" placement="top" popper-class="aircas-popper" :show-after="200">
                  <button
                    type="button"
                    class="relation-category-panel__action relation-category-panel__action--edit"
                    aria-label="编辑分类"
                    @click="emit('edit', data.id)"
                  >
                    <el-icon><EditPen /></el-icon>
                  </button>
                </el-tooltip>
                <el-tooltip v-if="canDelete && !isRootCategory(data.id)" content="删除分类" placement="top" popper-class="aircas-popper" :show-after="200">
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
            </template>
          </div>
        </template>
      </el-tree>
      <el-empty v-if="displayTreeData.length && !hasSearchResult" description="暂无匹配分类" :image-size="54" />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { Delete, EditPen, FolderOpened, Plus, Search } from "@element-plus/icons-vue";
import type { TreeInstance, TreeNodeData } from "element-plus";
import type { OntologyRelationCategoryNode, OntologyRelationClass } from "@/types";
import { ROOT_RELATION_CATEGORY_ID } from "@/types";

/** 关系分类树渲染用分类节点；children 中混入子分类与关系叶子。 */
interface DisplayCategoryNode {
  kind: "category";
  id: string;
  label: string;
  relationCount: number;
  children?: DisplayTreeNode[];
}

/** 关系分类树渲染用关系叶子节点，文案取关系名称。 */
interface DisplayRelationNode {
  kind: "relation";
  id: string;
  label: string;
  categoryId: string;
}

type DisplayTreeNode = DisplayCategoryNode | DisplayRelationNode;

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

/**
 * @description 递归收集分类及其子孙分类 id，用于统计子树关系数量。
 * @param node 分类节点。
 * @returns 分类 id 列表。
 */
function collectCategoryIds(node: OntologyRelationCategoryNode): string[] {
  return [node.id, ...node.children.flatMap(collectCategoryIds)];
}

/**
 * @description 将分类树与关系列表组装为混合树：分类下挂载直属关系叶子（展示关系名称）。
 * @param nodes 页面关系分类树。
 * @returns 可渲染的混合树节点。
 */
function enrich(nodes: OntologyRelationCategoryNode[]): DisplayCategoryNode[] {
  return nodes.map((node) => {
    const childCategories = enrich(node.children);
    const relationLeaves: DisplayRelationNode[] = props.relations
      .filter((item) => item.categoryId === node.id)
      .map((item) => ({
        kind: "relation",
        id: `rel-${item.id}`,
        label: item.displayName,
        categoryId: item.categoryId,
      }));
    const ids = new Set(collectCategoryIds(node));
    const relationCount = props.relations.filter((item) => ids.has(item.categoryId)).length;
    const children = [...childCategories, ...relationLeaves];
    return {
      kind: "category",
      id: node.id,
      label: node.label,
      relationCount,
      ...(children.length ? { children } : {}),
    };
  });
}

/**
 * @description 判断混合树节点是否为分类节点。
 * @param value 树节点。
 * @returns 是否为分类节点。
 */
function isCategoryNode(value: unknown): value is DisplayCategoryNode {
  return Boolean(value && typeof value === "object" && "kind" in value && (value as { kind: string }).kind === "category");
}

/**
 * @description 判断混合树节点是否为关系叶子节点。
 * @param value 树节点。
 * @returns 是否为关系叶子。
 */
function isRelationNode(value: unknown): value is DisplayRelationNode {
  return Boolean(value && typeof value === "object" && "kind" in value && (value as { kind: string }).kind === "relation");
}

/**
 * @description 递归判断混合树是否包含与关键字匹配的分类或关系名称。
 * @param nodes 混合树节点。
 * @param searchValue 已小写化的搜索关键字。
 * @returns 是否存在匹配。
 */
function hasMatchingNode(nodes: DisplayTreeNode[], searchValue: string): boolean {
  return nodes.some((node) => {
    if (node.label.toLocaleLowerCase().includes(searchValue)) return true;
    return isCategoryNode(node) ? hasMatchingNode(node.children ?? [], searchValue) : false;
  });
}

const displayTreeData = computed(() => enrich(Array.isArray(props.treeData) ? props.treeData : []));

/**
 * @description 收集分类节点 id，供 el-tree 默认展开；关系叶子不展开。
 * @param nodes 混合树节点。
 * @returns 分类节点 id 列表。
 */
function collectDisplayCategoryIds(nodes: DisplayTreeNode[]): string[] {
  return nodes.flatMap((node) => (isCategoryNode(node) ? [node.id, ...collectDisplayCategoryIds(node.children ?? [])] : []));
}

const defaultExpandedKeys = computed(() => collectDisplayCategoryIds(displayTreeData.value));
const rootCategoryId = computed(() => displayTreeData.value[0]?.id ?? ROOT_RELATION_CATEGORY_ID);
const hasSearchResult = computed(() => {
  const searchValue = keyword.value.trim().toLocaleLowerCase();
  if (!searchValue) return true;
  return hasMatchingNode(displayTreeData.value, searchValue);
});

/**
 * @description 判断节点是否为关系分类树根节点。
 * @param categoryId 分类 id。
 * @returns 是否为根分类。
 */
function isRootCategory(categoryId: string): boolean {
  return categoryId === ROOT_RELATION_CATEGORY_ID || categoryId === rootCategoryId.value;
}

/**
 * @description el-tree 过滤：分类与关系叶子均按 label 匹配。
 * @param value 当前搜索关键字。
 * @param data 树节点数据。
 * @returns 是否保留该节点。
 */
function filterNode(value: string, data: TreeNodeData): boolean {
  const label = typeof data.label === "string" ? data.label : "";
  return !value || label.toLocaleLowerCase().includes(value.toLocaleLowerCase());
}

/**
 * @description 点击分类时选中该分类；点击关系叶子时选中其所属分类。
 * @param data 被点击的混合树节点。
 */
function handleNodeClick(data: DisplayTreeNode): void {
  if (isRelationNode(data)) {
    emit("select-node", data.categoryId);
    return;
  }
  if (isCategoryNode(data)) {
    emit("select-node", data.id);
  }
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
  background: linear-gradient(135deg, var(--aircas-color-overlay), var(--aircas-color-overlay-deep));
  box-shadow: inset 0 0 20px var(--aircas-color-page-glow);
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
  min-height: 32px;
  height: auto;
  padding: 4px 0;
  border-radius: 4px;
}
.relation-category-panel :deep(.el-tree-node__content:hover) {
  background: var(--aircas-color-hover-background);
}
.relation-category-panel :deep(.el-tree-node.is-current > .el-tree-node__content) {
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-active-background);
}
.relation-category-panel :deep(.el-tree-node__expand-icon) {
  flex-shrink: 0;
  color: var(--aircas-color-text-secondary);
}

.relation-category-panel :deep(.el-tree-node__expand-icon.is-leaf) {
  color: var(--aircas-color-transparent);
}

.relation-category-panel__tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  min-width: 0;
}
.relation-category-panel__tree-label {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  gap: 6px;
  color: var(--aircas-color-text-secondary);
}
.relation-category-panel__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.relation-category-panel__count {
  flex-shrink: 0;
  padding: 0 6px;
  border-radius: 10px;
  color: var(--aircas-color-text-muted);
  border: 1px solid var(--aircas-color-border-soft);
  background: var(--aircas-color-input-background);
  font-size: 11px;
  font-style: normal;
}
.relation-category-panel__relation-row {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
  color: var(--aircas-color-text-secondary);
}
.relation-category-panel__relation-dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--aircas-color-accent-cyan);
}
.relation-category-panel__relation-name {
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
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
.relation-category-panel :deep(.el-tree-node__content:hover) .relation-category-panel__actions,
.relation-category-panel :deep(.el-tree-node__content:focus-within) .relation-category-panel__actions {
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
  color: var(--aircas-color-text-primary);
  border: 1px solid var(--aircas-color-border);
}
.relation-category-panel__action--add {
  color: var(--aircas-color-text-primary);
  border-color: var(--aircas-color-accent-cyan);
  background: linear-gradient(90deg, var(--aircas-color-active-background), var(--aircas-color-accent-blue-fill));
  box-shadow:
    inset 0 0 10px var(--aircas-color-accent-cyan-fill),
    0 0 8px var(--aircas-color-accent-cyan-soft);
}
.relation-category-panel__action--edit {
  color: var(--aircas-color-accent-blue);
  border-color: var(--aircas-color-accent-blue-border);
  background: var(--aircas-color-accent-blue-soft);
}
.relation-category-panel__action--danger {
  color: var(--aircas-color-danger);
  border-color: var(--aircas-color-danger);
  background: var(--aircas-color-danger-background);
}
</style>
