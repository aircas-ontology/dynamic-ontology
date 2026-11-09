<template>
  <section class="object-profile-relation-graph" aria-label="关系列表">
    <h3>关系列表</h3>
    <div v-if="nodes.length" ref="chartElement" class="object-profile-relation-graph__canvas" />
    <el-empty v-else description="暂无关系" />
  </section>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as echarts from "echarts";
import type { ECharts } from "echarts";
import { useDocumentTheme } from "@/composables/shared/useDocumentTheme";
import type { EntityBrowsingObjectProfileRelationNode } from "@/types";
import { buildObjectProfileRelationOption } from "../utils/buildObjectProfileRelationOption";

const props = defineProps<{ centerName: string; nodes: EntityBrowsingObjectProfileRelationNode[] }>();
const chartElement = ref<HTMLElement | null>(null);
const { isDark } = useDocumentTheme();
let chart: ECharts | undefined;
let observer: ResizeObserver | undefined;
let disposed = false;

/** @description 根据当前对象和主题渲染只读关系图。 */
async function renderProfileRelations(): Promise<void> {
  await nextTick();
  if (disposed) return;
  if (!chartElement.value) {
    observer?.disconnect();
    chart?.dispose();
    observer = undefined;
    chart = undefined;
    return;
  }
  if (!chart) {
    chart = echarts.init(chartElement.value);
    observer = new ResizeObserver(() => chart?.resize());
    observer.observe(chartElement.value);
  }
  const style = getComputedStyle(document.documentElement);
  chart.setOption(
    buildObjectProfileRelationOption(props.centerName, props.nodes, {
      primary: style.getPropertyValue("--aircas-color-primary").trim(),
      background: style.getPropertyValue("--aircas-color-panel-background-deep").trim(),
      border: style.getPropertyValue("--aircas-color-border").trim(),
      text: style.getPropertyValue("--aircas-color-text-primary").trim(),
    }),
    true,
  );
}

onMounted(renderProfileRelations);
watch(() => [props.centerName, props.nodes, isDark.value], renderProfileRelations, { deep: true });
onBeforeUnmount(() => {
  disposed = true;
  observer?.disconnect();
  chart?.dispose();
});
</script>

<style scoped lang="scss">
.object-profile-relation-graph {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--aircas-color-border);
}
.object-profile-relation-graph h3 {
  color: var(--aircas-color-primary);
  font-size: 14px;
}
.object-profile-relation-graph__canvas {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: linear-gradient(165deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
}
</style>
