<template>
  <section class="behavior-instance-panel" aria-label="对象行为列表">
    <header class="behavior-instance-panel__header">
      <div class="behavior-instance-panel__heading">
        <h2>{{ categoryName }}</h2>
        <p>空间内对象行为 · {{ total }} 条</p>
      </div>
      <div class="behavior-instance-panel__filters" aria-label="对象行为筛选条件">
        <el-input
          class="behavior-instance-panel__search"
          :model-value="keyword"
          clearable
          placeholder="按行为名称搜索"
          ariaLabel="按行为名称搜索"
          size="small"
          @update:model-value="emit('update:keyword', String($event ?? ''))"
        >
          <template #prefix>
            <i class="fa fa-search" aria-hidden="true"></i>
          </template>
        </el-input>
        <el-select
          class="behavior-instance-panel__select"
          :model-value="kindFilter || undefined"
          clearable
          placeholder="行为类别"
          ariaLabel="按行为类别筛选"
          size="small"
          @update:model-value="emit('update:kindFilter', ($event as SpaceBehaviorKind | undefined) ?? '')"
        >
          <el-option v-for="item in SPACE_BEHAVIOR_KIND_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-button size="small" @click="emit('query')">查询</el-button>
        <el-button size="small" @click="emit('reset')">重置</el-button>
      </div>
    </header>

    <div v-if="status === 'loading'" class="behavior-instance-panel__state" role="status">
      <AircasLoading>正在加载对象行为…</AircasLoading>
    </div>
    <div v-else-if="status === 'error'" class="behavior-instance-panel__state" role="alert">
      <p>{{ error || "对象行为加载失败" }}</p>
      <el-button @click="emit('retry')">重试</el-button>
    </div>
    <template v-else>
      <el-scrollbar class="behavior-instance-panel__scrollbar">
        <div v-if="items.length" class="behavior-instance-panel__grid">
          <article
            v-for="item in items"
            :key="item.id"
            class="behavior-instance-card"
            role="button"
            tabindex="0"
            @click="emit('detail', item)"
            @keydown.enter.prevent="emit('detail', item)"
            @keydown.space.prevent="emit('detail', item)"
          >
            <header class="behavior-instance-card__header">
              <h3 :title="item.displayName">{{ item.displayName }}</h3>
              <el-tag size="small" type="info" effect="plain">{{ SPACE_BEHAVIOR_KIND_LABELS[item.kind] }}</el-tag>
            </header>
            <p class="behavior-instance-card__description" :title="item.description">{{ item.description || "暂无描述" }}</p>
            <dl class="behavior-instance-card__meta">
              <div>
                <dt>行为 API</dt>
                <dd :title="item.behaviorApiName">{{ item.behaviorApiName || "—" }}</dd>
              </div>
              <div>
                <dt>挂载函数</dt>
                <dd :title="item.functionOperatorName">{{ item.functionOperatorName || "—" }}</dd>
              </div>
            </dl>
            <div class="behavior-instance-card__footer-row">
              <div class="behavior-instance-card__updated">
                <span class="behavior-instance-card__updated-label">更新时间</span>
                <span class="behavior-instance-card__updated-value" :title="item.updatedAt || ''">{{ item.updatedAt || "—" }}</span>
              </div>
              <el-button type="primary" size="small" @click.stop="emit('detail', item)">详情</el-button>
            </div>
          </article>
        </div>
        <el-empty v-else description="当前筛选条件下暂无对象行为" />
      </el-scrollbar>
      <footer v-if="total > 0" class="behavior-instance-panel__pager">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :current-page="page"
          :page-size="pageSize"
          :total="total"
          :page-sizes="[12, 24, 48]"
          @current-change="emit('page-change', $event)"
          @size-change="emit('page-size-change', $event)"
        />
      </footer>
    </template>
  </section>
</template>

<script setup lang="ts">
import AircasLoading from "@/components/AircasLoading.vue";
import type { SpaceBehaviorItem, SpaceBehaviorKind, SpaceBehaviorWorkspaceLoadStatus } from "@/types";
import { SPACE_BEHAVIOR_KIND_LABELS, SPACE_BEHAVIOR_KIND_OPTIONS } from "@/types";

defineProps<{
  categoryName: string;
  items: SpaceBehaviorItem[];
  total: number;
  page: number;
  pageSize: number;
  keyword: string;
  kindFilter: SpaceBehaviorKind | "";
  status: SpaceBehaviorWorkspaceLoadStatus;
  error: string;
}>();

const emit = defineEmits<{
  "update:keyword": [value: string];
  "update:kindFilter": [value: SpaceBehaviorKind | ""];
  query: [];
  reset: [];
  retry: [];
  detail: [item: SpaceBehaviorItem];
  "page-change": [page: number];
  "page-size-change": [pageSize: number];
}>();
</script>

<style scoped lang="scss">
.behavior-instance-panel {
  display: grid;
  min-width: 0;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 6px;
  background: var(--aircas-color-panel-background-deep);
  box-shadow: inset 0 0 28px var(--aircas-color-effect-primary-shadow);
}

.behavior-instance-panel__header {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--aircas-color-border-light);
  background: var(--aircas-color-section-header);
}

.behavior-instance-panel__heading {
  min-width: 160px;

  h2,
  p {
    margin: 0;
  }

  h2 {
    color: var(--aircas-color-text-primary);
    font-size: 16px;
    font-weight: 600;
  }

  p {
    color: var(--aircas-color-text-secondary);
    font-size: 12px;
  }
}

.behavior-instance-panel__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.behavior-instance-panel__search {
  width: 200px;
}

.behavior-instance-panel__select {
  width: 140px;
}

.behavior-instance-panel__state {
  display: grid;
  place-items: center;
  gap: 12px;
  min-height: 180px;
  color: var(--aircas-color-text-secondary);
}

.behavior-instance-panel__scrollbar {
  min-height: 0;
}

.behavior-instance-panel__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 10px;
  padding: 10px;
}

.behavior-instance-card {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 6px;
  background: var(--aircas-color-panel-background);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.behavior-instance-card:hover,
.behavior-instance-card:focus-visible {
  border-color: var(--aircas-color-border-highlight);
  box-shadow: 0 0 14px var(--aircas-color-effect-primary-shadow);
  outline: none;
}

.behavior-instance-card__header {
  display: flex;
  align-items: center;
  gap: 8px;

  h3 {
    flex: 1;
    min-width: 0;
    margin: 0;
    overflow: hidden;
    color: var(--aircas-color-text-primary);
    font-size: 15px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.behavior-instance-card__description {
  margin: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
  line-height: 1.5;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.behavior-instance-card__meta {
  display: grid;
  gap: 6px;
  margin: 0;

  div {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 8px;
  }

  dt {
    color: var(--aircas-color-text-secondary);
    font-size: 12px;
  }

  dd {
    margin: 0;
    overflow: hidden;
    color: var(--aircas-color-text-primary);
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.behavior-instance-card__footer-row {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.behavior-instance-card__updated {
  display: grid;
  min-width: 0;
  flex: 1;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
}

.behavior-instance-card__updated-label {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.behavior-instance-card__updated-value {
  min-width: 0;
  overflow: hidden;
  color: var(--aircas-color-text-primary);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.behavior-instance-panel__pager {
  display: flex;
  justify-content: flex-end;
  padding: 8px 10px;
  border-top: 1px solid var(--aircas-color-border-light);
}
</style>
