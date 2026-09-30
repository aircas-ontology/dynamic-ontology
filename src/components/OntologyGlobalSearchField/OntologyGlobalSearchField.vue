<template>
  <div class="ontology-global-search" :class="`ontology-global-search--${placement}`" ref="rootRef">
    <el-input
      v-model="keyword"
      class="aircas-input ontology-global-search__input"
      :placeholder="placeholder"
      :prefix-icon="Search"
      clearable
      :ariaLabel="ariaLabel"
      @keydown.enter.prevent="submitSearch"
      @clear="handleClear"
      @focus="openOverlayIfHasState"
    />

    <div v-if="placement === 'overlay' && overlayVisible" class="ontology-global-search__dropdown" role="listbox" aria-label="检索结果">
      <OntologyGlobalSearchResultList :status="status" :error-message="errorMessage" :results="results" @select="handleSelect" @retry="submitSearch" />
    </div>

    <div v-else-if="placement === 'page'" class="ontology-global-search__panel ontology-global-search__panel--page" role="listbox" aria-label="检索结果">
      <OntologyGlobalSearchResultList :status="status" :error-message="errorMessage" :results="results" @select="handleSelect" @retry="submitSearch" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { Search } from "@element-plus/icons-vue";

import { useOntologyGlobalSearch } from "@/composables/ontology/useOntologyGlobalSearch";
import type { OntologyGlobalSearchItem } from "@/types";

import OntologyGlobalSearchResultList from "./OntologyGlobalSearchResultList.vue";

const props = withDefaults(
  defineProps<{
    placement?: "overlay" | "page";
    placeholder?: string;
    ariaLabel?: string;
  }>(),
  {
    placement: "page",
    placeholder: "检索空间、对象、实例、属性...",
    ariaLabel: "全文检索",
  },
);

const { keyword, results, status, errorMessage, searchOntologyGlobal, clearOntologyGlobalSearch, openOntologyGlobalSearchItem } = useOntologyGlobalSearch();

const rootRef = ref<HTMLElement | null>(null);
const overlayVisible = ref(false);
const hasResultPanel = computed(() => status.value !== "idle");

/**
 * @description 提交当前关键词检索；浮层模式下打开结果面板。
 */
async function submitSearch(): Promise<void> {
  await searchOntologyGlobal();
  if (props.placement === "overlay") {
    overlayVisible.value = keyword.value.trim().length > 0;
  }
}

/**
 * @description 清空检索并关闭浮层。
 */
function handleClear(): void {
  clearOntologyGlobalSearch();
  overlayVisible.value = false;
}

/**
 * @description 已有结果或错误态时，聚焦输入框重新展开浮层。
 */
function openOverlayIfHasState(): void {
  if (props.placement === "overlay" && hasResultPanel.value) {
    overlayVisible.value = true;
  }
}

/**
 * @description 选中结果项并尝试路由跳转；成功后关闭浮层。
 * @param item 选中条目。
 */
async function handleSelect(item: OntologyGlobalSearchItem): Promise<void> {
  const navigated = await openOntologyGlobalSearchItem(item);
  if (navigated && props.placement === "overlay") {
    overlayVisible.value = false;
  }
}

/**
 * @description 点击组件外部时关闭 Header 浮层。
 * @param event 鼠标事件。
 */
function handleDocumentPointerDown(event: MouseEvent): void {
  if (props.placement !== "overlay" || !overlayVisible.value) {
    return;
  }
  const root = rootRef.value;
  const target = event.target;
  if (!(target instanceof Node) || !root) {
    return;
  }
  if (!root.contains(target)) {
    overlayVisible.value = false;
  }
}

watch(status, (next) => {
  if (props.placement === "overlay" && next !== "idle" && keyword.value.trim()) {
    overlayVisible.value = true;
  }
});

onMounted(() => {
  document.addEventListener("pointerdown", handleDocumentPointerDown);
});

onUnmounted(() => {
  document.removeEventListener("pointerdown", handleDocumentPointerDown);
});
</script>

<style scoped lang="scss">
.ontology-global-search {
  position: relative;
  min-width: 0;
  width: 100%;
}

.ontology-global-search--page {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.ontology-global-search--page .ontology-global-search__input {
  width: min(640px, 100%);
}

.ontology-global-search--overlay .ontology-global-search__input {
  width: 100%;
}

.ontology-global-search__dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 30;
  width: 100%;
  min-width: 320px;
  max-height: 360px;
  overflow: auto;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-panel-background);
  box-shadow: var(--el-box-shadow-light);
}

.ontology-global-search__panel--page {
  width: min(720px, 100%);
  min-height: 120px;
  padding: 8px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 8px;
  background: var(--aircas-color-panel-background-deep);
}

.ontology-global-search__panel {
  max-height: 480px;
  overflow: auto;
}
</style>
