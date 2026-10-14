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
          <el-tag v-if="typeLabel(operator)" effect="plain">{{ typeLabel(operator) }}</el-tag>
          <el-tag v-if="operator.status" :type="statusTagType(operator.status)" effect="dark">{{ statusLabel(operator.status) }}</el-tag>
        </div>
        <el-select
          class="function-operator-detail__version"
          :model-value="detailVersion"
          placeholder="选择版本"
          :loading="versionsLoading"
          :disabled="loading && !versions.length"
          @update:model-value="onDetailVersionChange"
        >
          <el-option v-for="item in versions" :key="item" :label="item" :value="item" />
        </el-select>
      </div>

      <div v-if="loading" class="function-operator-detail__state" role="status"><AircasLoading>正在加载函数详情...</AircasLoading></div>
      <template v-else>
        <p v-if="operator.description" class="function-operator-detail__description">{{ operator.description }}</p>

        <el-descriptions v-if="hasMetaItems" class="function-operator-detail__meta" :column="2" border size="small">
          <el-descriptions-item v-if="operator.protocol" label="协议">{{ operator.protocol }}</el-descriptions-item>
          <el-descriptions-item v-if="operator.createdBy" label="创建人">{{ operator.createdBy }}</el-descriptions-item>
          <el-descriptions-item v-if="operator.updatedAt" label="更新时间">{{ operator.updatedAt }}</el-descriptions-item>
          <el-descriptions-item v-if="operator.timeout > 0" label="超时">{{ operator.timeout }} ms</el-descriptions-item>
          <el-descriptions-item v-if="operator.testStatus && operator.testStatus !== 'untested'" label="测试状态">
            <el-tag size="small" :type="operator.testStatus === 'passed' ? 'success' : 'danger'">
              {{ operator.testStatus === "passed" ? "已通过" : "未通过" }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="operator.testedAt" label="最近测试">{{ operator.testedAt }}</el-descriptions-item>
          <el-descriptions-item v-if="operator.functionApi" label="函数 API">{{ operator.functionApi }}</el-descriptions-item>
        </el-descriptions>

        <div class="function-operator-detail__section">
          <h4>输入参数</h4>
          <el-table :data="operator.inputParameters" class="aircas-table--accent-header" size="small">
            <el-table-column prop="name" label="名称" min-width="100" />
            <el-table-column prop="type" label="类型" width="90" />
            <el-table-column prop="description" label="说明" min-width="120" show-overflow-tooltip />
          </el-table>
        </div>
        <div class="function-operator-detail__section">
          <h4>输出参数</h4>
          <el-table :data="operator.outputParameters" class="aircas-table--accent-header" size="small">
            <el-table-column prop="name" label="名称" min-width="100" />
            <el-table-column prop="type" label="类型" width="90" />
            <el-table-column prop="description" label="说明" min-width="120" show-overflow-tooltip />
          </el-table>
        </div>

        <div class="function-operator-detail__actions">
          <el-button v-if="operator.status !== 'published'" type="primary" @click="emitEdit">编辑</el-button>
          <el-button type="warning" @click="emitTogglePublish">{{ operator.status === "published" ? "下线" : "发布" }}</el-button>
          <el-button type="danger" @click="emitDelete">删除</el-button>
          <el-button type="primary" plain @click="emitTest">测试</el-button>
        </div>

        <div v-if="operator.definition.kind === 'basic' && operator.definition.parameterConfig.trim()" class="function-operator-detail__section">
          <h4>参数配置</h4>
          <pre class="function-operator-detail__config">{{ operator.definition.parameterConfig }}</pre>
        </div>
        <div v-else-if="operator.definition.kind === 'code'" class="function-operator-detail__section">
          <h4>{{ scriptCodeSectionTitle(operator) }}</h4>
          <pre class="function-operator-detail__config">{{ scriptCodeText(operator) }}</pre>
        </div>
      </template>
    </template>
    <div v-else-if="loading" class="function-operator-detail__state" role="status"><AircasLoading>正在加载函数详情...</AircasLoading></div>
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
  /** 详情可选版本列表。 */
  versions: string[];
  /** 当前选中版本。 */
  detailVersion: string;
  /** 版本列表加载中。 */
  versionsLoading?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "change-version": [version: string];
  edit: [];
  "toggle-publish": [];
  delete: [];
  test: [];
}>();

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
 * @description 获取函数类型展示文案，与筛选下拉 FUNCTION_OPERATOR_TYPE_LABELS 一致。
 * @param operator 算子。
 * @returns 中文标签或空字符串。
 */
function typeLabel(operator: FunctionOperator): string {
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

/**
 * @description 通知父级切换详情版本。
 * @param value 选中版本。
 */
function onDetailVersionChange(value: string | number | boolean | undefined): void {
  if (typeof value !== "string" || !value.trim()) {
    return;
  }
  emit("change-version", value.trim());
}

/**
 * @description 通知父级编辑当前详情版本。
 */
function emitEdit(): void {
  emit("edit");
}

/**
 * @description 通知父级发布或下线当前详情版本。
 */
function emitTogglePublish(): void {
  emit("toggle-publish");
}

/**
 * @description 通知父级删除当前函数（按 functionApi）。
 */
function emitDelete(): void {
  emit("delete");
}

/**
 * @description 通知父级测试当前详情选中版本。
 */
function emitTest(): void {
  emit("test");
}

/**
 * @description 脚本代码区块标题；有语言时附带展示。
 * @param operator 当前算子。
 * @returns 区块标题。
 */
function scriptCodeSectionTitle(operator: FunctionOperator): string {
  if (operator.definition.kind !== "code") {
    return "脚本代码";
  }
  const language = typeof operator.definition.language === "string" ? operator.definition.language.trim() : "";
  return language ? `脚本代码（${language}）` : "脚本代码";
}

/**
 * @description 脚本源码展示文本；空则提示暂无代码。
 * @param operator 当前算子。
 * @returns 源码或占位文案。
 */
function scriptCodeText(operator: FunctionOperator): string {
  if (operator.definition.kind !== "code") {
    return "暂无代码";
  }
  const code = typeof operator.definition.code === "string" ? operator.definition.code : "";
  return code.trim() ? code : "暂无代码";
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
  flex-wrap: wrap;
  gap: 8px;
}

.function-operator-detail__version {
  flex: 0 0 120px;
  width: 120px;
}

.function-operator-detail__description {
  margin: 0 0 12px;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
}

.function-operator-detail__section {
  margin-top: 16px;
}

.function-operator-detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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
  border: 1px solid var(--aircas-color-border-light);
  border-radius: 4px;
  background: var(--aircas-color-panel-background-deep);
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
