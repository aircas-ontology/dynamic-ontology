<template>
  <aside class="concept-hierarchy" aria-label="概念层级树">
    <header class="concept-hierarchy__header">
      <h1>概念层级树</h1>
      <span>/ Ontology Hierarchy</span>
    </header>
    <el-input v-model="keyword" class="aircas-input concept-hierarchy__search" clearable placeholder="搜索概念类">
      <template #prefix><el-icon><Search /></el-icon></template>
    </el-input>
    <el-tree
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
          <el-icon><FolderOpened v-if="hasChildren(data)" /><CollectionTag v-else /></el-icon>
          <span class="concept-hierarchy__label" :title="nodeLabel(data)">{{ nodeLabel(data) }}</span>
          <span v-if="nodeCount(data)" class="concept-hierarchy__count">{{ nodeCount(data) }}</span>
        </span>
      </template>
    </el-tree>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { CollectionTag, FolderOpened, Search } from "@element-plus/icons-vue";
import type { OntologyConceptNode } from "@/types";
import { filterConceptTree } from "../utils/objectWorkspace";

const props = defineProps<{
  tree: OntologyConceptNode[];
  selectedNodeId: string;
}>();

const emit = defineEmits<{ select: [node: OntologyConceptNode] }>();
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

.concept-hierarchy__tree {
  min-height: 0;
  padding-right: 4px;
  flex: 1;
  overflow: auto;
  color: var(--aircas-color-text-secondary);
  background: var(--aircas-color-transparent);
}

.concept-hierarchy__tree :deep(.el-tree-node__content) {
  min-width: max-content;
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
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.concept-hierarchy__node > .el-icon {
  color: var(--aircas-color-text-muted);
}

.concept-hierarchy__label {
  max-width: 210px;
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
