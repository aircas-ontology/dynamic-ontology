<template>
  <article class="stat-card">
    <header><h2>{{ stat.label }}</h2><el-icon :size="20"><component :is="icons[stat.icon]" /></el-icon></header>
    <strong>{{ stat.value.toLocaleString("zh-CN") }}</strong>
    <span class="stat-card__caption">全部空间汇总</span>
    <div class="stat-card__line"></div>
  </article>
</template>
<script setup lang="ts">
import { Box, Connection, Link, Share } from "@element-plus/icons-vue";
import type { OntologySpaceSummary } from "@/types";
defineProps<{ stat: OntologySpaceSummary }>();
const icons = { Box, Connection, Link, Share };
</script>
<style scoped lang="scss">
.stat-card { display: flex; flex-direction: column; justify-content: space-between; min-width: 0; min-height: 150px; padding: 16px; border: 1px solid var(--aircas-color-border); border-radius: 8px; background: var(--aircas-color-card-background); }
header { display: flex; justify-content: space-between; align-items: center; gap: 8px; color: var(--aircas-color-accent-cyan); }
h2 { color: var(--aircas-color-text-secondary); font-size: 14px; font-weight: 500; }
strong { font-size: 32px; font-variant-numeric: tabular-nums; }
.stat-card__caption { font-size: 12px; color: var(--aircas-color-text-muted); }
.stat-card__line { height: 3px; background: linear-gradient(90deg, var(--aircas-color-accent-cyan), var(--aircas-color-accent-blue)); }
</style>
