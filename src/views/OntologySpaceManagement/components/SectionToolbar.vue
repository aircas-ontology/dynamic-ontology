<template>
  <section class="section-toolbar" aria-label="空间筛选">
    <div class="section-toolbar__heading">
      <h2>本体空间管理</h2>
      <p>{{ resolveToolbarDescription(viewMode) }}</p>
    </div>
    <div class="section-toolbar__actions">
      <el-input v-model="keyword" class="aircas-input" ariaLabel="按空间名称或 API 名称搜索" placeholder="按空间名称搜索" :prefix-icon="Search" clearable />
      <el-select v-model="order" class="aircas-select" popper-class="aircas-select-popper" ariaLabel="按名称排序">
        <el-option label="按名称升序" value="asc" />
        <el-option label="按名称降序" value="desc" />
      </el-select>
      <el-radio-group :model-value="viewMode" @update:model-value="setViewMode" class="aircas-radio-group section-toolbar__view" ariaLabel="展示方式">
        <el-radio-button value="card">
          <svg class="section-toolbar__view-icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="8" height="8" rx="1.5" />
            <rect x="13" y="3" width="8" height="8" rx="1.5" />
            <rect x="3" y="13" width="8" height="8" rx="1.5" />
            <rect x="13" y="13" width="8" height="8" rx="1.5" />
          </svg>
          <span class="view-mode-label">卡片视图</span>
        </el-radio-button>
        <el-radio-button value="table">
          <svg class="section-toolbar__view-icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M3 9h18M3 14h18M9 9v11M15 9v11" />
          </svg>
          <span class="view-mode-label">表格视图</span>
        </el-radio-button>
      </el-radio-group>
    </div>
  </section>
</template>
<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";
import type { OntologySpaceSortOrder, OntologyViewMode } from "@/types";
const keyword = defineModel<string>("keyword", { required: true });
const order = defineModel<OntologySpaceSortOrder>("order", { required: true });
const viewMode = defineModel<OntologyViewMode>("viewMode", { required: true });

/**
 * @description 按当前视图模式生成工具栏说明，区分表格与卡片管理语义。
 * @param mode 当前空间列表展示方式。
 * @returns 带视图前缀的工具栏说明文案。
 */
function resolveToolbarDescription(mode: OntologyViewMode): string {
  if (mode === "card") {
    return "以卡片视图管理全部本体空间，支持搜索、排序与运维操作";
  }
  return "以表格视图管理全部本体空间，支持搜索、排序与运维操作";
}

/**
 * @description 仅接受表格或卡片视图值，忽略非法切换输入。
 * @param value 视图切换控件提交的未知值。
 */
function setViewMode(value: unknown) {
  if (value === "table" || value === "card") viewMode.value = value;
}
</script>
<style scoped lang="scss">
.section-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 12px 0;
  min-width: 900px;
}

.section-toolbar__heading {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

h2 {
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  font-weight: 700;
}

p {
  font-size: 12px;
  color: var(--aircas-color-text-muted);
}

.section-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  max-width: 100%;
}

.section-toolbar__actions .el-input {
  width: 260px;
  max-width: 100%;
}

.section-toolbar__actions .aircas-select {
  width: 148px;
}

.section-toolbar__view {
  display: inline-flex;
  gap: 4px;
}

.section-toolbar__view.aircas-radio-group :deep(.el-radio-button__inner),
.section-toolbar__view.aircas-radio-group :deep(.el-radio-button:first-child .el-radio-button__inner),
.section-toolbar__view.aircas-radio-group :deep(.el-radio-button:last-child .el-radio-button__inner) {
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

.section-toolbar__view.aircas-radio-group :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  border-color: var(--aircas-color-accent-cyan);
  background: var(--aircas-color-active-background);
  color: var(--aircas-color-text-primary);
  box-shadow: 0 0 10px var(--aircas-color-accent-cyan-soft);
}

.section-toolbar__view-icon {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
}

.view-mode-label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
