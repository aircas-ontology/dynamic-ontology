<template>
  <nav class="object-detail-tabs" aria-label="本体对象详情">
    <div class="object-detail-tabs__list" role="tablist">
      <template v-for="tab in visibleTabs" :key="tab.id">
        <span v-if="tab.id === firstMenuTabId" class="object-detail-tabs__separator" aria-hidden="true" />
        <button
          type="button"
          class="object-detail-tabs__item"
          :class="{
            'object-detail-tabs__item-active': tab.id === activeTab,
            'object-detail-tabs__item-object': tab.id === 'object',
          }"
          role="tab"
          :aria-selected="tab.id === activeTab"
          @click="emit('update:activeTab', tab.id)"
        >
          <span>{{ tab.label }}</span>
          <span v-if="tab.id !== 'object'" class="object-detail-tabs__count">
            {{ formatCount(props.counts?.[tab.id]) }}
          </span>
        </button>
      </template>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { OntologyObjectDetailTab } from "@/types";

type NonObjectTab = Exclude<OntologyObjectDetailTab, "object">;

const props = defineProps<{
  activeTab: OntologyObjectDetailTab;
  availableTabs: readonly OntologyObjectDetailTab[];
  objectName: string;
  counts?: Partial<Record<NonObjectTab, number>>;
}>();

const emit = defineEmits<{
  "update:activeTab": [tab: OntologyObjectDetailTab];
}>();

const allTabs = computed(() => [
  { id: "object" as const, label: props.objectName.trim() || "未命名对象" },
  { id: "attribute" as const, label: "属性" },
  { id: "relation" as const, label: "关系" },
  { id: "behavior" as const, label: "行为" },
]);

const visibleTabs = computed(() => allTabs.value.filter((tab) => props.availableTabs.includes(tab.id)));
const firstMenuTabId = computed(() => (visibleTabs.value.some((tab) => tab.id === "object") ? visibleTabs.value.find((tab) => tab.id !== "object")?.id : ""));

/**
 * @description 格式化 Tab 徽标计数；undefined 时显示占位符。
 * @param value 计数值。
 * @returns 格式化后的字符串。
 */
function formatCount(value: number | undefined): string {
  return value === undefined ? "—" : value.toLocaleString("zh-CN");
}
</script>

<style lang="scss" scoped>
.object-detail-tabs {
  display: flex;
  align-items: center;
  min-width: 0;
  height: 44px;
  padding: 0 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-overlay), var(--aircas-color-overlay-deep));
  box-shadow: inset 0 0 20px var(--aircas-color-page-glow);
}

:root[theme="light"] .object-detail-tabs {
  background: linear-gradient(135deg, var(--aircas-color-card-background), var(--aircas-color-panel-background-deep));
}

.object-detail-tabs__list {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  overflow-x: auto;
}

.object-detail-tabs__separator {
  width: 1px;
  height: 20px;
  flex-shrink: 0;
  margin: 0 4px;
  background: var(--aircas-color-border);
}

.object-detail-tabs__item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  height: 32px;
  padding: 0 14px;
  border: 1px solid var(--aircas-color-transparent);
  border-radius: 6px;
  color: var(--aircas-color-text-secondary);
  background: var(--aircas-color-transparent);
  font-size: 14px;
  line-height: 32px;
  text-align: center;
  font-family: inherit;
  cursor: pointer;
}

.object-detail-tabs__item-object {
  max-width: 320px;
  color: var(--aircas-color-text-primary);
  font-weight: 600;
}

.object-detail-tabs__item-object span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.object-detail-tabs__item:hover {
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-card-background);
}

.object-detail-tabs__item:focus-visible {
  outline: 2px solid var(--aircas-color-accent-cyan);
  outline-offset: 2px;
}

.object-detail-tabs__item-active,
.object-detail-tabs__item-active:hover {
  color: var(--aircas-color-accent-cyan);
  border-color: var(--aircas-color-border);
  background: var(--aircas-color-accent-cyan-soft);
  box-shadow: inset 0 -2px 0 var(--aircas-color-accent-cyan);
}

.object-detail-tabs__count {
  min-width: 24px;
  padding: 0 6px;
  border-radius: 10px;
  background: var(--aircas-color-card-background);
  color: var(--aircas-color-text-muted);
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  font-variant-numeric: tabular-nums;
}

.object-detail-tabs__item-active .object-detail-tabs__count {
  color: var(--aircas-color-accent-cyan);
  background: var(--aircas-color-accent-cyan-soft);
}
</style>
