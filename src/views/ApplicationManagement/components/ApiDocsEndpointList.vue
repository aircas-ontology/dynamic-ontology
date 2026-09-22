<template>
  <aside class="api-docs-endpoint-list" aria-label="接口列表">
    <el-select
      v-model="selectedMenuTag"
      class="aircas-select api-docs-endpoint-list__menu"
      popper-class="aircas-select-popper"
      clearable
      filterable
      placeholder="按接口菜单筛选"
      aria-label="按接口菜单筛选"
    >
      <el-option v-for="tag in menuOptions" :key="tag" :label="tag" :value="tag" />
    </el-select>
    <el-input
      v-model="pathKeyword"
      class="aircas-input api-docs-endpoint-list__search"
      clearable
      maxlength="128"
      placeholder="按接口地址搜索"
      aria-label="按接口地址搜索"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>

    <div class="api-docs-endpoint-list__scroll">
      <p v-if="!filteredGroups.length" class="api-docs-endpoint-list__empty">无匹配接口</p>
      <div v-for="group in filteredGroups" :key="group.tag" class="api-docs-endpoint-list__group">
        <button
          type="button"
          class="api-docs-endpoint-list__group-toggle"
          :aria-expanded="isGroupExpanded(group.tag)"
          :aria-controls="`api-docs-group-${group.tag}`"
          @click="toggleGroupExpanded(group.tag)"
        >
          <el-icon class="api-docs-endpoint-list__group-icon" aria-hidden="true">
            <ArrowDown v-if="isGroupExpanded(group.tag)" />
            <ArrowRight v-else />
          </el-icon>
          <span class="api-docs-endpoint-list__group-title">{{ group.tag }}</span>
          <span class="api-docs-endpoint-list__group-count">{{ group.endpoints.length }}</span>
        </button>
        <div v-show="isGroupExpanded(group.tag)" :id="`api-docs-group-${group.tag}`" class="api-docs-endpoint-list__group-body">
          <button
            v-for="endpoint in group.endpoints"
            :key="endpoint.id"
            type="button"
            class="api-docs-endpoint-list__item"
            :class="{ 'is-active': endpoint.id === selectedId }"
            :aria-current="endpoint.id === selectedId ? 'true' : undefined"
            @click="emit('select', endpoint.id)"
          >
            <span class="api-docs-endpoint-list__method" :class="`is-${endpoint.method}`">{{ endpoint.method.toUpperCase() }}</span>
            <span class="api-docs-endpoint-list__path">{{ endpoint.path }}</span>
            <span class="api-docs-endpoint-list__summary">{{ endpoint.summary }}</span>
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ArrowDown, ArrowRight, Search } from "@element-plus/icons-vue";
import { computed, ref, watch } from "vue";

import type { ApiDocsEndpointGroup } from "@/types";

import { filterApiDocsEndpointGroups, mapApiDocsEndpointMenuOptions } from "../utils/filterApiDocsEndpointGroups";

const props = defineProps<{
  groups: ApiDocsEndpointGroup[];
  selectedId: string;
}>();

const emit = defineEmits<{
  select: [endpointId: string];
}>();

/** 接口菜单（分组）筛选值。 */
const selectedMenuTag = ref("");

/** 接口路径搜索关键字。 */
const pathKeyword = ref("");

/** 已收起的分组 tag 集合；默认全部展开。 */
const collapsedTags = ref(new Set<string>());

const menuOptions = computed(() => mapApiDocsEndpointMenuOptions(props.groups));

const filteredGroups = computed(() => filterApiDocsEndpointGroups(props.groups, selectedMenuTag.value, pathKeyword.value));

/**
 * @description 判断当前是否处于筛选状态（菜单或路径关键字）。
 * @returns 是否正在筛选。
 */
function hasActiveFilter(): boolean {
  return Boolean(selectedMenuTag.value.trim() || pathKeyword.value.trim());
}

/**
 * @description 判断分组是否处于展开状态；筛选中强制展开匹配分组。
 * @param tag 分组名称。
 * @returns 是否展开。
 */
function isGroupExpanded(tag: string): boolean {
  if (hasActiveFilter()) {
    return true;
  }
  return !collapsedTags.value.has(tag);
}

