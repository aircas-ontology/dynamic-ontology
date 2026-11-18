<template>
  <section class="entity-detail-behaviors" aria-label="所属对象行为">
    <header class="entity-detail-behaviors__heading">
      <h2>
        对象行为 <span>{{ total }} 项</span>
      </h2>
      <p>实体所属对象的行为</p>
    </header>
    <div v-if="status === 'loading'" class="entity-detail-behaviors__state" role="status"><AircasLoading>正在加载对象行为…</AircasLoading></div>
    <div v-else-if="status === 'error'" class="entity-detail-behaviors__state" role="alert">
      <p>{{ error }}</p>
      <el-button @click="emit('retry')">重试</el-button>
    </div>
    <el-empty v-else-if="!items.length" description="当前对象暂无行为" :image-size="64" />
    <div v-else class="entity-detail-behaviors__grid">
      <article v-for="item in items" :key="item.id" class="entity-detail-behavior-card">
        <header class="entity-detail-behavior-card__header">
          <span class="entity-detail-behavior-card__icon" aria-hidden="true"
            ><el-icon><Operation /></el-icon
          ></span>
          <h3 :title="item.displayName">{{ item.displayName || item.actionApi }}</h3>
          <el-tag size="small" type="info" effect="light">{{ formatActionKind(item.actionKind) }}</el-tag>
        </header>
        <p class="entity-detail-behavior-card__description" :title="item.description">{{ item.description || "暂无描述" }}</p>
        <div class="entity-detail-behavior-card__body">
          <dl class="entity-detail-behavior-card__meta">
            <div>
              <dt>行为 API</dt>
              <dd :title="item.actionApi">{{ item.actionApi }}</dd>
            </div>
            <div>
              <dt>挂载函数</dt>
              <dd :title="item.functionApi || ''">{{ item.functionApi || "—" }}</dd>
            </div>
            <div>
              <dt>更新时间</dt>
              <dd :title="item.updateTime || ''">{{ item.updateTime || "—" }}</dd>
            </div>
          </dl>
          <el-button class="entity-detail-behavior-card__execute" type="primary" size="small" @click="emit('execute', item)">执行</el-button>
        </div>
      </article>
    </div>
    <footer v-if="status !== 'error' && total > pageSize" class="entity-detail-behaviors__pager">
      <el-pagination
        background
        layout="total, prev, pager, next"
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        @current-change="emit('page-change', $event)"
      />
    </footer>
  </section>
</template>

<script setup lang="ts">
import { Operation } from "@element-plus/icons-vue";
import type { ListOntologyActionRecord } from "@/types";
import AircasLoading from "@/components/AircasLoading.vue";
defineProps<{
  items: ListOntologyActionRecord[];
  status: "loading" | "ready" | "empty" | "error";
  error: string;
  page: number;
  pageSize: number;
  total: number;
}>();
const actionKindLabels: Record<string, string> = { BASE: "基础行为", APPLICATION: "应用行为", TREE: "行为树" };
const emit = defineEmits<{ retry: []; "page-change": [page: number]; execute: [behavior: ListOntologyActionRecord] }>();
/** @description 将接口行为类别转换为与空间行为一致的文案。 @param kind 行为类别。 @returns 展示标签。 */
function formatActionKind(kind: string): string {
  return actionKindLabels[kind] || kind || "行为";
}
</script>

<style scoped lang="scss">
.entity-detail-behaviors {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  padding: 16px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-panel-background);
}
.entity-detail-behaviors__heading {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.entity-detail-behaviors__heading h2 {
  margin: 0;
  font-size: 16px;
}
.entity-detail-behaviors__heading h2 span {
  margin-left: 8px;
  font-size: 12px;
  color: var(--aircas-color-text-secondary);
  font-weight: 400;
}
.entity-detail-behaviors__heading p {
  margin: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.entity-detail-behaviors__grid {
  display: grid;
  flex: 1;
  min-height: 0;
  overflow: auto;
  align-content: start;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.entity-detail-behavior-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 5px;
  background: var(--aircas-color-card-background);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}
.entity-detail-behavior-card:hover {
  border-color: var(--aircas-color-border-highlight);
  box-shadow: 0 0 14px var(--aircas-color-effect-primary-shadow);
}
.entity-detail-behavior-card__header {
  display: grid;
  min-width: 0;
  grid-template-columns: 30px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-height: 50px;
  padding: 8px;
  border-bottom: 1px solid var(--aircas-color-border-light);
}
.entity-detail-behavior-card__icon {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 1px solid var(--aircas-color-effect-purple-border);
  border-radius: 50%;
  color: var(--aircas-color-accent-purple);
  background: var(--aircas-color-effect-purple-soft);
}
.entity-detail-behavior-card__header h3 {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.entity-detail-behavior-card__description {
  height: 40px;
  margin: 12px;
  overflow: hidden;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  line-height: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.entity-detail-behavior-card__body {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-top: auto;
  padding-right: 12px;
}
.entity-detail-behavior-card__execute {
  flex-shrink: 0;
  margin-bottom: 12px;
}
.entity-detail-behavior-card__meta {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px;
}
.entity-detail-behavior-card__meta > div {
  display: grid;
  grid-template-columns: 60px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  font-size: 12px;
}
.entity-detail-behavior-card__meta dt {
  color: var(--aircas-color-text-secondary);
}
.entity-detail-behavior-card__meta dd {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.entity-detail-behaviors__state {
  flex: 1;
  display: flex;
  min-height: 160px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.entity-detail-behaviors__pager {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
  overflow-x: auto;
}
@media (max-width: 1400px) {
  .entity-detail-behaviors__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 1100px) {
  .entity-detail-behaviors__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .entity-detail-behaviors__grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .entity-detail-behaviors__heading {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
