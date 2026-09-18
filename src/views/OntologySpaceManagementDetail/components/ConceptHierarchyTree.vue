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
      :data="filteredTree"
      node-key="id"
      default-expand-all
      highlight-current
      :current-node-key="selectedNodeId"
      :expand-on-click-node="false"
      :empty-text="keyword ? '未找到匹配概念' : '暂无概念层级'"
      @node-click="handleNodeClick"
    >
      <template #default="{ data }">
        <span class="concept-hierarchy__node">
          <el-icon>
            <FolderOpened v-if="hasChildren(data)" />
            <CollectionTag v-else />
          </el-icon>
          <span class="concept-hierarchy__label" :title="nodeLabel(data)">{{ nodeLabel(data) }}</span>
          <span v-if="nodeCount(data)" class="concept-hierarchy__count">{{ nodeCount(data) }}</span>
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
    </el-tree>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { CollectionTag, Delete, Edit, FolderOpened, Plus, Search } from "@element-plus/icons-vue";
import type { OntologyConceptNode } from "@/types";
import { filterConceptTree } from "../utils/objectWorkspace";

const props = defineProps<{
  tree: OntologyConceptNode[];
  selectedNodeId: string;
}>();

const emit = defineEmits<{
  select: [node: OntologyConceptNode];
  create: [];
  createChild: [categoryId: string];
  rename: [categoryId: string, name: string];
  delete: [categoryId: string, name: string];
}>();
const keyword = ref("");
const filteredTree = computed(() => filterConceptTree(props.tree, keyword.value));

function isConceptNode(value: unknown): value is OntologyConceptNode {
  return Boolean(value && typeof value === "object" && "id" in value && "label" in value && "children" in value);
}

function handleNodeClick(value: unknown) {
  if (isConceptNode(value)) emit("select", value);
}

function nodeLabel(value: unknown) {
  return isConceptNode(value) ? value.label : "";
}

function nodeCount(value: unknown) {
  return isConceptNode(value) ? value.count : 0;
}

function hasChildren(value: unknown) {
  return isConceptNode(value) && value.children.length > 0;
}

/**
 * @description 打开新建子分类弹框，并把当前节点的 categoryId 交给父组件作为 parentId。
 * @param value 被点击的分类节点。
 */
function openChildCategoryDialog(value: unknown) {
  if (!isConceptNode(value)) return;
  const categoryId = value.targetCategoryId ?? value.id;
  emit("createChild", categoryId);
}

/**
 * @description 打开修改分类名称弹框，并带上当前节点的 categoryId 与名称。
 * @param value 被点击的分类节点。
 */
function openRenameCategoryDialog(value: unknown) {
  if (!isConceptNode(value)) return;
  emit("rename", value.targetCategoryId ?? value.id, value.label);
}

/**
 * @description 打开删除分类确认框，并带上当前节点的 categoryId 与名称。
 * @param value 被点击的分类节点。
 */
function openDeleteCategoryDialog(value: unknown) {
  if (!isConceptNode(value)) return;
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
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-panel-background);
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
  height: 32px;
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
</style>
