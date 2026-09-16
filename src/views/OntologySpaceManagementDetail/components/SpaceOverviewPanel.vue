<template>
  <section class="space-overview-panel" aria-label="空间资源统计" :aria-busy="loading">
    <header class="space-overview-panel__header">
      <div>
        <h2>空间资源统计</h2>
        <p>当前本体空间下的核心资源数量</p>
      </div>
      <span v-if="loading" class="space-overview-panel__status">统计加载中...</span>
    </header>

    <el-alert
      v-if="error"
      class="space-overview-panel__error"
      :title="error"
      type="error"
      :closable="false"
      show-icon
    />

    <el-button v-if="error" class="aircas-button" @click="load">重试</el-button>
    <dl class="space-overview-panel__stats">
      <div
        v-for="item in statItems"
        :key="item.id"
        class="space-overview-panel__stat"
        :class="`space-overview-panel__stat--${item.tone}`"
      >
        <dt>
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </dt>
        <dd>{{ formatCount(item.id) }}</dd>
        <small>{{ formatNote(item.id) }}</small>
      </div>
    </dl>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { Connection, Cpu, Grid, Share, Timer } from "@element-plus/icons-vue";
import type { ManagementWorkspaceTab } from "@/types";
import { useSpaceOverview } from "../composables/useSpaceOverview";
import { formatOverviewStat } from "../utils/overviewStats";

const route = useRoute();
const spaceId = computed(() => String(route.params.spaceId || ""));
const { data, loading, error, load } = useSpaceOverview(spaceId);
const statItems: ReadonlyArray<{ id: Exclude<ManagementWorkspaceTab, "overview">; label: string; icon: typeof Grid; tone: string }> = [
  { id: "object", label: "对象", icon: Grid, tone: "cyan" },
  { id: "relation", label: "关系", icon: Share, tone: "purple" },
  { id: "function-operator", label: "函数算子", icon: Cpu, tone: "blue" },
  { id: "behavior", label: "行为", icon: Connection, tone: "green" },
  { id: "behavior-schedule", label: "行为调度", icon: Timer, tone: "orange" },
];
function stat(id: Exclude<ManagementWorkspaceTab, "overview">) {
  return formatOverviewStat(data.value?.counts[id], data.value?.availableTabs.includes(id) ?? true, loading.value);
}
function formatCount(id: Exclude<ManagementWorkspaceTab, "overview">) { return stat(id).value; }
function formatNote(id: Exclude<ManagementWorkspaceTab, "overview">) { return stat(id).note; }
</script>

<style lang="scss" scoped>
.space-overview-panel {
  display: flex;
  min-width: 0;
  min-height: 0;
  padding: 16px;
  width: 100%;
  flex-direction: column;
  gap: 16px;
  overflow: auto;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-panel-background);
}

.space-overview-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.space-overview-panel__header h2 {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  font-weight: 600;
}

.space-overview-panel__header p {
  margin: 4px 0 0;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}

.space-overview-panel__status {
  flex-shrink: 0;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}

.space-overview-panel__error {
  flex-shrink: 0;
}

.space-overview-panel__stats {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.space-overview-panel__stat {
  display: flex;
  min-width: 0;
  min-height: 132px;
  padding: 16px;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 8px;
  background: var(--aircas-color-card-background);
}

.space-overview-panel__stat:hover {
  border-color: var(--aircas-color-border-highlight);
}

.space-overview-panel__stat dt {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--aircas-color-text-secondary);
  font-size: 14px;
}

.space-overview-panel__stat .el-icon {
  color: var(--aircas-color-accent-cyan);
  font-size: 20px;
}

.space-overview-panel__stat dd {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 20px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.space-overview-panel__stat small {
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}

.space-overview-panel__stat--purple .el-icon {
  color: var(--aircas-color-accent-purple);
}

.space-overview-panel__stat--blue .el-icon {
  color: var(--aircas-color-accent-blue);
}

.space-overview-panel__stat--green .el-icon {
  color: var(--aircas-color-accent-green);
}

.space-overview-panel__stat--orange .el-icon {
  color: var(--aircas-color-accent-orange);
}

@media (max-width: 1440px) {
  .space-overview-panel__stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 700px) { .space-overview-panel__stats { grid-template-columns: 1fr; } }
</style>

