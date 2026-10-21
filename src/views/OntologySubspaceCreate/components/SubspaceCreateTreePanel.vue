<template>
  <aside class="subspace-create-tree-panel" aria-label="分类体系树">
    <header class="subspace-create-tree-panel__header">
      <h2>分类体系树</h2>
      <span>已选 {{ selectedCount }} 个</span>
    </header>
    <el-input v-model="keyword" class="aircas-input subspace-create-tree-panel__search" clearable placeholder="搜索对象" />
    <div v-if="status === 'loading'" class="subspace-create-tree-panel__state" role="status">正在加载分类体系树…</div>
    <div v-else-if="status === 'error'" class="subspace-create-tree-panel__state" role="alert">
      <span>{{ error }}</span>
      <el-button class="aircas-button" @click="load">重试</el-button>
    </div>
    <el-empty v-else-if="status === 'empty'" description="暂无分类体系树" :image-size="72" />
    <el-tree
      v-else
      ref="treeRef"
      data-onboarding="subspace-create-tree"
      class="aircas-tree subspace-create-tree-panel__tree"
      node-key="id"
      show-checkbox
      highlight-current
      default-expand-all
      :data="treeData"
      :props="treeProps"
      :filter-node-method="filterTreeNode"
      @check="syncSelectedTreeObjects"
    >
      <template #default="{ node, data }">
        <span class="subspace-create-tree-panel__node">
          <el-icon v-if="data.kind === 'category'" class="subspace-create-tree-panel__node-icon"><Folder /></el-icon>
          <span class="subspace-create-tree-panel__node-label" :title="node.label">{{ node.label }}</span>
        </span>
      </template>
    </el-tree>
  </aside>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { Folder } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import type { TreeInstance, TreeNodeData } from "element-plus";
import type { OntologyConceptNode, OntologyObjectWorkspace } from "@/types";
import { useOntologyObjectWorkspace } from "@/views/ObjectWorkspacePanel/composables/useOntologyObjectWorkspace";
import { mapSubspaceCreateSelectedObjects } from "../utils/mapSubspaceCreateSelectedObject";
import type { SubspaceCreateSelectedObject } from "../utils/mapSubspaceCreateSelectedObject";

interface SubspaceCreateTreeNode {
  id: string;
  label: string;
  kind: "category" | "object";
  apiName?: string;
  children?: SubspaceCreateTreeNode[];
}

const props = defineProps<{ currentStepIndex: number }>();
const emit = defineEmits<{
  "update:selectedCount": [value: number];
  "update:selectedObjects": [value: SubspaceCreateSelectedObject[]];
}>();

const route = useRoute();
const spaceId = computed(() => String(route.params.spaceId || route.query.spaceId || ""));
const { status, error, workspace, load } = useOntologyObjectWorkspace(spaceId);
const treeRef = ref<TreeInstance>();
const keyword = ref("");
const selectedIds = ref<string[]>([]);
const treeProps = { children: "children", label: "label" };
const treeData = computed(() => mapOntologyTreeToSubspaceNodes(workspace.value));
const selectedCount = computed(() => selectedIds.value.length);

/** @description 将对象空间分类树转换为子空间页面复选树节点。 @param value 对象工作区。 @returns 子空间树节点。 */
function mapOntologyTreeToSubspaceNodes(value: OntologyObjectWorkspace | undefined): SubspaceCreateTreeNode[] {
  const apiNameByObjectId = new Map((value?.sections ?? []).flatMap((section) => section.items.map((item) => [item.id, item.apiName] as const)));
  return (value?.tree ?? []).flatMap((node) => mapOntologyNode(node, apiNameByObjectId));
}

/** @description 递归映射分类节点，并将分类下的对象转换为可勾选叶子。 @param node 对象分类节点。 @returns 子空间树节点。 */
function mapOntologyNode(node: OntologyConceptNode, apiNameByObjectId: Map<string, string>): SubspaceCreateTreeNode[] {
  const categories = node.children.flatMap((child) => mapOntologyNode(child, apiNameByObjectId));
  const objects = (node.objects ?? []).map((object) => ({
    id: object.uniqueIdentifier,
    label: object.displayName,
    kind: "object" as const,
    apiName: apiNameByObjectId.get(object.uniqueIdentifier) ?? object.uniqueIdentifier,
  }));
  return [{ id: node.id, label: node.label, kind: "category", children: [...categories, ...objects] }];
}

/**
 * @description 根据关键字过滤分类树节点。
 * @param value 当前搜索关键字。
 * @param data 当前树节点。
 * @returns 是否保留该节点。
 */
function filterTreeNode(value: string, data: TreeNodeData) {
  const label = typeof data.label === "string" ? data.label : "";
  return !value || label.includes(value.trim());
}

/**
 * @description 同步分类树勾选的叶子对象并通知父级；非对象选择步骤时恢复原勾选并提示。
 */
async function syncSelectedTreeObjects() {
  if (props.currentStepIndex !== 0) {
    ElMessage.warning("请回到对象选择步骤再更改");
    await nextTick();
    treeRef.value?.setCheckedKeys(selectedIds.value);
    return;
  }
  const checkedNodes = treeRef.value?.getCheckedNodes(true) ?? [];
  const objects = mapSubspaceCreateSelectedObjects(checkedNodes);
  selectedIds.value = objects.map((item) => item.id);
  emit("update:selectedObjects", objects);
  emit("update:selectedCount", objects.length);
}

