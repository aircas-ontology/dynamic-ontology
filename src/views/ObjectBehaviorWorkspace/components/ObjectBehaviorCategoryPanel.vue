<template>
  <aside class="object-behavior-category-panel">
    <header><h1>行为分类树</h1></header>
    <label class="object-behavior-category-panel__search"
      >搜索行为分类<el-input v-model="keyword" clearable placeholder="搜索行为分类">
        <template #prefix
          ><el-icon><Search /></el-icon
        ></template> </el-input
    ></label>
    <div class="object-behavior-category-panel__content">
      <el-tree
        v-if="treeData.length"
        ref="treeRef"
        :data="treeData"
        node-key="id"
        highlight-current
        :current-node-key="selectedNodeId || undefined"
        :expand-on-click-node="false"
        :filter-node-method="filterCategoryNode"
        @node-click="selectCategoryNode"
      >
        <template #default="{ data }">
          <div class="object-behavior-category-panel__node">
            <span :title="data.label"
              ><el-icon><FolderOpened /></el-icon>{{ data.label }} <em>{{ data.count }}</em></span
            >
            <span class="object-behavior-category-panel__actions" @click.stop>
              <el-tooltip content="添加子分类"
                ><button type="button" aria-label="添加子分类" @click="emit('create', data.id)">
                  <el-icon><Plus /></el-icon></button
              ></el-tooltip>
              <template v-if="!isRoot(data.id)">
                <el-tooltip content="编辑分类"
                  ><button type="button" aria-label="编辑分类" @click="emit('edit', data.id)">
                    <el-icon><EditPen /></el-icon></button
                ></el-tooltip>
                <el-tooltip content="删除分类"
                  ><button type="button" aria-label="删除分类" @click="emit('delete', data.id)">
                    <el-icon><Delete /></el-icon></button
                ></el-tooltip>
              </template>
            </span>
          </div>
        </template>
      </el-tree>
      <el-empty v-else description="暂无行为分类"><el-button @click="emit('create', '')">添加行为分类</el-button></el-empty>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { Delete, EditPen, FolderOpened, Plus, Search } from "@element-plus/icons-vue";
import type { TreeInstance, TreeNodeData } from "element-plus";
import type { SpaceBehaviorCategoryNode } from "@/types";
import { ROOT_SPACE_BEHAVIOR_CATEGORY_ID } from "@/types";

const props = defineProps<{ treeData: SpaceBehaviorCategoryNode[]; selectedNodeId: string }>();
const emit = defineEmits<{ "select-node": [id: string]; create: [parentId: string]; edit: [id: string]; delete: [id: string] }>();
const keyword = ref("");
const treeRef = ref<TreeInstance>();

/** @description 判断分类是否为根分类。 @param id 分类标识。 @returns 是否为根节点。 */
function isRoot(id: string): boolean {
  return id === ROOT_SPACE_BEHAVIOR_CATEGORY_ID || id === props.treeData[0]?.id;
}
/** @description 筛选分类树节点。 @param value 搜索词。 @param data 分类节点。 @returns 是否保留节点。 */
function filterCategoryNode(value: string, data: TreeNodeData): boolean {
  const label = typeof data.label === "string" ? data.label : "";
  return !value || label.toLocaleLowerCase().includes(value.toLocaleLowerCase());
}
/** @description 选择分类节点。 @param data 分类节点。 */
function selectCategoryNode(data: SpaceBehaviorCategoryNode): void {
  emit("select-node", data.id);
}
watch(keyword, (value) => treeRef.value?.filter(value));
watch(
  () => props.selectedNodeId,
  async (value) => {
    await nextTick();
    treeRef.value?.setCurrentKey(value);
  },
);
</script>

<style scoped lang="scss">
.object-behavior-category-panel {
  display: flex;
  min-height: 0;
  padding: 12px;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
  box-shadow: inset 0 0 20px var(--aircas-color-effect-page-glow);
  flex-direction: column;
  gap: 8px;
}
.object-behavior-category-panel h1 {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
}
.object-behavior-category-panel__content {
  min-height: 0;
  overflow: auto;
  flex: 1;
}
.object-behavior-category-panel__node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
}
.object-behavior-category-panel__node > span:first-child {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  gap: 6px;
  overflow: hidden;
  color: var(--aircas-color-text-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.object-behavior-category-panel em {
  padding: 0 6px;
  border: 1px solid var(--aircas-color-border-light);
  border-radius: 10px;
  color: var(--aircas-color-text-secondary);
  font-size: 11px;
  font-style: normal;
}
.object-behavior-category-panel__actions {
  display: inline-flex;
  gap: 2px;
  opacity: 0;
}
.object-behavior-category-panel :deep(.el-tree-node__content:hover) .object-behavior-category-panel__actions {
  opacity: 1;
}
.object-behavior-category-panel button {
  display: grid;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 1px solid var(--aircas-color-border);
  border-radius: 4px;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-panel-background);
  cursor: pointer;
  place-items: center;
}
</style>
