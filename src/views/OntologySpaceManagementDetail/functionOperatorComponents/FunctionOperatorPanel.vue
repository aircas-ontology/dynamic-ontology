<template>
  <section class="function-operator-panel">
    <div class="function-operator-panel__filters">
      <div class="function-operator-panel__filter-fields">
        <el-input v-model="filters.keyword" class="aircas-input function-operator-panel__keyword" clearable placeholder="按函数名称搜索" />
        <el-select
          v-model="filters.type"
          class="aircas-select function-operator-panel__filter"
          popper-class="aircas-select-popper"
          clearable
          placeholder="函数类型"
        >
          <el-option v-for="item in FUNCTION_OPERATOR_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-select
          v-model="filters.creator"
          class="aircas-select function-operator-panel__filter"
          popper-class="aircas-select-popper"
          clearable
          placeholder="创建人"
        >
          <el-option v-for="item in creatorOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select
          v-model="filters.status"
          class="aircas-select function-operator-panel__filter"
          popper-class="aircas-select-popper"
          clearable
          placeholder="状态"
        >
          <el-option v-for="item in FUNCTION_OPERATOR_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-date-picker
          v-model="updatedRange"
          class="aircas-input function-operator-panel__date"
          popper-class="aircas-picker"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
      </div>

      <div class="function-operator-panel__filter-actions">
        <el-button class="aircas-button" type="primary" @click="openCreate">新建函数</el-button>
        <el-button class="aircas-button" type="primary" @click="applyFilters">查询</el-button>
        <el-button class="aircas-button" @click="resetFilters">重置</el-button>
      </div>
    </div>

    <div class="function-operator-panel__toolbar">
      <span class="function-operator-panel__count">共 {{ total }} 个函数算子</span>
      <div class="function-operator-panel__toolbar-actions">
        <el-select v-model="sortValue" class="aircas-select" popper-class="aircas-select-popper" style="width: 170px" @change="loadOperators">
          <el-option label="更新时间（倒序）" value="updatedAt-desc" />
          <el-option label="更新时间（正序）" value="updatedAt-asc" />
          <el-option label="名称（正序）" value="name-asc" />
          <el-option label="名称（倒序）" value="name-desc" />
        </el-select>
        <el-radio-group :model-value="viewMode" class="aircas-radio-group function-operator-panel__view" ariaLabel="展示方式" @update:model-value="setViewMode">
          <el-radio-button value="card">
            <svg class="function-operator-panel__view-icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="3" width="8" height="8" rx="1.5" />
              <rect x="13" y="3" width="8" height="8" rx="1.5" />
              <rect x="3" y="13" width="8" height="8" rx="1.5" />
              <rect x="13" y="13" width="8" height="8" rx="1.5" />
            </svg>
            <span class="function-operator-panel__view-label">卡片视图</span>
          </el-radio-button>
          <el-radio-button value="table">
            <svg class="function-operator-panel__view-icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M3 9h18M3 14h18M9 9v11M15 9v11" />
            </svg>
            <span class="function-operator-panel__view-label">表格视图</span>
          </el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div v-if="loading" class="function-operator-panel__state">正在加载函数算子...</div>
    <div v-else-if="errorMessage" class="function-operator-panel__state function-operator-panel__state--error">
      <span>{{ errorMessage }}</span>
      <el-button class="aircas-button" size="small" @click="loadOperators">重试</el-button>
    </div>
    <el-empty v-else-if="!operators.length" class="function-operator-panel__empty" description="当前空间暂无函数算子" />
    <div v-else-if="viewMode === 'card'" class="function-operator-panel__cards">
      <article v-for="operator in operators" :key="operator.id" class="function-operator-card" @click="openDetail(operator)">
        <div class="function-operator-card__header">
          <div class="function-operator-card__name">{{ operator.name }}</div>
          <el-tag class="aircas-tag" size="small" :type="statusTagType(operator.status)">{{ statusLabel(operator.status) }}</el-tag>
        </div>
        <div class="function-operator-card__meta">
          <el-tag class="aircas-tag" size="small" effect="plain">{{ typeLabel(operator) }}</el-tag>
          <span>{{ operator.version }}</span>
        </div>
        <p class="function-operator-card__description">{{ operator.description || "暂无说明" }}</p>
        <div class="function-operator-card__footer">
          <span>{{ operator.createdBy }}</span>
          <span>{{ operator.updatedAt }}</span>
        </div>
        <div class="function-operator-card__actions" @click.stop>
          <el-button class="aircas-button" text size="small" @click="openTest(operator)">测试</el-button>
          <el-button class="aircas-button" text size="small" @click="openEdit(operator)">编辑</el-button>
          <el-button class="aircas-button" text size="small" @click="togglePublish(operator)">
            {{ operator.status === "published" ? "下线" : "发布" }}
          </el-button>
          <el-button class="aircas-button" text type="danger" size="small" @click="removeOperator(operator)">删除</el-button>
        </div>
      </article>
    </div>
    <el-table
      v-else
      :data="operators"
      class="aircas-table aircas-table--flat function-operator-panel__table"
      height="100%"
      @row-click="(row) => openDetail(asOperator(row))"
    >
      <el-table-column prop="name" label="函数名称" min-width="180" show-overflow-tooltip />
      <el-table-column label="类型" width="120">
        <template #default="{ row }">
          <el-tag class="aircas-tag" size="small" effect="plain">{{ typeLabel(asOperator(row)) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="protocol" label="协议" width="90" />
      <el-table-column prop="version" label="版本" width="100" />
      <el-table-column prop="description" label="说明" min-width="180" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag class="aircas-tag" size="small" :type="statusTagType(asOperator(row).status)">{{ statusLabel(asOperator(row).status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="最后更新" width="150" />
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button class="aircas-button" link type="primary" @click.stop="openTest(asOperator(row))">测试</el-button>
          <el-button class="aircas-button" link @click.stop="openEdit(asOperator(row))">编辑</el-button>
          <el-button class="aircas-button" link @click.stop="togglePublish(asOperator(row))">{{
            asOperator(row).status === "published" ? "下线" : "发布"
          }}</el-button>
          <el-button class="aircas-button" link type="danger" @click.stop="removeOperator(asOperator(row))">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-if="total > 0"
      v-model:current-page="page"
      v-model:page-size="pageSize"
      class="aircas-pagination function-operator-panel__pagination"
      popper-class="aircas-pagination-popper"
      layout="total, sizes, prev, pager, next"
      :total="total"
      :page-sizes="[8, 16, 32]"
      @current-change="loadOperators"
      @size-change="loadOperators"
    />

    <FunctionOperatorDetailDrawer
      v-model="detailVisible"
      :operator="selectedOperator"
      @test="selectedOperator && openTest(selectedOperator)"
      @edit="selectedOperator && openEdit(selectedOperator)"
      @delete="selectedOperator && removeOperator(selectedOperator)"
      @publish="selectedOperator && togglePublish(selectedOperator)"
    />
    <FunctionOperatorFormDialog
      v-model="formVisible"
      :operator="editingOperator"
      :draft="formDraft"
      :space-id="spaceId"
      :loading="actionLoading"
      @submit="saveOperator"
    />

    <el-dialog v-model="testVisible" title="函数算子测试" width="640px" destroy-on-close>
      <p class="function-operator-panel__test-title">{{ testingOperator?.name }}</p>
      <el-input v-model="testInput" class="aircas-input" type="textarea" :rows="8" placeholder="请输入 JSON 测试参数" />
      <div v-if="testResult" class="function-operator-panel__test-result" :class="{ 'is-error': !testResult.success }">
        <strong>{{ testResult.message }}</strong>
        <pre>{{ testResult.output }}</pre>
        <span>耗时 {{ testResult.duration }} ms</span>
      </div>
      <template #footer>
        <el-button class="aircas-button" @click="testVisible = false">取消</el-button>
        <el-button class="aircas-button" type="primary" :loading="testing" @click="runTest">运行测试</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import type { TagProps } from "element-plus";

import type { FunctionOperator, FunctionOperatorStatus } from "@/types";
import { FUNCTION_OPERATOR_STATUS_LABELS, FUNCTION_OPERATOR_STATUS_OPTIONS, FUNCTION_OPERATOR_TYPE_LABELS, FUNCTION_OPERATOR_TYPE_OPTIONS } from "@/types";

import { useFunctionOperatorWorkspace } from "../composables/useFunctionOperatorWorkspace";
import FunctionOperatorDetailDrawer from "./FunctionOperatorDetailDrawer.vue";
import FunctionOperatorFormDialog from "./FunctionOperatorFormDialog.vue";

const {
  spaceId,
  operators,
  total,
  page,
  pageSize,
  loading,
  errorMessage,
  actionLoading,
  viewMode,
  sortValue,
  updatedRange,
  filters,
  creatorOptions,
  selectedOperator,
  detailVisible,
  editingOperator,
  formDraft,
  formVisible,
  testVisible,
  testingOperator,
  testInput,
  testResult,
  testing,
  loadOperators,
  resetFilters,
  applyFilters,
  openDetail,
  openCreate,
  openEdit,
  saveOperator,
  removeOperator,
  togglePublish,
  openTest,
  runTest,
} = useFunctionOperatorWorkspace();

/**
 * @description 将表格行收窄为函数算子业务类型。
 * @param row 表格行。
 * @returns 函数算子。
 */
function asOperator(row: unknown): FunctionOperator {
  return row as FunctionOperator;
}

/**
 * @description 仅接受卡片或表格视图值，忽略非法切换输入。
 * @param value 视图切换控件提交的未知值。
 */
function setViewMode(value: unknown): void {
  if (value === "table" || value === "card") {
    viewMode.value = value;
  }
}

/**
 * @description 获取函数类型展示文案；CUSTOMIZE 与未知模型类型展示空。
 * @param operator 算子。
 * @returns 中文标签或空字符串。
 */
function typeLabel(operator: FunctionOperator): string {
  if (operator.apiModelType === "CUSTOMIZE") {
    return "";
  }
  if (operator.apiModelType === "BASIC_QUERY" || operator.type === "basic") {
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
 * @description 映射状态到 Tag 类型。
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
.function-operator-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  padding: 12px;
  overflow: hidden;
  background: var(--aircas-color-page-background);
}

.function-operator-panel__filters {
  min-width: 1150px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.function-operator-panel__filter-fields,
.function-operator-panel__filter-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.function-operator-panel__keyword {
  width: 200px;
}

.function-operator-panel__filter {
  width: 140px;
}

.function-operator-panel :deep(.function-operator-panel__date.el-date-editor) {
  --el-input-text-color: var(--aircas-color-text-primary);
  --el-input-bg-color: var(--aircas-color-input-background);
  --el-input-border-color: var(--aircas-color-border);
  --el-input-hover-border-color: var(--aircas-color-border-highlight);
  --el-input-focus-border-color: var(--aircas-color-focus-border);
  --el-input-placeholder-color: var(--aircas-color-text-placeholder);
  --el-input-icon-color: var(--aircas-color-text-muted);
  --el-fill-color-blank: var(--aircas-color-input-background);
  --el-text-color-placeholder: var(--aircas-color-text-placeholder);
  --el-text-color-regular: var(--aircas-color-text-primary);
  background-color: var(--aircas-color-input-background);
  box-shadow: 0 0 0 1px var(--aircas-color-border) inset;
}

.function-operator-panel :deep(.function-operator-panel__date.el-date-editor:hover) {
  box-shadow: 0 0 0 1px var(--aircas-color-border-highlight) inset;
}

.function-operator-panel :deep(.function-operator-panel__date.el-date-editor.is-active) {
  box-shadow: 0 0 0 1px var(--aircas-color-focus-border) inset;
}

.function-operator-panel :deep(.function-operator-panel__date .el-range-input) {
  color: var(--aircas-color-text-primary);
  background-color: var(--aircas-color-transparent);
}

.function-operator-panel :deep(.function-operator-panel__date .el-range-input::placeholder) {
  color: var(--aircas-color-text-placeholder);
}

.function-operator-panel :deep(.function-operator-panel__date .el-range-separator) {
  color: var(--aircas-color-text-muted);
}

.function-operator-panel :deep(.function-operator-panel__date .el-icon) {
  color: var(--aircas-color-text-muted);
}

.function-operator-panel__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.function-operator-panel__count {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.function-operator-panel__toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.function-operator-panel__view {
  display: inline-flex;
  gap: 4px;
}

.function-operator-panel__view.aircas-radio-group :deep(.el-radio-button__inner),
.function-operator-panel__view.aircas-radio-group :deep(.el-radio-button:first-child .el-radio-button__inner),
.function-operator-panel__view.aircas-radio-group :deep(.el-radio-button:last-child .el-radio-button__inner) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--aircas-color-border);
  border-radius: 4px;
  outline: none;
  box-shadow: none;
  background-color: var(--aircas-color-panel-background-deep);
  color: var(--aircas-color-text-primary);
}

.function-operator-panel__view.aircas-radio-group :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  border-color: var(--aircas-color-accent-cyan);
  background: var(--aircas-color-active-background);
  color: var(--aircas-color-text-primary);
  box-shadow: 0 0 10px var(--aircas-color-accent-cyan-soft);
}

.function-operator-panel__view-icon {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
}

.function-operator-panel__view-label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.function-operator-panel__state,
.function-operator-panel__empty {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--aircas-color-text-secondary);
}

.function-operator-panel__state--error {
  color: var(--aircas-color-danger);
}

.function-operator-panel__cards {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  min-width: 0;
  min-height: 0;
  overflow: auto;
}

.function-operator-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 8px;
  background: var(--aircas-color-panel-background-deep);
  cursor: pointer;
}

.function-operator-card:hover {
  border-color: var(--aircas-color-accent-cyan);
}

.function-operator-card__header,
.function-operator-card__meta,
.function-operator-card__footer,
.function-operator-card__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.function-operator-card__name {
  color: var(--aircas-color-text-primary);
  font-size: 14px;
  font-weight: 600;
}

.function-operator-card__description,
.function-operator-card__footer {
  margin: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.function-operator-panel__table {
  flex: 1;
  min-height: 0;
}

.function-operator-panel__pagination {
  display: flex;
  justify-content: flex-end;
}

.function-operator-panel__test-title {
  margin: 0 0 8px;
  color: var(--aircas-color-text-primary);
  font-size: 14px;
}

.function-operator-panel__test-result {
  margin-top: 12px;
  padding: 8px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 4px;
  background: var(--aircas-color-panel-background-deep);
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.function-operator-panel__test-result.is-error {
  border-color: var(--aircas-color-danger);
  color: var(--aircas-color-danger);
}

.function-operator-panel__test-result pre {
  margin: 8px 0;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
