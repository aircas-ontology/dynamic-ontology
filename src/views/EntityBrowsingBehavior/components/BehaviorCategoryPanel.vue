<template>
  <aside class="behavior-category-panel" aria-label="行为分类">
    <header class="behavior-category-panel__header">
      <h3>行为分类</h3>
    </header>

    <div class="behavior-category-panel__list">
      <section v-for="group in groups" :key="group.id" class="behavior-category-panel__group">
        <el-button
          class="behavior-category-panel__group-toggle"
          :aria-expanded="isGroupOpen(group.id)"
          :aria-controls="groupPanelId(group.id)"
          @click="toggleGroup(group.id)"
        >
          <span class="behavior-category-panel__group-name">
            {{ group.name }}
            <span class="behavior-category-panel__count">（{{ group.count }}）</span>
          </span>
          <i
            class="behavior-category-panel__group-arrow fa"
            :class="isGroupOpen(group.id) ? 'fa-angle-down' : 'fa-angle-right'"
            aria-hidden="true"
          ></i>
        </el-button>

        <div
          v-show="isGroupOpen(group.id)"
          :id="groupPanelId(group.id)"
          class="behavior-category-panel__children"
        >
          <el-button
            v-for="category in group.categories"
            :key="category.id"
            class="behavior-category-panel__item"
            :class="[`behavior-category-panel__item--${category.id}`, { 'is-active': category.id === selectedCategoryId }]"
            :aria-pressed="category.id === selectedCategoryId"
            @click="emit('select', category.id)"
          >
            <span class="behavior-category-panel__indicator" aria-hidden="true"></span>
            <span class="behavior-category-panel__icon-wrap" aria-hidden="true">
              <span class="behavior-category-panel__icon" :style="iconStyle(category.icon)"></span>
            </span>

            <span class="behavior-category-panel__content">
              <span class="behavior-category-panel__name">
                {{ category.name }}
                <span class="behavior-category-panel__count">（{{ category.count }}）</span>
              </span>
              <span class="behavior-category-panel__description">{{ category.description }}</span>
            </span>

            <i class="behavior-category-panel__arrow fa fa-angle-right" aria-hidden="true"></i>
          </el-button>
        </div>
      </section>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { CSSProperties } from "vue";
import type {
  PowerBehaviorCategoryId,
  PowerBehaviorGroupId,
  PowerBehaviorGroupSummary,
} from "@/types/entityBrowsingDeweyBehavior";

defineProps<{
  groups: readonly PowerBehaviorGroupSummary[];
  selectedCategoryId: PowerBehaviorCategoryId;
}>();

const emit = defineEmits<{
  select: [categoryId: PowerBehaviorCategoryId];
}>();

const openedGroupIds = ref<PowerBehaviorGroupId[]>([
  "business-process",
  "application-analysis",
  "basic-operation",
]);

const isGroupOpen = (groupId: PowerBehaviorGroupId): boolean => openedGroupIds.value.includes(groupId);

const groupPanelId = (groupId: PowerBehaviorGroupId): string => `behavior-category-group-${groupId}`;

const toggleGroup = (groupId: PowerBehaviorGroupId): void => {
  if (isGroupOpen(groupId)) {
    openedGroupIds.value = openedGroupIds.value.filter((id) => id !== groupId);
    return;
  }

  openedGroupIds.value = [...openedGroupIds.value, groupId];
};

const iconStyle = (icon: string): CSSProperties => ({
  maskImage: `url(${icon})`,
  WebkitMaskImage: `url(${icon})`,
});
</script>

<style scoped lang="scss">
.behavior-category-panel {
  display: grid;
  min-width: 0;
  min-height: 0;
  grid-template-rows: 46px minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 6px;
  background: var(--aircas-color-panel-overlay-deep);
  box-shadow: inset 0 0 28px var(--aircas-color-border-shadow);
}

.behavior-category-panel__header {
  display: flex;
  align-items: center;
  padding: 0 14px;
  border-bottom: 1px solid var(--aircas-color-divider);
  height: 38px;

  h3 {
    margin: 0;
    color: var(--aircas-color-text-primary);
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 1px;
  }
}

.behavior-category-panel__list {
  display: flex;
  min-height: 0;
  padding: 6px;
  overflow-y: auto;
  flex-direction: column;
  gap: 4px;
  scrollbar-color: var(--aircas-color-scrollbar) var(--aircas-color-transparent);
  scrollbar-width: thin;
}

.behavior-category-panel__group {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.behavior-category-panel__group-toggle {
  display: flex;
  width: 100%;
  height: 32px;
  min-height: 32px;
  margin: 0;
  padding: 0 8px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 1px solid var(--aircas-color-transparent);
  border-radius: 6px;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-transparent);
}

.behavior-category-panel__group-toggle:hover {
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-hover-background);
}

