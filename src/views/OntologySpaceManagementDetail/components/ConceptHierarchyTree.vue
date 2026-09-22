<template>
  <aside class="concept-hierarchy" aria-label="概念层级树">
    <header class="concept-hierarchy__header">
      <h1>概念层级树</h1>
    </header>
    <el-input v-model="keyword" class="aircas-input concept-hierarchy__search" clearable placeholder="搜索概念类">
      <template #prefix
        ><el-icon> <Search /> </el-icon
      ></template>
    </el-input>
    <div v-if="tree.length === 0" class="concept-hierarchy__empty">
      <el-button class="aircas-button" type="primary" @click="emit('create')">添加分类树</el-button>
    </div>
    <el-tree
      v-else
      class="concept-hierarchy__tree"
      :data="treeNodes"
      :props="treeNodeProps"
      node-key="id"
      :default-expand-all="false"
      :default-expanded-keys="defaultExpandedKeys"
      highlight-current
      :current-node-key="selectedNodeId"
      :expand-on-click-node="false"
      :empty-text="keyword ? '未找到匹配概念' : '暂无概念层级'"
      @node-click="handleNodeClick"
    >
      <template #default="{ data }">
        <span v-if="isObjectNode(data)" class="concept-hierarchy__object-row">
          <span class="concept-hierarchy__object-dot" aria-hidden="true" />
          <span class="concept-hierarchy__object-name" :title="data.label">{{ data.label }}</span>
        </span>
        <template v-else>
          <span class="concept-hierarchy__node">
            <el-icon>
              <FolderOpened v-if="hasChildren(data)" />
              <CollectionTag v-else />
            </el-icon>
            <span class="concept-hierarchy__content">
              <span class="concept-hierarchy__heading">
                <span class="concept-hierarchy__label" :title="nodeLabel(data)">{{ nodeLabel(data) }}</span>
                <span v-if="nodeCount(data)" class="concept-hierarchy__count">{{ nodeCount(data) }}</span>
              </span>
            </span>
            <span class="concept-hierarchy__create-child-wrap" @click.stop>
              <el-tooltip content="新建子分类" placement="top" :show-after="200">
                <button type="button" class="concept-hierarchy__create-child" aria-label="新建子分类" @click="openChildCategoryDialog(data)">
                  <el-icon><Plus /></el-icon>
                </button>
              </el-tooltip>
              <el-tooltip content="修改分类名称" placement="top" :show-after="200">
                <button
                  type="button"
                  class="concept-hierarchy__action concept-hierarchy__action--edit"
                  aria-label="修改分类名称"
                  @click="openRenameCategoryDialog(data)"
                >
                  <el-icon><Edit /></el-icon>
                </button>
              </el-tooltip>
              <el-tooltip content="删除分类" placement="top" :show-after="200">
                <button
                  type="button"
                  class="concept-hierarchy__action concept-hierarchy__action--danger"
                  aria-label="删除分类"
                  @click="openDeleteCategoryDialog(data)"
                >
                  <el-icon><Delete /></el-icon>
                </button>
              </el-tooltip>
            </span>
          </span>
        </template>
      </template>
    </el-tree>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { CollectionTag, Delete, Edit, FolderOpened, Plus, Search } from "@element-plus/icons-vue";
import type { OntologyConceptNode } from "@/types";

/** el-tree 渲染用的本地节点类型；分类和对象在同一个 children 数组里混合。 */
interface ConceptCategoryTreeNode {
  kind: "category";
  id: string;
  label: string;
  count: number;
  targetCategoryId?: string;
  children: ConceptTreeNode[];
}

interface ConceptObjectTreeNode {
  kind: "object";
  id: string;
  label: string;
  children: ConceptTreeNode[];
}

type ConceptTreeNode = ConceptCategoryTreeNode | ConceptObjectTreeNode;

const props = defineProps<{
  tree: OntologyConceptNode[];
  selectedNodeId: string;
}>();

const emit = defineEmits<{
  select: [node: OntologyConceptNode];
  "select-object": [name: string];
  create: [];
  createChild: [categoryId: string];
  rename: [categoryId: string, name: string];
  delete: [categoryId: string, name: string];
}>();

const keyword = ref("");

const treeNodeProps = {
  children: "children",
  label: "label",
};

