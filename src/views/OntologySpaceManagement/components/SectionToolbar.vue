<template>
  <section class="section-toolbar" aria-label="空间筛选">
    <div><h2>本体空间管理</h2><p>管理全部本体空间，支持搜索、排序与运维操作</p></div>
    <div class="section-toolbar__actions">
      <el-input v-model="keyword" class="aircas-input" ariaLabel="按空间名称或 API 名称搜索" placeholder="按空间名称搜索" :prefix-icon="Search" clearable />
      <el-button class="aircas-button" :icon="Sort" @click="order = order === 'asc' ? 'desc' : 'asc'">名称{{ order === "asc" ? "升序" : "降序" }}</el-button>
      <el-radio-group :model-value="viewMode" @update:model-value="setViewMode" class="aircas-radio-group" ariaLabel="展示方式">
        <el-radio-button value="table">表格</el-radio-button>
        <el-radio-button value="card">卡片</el-radio-button>
      </el-radio-group>
    </div>
  </section>
</template>
<script setup lang="ts">
import { Search, Sort } from "@element-plus/icons-vue";
import type { OntologySpaceSortOrder, OntologyViewMode } from "@/types";
const keyword = defineModel<string>("keyword", { required: true });
const order = defineModel<OntologySpaceSortOrder>("order", { required: true });
const viewMode = defineModel<OntologyViewMode>("viewMode", { required: true });
function setViewMode(value: unknown) { if (value === "table" || value === "card") viewMode.value = value; }
</script>
<style scoped lang="scss">
.section-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; padding: 16px 0; }
h2 { font-size: 16px; margin-bottom: 4px; }
p { font-size: 12px; color: var(--aircas-color-text-muted); }
.section-toolbar__actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.section-toolbar__actions .el-input { width: 240px; }
</style>

