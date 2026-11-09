<template>
  <section class="entity-browse-overview" aria-label="实体浏览概览">
    <div class="entity-browse-overview__group" aria-label="统计信息">
      <div class="entity-browse-overview__stats" :aria-busy="loading">
        <article v-for="stat in statistics" :key="stat.id" class="entity-browse-meter" :class="`entity-browse-meter--${stat.id}`">
          <h3>{{ stat.label }}</h3>
          <strong>{{ stat.value.toLocaleString("zh-CN") }}</strong>
        </article>
      </div>
    </div>
    <div class="entity-browse-overview__group" aria-label="质量情况">
      <div class="entity-browse-overview__stats" :aria-busy="loading">
        <article v-for="item in quality" :key="item.id" class="entity-browse-meter" :class="`entity-browse-meter--${item.id}`">
          <h3>{{ item.label }}</h3>
          <strong>{{ item.displayValue }}</strong>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { EntityBrowseQualityCard, EntityBrowseStatisticCard } from "@/types";

defineProps<{
  statistics: EntityBrowseStatisticCard[];
  quality: EntityBrowseQualityCard[];
  loading?: boolean;
}>();
</script>

<style scoped lang="scss">
.entity-browse-overview {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: 8px;
  min-width: 0;
}

.entity-browse-overview__group {
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
  box-shadow: inset 0 0 20px var(--aircas-color-effect-page-glow);
}

:root:not(.dark) .entity-browse-overview__group {
  background: linear-gradient(135deg, var(--aircas-color-card-background), var(--aircas-color-panel-background-deep));
}

.entity-browse-overview__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 8px;
  min-width: 0;
}

.entity-browse-meter {
  --meter-accent: var(--aircas-color-primary);
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 72px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 6px;
  background: color-mix(in srgb, var(--aircas-color-panel-background-deep) 88%, transparent);
  box-shadow: inset 0 0 16px var(--aircas-color-effect-page-glow);
}

:root:not(.dark) .entity-browse-meter {
  background: color-mix(in srgb, var(--aircas-color-card-background) 92%, transparent);
}

.entity-browse-meter--relation {
  --meter-accent: var(--aircas-color-category-purple);
}

.entity-browse-meter--entity,
.entity-browse-meter--attributeFill {
  --meter-accent: var(--aircas-color-success);
}

.entity-browse-meter--resilience {
  --meter-accent: var(--aircas-color-category-blue);
}

.entity-browse-meter h3 {
  margin: 0;
  min-width: 0;
  color: var(--aircas-color-text-primary);
  font-size: 22px;
  font-weight: 500;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entity-browse-meter strong {
  flex-shrink: 0;
  color: var(--meter-accent);
  font-family: Consolas, "Courier New", monospace;
  font-size: 38px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  line-height: 1;
  text-shadow: 0 0 10px color-mix(in srgb, var(--meter-accent) 45%, transparent);
}

@media (max-width: 1100px) {
  .entity-browse-overview {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