/**
 * @description 将后端 OntologyConceptNode 转换为 el-tree 可渲染的混合节点：对象名称作为分类下的子节点注入。
 * @param node 后端原始概念分类节点。
 * @returns 渲染用的分类节点，children 中混入子分类和对象节点。
 */
function transformCategoryNode(node: OntologyConceptNode): ConceptCategoryTreeNode {
  const objectNodes: ConceptObjectTreeNode[] = (node.objectNames ?? []).map((name, index) => ({
    kind: "object",
    id: `${node.id}-obj-${index}`,
    label: name,
    children: [],
  }));
  const childCategoryNodes: ConceptCategoryTreeNode[] = (node.children ?? []).map((child) => transformCategoryNode(child));
  return {
    kind: "category",
    id: node.id,
    label: node.label,
    count: node.count,
    targetCategoryId: node.targetCategoryId,
    children: [...childCategoryNodes, ...objectNodes],
  };
}

/** @description 递归过滤混合节点树：保留分类节点（label 匹配或子树有匹配），对象节点按 label 匹配。 */
function filterMixedTree(nodes: ConceptTreeNode[], keyword: string): ConceptTreeNode[] {
  if (!keyword) return nodes;
  const normalized = keyword.trim().toLocaleLowerCase("zh-CN");
  const result: ConceptTreeNode[] = [];
  for (const node of nodes) {
    if (node.kind === "object") {
      if (node.label.toLocaleLowerCase("zh-CN").includes(normalized)) result.push(node);
      continue;
    }
    const children = filterMixedTree(node.children, normalized);
    if (!node.label.toLocaleLowerCase("zh-CN").includes(normalized) && !children.length) continue;
    result.push({ ...node, children });
  }
  return result;
}

/** el-tree 的数据源，已把后端 objectNames 展开为嵌套子节点。 */
const treeNodes = computed<ConceptTreeNode[]>(() => {
  const keywordValue = keyword.value.trim();
  const raw = props.tree.map((node) => transformCategoryNode(node));
  return keywordValue ? filterMixedTree(raw, keywordValue) : raw;
});

/** 分类节点默认展开；对象节点不需要展开。 */
const defaultExpandedKeys = computed<string[]>(() => collectCategoryIds(treeNodes.value));

/** @description 递归收集所有分类节点的 id，供 el-tree 默认展开使用。 */
function collectCategoryIds(nodes: ConceptTreeNode[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    if (node.kind === "category") {
      ids.push(node.id);
      ids.push(...collectCategoryIds(node.children));
    }
  }
  return ids;
}

function isCategoryNode(value: unknown): value is ConceptCategoryTreeNode {
  return Boolean(value && typeof value === "object" && "kind" in value && (value as { kind: string }).kind === "category");
}

function isObjectNode(value: unknown): value is ConceptObjectTreeNode {
  return Boolean(value && typeof value === "object" && "kind" in value && (value as { kind: string }).kind === "object");
}

/** @description 在后端原始 props.tree 里查找指定 id 的 OntologyConceptNode，供 emit select 时保留完整数据。 */
function findOriginalCategoryNode(nodes: OntologyConceptNode[], id: string): OntologyConceptNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findOriginalCategoryNode(node.children ?? [], id);
    if (found) return found;
  }
  return undefined;
}

function handleNodeClick(value: unknown) {
  if (isObjectNode(value)) {
    emit("select-object", value.label);
    return;
  }
  if (isCategoryNode(value)) {
    const original = findOriginalCategoryNode(props.tree, value.id);
    if (original) emit("select", original);
  }
}

function nodeLabel(value: unknown) {
  return isCategoryNode(value) ? value.label : "";
}

function nodeCount(value: unknown) {
  return isCategoryNode(value) ? value.count : 0;
}

function hasChildren(value: unknown) {
  return isCategoryNode(value) && value.children.length > 0;
}

/**
 * @description 打开新建子分类弹框，并把当前节点的 categoryId 交给父组件作为 parentId。
 * @param value 被点击的分类节点。
 */
function openChildCategoryDialog(value: unknown) {
  if (!isCategoryNode(value)) return;
  const categoryId = value.targetCategoryId ?? value.id;
  emit("createChild", categoryId);
}

/**
 * @description 打开修改分类名称弹框，并带上当前节点的 categoryId 与名称。
 * @param value 被点击的分类节点。
 */
