<template>
  <el-drawer
    :model-value="modelValue"
    class="behavior-detail-drawer"
    :title="behavior?.displayName || '行为详情'"
    size="680px"
    append-to-body
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="behavior">
      <header class="behavior-detail-drawer__header">
        <p class="behavior-detail-drawer__description" :title="behavior.description || '暂无描述'">{{ behavior.description || "暂无描述" }}</p>
        <div class="behavior-detail-drawer__tags">
          <el-tag size="small" :type="statusTagType(behavior.status)">{{ SPACE_BEHAVIOR_STATUS_LABELS[behavior.status] }}</el-tag>
        </div>
        <div class="behavior-detail-drawer__meta-line">
          <span
            >对象 {{ behavior.objectName || "未关联对象" }} · 基础算子 {{ behavior.functionOperatorName || "未绑定" }} ·
            {{ behavior.functionOperatorVersion }}</span
          >
          <span>更新于 {{ behavior.updatedAt }}</span>
        </div>
      </header>

      <el-descriptions class="behavior-detail-drawer__summary" :column="2" border size="small">
        <el-descriptions-item label="行为 ID">{{ behavior.id }}</el-descriptions-item>
        <el-descriptions-item label="执行范围">{{ behavior.singleObject ? "单对象" : "批量" }}</el-descriptions-item>
        <el-descriptions-item label="执行次数">{{ behavior.executionCount }}</el-descriptions-item>
        <el-descriptions-item label="成功率">{{ behavior.successRate }}</el-descriptions-item>
        <el-descriptions-item label="发布人">{{ behavior.publisher || "—" }}</el-descriptions-item>
        <el-descriptions-item label="发布时间">{{ behavior.publishedAt || "—" }}</el-descriptions-item>
      </el-descriptions>

      <section class="behavior-detail-drawer__section">
        <h4>输入参数</h4>
        <el-table v-if="inputRows.length" :data="inputRows" class="aircas-table--accent-header" size="small">
          <el-table-column label="参数" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">{{ asParameterRow(row).parameter.path || asParameterRow(row).parameter.name }}</template>
          </el-table-column>
          <el-table-column label="类型" width="90">
            <template #default="{ row }">{{ asParameterRow(row).parameter.type }}</template>
          </el-table-column>
          <el-table-column label="必填" width="70">
            <template #default="{ row }">{{ asParameterRow(row).parameter.required ? "是" : "否" }}</template>
          </el-table-column>
          <el-table-column label="描述" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">{{ asParameterRow(row).parameter.description }}</template>
          </el-table-column>
          <el-table-column label="输入来源 / 绑定" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">{{ asParameterRow(row).parameter.bindLabel || asParameterRow(row).parameter.sourceLabel || "—" }}</template>
          </el-table-column>
        </el-table>
        <p v-else class="behavior-detail-drawer__empty">暂无输入参数</p>
      </section>

      <section class="behavior-detail-drawer__section">
        <h4>输出参数</h4>
        <el-table v-if="outputRows.length" :data="outputRows" class="aircas-table--accent-header" size="small">
          <el-table-column label="参数" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">{{ asParameterRow(row).parameter.path || asParameterRow(row).parameter.name }}</template>
          </el-table-column>
          <el-table-column label="类型" width="90">
            <template #default="{ row }">{{ asParameterRow(row).parameter.type }}</template>
          </el-table-column>
          <el-table-column label="描述" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">{{ asParameterRow(row).parameter.description }}</template>
          </el-table-column>
          <el-table-column label="返回字段 → 写入目标" min-width="220" show-overflow-tooltip>
            <template #default="{ row }">{{ asParameterRow(row).parameter.bindLabel || asParameterRow(row).parameter.path || "—" }}</template>
          </el-table-column>
        </el-table>
        <p v-else class="behavior-detail-drawer__empty">暂无输出参数</p>
      </section>

      <section class="behavior-detail-drawer__section">
        <h4>变更信息</h4>
        <div class="behavior-detail-drawer__change">
          <span>变更说明：</span>
          <p>{{ behavior.changeNote || "暂无变更说明" }}</p>
        </div>
      </section>

      <section class="behavior-detail-drawer__section" aria-label="状态操作记录">
        <h4>状态操作记录</h4>
        <ul v-if="statusHistory.length" class="behavior-detail-drawer__logs">
          <li v-for="(item, index) in statusHistory" :key="`${behavior.id}-log-${index}`">
            <time v-if="item.time">{{ item.time }}</time>
            <p>{{ item.content }}</p>
          </li>
        </ul>
        <p v-else class="behavior-detail-drawer__empty">无</p>
      </section>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { SpaceBehaviorItem, SpaceBehaviorStatus } from "@/types";
