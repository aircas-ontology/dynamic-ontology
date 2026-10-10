<template>
  <aside class="subspace-create-tree-panel" aria-label="分类体系树">
    <header class="subspace-create-tree-panel__header">
      <h2>分类体系树</h2>
      <span>已选 {{ selectedCount }} 个</span>
    </header>
    <el-input v-model="keyword" class="subspace-create-tree-panel__search" clearable placeholder="搜索本体对象" ariaLabel="搜索本体对象" />
    <el-tree
      ref="treeRef"
      class="subspace-create-tree-panel__tree"
      node-key="id"
      show-checkbox
      highlight-current
      default-expand-all
      :data="treeData"
      :props="treeProps"
      :filter-node-method="filterTreeNode"
      @check="syncSelectedTreeObjects"
    />
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { TreeInstance, TreeNodeData } from "element-plus";
import { mapSubspaceCreateSelectedObjects } from "../utils/mapSubspaceCreateSelectedObject";
import type { SubspaceCreateSelectedObject } from "../utils/mapSubspaceCreateSelectedObject";

interface SubspaceCreateTreeNode {
  id: string;
  label: string;
  apiName?: string;
  children?: SubspaceCreateTreeNode[];
}

const emit = defineEmits<{
  "update:selectedCount": [value: number];
  "update:selectedObjects": [value: SubspaceCreateSelectedObject[]];
}>();

const treeRef = ref<TreeInstance>();
const keyword = ref("");
const selectedIds = ref<string[]>([]);
const treeProps = { children: "children", label: "label" };
const treeData: SubspaceCreateTreeNode[] = [
  {
    id: "overview",
    label: "本体空间总览",
    children: [
      {
        id: "ship",
        label: "舰船",
        children: [
          {
            id: "carrier",
            label: "航空母舰",
            children: [
              { id: "ford", label: "福特级航空母舰(CVN)", apiName: "carrier_ford" },
              { id: "nimitz", label: "尼米兹级航空母舰(CVN)", apiName: "carrier_nimitz" },
            ],
          },
          {
            id: "destroyer",
            label: "驱逐舰",
            children: [
              { id: "burke", label: "阿利·伯克级驱逐舰(DDG)", apiName: "destroyer_burke" },
              { id: "flight1", label: "阿利伯克级Flight-I驱逐舰(DDG)", apiName: "destroyer_flight1" },
              { id: "flight2", label: "阿利伯克级Flight-II驱逐舰(DDG)", apiName: "destroyer_flight2" },
              { id: "flight2a", label: "阿利伯克级Flight-IIA驱逐舰(DDG)", apiName: "destroyer_flight2a" },
              { id: "flight3", label: "阿利伯克级Flight-III驱逐舰(DDG)", apiName: "destroyer_flight3" },
              { id: "zumwalt", label: "朱姆沃尔特级驱逐舰(DDG)", apiName: "destroyer_zumwalt" },
            ],
          },
          { id: "cruiser", label: "巡洋舰", children: [{ id: "ticonderoga", label: "提康德罗加级巡洋舰(CG)", apiName: "cruiser_ticonderoga" }] },
          { id: "frigate", label: "护卫舰", children: [{ id: "constellation", label: "星座级护卫舰(FFG)", apiName: "frigate_constellation" }] },
          {
            id: "submarine",
            label: "潜艇",
            children: [
              { id: "ohio", label: "俄亥俄级弹道导弹核潜艇(SSBN)", apiName: "submarine_ohio" },
              { id: "virginia", label: "弗吉尼亚级攻击型核潜艇", apiName: "submarine_virginia" },
            ],
          },
        ],
      },
    ],
  },
];
const selectedCount = computed(() => selectedIds.value.length);

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
 * @description 同步分类树勾选的叶子对象并通知父级。
 */
function syncSelectedTreeObjects() {
  const objects = mapSubspaceCreateSelectedObjects(treeRef.value?.getCheckedNodes(true) ?? []);
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
  border: 1px solid var(--aircas-color-effect-primary-border);
  border-radius: 8px;
  background:
    radial-gradient(circle at 12% 0, var(--aircas-color-effect-primary-soft), transparent 42%),
    linear-gradient(135deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
  box-shadow:
    inset 0 0 20px var(--aircas-color-effect-page-glow),
    0 0 18px var(--aircas-color-effect-blue-soft);
}

:root:not(.dark) .subspace-create-tree-panel {
  background:
    radial-gradient(circle at 12% 0, var(--aircas-color-effect-primary-soft), transparent 42%),
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
  color: var(--aircas-color-text-secondary);
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
  background: transparent;
}

.subspace-create-tree-panel__tree :deep(.el-tree-node__content) {
  height: 32px;
}

.subspace-create-tree-panel__tree :deep(.el-tree-node__label) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
