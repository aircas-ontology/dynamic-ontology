<template>
  <el-card class="aircas-card stat-card" shadow="never"
    :class="{ 'stat-card--object': stat.id === 'object', 'stat-card--behavior': stat.id === 'behavior', 'stat-card--relation': stat.id === 'relation' }"
    body-class="stat-card__body">
    <header>
      <h2>{{ stat.label }}</h2><span class="stat-card__icon"><el-icon :size="18">
          <component :is="icons[stat.icon]" />
        </el-icon></span>
    </header>
    <strong>{{ stat.value.toLocaleString("zh-CN") }}</strong>
    <span class="stat-card__caption">全部空间汇总</span>
    <div class="stat-card__line" aria-hidden="true"><span></span></div>
  </el-card>
</template>
<script setup lang="ts">
import { Box, Connection, Link, Share } from "@element-plus/icons-vue";
import type { OntologySpaceSummary } from "@/types";
defineProps<{ stat: OntologySpaceSummary }>();
const icons = { Box, Connection, Link, Share };
</script>
<style scoped lang="scss">
.stat-card {
  --stat-accent: var(--aircas-color-accent-cyan);
  --stat-fill: var(--aircas-color-accent-cyan-fill);
  min-width: 0;
  min-height: 168px;
  border-radius: 8px;
}

.stat-card--object {
  --stat-accent: var(--aircas-color-accent-green);
  --stat-fill: var(--aircas-color-accent-green-fill);
}

.stat-card--behavior {
  --stat-accent: var(--aircas-color-accent-blue);
  --stat-fill: var(--aircas-color-accent-blue-fill);
}

.stat-card--relation {
  --stat-accent: var(--aircas-color-accent-purple);
  --stat-fill: var(--aircas-color-accent-purple-fill);
}

:deep(.stat-card__body) {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

h2 {
  color: var(--aircas-color-text-secondary);
  font-size: 14px;
  font-weight: 600;
}

.stat-card__icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: var(--stat-accent);
  background: var(--stat-fill);
  flex-shrink: 0;
}

strong {
  margin: 8px 0;
  font-size: 32px;
  line-height: 1;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.stat-card__caption {
  font-size: 12px;
  color: var(--aircas-color-text-muted);
}

.stat-card__line {
  height: 4px;
  margin-top: auto;
  border-radius: 4px;
  background: var(--aircas-color-panel-background-deep);
  overflow: hidden;
}

.stat-card__line span {
  display: block;
  height: 100%;
  width: 65%;
  background: var(--stat-accent);
  border-radius: inherit;
}
</style>