function openRenameCategoryDialog(value: unknown) {
  if (!isCategoryNode(value)) return;
  emit("rename", value.targetCategoryId ?? value.id, value.label);
}

/**
 * @description 打开删除分类确认框，并带上当前节点的 categoryId 与名称。
 * @param value 被点击的分类节点。
 */
function openDeleteCategoryDialog(value: unknown) {
  if (!isCategoryNode(value)) return;
  emit("delete", value.targetCategoryId ?? value.id, value.label);
}
</script>

<style scoped lang="scss">
.concept-hierarchy {
  display: flex;
  min-width: 0;
  min-height: 0;
  padding: 12px;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--aircas-color-cyan-border);
  border-radius: 8px;
  background:
    radial-gradient(circle at 12% 0, var(--aircas-color-cyan-soft), var(--aircas-color-transparent) 42%),
    linear-gradient(135deg, var(--aircas-color-panel-overlay), var(--aircas-color-panel-overlay-deep));
  box-shadow:
    inset 0 0 20px var(--aircas-color-border-shadow),
    0 0 18px var(--aircas-color-blue-soft);
}

.concept-hierarchy__header {
  display: flex;
  align-items: baseline;
  gap: 7px;
  margin-bottom: 10px;
}

.concept-hierarchy__header h1 {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  font-weight: 600;
}

.concept-hierarchy__header span {
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}

.concept-hierarchy__search {
  flex-shrink: 0;
  margin-bottom: 8px;
}

.concept-hierarchy__empty {
  display: flex;
  min-height: 0;
  flex: 1;
  align-items: center;
  justify-content: center;
}

.concept-hierarchy__tree {
  min-height: 0;
  padding-right: 4px;
  flex: 1;
  overflow: auto;
  color: var(--aircas-color-text-secondary);
  background: var(--aircas-color-transparent);
}

.concept-hierarchy__tree :deep(.el-tree-node__content) {
  min-height: 32px;
  height: auto;
  padding: 4px 0;
  border-radius: 4px;
}

.concept-hierarchy__tree :deep(.el-tree-node__content:hover) {
  background: var(--aircas-color-hover-background);
}

.concept-hierarchy__tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-selected-background);
}

.concept-hierarchy__node {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 6px;
}

.concept-hierarchy__content {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.concept-hierarchy__heading {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.concept-hierarchy__label {
  min-width: 0;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.concept-hierarchy__count {
  min-width: 24px;
  padding: 1px 6px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 999px;
  color: var(--aircas-color-text-muted);
  font-size: 11px;
  text-align: center;
}

/* 对象节点（树嵌套子节点，无展开箭头） */
.concept-hierarchy__object-row {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  padding-left: 4px;
  color: var(--aircas-color-text-secondary);
}

.concept-hierarchy__object-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--aircas-color-accent-cyan);
  box-shadow: 0 0 4px var(--aircas-color-accent-cyan-soft);
}

.concept-hierarchy__object-name {
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.concept-hierarchy__create-child-wrap {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
  flex-shrink: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.concept-hierarchy__tree :deep(.el-tree-node__content:hover) .concept-hierarchy__create-child-wrap,
.concept-hierarchy__tree :deep(.el-tree-node__content:focus-within) .concept-hierarchy__create-child-wrap {
  opacity: 1;
  pointer-events: auto;
}

.concept-hierarchy__create-child {
  display: inline-grid;
  width: 22px;
  height: 22px;
  place-items: center;
  padding: 0;
  border: none;
  border-radius: 4px;
  color: var(--aircas-color-text-inverse);
  background: var(--aircas-color-button-primary-background);
  cursor: pointer;
}

.concept-hierarchy__create-child:focus-visible,
.concept-hierarchy__action:focus-visible {
  outline: 1px solid var(--aircas-color-border);
  outline-offset: 1px;
}

.concept-hierarchy__action {
  display: inline-grid;
  width: 22px;
  height: 22px;
  place-items: center;
  padding: 0;
  border: none;
  border-radius: 4px;
  color: var(--aircas-color-text-inverse);
  cursor: pointer;
}

.concept-hierarchy__action--edit {
  background: var(--aircas-color-accent-blue);
}

.concept-hierarchy__action--danger {
  background: var(--aircas-color-danger);
}

.concept-hierarchy__node > .el-icon {
  color: var(--aircas-color-text-muted);
}
</style>