watch(keyword, (value) => treeRef.value?.filter(value));
</script>

<style scoped lang="scss">
.subspace-create-tree-panel {
  display: flex;
  min-width: 0;
  min-height: 0;
  height: 100%;
  flex-direction: column;
  padding: 12px;
  overflow: hidden;
  border: 1px solid var(--aircas-color-accent-cyan-border);
  border-radius: 8px;
  background:
    radial-gradient(circle at 12% 0, var(--aircas-color-accent-cyan-soft), var(--aircas-color-transparent) 42%),
    linear-gradient(135deg, var(--aircas-color-overlay), var(--aircas-color-overlay-deep));
  box-shadow:
    inset 0 0 20px var(--aircas-color-page-glow),
    0 0 18px var(--aircas-color-accent-blue-soft);
}

:root:not(.dark) .subspace-create-tree-panel {
  background:
    radial-gradient(circle at 12% 0, var(--aircas-color-accent-cyan-soft), var(--aircas-color-transparent) 42%),
    linear-gradient(135deg, var(--aircas-color-card-background), var(--aircas-color-panel-background-deep));
}

.subspace-create-tree-panel__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.subspace-create-tree-panel__header h2 {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  font-weight: 600;
}

.subspace-create-tree-panel__header span {
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}

.subspace-create-tree-panel__search {
  flex-shrink: 0;
  margin-bottom: 8px;
}

.subspace-create-tree-panel__tree {
  min-height: 0;
  flex: 1;
  overflow: auto;
  padding-right: 4px;
  background: var(--aircas-color-transparent);
  --el-tree-text-color: var(--aircas-color-text-secondary);
  --el-tree-expand-icon-color: var(--aircas-color-text-muted);
  --el-checkbox-bg-color: var(--aircas-color-input-background);
  --el-checkbox-input-border: var(--aircas-color-border);
  --el-checkbox-checked-bg-color: var(--aircas-color-accent-cyan);
  --el-checkbox-checked-input-border-color: var(--aircas-color-accent-cyan);
  --el-checkbox-checked-icon-color: var(--aircas-color-page-background);
}

.subspace-create-tree-panel__tree :deep(.el-tree-node__content) {
  height: 32px;
  color: var(--aircas-color-text-secondary);
}

.subspace-create-tree-panel__node {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.subspace-create-tree-panel__node-icon {
  flex: 0 0 auto;
  color: var(--aircas-color-accent-cyan);
}

.subspace-create-tree-panel__node-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.subspace-create-tree-panel__tree :deep(.el-tree-node__label) {
  overflow: hidden;
  color: var(--aircas-color-text-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.subspace-create-tree-panel__tree :deep(.el-tree-node__expand-icon) {
  color: var(--aircas-color-text-muted);
}

.subspace-create-tree-panel__tree :deep(.el-tree-node__content:hover),
.subspace-create-tree-panel__tree :deep(.el-tree-node:focus > .el-tree-node__content) {
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-hover-background);
}

.subspace-create-tree-panel__tree :deep(.el-tree-node__content:hover .el-tree-node__label) {
  color: var(--aircas-color-text-primary);
}

.subspace-create-tree-panel__tree :deep(.el-tree-node.is-checked > .el-tree-node__content),
.subspace-create-tree-panel__tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  color: var(--aircas-color-title);
  background: var(--aircas-color-accent-cyan-fill);
}

.subspace-create-tree-panel__tree :deep(.el-tree-node.is-checked > .el-tree-node__content .el-tree-node__label),
.subspace-create-tree-panel__tree :deep(.el-tree-node.is-current > .el-tree-node__content .el-tree-node__label) {
  color: var(--aircas-color-title);
}

.subspace-create-tree-panel__tree :deep(.el-tree-node.is-checked > .el-tree-node__content:hover),
.subspace-create-tree-panel__tree :deep(.el-tree-node.is-current > .el-tree-node__content:hover) {
  color: var(--aircas-color-title);
  background: var(--aircas-color-accent-cyan-soft);
}

.subspace-create-tree-panel__tree :deep(.el-checkbox__inner:hover) {
  border-color: var(--aircas-color-border-highlight);
}

.subspace-create-tree-panel__tree :deep(.el-checkbox__input.is-checked .el-checkbox__inner),
.subspace-create-tree-panel__tree :deep(.el-checkbox__input.is-indeterminate .el-checkbox__inner) {
  background-color: var(--aircas-color-accent-cyan);
  border-color: var(--aircas-color-accent-cyan);
}

.subspace-create-tree-panel__tree :deep(.el-checkbox__input.is-checked .el-checkbox__inner::after) {
  border-color: var(--aircas-color-page-background);
}

.subspace-create-tree-panel__tree :deep(.el-checkbox__input.is-indeterminate .el-checkbox__inner::before) {
  background-color: var(--aircas-color-page-background);
}

.subspace-create-tree-panel__tree :deep(.el-checkbox__input.is-focus .el-checkbox__inner) {
  border-color: var(--aircas-color-border-highlight);
}
</style>
