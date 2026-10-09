<template>
  <section class="ontology-object-overview-panel" aria-label="对象资源统计" :aria-busy="loading">
    <header class="ontology-object-overview-panel__header">
      <div>
        <h2>对象资源统计</h2>
        <p>当前对象关联的核心资源数量</p>
      </div>
      <span v-if="loading" class="ontology-object-overview-panel__status"><AircasLoading>统计加载中...</AircasLoading></span>
    </header>

    <el-alert v-if="error" class="ontology-object-overview-panel__error" :title="error" type="error" :closable="false" show-icon />
    <el-button v-if="error" class="aircas-button" @click="emit('retry')">重试</el-button>

    <dl class="ontology-object-overview-panel__stats">
      <div v-for="item in statItems" :key="item.id" class="ontology-object-overview-panel__stat" :class="`ontology-object-overview-panel__stat--${item.tone}`">
        <dt>
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </dt>
        <dd>{{ formatCount(counts[item.id]) }}</dd>
        <small>当前对象总量</small>
      </div>
    </dl>
  </section>
</template>

<script setup lang="ts">
import { Collection, Connection, Grid, Share } from "@element-plus/icons-vue";
import AircasLoading from "@/components/AircasLoading.vue";

type OntologyObjectStatId = "entity" | "property" | "relation" | "behavior";
type StatTone = "cyan" | "purple" | "blue" | "green";

defineProps<{
  counts: Partial<Record<OntologyObjectStatId, number>>;
  loading?: boolean;
  error?: string;
}>();

const emit = defineEmits<{
  retry: [];
}>();

const statItems: ReadonlyArray<{
  id: OntologyObjectStatId;
  label: string;
  icon: typeof Grid;
  tone: StatTone;
}> = [
  { id: "entity", label: "实例", icon: Grid, tone: "cyan" },
  { id: "property", label: "属性", icon: Collection, tone: "blue" },
  { id: "relation", label: "关系", icon: Share, tone: "purple" },
  { id: "behavior", label: "行为", icon: Connection, tone: "green" },
];

/**
 * @description 格式化对象资源统计数量；没有数值时显示占位符。
 * @param value 计数值。
 * @returns 本地化后的数量或占位符。
 */
function formatCount(value: number | undefined): string {
  return value === undefined ? "—" : value.toLocaleString("zh-CN");
}
</script>

<style lang="scss" scoped>
.ontology-object-overview-panel {
  display: flex;
  width: 100%;
  height: 100%;
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 16px;
  flex-direction: column;
  gap: 16px;
  overflow: auto;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-overlay), var(--aircas-color-overlay-deep));
  box-shadow: inset 0 0 20px var(--aircas-color-page-glow);
}

:root[theme="light"] .ontology-object-overview-panel {
  background: linear-gradient(135deg, var(--aircas-color-card-background), var(--aircas-color-panel-background-deep));
}

.ontology-object-overview-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ontology-object-overview-panel__header h2 {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  font-weight: 600;
}

.ontology-object-overview-panel__header p {
  margin: 4px 0 0;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}

.ontology-object-overview-panel__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.ontology-object-overview-panel__stat {
  display: flex;
  min-width: 0;
  min-height: 132px;
  padding: 16px;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 8px;
  background: radial-gradient(circle at 100% 0, var(--aircas-color-accent-cyan-soft), var(--aircas-color-transparent) 64%), var(--aircas-color-card-background);
}

.ontology-object-overview-panel__stat:hover {
  border-color: var(--aircas-color-border-highlight);
}

.ontology-object-overview-panel__stat dt {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--aircas-color-text-secondary);
  font-size: 14px;
}

.ontology-object-overview-panel__stat .el-icon {
  color: var(--aircas-color-accent-cyan);
  font-size: 20px;
}

.ontology-object-overview-panel__stat dd {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 20px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.ontology-object-overview-panel__stat small {
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}

.ontology-object-overview-panel__stat--purple .el-icon {
  color: var(--aircas-color-accent-purple);
}

.ontology-object-overview-panel__stat--blue .el-icon {
  color: var(--aircas-color-accent-blue);
}

.ontology-object-overview-panel__stat--green .el-icon {
  color: var(--aircas-color-accent-green);
}

@media (max-width: 1440px) {
  .ontology-object-overview-panel__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
