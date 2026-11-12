<template>
  <el-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="min(1100px, 94vw)"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p v-if="loading" role="status">正在加载调用日志…</p>
    <div v-else-if="error" role="alert">{{ error }} <el-button @click="emit('retry')">重试</el-button></div>
    <el-table v-else :data="tableLogs" height="360" stripe>
      <el-table-column type="expand">
        <template #default="{ row }">
          <div class="behavior-schedule-invocation-log-dialog__detail">
            <h4>请求参数</h4>
            <pre>{{ row.requestParam || "—" }}</pre>
            <h4>执行结果</h4>
            <pre>{{ row.executeResult || "—" }}</pre>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="triggerTime" label="触发时间" min-width="210" show-overflow-tooltip>
        <template #default="{ row }">{{ row.triggerTime || "—" }}</template>
      </el-table-column>
      <el-table-column prop="completeTime" label="完成时间" min-width="210" show-overflow-tooltip>
        <template #default="{ row }">{{ row.completeTime || "—" }}</template>
      </el-table-column>
      <el-table-column label="执行状态" width="110">
        <template #default="{ row }">
          <el-tag size="small" :type="row.taskStatus === 'COMPLETED' ? 'success' : row.taskStatus === 'FAILED' ? 'danger' : 'warning'">
            {{ row.taskStatus === "COMPLETED" ? "成功" : row.taskStatus === "FAILED" ? "失败" : row.taskStatus === "PENDING" ? "待执行" : "未知状态" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="msg" label="日志消息" min-width="220" show-overflow-tooltip>
        <template #default="{ row }">{{ row.msg || "—" }}</template>
      </el-table-column>
      <template #empty><el-empty description="暂无调用日志" :image-size="72" /></template>
    </el-table>
    <p class="behavior-schedule-invocation-log-dialog__hint">展开记录可查看请求参数和执行结果</p>
    <el-pagination
      class="behavior-schedule-invocation-log-dialog__pagination"
      background
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      :current-page="page"
      :page-size="pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :disabled="loading"
      @update:current-page="emit('change-page', $event)"
      @update:page-size="emit('change-page-size', $event)"
    />
    <template #footer><el-button :icon="Close" @click="emit('update:modelValue', false)">关闭</el-button></template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Close } from "@element-plus/icons-vue";
import type { BehaviorSchedulingResultRecord } from "@/types";

const props = defineProps<{
  modelValue: boolean;
  scheduleName: string;
  logs: readonly BehaviorSchedulingResultRecord[];
  loading: boolean;
  error: string;
  page: number;
  pageSize: number;
  total: number;
}>();
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  retry: [];
  "change-page": [value: number];
  "change-page-size": [value: number];
}>();
const dialogTitle = computed(() => (props.scheduleName ? `调用日志 · ${props.scheduleName}` : "调用日志"));
const tableLogs = computed(() => [...props.logs]);
</script>

<style scoped lang="scss">
.behavior-schedule-invocation-log-dialog__detail {
  padding: 12px 20px;
}
.behavior-schedule-invocation-log-dialog__detail pre {
  max-height: 240px;
  margin: 8px 0;
  overflow: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: var(--aircas-color-text-primary);
}
.behavior-schedule-invocation-log-dialog__hint {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.behavior-schedule-invocation-log-dialog__pagination {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
