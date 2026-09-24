<template>
  <nav class="workspace-type-tabs" aria-label="工作区类型">
    <div class="workspace-type-tabs__list" role="tablist">
      <template v-for="tab in visibleWorkspaceTabs" :key="tab.id">
        <span v-if="tab.id === 'object' && availableTabs.includes('overview')" class="workspace-type-tabs__separator" aria-hidden="true" />
        <button
          type="button"
          class="workspace-type-tabs__item"
          :class="{
            'workspace-type-tabs__item-active': tab.id === activeTab,
            'workspace-type-tabs__item-overview': tab.id === 'overview',
          }"
          role="tab"
          :aria-selected="tab.id === activeTab"
          @click="emit('update:activeTab', tab.id)"
        >
          <span>{{ tab.label }}</span>
        </button>
      </template>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ManagementWorkspaceTab } from "@/types";

const props = defineProps<{
  activeTab: ManagementWorkspaceTab;
  availableTabs: readonly ManagementWorkspaceTab[];
  spaceName: string;
}>();

const emit = defineEmits<{
  "update:activeTab": [tab: ManagementWorkspaceTab];
}>();

const workspaceTabs = computed(() => [
  { id: "overview" as const, label: props.spaceName.trim() || "未命名空间" },
  { id: "object" as const, label: "对象" },
  { id: "relation" as const, label: "关系" },
  { id: "function-operator" as const, label: "函数算子" },
  { id: "behavior" as const, label: "行为" },
  { id: "behavior-schedule" as const, label: "行为调度" },
]);

const visibleWorkspaceTabs = computed(() => workspaceTabs.value.filter((tab) => props.availableTabs.includes(tab.id)));
</script>

<style lang="scss" scoped>
.workspace-type-tabs {
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

:root[theme="light"] .workspace-type-tabs {
  background: linear-gradient(135deg, var(--aircas-color-card-background), var(--aircas-color-panel-background-deep));
}

.workspace-type-tabs__list {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  overflow-x: auto;
}

.workspace-type-tabs__item {
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

.workspace-type-tabs__item-overview {
  max-width: 240px;
  font-weight: 600;
}

.workspace-type-tabs__item-overview span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-type-tabs__separator {
  width: 1px;
  height: 20px;
  margin: 0 8px;
  flex-shrink: 0;
  background: var(--aircas-color-border-soft);
}

.workspace-type-tabs__item:hover {
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-card-background);
}

.workspace-type-tabs__item:focus-visible {
  outline: 2px solid var(--aircas-color-accent-cyan);
  outline-offset: 2px;
}

.workspace-type-tabs__item-active {
  color: var(--aircas-color-accent-cyan);
  border-color: var(--aircas-color-border);
  background: var(--aircas-color-accent-cyan-soft);
  box-shadow: inset 0 -2px 0 var(--aircas-color-accent-cyan);
}
</style>