.behavior-category-panel__group-toggle:focus-visible {
  outline: 1px solid var(--aircas-color-accent-cyan);
  outline-offset: -2px;
}

:deep(.behavior-category-panel__group-toggle > span) {
  display: contents;
}

.behavior-category-panel__group-name {
  overflow: hidden;
  color: var(--aircas-color-text-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.behavior-category-panel__group-arrow {
  color: var(--aircas-color-text-muted);
  font-size: 14px;
}

.behavior-category-panel__children {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.behavior-category-panel__item {
  position: relative;
  display: grid;
  width: 100%;
  height: 64px;
  min-height: 64px;
  margin: 0;
  padding: 6px 8px 6px 12px;
  grid-template-columns: 36px minmax(0, 1fr) 12px;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  border: 1px solid var(--aircas-color-transparent);
  border-radius: 6px;
  color: var(--aircas-color-text-secondary);
  background: var(--aircas-color-transparent);
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.behavior-category-panel__item:hover,
.behavior-category-panel__item.is-active {
  border-color: var(--aircas-color-blue-border);
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-hover-background);
  box-shadow: inset 0 0 18px var(--aircas-color-blue-fill);
}

.behavior-category-panel__item:focus-visible {
  outline: 1px solid var(--aircas-color-accent-cyan);
  outline-offset: -2px;
}

.behavior-category-panel__item :deep(span) {
  min-width: 0;
}

:deep(.behavior-category-panel__item > span) {
  display: contents;
}

.behavior-category-panel__indicator {
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: 0;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--aircas-color-transparent);
}

.behavior-category-panel__item.is-active .behavior-category-panel__indicator {
  background: var(--aircas-color-accent-cyan);
  box-shadow: 0 0 10px var(--aircas-color-cyan-shadow);
}

.behavior-category-panel__icon-wrap {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 1px solid var(--aircas-color-cyan-border);
  border-radius: 50%;
  color: var(--aircas-color-accent-cyan);
  background: var(--aircas-color-cyan-soft);
  box-shadow: 0 0 12px var(--aircas-color-cyan-shadow);
}

.behavior-category-panel__icon {
  width: 19px;
  height: 19px;
  background-color: currentColor;
  mask-position: center;
  mask-repeat: no-repeat;
  mask-size: contain;
}

.behavior-category-panel__content {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  flex-direction: column;
  gap: 2px;
  text-align: left;
}

.behavior-category-panel__name {
  max-width: 100%;
  overflow: hidden;
  color: var(--aircas-color-text-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.behavior-category-panel__count {
  color: var(--aircas-color-text-secondary);
  font-variant-numeric: tabular-nums;
}

.behavior-category-panel__description {
  display: block;
  width: 100%;
  overflow: hidden;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.behavior-category-panel__arrow {
  color: var(--aircas-color-text-muted);
  font-size: 16px;
}

.behavior-category-panel__item--behavior-tree .behavior-category-panel__icon-wrap {
  color: var(--aircas-color-accent-green);
  border-color: var(--aircas-color-green-border);
  background: var(--aircas-color-green-soft);
  box-shadow: 0 0 12px var(--aircas-color-green-shadow);
}

.behavior-category-panel__item--analysis .behavior-category-panel__icon-wrap {
  color: var(--aircas-color-accent-blue);
  border-color: var(--aircas-color-blue-border);
  background: var(--aircas-color-blue-soft);
  box-shadow: 0 0 12px var(--aircas-color-blue-shadow);
}

.behavior-category-panel__item--planning .behavior-category-panel__icon-wrap {
  color: var(--aircas-color-accent-green);
  border-color: var(--aircas-color-green-border);
  background: var(--aircas-color-green-soft);
  box-shadow: 0 0 12px var(--aircas-color-green-shadow);
}

.behavior-category-panel__item--command-control .behavior-category-panel__icon-wrap {
  color: var(--aircas-color-accent-cyan);
  border-color: var(--aircas-color-border-highlight);
  background: var(--aircas-color-section-background);
  box-shadow: 0 0 12px var(--aircas-color-cyan-shadow);
}

.behavior-category-panel__item--comprehensive-support .behavior-category-panel__icon-wrap {
  color: var(--aircas-color-accent-blue);
  border-color: var(--aircas-color-blue-border);
  background: var(--aircas-color-blue-soft);
  box-shadow: 0 0 12px var(--aircas-color-blue-shadow);
}

.behavior-category-panel__item--relation .behavior-category-panel__icon-wrap {
  color: var(--aircas-color-accent-orange);
  border-color: var(--aircas-color-orange-border);
  background: var(--aircas-color-orange-soft);
  box-shadow: 0 0 12px var(--aircas-color-orange-shadow);
}

.behavior-category-panel__item--attribute-update .behavior-category-panel__icon-wrap {
  color: var(--aircas-color-accent-cyan);
}
</style>

