<template>
  <div class="subspace-create-instance-panel">
    <section
      v-for="group in instanceGroups"
      :key="group.objectId"
      :class="['subspace-create-instance-panel__group', canFillInstanceGroup(group) ? 'is-filled' : 'is-compact']"
    >
      <header class="subspace-create-instance-panel__header">
        <strong>{{ group.objectLabel }}</strong
        ><span>{{ countSelectedGroupInstances(group) }} / {{ group.total }} 个实例</span>
      </header>
      <div v-if="group.status === 'loading'" class="subspace-create-instance-panel__state">正在加载实例…</div>
      <div v-else-if="group.status === 'error'" class="subspace-create-instance-panel__state" role="alert">
        <span>{{ group.error }}</span
        ><el-button class="aircas-button" size="small" @click="emit('retry', group.objectId)">重试</el-button>
      </div>
      <div v-else-if="group.status === 'empty'" class="subspace-create-instance-panel__state">暂无实例</div>
      <el-table v-else class="aircas-table aircas-table--flat subspace-create-instance-panel__table" :data="group.instances" row-key="id" stripe height="100%">
        <el-table-column width="48">
          <template #header
            ><el-checkbox
              class="aircas-checkbox"
              :model-value="isGroupAllSelected(group)"
              :indeterminate="isGroupPartiallySelected(group)"
              @change="toggleGroupInstances(group, $event)"
          /></template>
          <template #default="{ row }"
            ><el-checkbox class="aircas-checkbox" :model-value="isInstanceSelected(row)" @change="toggleInstance(row, $event)"
          /></template>
        </el-table-column>
        <el-table-column prop="name" label="实例名称" min-width="240" show-overflow-tooltip />
      </el-table>
      <el-pagination
        v-if="group.total"
        background
        :current-page="group.page"
        :page-size="group.pageSize"
        class="aircas-pagination subspace-create-instance-panel__pagination"
        popper-class="aircas-pagination-popper"
        layout="total, sizes, prev, pager, next"
        :total="group.total"
        :page-sizes="[10, 20, 50]"
        @current-change="emit('page-change', group.objectId, $event)"
        @size-change="emit('page-size-change', group.objectId, $event)"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import type { CheckboxValueType } from "element-plus";
import type { SubspaceCreateInstanceGroup, SubspaceCreateSelectedInstance } from "../utils/mapSubspaceCreateSelectedInstance";
import { selectAllSubspaceCreateInstances, toggleSubspaceCreateInstanceSelection } from "../utils/mapSubspaceCreateSelectedInstance";

const props = defineProps<{ instanceGroups: SubspaceCreateInstanceGroup[]; selectedInstanceIds: string[] }>();
const emit = defineEmits<{
  "update:selectedInstanceIds": [value: string[]];
  "page-change": [objectId: string, page: number];
  "page-size-change": [objectId: string, pageSize: number];
  retry: [objectId: string];
}>();

/**
 * @description 判断对象分组是否应撑满剩余高度。
 * @param group 对象实例分组。
 * @returns 是否为可撑满的分组。
 */
function canFillInstanceGroup(group: SubspaceCreateInstanceGroup) {
  return group.status === "success" && group.instances.length > 0;
}

/** @description 统计对象当前已选实例数量。 */
function countSelectedGroupInstances(group: SubspaceCreateInstanceGroup) {
  return group.instances.filter((item) => props.selectedInstanceIds.includes(item.id)).length;
}
/** @description 判断对象实例是否全部选中。 */
function isGroupAllSelected(group: SubspaceCreateInstanceGroup) {
  return group.instances.length > 0 && countSelectedGroupInstances(group) === group.instances.length;
}
/** @description 判断对象实例是否部分选中。 */
function isGroupPartiallySelected(group: SubspaceCreateInstanceGroup) {
  const count = countSelectedGroupInstances(group);
  return count > 0 && count < group.instances.length;
}
/** @description 切换对象当前页实例的全选状态。 */
function toggleGroupInstances(group: SubspaceCreateInstanceGroup, checked: CheckboxValueType) {
  emit("update:selectedInstanceIds", selectAllSubspaceCreateInstances(props.selectedInstanceIds, group.instances, checked === true));
}
/** @description 从表格行读取实例。 */
function readInstanceRow(row: unknown): SubspaceCreateSelectedInstance | null {
  if (!row || typeof row !== "object" || !("id" in row) || typeof row.id !== "string") return null;
  return props.instanceGroups.flatMap((group) => group.instances).find((item) => item.id === row.id) ?? null;
}
/** @description 判断实例是否已选中。 */
function isInstanceSelected(row: unknown) {
  const instance = readInstanceRow(row);
  return Boolean(instance && props.selectedInstanceIds.includes(instance.id));
}
/** @description 切换单个实例选择状态。 */
function toggleInstance(row: unknown, checked: CheckboxValueType) {
  const instance = readInstanceRow(row);
  if (instance) emit("update:selectedInstanceIds", toggleSubspaceCreateInstanceSelection(props.selectedInstanceIds, instance.id, checked === true));
}
</script>

<style scoped lang="scss">
.subspace-create-instance-panel {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
  overflow: auto;
}
.subspace-create-instance-panel__group {
  display: flex;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 8px;
}
.subspace-create-instance-panel__group.is-filled {
  flex: 1 1 auto;
}
.subspace-create-instance-panel__group.is-compact {
  flex: 0 0 auto;
}
.subspace-create-instance-panel__header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--aircas-color-card-background-active);
}
.subspace-create-instance-panel__header strong {
  color: var(--aircas-color-text-primary);
  font-size: 14px;
}
.subspace-create-instance-panel__header span {
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}
.subspace-create-instance-panel__table {
  width: 100%;
  min-height: 0;
  flex: 1;
}
.subspace-create-instance-panel__state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 100px;
  color: var(--aircas-color-text-muted);
}
.subspace-create-instance-panel__pagination {
  flex-shrink: 0;
  justify-content: flex-end;
  padding: 8px 12px;
}
</style>