/**
 * @description 切换分组展开/收起。
 * @param tag 分组名称。
 */
function toggleGroupExpanded(tag: string): void {
  if (hasActiveFilter()) {
    return;
  }
  const next = new Set(collapsedTags.value);
  if (next.has(tag)) {
    next.delete(tag);
  } else {
    next.add(tag);
  }
  collapsedTags.value = next;
}

/**
 * @description 选中接口所在分组若已收起则自动展开，保证选中项可见。
 * @param endpointId 当前选中接口 id。
 * @param groups 分组列表。
 */
function ensureSelectedGroupExpanded(endpointId: string, groups: ApiDocsEndpointGroup[]): void {
  if (!endpointId || hasActiveFilter()) {
    return;
  }
  const owner = groups.find((group) => group.endpoints.some((item) => item.id === endpointId));
  if (!owner || isGroupExpanded(owner.tag)) {
    return;
  }
  const next = new Set(collapsedTags.value);
  next.delete(owner.tag);
  collapsedTags.value = next;
}

watch(
  () => [props.selectedId, props.groups] as const,
  ([endpointId, groups]) => {
    ensureSelectedGroupExpanded(endpointId, groups);
  },
  { immediate: true },
);

watch(menuOptions, (options) => {
  if (selectedMenuTag.value && !options.includes(selectedMenuTag.value)) {
    selectedMenuTag.value = "";
  }
});
</script>

<style scoped lang="scss">
.api-docs-endpoint-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  padding: 12px;
  border-right: 1px solid var(--aircas-color-border-soft);
  background: var(--aircas-color-panel-background-deep);
}

.api-docs-endpoint-list__menu,
.api-docs-endpoint-list__search {
  flex: 0 0 auto;
  width: 100%;
}

.api-docs-endpoint-list__scroll {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  overflow: auto;
}

.api-docs-endpoint-list__empty {
  margin: 16px 0 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  text-align: center;
}

.api-docs-endpoint-list__group-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  margin: 0 0 4px;
  padding: 6px 4px;
  border: 0;
  border-radius: 4px;
  background: var(--aircas-color-transparent);
  color: var(--aircas-color-text-secondary);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.api-docs-endpoint-list__group-toggle:hover {
  background: var(--aircas-color-hover-background);
  color: var(--aircas-color-text-primary);
}

.api-docs-endpoint-list__group-toggle:focus-visible {
  outline: 2px solid var(--aircas-color-accent-cyan);
  outline-offset: -2px;
}

.api-docs-endpoint-list__group-icon {
  flex: 0 0 auto;
  font-size: 12px;
}

.api-docs-endpoint-list__group-title {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.api-docs-endpoint-list__group-count {
  flex: 0 0 auto;
  color: var(--aircas-color-text-secondary);
  font-size: 11px;
}

.api-docs-endpoint-list__group-body {
  display: flex;
  flex-direction: column;
}

.api-docs-endpoint-list__item {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  grid-template-rows: auto auto;
  column-gap: 8px;
  row-gap: 2px;
  width: 100%;
  margin: 0 0 4px;
  padding: 8px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: var(--aircas-color-transparent);
  color: var(--aircas-color-text-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.api-docs-endpoint-list__item:hover {
  background: var(--aircas-color-hover-background);
}

.api-docs-endpoint-list__item.is-active {
  border-color: var(--aircas-color-accent-cyan);
  background: var(--aircas-color-hover-background);
}

.api-docs-endpoint-list__item:focus-visible {
  outline: 2px solid var(--aircas-color-accent-cyan);
  outline-offset: -2px;
}

.api-docs-endpoint-list__method {
  grid-row: 1 / span 2;
  align-self: center;
  color: var(--aircas-color-accent-cyan);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.api-docs-endpoint-list__method.is-post {
  color: var(--aircas-color-success);
}

.api-docs-endpoint-list__method.is-put,
.api-docs-endpoint-list__method.is-patch {
  color: var(--aircas-color-warning);
}

.api-docs-endpoint-list__method.is-delete {
  color: var(--aircas-color-danger);
}

.api-docs-endpoint-list__path {
  min-width: 0;
  overflow: hidden;
  color: var(--aircas-color-text-primary);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.api-docs-endpoint-list__summary {
  min-width: 0;
  overflow: hidden;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
