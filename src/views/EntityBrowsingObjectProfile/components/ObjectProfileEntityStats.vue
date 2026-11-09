<template>
  <section
    class="object-profile-entity-stats"
    :class="{ 'object-profile-entity-stats--embedded': embedded }"
    aria-label="实体统计信息"
  >
    <header class="object-profile-entity-stats__header">
      <h2>{{ stats.title }}</h2>
    </header>
    <div class="object-profile-entity-stats__grid">
      <article v-for="card in chartCards" :key="card.id" class="object-profile-entity-stats__card">
        <h3>{{ card.title }}</h3>
        <div :ref="(el) => setChartEl(card.id, el)" class="object-profile-entity-stats__chart" :aria-label="card.title" />
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, shallowRef, watch } from "vue";
import * as echarts from "echarts";
import type { ECharts, EChartsOption } from "echarts";
import { resolveEntityBrowsingObjectProfileStats } from "@/mocks/entityBrowsingObjectProfileMock/entityBrowsingObjectProfileStatsMock";
import type { EntityBrowsingObjectProfileStatsBar, EntityBrowsingObjectProfileStatsSlice } from "@/types";

const props = defineProps<{
  objectId: string;
  /** 嵌入基本信息下方时改为自适应高度，避免撑满整页。 */
  embedded?: boolean;
}>();

type ChartId = "config" | "service" | "homePort" | "status" | "manufacturer" | "launch";

const stats = computed(() => resolveEntityBrowsingObjectProfileStats(props.objectId));

const chartCards = computed(() => [
  { id: "config" as const, title: "构型统计" },
  { id: "service" as const, title: "服役数量" },
  { id: "homePort" as const, title: "母港统计" },
  { id: "status" as const, title: "状态统计" },
  { id: "manufacturer" as const, title: "制造厂商" },
  { id: "launch" as const, title: "下水时间" },
]);

const chartEls: Partial<Record<ChartId, HTMLElement>> = {};
const charts = shallowRef<Partial<Record<ChartId, ECharts>>>({});
let resizeObserver: ResizeObserver | null = null;

function setChartEl(id: ChartId, el: unknown): void {
  if (el instanceof HTMLElement) chartEls[id] = el;
  else delete chartEls[id];
}

function readCssColor(varName: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value || fallback;
}

function themeColors() {
  return {
    text: readCssColor("--aircas-color-text-primary", "#e8f1f8"),
    muted: readCssColor("--aircas-color-text-secondary", "#9eb6c8"),
    border: readCssColor("--aircas-color-border", "#2a3d4f"),
    bar: readCssColor("--aircas-color-primary", "#3ec6ff"),
    pie: [
      readCssColor("--aircas-color-category-blue", "#269cff"),
      readCssColor("--aircas-color-success", "#3ecf8e"),
      readCssColor("--aircas-color-warning", "#f0c14a"),
      readCssColor("--aircas-color-danger", "#f06666"),
      readCssColor("--aircas-color-primary", "#3ec6ff"),
      readCssColor("--aircas-color-category-purple", "#9272ff"),
    ],
  };
}

function buildPieOption(items: EntityBrowsingObjectProfileStatsSlice[]): EChartsOption {
  const theme = themeColors();
  return {
    color: theme.pie,
    tooltip: { trigger: "item" },
    legend: {
      bottom: 0,
      left: "center",
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: theme.muted, fontSize: 12 },
    },
    series: [
      {
        type: "pie",
        radius: ["28%", "58%"],
        center: ["50%", "44%"],
        avoidLabelOverlap: true,
        label: { color: theme.text, fontSize: 12 },
        labelLine: { lineStyle: { color: theme.muted } },
        data: items.map((item) => ({ name: item.name, value: item.value })),
      },
    ],
  };
}

function buildBarOption(bar: EntityBrowsingObjectProfileStatsBar): EChartsOption {
  const theme = themeColors();
  return {
    tooltip: { trigger: "axis" },
    grid: { left: 40, right: 16, top: 24, bottom: 36 },
    xAxis: {
      type: "category",
      data: bar.categories,
      axisLine: { lineStyle: { color: theme.border } },
      axisTick: { show: false },
      axisLabel: { color: theme.muted, fontSize: 11, interval: 0, hideOverlap: true },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      splitLine: { lineStyle: { color: theme.border, opacity: 0.45 } },
      axisLine: { show: false },
      axisLabel: { color: theme.muted, fontSize: 11 },
    },
    series: [
      {
        type: "bar",
        data: bar.values,
        barMaxWidth: 36,
        itemStyle: { color: theme.bar, borderRadius: [2, 2, 0, 0] },
      },
    ],
  };
}

function optionFor(id: ChartId): EChartsOption {
  const data = stats.value;
  switch (id) {
    case "config":
      return buildPieOption(data.configPie);
    case "service":
      return buildBarOption(data.serviceBar);
    case "homePort":
      return buildBarOption(data.homePortBar);
    case "status":
      return buildPieOption(data.statusPie);
    case "manufacturer":
      return buildBarOption(data.manufacturerBar);
    case "launch":
      return buildBarOption(data.launchBar);
  }
}

function renderAll(): void {
  const nextCharts = { ...charts.value };
  for (const card of chartCards.value) {
    const el = chartEls[card.id];
    if (!el) continue;
    let instance = nextCharts[card.id];
    if (!instance) {
      instance = echarts.init(el, undefined, { renderer: "canvas" });
      nextCharts[card.id] = instance;
    }
    instance.setOption(optionFor(card.id), { notMerge: true });
  }
  charts.value = nextCharts;
}

function resizeAll(): void {
  for (const instance of Object.values(charts.value)) {
    instance?.resize();
  }
}

onMounted(async () => {
  await nextTick();
  renderAll();
  resizeObserver = new ResizeObserver(() => resizeAll());
  for (const el of Object.values(chartEls)) {
    if (el) resizeObserver.observe(el);
  }
});

watch(
  () => props.objectId,
  () => {
    renderAll();
  },
);

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  for (const instance of Object.values(charts.value)) {
    instance?.dispose();
  }
  charts.value = {};
});
</script>

<style scoped lang="scss">
.object-profile-entity-stats {
  display: flex;
  min-width: 0;
  min-height: 0;
  height: 100%;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px 16px;
  overflow: auto;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
}

.object-profile-entity-stats--embedded {
  height: auto;
  overflow: visible;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.object-profile-entity-stats__header h2 {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  font-weight: 600;
}

.object-profile-entity-stats__grid {
  display: grid;
  min-height: 0;
  flex: 1;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: repeat(3, minmax(220px, 1fr));
  gap: 12px 16px;
}

.object-profile-entity-stats--embedded .object-profile-entity-stats__grid {
  flex: none;
  grid-template-rows: repeat(3, minmax(220px, 260px));
}

.object-profile-entity-stats__card {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px 8px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--aircas-color-panel-background-deep) 80%, transparent);
}

.object-profile-entity-stats__card h3 {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 14px;
  font-weight: 600;
}

.object-profile-entity-stats__chart {
  min-width: 0;
  min-height: 0;
  flex: 1;
}
</style>
