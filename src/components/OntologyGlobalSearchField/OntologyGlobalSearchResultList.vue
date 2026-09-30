<template>
  <div class="ontology-global-search-results">
    <div v-if="status === 'idle'" class="ontology-global-search-results__hint">输入关键词后回车检索</div>
    <div v-else-if="status === 'loading'" class="ontology-global-search-results__state" role="status">
      <AircasLoading>正在检索…</AircasLoading>
    </div>
    <div v-else-if="status === 'error'" class="ontology-global-search-results__state ontology-global-search-results__state--error" role="alert">
      <span>{{ errorMessage || "检索失败" }}</span>
      <el-button class="aircas-button" size="small" @click="emit('retry')">重试</el-button>
    </div>
    <el-empty v-else-if="status === 'empty'" description="未找到相关结果" :image-size="64" />
    <ul v-else class="ontology-global-search-results__list">
      <li v-for="(item, index) in results" :key="`${item.type}-${item.name}-${item.spaceId ?? index}`">
        <button type="button" class="ontology-global-search-results__item" @click="emit('select', item)">
          <div class="ontology-global-search-results__row">
            <strong class="ontology-global-search-results__name">{{ item.name }}</strong>
            <el-tag size="small" effect="plain">{{ item.type }}</el-tag>
          </div>
          <p class="ontology-global-search-results__desc">{{ item.desc?.trim() || "" }}</p>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import AircasLoading from "@/components/AircasLoading.vue";
import type { OntologyGlobalSearchStatus } from "@/composables/ontology/useOntologyGlobalSearch";
import type { OntologyGlobalSearchItem } from "@/types";

defineProps<{
  status: OntologyGlobalSearchStatus;
  errorMessage: string;
  results: OntologyGlobalSearchItem[];
}>();

const emit = defineEmits<{
  select: [item: OntologyGlobalSearchItem];
  retry: [];
}>();
</script>

<style scoped lang="scss">
.ontology-global-search-results__hint,
.ontology-global-search-results__state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 72px;
  padding: 12px;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
}

.ontology-global-search-results__state--error {
  color: var(--aircas-color-danger);
}

.ontology-global-search-results__list {
  margin: 0;
  padding: 4px 0;
  list-style: none;
}

.ontology-global-search-results__item {
  display: block;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.ontology-global-search-results__item:hover,
.ontology-global-search-results__item:focus-visible {
  background: var(--aircas-color-hover-background);
  outline: none;
}

.ontology-global-search-results__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ontology-global-search-results__name {
  overflow: hidden;
  color: var(--aircas-color-text-primary);
  font-size: 14px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ontology-global-search-results__desc {
  margin: 6px 0 0;
  min-height: 18px;
  overflow: hidden;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
