<template>
  <section class="space-list" aria-label="本体空间列表">
    <el-empty v-if="!spaces.length" class="aircas-empty" description="暂无本体空间，请创建空间或调整搜索条件" />
    <el-table v-else-if="viewMode === 'table'" class="aircas-table aircas-table--flat space-list__table" height="100%" :data="spaces" stripe row-key="id">
      <el-table-column label="空间名称" min-width="280">
        <template #default="{ row }">
          <div class="space-list__name">
            <img v-if="spaceRow(row).iconUrl" :src="spaceRow(row).iconUrl" alt="" />
            <el-icon v-else :size="32"><Box /></el-icon>
            <div><strong>{{ spaceRow(row).displayName }}</strong><small>{{ spaceRow(row).apiName }}</small></div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
      <el-table-column prop="createdAt" label="创建时间" width="160" />
      <el-table-column label="创建用户" width="140">
        <template #default="{ row }">
          <span class="space-list__user">
            <span class="space-list__avatar"><el-icon :size="20"><UserFilled /></el-icon></span>
            {{ spaceRow(row).createdBy }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" width="160" />
      <el-table-column label="操作" width="230" fixed="right">
        <template #default="{ row }"><SpaceActions :space="spaceRow(row)" @action="forward" /></template>
      </el-table-column>
    </el-table>
    <div v-else class="space-cards">
      <article v-for="space in spaces" :key="space.id" class="space-card">
        <header class="space-list__name">
          <img v-if="space.iconUrl" :src="space.iconUrl" alt="" />
          <el-icon v-else :size="32"><Box /></el-icon>
          <div><strong>{{ space.displayName }}</strong><small>{{ space.apiName }}</small></div>
        </header>
        <p class="space-card__description">{{ space.description || "暂无描述" }}</p>
        <dl><div><dt>对象</dt><dd>{{ space.metrics.ontology }}</dd></div><div><dt>行为</dt><dd>{{ space.metrics.behavior }}</dd></div><div><dt>关系</dt><dd>{{ space.metrics.relation }}</dd></div><div><dt>规则</dt><dd>{{ space.metrics.rule }}</dd></div></dl>
        <p class="space-card__meta">创建：{{ space.createdAt }} · {{ space.createdBy }}</p>
        <p class="space-card__meta">更新：{{ space.updatedAt }}</p>
        <SpaceActions :space="space" @action="forward" />
      </article>
    </div>
    <footer v-if="total" class="space-list__pagination">
      <span>共 {{ total }} 条</span>
      <el-pagination class="aircas-pagination" popper-class="aircas-pagination-popper" background layout="prev, pager, next, sizes" :total="total" :page-sizes="[5, 10, 20]" :current-page="page" :page-size="pageSize" @update:current-page="$emit('update:page', $event)" @update:page-size="$emit('update:pageSize', $event)" />
    </footer>
  </section>
</template>
<script setup lang="ts">
import { Box, UserFilled } from "@element-plus/icons-vue";
import type { OntologySpaceItem, OntologyViewMode } from "@/types";
import SpaceActions from "./SpaceActions.vue";
const props = defineProps<{ spaces: OntologySpaceItem[]; viewMode: OntologyViewMode; total: number; page: number; pageSize: number }>();
const emit = defineEmits<{ action: [action: string, space: OntologySpaceItem]; "update:page": [value: number]; "update:pageSize": [value: number] }>();
function spaceRow(row: unknown): OntologySpaceItem {
  if (row && typeof row === "object" && "id" in row) {
    const space = props.spaces.find(item => item.id === row.id);
    if (space) return space;
  }
  throw new Error("无效的空间数据行。");
}
function forward(action: string, space: OntologySpaceItem) { emit("action", action, space); }
</script>
<style scoped lang="scss">
.space-list { display: flex; flex-direction: column; min-width: 0; min-height: 400px; flex: 1; }
.space-list__table { --aircas-table-cell-padding: 20px 0; flex: 1; min-height: 320px; }
.space-list__user { display: flex; align-items: center; gap: 8px; }
.space-list__avatar { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; color: var(--aircas-color-accent-cyan); background: var(--aircas-color-accent-cyan-fill); }
.space-list__name { display: flex; gap: 12px; align-items: center; min-width: 0; }
.space-list__name img { width: 48px; height: 48px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
.space-list__name div { min-width: 0; }
.space-list__name strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 16px; }
.space-list__name small { display: block; margin-top: 4px; font-size: 14px; color: var(--aircas-color-text-muted); overflow-wrap: anywhere; }
.space-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap: 16px; padding-bottom: 16px; }
.space-card { display: flex; flex-direction: column; gap: 16px; padding: 16px; border: 1px solid var(--aircas-color-border); border-radius: 8px; background: var(--aircas-color-card-background); min-width: 0; }
.space-card__description { color: var(--aircas-color-text-secondary); font-size: 14px; overflow-wrap: anywhere; }
dl { display: grid; grid-template-columns: repeat(4, 1fr); text-align: center; gap: 8px; }
dt { font-size: 12px; color: var(--aircas-color-text-muted); }
dd { margin-top: 8px; color: var(--aircas-color-accent-cyan); font-weight: 700; }
.space-card__meta { font-size: 12px; color: var(--aircas-color-text-muted); }
.space-list__pagination { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; padding-top: 16px; padding-bottom: 4px; margin-top: auto; font-size: 12px; color: var(--aircas-color-text-secondary); }
.space-list__pagination .aircas-pagination { max-width: 100%; flex-wrap: wrap; row-gap: 8px; }
</style>
