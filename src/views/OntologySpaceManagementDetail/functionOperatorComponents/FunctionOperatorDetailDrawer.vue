<template>
  <el-drawer
    :model-value="modelValue"
    class="aircas-drawer function-operator-detail"
    :title="operator?.name || '函数算子详情'"
    size="520px"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="loading" class="function-operator-detail__state" role="status"><AircasLoading>正在加载函数详情...</AircasLoading></div>
    <template v-else-if="operator">
      <div class="function-operator-detail__header">
        <div class="function-operator-detail__tags">
          <el-tag v-if="operator.status" class="aircas-tag" :type="statusTagType(operator.status)" effect="dark">{{ statusLabel(operator.status) }}</el-tag>
          <el-tag v-if="typeLabel(operator)" class="aircas-tag" effect="plain">{{ typeLabel(operator) }}</el-tag>
        </div>
        <span v-if="operator.version" class="function-operator-detail__version">{{ operator.version }}</span>
      </div>
      <p v-if="operator.description" class="function-operator-detail__description">{{ operator.description }}</p>

      <el-descriptions v-if="hasMetaItems" class="aircas-descriptions function-operator-detail__meta" :column="2" border size="small">
        <el-descriptions-item v-if="operator.protocol" label="协议">{{ operator.protocol }}</el-descriptions-item>
        <el-descriptions-item v-if="operator.createdBy" label="创建人">{{ operator.createdBy }}</el-descriptions-item>
        <el-descriptions-item v-if="operator.updatedAt" label="更新时间">{{ operator.updatedAt }}</el-descriptions-item>
        <el-descriptions-item v-if="operator.timeout > 0" label="超时">{{ operator.timeout }} ms</el-descriptions-item>
        <el-descriptions-item v-if="operator.testStatus && operator.testStatus !== 'untested'" label="测试状态">
          <el-tag class="aircas-tag" size="small" :type="operator.testStatus === 'passed' ? 'success' : 'danger'">
            {{ operator.testStatus === "passed" ? "已通过" : "未通过" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="operator.testedAt" label="最近测试">{{ operator.testedAt }}</el-descriptions-item>
        <el-descriptions-item v-if="operator.functionApi" label="函数 API">{{ operator.functionApi }}</el-descriptions-item>
      </el-descriptions>

      <div class="function-operator-detail__section">
        <h4>输入参数</h4>
        <el-table :data="operator.inputParameters" class="aircas-table aircas-table--flat" size="small">
          <el-table-column prop="name" label="名称" min-width="100" />
          <el-table-column prop="type" label="类型" width="90" />
          <el-table-column prop="description" label="说明" min-width="120" show-overflow-tooltip />
        </el-table>
      </div>
      <div v-if="showOutputParameters" class="function-operator-detail__section">
        <h4>输出参数</h4>
        <el-table :data="operator.outputParameters" class="aircas-table aircas-table--flat" size="small">
          <el-table-column prop="name" label="名称" min-width="100" />
          <el-table-column prop="type" label="类型" width="90" />
          <el-table-column prop="description" label="说明" min-width="120" show-overflow-tooltip />
        </el-table>
      </div>

      <div v-if="operator.definition.kind === 'basic' && operator.definition.parameterConfig.trim()" class="function-operator-detail__section">
        <h4>参数配置</h4>
        <pre class="function-operator-detail__config">{{ operator.definition.parameterConfig }}</pre>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TagProps } from "element-plus";

import AircasLoading from "@/components/AircasLoading.vue";
import type { FunctionOperator, FunctionOperatorStatus } from "@/types";
import { FUNCTION_OPERATOR_STATUS_LABELS, FUNCTION_OPERATOR_TYPE_LABELS } from "@/types";

const props = defineProps<{
  modelValue: boolean;
  operator: FunctionOperator | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

/**
 * @description 基础函数不展示输出参数区块。
 */
const showOutputParameters = computed(() => {
  const operator = props.operator;
  if (!operator) {
    return false;
  }
  if (operator.type === "basic" || operator.apiModelType === "BASIC_QUERY" || operator.apiModelType === "BASIC") {
    return false;
  }
  return operator.outputParameters.length > 0;
});

/**
 * @description 是否存在可展示的元信息字段。
 */
const hasMetaItems = computed(() => {
  const operator = props.operator;
  if (!operator) {
    return false;
  }
  return Boolean(
    operator.protocol ||
    operator.createdBy ||
    operator.updatedAt ||
    operator.timeout > 0 ||
    (operator.testStatus && operator.testStatus !== "untested") ||
    operator.testedAt ||
    operator.functionApi,
  );
});

/**
 * @description 获取函数类型展示文案；CUSTOMIZE 与未知模型类型展示空。
 * @param operator 算子。
 * @returns 中文标签或空字符串。
 */
function typeLabel(operator: FunctionOperator): string {
  if (operator.apiModelType === "CUSTOMIZE") {
    return "";
  }
  if (operator.apiModelType === "BASIC_QUERY" || operator.apiModelType === "BASIC" || operator.type === "basic") {
    return FUNCTION_OPERATOR_TYPE_LABELS.basic;
  }
  return FUNCTION_OPERATOR_TYPE_LABELS[operator.type] ?? "";
}

/**
 * @description 获取状态展示文案；缺省状态展示空。
 * @param status 状态。
 * @returns 中文标签或空字符串。
 */
function statusLabel(status: FunctionOperatorStatus): string {
  if (!status) {
    return "";
  }
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
.function-operator-detail__state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
}

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

.function-operator-detail__meta {
  --el-descriptions-item-bordered-label-background: var(--aircas-color-panel-background-deep);
  --el-descriptions-table-border: 1px solid var(--aircas-color-border-soft);
  --el-fill-color-blank: var(--aircas-color-input-background);
}

.function-operator-detail__meta :deep(.el-descriptions__body) {
  background-color: var(--aircas-color-transparent);
}

.function-operator-detail__meta :deep(.el-descriptions__label.is-bordered-label) {
  background: var(--aircas-color-panel-background-deep);
  color: var(--aircas-color-text-secondary);
}

.function-operator-detail__meta :deep(.el-descriptions__content.is-bordered-content) {
  background: var(--aircas-color-input-background);
  color: var(--aircas-color-text-primary);
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
</style>
