<template>
  <el-card
    class="stat-card"
    shadow="never"
    :class="{ 'stat-card--object': stat.id === 'object', 'stat-card--behavior': stat.id === 'behavior', 'stat-card--relation': stat.id === 'relation' }"
    body-class="stat-card__body"
  >
    <header>
      <h2>{{ stat.label }}</h2>
      <span class="stat-card__icon"
        ><el-icon :size="18"> <component :is="icons[stat.icon]" /> </el-icon
      ></span>
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
  --stat-accent: var(--aircas-color-primary);
  --stat-fill: var(--aircas-color-effect-primary-fill);
  min-width: 0;
  height: 100%;
  min-height: 150px;
  border-radius: 8px;
  background: linear-gradient(160deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
  box-shadow: inset 0 0 28px var(--aircas-color-effect-page-glow);
}

:root:not(.dark) .stat-card {
  background: linear-gradient(160deg, var(--aircas-color-card-background), var(--aircas-color-panel-background-deep));
}

.stat-card.stat-card--object {
  --stat-accent: var(--aircas-color-success);
  --stat-fill: var(--aircas-color-effect-success-fill);
}

.stat-card.stat-card--behavior {
  --stat-accent: var(--aircas-color-category-blue);
  --stat-fill: var(--aircas-color-effect-blue-fill);
}

.stat-card.stat-card--relation {
  --stat-accent: var(--aircas-color-category-purple);
  --stat-fill: var(--aircas-color-effect-purple-fill);
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
  border-radius: 8px;
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
  color: var(--aircas-color-text-secondary);
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
