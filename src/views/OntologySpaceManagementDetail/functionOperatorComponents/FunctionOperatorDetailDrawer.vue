<template>
  <el-drawer
    :model-value="modelValue"
    class="function-operator-detail"
    :title="operator?.name || '函数算子详情'"
    size="520px"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="operator">
      <div class="function-operator-detail__header">
        <div class="function-operator-detail__tags">
          <el-tag :type="statusTagType(operator.status)" effect="dark">{{ statusLabel(operator.status) }}</el-tag>
          <el-tag effect="plain">{{ typeLabel(operator.type) }}</el-tag>
        </div>
        <span class="function-operator-detail__version">{{ operator.version }}</span>
      </div>
      <p class="function-operator-detail__description">{{ operator.description || "暂无说明" }}</p>

      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="协议">{{ operator.protocol }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ operator.createdBy }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ operator.updatedAt }}</el-descriptions-item>
        <el-descriptions-item label="超时">{{ operator.timeout }} ms</el-descriptions-item>
        <el-descriptions-item label="测试状态">
          <el-tag size="small" :type="operator.testStatus === 'passed' ? 'success' : operator.testStatus === 'failed' ? 'danger' : 'info'">
            {{ operator.testStatus === "passed" ? "已通过" : operator.testStatus === "failed" ? "未通过" : "未测试" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="最近测试">{{ operator.testedAt || "—" }}</el-descriptions-item>
      </el-descriptions>

      <div class="function-operator-detail__section">
        <h4>输入参数</h4>
        <el-table :data="operator.inputParameters" class="aircas-table aircas-table--flat" size="small">
          <el-table-column prop="name" label="名称" min-width="100" />
          <el-table-column prop="type" label="类型" width="90" />
          <el-table-column label="必填" width="70">
            <template #default="{ row }">{{ row.required ? "是" : "否" }}</template>
          </el-table-column>
          <el-table-column prop="description" label="说明" min-width="120" show-overflow-tooltip />
        </el-table>
      </div>
      <div class="function-operator-detail__section">
        <h4>输出参数</h4>
        <el-table :data="operator.outputParameters" class="aircas-table aircas-table--flat" size="small">
          <el-table-column prop="name" label="名称" min-width="100" />
          <el-table-column prop="type" label="类型" width="90" />
          <el-table-column label="必填" width="70">
            <template #default="{ row }">{{ row.required ? "是" : "否" }}</template>
          </el-table-column>
          <el-table-column prop="description" label="说明" min-width="120" show-overflow-tooltip />
        </el-table>
      </div>

      <div v-if="operator.definition.kind === 'basic'" class="function-operator-detail__section">
        <h4>参数配置</h4>
        <pre class="function-operator-detail__config">{{ operator.definition.parameterConfig }}</pre>
      </div>
    </template>

    <template #footer>
      <div class="function-operator-detail__footer">
        <el-button class="aircas-button" @click="emit('test')">测试</el-button>
        <el-button class="aircas-button" @click="emit('edit')">编辑</el-button>
        <el-button class="aircas-button" type="primary" @click="emit('publish')">
          {{ operator?.status === "published" ? "下线" : "发布" }}
        </el-button>
        <el-button class="aircas-button" type="danger" plain @click="emit('delete')">删除</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import type { TagProps } from "element-plus";

import type { FunctionOperator, FunctionOperatorStatus, FunctionOperatorType } from "@/types";
import { FUNCTION_OPERATOR_STATUS_LABELS, FUNCTION_OPERATOR_TYPE_LABELS } from "@/types";

defineProps<{
  modelValue: boolean;
  operator: FunctionOperator | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  test: [];
  edit: [];
  publish: [];
  delete: [];
}>();

/**
 * @description 获取函数类型展示文案。
 * @param type 函数类型。
 * @returns 中文标签。
 */
function typeLabel(type: FunctionOperatorType): string {
  return FUNCTION_OPERATOR_TYPE_LABELS[type];
}

/**
 * @description 获取状态展示文案。
 * @param status 状态。
 * @returns 中文标签。
 */
function statusLabel(status: FunctionOperatorStatus): string {
  return FUNCTION_OPERATOR_STATUS_LABELS[status];
}

/**
 * @description 映射状态到 Element Plus Tag 类型。
 * @param status 状态。
 * @returns Tag type。
 */
function statusTagType(status: FunctionOperatorStatus): TagProps["type"] {
  if (status === "published") return "success";
  if (status === "testing") return "warning";
  if (status === "disabled") return "info";
  return undefined;
}
</script>

<style scoped lang="scss">
.function-operator-detail__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.function-operator-detail__tags {
  display: flex;
  gap: 8px;
}

.function-operator-detail__version {
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
}

.function-operator-detail__description {
  margin: 0 0 12px;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
}

.function-operator-detail__section {
  margin-top: 16px;
}

.function-operator-detail__section h4 {
  margin: 0 0 8px;
  color: var(--aircas-color-text-primary);
  font-size: 14px;
}

.function-operator-detail__config {
  margin: 0;
  max-height: 240px;
  overflow: auto;
  padding: 8px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 4px;
  background: var(--aircas-color-panel-background-deep);
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

.function-operator-detail__footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}
</style>
