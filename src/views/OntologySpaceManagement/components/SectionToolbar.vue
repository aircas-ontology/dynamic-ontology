<template>
  <section class="section-toolbar" aria-label="空间筛选">
    <div class="section-toolbar__heading">
      <h2>本体空间管理</h2>
      <p>管理全部本体空间，支持搜索、排序与运维操作</p>
    </div>
    <div class="section-toolbar__actions">
      <el-input v-model="keyword" class="aircas-input" ariaLabel="按空间名称或 API 名称搜索" placeholder="按空间名称搜索"
        :prefix-icon="Search" clearable />
      <el-button class="aircas-button" :icon="Sort" @click="order = order === 'asc' ? 'desc' : 'asc'">名称{{ order ===
        "asc" ? "升序" : "降序" }}</el-button>
      <el-radio-group :model-value="viewMode" @update:model-value="setViewMode" class="aircas-radio-group"
        ariaLabel="展示方式">
        <el-radio-button value="table"><el-icon>
            <List />
          </el-icon><span class="view-mode-label">表格视图</span></el-radio-button>
        <el-radio-button value="card"><el-icon>
            <Grid />
          </el-icon><span class="view-mode-label">卡片视图</span></el-radio-button>
      </el-radio-group>
    </div>
  </section>
</template>
<script setup lang="ts">
import { Grid, List, Search, Sort } from "@element-plus/icons-vue";
import type { OntologySpaceSortOrder, OntologyViewMode } from "@/types";
const keyword = defineModel<string>("keyword", { required: true });
const order = defineModel<OntologySpaceSortOrder>("order", { required: true });
const viewMode = defineModel<OntologyViewMode>("viewMode", { required: true });
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
}

.section-toolbar__heading {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

h2 {
  font-size: 20px;
  font-weight: 500;
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

.view-mode-label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