import { SPACE_BEHAVIOR_STATUS_LABELS } from "@/types";
import { flattenSpaceBehaviorParameterRows, type SpaceBehaviorParameterRow } from "../utils/spaceBehaviorOperations";

const props = defineProps<{
  modelValue: boolean;
  behavior: SpaceBehaviorItem | null;
}>();
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();

const inputRows = computed(() => flattenSpaceBehaviorParameterRows(props.behavior?.inputParameters ?? []).filter((row) => !row.isGroup));
const outputRows = computed(() => flattenSpaceBehaviorParameterRows(props.behavior?.outputParameters ?? []).filter((row) => !row.isGroup));
const statusHistory = computed(() => (props.behavior?.statusLogs ?? []).map(parseBehaviorStatusLog).reverse());

/**
 * @description 将表格行收窄为参数展示行。
 * @param row 表格行。
 * @returns 参数展示行。
 */
function asParameterRow(row: unknown): SpaceBehaviorParameterRow {
  return row as SpaceBehaviorParameterRow;
}

/**
 * @description 解析 Mock 状态日志为时间与内容。
 * @param log 状态日志文本。
 * @returns 时间与内容。
 */
function parseBehaviorStatusLog(log: string): { time: string; content: string } {
  const matched = log.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2})\s*(.*)$/);
  if (!matched) return { time: "", content: log };
  return { time: matched[1] ?? "", content: matched[2] || log };
}

/**
 * @description 将行为状态映射为标签颜色。
 * @param status 行为状态。
 * @returns Element Plus 标签类型。
 */
function statusTagType(status: SpaceBehaviorStatus): "success" | "info" | "warning" {
  if (status === "published") return "success";
  if (status === "disabled") return "info";
  return "warning";
}
</script>

<style scoped lang="scss">
.behavior-detail-drawer__header {
  margin-bottom: 12px;
}
.behavior-detail-drawer__description {
  margin: 0 0 8px;
  overflow: hidden;
  color: var(--aircas-color-text-secondary);
  font-size: 14px;
  line-height: 1.6;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.behavior-detail-drawer__tags,
.behavior-detail-drawer__meta-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.behavior-detail-drawer__meta-line {
  margin-top: 8px;
}
.behavior-detail-drawer__summary {
  margin-top: 16px;
}
.behavior-detail-drawer__section {
  margin-top: 20px;
}
.behavior-detail-drawer__section h4 {
  margin: 0 0 10px;
  color: var(--aircas-color-text-primary);
  font-size: 14px;
}
.behavior-detail-drawer__empty {
  margin: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.behavior-detail-drawer__change {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 0;
  padding: 8px 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 4px;
  background: var(--aircas-color-panel-background-deep);
  font-size: 14px;
  line-height: 1.5;
}
.behavior-detail-drawer__change span {
  flex-shrink: 0;
  color: var(--aircas-color-text-secondary);
  white-space: nowrap;
}
.behavior-detail-drawer__change p {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: var(--aircas-color-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.behavior-detail-drawer__logs {
  margin: 0;
  padding: 0;
  list-style: none;
}
.behavior-detail-drawer__logs li {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 8px 0;
  line-height: 1.5;
}
.behavior-detail-drawer__logs time {
  flex-shrink: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  white-space: nowrap;
}
.behavior-detail-drawer__logs p {
  min-width: 0;
  margin: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
  overflow-wrap: anywhere;
}
</style>
