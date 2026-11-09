<template>
  <section class="object-profile-entity-cards" aria-label="实体列表">
    <header class="object-profile-entity-cards__header">
      <h2>实体列表</h2>
      <span v-if="status === 'ready'">共 {{ total }} 条</span>
    </header>

    <div v-if="status === 'loading'" class="object-profile-entity-cards__state" role="status">
      <AircasLoading>正在加载实体列表…</AircasLoading>
    </div>
    <div v-else-if="status === 'error'" class="object-profile-entity-cards__state object-profile-entity-cards__state--error" role="alert">
      <p>{{ error }}</p>
      <el-button type="primary" @click="retryLoad">重试</el-button>
    </div>
    <div v-else-if="status === 'empty'" class="object-profile-entity-cards__state" role="status">
      <el-empty :description="error || '暂无实例'" :image-size="64" />
    </div>
    <div v-else class="object-profile-entity-cards__grid">
      <button
        v-for="row in filteredRows"
        :key="row.rowKey"
        type="button"
        class="object-profile-entity-card"
        :title="`查看 ${resolveCardTitle(row)} 详情`"
        @click="emit('open-entity-detail', row)"
      >
        <h3 class="object-profile-entity-card__title" :title="resolveCardTitle(row)">{{ resolveCardTitle(row) }}</h3>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { toRef } from "vue";
import AircasLoading from "@/components/AircasLoading.vue";
import { useObjectProfileEntityList, type ObjectProfileEntityRow } from "../composables/useObjectProfileEntityList";

const props = defineProps<{
  objectId: string;
}>();

const emit = defineEmits<{
  "open-entity-detail": [row: ObjectProfileEntityRow];
}>();

const TITLE_LABELS = ["舰船名称", "舰船全称", "英文名称"] as const;

const { status, error, filteredRows, total, loadObjectProfileEntityPage } = useObjectProfileEntityList(toRef(props, "objectId"));

/**
 * @description 解析卡片标题：优先舰船名称类字段，否则取首个非空属性。
 * @param row 实体行。
 * @returns 标题文案。
 */
function resolveCardTitle(row: ObjectProfileEntityRow): string {
  for (const label of TITLE_LABELS) {
    const value = row.cells[label]?.trim();
    if (value) return value;
  }
  const first = row.detailItems.find((item) => item.value.trim());
  return first?.value || row.rowKey || "未命名实体";
}

/**
 * @description 失败重试加载。
 */
function retryLoad(): void {
  void loadObjectProfileEntityPage(1);
}
</script>

<style scoped lang="scss">
.object-profile-entity-cards {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 10px 12px 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
}

.object-profile-entity-cards__header {
  display: flex;
  flex: 0 0 auto;
  align-items: baseline;
  gap: 8px;
}

.object-profile-entity-cards__header h2 {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 14px;
  font-weight: 600;
}

.object-profile-entity-cards__header span {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.object-profile-entity-cards__state {
  display: flex;
  min-height: 80px;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--aircas-color-text-secondary);
  font-size: 14px;
}

.object-profile-entity-cards__state--error {
  color: var(--aircas-color-warning);
}

.object-profile-entity-cards__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
  min-height: 0;
  overflow: auto;
}

.object-profile-entity-card {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 6px 10px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 6px;
  background: color-mix(in srgb, var(--aircas-color-panel-background-deep) 80%, transparent);
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.object-profile-entity-card:hover,
.object-profile-entity-card:focus-visible {
  border-color: var(--aircas-color-primary);
  background: color-mix(in srgb, var(--aircas-color-primary) 12%, var(--aircas-color-panel-background-deep));
  outline: none;
}

.object-profile-entity-card__title {
  margin: 0;
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: var(--aircas-color-text-primary);
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
