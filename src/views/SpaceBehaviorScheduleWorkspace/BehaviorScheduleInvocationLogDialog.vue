<template>
  <el-dialog
    :model-value="modelValue"
    class="aircas-dialog behavior-schedule-invocation-log-dialog"
    :title="dialogTitle"
    width="min(720px, 94vw)"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="behavior-schedule-invocation-log-dialog__table-wrap">
      <el-table :data="tableLogs" class="aircas-table aircas-table--flat behavior-schedule-invocation-log-dialog__table" height="280" stripe>
        <el-table-column prop="name" label="调用名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="invokedAt" label="调用时间" width="180" />
        <el-table-column label="调用状态" width="120">
          <template #default="{ row }">
            <el-tag class="aircas-tag" size="small" :type="readInvocationStatusTagType(readInvocationLogRow(row).status)">
              {{ readInvocationLogRow(row).status }}
            </el-tag>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无调用日志" :image-size="72" /></template>
      </el-table>
    </div>
    <template #footer>
      <el-button class="aircas-button aircas-button--tone-ghost" :icon="Close" @click="emit('update:modelValue', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Close } from "@element-plus/icons-vue";

import type { BehaviorScheduleInvocationLog, BehaviorScheduleInvocationStatus } from "@/types";

const props = defineProps<{
  modelValue: boolean;
  scheduleName: string;
  logs: readonly BehaviorScheduleInvocationLog[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const dialogTitle = computed(() => (props.scheduleName ? `调用日志 · ${props.scheduleName}` : "调用日志"));
const tableLogs = computed(() => [...props.logs]);

/**
 * @description 从表格行解析出当前调用日志。
 * @param row Element Plus 表格当前行。
 * @returns 当前弹窗中的日志记录。
 */
function readInvocationLogRow(row: unknown): BehaviorScheduleInvocationLog {
  if (row && typeof row === "object" && "id" in row && typeof row.id === "string") {
    const matched = props.logs.find((item) => item.id === row.id);
    if (matched) return matched;
  }
  throw new Error("无效的调用日志数据行。");
}

/**
 * @description 将调用状态映射为 Element Plus 标签类型。
 * @param status 调用状态。
 * @returns 成功、失败或执行中对应的标签类型。
 */
function readInvocationStatusTagType(status: BehaviorScheduleInvocationStatus): "success" | "danger" | "warning" {
  if (status === "成功") return "success";
  if (status === "失败") return "danger";
  return "warning";
}
</script>

<style scoped lang="scss">
.behavior-schedule-invocation-log-dialog__table-wrap {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-panel-background-deep);
}

.behavior-schedule-invocation-log-dialog__table {
  width: 100%;
}
</style>
